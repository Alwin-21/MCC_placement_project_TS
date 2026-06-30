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
    public class NgoActivitiesControllerTests
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
        public async Task AddNgoActivity_AuthenticatedUser_ReturnsOkAndAddsNgoActivity()
        {
            // Arrange
            using var context = TestDatabaseFixture.CreateDbContext();
            var controller = new NgoActivitiesController(context)
            {
                ControllerContext = CreateMockUserContext("123")
            };

            var dto = new CreateNgoActivityDto
            {
                OrganizationName = "Red Cross Youth",
                Role = "Blood Drive Volunteer Coordinator",
                Description = "Organized a campus wide blood donation program.",
                HoursContributed = 30,
                StartDate = DateTime.UtcNow
            };

            // Act
            var result = await controller.AddNgoActivity(dto);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var record = Assert.IsType<NgoActivity>(okResult.Value);

            Assert.Equal("Red Cross Youth", record.OrganizationName);
            Assert.Equal(123, record.UserId);
        }

        [Fact]
        public async Task GetNgoActivities_ReturnsOnlyUserRecords()
        {
            // Arrange
            using var context = TestDatabaseFixture.CreateDbContext();
            context.NgoActivities.Add(new NgoActivity { OrganizationName = "NGO A", Role = "Volunteer", UserId = 123 });
            context.NgoActivities.Add(new NgoActivity { OrganizationName = "NGO B", Role = "Volunteer", UserId = 456 });
            await context.SaveChangesAsync();

            var controller = new NgoActivitiesController(context)
            {
                ControllerContext = CreateMockUserContext("123")
            };

            // Act
            var result = await controller.GetNgoActivities();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var records = Assert.IsType<List<NgoActivity>>(okResult.Value);

            Assert.Single(records);
            Assert.Equal("NGO A", records[0].OrganizationName);
        }

        [Fact]
        public async Task DeleteNgoActivity_Owner_DeletesSuccessfully()
        {
            // Arrange
            using var context = TestDatabaseFixture.CreateDbContext();
            var record = new NgoActivity { Id = 6, OrganizationName = "Delete Me", Role = "Volunteer", UserId = 123 };
            context.NgoActivities.Add(record);
            await context.SaveChangesAsync();

            var controller = new NgoActivitiesController(context)
            {
                ControllerContext = CreateMockUserContext("123")
            };

            // Act
            var result = await controller.DeleteNgoActivity(6);

            // Assert
            Assert.IsType<OkObjectResult>(result);
            var deletedRecord = await context.NgoActivities.FindAsync(6);
            Assert.Null(deletedRecord);
        }
    }
}
