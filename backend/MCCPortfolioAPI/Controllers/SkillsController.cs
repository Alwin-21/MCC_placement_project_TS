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
    public class SkillsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public SkillsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // ADD SKILL

        [Authorize]
        [HttpPost]
        public async Task<IActionResult> AddSkill(CreateSkillDto dto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (userId == null)
            {
                return Unauthorized();
            }

            var skill = new Skill
            {
                Name = dto.Name,
                Level = dto.Level,
                Category = dto.Category,
                UserId = int.Parse(userId)
            };

            _context.Skills.Add(skill);

            await _context.SaveChangesAsync();

            return Ok(skill);
        }

        [Authorize]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateSkill(int id, CreateSkillDto dto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null)
            {
                return Unauthorized();
            }

            var skill = await _context.Skills
                .FirstOrDefaultAsync(x => x.Id == id && x.UserId == int.Parse(userId));

            if (skill == null)
            {
                return NotFound();
            }

            skill.Name = dto.Name;
            skill.Level = dto.Level;
            skill.Category = dto.Category;

            await _context.SaveChangesAsync();

            return Ok(skill);
        }

        // GET MY SKILLS

        [Authorize]
        [HttpGet]
        public async Task<IActionResult> GetMySkills()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (userId == null)
            {
                return Unauthorized();
            }

            var skills = await _context.Skills
                .Where(x => x.UserId == int.Parse(userId))
                .ToListAsync();

            return Ok(skills);
        }

        [Authorize]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteSkill(int id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            var skill = await _context.Skills.FindAsync(id);
            if (skill == null) return NotFound();

            if (skill.UserId != int.Parse(userId))
            {
                return Forbid();
            }

            _context.Skills.Remove(skill);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}