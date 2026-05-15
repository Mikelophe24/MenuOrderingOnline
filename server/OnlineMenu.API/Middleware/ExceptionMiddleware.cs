using System.Net;
using System.Text.Json;

namespace OnlineMenu.API.Middleware;

public class ExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionMiddleware> _logger;
    private readonly IHostEnvironment _env;

    public ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger, IHostEnvironment env)
    {
        _next = next;
        _logger = logger;
        _env = env;
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
            await HandleExceptionAsync(httpContext, HttpStatusCode.Unauthorized,
                _env.IsDevelopment() ? ex.Message : "Unauthorized");
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Bad request");
            await HandleExceptionAsync(httpContext, HttpStatusCode.BadRequest,
                _env.IsDevelopment() ? ex.Message : "Bad request");
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
