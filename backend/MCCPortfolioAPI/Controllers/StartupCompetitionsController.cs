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
    public class StartupCompetitionsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public StartupCompetitionsController(ApplicationDbContext context)
        {
            _context = context;
        }

        [Authorize]
        [HttpPost]
        public async Task<IActionResult> AddStartupCompetition(CreateStartupCompetitionDto dto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null)
            {
                return Unauthorized();
            }

            var competition = new StartupCompetition
            {
                CompetitionName = dto.CompetitionName,
                ProjectName = dto.ProjectName,
                Role = dto.Role,
                Result = dto.Result,
                Description = dto.Description,
                Date = DateTime.SpecifyKind(dto.Date, DateTimeKind.Utc),
                PitchDeckUrl = dto.PitchDeckUrl,
                UserId = int.Parse(userId)
            };

            _context.StartupCompetitions.Add(competition);
            await _context.SaveChangesAsync();

            return Ok(competition);
        }

        [Authorize]
        [HttpGet]
        public async Task<IActionResult> GetStartupCompetitions()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null)
            {
                return Unauthorized();
            }

            var competitions = await _context.StartupCompetitions
                .Where(x => x.UserId == int.Parse(userId))
                .ToListAsync();

            return Ok(competitions);
        }

        [Authorize]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateStartupCompetition(int id, CreateStartupCompetitionDto dto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null)
            {
                return Unauthorized();
            }

            var competition = await _context.StartupCompetitions
                .FirstOrDefaultAsync(x => x.Id == id && x.UserId == int.Parse(userId));

            if (competition == null)
            {
                return NotFound();
            }

            competition.CompetitionName = dto.CompetitionName;
            competition.ProjectName = dto.ProjectName;
            competition.Role = dto.Role;
            competition.Result = dto.Result;
            competition.Description = dto.Description;
            competition.Date = DateTime.SpecifyKind(dto.Date, DateTimeKind.Utc);
            competition.PitchDeckUrl = dto.PitchDeckUrl;

            await _context.SaveChangesAsync();
            return Ok(competition);
        }

        [Authorize]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteStartupCompetition(int id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null)
            {
                return Unauthorized();
            }

            var competition = await _context.StartupCompetitions
                .FirstOrDefaultAsync(x => x.Id == id && x.UserId == int.Parse(userId));

            if (competition == null)
            {
                return NotFound();
            }

            _context.StartupCompetitions.Remove(competition);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Startup competition record deleted successfully." });
        }
    }
}
