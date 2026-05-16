using Microsoft.EntityFrameworkCore;
using OnlineMenu.Core.Enums;
using OnlineMenu.Core.Interfaces.Services;
using OnlineMenu.Infrastructure.Data;

namespace OnlineMenu.Infrastructure.Services;

public class DashboardService : IDashboardService
{
    private readonly AppDbContext _context;

    public DashboardService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<DashboardData> GetDashboardDataAsync(DateTime? fromDate, DateTime? toDate)
    {
        var from = fromDate ?? DateTime.Now.AddDays(-30);
        var to = (toDate ?? DateTime.Now.Date).Date.AddDays(1).AddTicks(-1);

        var orders = _context.Orders
            .Where(o => o.CreatedAt >= from && o.CreatedAt <= to && o.Status == OrderStatus.Paid);

        var totalRevenue = await orders.SumAsync(o => o.TotalPrice);
        var totalOrders = await orders.CountAsync();

        var allOrders = _context.Orders
            .Where(o => o.CreatedAt >= from && o.CreatedAt <= to);
        var totalGuests = await allOrders.Select(o => o.TableNumber).Distinct().CountAsync();

        var activeTables = await _context.Tables
            .Where(t => t.Status == TableStatus.Occupied)
            .CountAsync();

        var topDishes = await _context.OrderItems
            .Include(oi => oi.Dish)
            .Where(oi => oi.Order.CreatedAt >= from && oi.Order.CreatedAt <= to && oi.Order.Status == OrderStatus.Paid)
            .GroupBy(oi => new { oi.DishId, oi.Dish.Name })
            .Select(g => new TopDishItem
            {
                DishId = g.Key.DishId,
                DishName = g.Key.Name,
                OrderCount = g.Select(x => x.OrderId).Distinct().Count()
            })
            .OrderByDescending(x => x.OrderCount)
            .Take(10)
            .ToListAsync();

        var revenueByDate = await orders
            .GroupBy(o => o.CreatedAt.Date)
            .Select(g => new RevenueByDate
            {
                Date = g.Key,
                Revenue = g.Sum(o => o.TotalPrice)
            })
            .OrderBy(x => x.Date)
            .ToListAsync();

        var avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        var revenueByCategory = await _context.OrderItems
            .Include(oi => oi.Dish).ThenInclude(d => d.Category)
            .Where(oi => oi.Order.CreatedAt >= from && oi.Order.CreatedAt <= to && oi.Order.Status == OrderStatus.Paid)
            .GroupBy(oi => new { oi.Dish.CategoryId, oi.Dish.Category.Name })
            .Select(g => new RevenueByCategory
            {
                CategoryId = g.Key.CategoryId,
                CategoryName = g.Key.Name,
                Revenue = g.Sum(x => x.DishPrice * x.Quantity)
            })
            .OrderByDescending(x => x.Revenue)
            .ToListAsync();

        return new DashboardData
        {
            TotalRevenue = totalRevenue,
            TotalOrders = totalOrders,
            TotalGuests = totalGuests,
            ActiveTables = activeTables,
            AvgOrderValue = avgOrderValue,
            TopDishes = topDishes,
            RevenueByDate = revenueByDate,
            RevenueByCategory = revenueByCategory,
        };
    }
}
