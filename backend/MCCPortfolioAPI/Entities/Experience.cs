namespace MCCPortfolioAPI.Entities
{
    public class Experience
    {
        public int Id { get; set; }

        public string Title { get; set; } = string.Empty;

        public string Company { get; set; } = string.Empty;

        public string Location { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        public string StartDate { get; set; } = string.Empty;

        public string EndDate { get; set; } = string.Empty;

        public bool IsCurrent { get; set; }

        public string Category { get; set; } = string.Empty; // Full-time jobs, Internships, Part-time jobs, Volunteering, Administrative positions, Others

        // Foreign Key
        public int UserId { get; set; }

        public User User { get; set; } = null!;
    }
}
