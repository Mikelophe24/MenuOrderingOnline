using System.Globalization;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using OnlineMenu.API.Extensions;
using OnlineMenu.API.Hubs;
using Microsoft.EntityFrameworkCore;
using OnlineMenu.Core.Entities;
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
    /// SePay sends one transaction per request, e.g.
    ///   { "id": 92704, "gateway": "TPBank", "transactionDate": "2026-06-18 14:02:37",
    ///     "accountNumber": "...", "content": "DH5 Ban3", "transferType": "in",
    ///     "transferAmount": 150000, "code": null, "referenceCode": "..." }
    /// and authenticates with header `Authorization: Apikey {SePay:ApiKey}`.
    ///
    /// EVERY incoming ("in") transfer is recorded in BankTransactions and announced to the
    /// management UI via the "MoneyReceived" event (the "loa báo thu"). When the content also
    /// carries an order code (DH{id}) and covers the order total, the order is marked Paid.
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

        // Only record/announce incoming money (transferType = "in").
        var transferType = body.TryGetProperty("transferType", out var tt) ? tt.GetString() : "in";
        if (!string.Equals(transferType, "in", StringComparison.OrdinalIgnoreCase))
            return Ok(new { success = true });

        // ----- Parse the SePay payload -----
        var sePayId = body.TryGetProperty("id", out var idEl) ? ReadLong(idEl) : 0;
        var amount = body.TryGetProperty("transferAmount", out var amt) ? ReadAmount(amt) : 0;
        var content = body.TryGetProperty("content", out var c) ? c.GetString() ?? "" : "";
        var gateway = body.TryGetProperty("gateway", out var g) ? g.GetString() : null;
        var accountNumber = body.TryGetProperty("accountNumber", out var an) ? an.GetString() : null;
        var referenceCode = body.TryGetProperty("referenceCode", out var rc) ? rc.GetString() : null;
        var sePayCode = body.TryGetProperty("code", out var codeEl) && codeEl.ValueKind == JsonValueKind.String
            ? codeEl.GetString() : null;
        var transactionDate = body.TryGetProperty("transactionDate", out var td)
            ? ParseTransactionDate(td.GetString()) : DateTime.UtcNow;

        // Idempotency: SePay may retry. Ignore a transaction we have already stored.
        if (sePayId > 0 && await _context.BankTransactions.AnyAsync(t => t.SePayId == sePayId))
        {
            _logger.LogInformation("SePay webhook: transaction {SePayId} already recorded, skipping", sePayId);
            return Ok(new { success = true });
        }

        _logger.LogInformation("SePay webhook received: content='{Content}', amount={Amount}", content, amount);

        // ----- Try to match an order via the DH code in the content (fallback to SePay's code) -----
        var description = content;
        if (!Regex.IsMatch(description, @"DH\d+", RegexOptions.IgnoreCase) && !string.IsNullOrEmpty(sePayCode))
            description = sePayCode;

        Order? referencedOrder = null;
        var match = Regex.Match(description, @"DH(\d+)", RegexOptions.IgnoreCase);
        if (match.Success)
        {
            var orderId = int.Parse(match.Groups[1].Value);
            referencedOrder = await _orderRepo.GetWithItemsAsync(orderId);
            if (referencedOrder == null)
                _logger.LogWarning("SePay webhook: order {OrderId} not found", orderId);
        }

        // ----- Record the transaction (unique SePayId index also guards duplicate webhooks) -----
        var transaction = new BankTransaction
        {
            SePayId = sePayId,
            Gateway = gateway,
            AccountNumber = accountNumber,
            Amount = amount,
            TransferType = "in",
            Content = content,
            Code = sePayCode,
            ReferenceCode = referenceCode,
            TransactionDate = transactionDate,
            MatchedOrderId = referencedOrder?.Id,
        };
        _context.BankTransactions.Add(transaction);
        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            // Lost a race against a duplicate webhook (unique SePayId). Already recorded → done.
            _logger.LogInformation("SePay webhook: transaction {SePayId} recorded concurrently, skipping", sePayId);
            return Ok(new { success = true });
        }

        // ----- If the transfer covers an open order, mark it Paid -----
        int? paidOrderId = null;
        int? paidTableNumber = null;

        if (referencedOrder != null
            && referencedOrder.Status != OrderStatus.Paid
            && referencedOrder.Status != OrderStatus.Cancelled
            && amount >= (int)referencedOrder.TotalPrice)
        {
            // Atomic update: only mark Paid if still open. Prevents double-processing.
            var updated = await _context.Orders
                .Where(o => o.Id == referencedOrder.Id && o.Status != OrderStatus.Paid && o.Status != OrderStatus.Cancelled)
                .ExecuteUpdateAsync(s => s
                    .SetProperty(o => o.Status, OrderStatus.Paid)
                    .SetProperty(o => o.UpdatedAt, DateTime.UtcNow));

            if (updated > 0)
            {
                referencedOrder.Status = OrderStatus.Paid;
                referencedOrder.UpdatedAt = DateTime.UtcNow;
                paidOrderId = referencedOrder.Id;
                paidTableNumber = referencedOrder.TableNumber;

                await OrderHelper.TryFreeTableAsync(referencedOrder.TableId, referencedOrder.Id, _orderRepo, _tableRepo, _hubContext);

                var orderDto = OrderHelper.MapToDto(referencedOrder);
                await _hubContext.Clients.Group("management").SendAsync("PaymentReceived", orderDto);
                await _hubContext.Clients.Group("management").SendAsync("OrderStatusChanged", orderDto);
                await _hubContext.Clients.Group($"table-{referencedOrder.TableNumber}").SendAsync("OrderStatusChanged", orderDto);

                _logger.LogInformation("Order {OrderId} auto-marked as Paid via SePay bank transfer", referencedOrder.Id);
            }
        }
        else if (referencedOrder != null && amount < (int)referencedOrder.TotalPrice)
        {
            _logger.LogWarning("SePay webhook: amount {Actual} insufficient for order {OrderId} (needs {Expected})",
                amount, referencedOrder.Id, (int)referencedOrder.TotalPrice);
        }

        // ----- Announce the incoming money to the management UI (single voice/toast source) -----
        await _hubContext.Clients.Group("management").SendAsync("MoneyReceived", new
        {
            transactionId = transaction.Id,
            amount,
            content,
            gateway,
            transactionDate,
            matchedOrderId = paidOrderId,
            tableNumber = paidTableNumber,
        });

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

    // Reads a JSON id that may be an integer or a numeric string.
    private static long ReadLong(JsonElement el)
    {
        if (el.ValueKind == JsonValueKind.Number)
            return el.TryGetInt64(out var l) ? l : (long)el.GetDecimal();
        if (el.ValueKind == JsonValueKind.String && long.TryParse(el.GetString(), out var d))
            return d;
        return 0;
    }

    // SePay sends transactionDate as Vietnam local time ("yyyy-MM-dd HH:mm:ss"). Store it as UTC.
    private static DateTime ParseTransactionDate(string? raw)
    {
        if (!string.IsNullOrWhiteSpace(raw)
            && DateTime.TryParse(raw, CultureInfo.InvariantCulture, DateTimeStyles.None, out var local))
        {
            return DateTime.SpecifyKind(local.AddHours(-7), DateTimeKind.Utc);
        }
        return DateTime.UtcNow;
    }
}
