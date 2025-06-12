using System;

namespace ApiIntegration.Api.Models
{
    public class Product
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public DateTime CreatedAt { get; set; }
        public Guid PersonId { get; set; }

        // Navigation property
        public Person Person { get; set; } = null!;
    }
} 