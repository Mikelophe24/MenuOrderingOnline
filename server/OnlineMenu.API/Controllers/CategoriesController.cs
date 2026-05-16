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
        var dtos = categories.Select(c => new
        {
            c.Id,
            c.Name,
            c.Description,
            c.Image,
            c.CreatedAt,
            c.UpdatedAt,
        }).ToList();
        return Ok(ApiResponse<object>.Success(dtos));
    }

    [Authorize(Roles = "Owner,Employee")]
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var category = await _categoryRepo.GetByIdAsync(id);
        if (category == null) return NotFound(ApiResponse<object>.Fail("Category not found", 404));
        return Ok(ApiResponse<object>.Success(new
        {
            category.Id,
            category.Name,
            category.Description,
            category.Image,
            category.CreatedAt,
            category.UpdatedAt,
        }));
    }

    [Authorize(Roles = "Owner,Employee")]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateCategoryRequest request)
    {
        var category = new Category
        {
            Name = request.Name,
            Description = request.Description,
            Image = request.Image,
        };
        await _categoryRepo.AddAsync(category);
        return CreatedAtAction(nameof(GetById), new { id = category.Id }, ApiResponse<object>.Success(new
        {
            category.Id,
            category.Name,
            category.Description,
            category.Image,
            category.CreatedAt,
            category.UpdatedAt,
        }, "Created", 201));
    }

    [Authorize(Roles = "Owner,Employee")]
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateCategoryRequest request)
    {
        var category = await _categoryRepo.GetByIdAsync(id);
        if (category == null) return NotFound();
        category.Name = request.Name;
        category.Description = request.Description;
        category.Image = request.Image ?? category.Image;
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

public record CreateCategoryRequest(string Name, string? Description, string? Image);
public record UpdateCategoryRequest(string Name, string? Description, string? Image);
