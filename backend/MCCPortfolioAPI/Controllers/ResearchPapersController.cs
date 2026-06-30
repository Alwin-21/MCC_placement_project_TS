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
    public class ResearchPapersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ResearchPapersController(ApplicationDbContext context)
        {
            _context = context;
        }

        [Authorize]
        [HttpPost]
        public async Task<IActionResult> AddResearchPaper(CreateResearchPaperDto dto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (userId == null)
            {
                return Unauthorized();
            }

            var paper = new ResearchPaper
            {
                Title = dto.Title,
                Abstract = dto.Abstract,
                Conference = dto.Conference,
                PaperUrl = dto.PaperUrl,
                Category = dto.Category,
                PublishedDate = DateTime.SpecifyKind(dto.PublishedDate, DateTimeKind.Utc),
                UserId = int.Parse(userId)
            };

            _context.ResearchPapers.Add(paper);

            await _context.SaveChangesAsync();

            return Ok(paper);
        }

        [Authorize]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateResearchPaper(int id, CreateResearchPaperDto dto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null)
            {
                return Unauthorized();
            }

            var paper = await _context.ResearchPapers
                .FirstOrDefaultAsync(x => x.Id == id && x.UserId == int.Parse(userId));

            if (paper == null)
            {
                return NotFound();
            }

            paper.Title = dto.Title;
            paper.Abstract = dto.Abstract;
            paper.Conference = dto.Conference;
            paper.PaperUrl = dto.PaperUrl;
            paper.Category = dto.Category;
            paper.PublishedDate = DateTime.SpecifyKind(dto.PublishedDate, DateTimeKind.Utc);

            await _context.SaveChangesAsync();

            return Ok(paper);
        }

        [Authorize]
        [HttpGet]
        public async Task<IActionResult> GetResearchPapers()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (userId == null)
            {
                return Unauthorized();
            }

            var papers = await _context.ResearchPapers
                .Where(x => x.UserId == int.Parse(userId))
                .ToListAsync();

            return Ok(papers);
        }

        [Authorize]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteResearchPaper(int id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            var paper = await _context.ResearchPapers.FindAsync(id);
            if (paper == null) return NotFound();

            if (paper.UserId != int.Parse(userId))
            {
                return Forbid();
            }

            _context.ResearchPapers.Remove(paper);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}