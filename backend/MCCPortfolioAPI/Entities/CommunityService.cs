using System;

namespace MCCPortfolioAPI.Entities
{
    public class CommunityService
    {
        public int Id { get; set; }

        public string Title { get; set; } = string.Empty;

        public string Organization { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        public double HoursServed { get; set; }

        public DateTime Date { get; set; }

        public string AttachmentUrl { get; set; } = string.Empty;

        // Foreign Key
        public int UserId { get; set; }

        public User User { get; set; } = null!;
    }
}
