using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using OnlineMenu.API.Hubs;
using OnlineMenu.Application.DTOs;
using OnlineMenu.Application.DTOs.Orders;
using OnlineMenu.Core.Enums;
using OnlineMenu.Core.Interfaces.Repositories;

namespace OnlineMenu.API.Controllers;

[ApiController]
[Route("api/payment")]
public class PaymentController : ControllerBase
{
    private readonly IOrderRepository _orderRepo;
    private readonly ITableRepository _tableRepo;
    private readonly IHubContext<OrderHub> _hubContext;
    private readonly IConfiguration _configuration;
    private readonly ILogger<PaymentController> _logger;

    public PaymentController(
        IOrderRepository orderRepo,
        ITableRepository tableRepo,
        IHubContext<OrderHub> hubContext,
        IConfiguration configuration,
        ILogger<PaymentController> logger)
    {
        _orderRepo = orderRepo;
        _tableRepo = tableRepo;
        _hubContext = hubContext;
        _configuration = configuration;
        _logger = logger;
    }

    /// <summary>
    /// Webhook endpoint for Casso.vn to notify of incoming bank transactions.
    /// When a matching transaction is found, auto-marks the order as Paid.
    /// </summary>
    [HttpPost("webhook")]
    [HttpPost("/webhook")]
    [HttpPost("/")]
    public async Task<IActionResult> CassoWebhook([FromBody] JsonElement body)
    {
        // Verify webhook key - Casso sends it in "Secure-Token" or "Authorization" header
        var expectedKey = _configuration["Casso:WebhookKey"];
        if (!string.IsNullOrEmpty(expectedKey))
        {
            var secureToken = Request.Headers["Secure-Token"].FirstOrDefault();
            var authHeader = Request.Headers["Authorization"].FirstOrDefault();
            var providedKey = secureToken
                ?? authHeader?.Replace("Apikey ", "", StringComparison.OrdinalIgnoreCase).Trim()
                ?? authHeader?.Replace("Bearer ", "", StringComparison.OrdinalIgnoreCase).Trim();

            _logger.LogInformation("Webhook headers - Secure-Token: {SecureToken}, Authorization: {Auth}", secureToken, authHeader);

            if (providedKey != expectedKey)
            {
                _logger.LogWarning("Payment webhook: invalid key. Expected: {Expected}, Got: {Got}", expectedKey, providedKey);
                return Unauthorized();
            }
        }

        if (!body.TryGetProperty("data", out var dataArray))
            return Ok(new { success = true });

        foreach (var transaction in dataArray.EnumerateArray())
        {
            var description = transaction.GetProperty("description").GetString() ?? "";
            var amount = transaction.GetProperty("amount").GetInt32();

            _logger.LogInformation("Payment webhook received: {Description}, Amount: {Amount}", description, amount);

            // Parse order ID from description (e.g. "DH5 Ban3" or "DH5")
            var match = Regex.Match(description, @"DH(\d+)", RegexOptions.IgnoreCase);
            if (!match.Success) continue;

            var orderId = int.Parse(match.Groups[1].Value);
            var order = await _orderRepo.GetWithItemsAsync(orderId);

            if (order == null)
            {
                _logger.LogWarning("Payment webhook: order {OrderId} not found", orderId);
                continue;
            }

            if (order.Status == OrderStatus.Paid || order.Status == OrderStatus.Cancelled)
            {
                _logger.LogInformation("Payment webhook: order {OrderId} already {Status}", orderId, order.Status);
                continue;
            }

            // Verify amount matches
            if (amount < (int)order.TotalPrice)
            {
                _logger.LogWarning("Payment webhook: amount mismatch for order {OrderId}. Expected {Expected}, got {Actual}",
                    orderId, (int)order.TotalPrice, amount);
                continue;
            }

            // Mark order as Paid
            order.Status = OrderStatus.Paid;
            await _orderRepo.UpdateAsync(order);

            // Free table if no more active orders
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

            // Notify via SignalR
            var orderDto = new OrderDto(
                order.Id, order.TableNumber, order.GuestName, order.Status.ToString(),
                order.TotalPrice, order.ProcessedBy?.Name,
                order.OrderItems.Select(oi => new OrderItemDto(
                    oi.Id, oi.DishId, oi.Dish?.Name ?? "", oi.Dish?.Price ?? 0,
                    oi.Dish?.Image, oi.Quantity, oi.Note
                )).ToList(),
                order.CreatedAt, order.UpdatedAt
            );

            await _hubContext.Clients.Group("management").SendAsync("PaymentReceived", orderDto);
            await _hubContext.Clients.Group("management").SendAsync("OrderStatusChanged", orderDto);
            await _hubContext.Clients.Group($"table-{order.TableNumber}").SendAsync("OrderStatusChanged", orderDto);

            _logger.LogInformation("Order {OrderId} auto-marked as Paid via bank transfer", orderId);
        }

        return Ok(new { success = true });
    }
}
