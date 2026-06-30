namespace MCCPortfolioAPI.DTOs
{
    public class CreateHackathonDto
    {
        public string Title { get; set; } = string.Empty;

        public string Organizer { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        public string ProjectName { get; set; } = string.Empty;

        public string HackathonUrl { get; set; } = string.Empty;

        public string CertificateUrl { get; set; } = string.Empty;

        public DateTime EventDate { get; set; }
    }
}