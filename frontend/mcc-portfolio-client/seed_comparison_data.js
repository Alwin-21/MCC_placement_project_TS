require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set in environment.");
  process.exit(1);
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding comparison data (Jobs and MCA Student)...");

  // 1. Get or create a verified company to post jobs
  let company = await prisma.company.findFirst({
    where: { Status: "Verified" }
  });

  if (!company) {
    console.log("No verified company found. Creating 'TechCorp International'...");
    company = await prisma.company.create({
      data: {
        Name: "TechCorp International",
        Email: "careers@techcorp.com",
        Status: "Verified",
        CreatedAt: new Date(),
      }
    });

    // Create a corresponding profile
    await prisma.profiles.create({
      data: {
        UserId: 0, // Dummy
        Bio: "A global leader in tech consulting and financial software.",
        Website: "https://techcorp.com",
        Industry: "Information Technology",
        CompanyType: "Public Limited",
        CompanySize: "1000+",
        FoundedYear: 2005,
        Description: "Global engineering solutions.",
        ProfileImageUrl: "",
        SelectedTheme: "Professional",
        IsApproved: true,
      }
    });
  }
  console.log(`Using company: '${company.Name}' (ID: ${company.Id})`);

  // 2. Create MCA Student (Rohit Kumar)
  const mcaEmail = "21-ca-012@mcc.edu.in";
  const existingMca = await prisma.users.findFirst({
    where: { Email: mcaEmail }
  });

  if (existingMca) {
    console.log("Existing MCA student found. Cleaning up old records...");
    await prisma.notifications.deleteMany({ where: { UserId: existingMca.Id } });
    await prisma.skills.deleteMany({ where: { UserId: existingMca.Id } });
    await prisma.projects.deleteMany({ where: { UserId: existingMca.Id } });
    await prisma.experiences.deleteMany({ where: { UserId: existingMca.Id } });
    await prisma.academicRecords.deleteMany({ where: { UserId: existingMca.Id } });
    await prisma.certifications.deleteMany({ where: { UserId: existingMca.Id } });
    await prisma.profiles.deleteMany({ where: { UserId: existingMca.Id } });
    await prisma.users.delete({ where: { Id: existingMca.Id } });
  }

  const passwordHash = bcrypt.hashSync("password123", 10);
  const mcaUser = await prisma.users.create({
    data: {
      FullName: "Rohit Kumar",
      Email: mcaEmail,
      Username: "rohit_mca",
      PasswordHash: passwordHash,
      Department: "MCA",
      Stream: "Self-Financed",
      RegisterNumber: "21-ca-012",
      Role: 1, // Student
      IsActive: true,
      CreatedAt: new Date(),
      ProfileImageUrl: "",
    }
  });
  console.log(`Created MCA user: ${mcaUser.FullName} (ID: ${mcaUser.Id})`);

  // Create Profile for Rohit
  await prisma.profiles.create({
    data: {
      UserId: mcaUser.Id,
      Bio: "MCA graduate specializing in backend development, Java Spring Boot ecosystem, React interfaces, and MySQL database performance.",
      LinkedInUrl: "https://linkedin.com/in/rohit-kumar-mca",
      GitHubUrl: "https://github.com/rohitkumar-mca",
      TargetCareer: "Software Engineer",
      CGPA: 8.8,
      SelectedTheme: "Classic",
      Course: "Master of Computer Applications (MCA)",
      YearOfStudy: "2nd Year",
      IsApproved: true,
      Phone: "9876543233",
      CurrentLocation: "Madras, Chennai, India",
      Languages: "English, Hindi",
      PersonalStory: "Discovered a passion for architecture design during system development classes.",
      SOP: "Seeking a software developer role in a team working on enterprise web applications.",
      ProfileImageUrl: "",
      BehanceUrl: "",
      GitHubUsername: "",
      IsAlumni: false,
      TestScores: "",
    }
  });

  // Create Skills for Rohit
  await prisma.skills.createMany({
    data: [
      { UserId: mcaUser.Id, Name: "Java", Level: "Advanced", Category: "Programming Languages" },
      { UserId: mcaUser.Id, Name: "Spring Boot", Level: "Intermediate", Category: "Backend Frameworks" },
      { UserId: mcaUser.Id, Name: "React.js", Level: "Intermediate", Category: "Frontend Frameworks" },
      { UserId: mcaUser.Id, Name: "SQL", Level: "Advanced", Category: "Databases" }
    ]
  });

  // 3. Create Commerce Job posting (Financial Analyst Associate)
  // Let's check for any existing job with the same title to avoid duplicate confusion
  await prisma.jobPosting.deleteMany({
    where: {
      CompanyId: company.Id,
      Title: "Financial Analyst Associate"
    }
  });

  const commerceJob = await prisma.jobPosting.create({
    data: {
      CompanyId: company.Id,
      Title: "Financial Analyst Associate",
      Department: "Commerce",
      Description: "Perform corporate financial analysis, assist in tax reporting, check compliance workflows, and prepare financial dashboards.",
      Responsibilities: "Prepare cash flow statements.\nPerform ledger matches and coordinate inputs for GST compliance reporting.\nCollaborate on weekly budgeting summaries.",
      Requirements: "Proficiency in Advanced Excel (modeling, lookups, pivots).\nHands-on experience with Tally Prime or SAP.\nExcellent analytical and math capabilities.",
      RequiredSkills: "Tally Prime;Excel Modeling;Financial Analysis",
      PreferredSkills: "GST Filing;Power BI",
      JobType: "FullTime",
      WorkMode: "OnSite",
      EligibilityDepartments: "Commerce",
      EligibilityYears: "2026",
      EligibilityMinCGPA: 8.0,
      EligibilityExperience: "Freshers",
      Vacancies: 2,
      Salary: "6 LPA",
      LPA: 6.0,
      Benefits: "Health insurance, performance bonus",
      SelectionProcess: "Aptitude screening followed by technical interview and HR round.",
      Deadlines: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days out
      Status: "Approved",
    }
  });
  console.log(`Created Job: ${commerceJob.Title} (ID: ${commerceJob.Id})`);

  // 4. Create MCA Job posting (Associate Software Engineer)
  await prisma.jobPosting.deleteMany({
    where: {
      CompanyId: company.Id,
      Title: "Associate Software Engineer"
    }
  });

  const mcaJob = await prisma.jobPosting.create({
    data: {
      CompanyId: company.Id,
      Title: "Associate Software Engineer",
      Department: "MCA",
      Description: "Work on developing core backend services in Java Spring Boot and UI interfaces in React.js. Maintain schema migrations and write unit tests.",
      Responsibilities: "Develop scalable backend REST endpoints.\nIntegrate visual user components with server-side logic.\nWrite database procedures and optimize raw SQL queries.",
      Requirements: "Solid OOP fundamentals in Java.\nFamiliarity with modern React components.\nBasic query optimization knowledge.",
      RequiredSkills: "Java;Spring Boot;React.js;SQL",
      PreferredSkills: "TypeScript;Docker",
      JobType: "FullTime",
      WorkMode: "Hybrid",
      EligibilityDepartments: "MCA;Computer Science",
      EligibilityYears: "2026",
      EligibilityMinCGPA: 7.5,
      EligibilityExperience: "Freshers",
      Vacancies: 3,
      Salary: "8 LPA",
      LPA: 8.0,
      Benefits: "Internet allowance, wellness stipend",
      SelectionProcess: "Online assessment, technical screening, system design session.",
      Deadlines: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      Status: "Approved",
    }
  });
  console.log(`Created Job: ${mcaJob.Title} (ID: ${mcaJob.Id})`);

  console.log("Successfully seeded comparison dataset!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Seeding comparison failed:", err);
  process.exit(1);
});
