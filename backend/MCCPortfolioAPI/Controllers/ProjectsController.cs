using System.Security.Claims;

using MCCPortfolioAPI.Data;
using MCCPortfolioAPI.DTOs;
using MCCPortfolioAPI.Entities;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MCCPortfolioAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProjectsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ProjectsController(ApplicationDbContext context)
        {
            _context = context;
        }

        [Authorize]
        [HttpPost]
        public async Task<IActionResult> AddProject(CreateProjectDto dto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (userId == null)
            {
                return Unauthorized();
            }

            var project = new Project
            {
                Title = dto.Title,
                Description = dto.Description,
                Technologies = dto.Technologies,
                GithubUrl = dto.GithubUrl,
                LiveUrl = dto.LiveUrl,
                Category = dto.Category,
                DemoVideoUrl = dto.DemoVideoUrl,
                ImageUrl = dto.ImageUrl,
                UserId = int.Parse(userId)
            };

            _context.Projects.Add(project);

            await _context.SaveChangesAsync();

            return Ok(project);
        }

        [Authorize]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateProject(int id, CreateProjectDto dto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null)
            {
                return Unauthorized();
            }

            var project = await _context.Projects
                .FirstOrDefaultAsync(x => x.Id == id && x.UserId == int.Parse(userId));

            if (project == null)
            {
                return NotFound();
            }

            project.Title = dto.Title;
            project.Description = dto.Description;
            project.Technologies = dto.Technologies;
            project.GithubUrl = dto.GithubUrl;
            project.LiveUrl = dto.LiveUrl;
            project.Category = dto.Category;
            project.DemoVideoUrl = dto.DemoVideoUrl;
            project.ImageUrl = dto.ImageUrl;

            await _context.SaveChangesAsync();

            return Ok(project);
        }

        [Authorize]
        [HttpGet]
        public async Task<IActionResult> GetProjects()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (userId == null)
            {
                return Unauthorized();
            }

            var projects = await _context.Projects
                .Where(x => x.UserId == int.Parse(userId))
                .ToListAsync();

            return Ok(projects);
        }

        [Authorize]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProject(int id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            var project = await _context.Projects
                .FirstOrDefaultAsync(x => x.Id == id && x.UserId == int.Parse(userId));

            if (project == null) return NotFound();

            _context.Projects.Remove(project);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Project deleted successfully." });
        }
    }
}