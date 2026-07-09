import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";

export async function GET() {
  try {
    // Fetch users who are active, role == 1 (Student), and have an approved profile
    const activeStudents = await prisma.users.findMany({
      where: {
        IsActive: true,
        Role: 1, // Student
        Profiles: {
          some: {
            IsApproved: true
          }
        }
      },
      include: {
        Skills: true,
        Projects: true,
        Achievements: true,
        Hackathons: true,
        ResearchPapers: true
      }
    });

    const leaderboard = activeStudents.map(student => {
      const skillsCount = student.Skills.length;
      const projectsCount = student.Projects.length;
      const achievementsCount = student.Achievements.length;
      const hackathonsCount = student.Hackathons.length;
      const researchCount = student.ResearchPapers.length;

      const score = (skillsCount * 5) +
                    (projectsCount * 10) +
                    (achievementsCount * 15) +
                    (hackathonsCount * 20) +
                    (researchCount * 25);

      return {
        id: student.Id,
        fullName: student.FullName,
        department: student.Department,
        score: score,
        skills: skillsCount,
        projects: projectsCount,
        achievements: achievementsCount,
        hackathons: hackathonsCount,
        researchPapers: researchCount
      };
    });

    // Sort descending by score
    leaderboard.sort((a, b) => b.score - a.score);

    return NextResponse.json(leaderboard);
  } catch (err: any) {
    console.error("GET Leaderboard Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
