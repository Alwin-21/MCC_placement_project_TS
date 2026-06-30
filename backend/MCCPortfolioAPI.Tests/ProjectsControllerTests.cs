using MCCPortfolioAPI.Controllers;
using MCCPortfolioAPI.DTOs;
using MCCPortfolioAPI.Entities;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Xunit;

namespace MCCPortfolioAPI.Tests
{
    public class ProjectsControllerTests
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
        public async Task AddProject_AuthenticatedUser_ReturnsOkAndAddsProject()
        {
            // Arrange
            using var context = TestDatabaseFixture.CreateDbContext();
            var controller = new ProjectsController(context)
            {
                ControllerContext = CreateMockUserContext("123")
            };

            var createProjectDto = new CreateProjectDto
            {
                Title = "Cool E-commerce App",
                Description = "A React + .NET Web App",
                Technologies = "React, .NET, PostgreSQL",
                GithubUrl = "https://github.com/student/ecommerce",
                LiveUrl = "https://ecommerce.com"
            };

            // Act
            var result = await controller.AddProject(createProjectDto);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var project = Assert.IsType<Project>(okResult.Value);

            Assert.Equal("Cool E-commerce App", project.Title);
            Assert.Equal(123, project.UserId);
        }

        [Fact]
        public async Task GetProjects_ReturnsOnlyUserProjects()
        {
            // Arrange
            using var context = TestDatabaseFixture.CreateDbContext();
            
            // Project for our user
            context.Projects.Add(new Project { Title = "My Project", UserId = 123 });
            // Project for another user
            context.Projects.Add(new Project { Title = "Other Project", UserId = 456 });
            await context.SaveChangesAsync();

            var controller = new ProjectsController(context)
            {
                ControllerContext = CreateMockUserContext("123")
            };

            // Act
            var result = await controller.GetProjects();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var projects = Assert.IsType<List<Project>>(okResult.Value);

            Assert.Single(projects);
            Assert.Equal("My Project", projects[0].Title);
        }

        [Fact]
        public async Task DeleteProject_Owner_DeletesSuccessfully()
        {
            // Arrange
            using var context = TestDatabaseFixture.CreateDbContext();
            
            var project = new Project { Id = 10, Title = "Delete Me", UserId = 123 };
            context.Projects.Add(project);
            await context.SaveChangesAsync();

            var controller = new ProjectsController(context)
            {
                ControllerContext = CreateMockUserContext("123")
            };

            // Act
            var result = await controller.DeleteProject(10);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            
            // Verify project is removed from database
            var deletedProject = await context.Projects.FindAsync(10);
            Assert.Null(deletedProject);
        }

        [Fact]
        public async Task DeleteProject_NonOwner_ReturnsNotFound()
        {
            // Arrange
            using var context = TestDatabaseFixture.CreateDbContext();
            
            var project = new Project { Id = 10, Title = "Cannot Delete Me", UserId = 456 };
            context.Projects.Add(project);
            await context.SaveChangesAsync();

            var controller = new ProjectsController(context)
            {
                ControllerContext = CreateMockUserContext("123")
            };

            // Act
            var result = await controller.DeleteProject(10);

            // Assert
            Assert.IsType<NotFoundResult>(result);

            // Verify project still exists in DB
            var existingProject = await context.Projects.FindAsync(10);
            Assert.NotNull(existingProject);
        }
    }
}
