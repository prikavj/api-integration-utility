using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ApiIntegration.Api.Data;
using ApiIntegration.Api.Models;

namespace ApiIntegration.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ApiEndpointsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public ApiEndpointsController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ApiEndpoint>>> GetAll()
    {
        return await _context.ApiEndpoints.ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiEndpoint>> GetById(int id)
    {
        var endpoint = await _context.ApiEndpoints.FindAsync(id);

        if (endpoint == null)
        {
            return NotFound();
        }

        return endpoint;
    }

    [HttpPost]
    public async Task<ActionResult<ApiEndpoint>> Create(ApiEndpoint endpoint)
    {
        _context.ApiEndpoints.Add(endpoint);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = endpoint.Id }, endpoint);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, ApiEndpoint endpoint)
    {
        if (id != endpoint.Id)
        {
            return BadRequest();
        }

        _context.Entry(endpoint).State = EntityState.Modified;
        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var endpoint = await _context.ApiEndpoints.FindAsync(id);
        if (endpoint == null)
        {
            return NotFound();
        }

        _context.ApiEndpoints.Remove(endpoint);
        await _context.SaveChangesAsync();

        return NoContent();
    }
} 