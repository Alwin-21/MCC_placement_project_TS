using System;

namespace MCCPortfolioAPI.Entities
{
    public class NgoActivity
    {
        public int Id { get; set; }

        public string OrganizationName { get; set; } = string.Empty;

        public string Role { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        public double HoursContributed { get; set; }

        public DateTime StartDate { get; set; }

        public DateTime? EndDate { get; set; }

        public string CertificateUrl { get; set; } = string.Empty;

        // Foreign Key
        public int UserId { get; set; }

        public User User { get; set; } = null!;
    }
}
