using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OnlineMenu.Application.DTOs;

namespace OnlineMenu.API.Controllers;

[ApiController]
[Route("api/upload")]
[Authorize(Roles = "Owner,Employee")]
public class UploadController : ControllerBase
{
    private readonly Cloudinary _cloudinary;

    public UploadController(Cloudinary cloudinary)
    {
        _cloudinary = cloudinary;
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

        await using var stream = file.OpenReadStream();
        var uploadParams = new ImageUploadParams
        {
            File = new FileDescription(file.FileName, stream),
            Folder = "onlinemenu/dishes",
            Transformation = new Transformation().Width(800).Crop("limit").Quality("auto").FetchFormat("auto"),
        };

        var result = await _cloudinary.UploadAsync(uploadParams);

        if (result.Error != null)
            return BadRequest(ApiResponse<object>.Fail(result.Error.Message));

        return Ok(ApiResponse<object>.Success(new { url = result.SecureUrl.ToString() }, "Uploaded"));
    }
}
