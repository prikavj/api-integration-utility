using System.ComponentModel.DataAnnotations;

namespace ApiIntegration.Api.Models;

public class ApiEndpoint
{
    [Key]
    public int Id { get; set; }
    
    [Required]
    public string Name { get; set; } = string.Empty;
    
    [Required]
    public string Url { get; set; } = string.Empty;
    
    [Required]
    public string Method { get; set; } = string.Empty;
    
    [Required]
    public string Description { get; set; } = string.Empty;
    
    public string Category { get; set; } = string.Empty;  // e.g., "People", "Products"
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
} 