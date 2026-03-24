using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OnlineMenu.Application.DTOs;

namespace OnlineMenu.API.Controllers;

[ApiController]
[Route("api/upload")]
[Authorize(Roles = "Owner,Employee")]
public class UploadController : ControllerBase
{
    private readonly IWebHostEnvironment _env;

    public UploadController(IWebHostEnvironment env)
    {
        _env = env;
    }

    [HttpPost("image")]
    public async Task<IActionResult> UploadImage(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest(ApiResponse<object>.Fail("No file uploaded"));

        var allowedTypes = new[] { "image/jpeg", "image/png", "image/webp", "image/gif" };
        if (!allowedTypes.Contains(file.ContentType))
            return BadRequest(ApiResponse<object>.Fail("Only JPEG, PNG, WebP, GIF images are allowed"));

        if (file.Length > 5 * 1024 * 1024)
            return BadRequest(ApiResponse<object>.Fail("File size must be less than 5MB"));

        var uploadsDir = Path.Combine(_env.ContentRootPath, "wwwroot", "uploads");
        Directory.CreateDirectory(uploadsDir);

        var fileName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
        var filePath = Path.Combine(uploadsDir, fileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        var url = $"{Request.Scheme}://{Request.Host}/uploads/{fileName}";
        return Ok(ApiResponse<object>.Success(new { url }, "Uploaded"));
    }
}
