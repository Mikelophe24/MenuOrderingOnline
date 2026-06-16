using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using OnlineMenu.API.Extensions;
using OnlineMenu.API.Hubs;
using Microsoft.EntityFrameworkCore;
using OnlineMenu.Core.Enums;
using OnlineMenu.Core.Interfaces.Repositories;
using OnlineMenu.Infrastructure.Data;

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
    private readonly AppDbContext _context;

    public PaymentController(
        IOrderRepository orderRepo,
        ITableRepository tableRepo,
        IHubContext<OrderHub> hubContext,
        IConfiguration configuration,
        ILogger<PaymentController> logger,
        AppDbContext context)
    {
        _orderRepo = orderRepo;
        _tableRepo = tableRepo;
        _hubContext = hubContext;
        _configuration = configuration;
        _logger = logger;
        _context = context;
    }

    /// <summary>
    /// Webhook endpoint for SePay (https://sepay.vn) to notify of incoming bank transfers.
    /// SePay sends one transaction per request:
    ///   { "content": "...", "transferAmount": 50000, "transferType": "in", "code": null }
    /// and authenticates with header `Authorization: Apikey {SePay:ApiKey}`.
    /// When the order code (DH{id}) is matched and the amount is sufficient,
    /// the order is automatically marked as Paid.
    /// </summary>
    [HttpPost("webhook")]
    public async Task<IActionResult> SePayWebhook([FromBody] JsonElement body)
    {
        // Verify API key - SePay sends it as `Authorization: Apikey <key>`.
        var expectedKey = _configuration["SePay:ApiKey"];
        if (string.IsNullOrEmpty(expectedKey))
        {
            _logger.LogError("SePay webhook: SePay:ApiKey is not configured. Rejecting request.");
            return StatusCode(503, new { message = "Webhook not configured" });
        }

        var authHeader = Request.Headers["Authorization"].FirstOrDefault();
        var providedKey = authHeader?.Replace("Apikey ", "", StringComparison.OrdinalIgnoreCase).Trim();

        if (providedKey != expectedKey)
        {
            _logger.LogWarning("SePay webhook: invalid API key (Authorization header {State})",
                string.IsNullOrEmpty(authHeader) ? "missing" : "present but mismatched");
            return Unauthorized();
        }

        // Only auto-confirm incoming money (transferType = "in").
        var transferType = body.TryGetProperty("transferType", out var tt) ? tt.GetString() : "in";
        if (!string.Equals(transferType, "in", StringComparison.OrdinalIgnoreCase))
            return Ok(new { success = true });

        var amount = body.TryGetProperty("transferAmount", out var amt) ? ReadAmount(amt) : 0;

        // Order code lives in the transfer content (e.g. "DH5 Ban3").
        // Fall back to SePay's parsed "code" field when content has no DH code.
        var content = body.TryGetProperty("content", out var c) ? c.GetString() ?? "" : "";
        var description = content;
        if (!Regex.IsMatch(description, @"DH\d+", RegexOptions.IgnoreCase)
            && body.TryGetProperty("code", out var code) && code.ValueKind == JsonValueKind.String)
        {
            description = code.GetString() ?? description;
        }

        _logger.LogInformation("SePay webhook received: content='{Content}', amount={Amount}", content, amount);

        // Parse order ID from description (e.g. "DH5 Ban3" or "DH5")
        var match = Regex.Match(description, @"DH(\d+)", RegexOptions.IgnoreCase);
        if (!match.Success)
        {
            _logger.LogWarning("SePay webhook: no order code (DHxxx) found in '{Description}'", description);
            return Ok(new { success = true });
        }

        var orderId = int.Parse(match.Groups[1].Value);
        var order = await _orderRepo.GetWithItemsAsync(orderId);

        if (order == null)
        {
            _logger.LogWarning("SePay webhook: order {OrderId} not found", orderId);
            return Ok(new { success = true });
        }

        if (order.Status == OrderStatus.Paid || order.Status == OrderStatus.Cancelled)
        {
            _logger.LogInformation("SePay webhook: order {OrderId} already {Status}", orderId, order.Status);
            return Ok(new { success = true });
        }

        // Verify the transferred amount covers the order total.
        if (amount < (int)order.TotalPrice)
        {
            _logger.LogWarning("SePay webhook: amount mismatch for order {OrderId}. Expected {Expected}, got {Actual}",
                orderId, (int)order.TotalPrice, amount);
            return Ok(new { success = true });
        }

        // Atomic status update: only mark as Paid if not already Paid/Cancelled.
        // This prevents race conditions from duplicate webhook calls.
        var updated = await _context.Orders
            .Where(o => o.Id == orderId && o.Status != OrderStatus.Paid && o.Status != OrderStatus.Cancelled)
            .ExecuteUpdateAsync(s => s
                .SetProperty(o => o.Status, OrderStatus.Paid)
                .SetProperty(o => o.UpdatedAt, DateTime.UtcNow));

        if (updated == 0)
        {
            _logger.LogInformation("SePay webhook: order {OrderId} already processed (race condition avoided)", orderId);
            return Ok(new { success = true });
        }

        // Update in-memory object to match DB state before broadcasting.
        order.Status = OrderStatus.Paid;
        order.UpdatedAt = DateTime.UtcNow;

        await OrderHelper.TryFreeTableAsync(order.TableId, order.Id, _orderRepo, _tableRepo, _hubContext);

        // Notify via SignalR
        var orderDto = OrderHelper.MapToDto(order);
        await _hubContext.Clients.Group("management").SendAsync("PaymentReceived", orderDto);
        await _hubContext.Clients.Group("management").SendAsync("OrderStatusChanged", orderDto);
        await _hubContext.Clients.Group($"table-{order.TableNumber}").SendAsync("OrderStatusChanged", orderDto);

        _logger.LogInformation("Order {OrderId} auto-marked as Paid via SePay bank transfer", orderId);

        return Ok(new { success = true });
    }

    // Reads a JSON amount that may be an integer, a decimal, or a numeric string.
    private static int ReadAmount(JsonElement el)
    {
        if (el.ValueKind == JsonValueKind.Number)
            return el.TryGetInt32(out var i) ? i : (int)el.GetDecimal();
        if (el.ValueKind == JsonValueKind.String && decimal.TryParse(el.GetString(), out var d))
            return (int)d;
        return 0;
    }
}
