using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using OnlineMenu.API.Hubs;
using OnlineMenu.Application.DTOs;
using OnlineMenu.Application.DTOs.Dishes;
using OnlineMenu.Core.Entities;
using OnlineMenu.Core.Enums;
using OnlineMenu.Core.Interfaces.Repositories;
using OnlineMenu.Infrastructure.Data;

namespace OnlineMenu.API.Controllers;

[ApiController]
[Route("api/dishes")]
public class DishesController : ControllerBase
{
    private readonly IDishRepository _dishRepo;
    private readonly AppDbContext _context;
    private readonly IHubContext<OrderHub> _hubContext;

    public DishesController(IDishRepository dishRepo, AppDbContext context, IHubContext<OrderHub> hubContext)
    {
        _dishRepo = dishRepo;
        _context = context;
        _hubContext = hubContext;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int limit = 10,
        [FromQuery] string? status = null,
        [FromQuery] string? search = null)
    {
        DishStatus? dishStatus = status != null && Enum.TryParse<DishStatus>(status, out var parsed)
            ? parsed : null;
        var keyword = string.IsNullOrWhiteSpace(search) ? null : search.Trim();

        System.Linq.Expressions.Expression<Func<Dish, bool>>? filter = null;
        if (dishStatus.HasValue && keyword != null)
        {
            var st = dishStatus.Value;
            string kw = keyword;
            filter = d => d.Status == st && (d.Name.Contains(kw) || d.Description.Contains(kw));
        }
        else if (dishStatus.HasValue)
        {
            var st = dishStatus.Value;
            filter = d => d.Status == st;
        }
        else if (keyword != null)
        {
            string kw = keyword;
            filter = d => d.Name.Contains(kw) || d.Description.Contains(kw);
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

    [Authorize(Roles = "Manager,Employee")]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateDishRequest request)
    {
        // Kiểm tra tính hợp lệ của dữ liệu
        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest(ApiResponse<object>.Fail("Tên món không được để trống"));
        if (request.Price < 1000)
            return BadRequest(ApiResponse<object>.Fail("Giá món phải từ 1.000đ"));
        if (request.CategoryId <= 0)
            return BadRequest(ApiResponse<object>.Fail("Vui lòng chọn danh mục"));

        // Chặn trùng tên món
        if (await _dishRepo.ExistsAsync(d => d.Name == request.Name))
            return BadRequest(ApiResponse<object>.Fail("Món ăn đã tồn tại"));

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

    [Authorize(Roles = "Manager,Employee")]
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateDishRequest request)
    {
        var dish = await _dishRepo.GetByIdAsync(id);
        if (dish == null) return NotFound(ApiResponse<object>.Fail("Dish not found", 404));

        // Kiểm tra tính hợp lệ của dữ liệu
        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest(ApiResponse<object>.Fail("Tên món không được để trống"));
        if (request.Price < 1000)
            return BadRequest(ApiResponse<object>.Fail("Giá món phải từ 1.000đ"));
        if (request.CategoryId <= 0)
            return BadRequest(ApiResponse<object>.Fail("Vui lòng chọn danh mục"));

        // Chặn trùng tên với món khác (loại trừ chính món đang sửa)
        if (await _dishRepo.ExistsAsync(d => d.Name == request.Name && d.Id != id))
            return BadRequest(ApiResponse<object>.Fail("Món ăn đã tồn tại"));

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

        // Thông báo realtime để menu khách hàng cập nhật ngay (tên, giá, trạng thái...)
        await _hubContext.Clients.All.SendAsync("DishStatusChanged",
            new { dish.Id, dish.Name, Status = dish.Status.ToString() });

        return Ok(ApiResponse<object>.Success(null!, "Updated"));
    }

    [Authorize(Roles = "Manager")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var dish = await _dishRepo.GetByIdAsync(id);
        if (dish == null) return NotFound(ApiResponse<object>.Fail("Dish not found", 404));

        // Chặn xóa món đang nằm trong đơn hàng chưa thanh toán → gợi ý Ẩn món
        var inActiveOrder = await _context.OrderItems.AnyAsync(oi => oi.DishId == id
            && (oi.Order.Status == OrderStatus.Pending
                || oi.Order.Status == OrderStatus.Processing
                || oi.Order.Status == OrderStatus.Delivered));
        if (inActiveOrder)
            return BadRequest(ApiResponse<object>.Fail(
                "Món đang nằm trong đơn hàng chưa thanh toán. Vui lòng dùng chức năng \"Ẩn món\" thay vì xóa."));

        // Món đã có trong lịch sử đơn hàng (đã thanh toán/đã hủy) → giữ lịch sử, không xóa cứng
        var inAnyOrder = await _context.OrderItems.AnyAsync(oi => oi.DishId == id);
        if (inAnyOrder)
            return BadRequest(ApiResponse<object>.Fail(
                "Món đã có trong lịch sử đơn hàng nên không thể xóa. Vui lòng dùng chức năng \"Ẩn món\"."));

        await _dishRepo.DeleteAsync(dish);
        return Ok(ApiResponse<object>.Success(null!, "Deleted"));
    }
}
