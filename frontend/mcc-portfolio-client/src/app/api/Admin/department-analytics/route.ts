import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { getUserFromRequest } from "@/utils/auth";

export async function GET(request: Request) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload || (userPayload.role !== "Admin" && userPayload.role !== "Moderator")) {
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

      return {
        department: dept,
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
