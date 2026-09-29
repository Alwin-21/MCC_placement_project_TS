import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { getUserFromRequest, hasModulePermission } from "@/utils/auth";

const SECTION_KEYS = [
  "header", "about", "experience", "academicDetails",
  "achievements", "projectsResearch", "skills"
];

function computeSectionCompletion(u, profileMap, expIds, acadIds, achIds, projIds, paperIds, skillIds) {
  const p = profileMap.get(u.Id);
  return {
    header: Boolean(u.FullName?.trim()) && Boolean(u.ProfileImageUrl?.trim() || p?.ProfileImageUrl?.trim()) && Boolean(p?.Course?.trim() || u.Department?.trim()) && Boolean(p?.YearOfStudy?.trim()) && Boolean(p?.Phone?.trim()),
    about: Boolean(p?.Bio?.trim()),
    experience: expIds.has(u.Id),
    academicDetails: acadIds.has(u.Id),
    achievements: achIds.has(u.Id),
    projectsResearch: projIds.has(u.Id) || paperIds.has(u.Id),
    skills: skillIds.has(u.Id),
  };
}

function sectionLabel(key) {
  return { header:"Header", about:"About", experience:"Experience", academicDetails:"Academic Details", achievements:"Achievements", projectsResearch:"Projects & Research", skills:"Skills" }[key];
}

export async function GET(request) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload || !hasModulePermission(userPayload, "analytics", "read")) {
      return NextResponse.json("Unauthorized", { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const stream = searchParams.get("stream");
    const allUsers = await prisma.users.findMany({ where: { Role: 1 } });
    const profiles = await prisma.profiles.findMany();
    const profileMap = new Map(profiles.map((p) => [p.UserId, p]));
    const inst = await prisma.institutionDetails.findFirst();
    let deptStreamsMap = {};
    if (inst?.DeptStreams) { try { deptStreamsMap = JSON.parse(inst.DeptStreams); } catch { } }
    const DEFAULT_AIDED = new Set(["english","tamil","languages","history","political science","public administration","economics","philosophy","social work","mathematics","statistics","physics","chemistry","botany","zoology","computer science","computer science (b.sc)","commerce","physical education"]);
    const getDeptStream = (dept) => {
      if (deptStreamsMap[dept]) return deptStreamsMap[dept] === "Aided" ? "Aided" : "SFS";
      const lower = dept.toLowerCase();
      const configKey = Object.keys(deptStreamsMap).find((k) => k.toLowerCase() === lower);
      if (configKey) return deptStreamsMap[configKey] === "Aided" ? "Aided" : "SFS";
      return DEFAULT_AIDED.has(lower) ? "Aided" : "SFS";
    };
    const streamUsers = stream ? allUsers.filter((u) => getDeptStream(u.Department || "") === stream) : allUsers;

    if (type === "signup-growth") {
      const days = parseInt(searchParams.get("days") || "90");
      const since = new Date(); since.setDate(since.getDate() - days);
      const byDay = {};
      streamUsers.forEach((u) => { if (u.CreatedAt && u.CreatedAt >= since) { const d = u.CreatedAt.toISOString().split("T")[0]; byDay[d] = (byDay[d] || 0) + 1; } });
      const dates = [];
      for (let i = days - 1; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); dates.push(d.toISOString().split("T")[0]); }
      let cumulative = streamUsers.filter((u) => u.CreatedAt && u.CreatedAt < since).length;
      const series = dates.map((date) => { const n = byDay[date] || 0; cumulative += n; return { date, newSignups: n, total: cumulative }; });
      const now = new Date();
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const firstOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const thisMonthCount = streamUsers.filter((u) => u.CreatedAt && u.CreatedAt >= firstOfMonth).length;
      const prevMonthCount = streamUsers.filter((u) => u.CreatedAt && u.CreatedAt >= firstOfPrevMonth && u.CreatedAt < firstOfMonth).length;
      return NextResponse.json({ series, kpi: { thisMonth: thisMonthCount, prevMonth: prevMonthCount, total: streamUsers.length } });
    }

    if (type === "engagement") {
      const days = parseInt(searchParams.get("days") || "30");
      const since = new Date(); since.setDate(since.getDate() - days);
      const streamEmails = new Set(streamUsers.map((u) => u.Email));
      const loginLogs = await prisma.auditLogs.findMany({ where: { Action: "Student Login", Timestamp: { gte: since } } });
      const streamLogs = loginLogs.filter((l) => streamEmails.has(l.PerformedByEmail));
      const dauByDay = {};
      const heatmap = Array.from({ length: 7 }, () => new Array(24).fill(0));
      streamLogs.forEach((log) => {
        const d = log.Timestamp.toISOString().split("T")[0];
        if (!dauByDay[d]) dauByDay[d] = new Set();
        dauByDay[d].add(log.PerformedByEmail);
        heatmap[log.Timestamp.getDay()][log.Timestamp.getHours()]++;
      });
      const dates = [];
      for (let i = days - 1; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); dates.push(d.toISOString().split("T")[0]); }
      const series = dates.map((date) => ({ date, dau: dauByDay[date]?.size || 0 }));
      const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
      const wauUsers = new Set(streamLogs.filter((l) => l.Timestamp >= weekAgo).map((l) => l.PerformedByEmail));
      const total = streamUsers.length;
      return NextResponse.json({ series, heatmap, kpi: { wau: wauUsers.size, wauPct: total > 0 ? Math.round((wauUsers.size / total) * 100) : 0, totalStudents: total } });
    }

    if (type === "funnel") {
      const [experiences, academicRecords, achievements, projects, papers, skills] = await Promise.all([
        prisma.experiences.findMany(), prisma.academicRecords.findMany(), prisma.achievements.findMany(),
        prisma.projects.findMany(), prisma.researchPapers.findMany(), prisma.skills.findMany(),
      ]);
      const expIds = new Set(experiences.map((e) => e.UserId));
      const acadIds = new Set(academicRecords.map((a) => a.UserId));
      const achIds = new Set(achievements.map((a) => a.UserId));
      const projIds = new Set(projects.map((p) => p.UserId));
      const paperIds = new Set(papers.map((p) => p.UserId));
      const skillIds = new Set(skills.map((s) => s.UserId));
      const total = streamUsers.length;
      const counts = { header:0, about:0, experience:0, academicDetails:0, achievements:0, projectsResearch:0, skills:0 };
      streamUsers.forEach((u) => {
        const s = computeSectionCompletion(u, profileMap, expIds, acadIds, achIds, projIds, paperIds, skillIds);
        for (const key of SECTION_KEYS) { if (s[key]) counts[key]++; }
      });
      const funnel = SECTION_KEYS.map((key) => ({ section: key, label: sectionLabel(key), count: counts[key], pct: total > 0 ? Math.round((counts[key] / total) * 100) : 0 }));
      return NextResponse.json({ funnel, total });
    }

    if (type === "trend") {
      const delegate = (prisma as any).departmentAnalyticsSnapshot;
      if (!delegate) {
        return NextResponse.json({ series: [], insufficientData: true });
      }
      const snapshots = await delegate.findMany({ where: stream ? { Stream: stream } : undefined, orderBy: { Date: "asc" } });
      if (snapshots.length < 2) return NextResponse.json({ series: [], insufficientData: true });
      const byDate = {};
      snapshots.forEach((s) => { const d = s.Date.toISOString().split("T")[0]; if (!byDate[d]) byDate[d] = { sum: 0, count: 0 }; byDate[d].sum += s.AvgCompletionRate; byDate[d].count++; });
      const series = Object.entries(byDate).sort(([a],[b]) => a.localeCompare(b)).map(([date, {sum, count}]) => ({ date, avgCompletion: Math.round((sum/count)*10)/10 }));
      return NextResponse.json({ series, insufficientData: false, firstDate: series[0]?.date || null });
    }

    return NextResponse.json({ error: "Unknown type" }, { status: 400 });
  } catch (err) {
    console.error("GET Admin Growth Analytics Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
