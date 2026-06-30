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
    public class StartupCompetitionsControllerTests
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
        public async Task AddStartupCompetition_AuthenticatedUser_ReturnsOkAndAddsStartupCompetition()
        {
            // Arrange
            using var context = TestDatabaseFixture.CreateDbContext();
            var controller = new StartupCompetitionsController(context)
            {
                ControllerContext = CreateMockUserContext("123")
            };

            var dto = new CreateStartupCompetitionDto
            {
                CompetitionName = "E-Cell Pitch Day",
                ProjectName = "Aegis Health AI",
                Role = "Co-founder & Pitcher",
                Result = "First Place & Incubation",
                Description = "A student health tech idea pitched to angel investors",
                Date = DateTime.UtcNow
            };

            // Act
            var result = await controller.AddStartupCompetition(dto);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var record = Assert.IsType<StartupCompetition>(okResult.Value);

            Assert.Equal("E-Cell Pitch Day", record.CompetitionName);
            Assert.Equal(123, record.UserId);
        }

        [Fact]
        public async Task GetStartupCompetitions_ReturnsOnlyUserRecords()
        {
            // Arrange
            using var context = TestDatabaseFixture.CreateDbContext();
            context.StartupCompetitions.Add(new StartupCompetition { CompetitionName = "Pitch Contest A", ProjectName = "Idea A", UserId = 123 });
            context.StartupCompetitions.Add(new StartupCompetition { CompetitionName = "Pitch Contest B", ProjectName = "Idea B", UserId = 456 });
            await context.SaveChangesAsync();

            var controller = new StartupCompetitionsController(context)
            {
                ControllerContext = CreateMockUserContext("123")
            };

            // Act
            var result = await controller.GetStartupCompetitions();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var records = Assert.IsType<List<StartupCompetition>>(okResult.Value);

            Assert.Single(records);
            Assert.Equal("Pitch Contest A", records[0].CompetitionName);
        }

        [Fact]
        public async Task DeleteStartupCompetition_Owner_DeletesSuccessfully()
        {
            // Arrange
            using var context = TestDatabaseFixture.CreateDbContext();
            var record = new StartupCompetition { Id = 4, CompetitionName = "Delete Me", ProjectName = "Idea Delete", UserId = 123 };
            context.StartupCompetitions.Add(record);
            await context.SaveChangesAsync();

            var controller = new StartupCompetitionsController(context)
            {
                ControllerContext = CreateMockUserContext("123")
            };

            // Act
            var result = await controller.DeleteStartupCompetition(4);

            // Assert
            Assert.IsType<OkObjectResult>(result);
            var deletedRecord = await context.StartupCompetitions.FindAsync(4);
            Assert.Null(deletedRecord);
        }
    }
}
