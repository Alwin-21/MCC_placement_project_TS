using System;

namespace MCCPortfolioAPI.DTOs
{
    public class CreateOlympiadDto
    {
        public string Name { get; set; } = string.Empty;

        public string Subject { get; set; } = string.Empty;

        public string Rank { get; set; } = string.Empty;

        public int Year { get; set; }

        public string Description { get; set; } = string.Empty;

        public string CertificateUrl { get; set; } = string.Empty;
    }
}
