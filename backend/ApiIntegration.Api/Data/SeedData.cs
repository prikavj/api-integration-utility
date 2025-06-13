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
            },
            // Product endpoints
            new ApiEndpoint
            {
                Name = "Get All Products",
                Url = "/api/product",
                Method = "GET",
                Description = "Get a list of all products",
                Category = "Products"
            },
            new ApiEndpoint
            {
                Name = "Get Product by ID",
                Url = "/api/product/{id}",
                Method = "GET",
                Description = "Get a product by its ID",
                Category = "Products"
            },
            new ApiEndpoint
            {
                Name = "Create Product",
                Url = "/api/product",
                Method = "POST",
                Description = "Create a new product",
                Category = "Products"
            },
            new ApiEndpoint
            {
                Name = "Update Product",
                Url = "/api/product/{id}",
                Method = "PUT",
                Description = "Update an existing product",
                Category = "Products"
            },
            new ApiEndpoint
            {
                Name = "Delete Product",
                Url = "/api/product/{id}",
                Method = "DELETE",
                Description = "Delete a product",
                Category = "Products"
            }
        );

        context.SaveChanges();
    }
} 