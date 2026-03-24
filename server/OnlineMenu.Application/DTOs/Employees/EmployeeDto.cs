namespace OnlineMenu.Application.DTOs.Employees;

public record CreateEmployeeRequest(
    string Name,
    string Email,
    string Password,
    string? Avatar,
    string Role
);

public record UpdateEmployeeRequest(
    string Name,
    string? Avatar,
    string Role
);
