using MCCPortfolioAPI.Data;

using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MCCPortfolioAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class LeaderboardController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public LeaderboardController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetLeaderboard()
        {
            var users = await _context.Users.ToListAsync();

            var leaderboard = new List<object>();

            foreach (var user in users)
            {
                var skillsCount = await _context.Skills
                    .CountAsync(x => x.UserId == user.Id);

                var projectsCount = await _context.Projects
                    .CountAsync(x => x.UserId == user.Id);

                var achievementsCount = await _context.Achievements
                    .CountAsync(x => x.UserId == user.Id);

                var hackathonsCount = await _context.Hackathons
                    .CountAsync(x => x.UserId == user.Id);

                var researchCount = await _context.ResearchPapers
                    .CountAsync(x => x.UserId == user.Id);

                int score =
                    (skillsCount * 5) +
                    (projectsCount * 10) +
                    (achievementsCount * 15) +
                    (hackathonsCount * 20) +
                    (researchCount * 25);

                leaderboard.Add(new
                {
                    user.Id,
                    user.FullName,
                    user.Department,
                    Score = score,
                    Skills = skillsCount,
                    Projects = projectsCount,
                    Achievements = achievementsCount,
                    Hackathons = hackathonsCount,
                    ResearchPapers = researchCount
                });
            }

            var sortedLeaderboard = leaderboard
                .OrderByDescending(x => ((dynamic)x).Score)
                .ToList();

            return Ok(sortedLeaderboard);
        }
    }
}