using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace OnlineMenu.API.Hubs;

/// <summary>
/// Hub cho chatbot Phase 2:
///  - Anon user: join group "chat-{token}" de nhan reply tu staff khi escalate.
///  - Staff (Manager/Employee): join group "staff-chats" de nhan thong bao co escalation moi.
/// </summary>
public class ChatHub : Hub
{
    public const string StaffGroup = "staff-chats";

    // Anon user join group cua session minh bang token. Khong can auth.
    public async Task JoinChatSession(string token)
    {
        if (Guid.TryParse(token, out _))
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"chat-{token}");
        }
    }

    public async Task LeaveChatSession(string token)
    {
        if (Guid.TryParse(token, out _))
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"chat-{token}");
        }
    }

    // Staff join group nhan thong bao escalation. Yeu cau [Authorize].
    [Authorize(Roles = "Manager,Employee")]
    public async Task JoinStaffChats()
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, StaffGroup);
    }

    [Authorize(Roles = "Manager,Employee")]
    public async Task LeaveStaffChats()
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, StaffGroup);
    }

    public static string SessionGroup(Guid token) => $"chat-{token}";
}
