using MCCPortfolioAPI.Data;

using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MCCPortfolioAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SearchController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public SearchController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> SearchStudents(string query)
        {
            if (string.IsNullOrEmpty(query))
            {
                return Ok(new List<object>());
            }

            query = query.ToLower();

            var students = await _context.Users
                .Where(u =>
                    u.FullName.ToLower().Contains(query) ||

                    _context.Skills.Any(s =>
                        s.UserId == u.Id &&
                        s.Name.ToLower().Contains(query)
                    )
                )
                .Select(u => new
                {
                    u.Id,
                    u.FullName,
                    Email = u.Email
                })
                .ToListAsync();

            return Ok(students);
        }
    }
}