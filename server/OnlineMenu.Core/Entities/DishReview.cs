namespace OnlineMenu.Core.Entities;

public class DishReview : BaseEntity
{
    public int DishId { get; set; }
    public Dish Dish { get; set; } = null!;
    public string GuestName { get; set; } = string.Empty;
    public int TableNumber { get; set; }
    public int Rating { get; set; } // 1-5
    public string? Comment { get; set; }
}
