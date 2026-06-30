using MCCPortfolioAPI.Controllers;
using MCCPortfolioAPI.Entities;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Xunit;

namespace MCCPortfolioAPI.Tests
{
    public class PublicControllerTests
    {
        [Fact]
        public async Task GetPortfolio_UserExists_ReturnsOkWithFullPortfolioData()
        {
            // Arrange
            using var context = TestDatabaseFixture.CreateDbContext();
            
            // Seed a user
            var user = new User
            {
                Id = 1,
                FullName = "Alwin Samuel",
                Email = "alwin@mcc.edu",
                Department = "Computer Science",
                RegisterNumber = "MCC-12345"
            };
            context.Users.Add(user);

            // Seed a profile
            var profile = new Profile
            {
                Id = 1,
                UserId = 1,
                Bio = "Self-driven MCC developer",
                LinkedInUrl = "https://linkedin.com/in/alwin",
                GitHubUrl = "https://github.com/alwin",
                SelectedTheme = "AIFuturistic"
            };
            context.Profiles.Add(profile);

            // Seed associated entities
            context.Skills.Add(new Skill { Id = 1, UserId = 1, Name = "React", Level = "Expert" });
            context.Certifications.Add(new Certification { Id = 1, UserId = 1, Title = "AWS Cloud Practitioner", Issuer = "Amazon" });
            context.ResearchPapers.Add(new ResearchPaper { Id = 1, UserId = 1, Title = "Machine Learning on Edge Devices", Conference = "IEEE" });
            context.Achievements.Add(new Achievement { Id = 1, UserId = 1, Title = "Smart India Hackathon Winner", Description = "1st place in cybersecurity theme" });
            context.Hackathons.Add(new Hackathon { Id = 1, UserId = 1, Title = "MCC Innovate", Organizer = "MCC Incubation" });
            context.Projects.Add(new Project { Id = 1, UserId = 1, Title = "MCC Digital Ecosystem", Technologies = "Next.js, C#" });
            context.Resumes.Add(new Resume { Id = 1, UserId = 1, ResumeTitle = "Alwin Samuel Resume", ResumeUrl = "/resumes/alwin.pdf" });
            context.CommunityServices.Add(new CommunityService { Id = 1, UserId = 1, Title = "NSS Clean Drive", Organization = "NSS MCC", HoursServed = 10, Date = DateTime.UtcNow });
            context.CreativeWorks.Add(new CreativeWork { Id = 1, UserId = 1, Title = "Interactive Web Art", Category = "Artwork", Description = "Built with CSS and Canvas", Date = DateTime.UtcNow });

            await context.SaveChangesAsync();

            var controller = new PublicController(context);

            // Act
            var result = await controller.GetPortfolio(1);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            
            // Serialize to JSON to bypass assembly internal visibility restrictions
            var json = System.Text.Json.JsonSerializer.Serialize(okResult.Value);
            using var document = System.Text.Json.JsonDocument.Parse(json);
            var parsed = document.RootElement;

            Assert.True(parsed.TryGetProperty("user", out var userProp));
            Assert.Equal("Alwin Samuel", userProp.GetProperty("FullName").GetString());

            Assert.True(parsed.TryGetProperty("profile", out var profileProp));
            Assert.Equal("Self-driven MCC developer", profileProp.GetProperty("Bio").GetString());
            Assert.Equal("AIFuturistic", profileProp.GetProperty("SelectedTheme").GetString());

            Assert.True(parsed.TryGetProperty("skills", out var skillsProp));
            Assert.Equal(System.Text.Json.JsonValueKind.Array, skillsProp.ValueKind);
            Assert.Equal("React", skillsProp[0].GetProperty("Name").GetString());

            Assert.True(parsed.TryGetProperty("certifications", out var certsProp));
            Assert.Equal(System.Text.Json.JsonValueKind.Array, certsProp.ValueKind);
            Assert.Equal("AWS Cloud Practitioner", certsProp[0].GetProperty("Title").GetString());

            Assert.True(parsed.TryGetProperty("researchPapers", out var papersProp));
            Assert.Equal(System.Text.Json.JsonValueKind.Array, papersProp.ValueKind);
            Assert.Equal("Machine Learning on Edge Devices", papersProp[0].GetProperty("Title").GetString());

            Assert.True(parsed.TryGetProperty("achievements", out var achProp));
            Assert.Equal(System.Text.Json.JsonValueKind.Array, achProp.ValueKind);
            Assert.Equal("Smart India Hackathon Winner", achProp[0].GetProperty("Title").GetString());

            Assert.True(parsed.TryGetProperty("hackathons", out var hackProp));
            Assert.Equal(System.Text.Json.JsonValueKind.Array, hackProp.ValueKind);
            Assert.Equal("MCC Innovate", hackProp[0].GetProperty("Title").GetString());

            Assert.True(parsed.TryGetProperty("projects", out var projProp));
            Assert.Equal(System.Text.Json.JsonValueKind.Array, projProp.ValueKind);
            Assert.Equal("MCC Digital Ecosystem", projProp[0].GetProperty("Title").GetString());

            Assert.True(parsed.TryGetProperty("resumes", out var resumeProp));
            Assert.Equal(System.Text.Json.JsonValueKind.Array, resumeProp.ValueKind);
            Assert.Equal("Alwin Samuel Resume", resumeProp[0].GetProperty("ResumeTitle").GetString());

            Assert.True(parsed.TryGetProperty("communityServices", out var communityServicesProp));
            Assert.Equal(System.Text.Json.JsonValueKind.Array, communityServicesProp.ValueKind);
            Assert.Equal("NSS Clean Drive", communityServicesProp[0].GetProperty("Title").GetString());

            Assert.True(parsed.TryGetProperty("creativeWorks", out var creativeWorksProp));
            Assert.Equal(System.Text.Json.JsonValueKind.Array, creativeWorksProp.ValueKind);
            Assert.Equal("Interactive Web Art", creativeWorksProp[0].GetProperty("Title").GetString());
        }

        [Fact]
        public async Task GetPortfolio_UserDoesNotExist_ReturnsNotFound()
        {
            // Arrange
            using var context = TestDatabaseFixture.CreateDbContext();
            var controller = new PublicController(context);

            // Act
            var result = await controller.GetPortfolio(999);

            // Assert
            Assert.IsType<NotFoundResult>(result);
        }

        [Fact]
        public async Task GetPortfolioByUsername_UserExistsBySlug_ReturnsOk()
        {
            // Arrange
            using var context = TestDatabaseFixture.CreateDbContext();
            
            var user = new User
            {
                Id = 10,
                FullName = "Franklin Raj",
                Email = "franklin@mcc.edu",
                RegisterNumber = "MCC-5678"
            };
            context.Users.Add(user);
            await context.SaveChangesAsync();

            var controller = new PublicController(context);

            // Act
            var result = await controller.GetPortfolioByUsername("franklinraj");

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var json = System.Text.Json.JsonSerializer.Serialize(okResult.Value);
            using var document = System.Text.Json.JsonDocument.Parse(json);
            var parsed = document.RootElement;
            Assert.Equal("Franklin Raj", parsed.GetProperty("user").GetProperty("FullName").GetString());
        }

        [Fact]
        public async Task GetPortfolioByUsername_UserExistsByRegisterNumber_ReturnsOk()
        {
            // Arrange
            using var context = TestDatabaseFixture.CreateDbContext();
            
            var user = new User
            {
                Id = 11,
                FullName = "Franklin Raj",
                Email = "franklin@mcc.edu",
                RegisterNumber = "mcc-5678"
            };
            context.Users.Add(user);
            await context.SaveChangesAsync();

            var controller = new PublicController(context);

            // Act
            var result = await controller.GetPortfolioByUsername("mcc-5678");

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var json = System.Text.Json.JsonSerializer.Serialize(okResult.Value);
            using var document = System.Text.Json.JsonDocument.Parse(json);
            var parsed = document.RootElement;
            Assert.Equal("Franklin Raj", parsed.GetProperty("user").GetProperty("FullName").GetString());
        }

        [Fact]
        public async Task GetPortfolioByUsername_UserDoesNotExist_ReturnsNotFound()
        {
            // Arrange
            using var context = TestDatabaseFixture.CreateDbContext();
            var controller = new PublicController(context);

            // Act
            var result = await controller.GetPortfolioByUsername("unknownslug");

            // Assert
            Assert.IsType<NotFoundObjectResult>(result);
        }
    }
}
