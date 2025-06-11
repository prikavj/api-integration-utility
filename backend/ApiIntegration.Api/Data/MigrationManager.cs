using Microsoft.EntityFrameworkCore;

namespace ApiIntegration.Api.Data;

public static class MigrationManager
{
    public static WebApplication MigrateDatabase(this WebApplication app)
    {
        using (var scope = app.Services.CreateScope())
        {
            using (var appContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>())
            {
                try
                {
                    var retryCount = 0;
                    const int maxRetries = 10;

                    while (retryCount < maxRetries)
                    {
                        try
                        {
                            appContext.Database.EnsureCreated();
                            appContext.Database.Migrate();
                            break;
                        }
                        catch (Exception ex)
                        {
                            retryCount++;
                            if (retryCount == maxRetries)
                            {
                                throw;
                            }
                            Console.WriteLine($"Database not ready, retrying in 2 seconds... (Attempt {retryCount}/{maxRetries})");
                            Console.WriteLine($"Error: {ex.Message}");
                            Thread.Sleep(2000);
                        }
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine("An error occurred while migrating the database:");
                    Console.WriteLine(ex.ToString());
                    throw;
                }
            }
        }

        return app;
    }
} 