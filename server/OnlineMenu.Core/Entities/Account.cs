using OnlineMenu.Core.Enums;

namespace OnlineMenu.Core.Entities;

public class Account : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string? Avatar { get; set; }
    public Role Role { get; set; } = Role.Employee;
    public string? RefreshToken { get; set; }
    public DateTime? RefreshTokenExpiryTime { get; set; }

    // Navigation
    public ICollection<Order> ProcessedOrders { get; set; } = new List<Order>();
}
