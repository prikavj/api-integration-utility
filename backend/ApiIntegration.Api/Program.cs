using Microsoft.EntityFrameworkCore;
using ApiIntegration.Api.Data;
using Npgsql.EntityFrameworkCore.PostgreSQL;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Configure logging
builder.Logging.ClearProviders();
builder.Logging.AddConsole();
builder.Logging.SetMinimumLevel(LogLevel.Debug);

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// Add DbContext with detailed logging
builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"));
    options.EnableSensitiveDataLogging();
    options.EnableDetailedErrors();
    options.LogTo(Console.WriteLine, LogLevel.Information);
});

var app = builder.Build();

// Get logger
var logger = app.Services.GetRequiredService<ILogger<Program>>();

// Initialize database
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        logger.LogInformation("Starting database initialization...");
        var context = services.GetRequiredService<ApplicationDbContext>();
        
        // Log connection string (remove in production!)
        logger.LogInformation("Connection string: {ConnectionString}", 
            builder.Configuration.GetConnectionString("DefaultConnection"));
        
        // Wait for database to be ready
        var retryCount = 0;
        const int maxRetries = 10;
        while (retryCount < maxRetries)
        {
            try
            {
                logger.LogInformation("Attempt {RetryCount} to initialize database", retryCount + 1);
                
                // Create Users table using SQL
                var createTableSql = @"
                    DO $$ 
                    BEGIN
                        CREATE TABLE IF NOT EXISTS ""Users"" (
                            ""Id"" SERIAL PRIMARY KEY,
                            ""Username"" VARCHAR(50) NOT NULL,
                            ""PasswordHash"" TEXT NOT NULL,
                            ""CreatedAt"" TIMESTAMP WITH TIME ZONE NOT NULL
                        );
                        
                        -- Create unique index if it doesn't exist
                        IF NOT EXISTS (
                            SELECT 1 FROM pg_indexes 
                            WHERE tablename = 'Users' 
                            AND indexname = 'IX_Users_Username'
                        ) THEN
                            CREATE UNIQUE INDEX ""IX_Users_Username"" ON ""Users"" (""Username"");
                        END IF;
                    EXCEPTION
                        WHEN others THEN
                            RAISE NOTICE 'Error creating table: %', SQLERRM;
                    END $$;";

                context.Database.ExecuteSqlRaw(createTableSql);
                logger.LogInformation("Database table creation completed successfully");
                
                // Verify table exists by counting rows
                var count = context.Users.Count();
                logger.LogInformation("Current user count: {Count}", count);
                
                break;
            }
            catch (Exception ex)
            {
                retryCount++;
                logger.LogError(ex, "Error during database initialization (Attempt {RetryCount}/{MaxRetries})", 
                    retryCount, maxRetries);
                
                if (retryCount == maxRetries)
                {
                    throw;
                }
                
                logger.LogInformation("Waiting 2 seconds before retry...");
                Thread.Sleep(2000);
            }
        }
        
        logger.LogInformation("Database initialization completed");
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Fatal error during database initialization");
        throw;
    }
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors();
app.UseAuthorization();
app.MapControllers();

app.Run(); 