using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ApiIntegration.Api.Models;

public class ApiIntegrationConnection
{
    [Key]
    public int Id { get; set; }

    public int ApiIntegrationId { get; set; }
    public int ApiEndpointId { get; set; }
    
    [Required]
    public int SequenceNumber { get; set; }

    // Navigation properties - using virtual for lazy loading
    [ForeignKey("ApiIntegrationId")]
    public virtual ApiIntegration ApiIntegration { get; set; } = null!;
    
    [ForeignKey("ApiEndpointId")]
    public virtual ApiEndpoint ApiEndpoint { get; set; } = null!;
} 