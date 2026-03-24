namespace OnlineMenu.Core.Entities;

public class Category : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }

    // Navigation
    public ICollection<Dish> Dishes { get; set; } = new List<Dish>();
}
