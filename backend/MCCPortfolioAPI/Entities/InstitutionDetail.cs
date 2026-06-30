using System.ComponentModel.DataAnnotations;

namespace MCCPortfolioAPI.Entities
{
    public class InstitutionDetail
    {
        public int Id { get; set; }

        [Required]
        public string Name { get; set; } = "Madras Christian College";

        public string Code { get; set; } = "MCC";

        public string Description { get; set; } = string.Empty;

        public string Address { get; set; } = string.Empty;

        public string ContactEmail { get; set; } = string.Empty;

        public string ContactPhone { get; set; } = string.Empty;

        public string Website { get; set; } = string.Empty;

        public string LogoUrl { get; set; } = string.Empty;

        public string Departments { get; set; } = "Computer Science;BCA;Physics;Chemistry;English;Mathematics;Commerce";
    }
}
