using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OnlineMenu.Application.DTOs;
using OnlineMenu.Core.Entities;
using OnlineMenu.Infrastructure.Data;

namespace OnlineMenu.API.Controllers;

[ApiController]
[Route("api/reviews")]
public class ReviewsController : ControllerBase
{
    private readonly AppDbContext _context;

    public ReviewsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("dish/{dishId}")]
    public async Task<IActionResult> GetByDish(int dishId)
    {
        var reviews = await _context.DishReviews
            .Where(r => r.DishId == dishId)
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new { r.Id, r.DishId, r.GuestName, r.TableNumber, r.Rating, r.Comment, r.CreatedAt })
            .ToListAsync();

        var avg = reviews.Count > 0 ? reviews.Average(r => r.Rating) : 0;

        return Ok(ApiResponse<object>.Success(new { reviews, averageRating = Math.Round(avg, 1), totalReviews = reviews.Count }));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateReviewRequest request)
    {
        if (request.Rating < 1 || request.Rating > 5)
            return BadRequest(ApiResponse<object>.Fail("Rating must be between 1 and 5"));

        var dish = await _context.Dishes.FindAsync(request.DishId);
        if (dish == null)
            return NotFound(ApiResponse<object>.Fail("Dish not found"));

        var review = new DishReview
        {
            DishId = request.DishId,
            GuestName = request.GuestName,
            TableNumber = request.TableNumber,
            Rating = request.Rating,
            Comment = request.Comment,
        };

        _context.DishReviews.Add(review);
        await _context.SaveChangesAsync();

        return Ok(ApiResponse<object>.Success(new { review.Id, review.Rating, review.Comment, review.GuestName, review.CreatedAt }));
    }
}

public record CreateReviewRequest(int DishId, string GuestName, int TableNumber, int Rating, string? Comment);
