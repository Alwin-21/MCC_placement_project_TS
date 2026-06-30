namespace MCCPortfolioAPI.DTOs
{
    public class CreateProjectDto
    {
        public string Title { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        public string Technologies { get; set; } = string.Empty;

        public string GithubUrl { get; set; } = string.Empty;

        public string LiveUrl { get; set; } = string.Empty;

        public string Category { get; set; } = "Software Project";

        public string DemoVideoUrl { get; set; } = string.Empty;

        public string ImageUrl { get; set; } = string.Empty;
    }
}