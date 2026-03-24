using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OnlineMenu.Application.DTOs;
using OnlineMenu.Core.Entities;
using OnlineMenu.Core.Interfaces.Repositories;

namespace OnlineMenu.API.Controllers;

[ApiController]
[Route("api/categories")]
public class CategoriesController : ControllerBase
{
    private readonly IRepository<Category> _categoryRepo;

    public CategoriesController(IRepository<Category> categoryRepo)
    {
        _categoryRepo = categoryRepo;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var categories = await _categoryRepo.GetAllAsync();
        var dtos = categories.Select(c => new { c.Id, c.Name, c.Description }).ToList();
        return Ok(ApiResponse<object>.Success(dtos));
    }

    [Authorize(Roles = "Owner,Employee")]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateCategoryRequest request)
    {
        var category = new Category
        {
            Name = request.Name,
            Description = request.Description,
        };
        await _categoryRepo.AddAsync(category);
        return CreatedAtAction(nameof(GetAll), ApiResponse<object>.Success(new { category.Id, category.Name, category.Description }, "Created", 201));
    }

    [Authorize(Roles = "Owner,Employee")]
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] CreateCategoryRequest request)
    {
        var category = await _categoryRepo.GetByIdAsync(id);
        if (category == null) return NotFound();
        category.Name = request.Name;
        category.Description = request.Description;
        await _categoryRepo.UpdateAsync(category);
        return Ok(ApiResponse<object>.Success(null!, "Updated"));
    }

    [Authorize(Roles = "Owner")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var category = await _categoryRepo.GetByIdAsync(id);
        if (category == null) return NotFound();
        await _categoryRepo.DeleteAsync(category);
        return Ok(ApiResponse<object>.Success(null!, "Deleted"));
    }
}

public record CreateCategoryRequest(string Name, string? Description);
