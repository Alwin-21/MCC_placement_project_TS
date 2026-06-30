namespace MCCPortfolioAPI.DTOs
{
    public class CreateCertificationDto
    {
        public string Title { get; set; } = string.Empty;

        public string Issuer { get; set; } = string.Empty;

        public string CertificateUrl { get; set; } = string.Empty;

        public DateTime IssueDate { get; set; }

        public string Category { get; set; } = string.Empty;
    }
}