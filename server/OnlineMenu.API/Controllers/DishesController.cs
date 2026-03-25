using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OnlineMenu.Application.DTOs;
using OnlineMenu.Application.DTOs.Dishes;
using OnlineMenu.Core.Entities;
using OnlineMenu.Core.Enums;
using OnlineMenu.Core.Interfaces.Repositories;

namespace OnlineMenu.API.Controllers;

[ApiController]
[Route("api/dishes")]
public class DishesController : ControllerBase
{
    private readonly IDishRepository _dishRepo;

    public DishesController(IDishRepository dishRepo)
    {
        _dishRepo = dishRepo;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int limit = 10,
        [FromQuery] string? status = null)
    {
        System.Linq.Expressions.Expression<Func<Dish, bool>>? filter = null;
        if (status != null && Enum.TryParse<DishStatus>(status, out var dishStatus))
        {
            filter = d => d.Status == dishStatus;
        }

        var (items, totalCount) = await _dishRepo.GetPagedAsync(page, limit, filter, includeProperties: "Category");

        var dtos = items.Select(d => new DishDto(
            d.Id, d.Name, d.Price, d.Description, d.Image,
            d.Status.ToString(), d.CategoryId, d.Category?.Name,
            d.Calories, d.Protein, d.Carbs,
            d.CreatedAt, d.UpdatedAt
        )).ToList();

        var response = new PaginatedResponse<DishDto>
        {
            Data = dtos,
            TotalItems = totalCount,
            CurrentPage = page,
            TotalPages = (int)Math.Ceiling(totalCount / (double)limit),
            PageSize = limit
        };

        return Ok(ApiResponse<PaginatedResponse<DishDto>>.Success(response));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var dish = await _dishRepo.GetByIdAsync(id);
        if (dish == null) return NotFound(ApiResponse<object>.Fail("Dish not found", 404));

        var dto = new DishDto(
            dish.Id, dish.Name, dish.Price, dish.Description, dish.Image,
            dish.Status.ToString(), dish.CategoryId, dish.Category?.Name,
            dish.Calories, dish.Protein, dish.Carbs,
            dish.CreatedAt, dish.UpdatedAt
        );
        return Ok(ApiResponse<DishDto>.Success(dto));
    }

    [Authorize(Roles = "Owner,Employee")]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateDishRequest request)
    {
        var dish = new Dish
        {
            Name = request.Name,
            Price = request.Price,
            Description = request.Description ?? string.Empty,
            Image = request.Image ?? string.Empty,
            Status = Enum.Parse<DishStatus>(request.Status),
            CategoryId = request.CategoryId,
            Calories = request.Calories,
            Protein = request.Protein,
            Carbs = request.Carbs,
        };

        await _dishRepo.AddAsync(dish);

        var dto = new DishDto(
            dish.Id, dish.Name, dish.Price, dish.Description, dish.Image,
            dish.Status.ToString(), dish.CategoryId, null,
            dish.Calories, dish.Protein, dish.Carbs,
            dish.CreatedAt, dish.UpdatedAt
        );
        return CreatedAtAction(nameof(GetById), new { id = dish.Id }, ApiResponse<DishDto>.Success(dto, "Created", 201));
    }

    [Authorize(Roles = "Owner,Employee")]
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateDishRequest request)
    {
        var dish = await _dishRepo.GetByIdAsync(id);
        if (dish == null) return NotFound(ApiResponse<object>.Fail("Dish not found", 404));

        dish.Name = request.Name;
        dish.Price = request.Price;
        dish.Description = request.Description ?? dish.Description;
        dish.Image = request.Image ?? dish.Image;
        dish.Status = Enum.Parse<DishStatus>(request.Status);
        dish.CategoryId = request.CategoryId;
        dish.Calories = request.Calories;
        dish.Protein = request.Protein;
        dish.Carbs = request.Carbs;

        await _dishRepo.UpdateAsync(dish);


        return Ok(ApiResponse<object>.Success(null!, "Updated"));
    }

    [Authorize(Roles = "Owner,Employee")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var dish = await _dishRepo.GetByIdAsync(id);
        if (dish == null) return NotFound(ApiResponse<object>.Fail("Dish not found", 404));

        await _dishRepo.DeleteAsync(dish);
        return Ok(ApiResponse<object>.Success(null!, "Deleted"));
    }
}
