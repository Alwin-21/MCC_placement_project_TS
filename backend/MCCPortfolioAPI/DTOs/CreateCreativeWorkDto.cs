using System;

namespace MCCPortfolioAPI.DTOs
{
    public class CreateCreativeWorkDto
    {
        public string Title { get; set; } = string.Empty;

        public string Category { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        public string WorkUrl { get; set; } = string.Empty;

        public string MediaUrl { get; set; } = string.Empty;

        public DateTime Date { get; set; }
    }
}
