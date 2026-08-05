const path = require("path");
const dotenv = require("dotenv");
dotenv.config({ path: path.join(__dirname, ".env.local") });

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function seedHRDemo() {
  console.log("Seeding HR Demo Account (username: hrdemo, pass: hrdemo123)...");

  const email = "hrdemo@mcc.edu.in";
  const passwordHash = bcrypt.hashSync("hrdemo123", 10);

  // 1. Create or update Company
  let company = await prisma.company.findFirst({
    where: { Email: "recruitment@techcorp-global.com" },
  });

  if (!company) {
    company = await prisma.company.create({
      data: {
        Name: "TechCorp Global Innovations",
        Email: "recruitment@techcorp-global.com",
        Status: "Verified",
        CreatedAt: new Date(),
        UpdatedAt: new Date(),
      },
    });
  } else {
    company = await prisma.company.update({
      where: { Id: company.Id },
      data: { Status: "Verified" },
    });
  }

  // 2. Create or update Company Profile
  await prisma.companyProfile.upsert({
    where: { CompanyId: company.Id },
    update: {
      LogoUrl: "https://images.unsplash.com/photo-1549923746-c502d488b3ea?auto=format&fit=crop&w=400&q=80",
      CoverImageUrl: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80",
      Website: "https://techcorp-global.com",
      LinkedInUrl: "https://linkedin.com/company/techcorp-global",
      Industry: "Software & Information Technology",
      CompanyType: "Multinational Enterprise",
      CompanySize: "500-1000 Employees",
      FoundedYear: 2012,
      Description: "TechCorp Global Innovations is a premier tech organization specializing in full-stack web applications, cloud infrastructure, and artificial intelligence solutions for global enterprises.",
      Mission: "To empower businesses through innovative technology and nurture world-class engineering talent.",
      Vision: "To lead the global digital shift with sustainable, high-impact software and AI solutions.",
      WorkCulture: "Collaborative, innovation-focused, flexible hybrid work environment with strong emphasis on mentorship, growth, and continuous learning.",
      Benefits: "Attractive CTC Packages; Annual Performance Bonuses; Premium Health Insurance; Remote/Hybrid Flexibility; Wellness Stipends; Certification Reimbursements",
      PlacementAvailable: true,
      InternshipAvailable: true,
    },
    create: {
      CompanyId: company.Id,
      LogoUrl: "https://images.unsplash.com/photo-1549923746-c502d488b3ea?auto=format&fit=crop&w=400&q=80",
      CoverImageUrl: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80",
      Website: "https://techcorp-global.com",
      LinkedInUrl: "https://linkedin.com/company/techcorp-global",
      Industry: "Software & Information Technology",
      CompanyType: "Multinational Enterprise",
      CompanySize: "500-1000 Employees",
      FoundedYear: 2012,
      Description: "TechCorp Global Innovations is a premier tech organization specializing in full-stack web applications, cloud infrastructure, and artificial intelligence solutions for global enterprises.",
      Mission: "To empower businesses through innovative technology and nurture world-class engineering talent.",
      Vision: "To lead the global digital shift with sustainable, high-impact software and AI solutions.",
      WorkCulture: "Collaborative, innovation-focused, flexible hybrid work environment with strong emphasis on mentorship, growth, and continuous learning.",
      Benefits: "Attractive CTC Packages; Annual Performance Bonuses; Premium Health Insurance; Remote/Hybrid Flexibility; Wellness Stipends; Certification Reimbursements",
      PlacementAvailable: true,
      InternshipAvailable: true,
    },
  });

  // 3. Create or update Company Locations
  const existingLoc = await prisma.companyLocations.findFirst({ where: { CompanyId: company.Id } });
  if (!existingLoc) {
    await prisma.companyLocations.createMany({
      data: [
        { CompanyId: company.Id, Location: "Chennai, Tamil Nadu (Head Office)", IsHeadOffice: true, WorkMode: "Hybrid" },
        { CompanyId: company.Id, Location: "Bengaluru, Karnataka (Tech Hub)", IsHeadOffice: false, WorkMode: "OnSite" },
      ],
    });
  }

  // 4. Create or update HR User (`hrdemo@mcc.edu.in`)
  let hrUser = await prisma.companyUsers.findUnique({
    where: { Email: email },
  });

  if (!hrUser) {
    hrUser = await prisma.companyUsers.create({
      data: {
        CompanyId: company.Id,
        Email: email,
        PasswordHash: passwordHash,
        FullName: "Sarah Jenkins (Senior HR Manager)",
        Designation: "Head of Campus Recruitment & Talent Acquisition",
        Phone: "+91 98765 43210",
        AlternatePhone: "+91 98765 43211",
        IsActive: true,
        CreatedAt: new Date(),
        UpdatedAt: new Date(),
      },
    });
  } else {
    hrUser = await prisma.companyUsers.update({
      where: { Id: hrUser.Id },
      data: {
        PasswordHash: passwordHash,
        FullName: "Sarah Jenkins (Senior HR Manager)",
        Designation: "Head of Campus Recruitment & Talent Acquisition",
        IsActive: true,
        FailedLoginAttempts: 0,
        LockedUntil: null,
      },
    });
  }

  // 5. Create Sample Job Postings
  const existingJob = await prisma.jobPosting.findFirst({ where: { CompanyId: company.Id } });
  if (!existingJob) {
    await prisma.jobPosting.create({
      data: {
        CompanyId: company.Id,
        Title: "Associate Software Engineer - Full Stack (2026 Batch)",
        Department: "Computer Science",
        Description: "We are seeking passionate 2026 graduating students to join our core engineering team in building scalable cloud microservices and web platforms.",
        Responsibilities: "Develop frontend UI components in React/Next.js; Build RESTful backend APIs; Collaborate with product managers and QA teams.",
        Requirements: "Strong foundation in Data Structures, Algorithms, JavaScript/TypeScript, SQL databases, and Web Fundamentals.",
        RequiredSkills: "JavaScript; React; Node.js; SQL; Data Structures",
        PreferredSkills: "TypeScript; Next.js; PostgreSQL; Docker; Git",
        JobType: "FullTime",
        WorkMode: "Hybrid",
        EligibilityDepartments: "Computer Science;Information Technology;MCA",
        EligibilityYears: "2026",
        EligibilityMinCGPA: 7.5,
        EligibilityExperience: "Freshers / 0-1 Year",
        Vacancies: 12,
        Salary: "₹ 8,50,000 - ₹ 12,00,000 LPA",
        LPA: 10.5,
        Benefits: "Health Insurance; Performance Bonus; Relocation Allowance; Learning Stipend",
        SelectionProcess: "1. Online Technical Assessment\n2. Technical Coding Interview\n3. HR Cultural Fitment Round",
        Deadlines: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        Status: "Approved",
        CreatedAt: new Date(),
        UpdatedAt: new Date(),
      },
    });
  }

  console.log("\nDEMO HR ACCOUNT CREATED SUCCESSFULLY!");
  console.log(`Username / Email: hrdemo  (or ${email})`);
  console.log("Password: hrdemo123");
  console.log(`Company: ${company.Name}`);
  console.log(`HR Name: ${hrUser.FullName}`);
}

seedHRDemo()
  .catch((e) => console.error("Error seeding HR Demo:", e))
  .finally(() => {
    prisma.$disconnect();
    pool.end();
  });
