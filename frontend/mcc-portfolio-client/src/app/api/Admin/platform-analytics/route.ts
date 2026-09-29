import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { getUserFromRequest, hasModulePermission } from "@/utils/auth";

const DEFAULT_AIDED = new Set([
  "english","tamil","languages","history","political science","public administration",
  "economics","philosophy","social work","mathematics","statistics","physics",
  "chemistry","botany","zoology","computer science","computer science (b.sc)","commerce","physical education",
]);

// Reusable: 15-field completion score
function calcCompletion(u, profileMap, expIds, acadIds, achIds, projIds, paperIds, skillIds, certIds, resumeIds) {
  const p = profileMap.get(u.Id);
  const hasLinkedIn = Boolean(p?.LinkedInUrl?.trim());
  const hasOtherMedia = Boolean(p?.InstagramUrl?.trim() || p?.BlogUrl?.trim() || p?.OtherHandles?.trim());
  const fields = [
    Boolean(u.FullName?.trim()), Boolean(u.ProfileImageUrl?.trim() || p?.ProfileImageUrl?.trim()),
    Boolean(p?.Course?.trim() || u.Department?.trim()), Boolean(p?.YearOfStudy?.trim()), Boolean(p?.Phone?.trim()),
    Boolean(p?.Bio?.trim()), expIds.has(u.Id), acadIds.has(u.Id), achIds.has(u.Id),
    projIds.has(u.Id) || paperIds.has(u.Id), skillIds.has(u.Id), certIds.has(u.Id),
    Boolean(p?.Languages?.trim()), resumeIds.has(u.Id), hasLinkedIn || hasOtherMedia,
  ];
  return Math.min(100, Math.max(0, Math.round((fields.filter(Boolean).length / 15) * 100)));
}

function getDeptStream(dept, deptStreamsMap) {
  if (deptStreamsMap[dept]) return deptStreamsMap[dept] === "Aided" ? "Aided" : "SFS";
  const lower = dept.toLowerCase();
  const configKey = Object.keys(deptStreamsMap).find(k => k.toLowerCase() === lower);
  if (configKey) return deptStreamsMap[configKey] === "Aided" ? "Aided" : "SFS";
  return DEFAULT_AIDED.has(lower) ? "Aided" : "SFS";
}

export async function GET(request) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload || !hasModulePermission(userPayload, "analytics", "read")) {
      return NextResponse.json("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // "overview" | "audience" | "realtime" | "activity"
    const stream = searchParams.get("stream"); // "Aided" | "SFS"
    const days = parseInt(searchParams.get("days") || "28");

    // Load institution stream config
    const inst = await prisma.institutionDetails.findFirst();
    let deptStreamsMap = {};
    if (inst?.DeptStreams) { try { deptStreamsMap = JSON.parse(inst.DeptStreams); } catch {} }

    // All students
    const allUsers = await prisma.users.findMany({ where: { Role: 1 } });
    const streamUsers = stream
      ? allUsers.filter(u => getDeptStream(u.Department || "", deptStreamsMap) === stream)
      : allUsers;
    const streamUserIds = new Set(streamUsers.map(u => u.Id));
    const streamEmails = new Set(streamUsers.map(u => u.Email));

    const now = new Date();
    const since = new Date(now.getTime() - days * 86400000);
    const prevSince = new Date(since.getTime() - days * 86400000);

    // ── OVERVIEW ─────────────────────────────────────────────────────────
    if (type === "overview") {
      // Load portfolio tables for completion calc
      const [profiles, experiences, academicRecords, achievements, projects, papers, skills, certifications, resumes] = await Promise.all([
        prisma.profiles.findMany(), prisma.experiences.findMany(), prisma.academicRecords.findMany(),
        prisma.achievements.findMany(), prisma.projects.findMany(), prisma.researchPapers.findMany(),
        prisma.skills.findMany(), prisma.certifications.findMany(), prisma.resumes.findMany(),
      ]);
      const profileMap = new Map(profiles.map(p => [p.UserId, p]));
      const expIds = new Set(experiences.map(e => e.UserId));
      const acadIds = new Set(academicRecords.map(a => a.UserId));
      const achIds = new Set(achievements.map(a => a.UserId));
      const projIds = new Set(projects.map(p => p.UserId));
      const paperIds = new Set(papers.map(p => p.UserId));
      const skillIds = new Set(skills.map(s => s.UserId));
      const certIds = new Set(certifications.map(c => c.UserId));
      const resumeIds = new Set(resumes.map(r => r.UserId));

      // Login logs
      const loginLogs = await prisma.auditLogs.findMany({
        where: { Action: "Student Login", Timestamp: { gte: prevSince } },
        orderBy: { Timestamp: "asc" },
      });
      const streamLogs = loginLogs.filter(l => streamEmails.has(l.PerformedByEmail));
      const currLogs = streamLogs.filter(l => l.Timestamp >= since);
      const prevLogs = streamLogs.filter(l => l.Timestamp < since);

      // KPI: Logins
      const currLogins = currLogs.length;
      const prevLogins = prevLogs.length;

      // KPI: New students
      const currNewStudents = streamUsers.filter(u => u.CreatedAt && u.CreatedAt >= since).length;
      const prevNewStudents = streamUsers.filter(u => u.CreatedAt && u.CreatedAt >= prevSince && u.CreatedAt < since).length;

      // KPI: Completions (students reaching 100% in range — approximate by signup or login within range)
      // Since we have no completion timestamp, we proxy: students currently at 100% who signed up in the range
      const completionsNow = streamUsers.filter(u => {
        const pct = calcCompletion(u, profileMap, expIds, acadIds, achIds, projIds, paperIds, skillIds, certIds, resumeIds);
        return pct === 100;
      }).length;
      // For previous period comparison, count who were at 100% among those who signed up previously
      const prevCompletions = streamUsers.filter(u => {
        if (!u.CreatedAt || u.CreatedAt >= since) return false;
        const pct = calcCompletion(u, profileMap, expIds, acadIds, achIds, projIds, paperIds, skillIds, certIds, resumeIds);
        return pct === 100;
      }).length;

      // Daily series for the main chart (logins per day)
      const byDay = {};
      const newByDay = {};
      const complByDay = {};
      for (let i = 0; i < days; i++) {
        const d = new Date(since.getTime() + i * 86400000).toISOString().split("T")[0];
        byDay[d] = 0; newByDay[d] = 0; complByDay[d] = 0;
      }
      currLogs.forEach(l => { const d = l.Timestamp.toISOString().split("T")[0]; if (d in byDay) byDay[d]++; });
      streamUsers.forEach(u => {
        if (u.CreatedAt && u.CreatedAt >= since) { const d = u.CreatedAt.toISOString().split("T")[0]; if (d in newByDay) newByDay[d]++; }
      });

      const series = Object.keys(byDay).sort().map(date => ({
        date,
        logins: byDay[date],
        newStudents: newByDay[date],
      }));

      // Headline
      const headline = `${activeStreamLabel(stream)} students logged in ${currLogins} time${currLogins !== 1 ? "s" : ""} in the last ${days} days`;

      return NextResponse.json({
        kpi: {
          logins: { curr: currLogins, prev: prevLogins },
          completions: { curr: completionsNow, prev: prevCompletions },
          newStudents: { curr: currNewStudents, prev: prevNewStudents },
        },
        series,
        headline,
        totalStudents: streamUsers.length,
      });
    }

    // ── AUDIENCE ─────────────────────────────────────────────────────────
    if (type === "audience") {
      const profiles = await prisma.profiles.findMany();
      const profileMap = new Map(profiles.map(p => [p.UserId, p]));

      const courseCounts = {};
      const yearCounts = {};

      streamUsers.forEach(u => {
        const p = profileMap.get(u.Id);
        const course = p?.Course?.trim() || u.Department?.trim() || "Unknown";
        const year = p?.YearOfStudy?.trim() || "Unknown";
        courseCounts[course] = (courseCounts[course] || 0) + 1;
        yearCounts[year] = (yearCounts[year] || 0) + 1;
      });

      const courseData = Object.entries(courseCounts)
        .map(([course, count]) => ({ course, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 12);

      const yearOrder = ["1st Year","2nd Year","3rd Year","4th Year","PG 1st Year","PG 2nd Year"];
      const yearData = Object.entries(yearCounts)
        .map(([year, count]) => ({ year, count }))
        .sort((a, b) => {
          const ai = yearOrder.indexOf(a.year), bi = yearOrder.indexOf(b.year);
          if (ai >= 0 && bi >= 0) return ai - bi;
          if (ai >= 0) return -1; if (bi >= 0) return 1;
          return a.year.localeCompare(b.year);
        });

      return NextResponse.json({ courseData, yearData, total: streamUsers.length });
    }

    // ── REALTIME ─────────────────────────────────────────────────────────
    if (type === "realtime") {
      const fortyEightHrsAgo = new Date(now.getTime() - 48 * 3600000);
      const logs48 = await prisma.auditLogs.findMany({
        where: { Action: "Student Login", Timestamp: { gte: fortyEightHrsAgo } },
        orderBy: { Timestamp: "desc" },
      });
      const streamLogs48 = logs48.filter(l => streamEmails.has(l.PerformedByEmail));

      // 48h mini chart: bucket into 2-hour slots
      const slots = 24; // 24 × 2hrs = 48hrs
      const buckets = new Array(slots).fill(0);
      streamLogs48.forEach(l => {
        const hoursAgo = (now.getTime() - l.Timestamp.getTime()) / 3600000;
        const slotIdx = Math.min(slots - 1, Math.floor(hoursAgo / 2));
        buckets[slots - 1 - slotIdx]++;
      });
      const miniSeries = buckets.map((count, i) => ({
        label: `-${48 - i * 2}h`,
        count,
      }));

      // Recent 10 login events (for the live feed)
      const recentEvents = streamLogs48.slice(0, 10).map(l => {
        const user = streamUsers.find(u => u.Email === l.PerformedByEmail);
        return {
          type: "login",
          name: user?.FullName || l.PerformedByEmail,
          timestamp: l.Timestamp.toISOString(),
        };
      });

      return NextResponse.json({
        count48h: streamLogs48.length,
        miniSeries,
        recentEvents,
      });
    }

    // ── ACTIVITY FEED ─────────────────────────────────────────────────────
    if (type === "activity") {
      const [loginLogs, profiles, experiences, academicRecords, achievements, projects, papers, skills, certifications, resumes] = await Promise.all([
        prisma.auditLogs.findMany({
          where: { Action: "Student Login", Timestamp: { gte: since } },
          orderBy: { Timestamp: "desc" }, take: 50,
        }),
        prisma.profiles.findMany(), prisma.experiences.findMany(), prisma.academicRecords.findMany(),
        prisma.achievements.findMany(), prisma.projects.findMany(), prisma.researchPapers.findMany(),
        prisma.skills.findMany(), prisma.certifications.findMany(), prisma.resumes.findMany(),
      ]);

      const profileMap = new Map(profiles.map(p => [p.UserId, p]));
      const expIds = new Set(experiences.map(e => e.UserId));
      const acadIds = new Set(academicRecords.map(a => a.UserId));
      const achIds = new Set(achievements.map(a => a.UserId));
      const projIds = new Set(projects.map(p => p.UserId));
      const paperIds = new Set(papers.map(p => p.UserId));
      const skillIds = new Set(skills.map(s => s.UserId));
      const certIds = new Set(certifications.map(c => c.UserId));
      const resumeIds = new Set(resumes.map(r => r.UserId));

      const events = [];

      // Recent logins in stream
      loginLogs.filter(l => streamEmails.has(l.PerformedByEmail)).slice(0, 6).forEach(l => {
        const user = streamUsers.find(u => u.Email === l.PerformedByEmail);
        events.push({ type: "login", name: user?.FullName || l.PerformedByEmail, timestamp: l.Timestamp.toISOString(), detail: "logged in" });
      });

      // Recent signups in stream
      streamUsers.filter(u => u.CreatedAt && u.CreatedAt >= since)
        .sort((a, b) => new Date(b.CreatedAt).getTime() - new Date(a.CreatedAt).getTime())
        .slice(0, 4)
        .forEach(u => {
          events.push({ type: "signup", name: u.FullName || u.Email, timestamp: u.CreatedAt.toISOString(), detail: "joined the platform" });
        });

      // Students at 100% completion (recent signups who completed)
      streamUsers.filter(u => u.CreatedAt && u.CreatedAt >= since).forEach(u => {
        const pct = calcCompletion(u, profileMap, expIds, acadIds, achIds, projIds, paperIds, skillIds, certIds, resumeIds);
        if (pct === 100) {
          events.push({ type: "completion", name: u.FullName || u.Email, timestamp: u.CreatedAt.toISOString(), detail: "reached 100% portfolio" });
        }
      });

      // Sort by timestamp desc, take 10
      events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      return NextResponse.json({ events: events.slice(0, 10) });
    }

    return NextResponse.json({ error: "Unknown type" }, { status: 400 });
  } catch (err) {
    console.error("Platform Analytics error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

function activeStreamLabel(stream) {
  if (!stream) return "All";
  return stream;
}
