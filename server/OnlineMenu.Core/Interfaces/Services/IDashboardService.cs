namespace OnlineMenu.Core.Interfaces.Services;

public interface IDashboardService
{
    Task<DashboardData> GetDashboardDataAsync(DateTime? fromDate, DateTime? toDate);
}

public class DashboardData
{
    public decimal TotalRevenue { get; set; }
    public int TotalOrders { get; set; }
    public int TotalGuests { get; set; }
    public List<TopDishItem> TopDishes { get; set; } = new();
    public List<RevenueByDate> RevenueByDate { get; set; } = new();
}

public class TopDishItem
{
    public int DishId { get; set; }
    public string DishName { get; set; } = string.Empty;
    public int OrderCount { get; set; }
}

public class RevenueByDate
{
    public DateTime Date { get; set; }
    public decimal Revenue { get; set; }
}
