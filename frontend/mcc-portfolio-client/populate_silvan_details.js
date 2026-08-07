require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set in environment.");
  process.exit(1);
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Populating detailed information for user 'silvan'...");

  const existingUser = await prisma.users.findFirst({
    where: { Username: "silvan" }
  });

  if (!existingUser) {
    console.error("User 'silvan' not found!");
    process.exit(1);
  }

  const userId = existingUser.Id;

  // 1. Update Profile details
  await prisma.profiles.updateMany({
    where: { UserId: userId },
    data: {
      Bio: "Passionate Full-Stack Developer & AI Enthusiast with experience building modern web applications, REST APIs, and mobile solutions. Active open-source contributor and competitive programmer.",
      LinkedInUrl: "https://linkedin.com/in/silvan-dev",
      GitHubUrl: "https://github.com/silvan-dev",
      BehanceUrl: "https://behance.net/silvan-design",
      GitHubUsername: "silvan-dev",
      TargetCareer: "Full Stack Software Engineer",
      CGPA: 8.95,
      SelectedTheme: "Modern",
      Course: "B.Sc. Computer Science",
      YearOfStudy: "3rd Year",
      IsApproved: true,
      Phone: "+91 9876543210",
      CurrentLocation: "Chennai, Tamil Nadu, India",
      Languages: "English (Professional), Tamil (Native), German (Beginner)",
      PersonalStory: "Discovered programming in high school by building custom web tools. Since joining MCC, I have focused on scalable cloud applications, database design, and UI/UX design systems.",
      SOP: "Eager to contribute as a Software Engineering Intern/Associate where I can solve complex system architecture challenges and build user-centric software applications.",
      ProfileImageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
      TestScores: "GRE: 320/340, TOEFL: 108/120, LeetCode Rating: 1750",
      CurrentCompany: "Tech Innovators Lab",
      CurrentJobTitle: "Full-Stack Intern",
      IsAlumni: false,
    }
  });

  // 2. Clean up existing child records if re-running
  await prisma.academicRecords.deleteMany({ where: { UserId: userId } });
  await prisma.experiences.deleteMany({ where: { UserId: userId } });
  await prisma.projects.deleteMany({ where: { UserId: userId } });
  await prisma.skills.deleteMany({ where: { UserId: userId } });
  await prisma.certifications.deleteMany({ where: { UserId: userId } });
  await prisma.achievements.deleteMany({ where: { UserId: userId } });
  await prisma.hackathons.deleteMany({ where: { UserId: userId } });
  await prisma.researchPapers.deleteMany({ where: { UserId: userId } });
  await prisma.communityServices.deleteMany({ where: { UserId: userId } });
  await prisma.sportsAchievements.deleteMany({ where: { UserId: userId } });

  // 3. Academic Records
  await prisma.academicRecords.createMany({
    data: [
      {
        UserId: userId,
        Degree: "Bachelor of Science (B.Sc.)",
        Institution: "Madras Christian College (MCC)",
        FieldOfStudy: "Computer Science",
        Grade: "8.95 CGPA",
        StartYear: 2023,
        EndYear: 2026,
        AttachmentUrl: "/assets/silvan_bsc_transcript.pdf"
      },
      {
        UserId: userId,
        Degree: "Higher Secondary Certificate (12th)",
        Institution: "St. John's Higher Secondary School",
        FieldOfStudy: "Computer Science & Mathematics",
        Grade: "96.2%",
        StartYear: 2021,
        EndYear: 2023,
        AttachmentUrl: "/assets/silvan_12th_board.pdf"
      }
    ]
  });

  // 4. Experiences
  await prisma.experiences.createMany({
    data: [
      {
        UserId: userId,
        Company: "Tech Innovators Lab",
        Title: "Full-Stack Developer Intern",
        Location: "Chennai, India",
        Description: "Developed microservices using Node.js, Express, and PostgreSQL.\nBuilt responsive React/Next.js frontend user dashboards with custom TailwindCSS components.\nImplemented JWT authentication and RBAC for over 10,000 active monthly users.",
        StartDate: "2024-06-01",
        EndDate: "2024-11-30",
        IsCurrent: false,
        Category: "Software Engineering"
      },
      {
        UserId: userId,
        Company: "MCC Coding Club",
        Title: "Lead Frontend Engineer & Mentor",
        Location: "MCC Campus, Chennai",
        Description: "Led a team of 6 student developers building the annual Hackathon portal.\nOrganized workshops on React, TypeScript, and Git fundamentals for 150+ juniors.",
        StartDate: "2024-01-15",
        EndDate: "Present",
        IsCurrent: true,
        Category: "Leadership & Community"
      }
    ]
  });

  // 5. Projects
  await prisma.projects.createMany({
    data: [
      {
        UserId: userId,
        Title: "Smart Campus Placement & Portfolio Portal",
        Description: "A modern Next.js 16 placement management system featuring AI resume parser, automated risk-engine proctoring, and comprehensive analytics for students and recruiters.",
        Technologies: "Next.js, TypeScript, PostgreSQL, Prisma, TailwindCSS, Docker",
        GithubUrl: "https://github.com/silvan-dev/mcc-placement-portal",
        LiveUrl: "https://mcc-placement.example.com",
        Category: "Web Application",
        ImageUrl: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=80",
        DemoVideoUrl: "https://youtube.com/watch?v=demo-silvan-portal"
      },
      {
        UserId: userId,
        Title: "AI Automated Exam Proctoring Engine",
        Description: "Real-time browser-based proctoring system using webcam motion detection, audio levels, tab switch tracking, and anti-malpractice risk scoring.",
        Technologies: "React, WebRTC, TensorFlow.js, Node.js, Socket.IO",
        GithubUrl: "https://github.com/silvan-dev/ai-proctoring-engine",
        LiveUrl: "",
        Category: "Artificial Intelligence / Security",
        ImageUrl: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=80",
        DemoVideoUrl: ""
      },
      {
        UserId: userId,
        Title: "DevPulse - Real-time Developer Analytics Dashboard",
        Description: "SaaS platform for engineering managers to visualize GitHub velocity, PR lead time, and team code health metrics.",
        Technologies: "TypeScript, GraphQL, Next.js, Chart.js, PostgreSQL",
        GithubUrl: "https://github.com/silvan-dev/devpulse-analytics",
        LiveUrl: "https://devpulse-demo.vercel.app",
        Category: "SaaS / Developer Tools",
        ImageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&auto=format&fit=crop&q=80",
        DemoVideoUrl: ""
      }
    ]
  });

  // 6. Skills
  await prisma.skills.createMany({
    data: [
      { UserId: userId, Name: "TypeScript / JavaScript", Level: "Advanced", Category: "Programming Languages" },
      { UserId: userId, Name: "Next.js / React", Level: "Advanced", Category: "Frontend Frameworks" },
      { UserId: userId, Name: "Node.js / Express", Level: "Advanced", Category: "Backend Frameworks" },
      { UserId: userId, Name: "PostgreSQL & Prisma", Level: "Advanced", Category: "Databases" },
      { UserId: userId, Name: "Python & Data Structures", Level: "Intermediate", Category: "Programming Languages" },
      { UserId: userId, Name: "Docker & CI/CD Pipelines", Level: "Intermediate", Category: "DevOps & Tools" },
      { UserId: userId, Name: "Git / GitHub Workflow", Level: "Advanced", Category: "DevOps & Tools" },
      { UserId: userId, Name: "REST APIs & GraphQL", Level: "Advanced", Category: "System Architecture" },
      { UserId: userId, Name: "TailwindCSS / UI Design", Level: "Advanced", Category: "Frontend Frameworks" },
      { UserId: userId, Name: "Agile / Scrum Methodology", Level: "Intermediate", Category: "Soft Skills" }
    ]
  });

  // 7. Certifications
  await prisma.certifications.createMany({
    data: [
      {
        UserId: userId,
        Title: "AWS Certified Developer – Associate",
        Issuer: "Amazon Web Services (AWS)",
        IssueDate: new Date("2024-08-10"),
        CertificateUrl: "https://aws.amazon.com/verification/silvan-dev-assoc",
        Category: "Cloud Computing"
      },
      {
        UserId: userId,
        Title: "Meta Front-End Developer Professional Certificate",
        Issuer: "Coursera / Meta",
        IssueDate: new Date("2024-02-18"),
        CertificateUrl: "https://coursera.org/verify/professional-cert/silvan-meta",
        Category: "Web Development"
      },
      {
        UserId: userId,
        Title: "PostgreSQL Developer & Administrator Certification",
        Issuer: "EnterpriseDB",
        IssueDate: new Date("2023-11-05"),
        CertificateUrl: "https://enterprisedb.com/verify/silvan-pg",
        Category: "Database Engineering"
      }
    ]
  });

  // 8. Achievements
  await prisma.achievements.createMany({
    data: [
      {
        UserId: userId,
        Title: "1st Place - Smart India Hackathon (College Level)",
        Description: "Built a smart disaster response tracking application using real-time geolocation.",
        AchievementUrl: "https://mcc.edu.in/achievements/sih-2024",
        AchievementDate: new Date("2024-09-20"),
        Category: "Competition"
      },
      {
        UserId: userId,
        Title: "Department Topper & Merit Scholarship Awardee",
        Description: "Awarded academic excellence scholarship for consecutive semesters in B.Sc. Computer Science.",
        AchievementUrl: "",
        AchievementDate: new Date("2024-04-12"),
        Category: "Academic"
      }
    ]
  });

  // 9. Hackathons
  await prisma.hackathons.createMany({
    data: [
      {
        UserId: userId,
        Title: "HackChennai 2024",
        Organizer: "IIT Madras Tech Society",
        Description: "Built an AI-driven accessibility tool for vision-impaired web navigation.",
        ProjectName: "VisionAssist Web",
        HackathonUrl: "https://hackchennai2024.devpost.com",
        EventDate: new Date("2024-10-14"),
        CertificateUrl: "/assets/hackchennai_cert.pdf"
      }
    ]
  });

  // 10. Research Papers
  await prisma.researchPapers.createMany({
    data: [
      {
        UserId: userId,
        Title: "Optimizing Real-Time Web Proctoring Algorithms via Edge Computing",
        Abstract: "This paper introduces a lightweight client-side risk assessment heuristic that reduces server processing latency during online university assessments by 65%.",
        Conference: "National Conference on Recent Trends in Computing (NCRTC 2024)",
        PaperUrl: "https://doi.org/10.1007/silvan-proctoring-2024",
        PublishedDate: new Date("2024-12-01"),
        Category: "Computer Security & EdTech"
      }
    ]
  });

  // 11. Community Services
  await prisma.communityServices.createMany({
    data: [
      {
        UserId: userId,
        Title: "Digital Literacy Campaign Volunteer",
        Organization: "MCC NSS Unit",
        Description: "Taught basic computer operations, internet safety, and digital banking to 80+ senior citizens in East Tambaram.",
        HoursServed: 45.0,
        Date: new Date("2024-03-15"),
        AttachmentUrl: "/assets/nss_certificate.pdf"
      }
    ]
  });

  // 12. Sports Achievements
  await prisma.sportsAchievements.createMany({
    data: [
      {
        UserId: userId,
        SportName: "Chess",
        Level: "Inter-College Tournament",
        Achievement: "Runner-Up (Board 2)",
        Description: "Represented MCC Computer Science department in annual inter-departmental sports meet.",
        Date: new Date("2024-02-22"),
        CertificateUrl: "/assets/chess_certificate.pdf"
      }
    ]
  });

  console.log("Successfully populated all details for user Silvan!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Failed to populate user details:", err);
  process.exit(1);
});
