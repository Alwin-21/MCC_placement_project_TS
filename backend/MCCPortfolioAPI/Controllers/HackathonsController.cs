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
    public class HackathonsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public HackathonsController(ApplicationDbContext context)
        {
            _context = context;
        }

        [Authorize]
        [HttpPost]
        public async Task<IActionResult> AddHackathon(CreateHackathonDto dto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (userId == null)
            {
                return Unauthorized();
            }

            var hackathon = new Hackathon
            {
                Title = dto.Title,
                Organizer = dto.Organizer,
                Description = dto.Description,
                ProjectName = dto.ProjectName,
                HackathonUrl = dto.HackathonUrl,
                CertificateUrl = dto.CertificateUrl,
                EventDate = DateTime.SpecifyKind(dto.EventDate, DateTimeKind.Utc),
                UserId = int.Parse(userId)
            };

            _context.Hackathons.Add(hackathon);

            await _context.SaveChangesAsync();

            return Ok(hackathon);
        }

        [Authorize]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateHackathon(int id, CreateHackathonDto dto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null)
            {
                return Unauthorized();
            }

            var hackathon = await _context.Hackathons
                .FirstOrDefaultAsync(x => x.Id == id && x.UserId == int.Parse(userId));

            if (hackathon == null)
            {
                return NotFound();
            }

            hackathon.Title = dto.Title;
            hackathon.Organizer = dto.Organizer;
            hackathon.Description = dto.Description;
            hackathon.ProjectName = dto.ProjectName;
            hackathon.HackathonUrl = dto.HackathonUrl;
            hackathon.CertificateUrl = dto.CertificateUrl;
            hackathon.EventDate = DateTime.SpecifyKind(dto.EventDate, DateTimeKind.Utc);

            await _context.SaveChangesAsync();

            return Ok(hackathon);
        }

        [Authorize]
        [HttpGet]
        public async Task<IActionResult> GetHackathons()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (userId == null)
            {
                return Unauthorized();
            }

            var hackathons = await _context.Hackathons
                .Where(x => x.UserId == int.Parse(userId))
                .ToListAsync();

            return Ok(hackathons);
        }

        [Authorize]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteHackathon(int id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            var hackathon = await _context.Hackathons
                .FirstOrDefaultAsync(x => x.Id == id && x.UserId == int.Parse(userId));

            if (hackathon == null) return NotFound();

            _context.Hackathons.Remove(hackathon);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Hackathon deleted successfully." });
        }
    }
}