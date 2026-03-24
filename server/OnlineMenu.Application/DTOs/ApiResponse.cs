namespace OnlineMenu.Application.DTOs;

public class ApiResponse<T>
{
    public T? Data { get; set; }
    public string Message { get; set; } = string.Empty;
    public int StatusCode { get; set; }

    public static ApiResponse<T> Success(T data, string message = "Success", int statusCode = 200)
    {
        return new ApiResponse<T> { Data = data, Message = message, StatusCode = statusCode };
    }

    public static ApiResponse<T> Fail(string message, int statusCode = 400)
    {
        return new ApiResponse<T> { Message = message, StatusCode = statusCode };
    }
}

public class PaginatedResponse<T>
{
    public List<T> Data { get; set; } = new();
    public int TotalItems { get; set; }
    public int CurrentPage { get; set; }
    public int TotalPages { get; set; }
    public int PageSize { get; set; }
}
