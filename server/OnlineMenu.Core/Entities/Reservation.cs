using OnlineMenu.Core.Enums;

namespace OnlineMenu.Core.Entities;

public class Reservation : BaseEntity
{
    public string GuestName { get; set; } = string.Empty;
    public string GuestPhone { get; set; } = string.Empty;
    public int PartySize { get; set; }
    public DateTime ReservationTime { get; set; }
    public string? Note { get; set; }

    public ReservationStatus Status { get; set; } = ReservationStatus.Pending;

    public int? TableId { get; set; }
    public Table? Table { get; set; }

    public int? ProcessedById { get; set; }
    public Account? ProcessedBy { get; set; }
}
