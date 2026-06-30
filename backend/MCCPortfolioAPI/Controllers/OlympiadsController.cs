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
    public class OlympiadsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public OlympiadsController(ApplicationDbContext context)
        {
            _context = context;
        }

        [Authorize]
        [HttpPost]
        public async Task<IActionResult> AddOlympiad(CreateOlympiadDto dto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null)
            {
                return Unauthorized();
            }

            var olympiad = new Olympiad
            {
                Name = dto.Name,
                Subject = dto.Subject,
                Rank = dto.Rank,
                Year = dto.Year,
                Description = dto.Description,
                CertificateUrl = dto.CertificateUrl,
                UserId = int.Parse(userId)
            };

            _context.Olympiads.Add(olympiad);
            await _context.SaveChangesAsync();

            return Ok(olympiad);
        }

        [Authorize]
        [HttpGet]
        public async Task<IActionResult> GetOlympiads()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null)
            {
                return Unauthorized();
            }

            var olympiads = await _context.Olympiads
                .Where(x => x.UserId == int.Parse(userId))
                .ToListAsync();

            return Ok(olympiads);
        }

        [Authorize]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateOlympiad(int id, CreateOlympiadDto dto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null)
            {
                return Unauthorized();
            }

            var olympiad = await _context.Olympiads
                .FirstOrDefaultAsync(x => x.Id == id && x.UserId == int.Parse(userId));

            if (olympiad == null)
            {
                return NotFound();
            }

            olympiad.Name = dto.Name;
            olympiad.Subject = dto.Subject;
            olympiad.Rank = dto.Rank;
            olympiad.Year = dto.Year;
            olympiad.Description = dto.Description;
            olympiad.CertificateUrl = dto.CertificateUrl;

            await _context.SaveChangesAsync();
            return Ok(olympiad);
        }

        [Authorize]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteOlympiad(int id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null)
            {
                return Unauthorized();
            }

            var olympiad = await _context.Olympiads
                .FirstOrDefaultAsync(x => x.Id == id && x.UserId == int.Parse(userId));

            if (olympiad == null)
            {
                return NotFound();
            }

            _context.Olympiads.Remove(olympiad);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Olympiad achievement deleted successfully." });
        }
    }
}
