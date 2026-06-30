using System;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Security.Claims;
using BCrypt.Net;
using MCCPortfolioAPI.Data;
using MCCPortfolioAPI.DTOs;
using MCCPortfolioAPI.Entities;
using MCCPortfolioAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MCCPortfolioAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin,Moderator")]
    public class AdminController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public AdminController(ApplicationDbContext context)
        {
            _context = context;
        }

        private async Task LogActionAsync(string action, string details)
        {
            try
            {
                var userEmail = User.FindFirstValue(ClaimTypes.Email) ?? User.FindFirstValue(ClaimTypes.Name) ?? "unknown";
                var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
                
                var log = new AuditLog
                {
                    Action = action,
                    PerformedByEmail = userEmail,
                    Timestamp = DateTime.UtcNow,
                    Details = details,
                    IpAddress = ip
                };
                
                _context.AuditLogs.Add(log);
                await _context.SaveChangesAsync();
            }
            catch
            {
                // Fail-safe
            }
        }

        // ==========================================
        // ECOSYSTEM DASHBOARD METRICS
        // ==========================================

        [HttpGet("dashboard")]
        public async Task<IActionResult> GetDashboard()
        {
            var totalStudents = await _context.Users.CountAsync();
            var totalSkills = await _context.Skills.CountAsync();
            var totalProjects = await _context.Projects.CountAsync();
            var totalAchievements = await _context.Achievements.CountAsync();
            var totalHackathons = await _context.Hackathons.CountAsync();
            var totalResearchPapers = await _context.ResearchPapers.CountAsync();

            return Ok(new
            {
                totalStudents,
                totalSkills,
                totalProjects,
                totalAchievements,
                totalHackathons,
                totalResearchPapers
            });
        }

        // ==========================================
        // STUDENT & USER DIRECTORY (CRUD + APPROVAL)
        // ==========================================

        [HttpGet("students")]
        public async Task<IActionResult> GetStudents()
        {
            var students = await _context.Users
                .GroupJoin(
                    _context.Profiles,
                    user => user.Id,
                    profile => profile.UserId,
                    (user, profiles) => new { user, profiles }
                )
                .SelectMany(
                    temp => temp.profiles.DefaultIfEmpty(),
                    (temp, profile) => new
                    {
                        temp.user.Id,
                        temp.user.FullName,
                        temp.user.Email,
                        temp.user.Department,
                        temp.user.RegisterNumber,
                        Role = temp.user.Role.ToString(),
                        IsApproved = profile != null ? profile.IsApproved : false,
                        SelectedTheme = profile != null ? profile.SelectedTheme : "Academic",
                        IsAlumni = profile != null ? profile.IsAlumni : false,
                        GraduationYear = profile != null ? profile.GraduationYear : null,
                        CurrentCompany = profile != null ? profile.CurrentCompany : string.Empty,
                        CurrentJobTitle = profile != null ? profile.CurrentJobTitle : string.Empty,
                        HigherStudyUniversity = profile != null ? profile.HigherStudyUniversity : string.Empty,
                        HigherStudyProgram = profile != null ? profile.HigherStudyProgram : string.Empty
                    }
                )
                .ToListAsync();

            return Ok(students);
        }

        [HttpPost("students")]
        public async Task<IActionResult> CreateStudent([FromBody] RegisterDto dto)
        {
            if (await _context.Users.AnyAsync(u => u.Email == dto.Email))
            {
                return BadRequest("Email already exists.");
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

            await LogActionAsync("Create Student", $"Created user {dto.Email} ({dto.FullName})");

            return Ok(new { success = true, userId = user.Id });
        }

        [HttpPut("students/{id}")]
        public async Task<IActionResult> UpdateStudent(int id, [FromBody] AdminUpdateStudentDto dto)
        {
            if (!User.IsInRole("Admin"))
            {
                return Forbid();
            }

            var user = await _context.Users.FindAsync(id);
            if (user == null)
            {
                return NotFound("Student not found.");
            }

            if (await _context.Users.AnyAsync(u => u.Email == dto.Email && u.Id != id))
            {
                return BadRequest("Email is already in use by another user.");
            }

            user.FullName = dto.FullName;
            user.Email = dto.Email;
            user.Department = dto.Department;
            user.RegisterNumber = dto.RegisterNumber;
            
            if (Enum.TryParse<UserRole>(dto.Role, out var newRole))
            {
                user.Role = newRole;
            }

            await _context.SaveChangesAsync();
            await LogActionAsync("Update Student", $"Updated student details for user ID {id} ({user.Email})");
            return Ok(new { success = true });
        }

        [HttpDelete("students/{id}")]
        public async Task<IActionResult> DeleteStudent(int id)
        {
            if (!User.IsInRole("Admin"))
            {
                return Forbid();
            }

            var user = await _context.Users.FindAsync(id);
            if (user == null)
            {
                return NotFound("User not found.");
            }

            // Cascade delete cleanups (if EF doesn't trigger automatically in DB provider)
            var profile = await _context.Profiles.FirstOrDefaultAsync(p => p.UserId == id);
            if (profile != null) _context.Profiles.Remove(profile);

            var skills = await _context.Skills.Where(s => s.UserId == id).ToListAsync();
            _context.Skills.RemoveRange(skills);

            var projects = await _context.Projects.Where(p => p.UserId == id).ToListAsync();
            _context.Projects.RemoveRange(projects);

            var achievements = await _context.Achievements.Where(a => a.UserId == id).ToListAsync();
            _context.Achievements.RemoveRange(achievements);

            var hackathons = await _context.Hackathons.Where(h => h.UserId == id).ToListAsync();
            _context.Hackathons.RemoveRange(hackathons);

            var papers = await _context.ResearchPapers.Where(r => r.UserId == id).ToListAsync();
            _context.ResearchPapers.RemoveRange(papers);

            var certifications = await _context.Certifications.Where(c => c.UserId == id).ToListAsync();
            _context.Certifications.RemoveRange(certifications);

            var resumes = await _context.Resumes.Where(r => r.UserId == id).ToListAsync();
            _context.Resumes.RemoveRange(resumes);

            var communityServices = await _context.CommunityServices.Where(c => c.UserId == id).ToListAsync();
            _context.CommunityServices.RemoveRange(communityServices);

            var creativeWorks = await _context.CreativeWorks.Where(c => c.UserId == id).ToListAsync();
            _context.CreativeWorks.RemoveRange(creativeWorks);

            var academicRecords = await _context.AcademicRecords.Where(a => a.UserId == id).ToListAsync();
            _context.AcademicRecords.RemoveRange(academicRecords);

            var olympiads = await _context.Olympiads.Where(o => o.UserId == id).ToListAsync();
            _context.Olympiads.RemoveRange(olympiads);

            var startupCompetitions = await _context.StartupCompetitions.Where(s => s.UserId == id).ToListAsync();
            _context.StartupCompetitions.RemoveRange(startupCompetitions);

            var ngoActivities = await _context.NgoActivities.Where(n => n.UserId == id).ToListAsync();
            _context.NgoActivities.RemoveRange(ngoActivities);

            var sportsAchievements = await _context.SportsAchievements.Where(s => s.UserId == id).ToListAsync();
            _context.SportsAchievements.RemoveRange(sportsAchievements);

            var notifications = await _context.Notifications.Where(n => n.UserId == id).ToListAsync();
            _context.Notifications.RemoveRange(notifications);

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();

            await LogActionAsync("Delete Student", $"Deleted user ID {id} ({user.Email}, Name: {user.FullName})");

            return Ok(new { success = true });
        }

        [HttpPost("approve/{studentId}")]
        public async Task<IActionResult> ApprovePortfolio(int studentId, [FromBody] bool isApproved)
        {
            var profile = await _context.Profiles
                .FirstOrDefaultAsync(x => x.UserId == studentId);

            if (profile == null)
            {
                profile = new Profile
                {
                    UserId = studentId,
                    IsApproved = isApproved,
                    Bio = string.Empty,
                    LinkedInUrl = string.Empty,
                    GitHubUrl = string.Empty,
                    ProfileImageUrl = string.Empty,
                    SelectedTheme = "Academic"
                };
                _context.Profiles.Add(profile);
            }
            else
            {
                profile.IsApproved = isApproved;
            }

            await _context.SaveChangesAsync();
            await LogActionAsync("Portfolio Verification Update", $"Portfolio of student ID {studentId} verification status set to {isApproved}");
            return Ok(new { isApproved = profile.IsApproved });
        }

        // ==========================================
        // INSTITUTION MANAGEMENT
        // ==========================================

        [HttpGet("institution")]
        public async Task<IActionResult> GetInstitution()
        {
            var institution = await _context.InstitutionDetails.FirstOrDefaultAsync();
            if (institution == null)
            {
                return NotFound("Institution details not found.");
            }
            return Ok(institution);
        }

        [HttpPut("institution")]
        public async Task<IActionResult> UpdateInstitution([FromBody] InstitutionDetail updated)
        {
            if (!User.IsInRole("Admin"))
            {
                return Forbid();
            }

            var institution = await _context.InstitutionDetails.FirstOrDefaultAsync();
            if (institution == null)
            {
                institution = new InstitutionDetail();
                _context.InstitutionDetails.Add(institution);
            }

            institution.Name = updated.Name;
            institution.Code = updated.Code;
            institution.Description = updated.Description;
            institution.Address = updated.Address;
            institution.ContactEmail = updated.ContactEmail;
            institution.ContactPhone = updated.ContactPhone;
            institution.Website = updated.Website;
            institution.LogoUrl = updated.LogoUrl;
            institution.Departments = updated.Departments;

            await _context.SaveChangesAsync();
            await LogActionAsync("Update Institution", $"Updated details of institution: {updated.Name}");
            return Ok(institution);
        }

        [HttpPost("institution/departments")]
        public async Task<IActionResult> AddDepartment([FromBody] string deptName)
        {
            if (!User.IsInRole("Admin"))
            {
                return Forbid();
            }

            if (string.IsNullOrWhiteSpace(deptName))
            {
                return BadRequest("Department name cannot be empty.");
            }

            var institution = await _context.InstitutionDetails.FirstOrDefaultAsync();
            if (institution == null)
            {
                return NotFound("Institution details not found.");
            }

            var deptList = institution.Departments
                .Split(';', StringSplitOptions.RemoveEmptyEntries)
                .Select(d => d.Trim())
                .ToList();

            if (deptList.Contains(deptName, StringComparer.OrdinalIgnoreCase))
            {
                return BadRequest("Department already exists.");
            }

            deptList.Add(deptName.Trim());
            institution.Departments = string.Join(";", deptList);

            await _context.SaveChangesAsync();
            await LogActionAsync("Add Department", $"Added department: {deptName}");
            return Ok(new { departments = institution.Departments });
        }

        [HttpDelete("institution/departments/{name}")]
        public async Task<IActionResult> DeleteDepartment(string name)
        {
            if (!User.IsInRole("Admin"))
            {
                return Forbid();
            }

            var institution = await _context.InstitutionDetails.FirstOrDefaultAsync();
            if (institution == null)
            {
                return NotFound("Institution details not found.");
            }

            var deptList = institution.Departments
                .Split(';', StringSplitOptions.RemoveEmptyEntries)
                .Select(d => d.Trim())
                .ToList();

            var match = deptList.FirstOrDefault(d => d.Equals(name, StringComparison.OrdinalIgnoreCase));
            if (match == null)
            {
                return NotFound("Department not found.");
            }

            deptList.Remove(match);
            institution.Departments = string.Join(";", deptList);

            await _context.SaveChangesAsync();
            await LogActionAsync("Delete Department", $"Deleted department: {name}");
            return Ok(new { departments = institution.Departments });
        }

        // ==========================================
        // DEPARTMENT ANALYTICS
        // ==========================================

        [HttpGet("department-analytics")]
        public async Task<IActionResult> GetDepartmentAnalytics()
        {
            var users = await _context.Users.ToListAsync();
            var profiles = await _context.Profiles.ToListAsync();
            var projects = await _context.Projects.ToListAsync();
            var papers = await _context.ResearchPapers.ToListAsync();
            var skills = await _context.Skills.ToListAsync();

            var institution = await _context.InstitutionDetails.FirstOrDefaultAsync();
            var declaredDepts = institution != null 
                ? institution.Departments.Split(';', StringSplitOptions.RemoveEmptyEntries).Select(d => d.Trim()).ToList() 
                : new List<string>();

            // Include departments that have users even if not listed in default metadata
            var userDepts = users.Select(u => u.Department).Distinct().Where(d => !string.IsNullOrEmpty(d)).ToList();
            var allDepts = declaredDepts.Union(userDepts, StringComparer.OrdinalIgnoreCase).ToList();

            var analytics = allDepts.Select(dept =>
            {
                var deptUsers = users.Where(u => u.Department.Equals(dept, StringComparison.OrdinalIgnoreCase)).ToList();
                var deptUserIds = deptUsers.Select(u => u.Id).ToHashSet();

                var studentCount = deptUsers.Count;
                var projectCount = projects.Count(p => deptUserIds.Contains(p.UserId));
                var paperCount = papers.Count(r => deptUserIds.Contains(r.UserId));
                var skillCount = skills.Count(s => deptUserIds.Contains(s.UserId));

                var deptProfiles = profiles.Where(p => deptUserIds.Contains(p.UserId)).ToList();
                var approvedCount = deptProfiles.Count(p => p.IsApproved);
                var approvalRate = studentCount > 0 ? (double)approvedCount / studentCount * 100 : 0;

                return new
                {
                    Department = dept,
                    StudentCount = studentCount,
                    ProjectCount = projectCount,
                    PaperCount = paperCount,
                    SkillCount = skillCount,
                    ApprovalRate = Math.Round(approvalRate, 1)
                };
            })
            .OrderByDescending(a => a.StudentCount)
            .ToList();

            return Ok(analytics);
        }

        // ==========================================
        // ROLE MANAGEMENT
        // ==========================================

        [HttpPut("users/{id}/role")]
        public async Task<IActionResult> UpdateUserRole(int id, [FromBody] RoleUpdateModel model)
        {
            if (!User.IsInRole("Admin"))
            {
                return Forbid();
            }

            var user = await _context.Users.FindAsync(id);
            if (user == null)
            {
                return NotFound("User not found.");
            }

            if (!Enum.TryParse<UserRole>(model.Role, out var newRole))
            {
                return BadRequest("Invalid role specified.");
            }

            user.Role = newRole;
            await _context.SaveChangesAsync();
            await LogActionAsync("Modify Role", $"Modified role of user ID {id} ({user.Email}) to {user.Role.ToString()}");

            return Ok(new { success = true, userId = user.Id, role = user.Role.ToString() });
        }

        // ==========================================
        // THEME CONFIGURATION MANAGEMENT
        // ==========================================

        [HttpGet("themes")]
        public async Task<IActionResult> GetThemes()
        {
            var themes = await _context.ThemeConfigs.ToListAsync();
            var profiles = await _context.Profiles.ToListAsync();

            var analytics = themes.Select(t => new
            {
                t.Id,
                t.ThemeId,
                t.DisplayName,
                t.Description,
                t.IsActive,
                t.PrimaryColor,
                t.SecondaryColor,
                t.FontFamily,
                StudentCount = profiles.Count(p => p.SelectedTheme.Equals(t.ThemeId, StringComparison.OrdinalIgnoreCase))
            }).ToList();

            return Ok(analytics);
        }

        [HttpPut("themes/{themeId}")]
        public async Task<IActionResult> UpdateTheme(string themeId, [FromBody] ThemeConfigUpdateModel model)
        {
            if (!User.IsInRole("Admin"))
            {
                return Forbid();
            }

            var theme = await _context.ThemeConfigs
                .FirstOrDefaultAsync(t => t.ThemeId.ToLower() == themeId.ToLower());

            if (theme == null)
            {
                return NotFound("Theme configuration not found.");
            }

            theme.DisplayName = model.DisplayName;
            theme.Description = model.Description;
            theme.IsActive = model.IsActive;
            theme.PrimaryColor = model.PrimaryColor ?? string.Empty;
            theme.SecondaryColor = model.SecondaryColor ?? string.Empty;
            theme.FontFamily = model.FontFamily ?? string.Empty;

            await _context.SaveChangesAsync();
            await LogActionAsync("Modify Theme Parameters", $"Modified settings for theme: {themeId} (Active: {model.IsActive})");
            return Ok(theme);
        }

        // ==========================================
        // REPORTS & ANALYTICS & CSV EXPORT
        // ==========================================

        [HttpGet("reports")]
        public async Task<IActionResult> GetReportsSummary()
        {
            // Registration Growth (last 30 days vs previous)
            var totalUsers = await _context.Users.CountAsync();
            var last30Days = DateTime.UtcNow.AddDays(-30);
            var registeredLast30 = await _context.Users.CountAsync(u => u.CreatedAt >= last30Days);

            // Most Popular Skills
            var popularSkills = await _context.Skills
                .GroupBy(s => s.Name)
                .Select(g => new { Skill = g.Key, Count = g.Count() })
                .OrderByDescending(x => x.Count)
                .Take(8)
                .ToListAsync();

            // Ecosystem Productivity
            var totalProjects = await _context.Projects.CountAsync();
            var totalPapers = await _context.ResearchPapers.CountAsync();
            var totalAchievements = await _context.Achievements.CountAsync();

            return Ok(new
            {
                totalUsers,
                registeredLast30,
                popularSkills,
                totalProjects,
                totalPapers,
                totalAchievements
            });
        }

        [HttpGet("reports/export")]
        public async Task<IActionResult> ExportStudentData()
        {
            var users = await _context.Users
                .GroupJoin(
                    _context.Profiles,
                    user => user.Id,
                    profile => profile.UserId,
                    (user, profiles) => new { user, profiles }
                )
                .SelectMany(
                    temp => temp.profiles.DefaultIfEmpty(),
                    (temp, profile) => new
                    {
                        temp.user.Id,
                        temp.user.RegisterNumber,
                        temp.user.FullName,
                        temp.user.Email,
                        temp.user.Department,
                        Role = temp.user.Role.ToString(),
                        IsApproved = profile != null ? profile.IsApproved : false,
                        SelectedTheme = profile != null ? profile.SelectedTheme : "Academic",
                        CreatedAt = temp.user.CreatedAt,
                        IsAlumni = profile != null ? profile.IsAlumni : false,
                        GraduationYear = profile != null ? profile.GraduationYear : null
                    }
                )
                .ToListAsync();

            var csvBuilder = new StringBuilder();
            csvBuilder.AppendLine("Id,RegisterNumber,FullName,Email,Department,Role,IsApproved,SelectedTheme,IsAlumni,GraduationYear,CreatedAt");

            foreach (var u in users)
            {
                var id = EscapeCsvField(u.Id.ToString());
                var regNum = EscapeCsvField(u.RegisterNumber);
                var fullName = EscapeCsvField(u.FullName);
                var email = EscapeCsvField(u.Email);
                var dept = EscapeCsvField(u.Department);
                var role = EscapeCsvField(u.Role);
                var isApproved = u.IsApproved ? "Yes" : "No";
                var theme = EscapeCsvField(u.SelectedTheme);
                var isAlumni = u.IsAlumni ? "Yes" : "No";
                var gradYear = u.GraduationYear.HasValue ? u.GraduationYear.Value.ToString() : "";
                var createdAt = u.CreatedAt.ToString("yyyy-MM-dd HH:mm:ss");

                csvBuilder.AppendLine($"{id},{regNum},{fullName},{email},{dept},{role},{isApproved},{theme},{isAlumni},{gradYear},{createdAt}");
            }

            var bytes = Encoding.UTF8.GetBytes(csvBuilder.ToString());
            return File(bytes, "text/csv", $"mcc_portfolios_report_{DateTime.UtcNow:yyyyMMdd}.csv");
        }

        private string EscapeCsvField(string field)
        {
            if (string.IsNullOrEmpty(field)) return "";
            if (field.Contains(",") || field.Contains("\"") || field.Contains("\n") || field.Contains("\r"))
            {
                return $"\"{field.Replace("\"", "\"\"")}\"";
            }
            return field;
        }

        // ==========================================
        // NOTIFICATION MANAGEMENT
        // ==========================================

        [HttpGet("notifications")]
        public async Task<IActionResult> GetNotifications()
        {
            var notifications = await _context.Notifications
                .GroupJoin(
                    _context.Users,
                    n => n.UserId,
                    u => u.Id,
                    (n, users) => new { n, users }
                )
                .SelectMany(
                    temp => temp.users.DefaultIfEmpty(),
                    (temp, user) => new
                    {
                        temp.n.Id,
                        temp.n.Title,
                        temp.n.Message,
                        temp.n.Type,
                        temp.n.IsRead,
                        temp.n.CreatedAt,
                        TargetUser = user != null ? user.FullName : "Broadcast (All)",
                        temp.n.UserId
                    }
                )
                .OrderByDescending(x => x.CreatedAt)
                .ToListAsync();

            return Ok(notifications);
        }

        [HttpPost("notifications")]
        public async Task<IActionResult> SendNotification([FromBody] AdminSendNotificationDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Title) || string.IsNullOrWhiteSpace(dto.Message))
            {
                return BadRequest("Title and Message are required.");
            }

            var notification = new Notification
            {
                Title = dto.Title,
                Message = dto.Message,
                Type = dto.Type ?? "Info",
                IsRead = false,
                CreatedAt = DateTime.UtcNow,
                UserId = dto.UserId > 0 ? dto.UserId : null
            };

            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync();

            return Ok(notification);
        }

        [HttpDelete("notifications/{id}")]
        public async Task<IActionResult> DeleteNotification(int id)
        {
            var notification = await _context.Notifications.FindAsync(id);
            if (notification == null)
            {
                return NotFound("Notification not found.");
            }

            _context.Notifications.Remove(notification);
            await _context.SaveChangesAsync();

            return Ok(new { success = true });
        }

        // ==========================================
        // SECURITY & AUDIT LOGS
        // ==========================================

        [HttpGet("audit-logs")]
        public async Task<IActionResult> GetAuditLogs()
        {
            if (!User.IsInRole("Admin"))
            {
                return Forbid();
            }

            var logs = await _context.AuditLogs
                .OrderByDescending(x => x.Timestamp)
                .ToListAsync();

            return Ok(logs);
        }

        // ==========================================
        // SYSTEM BACKUP & RESTORE
        // ==========================================

        [HttpGet("backup")]
        public async Task<IActionResult> DownloadBackup()
        {
            if (!User.IsInRole("Admin"))
            {
                return Forbid();
            }

            var backupData = new
            {
                Users = await _context.Users.ToListAsync(),
                Profiles = await _context.Profiles.ToListAsync(),
                Skills = await _context.Skills.ToListAsync(),
                Projects = await _context.Projects.ToListAsync(),
                Achievements = await _context.Achievements.ToListAsync(),
                Hackathons = await _context.Hackathons.ToListAsync(),
                Certifications = await _context.Certifications.ToListAsync(),
                ResearchPapers = await _context.ResearchPapers.ToListAsync(),
                Resumes = await _context.Resumes.ToListAsync(),
                InstitutionDetails = await _context.InstitutionDetails.ToListAsync(),
                Notifications = await _context.Notifications.ToListAsync(),
                ThemeConfigs = await _context.ThemeConfigs.ToListAsync(),
                AuditLogs = await _context.AuditLogs.ToListAsync(),
                AcademicRecords = await _context.AcademicRecords.ToListAsync(),
                Olympiads = await _context.Olympiads.ToListAsync(),
                StartupCompetitions = await _context.StartupCompetitions.ToListAsync(),
                NgoActivities = await _context.NgoActivities.ToListAsync(),
                SportsAchievements = await _context.SportsAchievements.ToListAsync()
            };

            await LogActionAsync("System Backup Created", "Successfully generated full system database backup file");

            return Ok(backupData);
        }

        [HttpPost("restore")]
        public async Task<IActionResult> RestoreBackup([FromBody] SystemBackupDto backup)
        {
            if (!User.IsInRole("Admin"))
            {
                return Forbid();
            }

            if (backup == null)
            {
                return BadRequest("Invalid backup payload");
            }

            try
            {
                // To avoid key constraints, truncate in correct order: dependent tables first
                _context.Skills.RemoveRange(await _context.Skills.ToListAsync());
                _context.Projects.RemoveRange(await _context.Projects.ToListAsync());
                _context.Achievements.RemoveRange(await _context.Achievements.ToListAsync());
                _context.Hackathons.RemoveRange(await _context.Hackathons.ToListAsync());
                _context.Certifications.RemoveRange(await _context.Certifications.ToListAsync());
                _context.ResearchPapers.RemoveRange(await _context.ResearchPapers.ToListAsync());
                _context.Resumes.RemoveRange(await _context.Resumes.ToListAsync());
                _context.AcademicRecords.RemoveRange(await _context.AcademicRecords.ToListAsync());
                _context.Olympiads.RemoveRange(await _context.Olympiads.ToListAsync());
                _context.StartupCompetitions.RemoveRange(await _context.StartupCompetitions.ToListAsync());
                _context.NgoActivities.RemoveRange(await _context.NgoActivities.ToListAsync());
                _context.SportsAchievements.RemoveRange(await _context.SportsAchievements.ToListAsync());
                _context.Profiles.RemoveRange(await _context.Profiles.ToListAsync());
                _context.Notifications.RemoveRange(await _context.Notifications.ToListAsync());
                _context.ThemeConfigs.RemoveRange(await _context.ThemeConfigs.ToListAsync());
                _context.InstitutionDetails.RemoveRange(await _context.InstitutionDetails.ToListAsync());
                _context.Users.RemoveRange(await _context.Users.ToListAsync());
                _context.AuditLogs.RemoveRange(await _context.AuditLogs.ToListAsync());
                
                await _context.SaveChangesAsync();

                // Restore
                if (backup.Users != null) _context.Users.AddRange(backup.Users);
                if (backup.InstitutionDetails != null) _context.InstitutionDetails.AddRange(backup.InstitutionDetails);
                if (backup.ThemeConfigs != null) _context.ThemeConfigs.AddRange(backup.ThemeConfigs);
                await _context.SaveChangesAsync(); // save users first so foreign keys are populated

                if (backup.Profiles != null) _context.Profiles.AddRange(backup.Profiles);
                if (backup.Skills != null) _context.Skills.AddRange(backup.Skills);
                if (backup.Projects != null) _context.Projects.AddRange(backup.Projects);
                if (backup.Achievements != null) _context.Achievements.AddRange(backup.Achievements);
                if (backup.Hackathons != null) _context.Hackathons.AddRange(backup.Hackathons);
                if (backup.Certifications != null) _context.Certifications.AddRange(backup.Certifications);
                if (backup.ResearchPapers != null) _context.ResearchPapers.AddRange(backup.ResearchPapers);
                if (backup.Resumes != null) _context.Resumes.AddRange(backup.Resumes);
                if (backup.AcademicRecords != null) _context.AcademicRecords.AddRange(backup.AcademicRecords);
                if (backup.Olympiads != null) _context.Olympiads.AddRange(backup.Olympiads);
                if (backup.StartupCompetitions != null) _context.StartupCompetitions.AddRange(backup.StartupCompetitions);
                if (backup.NgoActivities != null) _context.NgoActivities.AddRange(backup.NgoActivities);
                if (backup.SportsAchievements != null) _context.SportsAchievements.AddRange(backup.SportsAchievements);
                if (backup.Notifications != null) _context.Notifications.AddRange(backup.Notifications);
                if (backup.AuditLogs != null) _context.AuditLogs.AddRange(backup.AuditLogs);

                await _context.SaveChangesAsync();

                await LogActionAsync("System Restore Triggered", "Successfully restored database tables from uploaded backup file");

                return Ok(new { success = true, message = "System state restored successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Restore failed: {ex.Message}");
            }
        }
    }

    // ==========================================
    // DTO / MODEL WRAPPERS
    // ==========================================

    public class AdminUpdateStudentDto
    {
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Department { get; set; } = string.Empty;
        public string RegisterNumber { get; set; } = string.Empty;
        public string Role { get; set; } = "Student";
    }

    public class RoleUpdateModel
    {
        public string Role { get; set; } = string.Empty;
    }

    public class ThemeConfigUpdateModel
    {
        public string DisplayName { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public string PrimaryColor { get; set; } = string.Empty;
        public string SecondaryColor { get; set; } = string.Empty;
        public string FontFamily { get; set; } = string.Empty;
    }

    public class AdminSendNotificationDto
    {
        public string Title { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public string Type { get; set; } = "Broadcast"; // Info, Warning, Alert, Broadcast
        public int UserId { get; set; } // 0 or null value indicates broadcast
    }

    public class SystemBackupDto
    {
        public List<User>? Users { get; set; }
        public List<Profile>? Profiles { get; set; }
        public List<Skill>? Skills { get; set; }
        public List<Project>? Projects { get; set; }
        public List<Achievement>? Achievements { get; set; }
        public List<Hackathon>? Hackathons { get; set; }
        public List<Certification>? Certifications { get; set; }
        public List<ResearchPaper>? ResearchPapers { get; set; }
        public List<Resume>? Resumes { get; set; }
        public List<InstitutionDetail>? InstitutionDetails { get; set; }
        public List<Notification>? Notifications { get; set; }
        public List<ThemeConfig>? ThemeConfigs { get; set; }
        public List<AuditLog>? AuditLogs { get; set; }
        public List<AcademicRecord>? AcademicRecords { get; set; }
        public List<Olympiad>? Olympiads { get; set; }
        public List<StartupCompetition>? StartupCompetitions { get; set; }
        public List<NgoActivity>? NgoActivities { get; set; }
        public List<SportsAchievement>? SportsAchievements { get; set; }
    }
}