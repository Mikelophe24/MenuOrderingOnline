using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using OnlineMenu.API.Hubs;
using OnlineMenu.Application.DTOs;
using OnlineMenu.Application.DTOs.Orders;
using OnlineMenu.Core.Entities;
using OnlineMenu.Core.Enums;
using OnlineMenu.Core.Interfaces.Repositories;

namespace OnlineMenu.API.Controllers;

[ApiController]
[Route("api")]
public class OrdersController : ControllerBase
{
    private readonly IOrderRepository _orderRepo;
    private readonly ITableRepository _tableRepo;
    private readonly IDishRepository _dishRepo;
    private readonly IHubContext<OrderHub> _hubContext;

    public OrdersController(
        IOrderRepository orderRepo,
        ITableRepository tableRepo,
        IDishRepository dishRepo,
        IHubContext<OrderHub> hubContext)
    {
        _orderRepo = orderRepo;
        _tableRepo = tableRepo;
        _dishRepo = dishRepo;
        _hubContext = hubContext;
    }

    [Authorize(Roles = "Owner,Employee")]
    [HttpGet("orders")]
    public async Task<IActionResult> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int limit = 10,
        [FromQuery] string? status = null)
    {
        System.Linq.Expressions.Expression<Func<Order, bool>>? filter = null;
        if (status != null && Enum.TryParse<OrderStatus>(status, out var orderStatus))
        {
            filter = o => o.Status == orderStatus;
        }

        var (items, totalCount) = await _orderRepo.GetPagedAsync(page, limit, filter, includeProperties: "OrderItems,OrderItems.Dish");

        var dtos = items.Select(MapToDto).ToList();

        var response = new PaginatedResponse<OrderDto>
        {
            Data = dtos,
            TotalItems = totalCount,
            CurrentPage = page,
            TotalPages = (int)Math.Ceiling(totalCount / (double)limit),
            PageSize = limit
        };

        return Ok(ApiResponse<PaginatedResponse<OrderDto>>.Success(response));
    }

    [HttpGet("orders/{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var order = await _orderRepo.GetWithItemsAsync(id);
        if (order == null) return NotFound(ApiResponse<object>.Fail("Order not found", 404));
        return Ok(ApiResponse<OrderDto>.Success(MapToDto(order)));
    }

    // Guest creates an order
    [HttpPost("guest/orders")]
    public async Task<IActionResult> CreateGuestOrder([FromBody] CreateGuestOrderRequest request)
    {
        var table = await _tableRepo.GetByNumberAsync(request.TableNumber);
        if (table == null || table.Token != request.TableToken)
            return BadRequest(ApiResponse<object>.Fail("Invalid table or token"));

        var order = new Order
        {
            TableNumber = request.TableNumber,
            TableId = table.Id,
            GuestName = request.GuestName,
            Status = OrderStatus.Pending,
        };

        decimal totalPrice = 0;
        foreach (var item in request.Items)
        {
            var dish = await _dishRepo.GetByIdAsync(item.DishId);
            if (dish == null || dish.Status != DishStatus.Available)
                return BadRequest(ApiResponse<object>.Fail($"Dish {item.DishId} not available"));

            order.OrderItems.Add(new OrderItem
            {
                DishId = item.DishId,
                Quantity = item.Quantity,
                Note = item.Note,
            });

            totalPrice += dish.Price * item.Quantity;
        }

        order.TotalPrice = totalPrice;
        await _orderRepo.AddAsync(order);

        // Notify management via SignalR
        var orderDto = MapToDto(order);
        await _hubContext.Clients.Group("management").SendAsync("NewOrder", orderDto);

        return CreatedAtAction(nameof(GetById), new { id = order.Id }, ApiResponse<OrderDto>.Success(orderDto, "Order created", 201));
    }

    [Authorize(Roles = "Owner,Employee")]
    [HttpPatch("orders/{id}/status")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateOrderStatusRequest request)
    {
        var order = await _orderRepo.GetWithItemsAsync(id);
        if (order == null) return NotFound(ApiResponse<object>.Fail("Order not found", 404));

        order.Status = Enum.Parse<OrderStatus>(request.Status);
        await _orderRepo.UpdateAsync(order);

        // Notify table and management
        var orderDto = MapToDto(order);
        await _hubContext.Clients.Group($"table-{order.TableNumber}").SendAsync("OrderStatusChanged", orderDto);
        await _hubContext.Clients.Group("management").SendAsync("OrderStatusChanged", orderDto);

        return Ok(ApiResponse<OrderDto>.Success(orderDto, "Status updated"));
    }

    private static OrderDto MapToDto(Order order) => new(
        order.Id,
        order.TableNumber,
        order.GuestName,
        order.Status.ToString(),
        order.TotalPrice,
        order.OrderItems.Select(oi => new OrderItemDto(
            oi.Id, oi.DishId,
            oi.Dish?.Name ?? string.Empty,
            oi.Dish?.Price ?? 0,
            oi.Dish?.Image,
            oi.Quantity, oi.Note
        )).ToList(),
        order.CreatedAt,
        order.UpdatedAt
    );
}
