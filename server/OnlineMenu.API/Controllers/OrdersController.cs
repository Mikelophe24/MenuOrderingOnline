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

        if (table.Status == TableStatus.Occupied)
            return BadRequest(ApiResponse<object>.Fail("Bàn đang có khách, không thể đặt thêm"));

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

        // Update table status to Occupied
        if (table.Status != TableStatus.Occupied)
        {
            table.Status = TableStatus.Occupied;
            await _tableRepo.UpdateAsync(table);
            await _hubContext.Clients.Group("management").SendAsync("TableStatusChanged",
                new { table.Id, table.Number, Status = table.Status.ToString() });
        }

        // Notify management via SignalR
        var orderDto = MapToDto(order);
        await _hubContext.Clients.Group("management").SendAsync("NewOrder", orderDto);

        return CreatedAtAction(nameof(GetById), new { id = order.Id }, ApiResponse<OrderDto>.Success(orderDto, "Order created", 201));
    }

    // Guest views their orders by table number + token
    [HttpGet("guest/orders")]
    public async Task<IActionResult> GetGuestOrders([FromQuery] int tableNumber, [FromQuery] string token)
    {
        var table = await _tableRepo.GetByNumberAsync(tableNumber);
        if (table == null || table.Token != token)
            return BadRequest(ApiResponse<object>.Fail("Invalid table or token"));

        var orders = await _orderRepo.GetByTableNumberAsync(tableNumber);
        var dtos = orders.Select(MapToDto).ToList();
        return Ok(ApiResponse<List<OrderDto>>.Success(dtos));
    }

    [Authorize(Roles = "Owner,Employee")]
    [HttpPatch("orders/{id}/status")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateOrderStatusRequest request)
    {
        var order = await _orderRepo.GetWithItemsAsync(id);
        if (order == null) return NotFound(ApiResponse<object>.Fail("Order not found", 404));

        order.Status = Enum.Parse<OrderStatus>(request.Status);
        await _orderRepo.UpdateAsync(order);

        // If order is Paid or Cancelled, check if table can be set back to Available
        if ((order.Status == OrderStatus.Paid || order.Status == OrderStatus.Cancelled) && order.TableId.HasValue)
        {
            var tableId = order.TableId.Value;
            var hasActiveOrders = await _orderRepo.ExistsAsync(o =>
                o.TableId == tableId
                && o.Id != order.Id
                && o.Status != OrderStatus.Paid
                && o.Status != OrderStatus.Cancelled);

            if (!hasActiveOrders)
            {
                var table = await _tableRepo.GetByIdAsync(tableId);
                if (table != null && table.Status == TableStatus.Occupied)
                {
                    table.Status = TableStatus.Available;
                    await _tableRepo.UpdateAsync(table);
                    await _hubContext.Clients.Group("management").SendAsync("TableStatusChanged",
                        new { table.Id, table.Number, Status = table.Status.ToString() });
                }
            }
        }

        // Notify table and management
        var orderDto = MapToDto(order);
        await _hubContext.Clients.Group($"table-{order.TableNumber}").SendAsync("OrderStatusChanged", orderDto);
        await _hubContext.Clients.Group("management").SendAsync("OrderStatusChanged", orderDto);

        return Ok(ApiResponse<OrderDto>.Success(orderDto, "Status updated"));
    }

    [Authorize(Roles = "Owner,Employee")]
    [HttpDelete("orders/{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var order = await _orderRepo.GetWithItemsAsync(id);
        if (order == null) return NotFound(ApiResponse<object>.Fail("Order not found", 404));

        await _orderRepo.DeleteAsync(order);

        // If table has no more active orders, set it back to Available
        if (order.TableId.HasValue)
        {
            var tableId = order.TableId.Value;
            var hasActiveOrders = await _orderRepo.ExistsAsync(o =>
                o.TableId == tableId
                && o.Id != order.Id
                && o.Status != OrderStatus.Paid
                && o.Status != OrderStatus.Cancelled);

            if (!hasActiveOrders)
            {
                var table = await _tableRepo.GetByIdAsync(tableId);
                if (table != null && table.Status == TableStatus.Occupied)
                {
                    table.Status = TableStatus.Available;
                    await _tableRepo.UpdateAsync(table);
                    await _hubContext.Clients.Group("management").SendAsync("TableStatusChanged",
                        new { table.Id, table.Number, Status = table.Status.ToString() });
                }
            }
        }

        return Ok(ApiResponse<object>.Success(null!, "Order deleted"));
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
