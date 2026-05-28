using OnlineMenu.Core.Enums;

namespace OnlineMenu.Core.Entities;

public class ChatSession : BaseEntity
{
    // Token bi mat ma anon user dung de identify session cua minh.
    // Staff dung Id (int) qua endpoint co [Authorize].
    public Guid Token { get; set; } = Guid.NewGuid();

    public ChatSessionStatus Status { get; set; } = ChatSessionStatus.Active;

    public int? AssignedStaffId { get; set; }
    public Account? AssignedStaff { get; set; }

    public DateTime? EscalatedAt { get; set; }
    public DateTime? ClosedAt { get; set; }
    public DateTime LastActivityAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public ICollection<ChatMessage> Messages { get; set; } = new List<ChatMessage>();
}
