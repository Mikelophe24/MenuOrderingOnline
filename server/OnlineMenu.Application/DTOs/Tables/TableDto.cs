namespace OnlineMenu.Application.DTOs.Tables;

public record TableDto(
    int Id,
    int Number,
    int Capacity,
    string Status,
    string Token,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

public record CreateTableRequest(int Number, int Capacity, string Status);

public record UpdateTableRequest(int Number, int Capacity, string Status);
