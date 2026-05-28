namespace OnlineMenu.Core.Interfaces.Services;

public interface IChatbotService
{
    /// <summary>
    /// Anon user gui message. Neu sessionToken null thi tao session moi.
    /// Tra ve session info + bot reply (neu chua escalate).
    /// </summary>
    Task<ChatReplyResult> ReplyAsync(string message, Guid? sessionToken, CancellationToken ct = default);

    /// <summary>
    /// Anon user yeu cau escalate sang nhan vien that. Push qua SignalR cho staff.
    /// </summary>
    Task<bool> EscalateAsync(Guid sessionToken, CancellationToken ct = default);

    /// <summary>
    /// Staff lay danh sach session can ho tro (WaitingStaff + StaffJoined).
    /// </summary>
    Task<IReadOnlyList<ChatSessionSummary>> ListStaffSessionsAsync(CancellationToken ct = default);

    /// <summary>
    /// Staff lay full message history cua mot session.
    /// </summary>
    Task<ChatSessionDetail?> GetSessionDetailAsync(int sessionId, CancellationToken ct = default);

    /// <summary>
    /// Lay session detail bang Token (anon-friendly).
    /// </summary>
    Task<ChatSessionDetail?> GetSessionDetailByTokenAsync(Guid token, CancellationToken ct = default);

    /// <summary>
    /// Staff gui reply vao session. Tu dong chuyen status sang StaffJoined neu chua.
    /// </summary>
    Task<bool> StaffReplyAsync(int sessionId, int staffId, string content, CancellationToken ct = default);

    /// <summary>
    /// Staff dong session.
    /// </summary>
    Task<bool> CloseSessionAsync(int sessionId, CancellationToken ct = default);
}

// ===== Data transfer types =====

public record ChatMessageDto(
    int Id,
    string Role,
    string Content,
    DateTime CreatedAt
);

public record ChatReplyResult(
    Guid SessionToken,
    string Status,
    string? Reply,           // null khi staff da join (bot khong tra loi)
    bool SuggestEscalate,
    ChatMessageDto UserMessage,
    ChatMessageDto? BotMessage
);

public record ChatSessionSummary(
    int Id,
    Guid Token,
    string Status,
    string? LastMessagePreview,
    DateTime LastActivityAt,
    int? AssignedStaffId,
    string? AssignedStaffName
);

public record ChatSessionDetail(
    int Id,
    Guid Token,
    string Status,
    int? AssignedStaffId,
    string? AssignedStaffName,
    DateTime CreatedAt,
    DateTime LastActivityAt,
    DateTime? EscalatedAt,
    DateTime? ClosedAt,
    IReadOnlyList<ChatMessageDto> Messages
);
