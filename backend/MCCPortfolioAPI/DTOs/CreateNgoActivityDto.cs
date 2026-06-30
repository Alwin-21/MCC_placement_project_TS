using System;

namespace MCCPortfolioAPI.DTOs
{
    public class CreateNgoActivityDto
    {
        public string OrganizationName { get; set; } = string.Empty;

        public string Role { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        public double HoursContributed { get; set; }

        public DateTime StartDate { get; set; }

        public DateTime? EndDate { get; set; }

        public string CertificateUrl { get; set; } = string.Empty;
    }
}
