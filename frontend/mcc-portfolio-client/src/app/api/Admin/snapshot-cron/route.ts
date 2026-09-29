import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";

// Section completion logic (mirrors department-analytics route)
const SECTION_KEYS = ["header","about","experience","academicDetails","achievements","projectsResearch","skills"];

function computeSections(u, profileMap, expIds, acadIds, achIds, projIds, paperIds, skillIds, certIds, resumeIds) {
  const p = profileMap.get(u.Id);
  const hasName = Boolean(u.FullName?.trim());
  const hasPhoto = Boolean(u.ProfileImageUrl?.trim() || p?.ProfileImageUrl?.trim());
  const hasCourse = Boolean(p?.Course?.trim() || u.Department?.trim());
  const hasYear = Boolean(p?.YearOfStudy?.trim());
  const hasPhone = Boolean(p?.Phone?.trim());
  return {
    header: hasName && hasPhoto && hasCourse && hasYear && hasPhone,
    about: Boolean(p?.Bio?.trim()),
    experience: expIds.has(u.Id),
    academicDetails: acadIds.has(u.Id),
    achievements: achIds.has(u.Id),
    projectsResearch: projIds.has(u.Id) || paperIds.has(u.Id),
    skills: skillIds.has(u.Id),
  };
}

// Full 15-field completion logic (mirrors department-analytics route)
function calculateStudentCompletion(u, profileMap, expIds, acadIds, achIds, projIds, paperIds, skillIds, certIds, resumeIds) {
  const p = profileMap.get(u.Id);
  const hasLinkedIn = Boolean(p?.LinkedInUrl?.trim());
  const hasOtherMedia = Boolean(p?.InstagramUrl?.trim() || p?.BlogUrl?.trim() || p?.OtherHandles?.trim());
  const fields = [
    Boolean(u.FullName?.trim()),
    Boolean(u.ProfileImageUrl?.trim() || p?.ProfileImageUrl?.trim()),
    Boolean(p?.Course?.trim() || u.Department?.trim()),
    Boolean(p?.YearOfStudy?.trim()),
    Boolean(p?.Phone?.trim()),
    Boolean(p?.Bio?.trim()),
    expIds.has(u.Id),
    acadIds.has(u.Id),
    achIds.has(u.Id),
    projIds.has(u.Id) || paperIds.has(u.Id),
    skillIds.has(u.Id),
    certIds.has(u.Id),
    Boolean(p?.Languages?.trim()),
    resumeIds.has(u.Id),
    hasLinkedIn || hasOtherMedia,
  ];
  return Math.min(100, Math.max(0, Math.round((fields.filter(Boolean).length / 15) * 100)));
}

export async function GET(request) { return executeSnapshot(request); }
export async function POST(request) { return executeSnapshot(request); }

async function executeSnapshot(request) {
  // Auth: require CRON_SECRET or Admin JWT
  const authHeader = request.headers.get("authorization") || "";
  const cronSecret = process.env.CRON_SECRET;
  let authorized = false;
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) authorized = true;
  if (!authorized) {
    const { getUserFromRequest, hasModulePermission } = await import("@/utils/auth");
    const payload = getUserFromRequest(request);
    if (payload && (payload.role === "1" || payload.role === "Admin" || hasModulePermission(payload, "analytics", "read"))) authorized = true;
  }
  if (!authorized) return NextResponse.json("Unauthorized", { status: 401 });

  const now = new Date();
  const todayDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const tomorrowDate = new Date(todayDate.getTime() + 24 * 60 * 60 * 1000);

  const logDetails = [];
  let rowsWritten = 0;
  let isSuccess = true;

  try {
    // Load all data needed for calculations
    const [allUsers, profiles, experiences, academicRecords, achievements, projects, papers, skills, certifications, resumes] = await Promise.all([
      prisma.users.findMany({ where: { Role: 1 } }),
      prisma.profiles.findMany(),
      prisma.experiences.findMany(),
      prisma.academicRecords.findMany(),
      prisma.achievements.findMany(),
      prisma.projects.findMany(),
      prisma.researchPapers.findMany(),
      prisma.skills.findMany(),
      prisma.certifications.findMany(),
      prisma.resumes.findMany(),
    ]);

    const profileMap = new Map(profiles.map((p) => [p.UserId, p]));
    const expIds = new Set(experiences.map((e) => e.UserId));
    const acadIds = new Set(academicRecords.map((a) => a.UserId));
    const achIds = new Set(achievements.map((a) => a.UserId));
    const projIds = new Set(projects.map((p) => p.UserId));
    const paperIds = new Set(papers.map((p) => p.UserId));
    const skillIds = new Set(skills.map((s) => s.UserId));
    const certIds = new Set(certifications.map((c) => c.UserId));
    const resumeIds = new Set(resumes.map((r) => r.UserId));

    // Stream map
    const inst = await prisma.institutionDetails.findFirst();
    let deptStreamsMap = {};
    if (inst?.DeptStreams) { try { deptStreamsMap = JSON.parse(inst.DeptStreams); } catch {} }
    const DEFAULT_AIDED = new Set(["english","tamil","languages","history","political science","public administration","economics","philosophy","social work","mathematics","statistics","physics","chemistry","botany","zoology","computer science","computer science (b.sc)","commerce","physical education"]);
    const getDeptStream = (dept) => {
      if (deptStreamsMap[dept]) return deptStreamsMap[dept] === "Aided" ? "Aided" : "SFS";
      const lower = dept.toLowerCase();
      const configKey = Object.keys(deptStreamsMap).find((k) => k.toLowerCase() === lower);
      if (configKey) return deptStreamsMap[configKey] === "Aided" ? "Aided" : "SFS";
      return DEFAULT_AIDED.has(lower) ? "Aided" : "SFS";
    };

    // Today's login activity
    const todayLogins = await prisma.auditLogs.findMany({
      where: { Action: "Student Login", Timestamp: { gte: todayDate, lt: tomorrowDate } },
    });
    const todayLoginEmails = new Set(todayLogins.map((l) => l.PerformedByEmail));

    // Declared departments
    const declaredDepts = inst ? inst.Departments.split(";").map((d) => d.trim()).filter((d) => d.length > 0) : [];
    const userDepts = Array.from(new Set(allUsers.map((u) => u.Department).filter(Boolean)));
    const allDepts = Array.from(new Set([...declaredDepts, ...userDepts]));

    for (const dept of allDepts) {
      const deptUsers = allUsers.filter((u) => u.Department?.toLowerCase() === dept.toLowerCase());
      const totalStudents = deptUsers.length;
      const stream = getDeptStream(dept);

      // New signups today in this dept
      const newSignupsToday = deptUsers.filter((u) => {
        if (!u.CreatedAt) return false;
        const d = u.CreatedAt;
        return d >= todayDate && d < tomorrowDate;
      }).length;

      // Active students today (login today, in this dept)
      const deptEmails = new Set(deptUsers.map((u) => u.Email));
      const activeStudentsToday = todayLogins.filter((l) => deptEmails.has(l.PerformedByEmail)).length;

      // Avg completion
      let avgCompletionRate = 0;
      const sectionCounts = { header:0, about:0, experience:0, academicDetails:0, achievements:0, projectsResearch:0, skills:0 };
      if (totalStudents > 0) {
        let sum = 0;
        deptUsers.forEach((u) => {
          sum += calculateStudentCompletion(u, profileMap, expIds, acadIds, achIds, projIds, paperIds, skillIds, certIds, resumeIds);
          const secs = computeSections(u, profileMap, expIds, acadIds, achIds, projIds, paperIds, skillIds, certIds, resumeIds);
          for (const key of SECTION_KEYS) { if (secs[key]) sectionCounts[key]++; }
        });
        avgCompletionRate = Math.round((sum / totalStudents) * 10) / 10;
      }

      // Upsert snapshot
      if ((prisma as any).departmentAnalyticsSnapshot) {
        await (prisma as any).departmentAnalyticsSnapshot.upsert({
          where: { UQ_DeptSnapshot_Date_Dept: { Date: todayDate, DepartmentId: dept } },
          update: { Stream: stream, TotalStudents: totalStudents, NewSignupsToday: newSignupsToday, ActiveStudentsToday: activeStudentsToday, AvgCompletionRate: avgCompletionRate, SectionCompletionCounts: JSON.stringify(sectionCounts) },
          create: { Date: todayDate, DepartmentId: dept, Stream: stream, TotalStudents: totalStudents, NewSignupsToday: newSignupsToday, ActiveStudentsToday: activeStudentsToday, AvgCompletionRate: avgCompletionRate, SectionCompletionCounts: JSON.stringify(sectionCounts) },
        });
        rowsWritten++;
      }
    }
    logDetails.push(`Daily snapshot written for ${rowsWritten} department(s) for date ${todayDate.toISOString().split("T")[0]}.`);
  } catch (err) {
    console.error("Snapshot Cron Error:", err);
    isSuccess = false;
    logDetails.push(`Snapshot cron failed: ${err.message || err}`);
  }

  // Log to AutomationLog
  await prisma.automationLog.create({
    data: { Action: "Daily Analytics Snapshot", Timestamp: now, Details: logDetails.join(" | "), Success: isSuccess },
  });

  return NextResponse.json({ success: isSuccess, rowsWritten, details: logDetails });
}
