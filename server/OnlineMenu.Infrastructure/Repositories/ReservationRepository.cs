using Microsoft.EntityFrameworkCore;
using OnlineMenu.Core.Entities;
using OnlineMenu.Core.Enums;
using OnlineMenu.Core.Interfaces.Repositories;
using OnlineMenu.Infrastructure.Data;

namespace OnlineMenu.Infrastructure.Repositories;

public class ReservationRepository : Repository<Reservation>, IReservationRepository
{
    public ReservationRepository(AppDbContext context) : base(context) { }

    public async Task<Reservation?> GetWithDetailsAsync(int id)
        => await _dbSet
            .Include(r => r.Table)
            .Include(r => r.ProcessedBy)
            .FirstOrDefaultAsync(r => r.Id == id);

    public async Task<IEnumerable<Reservation>> GetByStatusAsync(ReservationStatus status)
        => await _dbSet
            .Include(r => r.Table)
            .Include(r => r.ProcessedBy)
            .Where(r => r.Status == status)
            .OrderByDescending(r => r.ReservationTime)
            .ToListAsync();

    public async Task<IEnumerable<Reservation>> GetUpcomingAsync(DateTime from, DateTime to)
        => await _dbSet
            .Include(r => r.Table)
            .Where(r => r.ReservationTime >= from && r.ReservationTime <= to)
            .OrderBy(r => r.ReservationTime)
            .ToListAsync();

    public async Task<IEnumerable<Reservation>> GetByPhoneAsync(string phone)
        => await _dbSet
            .Include(r => r.Table)
            .Where(r => r.GuestPhone == phone)
            .OrderByDescending(r => r.CreatedAt)
            .Take(10)
            .ToListAsync();
}
