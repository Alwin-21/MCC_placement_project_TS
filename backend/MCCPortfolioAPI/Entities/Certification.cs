namespace MCCPortfolioAPI.Entities
{
    public class Certification
    {
        public int Id { get; set; }

        public string Title { get; set; } = string.Empty;

        public string Issuer { get; set; } = string.Empty;

        public string CertificateUrl { get; set; } = string.Empty;

        public DateTime IssueDate { get; set; }

        public string Category { get; set; } = string.Empty;

        // Foreign Key

        public int UserId { get; set; }

        public User User { get; set; } = null!;
    }
}