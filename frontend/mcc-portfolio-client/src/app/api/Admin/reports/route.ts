import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { getUserFromRequest } from "@/utils/auth";

export async function GET(request: Request) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload || (userPayload.role !== "Admin" && userPayload.role !== "Moderator")) {
      return NextResponse.json("Unauthorized", { status: 401 });
    }

    const totalUsers = await prisma.users.count();
    
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);
    const registeredLast30 = await prisma.users.count({
      where: { CreatedAt: { gte: last30Days } }
    });

    const skills = await prisma.skills.findMany({ select: { Name: true } });
    
    // Group and count skills
    const skillCounts: Record<string, number> = {};
    skills.forEach(s => {
      const name = s.Name.trim();
      skillCounts[name] = (skillCounts[name] || 0) + 1;
    });

    const popularSkills = Object.entries(skillCounts)
      .map(([name, count]) => ({ skill: name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    const totalProjects = await prisma.projects.count();
    const totalPapers = await prisma.researchPapers.count();
    const totalAchievements = await prisma.achievements.count();

    return NextResponse.json({
      totalUsers,
      registeredLast30,
      popularSkills,
      totalProjects,
      totalPapers,
      totalAchievements
    });
  } catch (err: any) {
    console.error("GET Admin Reports Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
