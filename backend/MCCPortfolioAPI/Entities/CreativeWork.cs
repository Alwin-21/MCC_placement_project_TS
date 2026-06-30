using System;

namespace MCCPortfolioAPI.Entities
{
    public class CreativeWork
    {
        public int Id { get; set; }

        public string Title { get; set; } = string.Empty;

        public string Category { get; set; } = string.Empty; // Artwork, UI Design, Photography, Writing, Video, etc.

        public string Description { get; set; } = string.Empty;

        public string WorkUrl { get; set; } = string.Empty;

        public string MediaUrl { get; set; } = string.Empty; // For uploaded files/images

        public DateTime Date { get; set; }

        // Foreign Key
        public int UserId { get; set; }

        public User User { get; set; } = null!;
    }
}
