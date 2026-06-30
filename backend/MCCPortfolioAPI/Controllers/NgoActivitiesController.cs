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
    public class NgoActivitiesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public NgoActivitiesController(ApplicationDbContext context)
        {
            _context = context;
        }

        [Authorize]
        [HttpPost]
        public async Task<IActionResult> AddNgoActivity(CreateNgoActivityDto dto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null)
            {
                return Unauthorized();
            }

            var activity = new NgoActivity
            {
                OrganizationName = dto.OrganizationName,
                Role = dto.Role,
                Description = dto.Description,
                HoursContributed = dto.HoursContributed,
                StartDate = DateTime.SpecifyKind(dto.StartDate, DateTimeKind.Utc),
                EndDate = dto.EndDate.HasValue ? DateTime.SpecifyKind(dto.EndDate.Value, DateTimeKind.Utc) : null,
                CertificateUrl = dto.CertificateUrl,
                UserId = int.Parse(userId)
            };

            _context.NgoActivities.Add(activity);
            await _context.SaveChangesAsync();

            return Ok(activity);
        }

        [Authorize]
        [HttpGet]
        public async Task<IActionResult> GetNgoActivities()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null)
            {
                return Unauthorized();
            }

            var activities = await _context.NgoActivities
                .Where(x => x.UserId == int.Parse(userId))
                .ToListAsync();

            return Ok(activities);
        }

        [Authorize]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateNgoActivity(int id, CreateNgoActivityDto dto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null)
            {
                return Unauthorized();
            }

            var activity = await _context.NgoActivities
                .FirstOrDefaultAsync(x => x.Id == id && x.UserId == int.Parse(userId));

            if (activity == null)
            {
                return NotFound();
            }

            activity.OrganizationName = dto.OrganizationName;
            activity.Role = dto.Role;
            activity.Description = dto.Description;
            activity.HoursContributed = dto.HoursContributed;
            activity.StartDate = DateTime.SpecifyKind(dto.StartDate, DateTimeKind.Utc);
            activity.EndDate = dto.EndDate.HasValue ? DateTime.SpecifyKind(dto.EndDate.Value, DateTimeKind.Utc) : null;
            activity.CertificateUrl = dto.CertificateUrl;

            await _context.SaveChangesAsync();
            return Ok(activity);
        }

        [Authorize]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteNgoActivity(int id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null)
            {
                return Unauthorized();
            }

            var activity = await _context.NgoActivities
                .FirstOrDefaultAsync(x => x.Id == id && x.UserId == int.Parse(userId));

            if (activity == null)
            {
                return NotFound();
            }

            _context.NgoActivities.Remove(activity);
            await _context.SaveChangesAsync();

            return Ok(new { message = "NGO activity record deleted successfully." });
        }
    }
}
