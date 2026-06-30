namespace MCCPortfolioAPI.DTOs
{
    public class ExternalLoginDto
    {
        public string Email { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string Provider { get; set; } = string.Empty; // "Google" or "GitHub"
        public string ExternalId { get; set; } = string.Empty;
    }
}
