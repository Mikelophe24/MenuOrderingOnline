using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using OnlineMenu.API.Extensions;
using OnlineMenu.API.Hubs;
using OnlineMenu.Application.DTOs;
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
    /// Webhook endpoint for bank-transaction services (Casso, SePay) to notify of incoming transfers.
    /// When a matching transaction is found, auto-marks the order as Paid.
    /// Supports both Casso ({ data: [{ description, amount }] }) and
    /// SePay ({ content, transferAmount, transferType }) payload formats.
    /// </summary>
    [HttpPost("webhook")]
    [HttpPost("/webhook")]
    [HttpPost("/")]
    public async Task<IActionResult> PaymentWebhook([FromBody] JsonElement body)
    {
        // Verify webhook key - reject if not configured or not matching
        var expectedKey = _configuration["Casso:WebhookKey"];
        if (string.IsNullOrEmpty(expectedKey))
        {
            _logger.LogError("Payment webhook: Casso:WebhookKey is not configured. Rejecting request.");
            return StatusCode(503, new { message = "Webhook not configured" });
        }

        var secureToken = Request.Headers["Secure-Token"].FirstOrDefault();
        var authHeader = Request.Headers["Authorization"].FirstOrDefault();
        var providedKey = secureToken
            ?? authHeader?.Replace("Apikey ", "", StringComparison.OrdinalIgnoreCase).Trim()
            ?? authHeader?.Replace("Bearer ", "", StringComparison.OrdinalIgnoreCase).Trim();

        if (providedKey != expectedKey)
        {
            _logger.LogWarning("Payment webhook: invalid key");
            return Unauthorized();
        }

        // Build the list of incoming transactions from either Casso or SePay payload format.
        //   Casso: { "data": [ { "description": "...", "amount": 50000 }, ... ] }
        //   SePay: { "content": "...", "transferAmount": 50000, "transferType": "in" }
        var transactions = new List<(string Description, int Amount)>();

        if (body.TryGetProperty("data", out var dataArray) && dataArray.ValueKind == JsonValueKind.Array)
        {
            foreach (var t in dataArray.EnumerateArray())
            {
                var desc = t.TryGetProperty("description", out var d) ? d.GetString() ?? "" : "";
                var amt = t.TryGetProperty("amount", out var a) ? ReadAmount(a) : 0;
                transactions.Add((desc, amt));
            }
        }
        else if (body.TryGetProperty("transferAmount", out var sepayAmount))
        {
            // SePay sends one transaction per call; only auto-confirm incoming money.
            var transferType = body.TryGetProperty("transferType", out var tt) ? tt.GetString() : "in";
            if (string.Equals(transferType, "in", StringComparison.OrdinalIgnoreCase))
            {
                var desc = body.TryGetProperty("content", out var c) ? c.GetString() ?? "" : "";
                // Fall back to SePay's parsed "code" field if content has no DH code.
                if (!Regex.IsMatch(desc, @"DH\d+", RegexOptions.IgnoreCase)
                    && body.TryGetProperty("code", out var code) && code.ValueKind == JsonValueKind.String)
                {
                    desc = code.GetString() ?? desc;
                }
                transactions.Add((desc, ReadAmount(sepayAmount)));
            }
        }
        else
        {
            return Ok(new { success = true });
        }

        foreach (var (description, amount) in transactions)
        {
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

            // Atomic status update: only mark as Paid if not already Paid/Cancelled
            // This prevents race conditions from duplicate webhook calls
            var updated = await _context.Orders
                .Where(o => o.Id == orderId && o.Status != OrderStatus.Paid && o.Status != OrderStatus.Cancelled)
                .ExecuteUpdateAsync(s => s
                    .SetProperty(o => o.Status, OrderStatus.Paid)
                    .SetProperty(o => o.UpdatedAt, DateTime.UtcNow));

            if (updated == 0)
            {
                _logger.LogInformation("Payment webhook: order {OrderId} already processed (race condition avoided)", orderId);
                continue;
            }

            // Update in-memory object to match DB state before broadcasting
            order.Status = OrderStatus.Paid;
            order.UpdatedAt = DateTime.UtcNow;

            await OrderHelper.TryFreeTableAsync(order.TableId, order.Id, _orderRepo, _tableRepo, _hubContext);

            // Notify via SignalR
            var orderDto = OrderHelper.MapToDto(order);

            await _hubContext.Clients.Group("management").SendAsync("PaymentReceived", orderDto);
            await _hubContext.Clients.Group("management").SendAsync("OrderStatusChanged", orderDto);
            await _hubContext.Clients.Group($"table-{order.TableNumber}").SendAsync("OrderStatusChanged", orderDto);

            _logger.LogInformation("Order {OrderId} auto-marked as Paid via bank transfer", orderId);
        }

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
