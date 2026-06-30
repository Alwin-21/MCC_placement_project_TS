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
    public class ExperiencesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ExperiencesController(ApplicationDbContext context)
        {
            _context = context;
        }

        [Authorize]
        [HttpPost]
        public async Task<IActionResult> AddExperience(CreateExperienceDto dto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null)
            {
                return Unauthorized();
            }

            var experience = new Experience
            {
                Title = dto.Title,
                Company = dto.Company,
                Location = dto.Location,
                Description = dto.Description,
                StartDate = dto.StartDate,
                EndDate = dto.EndDate,
                IsCurrent = dto.IsCurrent,
                Category = dto.Category,
                UserId = int.Parse(userId)
            };

            _context.Experiences.Add(experience);
            await _context.SaveChangesAsync();

            return Ok(experience);
        }

        [Authorize]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateExperience(int id, CreateExperienceDto dto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null)
            {
                return Unauthorized();
            }

            var experience = await _context.Experiences
                .FirstOrDefaultAsync(x => x.Id == id && x.UserId == int.Parse(userId));

            if (experience == null)
            {
                return NotFound();
            }

            experience.Title = dto.Title;
            experience.Company = dto.Company;
            experience.Location = dto.Location;
            experience.Description = dto.Description;
            experience.StartDate = dto.StartDate;
            experience.EndDate = dto.EndDate;
            experience.IsCurrent = dto.IsCurrent;
            experience.Category = dto.Category;

            await _context.SaveChangesAsync();

            return Ok(experience);
        }

        [Authorize]
        [HttpGet]
        public async Task<IActionResult> GetMyExperiences()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null)
            {
                return Unauthorized();
            }

            var experiences = await _context.Experiences
                .Where(x => x.UserId == int.Parse(userId))
                .ToListAsync();

            return Ok(experiences);
        }

        [Authorize]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteExperience(int id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            var experience = await _context.Experiences.FindAsync(id);
            if (experience == null) return NotFound();

            if (experience.UserId != int.Parse(userId))
            {
                return Forbid();
            }

            _context.Experiences.Remove(experience);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
