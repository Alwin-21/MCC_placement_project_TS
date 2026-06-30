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
    public class ResumesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ResumesController(ApplicationDbContext context)
        {
            _context = context;
        }

        [Authorize]
        [HttpPost]
        public async Task<IActionResult> AddResume(CreateResumeDto dto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (userId == null)
            {
                return Unauthorized();
            }

            var resume = new Resume
            {
                ResumeTitle = dto.ResumeTitle,
                ResumeUrl = dto.ResumeUrl,
                UserId = int.Parse(userId)
            };

            _context.Resumes.Add(resume);

            await _context.SaveChangesAsync();

            return Ok(resume);
        }

        [Authorize]
        [HttpGet]
        public async Task<IActionResult> GetResumes()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (userId == null)
            {
                return Unauthorized();
            }

            var resumes = await _context.Resumes
                .Where(x => x.UserId == int.Parse(userId))
                .ToListAsync();

            return Ok(resumes);
        }

        [Authorize]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteResume(int id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            var resume = await _context.Resumes
                .FirstOrDefaultAsync(x => x.Id == id && x.UserId == int.Parse(userId));

            if (resume == null) return NotFound();

            _context.Resumes.Remove(resume);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Resume deleted successfully." });
        }
    }
}