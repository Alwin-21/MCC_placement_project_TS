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
  console.log("Seeding test student for Commerce/Finance...");

  const email = "21-co-055@mcc.edu.in";

  // 1. Cleanup existing test student if any
  const existingUser = await prisma.users.findFirst({
    where: { Email: email }
  });

  if (existingUser) {
    console.log("Existing test Commerce student found. Cleaning up old records...");
    await prisma.notifications.deleteMany({ where: { UserId: existingUser.Id } });
    await prisma.skills.deleteMany({ where: { UserId: existingUser.Id } });
    await prisma.projects.deleteMany({ where: { UserId: existingUser.Id } });
    await prisma.experiences.deleteMany({ where: { UserId: existingUser.Id } });
    await prisma.academicRecords.deleteMany({ where: { UserId: existingUser.Id } });
    await prisma.certifications.deleteMany({ where: { UserId: existingUser.Id } });
    await prisma.profiles.deleteMany({ where: { UserId: existingUser.Id } });
    await prisma.users.delete({ where: { Id: existingUser.Id } });
  }

  // 2. Create User
  const passwordHash = bcrypt.hashSync("password123", 10);
  const user = await prisma.users.create({
    data: {
      FullName: "Priya Sharma",
      Email: email,
      Username: "priya_finance",
      PasswordHash: passwordHash,
      Department: "Commerce",
      Stream: "Aided",
      RegisterNumber: "21-co-055",
      Role: 1, // Student
      IsActive: true,
      CreatedAt: new Date(),
      ProfileImageUrl: "",
    }
  });

  console.log(`Created user Priya Sharma (ID: ${user.Id})`);

  // 3. Create Profile
  await prisma.profiles.create({
    data: {
      UserId: user.Id,
      Bio: "Aspiring financial analyst and tax consultant. Proficient in Tally Prime, SAP FICO, GST filings, corporate financial analysis, and Excel modeling.",
      LinkedInUrl: "https://linkedin.com/in/priya-sharma-finance",
      GitHubUrl: "https://github.com/priyasharma-finance",
      TargetCareer: "Financial Analyst",
      CGPA: 9.15,
      SelectedTheme: "Modern",
      Course: "B.Com. General",
      YearOfStudy: "3rd Year",
      IsApproved: true,
      Phone: "9876543222",
      CurrentLocation: "Tambaram, Chennai, India",
      Languages: "English (Fluent), Hindi (Native), Tamil (Conversational)",
      PersonalStory: "My interest in financial markets grew during college while managing tax projects and analyzing corporate filings.",
      SOP: "To secure a finance role where I can apply my analytical skills, Tally certification, and Excel modeling expertise.",
      ProfileImageUrl: "",
      BehanceUrl: "",
      GitHubUsername: "",
      IsAlumni: false,
      TestScores: "",
    }
  });

  // 4. Academic Records
  await prisma.academicRecords.createMany({
    data: [
      {
        UserId: user.Id,
        Degree: "Bachelor of Commerce (B.Com)",
        Institution: "Madras Christian College",
        FieldOfStudy: "General Commerce & Finance",
        Grade: "9.15 CGPA",
        StartYear: 2023,
        EndYear: 2026,
        AttachmentUrl: "/assets/demo_ug_marksheet.pdf"
      },
      {
        UserId: user.Id,
        Degree: "Higher Secondary (12th)",
        Institution: "Kendriya Vidyalaya",
        FieldOfStudy: "Commerce with Mathematics",
        Grade: "95.4%",
        StartYear: 2021,
        EndYear: 2023,
        AttachmentUrl: "/assets/demo_12th_marksheet.pdf"
      }
    ]
  });

  // 5. Experiences
  await prisma.experiences.createMany({
    data: [
      {
        UserId: user.Id,
        Company: "Sundaram Finance Limited",
        Title: "Financial Analyst Intern",
        Location: "Chennai",
        Description: "Assisted in audit preparation and ledger reconciliations using Tally Prime.\nBuilt interactive financial performance reporting dashboards in Microsoft Excel.\nAnalyzed corporate client balance sheets and prepared risk assessment briefs.",
        StartDate: "2024-05-01",
        EndDate: "2024-07-31",
        IsCurrent: false,
        Category: "Corporate Finance"
      }
    ]
  });

  // 6. Projects
  await prisma.projects.createMany({
    data: [
      {
        UserId: user.Id,
        Title: "GST Compliance & Automated Ledger Matching",
        Description: "Developed a spreadsheet-based script tool to reconcile tax ledgers and automate input tax credit (ITC) matching for local businesses, reducing reconciliation time by 40%.",
        Technologies: "Advanced Excel, VBA, Power Query",
        GithubUrl: "https://github.com/priyasharma-finance/gst-reconciler",
        LiveUrl: "",
        Category: "Financial Tools",
        ImageUrl: "",
      }
    ]
  });

  // 7. Skills
  await prisma.skills.createMany({
    data: [
      { UserId: user.Id, Name: "Tally Prime", Level: "Advanced", Category: "Accounting Software" },
      { UserId: user.Id, Name: "SAP FICO", Level: "Intermediate", Category: "Enterprise Software" },
      { UserId: user.Id, Name: "Excel Modeling", Level: "Advanced", Category: "Financial Analysis" },
      { UserId: user.Id, Name: "GST Filing", Level: "Intermediate", Category: "Taxation" },
      { UserId: user.Id, Name: "Power BI", Level: "Intermediate", Category: "Data Visualization" },
      { UserId: user.Id, Name: "Financial Analysis", Level: "Advanced", Category: "Core Finance" }
    ]
  });

  // 8. Certifications
  await prisma.certifications.createMany({
    data: [
      {
        UserId: user.Id,
        Title: "Tally Essential Gold Certification",
        Issuer: "Tally Education Pvt. Ltd.",
        IssueDate: new Date("2024-10-15"),
        CertificateUrl: "",
        Category: "Accounting",
      },
      {
        UserId: user.Id,
        Title: "NCFM Financial Markets Certification",
        Issuer: "National Stock Exchange of India",
        IssueDate: new Date("2025-01-20"),
        CertificateUrl: "",
        Category: "Finance",
      }
    ]
  });

  console.log("Successfully seeded test student Priya Sharma for Commerce!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
