import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { getUserFromRequest } from "@/utils/auth";

export async function GET(request: Request) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload || userPayload.role !== "Admin") {
      return NextResponse.json("Forbidden", { status: 403 });
    }

    const backupData = {
      users: await prisma.users.findMany(),
      profiles: await prisma.profiles.findMany(),
      skills: await prisma.skills.findMany(),
      projects: await prisma.projects.findMany(),
      achievements: await prisma.achievements.findMany(),
      hackathons: await prisma.hackathons.findMany(),
      certifications: await prisma.certifications.findMany(),
      researchPapers: await prisma.researchPapers.findMany(),
      resumes: await prisma.resumes.findMany(),
      institutionDetails: await prisma.institutionDetails.findMany(),
      notifications: await prisma.notifications.findMany(),
      themeConfigs: await prisma.themeConfigs.findMany(),
      auditLogs: await prisma.auditLogs.findMany(),
      academicRecords: await prisma.academicRecords.findMany(),
      olympiads: await prisma.olympiads.findMany(),
      startupCompetitions: await prisma.startupCompetitions.findMany(),
      ngoActivities: await prisma.ngoActivities.findMany(),
      sportsAchievements: await prisma.sportsAchievements.findMany()
    };

    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    // Log System Backup Action
    await prisma.auditLogs.create({
      data: {
        Action: "System Backup Created",
        PerformedByEmail: userPayload.email,
        Timestamp: new Date(),
        Details: "Successfully generated full system database backup file",
        IpAddress: ip
      }
    });

    return NextResponse.json(backupData);
  } catch (err: any) {
    console.error("GET Admin Backup Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
