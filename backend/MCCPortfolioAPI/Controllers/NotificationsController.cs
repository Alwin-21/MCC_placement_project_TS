using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using MCCPortfolioAPI.Data;
using MCCPortfolioAPI.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MCCPortfolioAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class NotificationsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public NotificationsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/Notifications/student
        [Authorize]
        [HttpGet("student")]
        public async Task<IActionResult> GetStudentNotifications()
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userIdStr == null)
            {
                return Unauthorized();
            }

            int userId = int.Parse(userIdStr);

            var notifications = await _context.Notifications
                .Where(n => n.UserId == null || n.UserId == userId)
                .OrderByDescending(n => n.CreatedAt)
                .Select(n => new
                {
                    n.Id,
                    n.Title,
                    n.Message,
                    n.Type,
                    n.IsRead,
                    n.CreatedAt
                })
                .ToListAsync();

            return Ok(notifications);
        }

        // POST: api/Notifications/student/{id}/read
        [Authorize]
        [HttpPost("student/{id}/read")]
        public async Task<IActionResult> MarkAsRead(int id)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userIdStr == null)
            {
                return Unauthorized();
            }

            int userId = int.Parse(userIdStr);

            var notification = await _context.Notifications
                .FirstOrDefaultAsync(n => n.Id == id && (n.UserId == null || n.UserId == userId));

            if (notification == null)
            {
                return NotFound("Notification not found");
            }

            notification.IsRead = true;
            await _context.SaveChangesAsync();

            return Ok(new { success = true });
        }
    }
}
