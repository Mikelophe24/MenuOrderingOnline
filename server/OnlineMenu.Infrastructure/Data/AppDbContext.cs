using Microsoft.EntityFrameworkCore;
using OnlineMenu.Core.Entities;

namespace OnlineMenu.Infrastructure.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Account> Accounts => Set<Account>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Dish> Dishes => Set<Dish>();
    public DbSet<Table> Tables => Set<Table>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Account
        modelBuilder.Entity<Account>(entity =>
        {
            entity.HasIndex(e => e.Email).IsUnique();
            entity.Property(e => e.Name).HasMaxLength(100).IsRequired();
            entity.Property(e => e.Email).HasMaxLength(200).IsRequired();
            entity.Property(e => e.PasswordHash).IsRequired();
            entity.Property(e => e.Role).HasConversion<string>().HasMaxLength(20);
        });

        // Category
        modelBuilder.Entity<Category>(entity =>
        {
            entity.Property(e => e.Name).HasMaxLength(100).IsRequired();
            entity.Property(e => e.Description).HasMaxLength(500);
        });

        // Dish
        modelBuilder.Entity<Dish>(entity =>
        {
            entity.Property(e => e.Name).HasMaxLength(200).IsRequired();
            entity.Property(e => e.Price).HasColumnType("decimal(18,2)");
            entity.Property(e => e.Description).HasMaxLength(1000);
            entity.Property(e => e.Image).HasMaxLength(500);
            entity.Property(e => e.Status).HasConversion<string>().HasMaxLength(20);

            entity.HasOne(e => e.Category)
                  .WithMany(c => c.Dishes)
                  .HasForeignKey(e => e.CategoryId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // Table
        modelBuilder.Entity<Table>(entity =>
        {
            entity.HasIndex(e => e.Number).IsUnique();
            entity.Property(e => e.Token).HasMaxLength(100);
            entity.Property(e => e.Status).HasConversion<string>().HasMaxLength(20);
        });

        // Order
        modelBuilder.Entity<Order>(entity =>
        {
            entity.Property(e => e.TotalPrice).HasColumnType("decimal(18,2)");
            entity.Property(e => e.Status).HasConversion<string>().HasMaxLength(20);
            entity.Property(e => e.GuestName).HasMaxLength(100);

            entity.HasOne(e => e.Table)
                  .WithMany(t => t.Orders)
                  .HasForeignKey(e => e.TableId)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(e => e.ProcessedBy)
                  .WithMany(a => a.ProcessedOrders)
                  .HasForeignKey(e => e.ProcessedById)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        // OrderItem
        modelBuilder.Entity<OrderItem>(entity =>
        {
            entity.Property(e => e.Note).HasMaxLength(500);

            entity.HasOne(e => e.Order)
                  .WithMany(o => o.OrderItems)
                  .HasForeignKey(e => e.OrderId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Dish)
                  .WithMany(d => d.OrderItems)
                  .HasForeignKey(e => e.DishId)
                  .OnDelete(DeleteBehavior.Restrict);
        });
    }
}
