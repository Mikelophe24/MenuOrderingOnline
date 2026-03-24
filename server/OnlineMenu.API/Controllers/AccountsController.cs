using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OnlineMenu.Application.DTOs;
using OnlineMenu.Application.DTOs.Auth;
using OnlineMenu.Application.DTOs.Employees;
using OnlineMenu.Core.Entities;
using OnlineMenu.Core.Enums;
using OnlineMenu.Core.Interfaces.Repositories;

namespace OnlineMenu.API.Controllers;

[ApiController]
[Route("api/accounts")]
[Authorize(Roles = "Owner")]
public class AccountsController : ControllerBase
{
    private readonly IAccountRepository _accountRepo;

    public AccountsController(IAccountRepository accountRepo)
    {
        _accountRepo = accountRepo;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int limit = 10)
    {
        var (items, totalCount) = await _accountRepo.GetPagedAsync(page, limit);

        var dtos = items.Select(a => new AccountDto(a.Id, a.Name, a.Email, a.Avatar, a.Role.ToString())).ToList();

        var response = new PaginatedResponse<AccountDto>
        {
            Data = dtos,
            TotalItems = totalCount,
            CurrentPage = page,
            TotalPages = (int)Math.Ceiling(totalCount / (double)limit),
            PageSize = limit
        };

        return Ok(ApiResponse<PaginatedResponse<AccountDto>>.Success(response));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateEmployeeRequest request)
    {
        if (await _accountRepo.ExistsAsync(a => a.Email == request.Email))
            return BadRequest(ApiResponse<object>.Fail("Email already exists"));

        var account = new Account
        {
            Name = request.Name,
            Email = request.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Avatar = request.Avatar,
            Role = Enum.Parse<Role>(request.Role),
        };

        await _accountRepo.AddAsync(account);
        var dto = new AccountDto(account.Id, account.Name, account.Email, account.Avatar, account.Role.ToString());
        return CreatedAtAction(nameof(GetAll), ApiResponse<AccountDto>.Success(dto, "Created", 201));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateEmployeeRequest request)
    {
        var account = await _accountRepo.GetByIdAsync(id);
        if (account == null) return NotFound();

        account.Name = request.Name;
        account.Avatar = request.Avatar ?? account.Avatar;
        account.Role = Enum.Parse<Role>(request.Role);

        await _accountRepo.UpdateAsync(account);
        return Ok(ApiResponse<object>.Success(null!, "Updated"));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var account = await _accountRepo.GetByIdAsync(id);
        if (account == null) return NotFound();
        await _accountRepo.DeleteAsync(account);
        return Ok(ApiResponse<object>.Success(null!, "Deleted"));
    }
}
