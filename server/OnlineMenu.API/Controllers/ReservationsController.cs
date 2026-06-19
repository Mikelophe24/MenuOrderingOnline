using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using OnlineMenu.API.Hubs;
using OnlineMenu.Application.DTOs;
using OnlineMenu.Application.DTOs.Reservations;
using OnlineMenu.Core.Entities;
using OnlineMenu.Core.Enums;
using OnlineMenu.Core.Interfaces.Repositories;

namespace OnlineMenu.API.Controllers;

[ApiController]
[Route("api")]
public class ReservationsController : ControllerBase
{
    private readonly IReservationRepository _reservationRepo;
    private readonly ITableRepository _tableRepo;
    private readonly IHubContext<OrderHub> _hub;

    public ReservationsController(
        IReservationRepository reservationRepo,
        ITableRepository tableRepo,
        IHubContext<OrderHub> hub)
    {
        _reservationRepo = reservationRepo;
        _tableRepo = tableRepo;
        _hub = hub;
    }

    private static ReservationDto MapToDto(Reservation r) => new(
        r.Id, r.GuestName, r.GuestPhone, r.PartySize, r.ReservationTime,
        r.Note, r.Status.ToString(), r.TableId, r.Table?.Number,
        r.ProcessedBy?.Name, r.CreatedAt, r.UpdatedAt
    );

    // ===== Guest (public) =====

    [HttpPost("guest/reservations")]
    public async Task<IActionResult> CreateReservation([FromBody] CreateReservationRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.GuestName))
            return BadRequest(ApiResponse<object>.Fail("Vui lòng nhập họ tên"));
        if (string.IsNullOrWhiteSpace(request.GuestPhone))
            return BadRequest(ApiResponse<object>.Fail("Vui lòng nhập số điện thoại"));
        if (request.PartySize < 1)
            return BadRequest(ApiResponse<object>.Fail("Số khách phải >= 1"));
        if (request.ReservationTime < DateTime.UtcNow.AddMinutes(30))
            return BadRequest(ApiResponse<object>.Fail("Thời gian đặt bàn phải trước ít nhất 30 phút"));
        if (request.ReservationTime > DateTime.UtcNow.AddDays(30))
            return BadRequest(ApiResponse<object>.Fail("Chỉ đặt bàn trước tối đa 30 ngày"));

        var reservation = new Reservation
        {
            GuestName = request.GuestName.Trim(),
            GuestPhone = request.GuestPhone.Trim(),
            PartySize = request.PartySize,
            ReservationTime = request.ReservationTime,
            Note = request.Note?.Trim(),
            Status = ReservationStatus.Pending,
        };

        await _reservationRepo.AddAsync(reservation);

        var dto = MapToDto(reservation);
        await _hub.Clients.Group("management").SendAsync("NewReservation", dto);

        return Ok(ApiResponse<ReservationDto>.Success(dto, "Đặt bàn thành công"));
    }

    [HttpGet("guest/reservations/check")]
    public async Task<IActionResult> CheckReservation([FromQuery] string phone)
    {
        if (string.IsNullOrWhiteSpace(phone))
            return BadRequest(ApiResponse<object>.Fail("Vui lòng nhập số điện thoại"));

        var reservations = await _reservationRepo.GetByPhoneAsync(phone.Trim());
        var dtos = reservations.Select(MapToDto).ToList();

        return Ok(ApiResponse<List<ReservationDto>>.Success(dtos));
    }

    [HttpPatch("guest/reservations/{id}/cancel")]
    public async Task<IActionResult> GuestCancel(int id, [FromBody] GuestCancelReservationRequest request)
    {
        var reservation = await _reservationRepo.GetWithDetailsAsync(id);
        if (reservation == null)
            return NotFound(ApiResponse<object>.Fail("Không tìm thấy đặt bàn"));

        if (reservation.GuestPhone != request.Phone)
            return BadRequest(ApiResponse<object>.Fail("SĐT không khớp"));

        if (reservation.Status != ReservationStatus.Pending && reservation.Status != ReservationStatus.Approved)
            return BadRequest(ApiResponse<object>.Fail("Không thể hủy đặt bàn ở trạng thái này"));

        // If was approved with a table, release the table
        if (reservation.Status == ReservationStatus.Approved && reservation.TableId != null)
        {
            var table = await _tableRepo.GetByIdAsync(reservation.TableId.Value);
            if (table != null && table.Status == TableStatus.Reserved)
            {
                table.Status = TableStatus.Available;
                await _tableRepo.UpdateAsync(table);
                await _hub.Clients.Group("management").SendAsync("TableStatusChanged", new { table.Id, table.Number, Status = table.Status.ToString() });
            }
        }

        reservation.Status = ReservationStatus.Cancelled;
        reservation.UpdatedAt = DateTime.UtcNow;
        await _reservationRepo.UpdateAsync(reservation);

        var dto = MapToDto(reservation);
        await _hub.Clients.Group("management").SendAsync("ReservationStatusChanged", dto);

        return Ok(ApiResponse<ReservationDto>.Success(dto, "Đã hủy đặt bàn"));
    }

    // ===== Staff/Manager =====

    [Authorize(Roles = "Manager,Employee")]
    [HttpGet("reservations")]
    public async Task<IActionResult> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int limit = 20,
        [FromQuery] string? status = null,
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null)
    {
        var (items, totalCount) = await _reservationRepo.GetPagedAsync(
            page, limit,
            filter: r =>
                (status == null || r.Status.ToString() == status) &&
                (fromDate == null || r.ReservationTime >= fromDate) &&
                (toDate == null || r.ReservationTime <= toDate),
            orderBy: q => q.OrderByDescending(r => r.CreatedAt),
            includeProperties: "Table,ProcessedBy"
        );

        var dtos = items.Select(MapToDto).ToList();

        return Ok(ApiResponse<PaginatedResponse<ReservationDto>>.Success(
            new PaginatedResponse<ReservationDto>
            {
                Data = dtos,
                TotalItems = totalCount,
                CurrentPage = page,
                TotalPages = (int)Math.Ceiling(totalCount / (double)limit),
                PageSize = limit,
            }
        ));
    }

    [Authorize(Roles = "Manager,Employee")]
    [HttpGet("reservations/{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var reservation = await _reservationRepo.GetWithDetailsAsync(id);
        if (reservation == null)
            return NotFound(ApiResponse<object>.Fail("Không tìm thấy đặt bàn"));

        return Ok(ApiResponse<ReservationDto>.Success(MapToDto(reservation)));
    }

    [Authorize(Roles = "Manager,Employee")]
    [HttpPatch("reservations/{id}/status")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateReservationStatusRequest request)
    {
        var reservation = await _reservationRepo.GetWithDetailsAsync(id);
        if (reservation == null)
            return NotFound(ApiResponse<object>.Fail("Không tìm thấy đặt bàn"));

        if (!Enum.TryParse<ReservationStatus>(request.Status, out var newStatus))
            return BadRequest(ApiResponse<object>.Fail("Trạng thái không hợp lệ"));

        var accountId = int.Parse(User.FindFirst("userId")!.Value);

        switch (reservation.Status)
        {
            case ReservationStatus.Pending when newStatus is ReservationStatus.Approved:
                if (request.TableId == null)
                    return BadRequest(ApiResponse<object>.Fail("Vui lòng chọn bàn khi duyệt"));
                var table = await _tableRepo.GetByIdAsync(request.TableId.Value);
                if (table == null)
                    return BadRequest(ApiResponse<object>.Fail("Bàn không tồn tại"));
                if (table.Capacity < reservation.PartySize)
                    return BadRequest(ApiResponse<object>.Fail($"Bàn chỉ có {table.Capacity} chỗ, không đủ cho {reservation.PartySize} khách"));
                reservation.TableId = table.Id;
                reservation.ProcessedById = accountId;
                break;

            case ReservationStatus.Pending when newStatus is ReservationStatus.Rejected or ReservationStatus.Cancelled:
                reservation.ProcessedById = accountId;
                break;

            case ReservationStatus.Approved when newStatus is ReservationStatus.Completed:
                // Guest arrived - set table to Occupied
                if (reservation.TableId != null)
                {
                    var t = await _tableRepo.GetByIdAsync(reservation.TableId.Value);
                    if (t != null)
                    {
                        t.Status = TableStatus.Occupied;
                        await _tableRepo.UpdateAsync(t);
                        await _hub.Clients.Group("management").SendAsync("TableStatusChanged",
                            new { t.Id, t.Number, Status = t.Status.ToString() });
                    }
                }
                break;

            case ReservationStatus.Approved when newStatus is ReservationStatus.NoShow or ReservationStatus.Cancelled:
                // Release table
                if (reservation.TableId != null)
                {
                    var t = await _tableRepo.GetByIdAsync(reservation.TableId.Value);
                    if (t != null && t.Status == TableStatus.Reserved)
                    {
                        t.Status = TableStatus.Available;
                        await _tableRepo.UpdateAsync(t);
                        await _hub.Clients.Group("management").SendAsync("TableStatusChanged",
                            new { t.Id, t.Number, Status = t.Status.ToString() });
                    }
                }
                break;

            default:
                return BadRequest(ApiResponse<object>.Fail($"Không thể chuyển từ {reservation.Status} sang {newStatus}"));
        }

        reservation.Status = newStatus;
        reservation.UpdatedAt = DateTime.UtcNow;
        await _reservationRepo.UpdateAsync(reservation);

        // Reload with details
        reservation = await _reservationRepo.GetWithDetailsAsync(id);
        var dto = MapToDto(reservation!);
        await _hub.Clients.Group("management").SendAsync("ReservationStatusChanged", dto);

        return Ok(ApiResponse<ReservationDto>.Success(dto, "Cập nhật thành công"));
    }

    [Authorize(Roles = "Manager")]
    [HttpDelete("reservations/{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var reservation = await _reservationRepo.GetWithDetailsAsync(id);
        if (reservation == null)
            return NotFound(ApiResponse<object>.Fail("Không tìm thấy đặt bàn"));

        // Release table if needed
        if (reservation.Status == ReservationStatus.Approved && reservation.TableId != null)
        {
            var table = await _tableRepo.GetByIdAsync(reservation.TableId.Value);
            if (table != null && table.Status == TableStatus.Reserved)
            {
                table.Status = TableStatus.Available;
                await _tableRepo.UpdateAsync(table);
            }
        }

        await _reservationRepo.DeleteAsync(reservation);
        return Ok(ApiResponse<object>.Success(null!, "Đã xóa"));
    }
}

public record GuestCancelReservationRequest(string Phone);
