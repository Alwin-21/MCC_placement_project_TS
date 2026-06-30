namespace MCCPortfolioAPI.Entities
{
    public class Skill
    {
        public int Id { get; set; }

        public string Name { get; set; } = string.Empty;

        public string Level { get; set; } = string.Empty;

        public string Category { get; set; } = string.Empty;

        // Foreign Key

        public int UserId { get; set; }

        public User User { get; set; } = null!;
    }
}