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
    public class AchievementsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public AchievementsController(ApplicationDbContext context)
        {
            _context = context;
        }

        [Authorize]
        [HttpPost]
        public async Task<IActionResult> AddAchievement(CreateAchievementDto dto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (userId == null)
            {
                return Unauthorized();
            }

            var achievement = new Achievement
            {
                Title = dto.Title,
                Description = dto.Description,
                AchievementUrl = dto.AchievementUrl,
                Category = string.IsNullOrEmpty(dto.Category) ? "Academic Award" : dto.Category,
                AchievementDate = DateTime.SpecifyKind(dto.AchievementDate, DateTimeKind.Utc),
                UserId = int.Parse(userId)
            };

            _context.Achievements.Add(achievement);

            await _context.SaveChangesAsync();

            return Ok(achievement);
        }

        [Authorize]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateAchievement(int id, CreateAchievementDto dto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null)
            {
                return Unauthorized();
            }

            var achievement = await _context.Achievements
                .FirstOrDefaultAsync(x => x.Id == id && x.UserId == int.Parse(userId));

            if (achievement == null)
            {
                return NotFound();
            }

            achievement.Title = dto.Title;
            achievement.Description = dto.Description;
            achievement.AchievementUrl = dto.AchievementUrl;
            achievement.Category = string.IsNullOrEmpty(dto.Category) ? "Academic Award" : dto.Category;
            achievement.AchievementDate = DateTime.SpecifyKind(dto.AchievementDate, DateTimeKind.Utc);

            await _context.SaveChangesAsync();

            return Ok(achievement);
        }

        [Authorize]
        [HttpGet]
        public async Task<IActionResult> GetAchievements()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (userId == null)
            {
                return Unauthorized();
            }

            var achievements = await _context.Achievements
                .Where(x => x.UserId == int.Parse(userId))
                .ToListAsync();

            return Ok(achievements);
        }

        [Authorize]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAchievement(int id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            var achievement = await _context.Achievements
                .FirstOrDefaultAsync(x => x.Id == id && x.UserId == int.Parse(userId));

            if (achievement == null) return NotFound();

            _context.Achievements.Remove(achievement);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Achievement deleted successfully." });
        }
    }
}