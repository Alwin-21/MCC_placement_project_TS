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
  console.log("Creating test account for Silvan...");

  const email = "silvan@mcc.edu.in";
  const username = "silvan";
  const plainPassword = "Silvan@123";

  // Cleanup if already exists
  const existingUser = await prisma.users.findFirst({ where: { Email: email } });
  if (existingUser) {
    console.log("Existing silvan account found. Removing old record...");
    await prisma.profiles.deleteMany({ where: { UserId: existingUser.Id } });
    await prisma.skills.deleteMany({ where: { UserId: existingUser.Id } });
    await prisma.users.delete({ where: { Id: existingUser.Id } });
  }

  // Create User
  const passwordHash = bcrypt.hashSync(plainPassword, 10);
  const user = await prisma.users.create({
    data: {
      FullName: "Silvan",
      Email: email,
      Username: username,
      PasswordHash: passwordHash,
      Department: "Computer Science",
      Stream: "Aided",
      RegisterNumber: "test-silvan-001",
      Role: 1, // Student
      IsActive: true,
      CreatedAt: new Date(),
      ProfileImageUrl: "",
    }
  });

  console.log(`Created user Silvan (ID: ${user.Id})`);

  // Create Profile
  await prisma.profiles.create({
    data: {
      UserId: user.Id,
      Bio: "Test account for Silvan.",
      LinkedInUrl: "",
      GitHubUrl: "",
      TargetCareer: "Software Developer",
      CGPA: 8.5,
      SelectedTheme: "Modern",
      Course: "B.Sc. Computer Science",
      YearOfStudy: "3rd Year",
      IsApproved: true,
      Phone: "",
      CurrentLocation: "Chennai, India",
      Languages: "English, Tamil",
      PersonalStory: "",
      SOP: "",
      ProfileImageUrl: "",
      BehanceUrl: "",
      GitHubUsername: "",
      IsAlumni: false,
      TestScores: "",
    }
  });

  console.log("\n✅ Test account created successfully!");
  console.log("─────────────────────────────────────");
  console.log(`  Name     : Silvan`);
  console.log(`  Email    : ${email}`);
  console.log(`  Username : ${username}`);
  console.log(`  Password : ${plainPassword}`);
  console.log(`  Role     : Student`);
  console.log(`  URL      : http://localhost:3001/login`);
  console.log("─────────────────────────────────────");

  process.exit(0);
}

main().catch((err) => {
  console.error("Failed to create account:", err);
  process.exit(1);
});
