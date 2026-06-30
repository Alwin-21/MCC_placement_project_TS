using System;

namespace MCCPortfolioAPI.DTOs
{
    public class CreateAcademicRecordDto
    {
        public string Institution { get; set; } = string.Empty;

        public string Degree { get; set; } = string.Empty;

        public string FieldOfStudy { get; set; } = string.Empty;

        public string Grade { get; set; } = string.Empty;

        public int StartYear { get; set; }

        public int EndYear { get; set; }

        public string AttachmentUrl { get; set; } = string.Empty;
    }
}
