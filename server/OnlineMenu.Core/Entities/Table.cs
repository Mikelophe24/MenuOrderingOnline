using OnlineMenu.Core.Enums;

namespace OnlineMenu.Core.Entities;

public class Table : BaseEntity
{
    public int Number { get; set; }
    public int Capacity { get; set; }
    public TableStatus Status { get; set; } = TableStatus.Available;
    public string Token { get; set; } = Guid.NewGuid().ToString();

    // Navigation
    public ICollection<Order> Orders { get; set; } = new List<Order>();
}
