using OnlineMenu.Core.Enums;

namespace OnlineMenu.Core.Entities;

public class ChatMessage : BaseEntity
{
    public int SessionId { get; set; }
    public ChatSession Session { get; set; } = null!;

    public ChatMessageRole Role { get; set; }

    public string Content { get; set; } = string.Empty;
}
