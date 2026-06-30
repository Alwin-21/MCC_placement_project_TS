using System;
using System.Collections.Generic;
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
    [Authorize]
    public class AIController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public AIController(ApplicationDbContext context)
        {
            _context = context;
        }

        // ==========================================
        // DTOs
        // ==========================================
        public class SopRequestDto
        {
            public string TargetPath { get; set; } = string.Empty;
            public string Tone { get; set; } = "Academic"; // Academic, Corporate, Startup
        }

        // ==========================================
        // 1. DYNAMIC AI SOP GENERATOR
        // ==========================================
        [HttpPost("generate-sop")]
        public async Task<IActionResult> GenerateSop([FromBody] SopRequestDto dto)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userIdStr == null) return Unauthorized();
            int userId = int.Parse(userIdStr);

            var user = await _context.Users.FindAsync(userId);
            if (user == null) return NotFound("User not found.");

            var profile = await _context.Profiles.FirstOrDefaultAsync(p => p.UserId == userId);
            var skills = await _context.Skills.Where(s => s.UserId == userId).ToListAsync();
            var projects = await _context.Projects.Where(p => p.UserId == userId).ToListAsync();
            var achievements = await _context.Achievements.Where(a => a.UserId == userId).ToListAsync();
            var publications = await _context.ResearchPapers.Where(r => r.UserId == userId).ToListAsync();
            var certs = await _context.Certifications.Where(c => c.UserId == userId).ToListAsync();

            var skillsCsv = skills.Any() ? string.Join(", ", skills.Select(s => s.Name)) : "core technologies";
            var projectsCsv = projects.Any() ? string.Join(", ", projects.Select(p => p.Title)) : "several technical implementations";
            var certsCsv = certs.Any() ? string.Join(", ", certs.Select(c => c.Title)) : "professional certifications";
            
            var cgpaText = profile != null && profile.CGPA > 0 ? $"carrying a cumulative grade point average of {profile.CGPA:F2}/10.0" : "";
            var targetCareerText = profile != null && !string.IsNullOrEmpty(profile.TargetCareer) ? profile.TargetCareer : (dto.TargetPath ?? "my chosen career path");
            var dept = string.IsNullOrEmpty(user.Department) ? "my department" : user.Department;

            string header = "STATEMENT OF PURPOSE";
            string opening = $"I am writing to express my strong candidacy for opportunities in {targetCareerText}. As a dedicated student of {dept} at Madras Christian College {cgpaText}, I have developed a robust academic foundation coupled with practical experience that matches the demands of this challenging domain.";
            
            string middle = $"Throughout my study at Madras Christian College, I have cultivated hands-on competencies in {skillsCsv}. I consolidated these skills by engineering projects like {projectsCsv}. Additionally, my drive to learn is represented by credentials in {certsCsv}.";
            
            if (publications.Any())
            {
                middle += $" Driven by scientific curiosity, I authored the research publication '{publications.First().Title}' presented at {publications.First().Conference}, showing my ability to perform rigorous analysis.";
            }

            string closing = $"Looking forward, I intend to apply the academic discipline and innovative spirit I acquired at Madras Christian College to make high-impact contributions. I am confident that my technical skills and proactive mindset prepare me well for success.";

            if (dto.Tone == "Corporate")
            {
                header = "PROFESSIONAL CAREER STATEMENT";
                opening = $"Dear Hiring Manager, I am applying for positions in {targetCareerText} that leverage my training in {dept} from Madras Christian College. My objective is to bring structured problem-solving and rapid software delivery capabilities to your organization.";
                middle = $"In my tenure at MCC, I acquired expertise in industry-standard stacks, notably {skillsCsv}. I built production-like solutions, including {projectsCsv}, focusing on clean architecture and optimization. My training is supplemented by certified proficiency in {certsCsv}.";
                closing = $"I am excited to join an agile corporate team where I can apply my dedication to clean code, collaboration, and performance metrics. Thank you for your consideration.";
            }
            else if (dto.Tone == "Startup")
            {
                header = "FOUNDER / INNOVATOR MANIFESTO";
                opening = $"To the Startup Team, I want to deploy my technical drive in {targetCareerText}. As a builder studying {dept} at Madras Christian College, I specialize in rapid prototyping and zero-to-one engineering.";
                middle = $"I thrive on building things. My technical arsenal covers {skillsCsv}. I have designed and deployed products like {projectsCsv}, proving my ability to ship fast and adapt under pressure. I hold certifications in {certsCsv}.";
                closing = $"I want to join a team that moves fast, breaks boundaries, and shapes the future. I am ready to work hard and contribute code from day one.";
            }

            string sopText = $"{header}\n\nDear Admissions / Recruitment Panel,\n\n{opening}\n\n{middle}\n\n{closing}\n\nSincerely,\n{user.FullName}\nMadras Christian College";

            return Ok(new { sop = sopText });
        }

        // ==========================================
        // 2. CAREER ANALYTICS & SKILL GAP ANALYSIS
        // ==========================================
        [HttpGet("career-analysis")]
        public async Task<IActionResult> GetCareerAnalysis()
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userIdStr == null) return Unauthorized();
            int userId = int.Parse(userIdStr);

            var user = await _context.Users.FindAsync(userId);
            if (user == null) return NotFound("User not found.");

            var profile = await _context.Profiles.FirstOrDefaultAsync(p => p.UserId == userId);
            var skills = await _context.Skills.Where(s => s.UserId == userId).ToListAsync();
            var projects = await _context.Projects.Where(p => p.UserId == userId).ToListAsync();
            var achievements = await _context.Achievements.Where(a => a.UserId == userId).ToListAsync();
            var publications = await _context.ResearchPapers.Where(r => r.UserId == userId).ToListAsync();
            var hackathons = await _context.Hackathons.Where(h => h.UserId == userId).ToListAsync();
            var certs = await _context.Certifications.Where(c => c.UserId == userId).ToListAsync();
            var resumes = await _context.Resumes.Where(r => r.UserId == userId).ToListAsync();

            // 1. Calculate Profile Completeness Score (max 100)
            int score = 20; // base register
            if (profile != null)
            {
                if (!string.IsNullOrEmpty(profile.Bio)) score += 15;
                if (!string.IsNullOrEmpty(profile.ProfileImageUrl)) score += 15;
                if (!string.IsNullOrEmpty(profile.LinkedInUrl)) score += 10;
                if (!string.IsNullOrEmpty(profile.GitHubUrl)) score += 10;
            }
            if (skills.Count >= 3) score += 10;
            else if (skills.Count > 0) score += 5;

            if (projects.Count >= 2) score += 10;
            else if (projects.Count > 0) score += 5;

            if (resumes.Any()) score += 10;

            // 2. Skill Gap Analysis
            string targetCareer = profile?.TargetCareer ?? "Full-Stack Developer";
            var standardCareerRequirements = new Dictionary<string, List<string>>(StringComparer.OrdinalIgnoreCase)
            {
                { "Full-Stack Developer", new List<string> { "React", "NodeJS", "JavaScript", "HTML", "CSS", "SQL", "Git", "REST API" } },
                { "Data Scientist", new List<string> { "Python", "SQL", "Machine Learning", "Pandas", "Statistics", "Data Visualization", "TensorFlow" } },
                { "AI Researcher / ML Engineer", new List<string> { "Python", "PyTorch", "TensorFlow", "Deep Learning", "Algorithms", "Mathematics", "Git" } },
                { "Product Manager", new List<string> { "Product Strategy", "Agile", "User Research", "Wireframing", "Roadmapping", "Data Analytics" } },
                { "Cloud Engineer / DevOps", new List<string> { "Docker", "Kubernetes", "AWS", "CI/CD", "Linux", "Git", "Bash", "Terraform" } }
            };

            // Find best career mapping match or fall back to Full-Stack Developer
            string matchedKey = standardCareerRequirements.Keys.FirstOrDefault(k => k.Contains(targetCareer, StringComparison.OrdinalIgnoreCase)) ?? "Full-Stack Developer";
            var requiredSkills = standardCareerRequirements[matchedKey];
            
            var studentSkillsSet = new HashSet<string>(skills.Select(s => s.Name.Trim()), StringComparer.OrdinalIgnoreCase);
            var matchedSkills = requiredSkills.Where(req => studentSkillsSet.Contains(req)).ToList();
            var missingSkills = requiredSkills.Where(req => !studentSkillsSet.Contains(req)).ToList();
            
            double skillMatchPercentage = requiredSkills.Count > 0 
                ? (double)matchedSkills.Count / requiredSkills.Count * 100 
                : 0.0;

            // 3. Internship Matches
            var internships = new List<object>
            {
                new { Company = "Zoho Corporation", Role = "Product Developer Intern", Location = "Chennai", Description = "Focus on backend modules, database design, and cloud scalability.", MatchReason = "Great fit for your C# & SQL skills." },
                new { Company = "Freshworks", Role = "Associate Software Engineer", Location = "Chennai", Description = "Focus on building modern web apps, JavaScript architectures, and APIs.", MatchReason = "Perfect match for your frontend credentials." },
                new { Company = "Microsoft India", Role = "Software Engineer Intern", Location = "Hyderabad", Description = "Deep dive into cloud platforms (Azure), developer tools, and system performance.", MatchReason = "Elite role matching your high cgpa and publications." }
            };

            // 4. University Recommendations
            double cgpa = profile?.CGPA ?? 0.0;
            var universities = new List<object>();
            if (cgpa >= 8.5 || publications.Any())
            {
                universities.Add(new { Name = "Carnegie Mellon University", Country = "USA", Program = "MS in Software Engineering", Details = "Top technical match for advanced system designs." });
                universities.Add(new { Name = "University of Edinburgh", Country = "UK", Program = "MSc in Artificial Intelligence", Details = "Scholarly publications fit Edinburgh AI Lab guidelines." });
                universities.Add(new { Name = "National University of Singapore", Country = "Singapore", Program = "Master of Computing", Details = "Focus on enterprise systems and ML architectures." });
            }
            else
            {
                universities.Add(new { Name = "Arizona State University", Country = "USA", Program = "MS in Computer Science", Details = "Great curriculum matching software development stacks." });
                universities.Add(new { Name = "University of Texas at Dallas", Country = "USA", Program = "MS in Software Engineering", Details = "Very strong placement statistics for engineers." });
                universities.Add(new { Name = "BITS Pilani", Country = "India", Program = "M.Tech in Software Systems", Details = "Premier Indian higher education program with industry tie-ups." });
            }

            // 5. Scholarship Suggestions
            var scholarships = new List<object>
            {
                new { Title = "Erasmus Mundus Scholarship", Amount = "100% Fully Funded", Eligible = publications.Any() || cgpa >= 8.0, Details = "Joint postgraduate programs across the European Union." },
                new { Title = "MCC Incubation Grant", Amount = "Up to ₹2,00,000", Eligible = projects.Any(), Details = "Offered by MCC Entrepreneurship cell for prototype development." },
                new { Title = "Rhodes Scholarship", Amount = "Fully Funded Oxford Tuition", Eligible = cgpa >= 9.0, Details = "Prestigious scholarship for leadership and academic excellence." }
            };

            // 6. Actionable Resume Suggestions
            var resumeSuggestions = new List<string>();
            if (!resumes.Any())
            {
                resumeSuggestions.Add("Upload a professional resume in PDF format to enable placement matchmaking.");
            }
            else
            {
                resumeSuggestions.Add($"Highlight your key technical skills (currently {skills.Count} listed) clearly at the top of your resume.");
                if (projects.Any())
                {
                    resumeSuggestions.Add($"Include clickable hyperlinks to your {projects.Count} projects (e.g., GitHub links) to demonstrate practical coding skills.");
                }
                if (cgpa >= 8.0)
                {
                    resumeSuggestions.Add($"Since you have a strong CGPA of {cgpa:F2}/10.0, feature this in your resume header or education section.");
                }
                if (publications.Any())
                {
                    resumeSuggestions.Add($"Include your academic research publication '{publications.First().Title}' in a dedicated Publications section.");
                }
            }

            // 7. Actionable Portfolio Improvement Suggestions
            var portfolioImprovementSuggestions = new List<string>();
            if (profile == null || string.IsNullOrEmpty(profile.Bio))
            {
                portfolioImprovementSuggestions.Add("Write a personal story or bio in your dashboard to help recruiters understand your background.");
            }
            if (profile == null || string.IsNullOrEmpty(profile.ProfileImageUrl))
            {
                portfolioImprovementSuggestions.Add("Upload a professional profile photo to personalize your public portfolio page.");
            }
            if (profile == null || (string.IsNullOrEmpty(profile.LinkedInUrl) && string.IsNullOrEmpty(profile.GitHubUrl)))
            {
                portfolioImprovementSuggestions.Add("Connect your LinkedIn or GitHub accounts to build web presence and trust.");
            }
            if (profile != null && string.IsNullOrEmpty(profile.BehanceUrl) && user.Department?.Contains("Design", StringComparison.OrdinalIgnoreCase) == true)
            {
                portfolioImprovementSuggestions.Add("Add a Behance username link to showcase your creative and UI design portfolios.");
            }
            if (projects.Count < 2)
            {
                portfolioImprovementSuggestions.Add($"Add at least {2 - projects.Count} more real-world projects with source code repositories or live demonstration links.");
            }
            if (!certs.Any())
            {
                portfolioImprovementSuggestions.Add("Upload professional certifications (e.g. cloud, development, or database credentials) to validate your capabilities.");
            }
            if (!achievements.Any())
            {
                portfolioImprovementSuggestions.Add("Add achievements (e.g., NGO / Community Service, Sports, Olympiads, Startup Competitions) to highlight leadership and extracurricular involvement.");
            }
            if (!hackathons.Any())
            {
                portfolioImprovementSuggestions.Add("Participate in and add Hackathons to demonstrate teamwork, fast execution, and problem solving.");
            }

            var careerRecommendations = new List<object>();
            foreach (var kvp in standardCareerRequirements)
            {
                var reqSkills = kvp.Value;
                var matches = reqSkills.Where(req => studentSkillsSet.Contains(req)).ToList();
                var missing = kvp.Value.Where(req => !studentSkillsSet.Contains(req)).ToList();
                double matchPct = reqSkills.Count > 0 ? (double)matches.Count / reqSkills.Count * 100 : 0.0;

                careerRecommendations.Add(new
                {
                    career = kvp.Key,
                    matchPercentage = Math.Round(matchPct, 1),
                    matchedSkills = matches,
                    missingSkills = missing
                });
            }
            careerRecommendations = careerRecommendations
                .OrderByDescending(c => ((dynamic)c).matchPercentage)
                .ToList();

            return Ok(new
            {
                profileCompleteness = score,
                targetCareer = matchedKey,
                skillMatchPercentage = Math.Round(skillMatchPercentage, 1),
                matchedSkills,
                missingSkills,
                internships,
                universities,
                scholarships,
                resumeSuggestions,
                portfolioImprovementSuggestions,
                careerRecommendations
            });
        }
    }
}
