namespace OnlineMenu.Application.DTOs.Dishes;

public record DishDto(
    int Id,
    string Name,
    decimal Price,
    string Description,
    string Image,
    string Status,
    int CategoryId,
    string? CategoryName,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

public record CreateDishRequest(
    string Name,
    decimal Price,
    string? Description,
    string? Image,
    string Status,
    int CategoryId
);

public record UpdateDishRequest(
    string Name,
    decimal Price,
    string? Description,
    string? Image,
    string Status,
    int CategoryId
);
