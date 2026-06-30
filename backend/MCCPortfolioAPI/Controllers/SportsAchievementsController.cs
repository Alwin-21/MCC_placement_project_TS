using System;
using System.Security.Claims;
using System.Threading.Tasks;
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
    public class SportsAchievementsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public SportsAchievementsController(ApplicationDbContext context)
        {
            _context = context;
        }

        [Authorize]
        [HttpPost]
        public async Task<IActionResult> AddSportsAchievement(CreateSportsAchievementDto dto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null)
            {
                return Unauthorized();
            }

            var achievement = new SportsAchievement
            {
                SportName = dto.SportName,
                Level = dto.Level,
                Achievement = dto.Achievement,
                Description = dto.Description,
                Date = DateTime.SpecifyKind(dto.Date, DateTimeKind.Utc),
                CertificateUrl = dto.CertificateUrl,
                UserId = int.Parse(userId)
            };

            _context.SportsAchievements.Add(achievement);
            await _context.SaveChangesAsync();

            return Ok(achievement);
        }

        [Authorize]
        [HttpGet]
        public async Task<IActionResult> GetSportsAchievements()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null)
            {
                return Unauthorized();
            }

            var achievements = await _context.SportsAchievements
                .Where(x => x.UserId == int.Parse(userId))
                .ToListAsync();

            return Ok(achievements);
        }

        [Authorize]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateSportsAchievement(int id, CreateSportsAchievementDto dto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null)
            {
                return Unauthorized();
            }

            var achievement = await _context.SportsAchievements
                .FirstOrDefaultAsync(x => x.Id == id && x.UserId == int.Parse(userId));

            if (achievement == null)
            {
                return NotFound();
            }

            achievement.SportName = dto.SportName;
            achievement.Level = dto.Level;
            achievement.Achievement = dto.Achievement;
            achievement.Description = dto.Description;
            achievement.Date = DateTime.SpecifyKind(dto.Date, DateTimeKind.Utc);
            achievement.CertificateUrl = dto.CertificateUrl;

            await _context.SaveChangesAsync();
            return Ok(achievement);
        }

        [Authorize]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteSportsAchievement(int id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null)
            {
                return Unauthorized();
            }

            var achievement = await _context.SportsAchievements
                .FirstOrDefaultAsync(x => x.Id == id && x.UserId == int.Parse(userId));

            if (achievement == null)
            {
                return NotFound();
            }

            _context.SportsAchievements.Remove(achievement);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Sports achievement record deleted successfully." });
        }
    }
}
