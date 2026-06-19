namespace OnlineMenu.Application.DTOs.Transactions;

public record BankTransactionDto(
    int Id,
    long SePayId,
    string? Gateway,
    string? AccountNumber,
    decimal Amount,
    string TransferType,
    string? Content,
    string? Code,
    int? MatchedOrderId,
    DateTime TransactionDate,
    DateTime CreatedAt
);

/// <summary>Aggregated income figures for the "Sổ thu" header.</summary>
public record TransactionSummaryDto(
    decimal TodayTotal,
    int TodayCount
);
