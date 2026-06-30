using System.Text.Json.Serialization;

namespace MCCPortfolioAPI.Entities
{
    public class Profile
    {
        public int Id { get; set; }

        public string Bio { get; set; } = string.Empty;

        public string LinkedInUrl { get; set; } = string.Empty;

        public string GitHubUrl { get; set; } = string.Empty;

        public string BehanceUrl { get; set; } = string.Empty;

        public string GitHubUsername { get; set; } = string.Empty;

        public string TargetCareer { get; set; } = string.Empty;

        [JsonPropertyName("cgpa")]
        public double CGPA { get; set; } = 0.0;

        public string ProfileImageUrl { get; set; } = string.Empty;

        public string SelectedTheme { get; set; } = "Academic";

        public bool IsApproved { get; set; } = false;

        public string PersonalStory { get; set; } = string.Empty;

        public string SOP { get; set; } = string.Empty;

        public bool IsAlumni { get; set; } = false;

        public int? GraduationYear { get; set; }

        public string CurrentCompany { get; set; } = string.Empty;

        public string CurrentJobTitle { get; set; } = string.Empty;

        public string HigherStudyUniversity { get; set; } = string.Empty;

        public string HigherStudyProgram { get; set; } = string.Empty;

        public string Course { get; set; } = string.Empty;

        public string YearOfStudy { get; set; } = string.Empty;

        public string CurrentLocation { get; set; } = string.Empty;

        public string Phone { get; set; } = string.Empty;

        public string Languages { get; set; } = string.Empty;

        public string TestScores { get; set; } = string.Empty;

        public string Patents { get; set; } = string.Empty;

        public string InstagramUrl { get; set; } = string.Empty;

        public string BlogUrl { get; set; } = string.Empty;

        public string OtherHandles { get; set; } = string.Empty;

        // Foreign Key

        public int UserId { get; set; }

        public User User { get; set; } = null!;
    }
}