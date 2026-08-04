import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";

interface WeightsConfig {
  skills: number;
  experience: number;
  projects: number;
  certifications: number;
  completeness: number;
  achievements: number;
  cgpa: number;
}

const DEFAULT_WEIGHTS: WeightsConfig = {
  skills: 0.35,
  experience: 0.20,
  projects: 0.15,
  certifications: 0.10,
  completeness: 0.10,
  achievements: 0.05,
  cgpa: 0.05
};

export async function GET(request: Request) {
  return executeCron(request);
}

export async function POST(request: Request) {
  return executeCron(request);
}

async function executeCron(request: Request) {
  // Security: require CRON_SECRET header or Admin JWT
  const authHeader = request.headers.get("authorization") || "";
  const cronSecret = process.env.CRON_SECRET;

  let authorized = false;

  // Option 1: CRON_SECRET header (for scheduled cron runners)
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    authorized = true;
  }

  // Option 2: Admin JWT role (for manual triggers from Admin UI)
  if (!authorized) {
    const { getUserFromRequest, hasModulePermission } = await import("@/utils/auth");
    const payload = getUserFromRequest(request);
    if (payload && hasModulePermission(payload, "automation", "write")) {
      authorized = true;
    }
  }

  if (!authorized) {
    return NextResponse.json("Unauthorized. Valid CRON_SECRET or Admin JWT required.", { status: 401 });
  }

  const logDetails: string[] = [];
  let isSuccess = true;

  try {
    const now = new Date();

    // 1. Expire Jobs past deadlines
    const expiredJobs = await prisma.jobPosting.findMany({
      where: {
        Status: "Approved",
        Deadlines: { lt: now }
      }
    });

    if (expiredJobs.length > 0) {
      const jobIds = expiredJobs.map((j) => j.Id);
      await prisma.jobPosting.updateMany({
        where: { Id: { in: jobIds } },
        data: { Status: "Expired" }
      });
      logDetails.push(`Auto-expired ${expiredJobs.length} job(s) past deadlines: ${expiredJobs.map(j => `'${j.Title}'`).join(", ")}`);
    } else {
      logDetails.push("Checked job deadlines: No new expirations.");
    }

    // 2. Deadline Reminders (jobs closing in next 24 hours)
    const closingJobs = await prisma.jobPosting.findMany({
      where: {
        Status: "Approved",
        Deadlines: {
          gt: now,
          lte: new Date(now.getTime() + 24 * 60 * 60 * 1000)
        }
      },
      include: {
        Company: { select: { Name: true } }
      }
    });

    if (closingJobs.length > 0) {
      let remindersSent = 0;
      // Fetch active, approved students
      const students = await prisma.users.findMany({
        where: {
          Role: 1,
          IsActive: true,
          Profiles: { some: { IsApproved: true } }
        },
        include: {
          Profiles: { take: 1 },
          JobApplications: true
        }
      });

      for (const job of closingJobs) {
        const minCgpa = job.EligibilityMinCGPA || 0.0;
        const depts = job.EligibilityDepartments
          ? job.EligibilityDepartments.split(/[;]/).map((d) => d.trim().toLowerCase()).filter((d) => d.length > 0)
          : [];

        for (const student of students) {
          const profile = student.Profiles[0] || null;
          const studentCgpa = profile?.CGPA || 0.0;
          const studentDept = student.Department ? student.Department.trim().toLowerCase() : "";

          // Check application
          const alreadyApplied = student.JobApplications.some((app) => app.JobId === job.Id);
          if (alreadyApplied) continue;

          // Check CGPA constraint
          if (studentCgpa < minCgpa) continue;

          // Check Department constraint
          if (depts.length > 0 && depts[0] !== "all" && !depts.includes(studentDept)) continue;

          // Send notification alert
          await prisma.notifications.create({
            data: {
              Title: "Application Deadline Approaching!",
              Message: `The placement application for '${job.Title}' at ${job.Company.Name} closes in less than 24 hours. Submit your resume now!`,
              Type: "placement",
              IsRead: false,
              CreatedAt: new Date(),
              UserId: student.Id
            }
          });
          remindersSent++;
        }
      }
      logDetails.push(`Sent ${remindersSent} deadline reminder notification(s) to eligible students for ${closingJobs.length} closing job(s).`);
    } else {
      logDetails.push("Checked job reminders: No closing jobs within 24 hours.");
    }

    // 3. Saved Talent Pool Search Alerts
    const talentPools = await prisma.savedTalentPool.findMany({
      where: {
        CriteriaJson: { not: "" }
      }
    });

    if (talentPools.length > 0) {
      // Fetch all eligible candidates
      const candidates = await prisma.users.findMany({
        where: {
          Role: 1,
          IsActive: true,
          Profiles: { some: { IsApproved: true } }
        },
        include: {
          Profiles: { take: 1 },
          Skills: true,
          Projects: true,
          Experiences: true,
          Certifications: true,
          Achievements: true
        }
      });

      let alertCount = 0;

      for (const pool of talentPools) {
        try {
          const criteria = JSON.parse(pool.CriteriaJson);
          const {
            keywords = "",
            skills = [],
            departments = [],
            experience = "all",
            minCgpa = 0.0
          } = criteria;

          // Filter matching candidates
          const matchingCount = candidates.filter((student: any) => {
            const profile = student.Profiles[0] || null;
            const studentCgpa = profile?.CGPA || 0.0;
            const studentDept = student.Department ? student.Department.toLowerCase().trim() : "";

            // CGPA constraint
            if (minCgpa > 0.0 && studentCgpa < minCgpa) return false;

            // Department constraint
            if (departments.length > 0) {
              const lowerDepts = departments.map((d: string) => d.toLowerCase().trim());
              if (!lowerDepts.includes(studentDept)) return false;
            }

            // Skills constraint
            if (skills.length > 0) {
              const matchesSkill = skills.some((reqSkill: string) =>
                student.Skills.some((s: any) => s.Name.trim().toLowerCase() === reqSkill.toLowerCase().trim())
              );
              if (!matchesSkill) return false;
            }

            // Keyword constraint
            if (keywords) {
              const text = `${student.FullName} ${student.Department} ${profile?.Bio || ""}`.toLowerCase();
              if (!text.includes(keywords.toLowerCase())) return false;
            }

            return true;
          }).length;

          // Find or create SavedSearchAlert
          const prevAlert = await prisma.savedSearchAlert.findFirst({
            where: {
              CompanyId: pool.CompanyId,
              TalentPoolId: pool.Id
            }
          });

          if (!prevAlert) {
            await prisma.savedSearchAlert.create({
              data: {
                CompanyId: pool.CompanyId,
                TalentPoolId: pool.Id,
                NewMatchesCount: matchingCount,
                LastCheckedAt: now,
                IsNotified: false
              }
            });
          } else if (matchingCount > prevAlert.NewMatchesCount) {
            const newMatches = matchingCount - prevAlert.NewMatchesCount;
            // Update match state
            await prisma.savedSearchAlert.update({
              where: { Id: prevAlert.Id },
              data: {
                NewMatchesCount: matchingCount,
                LastCheckedAt: now,
                IsNotified: true
              }
            });

            // Notify company HR users
            const hrUsers = await prisma.companyUsers.findMany({
              where: { CompanyId: pool.CompanyId }
            });

            for (const hr of hrUsers) {
              await prisma.notifications.create({
                data: {
                  Title: "New Talent Matches Found!",
                  Message: `We found ${newMatches} new matching candidate(s) for your saved talent pool '${pool.Name}'.`,
                  Type: "placement",
                  IsRead: false,
                  CreatedAt: new Date(),
                  UserId: hr.Id // Notifications are sent to users
                }
              });
            }
            alertCount++;
          }
        } catch (e) {
          console.error("Pool matching parse error:", e);
        }
      }
      logDetails.push(`Evaluated ${talentPools.length} saved searches: Sent ${alertCount} recruiter alert(s).`);
    }

    // 4. Flag Inactive Companies
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    // Find verified companies
    const activeCompanies = await prisma.company.findMany({
      where: { Status: "Verified" }
    });

    let flaggedCount = 0;
    for (const comp of activeCompanies) {
      // Check if they have audit logs in last 90 days
      const auditCount = await prisma.companyAuditLogs.count({
        where: {
          CompanyId: comp.Id,
          Timestamp: { gte: ninetyDaysAgo }
        }
      });

      if (auditCount === 0) {
        flaggedCount++;
        // Write audit flag details or mark status suspended/inactive
        await prisma.companyAuditLogs.create({
          data: {
            CompanyId: comp.Id,
            Action: "Inactivity Flagged",
            PerformedByEmail: "system-automation@mcc.edu",
            Timestamp: now,
            Details: `Flagged company '${comp.Name}' for inactivity. No recruiter logs found in the last 90 days.`,
            IpAddress: "127.0.0.1"
          }
        });
      }
    }
    logDetails.push(`Audited inactive accounts: Flagged ${flaggedCount} company workspace(s) for 90 days inactivity.`);

  } catch (err: any) {
    console.error("Cron Execution Failure:", err);
    isSuccess = false;
    logDetails.push(`Execution failed: ${err.message || err}`);
  }

  // Save audit log
  const logStr = logDetails.join(" | ");
  await prisma.automationLog.create({
    data: {
      Action: "Automated Placements Check",
      Timestamp: new Date(),
      Details: logStr,
      Success: isSuccess
    }
  });

  return NextResponse.json({
    success: isSuccess,
    details: logDetails
  });
}
