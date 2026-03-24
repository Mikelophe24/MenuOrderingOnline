namespace OnlineMenu.Core.Entities;

public class Ingredient : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Unit { get; set; } = string.Empty; // kg, lít, cái, gói...
    public decimal CurrentStock { get; set; }
    public decimal MinStock { get; set; } // Khi stock < minStock => cảnh báo

    public ICollection<DishIngredient> DishIngredients { get; set; } = new List<DishIngredient>();
}

public class DishIngredient : BaseEntity
{
    public int DishId { get; set; }
    public Dish Dish { get; set; } = null!;
    public int IngredientId { get; set; }
    public Ingredient Ingredient { get; set; } = null!;
    public decimal QuantityNeeded { get; set; } // Số lượng nguyên liệu cần cho 1 phần
}
