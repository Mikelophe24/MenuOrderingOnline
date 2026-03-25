namespace OnlineMenu.Core.Entities;

public class OrderItem : BaseEntity
{
    public int OrderId { get; set; }
    public Order Order { get; set; } = null!;

    public int DishId { get; set; }
    public Dish Dish { get; set; } = null!;

    // Snapshot at order time - preserved even if dish is edited/deleted later
    public string DishName { get; set; } = string.Empty;
    public decimal DishPrice { get; set; }
    public string? DishImage { get; set; }

    public int Quantity { get; set; }
    public string? Note { get; set; }
}
