using System;

namespace MCCPortfolioAPI.DTOs
{
    public class CreateStartupCompetitionDto
    {
        public string CompetitionName { get; set; } = string.Empty;

        public string ProjectName { get; set; } = string.Empty;

        public string Role { get; set; } = string.Empty;

        public string Result { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        public DateTime Date { get; set; }

        public string PitchDeckUrl { get; set; } = string.Empty;
    }
}
