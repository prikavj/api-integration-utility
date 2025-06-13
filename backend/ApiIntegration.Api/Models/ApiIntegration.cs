using System.ComponentModel.DataAnnotations;

namespace ApiIntegration.Api.Models;

public class ApiIntegration
{
    [Key]
    public int Id { get; set; }
    
    [Required]
    [StringLength(100)]
    public string Name { get; set; } = string.Empty;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastModifiedAt { get; set; }

    // Navigation property
    public ICollection<ApiIntegrationConnection> Connections { get; set; } = new List<ApiIntegrationConnection>();
} 