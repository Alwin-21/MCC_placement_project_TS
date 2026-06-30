
using BCrypt.Net;
using MCCPortfolioAPI.Data;
using MCCPortfolioAPI.DTOs;
using MCCPortfolioAPI.Entities;
using MCCPortfolioAPI.Models;
using MCCPortfolioAPI.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MCCPortfolioAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        private readonly JwtService _jwtService;

        public AuthController(
            ApplicationDbContext context,
            JwtService jwtService
        )
        {
            _context = context;

            _jwtService = jwtService;
        }

        // =========================
        // STUDENT REGISTER
        // =========================

        [HttpPost("register")]
        public async Task<IActionResult> Register(RegisterDto dto)
        {
            var existingUser = await _context.Users
                .FirstOrDefaultAsync(x => x.Email == dto.Email);

            if (existingUser != null)
            {
                return BadRequest("Email already exists");
            }

            var user = new User
            {
                FullName = dto.FullName,
                Email = dto.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                Department = dto.Department,
                RegisterNumber = dto.RegisterNumber,
                Role = UserRole.Student
            };

            _context.Users.Add(user);

            await _context.SaveChangesAsync();

            var token = _jwtService.GenerateToken(user);

            return Ok(new AuthResponseDto
            {
                Id = user.Id,
                Token = token,
                FullName = user.FullName,
                Email = user.Email,
                Role = user.Role.ToString()
            });
        }

        // =========================
        // STUDENT LOGIN
        // =========================

        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginDto dto)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(x => x.Email == dto.Email);

            if (user == null)
            {
                return Unauthorized("Invalid credentials");
            }

            var validPassword = BCrypt.Net.BCrypt.Verify(
                dto.Password,
                user.PasswordHash
            );

            if (!validPassword)
            {
                return Unauthorized("Invalid credentials");
            }

            var token = _jwtService.GenerateToken(user);

            return Ok(new AuthResponseDto
            {
                Id = user.Id,
                Token = token,
                FullName = user.FullName,
                Email = user.Email,
                Role = user.Role.ToString()
            });
        }

        // =========================
        // ADMIN LOGIN
        // =========================

        [HttpPost("admin-login")]
        public IActionResult AdminLogin(LoginDto dto)
        {
            var adminEmail = "admin@mcc.com";

            var adminPassword = "admin123";

            if (
                dto.Email != adminEmail ||
                dto.Password != adminPassword
            )
            {
                return Unauthorized(new
                {
                    message = "Invalid Admin Credentials"
                });
            }

            var adminUser = new User
            {
                Id = 999,
                FullName = "Administrator",
                Email = adminEmail,
                Role = UserRole.Admin
            };

            var token = _jwtService.GenerateToken(adminUser);

            return Ok(new
            {
                token = token,

                user = new
                {
                    fullName = adminUser.FullName,

                    email = adminUser.Email,

                    role = "Admin"
                }
            });
        }

        // =========================
        // EXTERNAL GOOGLE/GITHUB LOGIN
        // =========================

        [HttpPost("external-login")]
        public async Task<IActionResult> ExternalLogin(ExternalLoginDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Email))
            {
                return BadRequest("Email is required.");
            }

            var user = await _context.Users
                .FirstOrDefaultAsync(x => x.Email == dto.Email);

            if (user == null)
            {
                user = new User
                {
                    FullName = string.IsNullOrWhiteSpace(dto.FullName) ? "External User" : dto.FullName,
                    Email = dto.Email,
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword(Guid.NewGuid().ToString()),
                    Department = "Computer Science",
                    RegisterNumber = "EXT-" + Guid.NewGuid().ToString().Substring(0, 8).ToUpper(),
                    Role = UserRole.Student
                };

                _context.Users.Add(user);
                await _context.SaveChangesAsync();
            }

            var token = _jwtService.GenerateToken(user);

            return Ok(new AuthResponseDto
            {
                Id = user.Id,
                Token = token,
                FullName = user.FullName,
                Email = user.Email,
                Role = user.Role.ToString()
            });
        }
    }
}
