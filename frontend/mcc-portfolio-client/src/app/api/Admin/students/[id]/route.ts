import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { getUserFromRequest, hasModulePermission } from "@/utils/auth";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload || !hasModulePermission(userPayload, "students", "write")) {
      return NextResponse.json("Forbidden", { status: 403 });
    }

    const { id: idStr } = await params;
    const id = parseInt(idStr, 10);

    const body = await request.json();
    const { fullName, email, department, stream, registerNumber, isActive, role } = body;

    const user = await prisma.users.findUnique({ where: { Id: id } });
    if (!user) {
      return NextResponse.json("Student not found.", { status: 404 });
    }

    const existingEmail = await prisma.users.findFirst({
      where: {
        Email: { equals: email, mode: "insensitive" },
        Id: { not: id }
      }
    });

    if (existingEmail) {
      return NextResponse.json("Email is already in use by another user.", { status: 400 });
    }

    let parsedRole = user.Role;
    if (role) {
      parsedRole = role === "Admin" ? 2 : role === "Moderator" ? 3 : 1;
    }

    await prisma.users.update({
      where: { Id: id },
      data: {
        FullName: fullName || "",
        Email: email || "",
        Department: department || "",
        Stream: stream || "",
        RegisterNumber: registerNumber || "",
        IsActive: isActive !== undefined ? !!isActive : user.IsActive,
        Role: parsedRole
      }
    });

    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    await prisma.auditLogs.create({
      data: {
        Action: "Update Student",
        PerformedByEmail: userPayload.email,
        Timestamp: new Date(),
        Details: `Updated student details for user ID ${id} (${email}, Active: ${isActive})`,
        IpAddress: ip
      }
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("PUT Admin Student Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload || !hasModulePermission(userPayload, "students", "write")) {
      return NextResponse.json("Forbidden", { status: 403 });
    }

    const { id: idStr } = await params;
    const id = parseInt(idStr, 10);

    const user = await prisma.users.findUnique({ where: { Id: id } });
    if (!user) {
      return NextResponse.json("User not found.", { status: 404 });
    }

    // Cascade delete manually (Prisma has model constraints, but deleting explicitly is safe)
    await prisma.profiles.deleteMany({ where: { UserId: id } });
    await prisma.skills.deleteMany({ where: { UserId: id } });
    await prisma.projects.deleteMany({ where: { UserId: id } });
    await prisma.achievements.deleteMany({ where: { UserId: id } });
    await prisma.hackathons.deleteMany({ where: { UserId: id } });
    await prisma.researchPapers.deleteMany({ where: { UserId: id } });
    await prisma.certifications.deleteMany({ where: { UserId: id } });
    await prisma.resumes.deleteMany({ where: { UserId: id } });
    await prisma.communityServices.deleteMany({ where: { UserId: id } });
    await prisma.creativeWorks.deleteMany({ where: { UserId: id } });
    await prisma.academicRecords.deleteMany({ where: { UserId: id } });
    await prisma.olympiads.deleteMany({ where: { UserId: id } });
    await prisma.startupCompetitions.deleteMany({ where: { UserId: id } });
    await prisma.ngoActivities.deleteMany({ where: { UserId: id } });
    await prisma.sportsAchievements.deleteMany({ where: { UserId: id } });
    await prisma.notifications.deleteMany({ where: { UserId: id } });
    await prisma.savedResumes.deleteMany({ where: { UserId: id } });
    await prisma.experiences.deleteMany({ where: { UserId: id } });

    await prisma.users.delete({ where: { Id: id } });

    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    await prisma.auditLogs.create({
      data: {
        Action: "Delete Student",
        PerformedByEmail: userPayload.email,
        Timestamp: new Date(),
        Details: `Deleted user ID ${id} (${user.Email}, Name: ${user.FullName})`,
        IpAddress: ip
      }
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("DELETE Admin Student Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
