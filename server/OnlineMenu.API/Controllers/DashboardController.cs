using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OnlineMenu.Application.DTOs;
using OnlineMenu.Core.Interfaces.Services;

namespace OnlineMenu.API.Controllers;

[ApiController]
[Route("api/dashboard")]
[Authorize(Roles = "Owner,Employee")]
public class DashboardController : ControllerBase
{
    private readonly IDashboardService _dashboardService;

    public DashboardController(IDashboardService dashboardService)
    {
        _dashboardService = dashboardService;
    }

    [HttpGet]
    public async Task<IActionResult> GetDashboard(
        [FromQuery] DateTime? fromDate,
        [FromQuery] DateTime? toDate)
    {
        var data = await _dashboardService.GetDashboardDataAsync(fromDate, toDate);
        return Ok(ApiResponse<DashboardData>.Success(data));
    }
}
