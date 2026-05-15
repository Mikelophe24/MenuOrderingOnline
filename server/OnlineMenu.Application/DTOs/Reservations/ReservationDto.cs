namespace OnlineMenu.Application.DTOs.Reservations;

public record ReservationDto(
    int Id,
    string GuestName,
    string GuestPhone,
    int PartySize,
    DateTime ReservationTime,
    string? Note,
    string Status,
    int? TableId,
    int? TableNumber,
    string? ProcessedByName,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

public record CreateReservationRequest(
    string GuestName,
    string GuestPhone,
    int PartySize,
    DateTime ReservationTime,
    string? Note
);

public record UpdateReservationStatusRequest(
    string Status,
    int? TableId
);
