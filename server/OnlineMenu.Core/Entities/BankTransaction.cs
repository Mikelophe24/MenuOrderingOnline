namespace OnlineMenu.Core.Entities;

/// <summary>
/// A bank transaction recorded from a SePay webhook (incoming money / "tiền vào").
/// Stored for the income log ("Sổ thu") and to give the webhook idempotency
/// via the unique <see cref="SePayId"/>.
/// </summary>
public class BankTransaction : BaseEntity
{
    /// <summary>SePay's own transaction id. Unique — used to ignore duplicate webhooks.</summary>
    public long SePayId { get; set; }

    /// <summary>Bank brand reported by SePay, e.g. "TPBank".</summary>
    public string? Gateway { get; set; }

    /// <summary>Receiving bank account number.</summary>
    public string? AccountNumber { get; set; }

    public decimal Amount { get; set; }

    /// <summary>"in" (money received) or "out" (money sent). We only persist "in".</summary>
    public string TransferType { get; set; } = "in";

    /// <summary>Raw transfer content/description.</summary>
    public string? Content { get; set; }

    /// <summary>Payment code SePay parsed out of the content (fallback for order matching).</summary>
    public string? Code { get; set; }

    /// <summary>Bank reference code.</summary>
    public string? ReferenceCode { get; set; }

    /// <summary>Bank-reported transaction time (stored in UTC).</summary>
    public DateTime TransactionDate { get; set; }

    /// <summary>Order this transfer was matched to via the DH code, if any. Soft reference (no FK).</summary>
    public int? MatchedOrderId { get; set; }
}
