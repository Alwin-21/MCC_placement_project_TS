using System;

namespace MCCPortfolioAPI.Entities
{
    public class SportsAchievement
    {
        public int Id { get; set; }

        public string SportName { get; set; } = string.Empty;

        public string Level { get; set; } = string.Empty; // District, State, National, University, etc.

        public string Achievement { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        public DateTime Date { get; set; }

        public string CertificateUrl { get; set; } = string.Empty;

        // Foreign Key
        public int UserId { get; set; }

        public User User { get; set; } = null!;
    }
}
