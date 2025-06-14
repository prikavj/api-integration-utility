using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ApiIntegration.Api.Data;
using ApiIntegration.Api.Models;
using System.Net.Http;
using System.Text.Json;
using System.Text;
using System.Net.Http.Headers;
using System.Linq;

namespace ApiIntegration.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ApiIntegrationsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly Dictionary<string, string> _apiEndpointMapping;
    private readonly Dictionary<string, Dictionary<string, object>> _chainMapping;

    public ApiIntegrationsController(ApplicationDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
        _apiEndpointMapping = new Dictionary<string, string>();
        _chainMapping = new Dictionary<string, Dictionary<string, object>>();

        try
        {
            // In Docker, the files will be in the /app/Data directory
            var basePath = AppDomain.CurrentDomain.BaseDirectory;
            var dataPath = Path.Combine(basePath, "Data");
            
            Console.WriteLine($"[API Chaining] Looking for mapping files in: {dataPath}");
            Console.WriteLine($"[API Chaining] Directory contents: {string.Join(", ", Directory.GetFiles(dataPath))}");

            // Load API endpoint mapping
            var endpointMappingPath = Path.Combine(dataPath, "api_endpoint_mapping.json");
            if (System.IO.File.Exists(endpointMappingPath))
            {
                var endpointMappingJson = System.IO.File.ReadAllText(endpointMappingPath);
                Console.WriteLine($"[API Chaining] Endpoint mapping file content: {endpointMappingJson}");
                
                try
                {
                    // Use JsonDocument for more control over the deserialization
                    using var document = JsonDocument.Parse(endpointMappingJson);
                    var root = document.RootElement;
                    var apiEndpoints = root.GetProperty("api_endpoints");

                    foreach (var category in apiEndpoints.EnumerateObject())
                    {
                        Console.WriteLine($"[API Chaining] Processing category: {category.Name}");
                        foreach (var mapping in category.Value.EnumerateObject())
                        {
                            var key = mapping.Name;
                            var value = mapping.Value.GetString();
                            _apiEndpointMapping[key] = value;
                            Console.WriteLine($"[API Chaining] Added mapping: {key} -> {value}");
                        }
                    }
                    Console.WriteLine($"[API Chaining] Loaded {_apiEndpointMapping.Count} endpoint mappings");
                    Console.WriteLine($"[API Chaining] Mappings: {string.Join(", ", _apiEndpointMapping.Select(m => $"{m.Key} -> {m.Value}"))}");
                }
                catch (JsonException ex)
                {
                    Console.WriteLine($"[API Chaining] JSON deserialization error: {ex.Message}");
                    Console.WriteLine($"[API Chaining] JSON content: {endpointMappingJson}");
                }
            }
            else
            {
                Console.WriteLine($"[API Chaining] Warning: Endpoint mapping file not found at {endpointMappingPath}");
            }

            // Load chain mapping
            var chainMappingPath = Path.Combine(dataPath, "chain_mapping.json");
            if (System.IO.File.Exists(chainMappingPath))
            {
                var chainMappingJson = System.IO.File.ReadAllText(chainMappingPath);
                Console.WriteLine($"[API Chaining] Chain mapping file content: {chainMappingJson}");
                
                try
                {
                    using var document = JsonDocument.Parse(chainMappingJson);
                    var root = document.RootElement;

                    foreach (var category in root.EnumerateObject())
                    {
                        var categoryDict = new Dictionary<string, object>();
                        foreach (var endpoint in category.Value.EnumerateObject())
                        {
                            // Clone the endpoint value to avoid disposal issues
                            var endpointValue = endpoint.Value.Clone();
                            categoryDict[endpoint.Name] = endpointValue;
                        }
                        _chainMapping[category.Name] = categoryDict;
                    }

                    Console.WriteLine($"[API Chaining] Loaded chain mapping for {_chainMapping.Count} categories");
                    foreach (var category in _chainMapping)
                    {
                        Console.WriteLine($"[API Chaining] Category {category.Key} has {category.Value.Count} endpoints");
                    }
                }
                catch (JsonException ex)
                {
                    Console.WriteLine($"[API Chaining] JSON deserialization error: {ex.Message}");
                    Console.WriteLine($"[API Chaining] JSON content: {chainMappingJson}");
                }
            }
            else
            {
                Console.WriteLine($"[API Chaining] Warning: Chain mapping file not found at {chainMappingPath}");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[API Chaining] Error loading mapping files: {ex.Message}");
            Console.WriteLine($"[API Chaining] Stack trace: {ex.StackTrace}");
            // Don't throw the exception, just log it and continue with empty mappings
        }
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
    public async Task<ActionResult<ExecutionResult>> Execute(int id, [FromBody] ExecutionRequest? executionRequest = null)
    {
        try
        {
            Console.WriteLine($"[API Chaining] Starting execution for integration ID: {id}");
            Console.WriteLine($"[API Chaining] Execution request: {JsonSerializer.Serialize(executionRequest)}");

            var apiIntegration = await _context.ApiIntegrations
                .Include(a => a.Connections)
                    .ThenInclude(c => c.ApiEndpoint)
                .FirstOrDefaultAsync(a => a.Id == id);

            if (apiIntegration == null)
            {
                Console.WriteLine($"[API Chaining] Integration not found for ID: {id}");
                return NotFound();
            }

            Console.WriteLine($"[API Chaining] Found integration: {apiIntegration.Name}");
            Console.WriteLine($"[API Chaining] Number of connections: {apiIntegration.Connections.Count}");

            var results = new List<ExecutionResult>();
            var context = new Dictionary<string, object>();

            // Create HttpClient with base address
            using var httpClient = new HttpClient();
            httpClient.BaseAddress = new Uri("http://host.docker.internal:5001/");
            
            // Add authorization header if token is provided
            if (executionRequest?.Token != null)
            {
                httpClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", executionRequest.Token);
                Console.WriteLine("[API Chaining] Added authorization header with token");
            }
            
            Console.WriteLine($"[API Chaining] Set HttpClient base address to: {httpClient.BaseAddress}");

            foreach (var connection in apiIntegration.Connections.OrderBy(c => c.SequenceNumber))
            {
                var endpoint = connection.ApiEndpoint;
                Console.WriteLine($"\n[API Chaining] ===== Processing Connection {connection.SequenceNumber} =====");
                Console.WriteLine($"[API Chaining] Endpoint: {endpoint.Method} {endpoint.Url}");
                Console.WriteLine($"[API Chaining] Category: {endpoint.Category}");
                Console.WriteLine($"[API Chaining] Endpoint ID: {endpoint.Id}");
                
                // Debug logging for endpoint mapping
                Console.WriteLine($"[API Chaining] Available mappings: {string.Join(", ", _apiEndpointMapping.Keys)}");
                var endpointKey = $"{endpoint.Method} {endpoint.Url}";
                Console.WriteLine($"[API Chaining] Looking for mapping with key: {endpointKey}");
                
                if (!_apiEndpointMapping.TryGetValue(endpointKey, out var shortName))
                {
                    Console.WriteLine($"[API Chaining] No mapping found for endpoint: {endpointKey}");
                    Console.WriteLine($"[API Chaining] Available mappings: {string.Join(", ", _apiEndpointMapping.Keys)}");
                    return StatusCode(500, $"No mapping found for endpoint: {endpointKey}");
                }

                Console.WriteLine($"[API Chaining] Found mapping: {endpointKey} -> {shortName}");

                // Map the category from database to mapping file
                var mappingCategory = endpoint.Category.ToLower() switch
                {
                    "people" => "persons",
                    _ => endpoint.Category.ToLower()
                };

                if (!_chainMapping.TryGetValue(mappingCategory, out var categoryMapping))
                {
                    Console.WriteLine($"[API Chaining] No category mapping found for: {mappingCategory}");
                    Console.WriteLine($"[API Chaining] Available categories: {string.Join(", ", _chainMapping.Keys)}");
                    return StatusCode(500, $"No category mapping found for: {mappingCategory}");
                }

                if (!categoryMapping.TryGetValue(shortName, out var endpointMapping))
                {
                    Console.WriteLine($"[API Chaining] No endpoint mapping found for: {shortName}");
                    Console.WriteLine($"[API Chaining] Available endpoints in category {mappingCategory}: {string.Join(", ", categoryMapping.Keys)}");
                    return StatusCode(500, $"No endpoint mapping found for: {shortName}");
                }

                Console.WriteLine($"[API Chaining] Found chain mapping for {mappingCategory}.{shortName}");
                Console.WriteLine($"[API Chaining] Chain mapping content: {endpointMapping}");

                // Get the mapping for this endpoint
                var mapping = JsonSerializer.Deserialize<EndpointMapping>(endpointMapping.ToString(), new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });
                if (mapping == null)
                {
                    Console.WriteLine($"[API Chaining] Failed to deserialize chain mapping for {shortName}");
                    return StatusCode(500, $"Failed to deserialize chain mapping for {shortName}");
                }

                Console.WriteLine($"[API Chaining] Deserialized mapping - Requires: {string.Join(", ", mapping.Requires)}");
                Console.WriteLine($"[API Chaining] Deserialized mapping - Provides: {JsonSerializer.Serialize(mapping.Provides)}");

                // Get the original path from the endpoint
                var originalPath = endpoint.Url;
                Console.WriteLine($"[API Chaining] Original path: {originalPath}");

                // Get request parameters from execution request and context
                var requestParams = new Dictionary<string, object>();
                if (executionRequest?.Parameters != null)
                {
                    foreach (var param in executionRequest.Parameters)
                    {
                        requestParams[param.Key] = param.Value;
                    }
                }
                Console.WriteLine($"[API Chaining] Request parameters: {JsonSerializer.Serialize(requestParams)}");

                // Check required parameters
                Console.WriteLine($"[API Chaining] Checking required parameters: {string.Join(", ", mapping.Requires)}");
                foreach (var required in mapping.Requires)
                {
                    if (!requestParams.ContainsKey(required) && !context.ContainsKey(required))
                    {
                        return BadRequest($"Missing required parameter: {required}");
                    }
                }

                // Build the URL with parameters
                var url = originalPath;
                // First try to replace from context
                foreach (var param in context)
                {
                    // Extract the key without the API name prefix (e.g., "createPerson.id" -> "id")
                    var key = param.Key.Split('.').Last();
                    var placeholder = $"{{{key}}}";
                    if (url.Contains(placeholder))
                    {
                        url = url.Replace(placeholder, param.Value.ToString());
                        Console.WriteLine($"[API Chaining] Replaced {placeholder} with {param.Value} from context (key: {param.Key})");
                    }
                }
                // Then try to replace from request parameters
                foreach (var param in requestParams)
                {
                    var placeholder = $"{{{param.Key}}}";
                    if (url.Contains(placeholder))
                    {
                        url = url.Replace(placeholder, param.Value.ToString());
                        Console.WriteLine($"[API Chaining] Replaced {placeholder} with {param.Value} from request parameters");
                    }
                }
                Console.WriteLine($"[API Chaining] Final URL: {url}");
                Console.WriteLine($"[API Chaining] HTTP Method: {endpoint.Method}");

                // Make the API call
                var request = new HttpRequestMessage(new HttpMethod(endpoint.Method), url);

                // Add request body for POST and PUT methods
                if ((endpoint.Method == "POST" || endpoint.Method == "PUT") && 
                    executionRequest?.RequestBodies != null && 
                    executionRequest.RequestBodies.TryGetValue(endpoint.Id, out var requestBody))
                {
                    var bodyJson = JsonSerializer.Serialize(requestBody);
                    Console.WriteLine($"[API Chaining] Request body: {bodyJson}");
                    request.Content = new StringContent(bodyJson, System.Text.Encoding.UTF8, "application/json");
                }

                // Execute the API call
                var startTime = DateTime.UtcNow;
                var response = await httpClient.SendAsync(request);
                var endTime = DateTime.UtcNow;
                var executionTime = (long)(endTime - startTime).TotalMilliseconds;

                var content = await response.Content.ReadAsStringAsync();
                Console.WriteLine($"[API Chaining] Response status: {response.StatusCode}");
                Console.WriteLine($"[API Chaining] Response content: {content}");
                Console.WriteLine($"[API Chaining] Execution time: {executionTime}ms");

                results.Add(new ExecutionResult
                {
                    EndpointId = connection.ApiEndpointId,
                    StatusCode = (int)response.StatusCode,
                    Response = content,
                    ExecutionTimeMs = executionTime
                });

                // Update context with provided values only if the response was successful
                if (response.IsSuccessStatusCode && mapping.Provides != null)
                {
                    try
                    {
                        var responseData = JsonSerializer.Deserialize<JsonElement>(content);
                        Console.WriteLine($"[API Chaining] Response data: {JsonSerializer.Serialize(responseData)}");
                        
                        // Get the provides dictionary directly from the mapping
                        var provides = mapping.Provides;
                        Console.WriteLine($"[API Chaining] Provides mapping: {JsonSerializer.Serialize(provides)}");

                        foreach (var provide in provides)
                        {
                            Console.WriteLine($"[API Chaining] Processing provide mapping: {provide.Key} -> {provide.Value}");
                            
                            // Get the actual property name from the response
                            var propertyName = provide.Key;
                            Console.WriteLine($"[API Chaining] Looking for property: {propertyName}");
                            
                            if (responseData.TryGetProperty(propertyName, out var valueElement))
                            {
                                var value = valueElement.GetString();
                                // Store with the full path as the key
                                context[provide.Value] = value;
                                Console.WriteLine($"[API Chaining] Added to context: {provide.Value} = {value}");
                            }
                            else
                            {
                                Console.WriteLine($"[API Chaining] Property not found: {propertyName}");
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"[API Chaining] Error parsing response: {ex.Message}");
                        Console.WriteLine($"[API Chaining] Response content: {content}");
                        Console.WriteLine($"[API Chaining] Stack trace: {ex.StackTrace}");
                    }
                }
                else
                {
                    Console.WriteLine($"[API Chaining] Skipping context update due to non-success status code: {response.StatusCode}");
                }

                // Log current context state
                Console.WriteLine($"[API Chaining] Current context: {JsonSerializer.Serialize(context)}");

                // Add delay between API calls (except for the last one)
                if (connection != apiIntegration.Connections.OrderBy(c => c.SequenceNumber).Last())
                {
                    var delayStart = DateTime.UtcNow;
                    Console.WriteLine($"[API Chaining] Starting 2-second delay at {delayStart}");
                    await Task.Delay(2000); // 2 second delay
                    var delayEnd = DateTime.UtcNow;
                    Console.WriteLine($"[API Chaining] Finished 2-second delay at {delayEnd}. Total delay: {(delayEnd - delayStart).TotalSeconds} seconds");
                }

                // Log context before next API call
                Console.WriteLine($"[API Chaining] Context before next API call: {JsonSerializer.Serialize(context)}");
            }

            return Ok(new { Results = results });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[API Chaining] Error executing API call: {ex.Message}");
            Console.WriteLine($"[API Chaining] Stack trace: {ex.StackTrace}");
            return StatusCode(500, ex.Message);
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ApiIntegrationResponseDto>> Update(int id, ApiIntegrationDto dto)
    {
        var integration = await _context.ApiIntegrations
            .Include(i => i.Connections)
            .FirstOrDefaultAsync(i => i.Id == id);

        if (integration == null)
            return NotFound();

        // Check if name is being changed and if it conflicts with another integration
        if (integration.Name.ToLower() != dto.Name.ToLower() &&
            await _context.ApiIntegrations.AnyAsync(i => i.Id != id && i.Name.ToLower() == dto.Name.ToLower()))
        {
            return BadRequest($"An integration with the name '{dto.Name}' already exists.");
        }

        integration.Name = dto.Name;
        integration.LastModifiedAt = DateTime.UtcNow;

        // Remove existing connections
        _context.ApiIntegrationConnections.RemoveRange(integration.Connections);

        // Add new connections
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
        return Ok(response);
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(int id)
    {
        var integration = await _context.ApiIntegrations
            .Include(i => i.Connections)
            .FirstOrDefaultAsync(i => i.Id == id);

        if (integration == null)
            return NotFound();

        // Remove all connections first (due to foreign key constraints)
        _context.ApiIntegrationConnections.RemoveRange(integration.Connections);
        _context.ApiIntegrations.Remove(integration);
        
        await _context.SaveChangesAsync();
        return NoContent();
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
    public int EndpointId { get; set; }
    public int StatusCode { get; set; }
    public string Response { get; set; } = string.Empty;
    public long ExecutionTimeMs { get; set; }
}

public class ExecutionRequest
{
    public Dictionary<string, object> Parameters { get; set; } = new();
    public Dictionary<int, object> RequestBodies { get; set; } = new();
    public string? Token { get; set; }
}

public class ApiEndpointMapping
{
    public Dictionary<string, Dictionary<string, string>> ApiEndpoints { get; set; } = new();
}

public class EndpointMapping
{
    public List<string> Requires { get; set; } = new();
    public Dictionary<string, string> Provides { get; set; } = new();
} 