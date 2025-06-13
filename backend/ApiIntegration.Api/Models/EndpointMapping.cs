using System.Text.Json.Serialization;

namespace ApiIntegration.Api.Models
{
    public class EndpointMapping
    {
        [JsonPropertyName("requires")]
        public List<string> Requires { get; set; } = new List<string>();

        [JsonPropertyName("provides")]
        public Dictionary<string, string> Provides { get; set; } = new Dictionary<string, string>();
    }
} 