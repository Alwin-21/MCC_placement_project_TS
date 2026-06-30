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
    public class CertificationsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public CertificationsController(ApplicationDbContext context)
        {
            _context = context;
        }

        [Authorize]
        [HttpPost]
        public async Task<IActionResult> AddCertification(CreateCertificationDto dto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (userId == null)
            {
                return Unauthorized();
            }

            var certification = new Certification
            {
                Title = dto.Title,
                Issuer = dto.Issuer,
                CertificateUrl = dto.CertificateUrl,
                IssueDate = DateTime.SpecifyKind(dto.IssueDate, DateTimeKind.Utc),
                Category = dto.Category,
                UserId = int.Parse(userId)
            };

            _context.Certifications.Add(certification);

            await _context.SaveChangesAsync();

            return Ok(certification);
        }

        [Authorize]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateCertification(int id, CreateCertificationDto dto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null)
            {
                return Unauthorized();
            }

            var certification = await _context.Certifications
                .FirstOrDefaultAsync(x => x.Id == id && x.UserId == int.Parse(userId));

            if (certification == null)
            {
                return NotFound();
            }

            certification.Title = dto.Title;
            certification.Issuer = dto.Issuer;
            certification.CertificateUrl = dto.CertificateUrl;
            certification.IssueDate = DateTime.SpecifyKind(dto.IssueDate, DateTimeKind.Utc);
            certification.Category = dto.Category;

            await _context.SaveChangesAsync();

            return Ok(certification);
        }

        [Authorize]
        [HttpGet]
        public async Task<IActionResult> GetCertifications()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (userId == null)
            {
                return Unauthorized();
            }

            var certifications = await _context.Certifications
                .Where(x => x.UserId == int.Parse(userId))
                .ToListAsync();

            return Ok(certifications);
        }

        [Authorize]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCertification(int id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            var certification = await _context.Certifications.FindAsync(id);
            if (certification == null) return NotFound();

            if (certification.UserId != int.Parse(userId))
            {
                return Forbid();
            }

            _context.Certifications.Remove(certification);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}