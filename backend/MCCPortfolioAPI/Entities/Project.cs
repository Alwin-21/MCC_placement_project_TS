namespace MCCPortfolioAPI.Entities
{
    public class Project
    {
        public int Id { get; set; }

        public string Title { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        public string Technologies { get; set; } = string.Empty;

        public string GithubUrl { get; set; } = string.Empty;

        public string LiveUrl { get; set; } = string.Empty;

        public string Category { get; set; } = "Software Project";

        public string DemoVideoUrl { get; set; } = string.Empty;

        public string ImageUrl { get; set; } = string.Empty;

        public int UserId { get; set; }

        public User User { get; set; } = null!;
    }
}