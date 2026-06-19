using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OnlineMenu.Application.DTOs;
using OnlineMenu.Application.DTOs.Transactions;
using OnlineMenu.Core.Entities;
using OnlineMenu.Infrastructure.Data;

namespace OnlineMenu.API.Controllers;

[ApiController]
[Route("api/transactions")]
[Authorize(Roles = "Manager,Employee")]
public class TransactionsController : ControllerBase
{
    private readonly AppDbContext _context;

    public TransactionsController(AppDbContext context)
    {
        _context = context;
    }

    private static BankTransactionDto MapToDto(BankTransaction t) => new(
        t.Id, t.SePayId, t.Gateway, t.AccountNumber, t.Amount, t.TransferType,
        t.Content, t.Code, t.MatchedOrderId, t.TransactionDate, t.CreatedAt
    );

    /// <summary>Paginated income log ("Sổ thu"), newest first.</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int limit = 20,
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null)
    {
        if (page < 1) page = 1;
        if (limit < 1 || limit > 100) limit = 20;

        var query = _context.BankTransactions.AsNoTracking().AsQueryable();

        if (fromDate != null)
            query = query.Where(t => t.CreatedAt >= fromDate);
        if (toDate != null)
            query = query.Where(t => t.CreatedAt <= toDate);

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderByDescending(t => t.CreatedAt)
            .Skip((page - 1) * limit)
            .Take(limit)
            .Select(t => MapToDto(t))
            .ToListAsync();

        return Ok(ApiResponse<PaginatedResponse<BankTransactionDto>>.Success(
            new PaginatedResponse<BankTransactionDto>
            {
                Data = items,
                TotalItems = totalCount,
                CurrentPage = page,
                TotalPages = (int)Math.Ceiling(totalCount / (double)limit),
                PageSize = limit,
            }
        ));
    }

    /// <summary>Today's received total + count (Vietnam time), for the "Sổ thu" header.</summary>
    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary()
    {
        // "Today" in Vietnam (UTC+7), expressed as a UTC window over CreatedAt.
        var startUtc = DateTime.UtcNow.AddHours(7).Date.AddHours(-7);
        var endUtc = startUtc.AddDays(1);

        var todayQuery = _context.BankTransactions
            .AsNoTracking()
            .Where(t => t.CreatedAt >= startUtc && t.CreatedAt < endUtc);

        var todayTotal = await todayQuery.SumAsync(t => (decimal?)t.Amount) ?? 0m;
        var todayCount = await todayQuery.CountAsync();

        return Ok(ApiResponse<TransactionSummaryDto>.Success(
            new TransactionSummaryDto(todayTotal, todayCount)
        ));
    }
}
