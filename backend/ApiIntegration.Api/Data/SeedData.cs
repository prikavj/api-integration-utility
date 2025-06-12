using ApiIntegration.Api.Models;

namespace ApiIntegration.Api.Data;

public static class SeedData
{
    public static void Initialize(ApplicationDbContext context)
    {
        if (context.ApiEndpoints.Any())
        {
            return;   // DB has been seeded
        }

        context.ApiEndpoints.AddRange(
            new ApiEndpoint
            {
                Name = "Get All People",
                Url = "/api/person",
                Method = "GET",
                Description = "Retrieve all people records",
                Category = "People"
            },
            new ApiEndpoint
            {
                Name = "Get Person by ID",
                Url = "/api/person/{id}",
                Method = "GET",
                Description = "Retrieve a specific person by their ID",
                Category = "People"
            },
            new ApiEndpoint
            {
                Name = "Create Person",
                Url = "/api/person",
                Method = "POST",
                Description = "Create a new person record",
                Category = "People"
            },
            new ApiEndpoint
            {
                Name = "Update Person",
                Url = "/api/person/{id}",
                Method = "PUT",
                Description = "Update an existing person record",
                Category = "People"
            },
            new ApiEndpoint
            {
                Name = "Delete Person",
                Url = "/api/person/{id}",
                Method = "DELETE",
                Description = "Delete a person record",
                Category = "People"
            }
        );

        context.SaveChanges();
    }
} 