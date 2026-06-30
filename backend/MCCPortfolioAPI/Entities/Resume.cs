namespace MCCPortfolioAPI.Entities
{
    public class Resume
    {
        public int Id { get; set; }

        public string ResumeTitle { get; set; } = string.Empty;

        public string ResumeUrl { get; set; } = string.Empty;

        public int UserId { get; set; }

        public User User { get; set; } = null!;
    }
}
