using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using MCCPortfolioAPI.Controllers;
using MCCPortfolioAPI.DTOs;
using MCCPortfolioAPI.Entities;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace MCCPortfolioAPI.Tests
{
    public class AcademicRecordsControllerTests
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
        public async Task AddAcademicRecord_AuthenticatedUser_ReturnsOkAndAddsRecord()
        {
            // Arrange
            using var context = TestDatabaseFixture.CreateDbContext();
            var controller = new AcademicRecordsController(context)
            {
                ControllerContext = CreateMockUserContext("123")
            };

            var dto = new CreateAcademicRecordDto
            {
                Institution = "Madras Christian College",
                Degree = "B.Sc.",
                FieldOfStudy = "Computer Science",
                Grade = "9.5 CGPA",
                StartYear = 2023,
                EndYear = 2026,
                AttachmentUrl = "https://example.com/transcript.pdf"
            };

            // Act
            var result = await controller.AddAcademicRecord(dto);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var record = Assert.IsType<AcademicRecord>(okResult.Value);

            Assert.Equal("Madras Christian College", record.Institution);
            Assert.Equal(123, record.UserId);
        }

        [Fact]
        public async Task GetAcademicRecords_ReturnsOnlyUserRecords()
        {
            // Arrange
            using var context = TestDatabaseFixture.CreateDbContext();
            context.AcademicRecords.Add(new AcademicRecord { Institution = "MCC", Degree = "B.Sc.", UserId = 123 });
            context.AcademicRecords.Add(new AcademicRecord { Institution = "Loyola", Degree = "B.Sc.", UserId = 456 });
            await context.SaveChangesAsync();

            var controller = new AcademicRecordsController(context)
            {
                ControllerContext = CreateMockUserContext("123")
            };

            // Act
            var result = await controller.GetAcademicRecords();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var records = Assert.IsType<List<AcademicRecord>>(okResult.Value);

            Assert.Single(records);
            Assert.Equal("MCC", records[0].Institution);
        }

        [Fact]
        public async Task UpdateAcademicRecord_Owner_UpdatesSuccessfully()
        {
            // Arrange
            using var context = TestDatabaseFixture.CreateDbContext();
            var record = new AcademicRecord { Id = 1, Institution = "Old MCC", Degree = "B.Sc.", UserId = 123 };
            context.AcademicRecords.Add(record);
            await context.SaveChangesAsync();

            var controller = new AcademicRecordsController(context)
            {
                ControllerContext = CreateMockUserContext("123")
            };

            var dto = new CreateAcademicRecordDto
            {
                Institution = "New MCC",
                Degree = "M.Sc.",
                StartYear = 2023,
                EndYear = 2026
            };

            // Act
            var result = await controller.UpdateAcademicRecord(1, dto);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var updated = Assert.IsType<AcademicRecord>(okResult.Value);

            Assert.Equal("New MCC", updated.Institution);
            Assert.Equal("M.Sc.", updated.Degree);
        }

        [Fact]
        public async Task DeleteAcademicRecord_Owner_DeletesSuccessfully()
        {
            // Arrange
            using var context = TestDatabaseFixture.CreateDbContext();
            var record = new AcademicRecord { Id = 5, Institution = "Delete Me", Degree = "B.Sc.", UserId = 123 };
            context.AcademicRecords.Add(record);
            await context.SaveChangesAsync();

            var controller = new AcademicRecordsController(context)
            {
                ControllerContext = CreateMockUserContext("123")
            };

            // Act
            var result = await controller.DeleteAcademicRecord(5);

            // Assert
            Assert.IsType<OkObjectResult>(result);
            var deletedRecord = await context.AcademicRecords.FindAsync(5);
            Assert.Null(deletedRecord);
        }
    }
}
