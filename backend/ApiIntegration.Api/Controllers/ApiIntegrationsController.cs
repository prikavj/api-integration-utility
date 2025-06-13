using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ApiIntegration.Api.Data;
using ApiIntegration.Api.Models;

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
    public async Task<ActionResult<ApiIntegration.Api.Models.ApiIntegration>> Create(ApiIntegrationDto dto)
    {
        var integration = new ApiIntegration.Api.Models.ApiIntegration
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

        return CreatedAtAction(nameof(GetById), new { id = integration.Id }, integration);
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ApiIntegration.Api.Models.ApiIntegration>>> GetAll()
    {
        return await _context.ApiIntegrations
            .Include(i => i.Connections)
            .ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiIntegration.Api.Models.ApiIntegration>> GetById(int id)
    {
        var integration = await _context.ApiIntegrations
            .Include(i => i.Connections)
            .FirstOrDefaultAsync(i => i.Id == id);

        if (integration == null)
            return NotFound();

        return integration;
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