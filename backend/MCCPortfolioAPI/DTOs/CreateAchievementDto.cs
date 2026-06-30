namespace MCCPortfolioAPI.DTOs
{
    public class CreateAchievementDto
    {
        public string Title { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        public string AchievementUrl { get; set; } = string.Empty;

        public string Category { get; set; } = string.Empty;

        public DateTime AchievementDate { get; set; }
    }
}