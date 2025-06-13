using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ApiIntegration.Api.Data;
using ApiIntegration.Api.Models;
using System.Net.Http;

namespace ApiIntegration.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ApiIntegrationsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public ApiIntegrationsController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpPost]
    public async Task<ActionResult<ApiIntegrationResponseDto>> Create(ApiIntegrationDto dto)
    {
        // Prevent duplicate names (case-insensitive)
        if (await _context.ApiIntegrations.AnyAsync(i => i.Name.ToLower() == dto.Name.ToLower()))
        {
            return BadRequest($"An integration with the name '{dto.Name}' already exists.");
        }

        var integration = new Models.ApiIntegration
        {
            Name = dto.Name,
            CreatedAt = DateTime.UtcNow,
            LastModifiedAt = DateTime.UtcNow
        };

        _context.ApiIntegrations.Add(integration);
        await _context.SaveChangesAsync();

        // Add connections
        foreach (var conn in dto.Connections)
        {
            _context.ApiIntegrationConnections.Add(new ApiIntegrationConnection
            {
                ApiIntegrationId = integration.Id,
                ApiEndpointId = conn.ApiEndpointId,
                SequenceNumber = conn.SequenceNumber
            });
        }
        await _context.SaveChangesAsync();

        var response = await GetIntegrationWithDetails(integration.Id);
        return CreatedAtAction(nameof(GetById), new { id = integration.Id }, response);
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ApiIntegrationResponseDto>>> GetAll()
    {
        var integrations = await _context.ApiIntegrations
            .Include(i => i.Connections)
            .ThenInclude(c => c.ApiEndpoint)
            .ToListAsync();

        return integrations.Select(i => MapToResponseDto(i)).ToList();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiIntegrationResponseDto>> GetById(int id)
    {
        var integration = await _context.ApiIntegrations
            .Include(i => i.Connections)
            .ThenInclude(c => c.ApiEndpoint)
            .FirstOrDefaultAsync(i => i.Id == id);

        if (integration == null)
            return NotFound();

        return MapToResponseDto(integration);
    }

    [HttpPost("{id}/execute")]
    public async Task<ActionResult<ExecutionResult>> Execute(int id)
    {
        var integration = await _context.ApiIntegrations
            .Include(i => i.Connections)
            .ThenInclude(c => c.ApiEndpoint)
            .FirstOrDefaultAsync(i => i.Id == id);

        if (integration == null)
            return NotFound();

        var result = new ExecutionResult
        {
            IntegrationId = integration.Id,
            Steps = new List<ExecutionStep>()
        };

        using var client = new HttpClient();
        
        // Configure for localhost calls
        client.BaseAddress = new Uri("http://localhost:5001");
        
        // Add the JWT token from the current request to the client
        var authHeader = Request.Headers["Authorization"].ToString();
        if (!string.IsNullOrEmpty(authHeader))
        {
            client.DefaultRequestHeaders.Add("Authorization", authHeader);
        }

        foreach (var conn in integration.Connections.OrderBy(c => c.SequenceNumber))
        {
            var startTime = DateTime.UtcNow;
            
            try
            {
                var path = conn.ApiEndpoint.Url.StartsWith("/") ? conn.ApiEndpoint.Url : "/" + conn.ApiEndpoint.Url;
                var fullUrl = $"{client.BaseAddress}{path}";
                Console.WriteLine($"Executing API call to: {fullUrl} with method: {conn.ApiEndpoint.Method}");
                
                var request = new HttpRequestMessage(new HttpMethod(conn.ApiEndpoint.Method), path);
                var response = await client.SendAsync(request);
                
                Console.WriteLine($"API call completed. Status code: {response.StatusCode}");
                var content = await response.Content.ReadAsStringAsync();
                Console.WriteLine($"Response content: {content}");
                
                result.Steps.Add(new ExecutionStep
                {
                    ApiEndpointId = conn.ApiEndpointId,
                    StatusCode = (int)response.StatusCode,
                    RunTime = (DateTime.UtcNow - startTime).TotalMilliseconds
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error executing API call to {conn.ApiEndpoint.Url}: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                
                // If the API call fails, add a step with error status
                result.Steps.Add(new ExecutionStep
                {
                    ApiEndpointId = conn.ApiEndpointId,
                    StatusCode = 500, // Internal Server Error
                    RunTime = (DateTime.UtcNow - startTime).TotalMilliseconds
                });
            }

            // Wait for 2 seconds before the next API call
            await Task.Delay(2000);
        }

        return Ok(result);
    }

    private async Task<ApiIntegrationResponseDto> GetIntegrationWithDetails(int id)
    {
        var integration = await _context.ApiIntegrations
            .Include(i => i.Connections)
            .ThenInclude(c => c.ApiEndpoint)
            .FirstOrDefaultAsync(i => i.Id == id);

        if (integration == null)
            throw new KeyNotFoundException($"Integration with ID {id} not found");

        return MapToResponseDto(integration);
    }

    private static ApiIntegrationResponseDto MapToResponseDto(Models.ApiIntegration integration)
    {
        return new ApiIntegrationResponseDto
        {
            Id = integration.Id,
            Name = integration.Name,
            CreatedAt = integration.CreatedAt,
            LastModifiedAt = integration.LastModifiedAt,
            Connections = integration.Connections
                .OrderBy(c => c.SequenceNumber)
                .Select(c => new ApiIntegrationConnectionResponseDto
                {
                    Id = c.Id,
                    ApiEndpointId = c.ApiEndpointId,
                    SequenceNumber = c.SequenceNumber,
                    ApiEndpoint = new ApiEndpointResponseDto
                    {
                        Id = c.ApiEndpoint.Id,
                        Name = c.ApiEndpoint.Name,
                        Url = c.ApiEndpoint.Url,
                        Method = c.ApiEndpoint.Method,
                        Description = c.ApiEndpoint.Description,
                        Category = c.ApiEndpoint.Category
                    }
                })
                .ToList()
        };
    }
}

public class ApiIntegrationDto
{
    public string Name { get; set; } = string.Empty;
    public List<ApiIntegrationConnectionDto> Connections { get; set; } = new();
}

public class ApiIntegrationConnectionDto
{
    public int ApiEndpointId { get; set; }
    public int SequenceNumber { get; set; }
}

public class ApiIntegrationResponseDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? LastModifiedAt { get; set; }
    public List<ApiIntegrationConnectionResponseDto> Connections { get; set; } = new();
}

public class ApiIntegrationConnectionResponseDto
{
    public int Id { get; set; }
    public int ApiEndpointId { get; set; }
    public int SequenceNumber { get; set; }
    public ApiEndpointResponseDto ApiEndpoint { get; set; } = null!;
}

public class ApiEndpointResponseDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    public string Method { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
}

public class ExecutionResult
{
    public int IntegrationId { get; set; }
    public List<ExecutionStep> Steps { get; set; } = new();
}

public class ExecutionStep
{
    public int ApiEndpointId { get; set; }
    public int StatusCode { get; set; }
    public double RunTime { get; set; }
} 