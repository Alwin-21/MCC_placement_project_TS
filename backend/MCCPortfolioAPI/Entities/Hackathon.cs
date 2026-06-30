namespace MCCPortfolioAPI.Entities
{
    public class Hackathon
    {
        public int Id { get; set; }

        public string Title { get; set; } = string.Empty;

        public string Organizer { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        public string ProjectName { get; set; } = string.Empty;

        public string HackathonUrl { get; set; } = string.Empty;

        public string CertificateUrl { get; set; } = string.Empty;

        public DateTime EventDate { get; set; }

        public int UserId { get; set; }

        public User User { get; set; } = null!;
    }
}