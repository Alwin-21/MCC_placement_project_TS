using System;

namespace MCCPortfolioAPI.DTOs
{
    public class CreateCommunityServiceDto
    {
        public string Title { get; set; } = string.Empty;

        public string Organization { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        public double HoursServed { get; set; }

        public DateTime Date { get; set; }

        public string AttachmentUrl { get; set; } = string.Empty;
    }
}
