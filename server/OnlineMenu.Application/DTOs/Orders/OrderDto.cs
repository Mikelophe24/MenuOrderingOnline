namespace OnlineMenu.Application.DTOs.Orders;

public record OrderDto(
    int Id,
    int TableNumber,
    string? GuestName,
    string Status,
    decimal TotalPrice,
    string? ProcessedByName,
    List<OrderItemDto> OrderItems,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

public record OrderItemDto(
    int Id,
    int DishId,
    string DishName,
    decimal DishPrice,
    string? DishImage,
    int Quantity,
    string? Note
);

public record CreateGuestOrderRequest(
    int TableNumber,
    string TableToken,
    string? GuestName,
    List<GuestOrderItem> Items
);

public record GuestOrderItem(int DishId, int Quantity, string? Note);

public record UpdateOrderStatusRequest(string Status);

public record GuestCancelRequest(int TableNumber, string TableToken);
