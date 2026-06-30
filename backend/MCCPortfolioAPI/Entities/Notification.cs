using System;
using System.ComponentModel.DataAnnotations;

namespace MCCPortfolioAPI.Entities
{
    public class Notification
    {
        public int Id { get; set; }

        [Required]
        public string Title { get; set; } = string.Empty;

        [Required]
        public string Message { get; set; } = string.Empty;

        public string Type { get; set; } = "Info"; // Info, Warning, Alert, Broadcast

        public bool IsRead { get; set; } = false;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Target user (null for system-wide broadcasts)
        public int? UserId { get; set; }
        
        public User? User { get; set; }
    }
}
