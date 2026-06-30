using MCCPortfolioAPI.Data;
using MCCPortfolioAPI.Services;

using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Add services

builder.Services.AddControllers();

builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen();

// PostgreSQL

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("DefaultConnection")
    )
);

// JWT Service

builder.Services.AddScoped<JwtService>();

// Authentication

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,

            ValidIssuer = builder.Configuration["Jwt:Issuer"],

            ValidAudience = builder.Configuration["Jwt:Audience"],

            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(
                    builder.Configuration["Jwt:Key"]!
                )
            )
        };
    });

// Authorization

builder.Services.AddAuthorization();

// CORS

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
        policy =>
        {
            policy.AllowAnyOrigin()
                  .AllowAnyMethod()
                  .AllowAnyHeader();
        });
});

var app = builder.Build();

// Database Migration & Seeding on Startup
using (var scope = app.Services.CreateScope())
{
    try
    {
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        context.Database.Migrate();

        // Seed default Institution Detail
        if (!context.InstitutionDetails.Any())
        {
            context.InstitutionDetails.Add(new MCCPortfolioAPI.Entities.InstitutionDetail
            {
                Name = "Madras Christian College",
                Code = "MCC",
                Description = "Madras Christian College (MCC) is a premier institution of higher education in Chennai, India. Founded in 1837, it is one of Asia's oldest extant colleges.",
                Address = "Tambaram, Chennai, Tamil Nadu 600059",
                ContactEmail = "info@mcc.edu.in",
                ContactPhone = "044 2239 0675",
                Website = "https://mcc.edu.in",
                LogoUrl = "https://mcc.edu.in/wp-content/uploads/2020/09/mcc-logo.png",
                Departments = "Computer Science;BCA;Physics;Chemistry;English;Mathematics;Commerce"
            });
        }

        // Seed default Theme Configs
        if (!context.ThemeConfigs.Any())
        {
            context.ThemeConfigs.AddRange(
                new MCCPortfolioAPI.Entities.ThemeConfig { ThemeId = "Academic", DisplayName = "Academic Professional", Description = "A clean, structured theme suitable for academic profiles.", IsActive = true },
                new MCCPortfolioAPI.Entities.ThemeConfig { ThemeId = "Startup", DisplayName = "Startup / Tech", Description = "Modern, dark-themed layout designed for tech and business startups.", IsActive = true },
                new MCCPortfolioAPI.Entities.ThemeConfig { ThemeId = "Creative", DisplayName = "Creative / Designer", Description = "A vibrant, visually engaging showcase for designers and writers.", IsActive = true },
                new MCCPortfolioAPI.Entities.ThemeConfig { ThemeId = "AIFuturistic", DisplayName = "AI / Futuristic", Description = "Glowing cyberpunk aesthetics featuring glassmorphism and tech highlights.", IsActive = true }
            );
        }

        context.SaveChanges();
    }
    catch (Exception ex)
    {
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "An error occurred during database migration/seeding.");
    }
}

// Configure pipeline

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowAll");

app.UseStaticFiles();

app.UseAuthentication();

app.UseAuthorization();

app.MapControllers();

app.Run();