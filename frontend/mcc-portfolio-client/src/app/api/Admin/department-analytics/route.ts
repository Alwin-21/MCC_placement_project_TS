import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { getUserFromRequest, hasModulePermission } from "@/utils/auth";

// MCC default Aided departments (well-known classification)
const DEFAULT_AIDED_DEPARTMENTS = new Set([
  "english",
  "tamil",
  "languages",
  "history",
  "political science",
  "public administration",
  "economics",
  "philosophy",
  "social work",
  "mathematics",
  "statistics",
  "physics",
  "chemistry",
  "botany",
  "zoology",
  "computer science",
  "computer science (b.sc)",
  "commerce",
  "physical education",
]);

export async function GET(request: Request) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload || !hasModulePermission(userPayload, "analytics", "read")) {
      return NextResponse.json("Unauthorized", { status: 401 });
    }

    const users = await prisma.users.findMany();
    const profiles = await prisma.profiles.findMany();
    const projects = await prisma.projects.findMany();
    const papers = await prisma.researchPapers.findMany();
    const skills = await prisma.skills.findMany();

    const inst = await prisma.institutionDetails.findFirst();
    const declaredDepts = inst
      ? inst.Departments.split(";").map(d => d.trim()).filter(d => d.length > 0)
      : [];

    // Parse the DeptStreams JSON config
    let deptStreamsMap: Record<string, string> = {};
    if (inst && inst.DeptStreams) {
      try {
        deptStreamsMap = JSON.parse(inst.DeptStreams);
      } catch {
        deptStreamsMap = {};
      }
    }

    const userDepts = Array.from(new Set(users.map(u => u.Department).filter(d => !!d)));
    
    // Combine declared and user-defined departments
    const allDepts = Array.from(new Set([...declaredDepts, ...userDepts]));

    const analytics = allDepts.map(dept => {
      const deptUsers = users.filter(u => u.Department && u.Department.toLowerCase() === dept.toLowerCase());
      const deptUserIds = new Set(deptUsers.map(u => u.Id));

      const studentCount = deptUsers.length;
      const projectCount = projects.filter(p => deptUserIds.has(p.UserId)).length;
      const paperCount = papers.filter(r => deptUserIds.has(r.UserId)).length;
      const skillCount = skills.filter(s => deptUserIds.has(s.UserId)).length;

      const deptProfiles = profiles.filter(p => deptUserIds.has(p.UserId));
      const approvedCount = deptProfiles.filter(p => p.IsApproved).length;
      const approvalRate = studentCount > 0 ? (approvedCount / studentCount) * 100 : 0;

      // Determine stream: prefer explicit config, fall back to default classification
      let stream: "Aided" | "SFS" = "SFS";
      const deptLower = dept.toLowerCase();
      if (deptStreamsMap[dept]) {
        stream = deptStreamsMap[dept] === "Aided" ? "Aided" : "SFS";
      } else {
        // Try case-insensitive key lookup
        const configKey = Object.keys(deptStreamsMap).find(
          k => k.toLowerCase() === deptLower
        );
        if (configKey) {
          stream = deptStreamsMap[configKey] === "Aided" ? "Aided" : "SFS";
        } else if (DEFAULT_AIDED_DEPARTMENTS.has(deptLower)) {
          stream = "Aided";
        }
      }

      return {
        department: dept,
        stream,
        studentCount: studentCount,
        projectCount: projectCount,
        paperCount: paperCount,
        skillCount: skillCount,
        approvalRate: Math.round(approvalRate * 10) / 10
      };
    });

    // Sort descending by student count
    analytics.sort((a, b) => b.studentCount - a.studentCount);

    return NextResponse.json(analytics);
  } catch (err: any) {
    console.error("GET Admin Department Analytics Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
