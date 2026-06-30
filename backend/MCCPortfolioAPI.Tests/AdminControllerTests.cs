using MCCPortfolioAPI.Controllers;
using MCCPortfolioAPI.Data;
using MCCPortfolioAPI.Entities;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Text.Json;
using System.Threading.Tasks;
using Xunit;

namespace MCCPortfolioAPI.Tests
{
    public class AdminControllerTests
    {
        private class DashboardStats
        {
            public int TotalStudents { get; set; }
            public int TotalSkills { get; set; }
            public int TotalProjects { get; set; }
            public int TotalAchievements { get; set; }
            public int TotalHackathons { get; set; }
            public int TotalResearchPapers { get; set; }
        }

        private class StudentProfileResponse
        {
            public int Id { get; set; }
            public string FullName { get; set; } = string.Empty;
            public string Email { get; set; } = string.Empty;
            public string Department { get; set; } = string.Empty;
            public bool IsApproved { get; set; }
            public string SelectedTheme { get; set; } = string.Empty;
        }

        private class ApprovalResponse
        {
            public bool IsApproved { get; set; }
        }

        private static readonly JsonSerializerOptions _jsonOptions = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        };

        [Fact]
        public async Task GetDashboard_ReturnsCorrectCounts()
        {
            // Arrange
            using var context = TestDatabaseFixture.CreateDbContext();

            // Add test data
            context.Users.Add(new User { Email = "student1@example.com" });
            context.Users.Add(new User { Email = "student2@example.com" });
            context.Skills.Add(new Skill { Name = "C#", UserId = 1 });
            context.Projects.Add(new Project { Title = "Project A", UserId = 1 });
            context.Projects.Add(new Project { Title = "Project B", UserId = 2 });
            context.Achievements.Add(new Achievement { Title = "Top coder", UserId = 1 });
            context.Hackathons.Add(new Hackathon { Title = "Smart India Hackathon", UserId = 1 });
            context.ResearchPapers.Add(new ResearchPaper { Title = "AI Paper", UserId = 2 });

            await context.SaveChangesAsync();

            var controller = new AdminController(context);

            // Act
            var result = await controller.GetDashboard();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            
            var json = JsonSerializer.Serialize(okResult.Value);
            var stats = JsonSerializer.Deserialize<DashboardStats>(json, _jsonOptions);

            Assert.NotNull(stats);
            Assert.Equal(2, stats.TotalStudents);
            Assert.Equal(1, stats.TotalSkills);
            Assert.Equal(2, stats.TotalProjects);
            Assert.Equal(1, stats.TotalAchievements);
            Assert.Equal(1, stats.TotalHackathons);
            Assert.Equal(1, stats.TotalResearchPapers);
        }

        [Fact]
        public async Task GetStudents_ReturnsStudentsJoinedWithProfiles()
        {
            // Arrange
            using var context = TestDatabaseFixture.CreateDbContext();

            var user1 = new User { Id = 1, FullName = "Alice", Email = "alice@example.com", Department = "CSE" };
            var user2 = new User { Id = 2, FullName = "Bob", Email = "bob@example.com", Department = "ECE" };
            context.Users.AddRange(user1, user2);

            context.Profiles.Add(new Profile { UserId = 1, IsApproved = true, SelectedTheme = "Dark" });
            await context.SaveChangesAsync();

            var controller = new AdminController(context);

            // Act
            var result = await controller.GetStudents();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            
            var json = JsonSerializer.Serialize(okResult.Value);
            var list = JsonSerializer.Deserialize<List<StudentProfileResponse>>(json, _jsonOptions);

            Assert.NotNull(list);
            Assert.Equal(2, list.Count);
            
            var aliceData = list[0];
            Assert.Equal("Alice", aliceData.FullName);
            Assert.True(aliceData.IsApproved);
            Assert.Equal("Dark", aliceData.SelectedTheme);

            var bobData = list[1];
            Assert.Equal("Bob", bobData.FullName);
            Assert.False(bobData.IsApproved); // profile doesn't exist, should default to false
            Assert.Equal("Academic", bobData.SelectedTheme); // should default to "Academic"
        }

        [Fact]
        public async Task ApprovePortfolio_UpdatesExistingProfileApproval()
        {
            // Arrange
            using var context = TestDatabaseFixture.CreateDbContext();

            context.Profiles.Add(new Profile { UserId = 123, IsApproved = false });
            await context.SaveChangesAsync();

            var controller = new AdminController(context);

            // Act
            var result = await controller.ApprovePortfolio(123, true);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            
            var json = JsonSerializer.Serialize(okResult.Value);
            var response = JsonSerializer.Deserialize<ApprovalResponse>(json, _jsonOptions);

            Assert.NotNull(response);
            Assert.True(response.IsApproved);

            var profile = await context.Profiles.FindAsync(1); // Auto-increment ID 1
            Assert.NotNull(profile);
            Assert.True(profile.IsApproved);
        }

        [Fact]
        public async Task ApprovePortfolio_CreatesProfileIfNotExists()
        {
            // Arrange
            using var context = TestDatabaseFixture.CreateDbContext();
            var controller = new AdminController(context);

            // Act
            var result = await controller.ApprovePortfolio(456, true);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            
            var json = JsonSerializer.Serialize(okResult.Value);
            var response = JsonSerializer.Deserialize<ApprovalResponse>(json, _jsonOptions);

            Assert.NotNull(response);
            Assert.True(response.IsApproved);

            // Verify profile is created
            var profile = await context.Profiles.FindAsync(1); // Auto-increment ID 1
            Assert.NotNull(profile);
            Assert.Equal(456, profile.UserId);
            Assert.True(profile.IsApproved);
        }
    }
}
