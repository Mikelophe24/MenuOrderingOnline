using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using OnlineMenu.API.Hubs;
using OnlineMenu.Application.DTOs;
using OnlineMenu.Core.Entities;
using OnlineMenu.Core.Enums;
using OnlineMenu.Infrastructure.Data;

namespace OnlineMenu.API.Controllers;

[ApiController]
[Route("api/ingredients")]
[Authorize(Roles = "Owner,Employee")]
public class IngredientsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IHubContext<OrderHub> _hubContext;

    public IngredientsController(AppDbContext context, IHubContext<OrderHub> hubContext)
    {
        _context = context;
        _hubContext = hubContext;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var ingredients = await _context.Ingredients
            .Include(i => i.DishIngredients)
            .ThenInclude(di => di.Dish)
            .OrderBy(i => i.Name)
            .ToListAsync();

        var dtos = ingredients.Select(i => new
        {
            i.Id,
            i.Name,
            i.Unit,
            i.CurrentStock,
            i.MinStock,
            IsLow = i.CurrentStock <= i.MinStock,
            Dishes = i.DishIngredients.Select(di => new { di.Dish.Id, di.Dish.Name, di.QuantityNeeded }).ToList()
        }).ToList();

        return Ok(ApiResponse<object>.Success(dtos));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateIngredientRequest request)
    {
        var ingredient = new Ingredient
        {
            Name = request.Name,
            Unit = request.Unit,
            CurrentStock = request.CurrentStock,
            MinStock = request.MinStock,
        };
        _context.Ingredients.Add(ingredient);
        await _context.SaveChangesAsync();
        return Ok(ApiResponse<object>.Success(new { ingredient.Id, ingredient.Name, ingredient.Unit, ingredient.CurrentStock, ingredient.MinStock }));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] CreateIngredientRequest request)
    {
        var ingredient = await _context.Ingredients.FindAsync(id);
        if (ingredient == null) return NotFound(ApiResponse<object>.Fail("Not found"));

        ingredient.Name = request.Name;
        ingredient.Unit = request.Unit;
        ingredient.CurrentStock = request.CurrentStock;
        ingredient.MinStock = request.MinStock;
        await _context.SaveChangesAsync();

        // Auto-check dishes availability
        await CheckAndUpdateDishAvailability();

        return Ok(ApiResponse<object>.Success(null!, "Updated"));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var ingredient = await _context.Ingredients.FindAsync(id);
        if (ingredient == null) return NotFound(ApiResponse<object>.Fail("Not found"));

        _context.Ingredients.Remove(ingredient);
        await _context.SaveChangesAsync();
        return Ok(ApiResponse<object>.Success(null!, "Deleted"));
    }

    // Update stock (e.g. restock)
    [HttpPatch("{id}/stock")]
    public async Task<IActionResult> UpdateStock(int id, [FromBody] UpdateStockRequest request)
    {
        var ingredient = await _context.Ingredients.FindAsync(id);
        if (ingredient == null) return NotFound(ApiResponse<object>.Fail("Not found"));

        ingredient.CurrentStock = request.CurrentStock;
        await _context.SaveChangesAsync();

        await _hubContext.Clients.Group("management").SendAsync("StockChanged",
            new { ingredient.Id, ingredient.Name, ingredient.CurrentStock, ingredient.MinStock, IsLow = ingredient.CurrentStock <= ingredient.MinStock });

        await CheckAndUpdateDishAvailability();

        return Ok(ApiResponse<object>.Success(new { ingredient.Id, ingredient.CurrentStock }));
    }

    // Link ingredient to dish
    [HttpPost("dish-link")]
    public async Task<IActionResult> LinkToDish([FromBody] LinkDishIngredientRequest request)
    {
        var exists = await _context.DishIngredients
            .AnyAsync(di => di.DishId == request.DishId && di.IngredientId == request.IngredientId);
        if (exists) return BadRequest(ApiResponse<object>.Fail("Already linked"));

        _context.DishIngredients.Add(new DishIngredient
        {
            DishId = request.DishId,
            IngredientId = request.IngredientId,
            QuantityNeeded = request.QuantityNeeded,
        });
        await _context.SaveChangesAsync();
        return Ok(ApiResponse<object>.Success(null!, "Linked"));
    }

    [HttpDelete("dish-link/{dishId}/{ingredientId}")]
    public async Task<IActionResult> UnlinkFromDish(int dishId, int ingredientId)
    {
        var link = await _context.DishIngredients
            .FirstOrDefaultAsync(di => di.DishId == dishId && di.IngredientId == ingredientId);
        if (link == null) return NotFound();

        _context.DishIngredients.Remove(link);
        await _context.SaveChangesAsync();
        return Ok(ApiResponse<object>.Success(null!, "Unlinked"));
    }

    // Deduct stock when order is completed and auto-hide dishes
    [HttpPost("deduct")]
    public async Task<IActionResult> DeductStock([FromBody] DeductStockRequest request)
    {
        foreach (var item in request.Items)
        {
            var dishIngredients = await _context.DishIngredients
                .Where(di => di.DishId == item.DishId)
                .Include(di => di.Ingredient)
                .ToListAsync();

            foreach (var di in dishIngredients)
            {
                di.Ingredient.CurrentStock -= di.QuantityNeeded * item.Quantity;
                if (di.Ingredient.CurrentStock < 0) di.Ingredient.CurrentStock = 0;
            }
        }

        await _context.SaveChangesAsync();
        await CheckAndUpdateDishAvailability();

        return Ok(ApiResponse<object>.Success(null!, "Stock deducted"));
    }

    // Check all dishes and auto-hide if ingredients are insufficient
    private async Task CheckAndUpdateDishAvailability()
    {
        var dishes = await _context.Dishes
            .Include(d => d.DishIngredients)
            .ThenInclude(di => di.Ingredient)
            .Where(d => d.DishIngredients.Any())
            .ToListAsync();

        var changedDishes = new List<object>();

        foreach (var dish in dishes)
        {
            var hasEnoughStock = dish.DishIngredients.All(di =>
                di.Ingredient.CurrentStock >= di.QuantityNeeded);

            var oldStatus = dish.Status;

            if (!hasEnoughStock && dish.Status == DishStatus.Available)
            {
                dish.Status = DishStatus.Unavailable;
            }
            else if (hasEnoughStock && dish.Status == DishStatus.Unavailable)
            {
                dish.Status = DishStatus.Available;
            }

            if (oldStatus != dish.Status)
            {
                changedDishes.Add(new { dish.Id, dish.Name, Status = dish.Status.ToString() });
            }
        }

        await _context.SaveChangesAsync();

        // Notify via SignalR
        foreach (var changed in changedDishes)
        {
            await _hubContext.Clients.Group("management").SendAsync("DishStatusChanged", changed);
            await _hubContext.Clients.All.SendAsync("DishStatusChanged", changed);
        }
    }
}

public record CreateIngredientRequest(string Name, string Unit, decimal CurrentStock, decimal MinStock);
public record UpdateStockRequest(decimal CurrentStock);
public record LinkDishIngredientRequest(int DishId, int IngredientId, decimal QuantityNeeded);
public record DeductStockRequest(List<DeductItem> Items);
public record DeductItem(int DishId, int Quantity);
