using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OnlineMenu.Application.DTOs;
using OnlineMenu.Application.DTOs.Tables;
using OnlineMenu.Core.Entities;
using OnlineMenu.Core.Enums;
using OnlineMenu.Core.Interfaces.Repositories;

namespace OnlineMenu.API.Controllers;

[ApiController]
[Route("api/tables")]
[Authorize(Roles = "Manager,Employee")]
public class TablesController : ControllerBase
{
    private readonly ITableRepository _tableRepo;
    private readonly IOrderRepository _orderRepo;

    public TablesController(ITableRepository tableRepo, IOrderRepository orderRepo)
    {
        _tableRepo = tableRepo;
        _orderRepo = orderRepo;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int limit = 20)
    {
        var (items, totalCount) = await _tableRepo.GetPagedAsync(page, limit,
            orderBy: q => q.OrderBy(t => t.Number));

        var dtos = items.Select(t => new TableDto(
            t.Id, t.Number, t.Capacity, t.Status.ToString(), t.Token, t.CreatedAt, t.UpdatedAt
        )).ToList();

        var response = new PaginatedResponse<TableDto>
        {
            Data = dtos,
            TotalItems = totalCount,
            CurrentPage = page,
            TotalPages = (int)Math.Ceiling(totalCount / (double)limit),
            PageSize = limit
        };

        return Ok(ApiResponse<PaginatedResponse<TableDto>>.Success(response));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var table = await _tableRepo.GetByIdAsync(id);
        if (table == null) return NotFound();
        var dto = new TableDto(table.Id, table.Number, table.Capacity, table.Status.ToString(), table.Token, table.CreatedAt, table.UpdatedAt);
        return Ok(ApiResponse<TableDto>.Success(dto));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateTableRequest request)
    {
        // Kiểm tra tính hợp lệ của dữ liệu
        if (request.Number <= 0)
            return BadRequest(ApiResponse<object>.Fail("Số bàn phải lớn hơn 0"));
        if (request.Capacity <= 0)
            return BadRequest(ApiResponse<object>.Fail("Sức chứa phải lớn hơn 0"));

        // Chặn trùng số bàn
        if (await _tableRepo.ExistsAsync(t => t.Number == request.Number))
            return BadRequest(ApiResponse<object>.Fail("Số bàn đã tồn tại"));

        var table = new Table
        {
            Number = request.Number,
            Capacity = request.Capacity,
            Status = Enum.Parse<TableStatus>(request.Status),
        };

        await _tableRepo.AddAsync(table);
        var dto = new TableDto(table.Id, table.Number, table.Capacity, table.Status.ToString(), table.Token, table.CreatedAt, table.UpdatedAt);
        return CreatedAtAction(nameof(GetById), new { id = table.Id }, ApiResponse<TableDto>.Success(dto, "Created", 201));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateTableRequest request)
    {
        var table = await _tableRepo.GetByIdAsync(id);
        if (table == null) return NotFound();

        // Kiểm tra tính hợp lệ của dữ liệu
        if (request.Number <= 0)
            return BadRequest(ApiResponse<object>.Fail("Số bàn phải lớn hơn 0"));
        if (request.Capacity <= 0)
            return BadRequest(ApiResponse<object>.Fail("Sức chứa phải lớn hơn 0"));

        // Chặn trùng số bàn với bàn khác (loại trừ chính bàn đang sửa)
        if (await _tableRepo.ExistsAsync(t => t.Number == request.Number && t.Id != id))
            return BadRequest(ApiResponse<object>.Fail("Số bàn đã tồn tại"));

        table.Number = request.Number;
        table.Capacity = request.Capacity;
        table.Status = Enum.Parse<TableStatus>(request.Status);

        await _tableRepo.UpdateAsync(table);
        return Ok(ApiResponse<object>.Success(null!, "Updated"));
    }

    [Authorize(Roles = "Manager")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var table = await _tableRepo.GetByIdAsync(id);
        if (table == null) return NotFound();

        // Chặn xóa bàn khi còn đơn hàng chưa hoàn tất (Chờ xác nhận / Đang xử lý / Đã giao)
        var hasActiveOrder = await _orderRepo.ExistsAsync(o => o.TableId == id
            && o.Status != OrderStatus.Paid
            && o.Status != OrderStatus.Cancelled);
        if (hasActiveOrder)
            return BadRequest(ApiResponse<object>.Fail(
                "Bàn đang có đơn hàng chưa thanh toán. Vui lòng xử lý đơn trước khi xóa."));

        await _tableRepo.DeleteAsync(table);
        return Ok(ApiResponse<object>.Success(null!, "Deleted"));
    }

    [HttpPost("{id}/change-token")]
    public async Task<IActionResult> ChangeToken(int id)
    {
        var table = await _tableRepo.GetByIdAsync(id);
        if (table == null) return NotFound();

        table.Token = Guid.NewGuid().ToString();
        await _tableRepo.UpdateAsync(table);

        var dto = new TableDto(table.Id, table.Number, table.Capacity, table.Status.ToString(), table.Token, table.CreatedAt, table.UpdatedAt);
        return Ok(ApiResponse<TableDto>.Success(dto, "Token changed"));
    }
}
