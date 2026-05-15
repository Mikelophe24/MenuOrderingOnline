using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using OnlineMenu.API.Hubs;
using OnlineMenu.Core.Enums;
using OnlineMenu.Infrastructure.Data;

namespace OnlineMenu.API.Extensions;

public class ReservationBackgroundService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<ReservationBackgroundService> _logger;

    public ReservationBackgroundService(
        IServiceScopeFactory scopeFactory,
        ILogger<ReservationBackgroundService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcessReservations(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing reservations");
            }

            await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
        }
    }

    private async Task ProcessReservations(CancellationToken ct)
    {
        using var scope = _scopeFactory.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var hub = scope.ServiceProvider.GetRequiredService<IHubContext<OrderHub>>();

        var now = DateTime.UtcNow;

        // 1. Auto-reserve table: 30 min before reservation time
        var upcomingReservations = await context.Reservations
            .Include(r => r.Table)
            .Where(r =>
                r.Status == ReservationStatus.Approved &&
                r.TableId != null &&
                r.ReservationTime <= now.AddMinutes(30) &&
                r.ReservationTime > now &&
                r.Table!.Status == TableStatus.Available)
            .ToListAsync(ct);

        foreach (var reservation in upcomingReservations)
        {
            reservation.Table!.Status = TableStatus.Reserved;
            _logger.LogInformation("Auto-reserved table {TableNumber} for reservation {Id}",
                reservation.Table.Number, reservation.Id);

            await hub.Clients.Group("management").SendAsync("TableStatusChanged",
                new { reservation.Table.Id, reservation.Table.Number, Status = "Reserved" }, ct);
        }

        // 2. Auto-no-show: 15 min after reservation time, guest hasn't arrived
        var noShowReservations = await context.Reservations
            .Include(r => r.Table)
            .Where(r =>
                r.Status == ReservationStatus.Approved &&
                r.ReservationTime < now.AddMinutes(-15))
            .ToListAsync(ct);

        foreach (var reservation in noShowReservations)
        {
            reservation.Status = ReservationStatus.NoShow;
            reservation.UpdatedAt = now;

            if (reservation.Table != null && reservation.Table.Status == TableStatus.Reserved)
            {
                reservation.Table.Status = TableStatus.Available;

                await hub.Clients.Group("management").SendAsync("TableStatusChanged",
                    new { reservation.Table.Id, reservation.Table.Number, Status = "Available" }, ct);
            }

            _logger.LogInformation("Auto-marked reservation {Id} as NoShow, released table {TableNumber}",
                reservation.Id, reservation.Table?.Number);

            await hub.Clients.Group("management").SendAsync("ReservationStatusChanged",
                new { reservation.Id, Status = "NoShow" }, ct);
        }

        if (upcomingReservations.Count > 0 || noShowReservations.Count > 0)
        {
            await context.SaveChangesAsync(ct);
        }
    }
}
