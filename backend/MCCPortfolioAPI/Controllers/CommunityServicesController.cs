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
    public class CommunityServicesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public CommunityServicesController(ApplicationDbContext context)
        {
            _context = context;
        }

        [Authorize]
        [HttpPost]
        public async Task<IActionResult> AddCommunityService(CreateCommunityServiceDto dto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null)
            {
                return Unauthorized();
            }

            var service = new CommunityService
            {
                Title = dto.Title,
                Organization = dto.Organization,
                Description = dto.Description,
                HoursServed = dto.HoursServed,
                Date = DateTime.SpecifyKind(dto.Date, DateTimeKind.Utc),
                AttachmentUrl = dto.AttachmentUrl,
                UserId = int.Parse(userId)
            };

            _context.CommunityServices.Add(service);
            await _context.SaveChangesAsync();

            return Ok(service);
        }

        [Authorize]
        [HttpGet]
        public async Task<IActionResult> GetCommunityServices()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null)
            {
                return Unauthorized();
            }

            var services = await _context.CommunityServices
                .Where(x => x.UserId == int.Parse(userId))
                .ToListAsync();

            return Ok(services);
        }

        [Authorize]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateCommunityService(int id, CreateCommunityServiceDto dto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null)
            {
                return Unauthorized();
            }

            var service = await _context.CommunityServices
                .FirstOrDefaultAsync(x => x.Id == id && x.UserId == int.Parse(userId));

            if (service == null)
            {
                return NotFound();
            }

            service.Title = dto.Title;
            service.Organization = dto.Organization;
            service.Description = dto.Description;
            service.HoursServed = dto.HoursServed;
            service.Date = DateTime.SpecifyKind(dto.Date, DateTimeKind.Utc);
            service.AttachmentUrl = dto.AttachmentUrl;

            await _context.SaveChangesAsync();
            return Ok(service);
        }

        [Authorize]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCommunityService(int id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null)
            {
                return Unauthorized();
            }

            var service = await _context.CommunityServices
                .FirstOrDefaultAsync(x => x.Id == id && x.UserId == int.Parse(userId));

            if (service == null)
            {
                return NotFound();
            }

            _context.CommunityServices.Remove(service);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Community service record deleted successfully." });
        }
    }
}
