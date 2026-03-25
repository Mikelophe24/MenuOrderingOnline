using OnlineMenu.Core.Enums;

namespace OnlineMenu.Core.Entities;

public class Dish : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public string Description { get; set; } = string.Empty;
    public string Image { get; set; } = string.Empty;
    public DishStatus Status { get; set; } = DishStatus.Available;

    // Nutrition info (optional)
    public int? Calories { get; set; }
    public int? Protein { get; set; }
    public int? Carbs { get; set; }

    public int CategoryId { get; set; }
    public Category Category { get; set; } = null!;

    // Navigation
    public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
    public ICollection<DishIngredient> DishIngredients { get; set; } = new List<DishIngredient>();
}
