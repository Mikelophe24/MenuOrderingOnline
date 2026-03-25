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
    int? Calories,
    int? Protein,
    int? Carbs,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

public record CreateDishRequest(
    string Name,
    decimal Price,
    string? Description,
    string? Image,
    string Status,
    int CategoryId,
    int? Calories,
    int? Protein,
    int? Carbs
);

public record UpdateDishRequest(
    string Name,
    decimal Price,
    string? Description,
    string? Image,
    string Status,
    int CategoryId,
    int? Calories,
    int? Protein,
    int? Carbs
);
