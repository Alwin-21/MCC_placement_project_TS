require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding demo student...");

  // 1. Check if user already exists
  const existingUser = await prisma.users.findFirst({
    where: { Email: "21-cs-001@mcc.edu.in" }
  });

  if (existingUser) {
    console.log("Demo student already exists. Cleaning up notifications and re-seeding clean details...");
    await prisma.notifications.deleteMany({
      where: { UserId: existingUser.Id }
    });
    await prisma.users.delete({
      where: { Id: existingUser.Id }
    });
  }

  // 2. Create Student User
  const passwordHash = bcrypt.hashSync("password123", 10);
  const user = await prisma.users.create({
    data: {
      FullName: "Alwin Joseph",
      Email: "21-cs-001@mcc.edu.in",
      Username: "alwin",
      PasswordHash: passwordHash,
      Department: "Computer Science",
      Stream: "Aided",
      RegisterNumber: "21-cs-001",
      Role: 1, // Student
      IsActive: true,
      CreatedAt: new Date(),
      ProfileImageUrl: ""
    }
  });

  console.log("Created user with ID:", user.Id);

  // 3. Create Student Profile
  const profile = await prisma.profiles.create({
    data: {
      UserId: user.Id,
      Bio: "Passionate Computer Science student at Madras Christian College with hands-on experience in full-stack web development and UI/UX design. Enthusiastic about solving real-world placement coordination challenges using modern tech stacks.",
      LinkedInUrl: "https://linkedin.com/in/alwin-joseph-mcc",
      GitHubUrl: "https://github.com/alwin-joseph",
      BehanceUrl: "https://behance.net/alwin-joseph",
      GitHubUsername: "alwin-joseph",
      TargetCareer: "Software Engineer",
      CGPA: 8.95,
      ProfileImageUrl: "",
      SelectedTheme: "Professional",
      PersonalStory: "I started coding in my freshman year, building simple websites for college departments. That grew into a love for building scalable web platforms.",
      SOP: "My goal is to secure a software engineering role in an agile development team where I can apply my Next.js, React, and database design skills.",
      IsAlumni: false,
      Phone: "9876543210",
      CurrentLocation: "Tambaram, Chennai, India",
      Languages: "English (Fluent), Tamil (Native)",
      TestScores: "GRE: 320; TOEFL: 110",
      Course: "B.Sc. Computer Science",
      YearOfStudy: "3rd Year",
      IsApproved: true // Pre-approved for instant recruiting testing
    }
  });

  // 4. Create Academic Records (Courses & Mark sheets: UG, Specialized Course, 12th, 10th)
  await prisma.academicRecords.createMany({
    data: [
      {
        UserId: user.Id,
        Degree: "Bachelor of Science in Computer Science (UG)",
        Institution: "Madras Christian College",
        FieldOfStudy: "Computer Science",
        Grade: "8.95 CGPA",
        StartYear: 2023,
        EndYear: 2026,
        AttachmentUrl: "/assets/demo_ug_marksheet.pdf"
      },
      {
        UserId: user.Id,
        Degree: "Advanced Full-Stack Engineering & System Design Course",
        Institution: "MCC Center for Continuing Education",
        FieldOfStudy: "Full-Stack Development & Cloud Architecture",
        Grade: "Distinction (92%)",
        StartYear: 2023,
        EndYear: 2024,
        AttachmentUrl: "/assets/demo_course_certificate.pdf"
      },
      {
        UserId: user.Id,
        Degree: "Higher Secondary School Certificate (12th)",
        Institution: "St. Thomas Matriculation School",
        FieldOfStudy: "Computer Science & Mathematics",
        Grade: "94.5%",
        StartYear: 2021,
        EndYear: 2023,
        AttachmentUrl: "/assets/demo_12th_marksheet.pdf"
      },
      {
        UserId: user.Id,
        Degree: "Secondary School Leaving Certificate (10th)",
        Institution: "St. Thomas Matriculation School",
        FieldOfStudy: "General Studies",
        Grade: "96.2%",
        StartYear: 2019,
        EndYear: 2021,
        AttachmentUrl: "/assets/demo_10th_marksheet.pdf"
      }
    ]
  });

  // 5. Create Experiences
  await prisma.experiences.createMany({
    data: [
      {
        UserId: user.Id,
        Company: "Chennai Tech Labs",
        Title: "Software Developer Intern",
        Location: "Chennai (Hybrid)",
        Description: "Collaborated on designing and writing REST APIs using Node.js, Express, and PostgreSQL.\nOptimized client dashboards resulting in a 20% faster load time using Next.js Turbopack.\nWorked in a 5-person Scrum team to deliver production features in weekly sprints.",
        StartDate: "2024-05-01",
        EndDate: "2024-07-31",
        IsCurrent: false,
        Category: "Full-Stack Development"
      },
      {
        UserId: user.Id,
        Company: "MCC Computer Science Association",
        Title: "Technical Lead",
        Location: "Madras Christian College",
        Description: "Overseeing development of department websites and coding hackathon registration platforms.\nMentored 15+ juniors in web technology basics, Git version control, and database modeling.",
        StartDate: "2024-08-01",
        EndDate: "",
        IsCurrent: true,
        Category: "Leadership & Community"
      }
    ]
  });

  // 6. Create Projects
  await prisma.projects.createMany({
    data: [
      {
        UserId: user.Id,
        Title: "Madras Christian College Portfolio Portal",
        Description: "An online platform built for Madras Christian College enabling students to build portfolio showcases and resume templates, while enabling placement administrators to verify profiles and extract student performance metrics.",
        Technologies: "Next.js 16, Prisma ORM, PostgreSQL, TailwindCSS",
        GithubUrl: "https://github.com/alwin-joseph/mcc-portfolio-portal",
        LiveUrl: "http://localhost:3001",
        Category: "Web Applications",
        ImageUrl: ""
      },
      {
        UserId: user.Id,
        Title: "E-Commerce Microservices Engine",
        Description: "Developed a distributed payment and inventory management microservice setup communicating over RabbitMQ event buses, backed by Redis caches and MongoDB database clusters.",
        Technologies: "Node.js, Express, RabbitMQ, MongoDB, Redis, Docker",
        GithubUrl: "https://github.com/alwin-joseph/ecommerce-engine",
        LiveUrl: "",
        Category: "Backend Infrastructure",
        ImageUrl: ""
      }
    ]
  });

  // 7. Create Skills
  await prisma.skills.createMany({
    data: [
      { UserId: user.Id, Name: "React.js / Next.js", Level: "Advanced", Category: "Frontend Frameworks" },
      { UserId: user.Id, Name: "TypeScript", Level: "Advanced", Category: "Programming Languages" },
      { UserId: user.Id, Name: "PostgreSQL & Prisma", Level: "Advanced", Category: "Databases & ORMs" },
      { UserId: user.Id, Name: "Node.js / Express", Level: "Intermediate", Category: "Backend Frameworks" },
      { UserId: user.Id, Name: "Docker & Kubernetes", Level: "Intermediate", Category: "DevOps & Tools" }
    ]
  });

  // 8. Create Certifications
  await prisma.certifications.createMany({
    data: [
      {
        UserId: user.Id,
        Title: "AWS Certified Developer – Associate",
        Issuer: "Amazon Web Services (AWS)",
        IssueDate: new Date("2024-11-20"),
        CertificateUrl: ""
      },
      {
        UserId: user.Id,
        Title: "Meta Full-Stack Developer Certificate",
        Issuer: "Coursera / Meta",
        IssueDate: new Date("2024-04-10"),
        CertificateUrl: ""
      }
    ]
  });

  // 9. Create Achievements
  await prisma.achievements.create({
    data: {
      UserId: user.Id,
      Title: "Winner - National College Hackathon 2024",
      Description: "Awarded 1st place out of 100+ competing teams for engineering an automated student audit logging tracking app in 24 hours.",
      AchievementDate: new Date("2024-09-05"),
      AchievementUrl: "",
      Category: "Hackathons"
    }
  });

  // 10. Create SavedResumes draft
  const resume = await prisma.savedResumes.create({
    data: {
      UserId: user.Id,
      ResumeTitle: "Alwin Joseph - Software Developer Resume",
      SelectedTheme: "Professional",
      AccentColor: "#1e3a8a",
      ResumeDataJson: "{}",
      CreatedAt: new Date(),
      UpdatedAt: new Date()
    }
  });

  console.log("Created Resume draft with ID:", resume.Id);
  console.log("DEMO STUDENT SEEDED SUCCESSFULLY!");
}

main()
  .catch((e) => {
    console.error("Error seeding data:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
