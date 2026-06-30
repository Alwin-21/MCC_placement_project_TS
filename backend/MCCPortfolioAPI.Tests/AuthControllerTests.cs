using MCCPortfolioAPI.Controllers;
using MCCPortfolioAPI.DTOs;
using MCCPortfolioAPI.Entities;
using MCCPortfolioAPI.Models;
using MCCPortfolioAPI.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using System.Collections.Generic;
using System.Threading.Tasks;
using Xunit;

namespace MCCPortfolioAPI.Tests
{
    public class AuthControllerTests
    {
        private readonly IConfiguration _configuration;
        private readonly JwtService _jwtService;

        public AuthControllerTests()
        {
            _configuration = new ConfigurationBuilder()
                .AddInMemoryCollection(new Dictionary<string, string?>
                {
                    { "Jwt:Key", "THIS_IS_SUPER_SECRET_KEY_FOR_MCC_PORTFOLIO_PLATFORM_2026" },
                    { "Jwt:Issuer", "MCCPortfolioAPI" },
                    { "Jwt:Audience", "MCCPortfolioClient" }
                })
                .Build();

            _jwtService = new JwtService(_configuration);
        }

        [Fact]
        public async Task Register_NewStudent_ReturnsOkAndToken()
        {
            // Arrange
            using var context = TestDatabaseFixture.CreateDbContext();
            var controller = new AuthController(context, _jwtService);

            var registerDto = new RegisterDto
            {
                FullName = "John Doe",
                Email = "john.doe@example.com",
                Password = "Password123!",
                Department = "Computer Science",
                RegisterNumber = "CS101"
            };

            // Act
            var result = await controller.Register(registerDto);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<AuthResponseDto>(okResult.Value);

            Assert.Equal("John Doe", response.FullName);
            Assert.Equal("john.doe@example.com", response.Email);
            Assert.Equal("Student", response.Role);
            Assert.False(string.IsNullOrEmpty(response.Token));
        }

        [Fact]
        public async Task Register_DuplicateEmail_ReturnsBadRequest()
        {
            // Arrange
            using var context = TestDatabaseFixture.CreateDbContext();
            var controller = new AuthController(context, _jwtService);

            context.Users.Add(new User
            {
                FullName = "Existing User",
                Email = "existing@example.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Password123!")
            });
            await context.SaveChangesAsync();

            var registerDto = new RegisterDto
            {
                FullName = "Another User",
                Email = "existing@example.com",
                Password = "Password123!"
            };

            // Act
            var result = await controller.Register(registerDto);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Equal("Email already exists", badRequestResult.Value);
        }

        [Fact]
        public async Task Login_ValidCredentials_ReturnsOkAndToken()
        {
            // Arrange
            using var context = TestDatabaseFixture.CreateDbContext();
            var controller = new AuthController(context, _jwtService);

            context.Users.Add(new User
            {
                FullName = "Bob Smith",
                Email = "bob.smith@example.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("SecretPass!")
            });
            await context.SaveChangesAsync();

            var loginDto = new LoginDto
            {
                Email = "bob.smith@example.com",
                Password = "SecretPass!"
            };

            // Act
            var result = await controller.Login(loginDto);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<AuthResponseDto>(okResult.Value);

            Assert.Equal("Bob Smith", response.FullName);
            Assert.Equal("Student", response.Role);
            Assert.False(string.IsNullOrEmpty(response.Token));
        }

        [Fact]
        public async Task Login_InvalidPassword_ReturnsUnauthorized()
        {
            // Arrange
            using var context = TestDatabaseFixture.CreateDbContext();
            var controller = new AuthController(context, _jwtService);

            context.Users.Add(new User
            {
                FullName = "Bob Smith",
                Email = "bob.smith@example.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("SecretPass!")
            });
            await context.SaveChangesAsync();

            var loginDto = new LoginDto
            {
                Email = "bob.smith@example.com",
                Password = "WrongPassword"
            };

            // Act
            var result = await controller.Login(loginDto);

            // Assert
            var unauthorizedResult = Assert.IsType<UnauthorizedObjectResult>(result);
            Assert.Equal("Invalid credentials", unauthorizedResult.Value);
        }

        private class AdminUserResponse
        {
            public string FullName { get; set; } = string.Empty;
            public string Email { get; set; } = string.Empty;
            public string Role { get; set; } = string.Empty;
        }

        private class AdminLoginResponse
        {
            public string Token { get; set; } = string.Empty;
            public AdminUserResponse User { get; set; } = null!;
        }

        [Fact]
        public async Task AdminLogin_ValidCredentials_ReturnsRealToken()
        {
            // Arrange
            using var context = TestDatabaseFixture.CreateDbContext();
            var controller = new AuthController(context, _jwtService);

            var loginDto = new LoginDto
            {
                Email = "admin@mcc.com",
                Password = "admin123"
            };

            // Act
            var result = controller.AdminLogin(loginDto);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            
            var json = System.Text.Json.JsonSerializer.Serialize(okResult.Value);
            var response = System.Text.Json.JsonSerializer.Deserialize<AdminLoginResponse>(json, new System.Text.Json.JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            Assert.NotNull(response);
            Assert.False(string.IsNullOrEmpty(response.Token));
            Assert.Equal("Admin", response.User.Role);
        }

        [Fact]
        public async Task AdminLogin_InvalidCredentials_ReturnsUnauthorized()
        {
            // Arrange
            using var context = TestDatabaseFixture.CreateDbContext();
            var controller = new AuthController(context, _jwtService);

            var loginDto = new LoginDto
            {
                Email = "admin@mcc.com",
                Password = "wrongpassword"
            };

            // Act
            var result = controller.AdminLogin(loginDto);

            // Assert
            Assert.IsType<UnauthorizedObjectResult>(result);
        }
    }
}
