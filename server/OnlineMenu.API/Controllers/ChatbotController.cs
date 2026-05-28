using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using OnlineMenu.API.Hubs;
using OnlineMenu.Application.DTOs;
using OnlineMenu.Core.Interfaces.Services;

namespace OnlineMenu.API.Controllers;

[ApiController]
[Route("api/chatbot")]
public class ChatbotController : ControllerBase
{
    private readonly IChatbotService _chatbot;
    private readonly IHubContext<ChatHub> _hub;

    public ChatbotController(IChatbotService chatbot, IHubContext<ChatHub> hub)
    {
        _chatbot = chatbot;
        _hub = hub;
    }

    // ============== Anon (no auth required) ==============

    public record MessageRequestDto(string Message, Guid? SessionToken);

    /// <summary>
    /// Anon. Gui message → tao session neu chua co, return session token + bot reply.
    /// </summary>
    [HttpPost("message")]
    public async Task<IActionResult> Send([FromBody] MessageRequestDto request, CancellationToken ct)
    {
        if (request == null || string.IsNullOrWhiteSpace(request.Message))
            return BadRequest(ApiResponse<object>.Fail("Tin nhắn không được rỗng."));
        if (request.Message.Length > 1000)
            return BadRequest(ApiResponse<object>.Fail("Tin nhắn quá dài (tối đa 1000 ký tự)."));

        ChatReplyResult result;
        try
        {
            result = await _chatbot.ReplyAsync(request.Message, request.SessionToken, ct);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<object>.Fail(ex.Message));
        }

        // Neu staff da join → push user message tu user den staff vao chat-{token} group
        if (result.Status == "StaffJoined")
        {
            await _hub.Clients.Group(ChatHub.SessionGroup(result.SessionToken))
                .SendAsync("NewMessage", result.UserMessage, ct);
        }

        return Ok(ApiResponse<ChatReplyResult>.Success(result));
    }

    /// <summary>
    /// Anon. Lay lai session bang token (restore sau F5).
    /// Token = UUID khong doan duoc → bao mat ngang voi cookie session.
    /// </summary>
    [HttpGet("sessions/{token:guid}")]
    public async Task<IActionResult> GetByToken(Guid token, CancellationToken ct)
    {
        var detail = await _chatbot.GetSessionDetailByTokenAsync(token, ct);
        if (detail == null)
            return NotFound(ApiResponse<object>.Fail("Phiên không tồn tại."));
        return Ok(ApiResponse<ChatSessionDetail>.Success(detail));
    }

    /// <summary>
    /// Anon. Yeu cau gap nhan vien that. Notify staff group qua SignalR.
    /// </summary>
    [HttpPost("sessions/{token:guid}/escalate")]
    public async Task<IActionResult> Escalate(Guid token, CancellationToken ct)
    {
        var ok = await _chatbot.EscalateAsync(token, ct);
        if (!ok) return NotFound(ApiResponse<object>.Fail("Session không tồn tại hoặc đã đóng."));

        var detail = await _chatbot.GetSessionDetailByTokenAsync(token, ct);
        if (detail != null)
        {
            await _hub.Clients.Group(ChatHub.StaffGroup)
                .SendAsync("ChatEscalated", new
                {
                    sessionId = detail.Id,
                    token = detail.Token.ToString(),
                    lastUserMessage = detail.Messages.LastOrDefault(m => m.Role == "User")?.Content,
                    escalatedAt = detail.EscalatedAt,
                }, ct);

            await _hub.Clients.Group(ChatHub.SessionGroup(token))
                .SendAsync("StatusChanged", new { status = "WaitingStaff" }, ct);
        }

        return Ok(ApiResponse<object>.Success(null!, "Đã chuyển yêu cầu tới nhân viên"));
    }

    // ============== Staff (auth required) ==============

    [HttpGet("staff/sessions")]
    [Authorize(Roles = "Manager,Employee")]
    public async Task<IActionResult> ListStaffSessions(CancellationToken ct)
    {
        var sessions = await _chatbot.ListStaffSessionsAsync(ct);
        return Ok(ApiResponse<IReadOnlyList<ChatSessionSummary>>.Success(sessions));
    }

    [HttpGet("staff/sessions/{id:int}")]
    [Authorize(Roles = "Manager,Employee")]
    public async Task<IActionResult> GetSession(int id, CancellationToken ct)
    {
        var detail = await _chatbot.GetSessionDetailAsync(id, ct);
        if (detail == null) return NotFound(ApiResponse<object>.Fail("Session không tồn tại."));
        return Ok(ApiResponse<ChatSessionDetail>.Success(detail));
    }

    public record StaffReplyDto(string Content);

    [HttpPost("staff/sessions/{id:int}/reply")]
    [Authorize(Roles = "Manager,Employee")]
    public async Task<IActionResult> StaffReply(int id, [FromBody] StaffReplyDto body, CancellationToken ct)
    {
        if (body == null || string.IsNullOrWhiteSpace(body.Content))
            return BadRequest(ApiResponse<object>.Fail("Nội dung không được rỗng."));

        var staffIdClaim = User.FindFirst("userId")?.Value;
        if (!int.TryParse(staffIdClaim, out var staffId))
            return Unauthorized();

        var ok = await _chatbot.StaffReplyAsync(id, staffId, body.Content, ct);
        if (!ok) return NotFound(ApiResponse<object>.Fail("Session không tồn tại hoặc đã đóng."));

        var detail = await _chatbot.GetSessionDetailAsync(id, ct);
        var lastStaffMsg = detail?.Messages.LastOrDefault(m => m.Role == "Staff");

        // Push staff reply toi user
        if (detail != null && lastStaffMsg != null)
        {
            await _hub.Clients.Group(ChatHub.SessionGroup(detail.Token))
                .SendAsync("NewMessage", lastStaffMsg, ct);
            await _hub.Clients.Group(ChatHub.SessionGroup(detail.Token))
                .SendAsync("StatusChanged", new { status = detail.Status, assignedStaffName = detail.AssignedStaffName }, ct);
        }

        return Ok(ApiResponse<ChatMessageDto?>.Success(lastStaffMsg));
    }

    [HttpPost("staff/sessions/{id:int}/close")]
    [Authorize(Roles = "Manager,Employee")]
    public async Task<IActionResult> CloseSession(int id, CancellationToken ct)
    {
        var detail = await _chatbot.GetSessionDetailAsync(id, ct);
        if (detail == null) return NotFound(ApiResponse<object>.Fail("Session không tồn tại."));

        var ok = await _chatbot.CloseSessionAsync(id, ct);
        if (!ok) return BadRequest(ApiResponse<object>.Fail("Không thể đóng session."));

        await _hub.Clients.Group(ChatHub.SessionGroup(detail.Token))
            .SendAsync("StatusChanged", new { status = "Closed" }, ct);
        await _hub.Clients.Group(ChatHub.StaffGroup)
            .SendAsync("SessionRemoved", new { sessionId = id }, ct);

        return Ok(ApiResponse<object>.Success(null!, "Đã đóng phiên"));
    }

}
