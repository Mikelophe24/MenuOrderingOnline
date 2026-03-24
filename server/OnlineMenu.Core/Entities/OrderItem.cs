namespace OnlineMenu.Core.Entities;

public class OrderItem : BaseEntity
{
    public int OrderId { get; set; }
    public Order Order { get; set; } = null!;

    public int DishId { get; set; }
    public Dish Dish { get; set; } = null!;

    public int Quantity { get; set; }
    public string? Note { get; set; }
}
