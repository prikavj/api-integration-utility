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

    // Navigation properties
    [ForeignKey("ApiIntegrationId")]
    public ApiIntegration ApiIntegration { get; set; } = null!;
    
    [ForeignKey("ApiEndpointId")]
    public ApiEndpoint ApiEndpoint { get; set; } = null!;
} 