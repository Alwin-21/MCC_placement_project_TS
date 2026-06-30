namespace MCCPortfolioAPI.Entities
{
    public class ResearchPaper
    {
        public int Id { get; set; }

        public string Title { get; set; } = string.Empty;

        public string Abstract { get; set; } = string.Empty;

        public string Conference { get; set; } = string.Empty;

        public string PaperUrl { get; set; } = string.Empty;

        public string Category { get; set; } = "Journal Publication";

        public DateTime PublishedDate { get; set; }

        public int UserId { get; set; }

        public User User { get; set; } = null!;
    }
}