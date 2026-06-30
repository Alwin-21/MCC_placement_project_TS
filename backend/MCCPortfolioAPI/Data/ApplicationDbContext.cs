
using Microsoft.EntityFrameworkCore;
using MCCPortfolioAPI.Entities;

namespace MCCPortfolioAPI.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Skill> Skills { get; set; }
        public DbSet<Profile> Profiles { get; set; }
        public DbSet<Certification> Certifications { get; set; }
        public DbSet<ResearchPaper> ResearchPapers { get; set; }
        public DbSet<Achievement> Achievements { get; set; }
        public DbSet<Hackathon> Hackathons { get; set; }
        public DbSet<Project> Projects { get; set; }
        public DbSet<Resume> Resumes { get; set; }
        public DbSet<CommunityService> CommunityServices { get; set; }
        public DbSet<CreativeWork> CreativeWorks { get; set; }
        public DbSet<InstitutionDetail> InstitutionDetails { get; set; }
        public DbSet<Notification> Notifications { get; set; }
        public DbSet<ThemeConfig> ThemeConfigs { get; set; }
        public DbSet<AuditLog> AuditLogs { get; set; }
        public DbSet<AcademicRecord> AcademicRecords { get; set; }
        public DbSet<Olympiad> Olympiads { get; set; }
        public DbSet<StartupCompetition> StartupCompetitions { get; set; }
        public DbSet<NgoActivity> NgoActivities { get; set; }
        public DbSet<SportsAchievement> SportsAchievements { get; set; }
        public DbSet<Experience> Experiences { get; set; }
    }
}