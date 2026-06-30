namespace MCCPortfolioAPI.Entities
{
    public class Achievement
    {
        public int Id { get; set; }

        public string Title { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        public string AchievementUrl { get; set; } = string.Empty;

        public string Category { get; set; } = "Academic Award";

        public DateTime AchievementDate { get; set; }

        public int UserId { get; set; }

        public User User { get; set; } = null!;
    }
}