using System.ComponentModel.DataAnnotations;

namespace MCCPortfolioAPI.Entities
{
    public class ThemeConfig
    {
        public int Id { get; set; }

        [Required]
        public string ThemeId { get; set; } = string.Empty;

        [Required]
        public string DisplayName { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        public bool IsActive { get; set; } = true;

        public string PrimaryColor { get; set; } = string.Empty;

        public string SecondaryColor { get; set; } = string.Empty;

        public string FontFamily { get; set; } = string.Empty;
    }
}
