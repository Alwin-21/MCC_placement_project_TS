using MCCPortfolioAPI.Data;

using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MCCPortfolioAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PublicController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public PublicController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet("by-username/{username}")]
        public async Task<IActionResult> GetPortfolioByUsername(string username)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(x => x.FullName.Replace(" ", "").Replace("-", "").ToLower() == username.ToLower());

            if (user == null)
            {
                user = await _context.Users
                    .FirstOrDefaultAsync(x => x.RegisterNumber.ToLower() == username.ToLower());
            }

            if (user == null)
            {
                return NotFound("User not found");
            }

            return await GetPortfolio(user.Id);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetPortfolio(int id)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(x => x.Id == id);

            if (user == null)
            {
                return NotFound();
            }

            var profile = await _context.Profiles
                .FirstOrDefaultAsync(x => x.UserId == id);

            var skills = await _context.Skills
                .Where(x => x.UserId == id)
                .ToListAsync();

            var certifications = await _context.Certifications
                .Where(x => x.UserId == id)
                .ToListAsync();

            var researchPapers = await _context.ResearchPapers
                .Where(x => x.UserId == id)
                .ToListAsync();

            var achievements = await _context.Achievements
                .Where(x => x.UserId == id)
                .ToListAsync();

            var hackathons = await _context.Hackathons
                .Where(x => x.UserId == id)
                .ToListAsync();

            var projects = await _context.Projects
                .Where(x => x.UserId == id)
                .ToListAsync();

            var resumes = await _context.Resumes
                .Where(x => x.UserId == id)
                .ToListAsync();

            var communityServices = await _context.CommunityServices
                .Where(x => x.UserId == id)
                .ToListAsync();

            var creativeWorks = await _context.CreativeWorks
                .Where(x => x.UserId == id)
                .ToListAsync();

            var academicRecords = await _context.AcademicRecords
                .Where(x => x.UserId == id)
                .ToListAsync();

            var olympiads = await _context.Olympiads
                .Where(x => x.UserId == id)
                .ToListAsync();

            var startupCompetitions = await _context.StartupCompetitions
                .Where(x => x.UserId == id)
                .ToListAsync();

            var ngoActivities = await _context.NgoActivities
                .Where(x => x.UserId == id)
                .ToListAsync();

            var sportsAchievements = await _context.SportsAchievements
                .Where(x => x.UserId == id)
                .ToListAsync();

            var experiences = await _context.Experiences
                .Where(x => x.UserId == id)
                .ToListAsync();

            var themeConfig = profile != null
                ? await _context.ThemeConfigs.FirstOrDefaultAsync(t => t.ThemeId.ToLower() == profile.SelectedTheme.ToLower())
                : null;

            return Ok(new
            {
                user,
                profile,
                themeConfig,
                skills,
                certifications,
                researchPapers,
                achievements,
                hackathons,
                projects,
                resumes,
                communityServices,
                creativeWorks,
                academicRecords,
                olympiads,
                startupCompetitions,
                ngoActivities,
                sportsAchievements,
                experiences
            });
        }
    }
}