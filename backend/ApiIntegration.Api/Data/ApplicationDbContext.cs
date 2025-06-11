using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using ApiIntegration.Api.Models;

namespace ApiIntegration.Api.Data;

public class ApplicationDbContext : DbContext
{
    private readonly ILogger<ApplicationDbContext> _logger;

    public ApplicationDbContext(
        DbContextOptions<ApplicationDbContext> options,
        ILogger<ApplicationDbContext> logger)
        : base(options)
    {
        _logger = logger;
    }

    public DbSet<User> Users { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>(entity =>
        {
            // Map to the existing table
            entity.ToTable("Users");
            
            // Configure properties
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("Id");
            entity.Property(e => e.Username).HasColumnName("Username");
            entity.Property(e => e.PasswordHash).HasColumnName("PasswordHash");
            entity.Property(e => e.CreatedAt).HasColumnName("CreatedAt");
        });
    }
} 