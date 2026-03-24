using OnlineMenu.Core.Enums;

namespace OnlineMenu.Core.Entities;

public class Order : BaseEntity
{
    public int TableNumber { get; set; }
    public string? GuestName { get; set; }
    public OrderStatus Status { get; set; } = OrderStatus.Pending;
    public decimal TotalPrice { get; set; }

    public int? TableId { get; set; }
    public Table? Table { get; set; }

    public int? ProcessedById { get; set; }
    public Account? ProcessedBy { get; set; }

    // Navigation
    public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
}
