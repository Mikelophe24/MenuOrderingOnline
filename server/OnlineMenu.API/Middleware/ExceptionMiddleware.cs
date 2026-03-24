using System.Net;
using System.Text.Json;

namespace OnlineMenu.API.Middleware;

public class ExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionMiddleware> _logger;

    public ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext httpContext)
    {
        // Skip middleware for SignalR hubs
        if (httpContext.Request.Path.StartsWithSegments("/hubs"))
        {
            await _next(httpContext);
            return;
        }

        try
        {
            await _next(httpContext);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "Unauthorized access");
            await HandleExceptionAsync(httpContext, HttpStatusCode.Unauthorized, ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Bad request");
            await HandleExceptionAsync(httpContext, HttpStatusCode.BadRequest, ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception");
            await HandleExceptionAsync(httpContext, HttpStatusCode.InternalServerError, "Internal server error");
        }
    }

    private static async Task HandleExceptionAsync(HttpContext context, HttpStatusCode statusCode, string message)
    {
        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)statusCode;

        var response = new
        {
            statusCode = (int)statusCode,
            message,
        };

        await context.Response.WriteAsync(JsonSerializer.Serialize(response));
    }
}
