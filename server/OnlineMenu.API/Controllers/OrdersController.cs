using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using OnlineMenu.API.Extensions;
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
    private readonly Infrastructure.Data.AppDbContext _context;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;

    public OrdersController(
        IOrderRepository orderRepo,
        ITableRepository tableRepo,
        IDishRepository dishRepo,
        IHubContext<OrderHub> hubContext,
        Infrastructure.Data.AppDbContext context,
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration)
    {
        _orderRepo = orderRepo;
        _tableRepo = tableRepo;
        _dishRepo = dishRepo;
        _hubContext = hubContext;
        _context = context;
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
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

        var (items, totalCount) = await _orderRepo.GetPagedAsync(page, limit, filter, includeProperties: "OrderItems,OrderItems.Dish,ProcessedBy");

        var dtos = items.Select(OrderHelper.MapToDto).ToList();

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
        return Ok(ApiResponse<OrderDto>.Success(OrderHelper.MapToDto(order)));
    }

    // Guest checks table status before entering menu
    [HttpGet("guest/table-status")]
    public async Task<IActionResult> CheckTableStatus([FromQuery] int tableNumber, [FromQuery] string token)
    {
        var table = await _tableRepo.GetByNumberAsync(tableNumber);
        if (table == null || table.Token != token)
            return BadRequest(ApiResponse<object>.Fail("Invalid table or token"));

        return Ok(ApiResponse<object>.Success(new { table.Number, Status = table.Status.ToString() }));
    }

    // Guest creates an order
    [HttpPost("guest/orders")]
    public async Task<IActionResult> CreateGuestOrder([FromBody] CreateGuestOrderRequest request)
    {
        if (request.Items == null || request.Items.Count == 0)
            return BadRequest(ApiResponse<object>.Fail("Order must have at least one item"));

        if (request.Items.Any(i => i.Quantity <= 0))
            return BadRequest(ApiResponse<object>.Fail("Quantity must be greater than 0"));

        var table = await _tableRepo.GetByNumberAsync(request.TableNumber);
        if (table == null || table.Token != request.TableToken)
            return BadRequest(ApiResponse<object>.Fail("Invalid table or token"));

        if (table.Status == TableStatus.Reserved)
            return BadRequest(ApiResponse<object>.Fail("Bàn đã được đặt trước, vui lòng chọn bàn khác"));

        // Batch-fetch all requested dishes in one query instead of N+1
        var dishIds = request.Items.Select(i => i.DishId).Distinct().ToList();
        var dishes = await _dishRepo.FindAsync(d => dishIds.Contains(d.Id));
        var dishMap = dishes.ToDictionary(d => d.Id);

        // Load ingredients for stock validation
        var dishIngredients = await _context.DishIngredients
            .Where(di => dishIds.Contains(di.DishId))
            .Include(di => di.Ingredient)
            .ToListAsync();

        foreach (var item in request.Items)
        {
            if (!dishMap.TryGetValue(item.DishId, out var dish) || dish.Status != DishStatus.Available)
                return BadRequest(ApiResponse<object>.Fail($"Dish {item.DishId} not available"));

            // Check stock: if dish has ingredients, validate quantity against stock
            var ingredients = dishIngredients.Where(di => di.DishId == item.DishId).ToList();
            if (ingredients.Count > 0)
            {
                foreach (var di in ingredients)
                {
                    var maxServings = di.QuantityNeeded > 0
                        ? (int)Math.Floor(di.Ingredient.CurrentStock / di.QuantityNeeded)
                        : int.MaxValue;

                    if (item.Quantity > maxServings)
                        return BadRequest(ApiResponse<object>.Fail(
                            $"{dish.Name} chỉ còn đủ nguyên liệu cho {maxServings} phần"));
                }
            }
            else if (item.Quantity > 50)
            {
                return BadRequest(ApiResponse<object>.Fail($"Số lượng tối đa là 50"));
            }
        }

        // Check if guest already has a Pending order at this table → add items to it
        var existingOrders = await _orderRepo.GetByTableNumberAsync(request.TableNumber);
        var existingOrder = existingOrders.FirstOrDefault(o =>
            o.Status == OrderStatus.Pending
            && o.GuestName == request.GuestName);

        decimal addedPrice = 0;
        var newItems = new List<OrderItem>();
        foreach (var item in request.Items)
        {
            var dish = dishMap[item.DishId];
            newItems.Add(new OrderItem
            {
                DishId = item.DishId,
                DishName = dish.Name,
                DishPrice = dish.Price,
                DishImage = dish.Image,
                Quantity = item.Quantity,
                Note = item.Note,
            });
            addedPrice += dish.Price * item.Quantity;
        }

        Order order;
        if (existingOrder != null)
        {
            // Add items to existing Pending order
            foreach (var item in newItems)
            {
                item.OrderId = existingOrder.Id;
                existingOrder.OrderItems.Add(item);
            }
            existingOrder.TotalPrice += addedPrice;
            await _orderRepo.UpdateAsync(existingOrder);
            await _context.SaveChangesAsync();
            order = existingOrder;
        }
        else
        {
            // Create new order
            order = new Order
            {
                TableNumber = request.TableNumber,
                TableId = table.Id,
                GuestName = request.GuestName,
                Status = OrderStatus.Pending,
                TotalPrice = addedPrice,
            };
            foreach (var item in newItems) order.OrderItems.Add(item);
            await _orderRepo.AddAsync(order);
        }

        // Update table status to Occupied
        if (table.Status != TableStatus.Occupied)
        {
            table.Status = TableStatus.Occupied;
            await _tableRepo.UpdateAsync(table);
            await _hubContext.Clients.Group("management").SendAsync("TableStatusChanged",
                new { table.Id, table.Number, Status = table.Status.ToString() });
        }

        // Notify management via SignalR
        var orderDto = OrderHelper.MapToDto(order);
        await _hubContext.Clients.Group("management").SendAsync("NewOrder", orderDto);

        return CreatedAtAction(nameof(GetById), new { id = order.Id }, ApiResponse<OrderDto>.Success(orderDto, "Order created", 201));
    }

    // Guest views their orders by table number + token
    [HttpGet("guest/orders")]
    public async Task<IActionResult> GetGuestOrders([FromQuery] int tableNumber, [FromQuery] string token, [FromQuery] string? guestName = null)
    {
        var table = await _tableRepo.GetByNumberAsync(tableNumber);
        if (table == null || table.Token != token)
            return BadRequest(ApiResponse<object>.Fail("Invalid table or token"));

        var orders = await _orderRepo.GetByTableNumberAsync(tableNumber);
        if (!string.IsNullOrEmpty(guestName))
        {
            orders = orders.Where(o => o.GuestName == guestName);
        }
        var dtos = orders.Select(OrderHelper.MapToDto).ToList();
        return Ok(ApiResponse<List<OrderDto>>.Success(dtos));
    }

    [HttpPatch("guest/orders/{id}/cancel")]
    public async Task<IActionResult> GuestCancelOrder(int id, [FromBody] GuestCancelRequest request)
    {
        var table = await _tableRepo.GetByNumberAsync(request.TableNumber);
        if (table == null || table.Token != request.TableToken)
            return BadRequest(ApiResponse<object>.Fail("Invalid table or token"));

        var order = await _orderRepo.GetWithItemsAsync(id);
        if (order == null) return NotFound(ApiResponse<object>.Fail("Order not found", 404));

        if (order.Status != OrderStatus.Pending)
            return BadRequest(ApiResponse<object>.Fail("Chỉ có thể hủy đơn hàng đang chờ xác nhận"));

        order.Status = OrderStatus.Cancelled;
        await _orderRepo.UpdateAsync(order);

        await OrderHelper.TryFreeTableAsync(order.TableId, order.Id, _orderRepo, _tableRepo, _hubContext);

        var orderDto = OrderHelper.MapToDto(order);
        await _hubContext.Clients.Group("management").SendAsync("OrderStatusChanged", orderDto);
        await _hubContext.Clients.Group($"table-{order.TableNumber}").SendAsync("OrderStatusChanged", orderDto);

        return Ok(ApiResponse<OrderDto>.Success(orderDto, "Order cancelled"));
    }

    [Authorize(Roles = "Owner,Employee")]
    [HttpPatch("orders/{id}/status")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateOrderStatusRequest request)
    {
        var order = await _orderRepo.GetWithItemsAsync(id);
        if (order == null) return NotFound(ApiResponse<object>.Fail("Order not found", 404));

        if (!Enum.TryParse<OrderStatus>(request.Status, out var newStatus))
            return BadRequest(ApiResponse<object>.Fail("Invalid status"));

        var previousStatus = order.Status;

        // Validate status transition
        var allowedTransitions = new Dictionary<OrderStatus, OrderStatus[]>
        {
            { OrderStatus.Pending, [OrderStatus.Processing, OrderStatus.Cancelled] },
            { OrderStatus.Processing, [OrderStatus.Delivered, OrderStatus.Cancelled] },
            { OrderStatus.Delivered, [OrderStatus.Paid, OrderStatus.Cancelled] },
            { OrderStatus.Paid, [] },
            { OrderStatus.Cancelled, [] },
        };

        if (!allowedTransitions.TryGetValue(previousStatus, out var allowed) || !allowed.Contains(newStatus))
            return BadRequest(ApiResponse<object>.Fail($"Không thể chuyển từ {previousStatus} sang {newStatus}"));

        order.Status = newStatus;
        var userIdClaim = User.FindFirst("userId")?.Value;
        if (int.TryParse(userIdClaim, out var userId))
        {
            order.ProcessedById = userId;
        }
        await _orderRepo.UpdateAsync(order);

        // Deduct stock only when transitioning INTO Processing (not if already Processing)
        if (order.Status == OrderStatus.Processing && previousStatus != OrderStatus.Processing)
        {
            foreach (var item in order.OrderItems)
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

            await OrderHelper.CheckAndUpdateDishAvailabilityAsync(_context, _hubContext);

            // Notify stock changed
            await _hubContext.Clients.Group("management").SendAsync("StockChanged", new { });
        }

        // Restore stock when cancelling an order that was already Processing
        if (order.Status == OrderStatus.Cancelled && previousStatus == OrderStatus.Processing)
        {
            foreach (var item in order.OrderItems)
            {
                var dishIngredients = await _context.DishIngredients
                    .Where(di => di.DishId == item.DishId)
                    .Include(di => di.Ingredient)
                    .ToListAsync();

                foreach (var di in dishIngredients)
                {
                    di.Ingredient.CurrentStock += di.QuantityNeeded * item.Quantity;
                }
            }
            await _context.SaveChangesAsync();

            await OrderHelper.CheckAndUpdateDishAvailabilityAsync(_context, _hubContext);
            await _hubContext.Clients.Group("management").SendAsync("StockChanged", new { });
        }

        // If order is Paid or Cancelled, check if table can be set back to Available
        if (order.Status == OrderStatus.Paid || order.Status == OrderStatus.Cancelled)
        {
            await OrderHelper.TryFreeTableAsync(order.TableId, order.Id, _orderRepo, _tableRepo, _hubContext);
        }

        // Notify table and management
        var orderDto = OrderHelper.MapToDto(order);
        await _hubContext.Clients.Group($"table-{order.TableNumber}").SendAsync("OrderStatusChanged", orderDto);
        await _hubContext.Clients.Group("management").SendAsync("OrderStatusChanged", orderDto);

        return Ok(ApiResponse<OrderDto>.Success(orderDto, "Status updated"));
    }

    [HttpPost("orders/{id}/payment-qr")]
    public async Task<IActionResult> GeneratePaymentQR(int id)
    {
        var order = await _orderRepo.GetWithItemsAsync(id);
        if (order == null) return NotFound(ApiResponse<object>.Fail("Order not found", 404));

        var vietQR = _configuration.GetSection("VietQR");
        var client = _httpClientFactory.CreateClient();

        var requestBody = new
        {
            accountNo = vietQR["AccountNo"],
            accountName = vietQR["AccountName"],
            acqId = int.Parse(vietQR["AcqId"]!),
            amount = (int)order.TotalPrice,
            addInfo = $"DH{order.Id} Ban{order.TableNumber}",
            format = "text",
            template = "compact2"
        };

        var request = new HttpRequestMessage(HttpMethod.Post, "https://api.vietqr.io/v2/generate");
        request.Headers.Add("x-client-id", vietQR["ClientId"]);
        request.Headers.Add("x-api-key", vietQR["ApiKey"]);
        request.Content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

        var response = await client.SendAsync(request);
        var responseContent = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
            return BadRequest(ApiResponse<object>.Fail("Failed to generate VietQR"));

        var qrResponse = JsonSerializer.Deserialize<JsonElement>(responseContent);
        var code = qrResponse.GetProperty("code").GetString();
        if (code != "00")
            return BadRequest(ApiResponse<object>.Fail("VietQR API error"));

        var data = qrResponse.GetProperty("data");
        var qrDataURL = data.GetProperty("qrDataURL").GetString();
        var qrCode = data.GetProperty("qrCode").GetString();

        return Ok(ApiResponse<object>.Success(new
        {
            qrDataURL,
            qrCode,
            orderId = order.Id,
            amount = (int)order.TotalPrice,
            addInfo = $"DH{order.Id} Ban{order.TableNumber}"
        }));
    }

    [Authorize(Roles = "Owner,Employee")]
    [HttpDelete("orders/{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var order = await _orderRepo.GetWithItemsAsync(id);
        if (order == null) return NotFound(ApiResponse<object>.Fail("Order not found", 404));

        if (order.Status == OrderStatus.Paid)
            return BadRequest(ApiResponse<object>.Fail("Không thể xóa đơn hàng đã thanh toán"));

        await _orderRepo.DeleteAsync(order);

        await OrderHelper.TryFreeTableAsync(order.TableId, order.Id, _orderRepo, _tableRepo, _hubContext);

        return Ok(ApiResponse<object>.Success(null!, "Order deleted"));
    }
}
