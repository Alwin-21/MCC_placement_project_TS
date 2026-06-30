using System;

namespace MCCPortfolioAPI.Entities
{
    public class Olympiad
    {
        public int Id { get; set; }

        public string Name { get; set; } = string.Empty;

        public string Subject { get; set; } = string.Empty;

        public string Rank { get; set; } = string.Empty;

        public int Year { get; set; }

        public string Description { get; set; } = string.Empty;

        public string CertificateUrl { get; set; } = string.Empty;

        // Foreign Key
        public int UserId { get; set; }

        public User User { get; set; } = null!;
    }
}
