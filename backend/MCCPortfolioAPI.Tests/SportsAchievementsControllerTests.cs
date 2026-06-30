using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using MCCPortfolioAPI.Controllers;
using MCCPortfolioAPI.DTOs;
using MCCPortfolioAPI.Entities;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Xunit;

namespace MCCPortfolioAPI.Tests
{
    public class SportsAchievementsControllerTests
    {
        private ControllerContext CreateMockUserContext(string userId)
        {
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, userId),
                new Claim(ClaimTypes.Name, "Student User")
            };
            var identity = new ClaimsIdentity(claims, "TestAuthType");
            var claimsPrincipal = new ClaimsPrincipal(identity);

            return new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = claimsPrincipal }
            };
        }

        [Fact]
        public async Task AddSportsAchievement_AuthenticatedUser_ReturnsOkAndAddsSportsAchievement()
        {
            // Arrange
            using var context = TestDatabaseFixture.CreateDbContext();
            var controller = new SportsAchievementsController(context)
            {
                ControllerContext = CreateMockUserContext("123")
            };

            var dto = new CreateSportsAchievementDto
            {
                SportName = "Football",
                Level = "University Level",
                Achievement = "Best Midfielder Cup",
                Description = "Captain of MCC Football Team during university tournament",
                Date = DateTime.UtcNow
            };

            // Act
            var result = await controller.AddSportsAchievement(dto);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var record = Assert.IsType<SportsAchievement>(okResult.Value);

            Assert.Equal("Football", record.SportName);
            Assert.Equal(123, record.UserId);
        }

        [Fact]
        public async Task GetSportsAchievements_ReturnsOnlyUserRecords()
        {
            // Arrange
            using var context = TestDatabaseFixture.CreateDbContext();
            context.SportsAchievements.Add(new SportsAchievement { SportName = "Football", Achievement = "Cup A", UserId = 123 });
            context.SportsAchievements.Add(new SportsAchievement { SportName = "Cricket", Achievement = "Cup B", UserId = 456 });
            await context.SaveChangesAsync();

            var controller = new SportsAchievementsController(context)
            {
                ControllerContext = CreateMockUserContext("123")
            };

            // Act
            var result = await controller.GetSportsAchievements();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var records = Assert.IsType<List<SportsAchievement>>(okResult.Value);

            Assert.Single(records);
            Assert.Equal("Football", records[0].SportName);
        }

        [Fact]
        public async Task DeleteSportsAchievement_Owner_DeletesSuccessfully()
        {
            // Arrange
            using var context = TestDatabaseFixture.CreateDbContext();
            var record = new SportsAchievement { Id = 7, SportName = "Delete Me", Achievement = "Cup C", UserId = 123 };
            context.SportsAchievements.Add(record);
            await context.SaveChangesAsync();

            var controller = new SportsAchievementsController(context)
            {
                ControllerContext = CreateMockUserContext("123")
            };

            // Act
            var result = await controller.DeleteSportsAchievement(7);

            // Assert
            Assert.IsType<OkObjectResult>(result);
            var deletedRecord = await context.SportsAchievements.FindAsync(7);
            Assert.Null(deletedRecord);
        }
    }
}
