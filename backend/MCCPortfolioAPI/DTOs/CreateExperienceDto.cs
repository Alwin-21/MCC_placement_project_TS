namespace MCCPortfolioAPI.DTOs
{
    public class CreateExperienceDto
    {
        public string Title { get; set; } = string.Empty;

        public string Company { get; set; } = string.Empty;

        public string Location { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        public string StartDate { get; set; } = string.Empty;

        public string EndDate { get; set; } = string.Empty;

        public bool IsCurrent { get; set; }

        public string Category { get; set; } = string.Empty;
    }
}
