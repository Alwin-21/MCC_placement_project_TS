import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";

import { mapKeysToCamelCase, fixUrlsInObject } from "@/utils/mapper";

async function fetchFullPortfolio(id: number) {
  const user = await prisma.users.findUnique({ where: { Id: id } });
  if (!user) return null;

  const profile = await prisma.profiles.findFirst({ where: { UserId: id } });
  const skills = await prisma.skills.findMany({ where: { UserId: id } });
  const certifications = await prisma.certifications.findMany({ where: { UserId: id } });
  const researchPapers = await prisma.researchPapers.findMany({ where: { UserId: id } });
  const achievements = await prisma.achievements.findMany({ where: { UserId: id } });
  const hackathons = await prisma.hackathons.findMany({ where: { UserId: id } });
  const projects = await prisma.projects.findMany({ where: { UserId: id } });
  const resumes = await prisma.resumes.findMany({ where: { UserId: id } });
  const communityServices = await prisma.communityServices.findMany({ where: { UserId: id } });
  const creativeWorks = await prisma.creativeWorks.findMany({ where: { UserId: id } });
  const academicRecords = await prisma.academicRecords.findMany({ where: { UserId: id } });
  const olympiads = await prisma.olympiads.findMany({ where: { UserId: id } });
  const startupCompetitions = await prisma.startupCompetitions.findMany({ where: { UserId: id } });
  const ngoActivities = await prisma.ngoActivities.findMany({ where: { UserId: id } });
  const sportsAchievements = await prisma.sportsAchievements.findMany({ where: { UserId: id } });
  const experiences = await prisma.experiences.findMany({ where: { UserId: id } });

  const themeConfig = profile
    ? await prisma.themeConfigs.findFirst({
        where: { ThemeId: { equals: profile.SelectedTheme, mode: "insensitive" } }
      })
    : null;

  // C# controller responses map role to string
  const roleName = user.Role === 2 ? "Admin" : user.Role === 3 ? "Moderator" : "Student";
  const mappedUser = {
    id: user.Id,
    fullName: user.FullName,
    email: user.Email,
    passwordHash: user.PasswordHash,
    department: user.Department,
    registerNumber: user.RegisterNumber,
    profileImageUrl: user.ProfileImageUrl,
    role: roleName,
    createdAt: user.CreatedAt,
    stream: user.Stream,
    isTemporaryPassword: user.IsTemporaryPassword,
    username: user.Username,
    isActive: user.IsActive
  };

  return mapKeysToCamelCase({
    user: mappedUser,
    profile,
    themeConfig,
    skills,
    certifications,
    researchPapers,
    achievements,
    hackathons,
    projects,
    resumes,
    communityServices,
    creativeWorks,
    academicRecords,
    olympiads,
    startupCompetitions,
    ngoActivities,
    sportsAchievements,
    experiences
  });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr, 10);

    const portfolio = await fetchFullPortfolio(id);
    if (!portfolio) {
      return NextResponse.json("User not found", { status: 404 });
    }

    const origin = request.headers.get("origin") || new URL(request.url).origin;
    return NextResponse.json(fixUrlsInObject(portfolio, origin));
  } catch (err: any) {
    console.error("GET Public Portfolio Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
