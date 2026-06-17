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

    [Authorize(Roles = "Manager,Employee")]
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

    // Staff creates an order (no token needed)
    [Authorize(Roles = "Manager,Employee")]
    [HttpPost("orders")]
    public async Task<IActionResult> CreateStaffOrder([FromBody] CreateStaffOrderRequest request)
    {
        if (request.Items == null || request.Items.Count == 0)
            return BadRequest(ApiResponse<object>.Fail("Order must have at least one item"));

        if (request.Items.Any(i => i.Quantity <= 0))
            return BadRequest(ApiResponse<object>.Fail("Quantity must be greater than 0"));

        var table = await _tableRepo.GetByNumberAsync(request.TableNumber);
        if (table == null)
            return BadRequest(ApiResponse<object>.Fail("Bàn không tồn tại"));

        // Cảnh báo khi tạo đơn cho bàn đã được đặt trước (nhân viên có thể xác nhận tiếp tục với Force = true)
        if (table.Status == TableStatus.Reserved && !request.Force)
            return Conflict(ApiResponse<object>.Fail("Bàn đã được đặt trước. Bạn có chắc muốn tạo đơn cho bàn này?"));

        var dishIds = request.Items.Select(i => i.DishId).Distinct().ToList();
        var dishes = await _dishRepo.FindAsync(d => dishIds.Contains(d.Id));
        var dishMap = dishes.ToDictionary(d => d.Id);

        var dishIngredients = await _context.DishIngredients
            .Where(di => dishIds.Contains(di.DishId))
            .Include(di => di.Ingredient)
            .ToListAsync();

        foreach (var item in request.Items)
        {
            if (!dishMap.TryGetValue(item.DishId, out var dish) || dish.Status != DishStatus.Available)
            {
                var name = dish?.Name ?? $"Mã {item.DishId}";
                return BadRequest(ApiResponse<object>.Fail($"{name} hiện đang hết"));
            }

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
        }

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

        var userIdClaim = User.FindFirst("userId")?.Value;
        int.TryParse(userIdClaim, out var userId);

        // Check for existing active order at the same table → merge items (Pending first, then Processing, then Delivered)
        var existingOrders = await _orderRepo.GetByTableNumberAsync(request.TableNumber);
        var existingOrder = existingOrders.FirstOrDefault(o => o.Status == OrderStatus.Pending)
            ?? existingOrders.FirstOrDefault(o => o.Status == OrderStatus.Processing)
            ?? existingOrders.FirstOrDefault(o => o.Status == OrderStatus.Delivered);

        Order order;
        if (existingOrder != null)
        {
            foreach (var item in newItems)
            {
                item.OrderId = existingOrder.Id;
                existingOrder.OrderItems.Add(item);
            }
            await _context.SaveChangesAsync();

            await _context.Orders
                .Where(o => o.Id == existingOrder.Id)
                .ExecuteUpdateAsync(s => s
                    .SetProperty(o => o.TotalPrice, o => o.TotalPrice + addedPrice)
                    .SetProperty(o => o.UpdatedAt, DateTime.UtcNow));
            existingOrder.TotalPrice += addedPrice;

            if (userId > 0) existingOrder.ProcessedById = userId;
            order = existingOrder;
        }
        else
        {
            order = new Order
            {
                TableNumber = request.TableNumber,
                TableId = table.Id,
                GuestName = request.GuestName,
                Status = OrderStatus.Pending,
                TotalPrice = addedPrice,
            };
            foreach (var item in newItems) order.OrderItems.Add(item);
            if (userId > 0) order.ProcessedById = userId;
            await _orderRepo.AddAsync(order);
        }

        if (table.Status != TableStatus.Occupied)
        {
            table.Status = TableStatus.Occupied;
            await _tableRepo.UpdateAsync(table);
            await _hubContext.Clients.Group("management").SendAsync("TableStatusChanged",
                new { table.Id, table.Number, Status = table.Status.ToString() });
        }

        var orderDto = OrderHelper.MapToDto(order);
        await _hubContext.Clients.Group("management").SendAsync("NewOrder", orderDto);

        var itemsSummary = string.Join(", ", newItems.Select(i => $"{i.DishName} × {i.Quantity}"));
        var message = existingOrder != null
            ? $"Bàn {request.TableNumber} gọi thêm: {itemsSummary} (gộp vào đơn #{existingOrder.Id})"
            : $"Tạo đơn mới bàn {request.TableNumber}: {itemsSummary}";

        return CreatedAtAction(nameof(GetById), new { id = order.Id }, ApiResponse<OrderDto>.Success(orderDto, message, 201));
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

        // Defensive: if table is Occupied but has no active order, state is inconsistent
        // (could happen if staff manually set Occupied or leftover state). Block new guest order.
        if (table.Status == TableStatus.Occupied)
        {
            var ordersAtTable = await _orderRepo.GetByTableNumberAsync(request.TableNumber);
            var hasActiveOrder = ordersAtTable.Any(o =>
                o.Status == OrderStatus.Pending ||
                o.Status == OrderStatus.Processing ||
                o.Status == OrderStatus.Delivered);
            if (!hasActiveOrder)
                return BadRequest(ApiResponse<object>.Fail(
                    "Bàn đang được sử dụng nhưng không có đơn hàng. Vui lòng gọi nhân viên hỗ trợ."));
        }

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
            {
                var name = dish?.Name ?? $"Mã {item.DishId}";
                return BadRequest(ApiResponse<object>.Fail($"{name} hiện đang hết"));
            }

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

        // Check if guest already has an active order at this table → add items to it
        var existingOrders = await _orderRepo.GetByTableNumberAsync(request.TableNumber);
        var existingOrder = existingOrders.FirstOrDefault(o =>
            o.Status == OrderStatus.Pending && o.GuestName == request.GuestName)
            ?? existingOrders.FirstOrDefault(o =>
            o.Status == OrderStatus.Processing && o.GuestName == request.GuestName)
            ?? existingOrders.FirstOrDefault(o =>
            o.Status == OrderStatus.Delivered && o.GuestName == request.GuestName);

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
            await _context.SaveChangesAsync();

            // FIX #2: Atomic price update — prevents lost updates from concurrent requests
            await _context.Orders
                .Where(o => o.Id == existingOrder.Id)
                .ExecuteUpdateAsync(s => s
                    .SetProperty(o => o.TotalPrice, o => o.TotalPrice + addedPrice)
                    .SetProperty(o => o.UpdatedAt, DateTime.UtcNow));
            existingOrder.TotalPrice += addedPrice;
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

        var guestLabel = !string.IsNullOrEmpty(request.GuestName) ? request.GuestName : "Khách";
        var itemsSummary = string.Join(", ", newItems.Select(i => $"{i.DishName} × {i.Quantity}"));
        var message = existingOrder != null
            ? $"{guestLabel} bàn {request.TableNumber} gọi thêm: {itemsSummary} (gộp vào đơn #{existingOrder.Id})"
            : $"{guestLabel} bàn {request.TableNumber} đặt: {itemsSummary}";

        return CreatedAtAction(nameof(GetById), new { id = order.Id }, ApiResponse<OrderDto>.Success(orderDto, message, 201));
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

    [Authorize(Roles = "Manager,Employee")]
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
        {
            var statusNames = new Dictionary<OrderStatus, string>
            {
                { OrderStatus.Pending, "Chờ xác nhận" },
                { OrderStatus.Processing, "Đang xử lý" },
                { OrderStatus.Delivered, "Đã giao" },
                { OrderStatus.Paid, "Đã thanh toán" },
                { OrderStatus.Cancelled, "Đã hủy" },
            };
            var fromName = statusNames.GetValueOrDefault(previousStatus, previousStatus.ToString());
            var toName = statusNames.GetValueOrDefault(newStatus, newStatus.ToString());
            var allowedNames = allowed.Select(s => statusNames.GetValueOrDefault(s, s.ToString()));
            var hint = allowed.Length > 0
                ? $". Chỉ có thể chuyển sang: {string.Join(", ", allowedNames)}"
                : ". Trạng thái này không thể thay đổi";
            return BadRequest(ApiResponse<object>.Fail($"Không thể chuyển từ \"{fromName}\" sang \"{toName}\"{hint}"));
        }

        var userIdClaim = User.FindFirst("userId")?.Value;
        int.TryParse(userIdClaim, out var userId);

        // FIX #1: Transaction + atomic conditional update to prevent race condition
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            // Atomic: only succeeds if status hasn't changed since we read it
            var updated = await _context.Orders
                .Where(o => o.Id == id && o.Status == previousStatus)
                .ExecuteUpdateAsync(s => s
                    .SetProperty(o => o.Status, newStatus)
                    .SetProperty(o => o.UpdatedAt, DateTime.UtcNow));

            if (updated == 0)
                return Conflict(ApiResponse<object>.Fail("Đơn hàng đã được cập nhật bởi người khác, vui lòng tải lại"));

            if (userId > 0)
            {
                await _context.Orders.Where(o => o.Id == id)
                    .ExecuteUpdateAsync(s => s.SetProperty(o => o.ProcessedById, userId));
            }

            // Deduct stock when transitioning INTO Processing
            if (newStatus == OrderStatus.Processing && previousStatus != OrderStatus.Processing)
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
            }

            // FIX #5: Restore stock when cancelling from Processing OR Delivered
            if (newStatus == OrderStatus.Cancelled
                && (previousStatus == OrderStatus.Processing || previousStatus == OrderStatus.Delivered))
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
            }

            await transaction.CommitAsync();
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }

        // Update in-memory object for SignalR broadcast (after transaction committed)
        order.Status = newStatus;
        order.UpdatedAt = DateTime.UtcNow;
        if (userId > 0) order.ProcessedById = userId;

        // Notify stock changes outside transaction
        if (newStatus == OrderStatus.Processing
            || (newStatus == OrderStatus.Cancelled
                && (previousStatus == OrderStatus.Processing || previousStatus == OrderStatus.Delivered)))
        {
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

    [Authorize(Roles = "Manager,Employee")]
    [HttpPatch("orders/{id}/items")]
    public async Task<IActionResult> UpdateOrderItems(int id, [FromBody] UpdateOrderItemsRequest request)
    {
        if (request.Items == null || request.Items.Count == 0)
            return BadRequest(ApiResponse<object>.Fail("Danh sách món không được trống"));

        if (request.Items.Any(i => i.Quantity < 0))
            return BadRequest(ApiResponse<object>.Fail("Số lượng không được âm"));

        var order = await _orderRepo.GetWithItemsAsync(id);
        if (order == null) return NotFound(ApiResponse<object>.Fail("Order not found", 404));

        if (order.Status != OrderStatus.Pending && order.Status != OrderStatus.Processing)
            return BadRequest(ApiResponse<object>.Fail("Chỉ có thể sửa đơn hàng đang chờ xử lý hoặc đang xử lý"));

        var previousStatus = order.Status;

        // Build lookup of current items
        var currentItems = order.OrderItems.ToDictionary(oi => oi.Id);

        var itemsToRemove = new List<OrderItem>();
        var itemsToUpdate = new List<(OrderItem item, int oldQty, int newQty)>();

        foreach (var entry in request.Items)
        {
            if (!currentItems.TryGetValue(entry.OrderItemId, out var item))
                return BadRequest(ApiResponse<object>.Fail($"Món #{entry.OrderItemId} không tồn tại trong đơn này"));

            if (entry.Quantity == 0)
                itemsToRemove.Add(item);
            else if (entry.Quantity != item.Quantity)
                itemsToUpdate.Add((item, item.Quantity, entry.Quantity));
        }

        if (itemsToRemove.Count == order.OrderItems.Count && itemsToUpdate.Count == 0)
            return BadRequest(ApiResponse<object>.Fail("Không thể xóa hết tất cả món. Hãy xóa đơn hàng thay vì xóa từng món"));

        // Check stock for quantity increases (matters if order is Processing or Delivered — stock already deducted)
        var stockDeducted = previousStatus == OrderStatus.Processing;
        if (stockDeducted)
        {
            foreach (var (item, oldQty, newQty) in itemsToUpdate)
            {
                if (newQty > oldQty)
                {
                    var extraQty = newQty - oldQty;
                    var dishIngredients = await _context.DishIngredients
                        .Where(di => di.DishId == item.DishId)
                        .Include(di => di.Ingredient)
                        .ToListAsync();

                    foreach (var di in dishIngredients)
                    {
                        var maxExtra = di.QuantityNeeded > 0
                            ? (int)Math.Floor(di.Ingredient.CurrentStock / di.QuantityNeeded)
                            : int.MaxValue;
                        if (extraQty > maxExtra)
                            return BadRequest(ApiResponse<object>.Fail(
                                $"{item.DishName} chỉ còn đủ nguyên liệu thêm {maxExtra} phần"));
                    }
                }
            }
        }

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            // Adjust stock for orders where stock was already deducted (Processing/Delivered)
            if (stockDeducted)
            {
                // Restore stock for removed items
                foreach (var item in itemsToRemove)
                {
                    var dishIngredients = await _context.DishIngredients
                        .Where(di => di.DishId == item.DishId)
                        .Include(di => di.Ingredient)
                        .ToListAsync();
                    foreach (var di in dishIngredients)
                        di.Ingredient.CurrentStock += di.QuantityNeeded * item.Quantity;
                }

                // Adjust stock for quantity changes
                foreach (var (item, oldQty, newQty) in itemsToUpdate)
                {
                    var diff = newQty - oldQty;
                    var dishIngredients = await _context.DishIngredients
                        .Where(di => di.DishId == item.DishId)
                        .Include(di => di.Ingredient)
                        .ToListAsync();
                    foreach (var di in dishIngredients)
                    {
                        di.Ingredient.CurrentStock -= di.QuantityNeeded * diff;
                        if (di.Ingredient.CurrentStock < 0) di.Ingredient.CurrentStock = 0;
                    }
                }
            }

            // Remove items
            foreach (var item in itemsToRemove)
            {
                order.OrderItems.Remove(item);
                _context.Set<OrderItem>().Remove(item);
            }

            // Update quantities
            foreach (var (item, _, newQty) in itemsToUpdate)
                item.Quantity = newQty;

            // Recalculate total price
            order.TotalPrice = order.OrderItems.Sum(oi => oi.DishPrice * oi.Quantity);
            order.UpdatedAt = DateTime.UtcNow;

            var userIdClaim = User.FindFirst("userId")?.Value;
            if (int.TryParse(userIdClaim, out var userId) && userId > 0)
                order.ProcessedById = userId;

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }

        // Notify stock changes
        if (stockDeducted && (itemsToRemove.Count > 0 || itemsToUpdate.Count > 0))
        {
            await OrderHelper.CheckAndUpdateDishAvailabilityAsync(_context, _hubContext);
            await _hubContext.Clients.Group("management").SendAsync("StockChanged", new { });
        }

        var orderDto = OrderHelper.MapToDto(order);
        await _hubContext.Clients.Group($"table-{order.TableNumber}").SendAsync("OrderStatusChanged", orderDto);
        await _hubContext.Clients.Group("management").SendAsync("OrderStatusChanged", orderDto);

        return Ok(ApiResponse<OrderDto>.Success(orderDto, "Cập nhật đơn hàng thành công"));
    }

    [Authorize(Roles = "Manager")]
    [HttpDelete("orders/{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var order = await _orderRepo.GetWithItemsAsync(id);
        if (order == null) return NotFound(ApiResponse<object>.Fail("Order not found", 404));

        // Chi cho phep xoa khi don dang cho xac nhan (Pending) - cac trang thai khac da phat sinh nghiep vu
        if (order.Status != OrderStatus.Pending)
            return BadRequest(ApiResponse<object>.Fail("Chỉ có thể xóa đơn hàng đang ở trạng thái chờ xác nhận"));

        await _orderRepo.DeleteAsync(order);

        await OrderHelper.TryFreeTableAsync(order.TableId, order.Id, _orderRepo, _tableRepo, _hubContext);

        return Ok(ApiResponse<object>.Success(null!, "Order deleted"));
    }
}
