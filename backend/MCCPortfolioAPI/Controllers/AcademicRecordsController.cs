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
    public class AcademicRecordsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public AcademicRecordsController(ApplicationDbContext context)
        {
            _context = context;
        }

        [Authorize]
        [HttpPost]
        public async Task<IActionResult> AddAcademicRecord(CreateAcademicRecordDto dto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null)
            {
                return Unauthorized();
            }

            var record = new AcademicRecord
            {
                Institution = dto.Institution,
                Degree = dto.Degree,
                FieldOfStudy = dto.FieldOfStudy,
                Grade = dto.Grade,
                StartYear = dto.StartYear,
                EndYear = dto.EndYear,
                AttachmentUrl = dto.AttachmentUrl,
                UserId = int.Parse(userId)
            };

            _context.AcademicRecords.Add(record);
            await _context.SaveChangesAsync();

            return Ok(record);
        }

        [Authorize]
        [HttpGet]
        public async Task<IActionResult> GetAcademicRecords()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null)
            {
                return Unauthorized();
            }

            var records = await _context.AcademicRecords
                .Where(x => x.UserId == int.Parse(userId))
                .ToListAsync();

            return Ok(records);
        }

        [Authorize]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateAcademicRecord(int id, CreateAcademicRecordDto dto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null)
            {
                return Unauthorized();
            }

            var record = await _context.AcademicRecords
                .FirstOrDefaultAsync(x => x.Id == id && x.UserId == int.Parse(userId));

            if (record == null)
            {
                return NotFound();
            }

            record.Institution = dto.Institution;
            record.Degree = dto.Degree;
            record.FieldOfStudy = dto.FieldOfStudy;
            record.Grade = dto.Grade;
            record.StartYear = dto.StartYear;
            record.EndYear = dto.EndYear;
            record.AttachmentUrl = dto.AttachmentUrl;

            await _context.SaveChangesAsync();
            return Ok(record);
        }

        [Authorize]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAcademicRecord(int id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null)
            {
                return Unauthorized();
            }

            var record = await _context.AcademicRecords
                .FirstOrDefaultAsync(x => x.Id == id && x.UserId == int.Parse(userId));

            if (record == null)
            {
                return NotFound();
            }

            _context.AcademicRecords.Remove(record);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Academic record deleted successfully." });
        }
    }
}
