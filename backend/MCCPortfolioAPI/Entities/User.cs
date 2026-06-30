using MCCPortfolioAPI.Models;
using System.ComponentModel.DataAnnotations;

namespace MCCPortfolioAPI.Entities
{
    public class User
    {
        public int Id { get; set; }

        [Required]
        public string FullName { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string PasswordHash { get; set; } = string.Empty;

        public string Department { get; set; } = string.Empty;

        public string RegisterNumber { get; set; } = string.Empty;

        public string ProfileImageUrl { get; set; } = string.Empty;

        public UserRole Role { get; set; } = UserRole.Student;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}