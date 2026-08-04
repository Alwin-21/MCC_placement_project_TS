require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Triggering notifications for test students...");

  // 1. Fetch Students
  const priya = await prisma.users.findFirst({
    where: { Email: "21-co-055@mcc.edu.in" }
  });
  const rohit = await prisma.users.findFirst({
    where: { Email: "21-ca-012@mcc.edu.in" }
  });

  // 2. Fetch Jobs
  const finJob = await prisma.jobPosting.findFirst({
    where: { Title: "Financial Analyst Associate" }
  });
  const devJob = await prisma.jobPosting.findFirst({
    where: { Title: "Associate Software Engineer" }
  });

  if (priya && finJob) {
    // Check if notification already exists
    const existing = await prisma.notifications.findFirst({
      where: { UserId: priya.Id, Title: { contains: "Financial Analyst" } }
    });

    if (!existing) {
      await prisma.notifications.create({
        data: {
          Title: `New Eligible Job Opportunity: ${finJob.Title}`,
          Message: `You are eligible to apply for '${finJob.Title}' at Google India. Min CGPA Required: ${finJob.EligibilityMinCGPA}. Deadline: ${new Date(finJob.Deadlines).toLocaleDateString("en-IN")}`,
          Type: "JobOpportunityAlert",
          IsRead: false,
          CreatedAt: new Date(),
          UserId: priya.Id
        }
      });
      console.log(`Dispatched notification to Priya Sharma (ID: ${priya.Id})`);
    } else {
      console.log("Notification already exists for Priya.");
    }
  }

  if (rohit && devJob) {
    const existing = await prisma.notifications.findFirst({
      where: { UserId: rohit.Id, Title: { contains: "Associate Software Engineer" } }
    });

    if (!existing) {
      await prisma.notifications.create({
        data: {
          Title: `New Eligible Job Opportunity: ${devJob.Title}`,
          Message: `You are eligible to apply for '${devJob.Title}' at Google India. Min CGPA Required: ${devJob.EligibilityMinCGPA}. Deadline: ${new Date(devJob.Deadlines).toLocaleDateString("en-IN")}`,
          Type: "JobOpportunityAlert",
          IsRead: false,
          CreatedAt: new Date(),
          UserId: rohit.Id
        }
      });
      console.log(`Dispatched notification to Rohit Kumar (ID: ${rohit.Id})`);
    } else {
      console.log("Notification already exists for Rohit.");
    }
  }

  process.exit(0);
}

main().catch(console.error);
