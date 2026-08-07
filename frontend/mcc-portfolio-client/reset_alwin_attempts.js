const path = require("path");
const dotenv = require("dotenv");
dotenv.config({ path: path.join(__dirname, ".env.local") });

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function resetAttempts() {
  console.log("Resetting assessment attempts for student 'alwin'...");

  // Find user alwin
  const user = await prisma.users.findFirst({
    where: {
      OR: [
        { Username: "alwin" },
        { Email: "21-cs-001@mcc.edu.in" }
      ]
    }
  });

  if (!user) {
    console.error("Student 'alwin' not found!");
    return;
  }

  console.log(`Found student ID ${user.Id} (${user.FullName}, ${user.Email})`);

  // Delete attempts for this student
  const deleted = await prisma.assessmentAttempts.deleteMany({
    where: { UserId: user.Id }
  });

  console.log(`Successfully deleted ${deleted.count} assessment attempt(s) for student 'alwin'.`);
  console.log("Alwin can now attend the Technical Placement Mock Test 2026 again!");
}

resetAttempts()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
