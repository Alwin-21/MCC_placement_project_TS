using System;

namespace MCCPortfolioAPI.Entities
{
    public class AcademicRecord
    {
        public int Id { get; set; }

        public string Institution { get; set; } = string.Empty;

        public string Degree { get; set; } = string.Empty;

        public string FieldOfStudy { get; set; } = string.Empty;

        public string Grade { get; set; } = string.Empty;

        public int StartYear { get; set; }

        public int EndYear { get; set; }

        public string AttachmentUrl { get; set; } = string.Empty;

        // Foreign Key
        public int UserId { get; set; }

        public User User { get; set; } = null!;
    }
}
