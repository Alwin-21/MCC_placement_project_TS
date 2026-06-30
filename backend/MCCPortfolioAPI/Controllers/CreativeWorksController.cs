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
    public class CreativeWorksController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public CreativeWorksController(ApplicationDbContext context)
        {
            _context = context;
        }

        [Authorize]
        [HttpPost]
        public async Task<IActionResult> AddCreativeWork(CreateCreativeWorkDto dto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null)
            {
                return Unauthorized();
            }

            var work = new CreativeWork
            {
                Title = dto.Title,
                Category = dto.Category,
                Description = dto.Description,
                WorkUrl = dto.WorkUrl,
                MediaUrl = dto.MediaUrl,
                Date = DateTime.SpecifyKind(dto.Date, DateTimeKind.Utc),
                UserId = int.Parse(userId)
            };

            _context.CreativeWorks.Add(work);
            await _context.SaveChangesAsync();

            return Ok(work);
        }

        [Authorize]
        [HttpGet]
        public async Task<IActionResult> GetCreativeWorks()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null)
            {
                return Unauthorized();
            }

            var works = await _context.CreativeWorks
                .Where(x => x.UserId == int.Parse(userId))
                .ToListAsync();

            return Ok(works);
        }

        [Authorize]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateCreativeWork(int id, CreateCreativeWorkDto dto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null)
            {
                return Unauthorized();
            }

            var work = await _context.CreativeWorks
                .FirstOrDefaultAsync(x => x.Id == id && x.UserId == int.Parse(userId));

            if (work == null)
            {
                return NotFound();
            }

            work.Title = dto.Title;
            work.Category = dto.Category;
            work.Description = dto.Description;
            work.WorkUrl = dto.WorkUrl;
            work.MediaUrl = dto.MediaUrl;
            work.Date = DateTime.SpecifyKind(dto.Date, DateTimeKind.Utc);

            await _context.SaveChangesAsync();
            return Ok(work);
        }

        [Authorize]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCreativeWork(int id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null)
            {
                return Unauthorized();
            }

            var work = await _context.CreativeWorks
                .FirstOrDefaultAsync(x => x.Id == id && x.UserId == int.Parse(userId));

            if (work == null)
            {
                return NotFound();
            }

            _context.CreativeWorks.Remove(work);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Creative work record deleted successfully." });
        }
    }
}
