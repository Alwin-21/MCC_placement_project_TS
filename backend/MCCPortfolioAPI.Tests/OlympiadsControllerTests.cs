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
    public class OlympiadsControllerTests
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
        public async Task AddOlympiad_AuthenticatedUser_ReturnsOkAndAddsOlympiad()
        {
            // Arrange
            using var context = TestDatabaseFixture.CreateDbContext();
            var controller = new OlympiadsController(context)
            {
                ControllerContext = CreateMockUserContext("123")
            };

            var dto = new CreateOlympiadDto
            {
                Name = "National Cyber Olympiad",
                Subject = "Computer Science",
                Rank = "AIR 12",
                Year = 2024,
                Description = "High school computer science olympiad"
            };

            // Act
            var result = await controller.AddOlympiad(dto);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var record = Assert.IsType<Olympiad>(okResult.Value);

            Assert.Equal("National Cyber Olympiad", record.Name);
            Assert.Equal(123, record.UserId);
        }

        [Fact]
        public async Task GetOlympiads_ReturnsOnlyUserRecords()
        {
            // Arrange
            using var context = TestDatabaseFixture.CreateDbContext();
            context.Olympiads.Add(new Olympiad { Name = "Math Olympiad", Subject = "Math", UserId = 123 });
            context.Olympiads.Add(new Olympiad { Name = "Science Olympiad", Subject = "Physics", UserId = 456 });
            await context.SaveChangesAsync();

            var controller = new OlympiadsController(context)
            {
                ControllerContext = CreateMockUserContext("123")
            };

            // Act
            var result = await controller.GetOlympiads();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var records = Assert.IsType<List<Olympiad>>(okResult.Value);

            Assert.Single(records);
            Assert.Equal("Math Olympiad", records[0].Name);
        }

        [Fact]
        public async Task DeleteOlympiad_Owner_DeletesSuccessfully()
        {
            // Arrange
            using var context = TestDatabaseFixture.CreateDbContext();
            var record = new Olympiad { Id = 3, Name = "Delete Me", Subject = "Chemistry", UserId = 123 };
            context.Olympiads.Add(record);
            await context.SaveChangesAsync();

            var controller = new OlympiadsController(context)
            {
                ControllerContext = CreateMockUserContext("123")
            };

            // Act
            var result = await controller.DeleteOlympiad(3);

            // Assert
            Assert.IsType<OkObjectResult>(result);
            var deletedRecord = await context.Olympiads.FindAsync(3);
            Assert.Null(deletedRecord);
        }
    }
}
