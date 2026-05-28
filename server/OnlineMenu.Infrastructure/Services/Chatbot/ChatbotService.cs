using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using OnlineMenu.Core.Entities;
using OnlineMenu.Core.Enums;
using OnlineMenu.Core.Interfaces.Services;
using OnlineMenu.Infrastructure.Data;

namespace OnlineMenu.Infrastructure.Services.Chatbot;

public class ChatbotService : IChatbotService
{
    private const int MaxHistoryTurns = 10; // chi giu 10 luot gan nhat de tiet kiem token

    private static readonly string[] EscalationCues =
    {
        "chuyển anh/chị",
        "chuyển anh chị",
        "gọi nhân viên",
        "nhân viên thật",
        "không có thông tin",
        "không chắc",
        "em không rõ",
    };

    private readonly AppDbContext _db;
    private readonly GroqClient _llm;
    private readonly ChatContextBuilder _contextBuilder;
    private readonly ILogger<ChatbotService> _logger;

    public ChatbotService(
        AppDbContext db,
        GroqClient llm,
        ChatContextBuilder contextBuilder,
        ILogger<ChatbotService> logger)
    {
        _db = db;
        _llm = llm;
        _contextBuilder = contextBuilder;
        _logger = logger;
    }

    // ===================== Anon user =====================

    public async Task<ChatReplyResult> ReplyAsync(string message, Guid? sessionToken, CancellationToken ct = default)
    {
        var trimmed = (message ?? string.Empty).Trim();
        if (string.IsNullOrEmpty(trimmed))
        {
            throw new ArgumentException("Tin nhắn không được rỗng.", nameof(message));
        }

        // Tao session moi neu chua co token (hoac token khong ton tai)
        var session = sessionToken.HasValue
            ? await _db.ChatSessions.FirstOrDefaultAsync(s => s.Token == sessionToken.Value, ct)
            : null;

        if (session == null)
        {
            session = new ChatSession
            {
                Token = Guid.NewGuid(),
                Status = ChatSessionStatus.Active,
                LastActivityAt = DateTime.UtcNow,
            };
            _db.ChatSessions.Add(session);
            await _db.SaveChangesAsync(ct);
        }

        if (session.Status == ChatSessionStatus.Closed)
        {
            throw new InvalidOperationException("Session đã đóng.");
        }

        // Luu user message
        var userMsg = new ChatMessage
        {
            SessionId = session.Id,
            Role = ChatMessageRole.User,
            Content = trimmed,
        };
        _db.ChatMessages.Add(userMsg);
        session.LastActivityAt = DateTime.UtcNow;
        session.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        var userDto = ToDto(userMsg);

        // Neu staff da join hoac dang waiting → khong goi bot, just save user msg
        if (session.Status != ChatSessionStatus.Active)
        {
            return new ChatReplyResult(
                SessionToken: session.Token,
                Status: session.Status.ToString(),
                Reply: null,
                SuggestEscalate: false,
                UserMessage: userDto,
                BotMessage: null);
        }

        // Goi LLM
        if (!_llm.IsConfigured)
        {
            _logger.LogWarning("LLM chua co API key.");
            var fb = await SaveBotMessageAsync(session, "Hiện hệ thống chatbot đang bảo trì ạ. Anh/chị bấm \"Gọi nhân viên thật\" để được hỗ trợ trực tiếp nhé.", ct);
            return new ChatReplyResult(session.Token, session.Status.ToString(), fb.Content, true, userDto, ToDto(fb));
        }

        var history = await LoadHistoryForLlmAsync(session.Id, beforeMessageId: userMsg.Id, ct);
        var systemPrompt = await _contextBuilder.BuildSystemPromptAsync(ct);

        string? reply;
        try
        {
            reply = await _llm.GenerateAsync(systemPrompt, history, trimmed, ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Loi LLM cho cau hoi: {Msg}", trimmed);
            var err = await SaveBotMessageAsync(session, "Hiện em gặp sự cố kỹ thuật. Anh/chị bấm \"Gọi nhân viên thật\" để được hỗ trợ trực tiếp nhé.", ct);
            return new ChatReplyResult(session.Token, session.Status.ToString(), err.Content, true, userDto, ToDto(err));
        }

        if (string.IsNullOrWhiteSpace(reply))
        {
            var empty = await SaveBotMessageAsync(session, "Em chưa có câu trả lời phù hợp. Anh/chị bấm \"Gọi nhân viên thật\" để được hỗ trợ ạ.", ct);
            return new ChatReplyResult(session.Token, session.Status.ToString(), empty.Content, true, userDto, ToDto(empty));
        }

        var botMsg = await SaveBotMessageAsync(session, reply, ct);
        var lower = reply.ToLowerInvariant();
        var suggestEscalate = EscalationCues.Any(cue => lower.Contains(cue));

        return new ChatReplyResult(
            SessionToken: session.Token,
            Status: session.Status.ToString(),
            Reply: reply,
            SuggestEscalate: suggestEscalate,
            UserMessage: userDto,
            BotMessage: ToDto(botMsg));
    }

    public async Task<bool> EscalateAsync(Guid sessionToken, CancellationToken ct = default)
    {
        var session = await _db.ChatSessions.FirstOrDefaultAsync(s => s.Token == sessionToken, ct);
        if (session == null) return false;
        if (session.Status == ChatSessionStatus.Closed) return false;
        if (session.Status == ChatSessionStatus.WaitingStaff || session.Status == ChatSessionStatus.StaffJoined)
            return true; // idempotent

        session.Status = ChatSessionStatus.WaitingStaff;
        session.EscalatedAt = DateTime.UtcNow;
        session.LastActivityAt = DateTime.UtcNow;
        session.UpdatedAt = DateTime.UtcNow;

        _db.ChatMessages.Add(new ChatMessage
        {
            SessionId = session.Id,
            Role = ChatMessageRole.System,
            Content = "Khách yêu cầu gặp nhân viên.",
        });

        await _db.SaveChangesAsync(ct);
        return true;
    }

    // ===================== Staff =====================

    public async Task<IReadOnlyList<ChatSessionSummary>> ListStaffSessionsAsync(CancellationToken ct = default)
    {
        var sessions = await _db.ChatSessions
            .AsNoTracking()
            .Include(s => s.AssignedStaff)
            .Where(s => s.Status == ChatSessionStatus.WaitingStaff || s.Status == ChatSessionStatus.StaffJoined)
            .OrderByDescending(s => s.EscalatedAt ?? s.LastActivityAt)
            .ToListAsync(ct);

        if (sessions.Count == 0)
            return Array.Empty<ChatSessionSummary>();

        var sessionIds = sessions.Select(s => s.Id).ToList();
        var lastMsgs = await _db.ChatMessages
            .AsNoTracking()
            .Where(m => sessionIds.Contains(m.SessionId) && m.Role == ChatMessageRole.User)
            .GroupBy(m => m.SessionId)
            .Select(g => g.OrderByDescending(m => m.CreatedAt).FirstOrDefault())
            .ToListAsync(ct);

        return sessions.Select(s =>
        {
            var preview = lastMsgs.FirstOrDefault(m => m != null && m.SessionId == s.Id)?.Content;
            if (preview != null && preview.Length > 120) preview = preview[..117] + "...";
            return new ChatSessionSummary(
                Id: s.Id,
                Token: s.Token,
                Status: s.Status.ToString(),
                LastMessagePreview: preview,
                LastActivityAt: s.LastActivityAt,
                AssignedStaffId: s.AssignedStaffId,
                AssignedStaffName: s.AssignedStaff?.Name);
        }).ToList();
    }

    public Task<ChatSessionDetail?> GetSessionDetailAsync(int sessionId, CancellationToken ct = default)
        => GetSessionDetailInternalAsync(s => s.Id == sessionId, ct);

    public Task<ChatSessionDetail?> GetSessionDetailByTokenAsync(Guid token, CancellationToken ct = default)
        => GetSessionDetailInternalAsync(s => s.Token == token, ct);

    private async Task<ChatSessionDetail?> GetSessionDetailInternalAsync(
        System.Linq.Expressions.Expression<Func<ChatSession, bool>> predicate,
        CancellationToken ct)
    {
        var session = await _db.ChatSessions
            .AsNoTracking()
            .Include(s => s.AssignedStaff)
            .FirstOrDefaultAsync(predicate, ct);
        if (session == null) return null;

        var sid = session.Id;
        var messages = await _db.ChatMessages
            .AsNoTracking()
            .Where(m => m.SessionId == sid)
            .OrderBy(m => m.CreatedAt)
            .Select(m => new ChatMessageDto(m.Id, m.Role.ToString(), m.Content, m.CreatedAt))
            .ToListAsync(ct);

        return new ChatSessionDetail(
            Id: session.Id,
            Token: session.Token,
            Status: session.Status.ToString(),
            AssignedStaffId: session.AssignedStaffId,
            AssignedStaffName: session.AssignedStaff?.Name,
            CreatedAt: session.CreatedAt,
            LastActivityAt: session.LastActivityAt,
            EscalatedAt: session.EscalatedAt,
            ClosedAt: session.ClosedAt,
            Messages: messages);
    }

    public async Task<bool> StaffReplyAsync(int sessionId, int staffId, string content, CancellationToken ct = default)
    {
        var trimmed = (content ?? string.Empty).Trim();
        if (string.IsNullOrEmpty(trimmed)) return false;

        var session = await _db.ChatSessions.FirstOrDefaultAsync(s => s.Id == sessionId, ct);
        if (session == null) return false;
        if (session.Status == ChatSessionStatus.Closed) return false;

        // Auto-promote sang StaffJoined neu chua
        if (session.Status != ChatSessionStatus.StaffJoined)
        {
            session.Status = ChatSessionStatus.StaffJoined;
            session.AssignedStaffId = staffId;
        }

        session.LastActivityAt = DateTime.UtcNow;
        session.UpdatedAt = DateTime.UtcNow;

        _db.ChatMessages.Add(new ChatMessage
        {
            SessionId = session.Id,
            Role = ChatMessageRole.Staff,
            Content = trimmed,
        });

        await _db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<bool> CloseSessionAsync(int sessionId, CancellationToken ct = default)
    {
        var session = await _db.ChatSessions.FirstOrDefaultAsync(s => s.Id == sessionId, ct);
        if (session == null) return false;
        if (session.Status == ChatSessionStatus.Closed) return true;

        session.Status = ChatSessionStatus.Closed;
        session.ClosedAt = DateTime.UtcNow;
        session.UpdatedAt = DateTime.UtcNow;

        _db.ChatMessages.Add(new ChatMessage
        {
            SessionId = session.Id,
            Role = ChatMessageRole.System,
            Content = "Cuộc trò chuyện đã được đóng.",
        });

        await _db.SaveChangesAsync(ct);
        return true;
    }

    // ===================== Helpers =====================

    private async Task<ChatMessage> SaveBotMessageAsync(ChatSession session, string content, CancellationToken ct)
    {
        var msg = new ChatMessage
        {
            SessionId = session.Id,
            Role = ChatMessageRole.Bot,
            Content = content,
        };
        _db.ChatMessages.Add(msg);
        session.LastActivityAt = DateTime.UtcNow;
        session.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return msg;
    }

    private async Task<IReadOnlyList<GroqTurn>> LoadHistoryForLlmAsync(int sessionId, int beforeMessageId, CancellationToken ct)
    {
        // Lay N message gan nhat (truoc user message vua tao), order asc
        var recent = await _db.ChatMessages
            .AsNoTracking()
            .Where(m => m.SessionId == sessionId && m.Id < beforeMessageId)
            .Where(m => m.Role == ChatMessageRole.User || m.Role == ChatMessageRole.Bot)
            .OrderByDescending(m => m.Id)
            .Take(MaxHistoryTurns * 2)
            .ToListAsync(ct);

        recent.Reverse(); // asc theo time

        return recent
            .Select(m => new GroqTurn(
                Role: m.Role == ChatMessageRole.Bot ? "assistant" : "user",
                Text: m.Content))
            .ToList();
    }

    private static ChatMessageDto ToDto(ChatMessage m) =>
        new(m.Id, m.Role.ToString(), m.Content, m.CreatedAt);
}
