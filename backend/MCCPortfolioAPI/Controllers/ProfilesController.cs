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
    public class ProfilesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ProfilesController(ApplicationDbContext context)
        {
            _context = context;
        }

        [Authorize]
        [HttpPost]
        public async Task<IActionResult> SaveProfile(CreateProfileDto dto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (userId == null)
            {
                return Unauthorized();
            }

            // Check if selected theme is active
            var themeConfig = await _context.ThemeConfigs
                .FirstOrDefaultAsync(t => t.ThemeId == dto.SelectedTheme);
            if (themeConfig != null && !themeConfig.IsActive)
            {
                return BadRequest($"The theme '{dto.SelectedTheme}' is currently disabled by the administrator.");
            }

            var user = await _context.Users.FindAsync(int.Parse(userId));
            if (user != null && !string.IsNullOrEmpty(dto.FullName))
            {
                user.FullName = dto.FullName;
            }

            var existingProfile = await _context.Profiles
                .FirstOrDefaultAsync(x => x.UserId == int.Parse(userId));

            if (existingProfile != null)
            {
                existingProfile.Bio = dto.Bio;
                existingProfile.LinkedInUrl = dto.LinkedInUrl;
                existingProfile.GitHubUrl = dto.GitHubUrl;
                existingProfile.BehanceUrl = dto.BehanceUrl;
                existingProfile.GitHubUsername = dto.GitHubUsername;
                existingProfile.TargetCareer = dto.TargetCareer;
                existingProfile.CGPA = dto.CGPA;
                existingProfile.ProfileImageUrl = dto.ProfileImageUrl;
                existingProfile.SelectedTheme = dto.SelectedTheme;
                existingProfile.PersonalStory = dto.PersonalStory;
                existingProfile.SOP = dto.SOP;
                existingProfile.IsAlumni = dto.IsAlumni;
                existingProfile.GraduationYear = dto.GraduationYear;
                existingProfile.CurrentCompany = dto.CurrentCompany;
                existingProfile.CurrentJobTitle = dto.CurrentJobTitle;
                existingProfile.HigherStudyUniversity = dto.HigherStudyUniversity;
                existingProfile.HigherStudyProgram = dto.HigherStudyProgram;
                existingProfile.Course = dto.Course;
                existingProfile.YearOfStudy = dto.YearOfStudy;
                existingProfile.CurrentLocation = dto.CurrentLocation;
                existingProfile.Phone = dto.Phone;
                existingProfile.Languages = dto.Languages;
                existingProfile.TestScores = dto.TestScores;
                existingProfile.Patents = dto.Patents;
                existingProfile.InstagramUrl = dto.InstagramUrl;
                existingProfile.BlogUrl = dto.BlogUrl;
                existingProfile.OtherHandles = dto.OtherHandles;
            }
            else
            {
                var profile = new Profile
                {
                    Bio = dto.Bio,
                    LinkedInUrl = dto.LinkedInUrl,
                    GitHubUrl = dto.GitHubUrl,
                    BehanceUrl = dto.BehanceUrl,
                    GitHubUsername = dto.GitHubUsername,
                    TargetCareer = dto.TargetCareer,
                    CGPA = dto.CGPA,
                    ProfileImageUrl = dto.ProfileImageUrl,
                    SelectedTheme = dto.SelectedTheme,
                    PersonalStory = dto.PersonalStory,
                    SOP = dto.SOP,
                    IsAlumni = dto.IsAlumni,
                    GraduationYear = dto.GraduationYear,
                    CurrentCompany = dto.CurrentCompany,
                    CurrentJobTitle = dto.CurrentJobTitle,
                    HigherStudyUniversity = dto.HigherStudyUniversity,
                    HigherStudyProgram = dto.HigherStudyProgram,
                    Course = dto.Course,
                    YearOfStudy = dto.YearOfStudy,
                    CurrentLocation = dto.CurrentLocation,
                    Phone = dto.Phone,
                    Languages = dto.Languages,
                    TestScores = dto.TestScores,
                    Patents = dto.Patents,
                    InstagramUrl = dto.InstagramUrl,
                    BlogUrl = dto.BlogUrl,
                    OtherHandles = dto.OtherHandles,
                    UserId = int.Parse(userId)
                };

                _context.Profiles.Add(profile);
            }

            await _context.SaveChangesAsync();

            return Ok();
        }

        [Authorize]
        [HttpGet]
        public async Task<IActionResult> GetProfile()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (userId == null)
            {
                return Unauthorized();
            }

            var profile = await _context.Profiles
                .FirstOrDefaultAsync(x => x.UserId == int.Parse(userId));

            return Ok(profile);
        }

        [Authorize]
        [HttpGet("themes")]
        public async Task<IActionResult> GetActiveThemes()
        {
            var themes = await _context.ThemeConfigs
                .Where(t => t.IsActive)
                .Select(t => new { t.ThemeId, t.DisplayName, t.Description })
                .ToListAsync();
            return Ok(themes);
        }
    }
}