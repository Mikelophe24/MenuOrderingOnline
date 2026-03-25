using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using OnlineMenu.API.Hubs;
using OnlineMenu.Application.DTOs.Orders;
using OnlineMenu.Core.Entities;
using OnlineMenu.Core.Enums;
using OnlineMenu.Core.Interfaces.Repositories;
using OnlineMenu.Infrastructure.Data;

namespace OnlineMenu.API.Extensions;

public static class OrderHelper
{
    public static OrderDto MapToDto(Order order) => new(
        order.Id,
        order.TableNumber,
        order.GuestName,
        order.Status.ToString(),
        order.TotalPrice,
        order.ProcessedBy?.Name,
        order.OrderItems.Select(oi => new OrderItemDto(
            oi.Id, oi.DishId,
            oi.DishName.Length > 0 ? oi.DishName : oi.Dish?.Name ?? string.Empty,
            oi.DishPrice > 0 ? oi.DishPrice : oi.Dish?.Price ?? 0,
            oi.DishImage ?? oi.Dish?.Image,
            oi.Quantity, oi.Note
        )).ToList(),
        order.CreatedAt,
        order.UpdatedAt
    );

    /// <summary>
    /// If a table has no more active orders, sets it back to Available and notifies via SignalR.
    /// </summary>
    public static async Task TryFreeTableAsync(
        int? tableId,
        int excludeOrderId,
        IOrderRepository orderRepo,
        ITableRepository tableRepo,
        IHubContext<OrderHub> hubContext)
    {
        if (!tableId.HasValue) return;

        var hasActiveOrders = await orderRepo.ExistsAsync(o =>
            o.TableId == tableId.Value
            && o.Id != excludeOrderId
            && o.Status != OrderStatus.Paid
            && o.Status != OrderStatus.Cancelled);

        if (hasActiveOrders) return;

        var table = await tableRepo.GetByIdAsync(tableId.Value);
        if (table == null || table.Status != TableStatus.Occupied) return;

        table.Status = TableStatus.Available;
        await tableRepo.UpdateAsync(table);
        await hubContext.Clients.Group("management").SendAsync("TableStatusChanged",
            new { table.Id, table.Number, Status = table.Status.ToString() });
    }

    /// <summary>
    /// Checks all dishes with linked ingredients and auto-hides/shows based on stock levels.
    /// </summary>
    public static async Task CheckAndUpdateDishAvailabilityAsync(
        AppDbContext context,
        IHubContext<OrderHub> hubContext)
    {
        var dishes = await context.Dishes
            .Include(d => d.DishIngredients)
            .ThenInclude(di => di.Ingredient)
            .Where(d => d.DishIngredients.Any())
            .ToListAsync();

        var changedDishes = new List<object>();

        foreach (var dish in dishes)
        {
            var oldStatus = dish.Status;
            var enough = dish.DishIngredients.All(di =>
                di.Ingredient.CurrentStock >= di.QuantityNeeded);

            if (!enough && dish.Status == DishStatus.Available)
                dish.Status = DishStatus.Unavailable;
            else if (enough && dish.Status == DishStatus.Unavailable)
                dish.Status = DishStatus.Available;

            if (oldStatus != dish.Status)
            {
                changedDishes.Add(new { dish.Id, dish.Name, Status = dish.Status.ToString() });
            }
        }

        await context.SaveChangesAsync();

        foreach (var changed in changedDishes)
        {
            await hubContext.Clients.Group("management").SendAsync("DishStatusChanged", changed);
            await hubContext.Clients.All.SendAsync("DishStatusChanged", changed);
        }
    }
}
