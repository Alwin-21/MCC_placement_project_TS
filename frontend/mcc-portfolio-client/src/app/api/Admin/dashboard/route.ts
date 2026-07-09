import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { getUserFromRequest } from "@/utils/auth";

export async function GET(request: Request) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload || (userPayload.role !== "Admin" && userPayload.role !== "Moderator")) {
      return NextResponse.json("Unauthorized", { status: 401 });
    }

    const totalStudents = await prisma.users.count();
    const totalSkills = await prisma.skills.count();
    const totalProjects = await prisma.projects.count();
    const totalAchievements = await prisma.achievements.count();
    const totalHackathons = await prisma.hackathons.count();
    const totalResearchPapers = await prisma.researchPapers.count();

    return NextResponse.json({
      totalStudents,
      totalSkills,
      totalProjects,
      totalAchievements,
      totalHackathons,
      totalResearchPapers
    });
  } catch (err: any) {
    console.error("GET Admin Dashboard Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
