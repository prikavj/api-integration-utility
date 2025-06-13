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

    public DbSet<User> Users { get; set; } = null!;
    public DbSet<Person> People { get; set; } = null!;
    public DbSet<Product> Products { get; set; } = null!;
    public DbSet<ApiEndpoint> ApiEndpoints { get; set; } = null!;
    public DbSet<Models.ApiIntegration> ApiIntegrations { get; set; } = null!;
    public DbSet<ApiIntegrationConnection> ApiIntegrationConnections { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // User configuration
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Username)
            .IsUnique();

        // ApiEndpoint configuration
        modelBuilder.Entity<ApiEndpoint>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Url).IsRequired().HasMaxLength(500);
            entity.Property(e => e.Method).IsRequired().HasMaxLength(10);
            entity.Property(e => e.Description).IsRequired();
            entity.Property(e => e.Category).HasMaxLength(50);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
        });

        // Person configuration
        modelBuilder.Entity<Person>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Email).IsRequired().HasMaxLength(255);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
        });

        // Product configuration
        modelBuilder.Entity<Product>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Price).HasColumnType("decimal(18,2)");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");

            // Configure the relationship
            entity.HasOne(p => p.Person)
                  .WithMany(p => p.Products)
                  .HasForeignKey(p => p.PersonId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // ApiIntegration configuration
        modelBuilder.Entity<Models.ApiIntegration>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            
            // Add unique index for Name
            entity.HasIndex(e => e.Name).IsUnique();
        });

        // ApiIntegrationConnection configuration
        modelBuilder.Entity<ApiIntegrationConnection>(entity =>
        {
            entity.HasKey(e => e.Id);
            
            // Configure the relationship with ApiIntegration
            entity.HasOne(e => e.ApiIntegration)
                  .WithMany(i => i.Connections)
                  .HasForeignKey(e => e.ApiIntegrationId)
                  .OnDelete(DeleteBehavior.Cascade);

            // Configure the relationship with ApiEndpoint
            entity.HasOne(e => e.ApiEndpoint)
                  .WithMany()
                  .HasForeignKey(e => e.ApiEndpointId)
                  .OnDelete(DeleteBehavior.Restrict);

            // Add unique constraint for sequence number within an integration
            entity.HasIndex(e => new { e.ApiIntegrationId, e.SequenceNumber })
                  .IsUnique();
        });
    }
} 