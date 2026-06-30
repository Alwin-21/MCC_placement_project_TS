using System;

namespace MCCPortfolioAPI.DTOs
{
    public class CreateSportsAchievementDto
    {
        public string SportName { get; set; } = string.Empty;

        public string Level { get; set; } = string.Empty;

        public string Achievement { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        public DateTime Date { get; set; }

        public string CertificateUrl { get; set; } = string.Empty;
    }
}
