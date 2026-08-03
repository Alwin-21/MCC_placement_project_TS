import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { getUserFromRequest } from "@/utils/auth";

export async function GET(request: Request) {
  try {
    const payload = getUserFromRequest(request);
    if (!payload || payload.role !== "Company") {
      return NextResponse.json("Unauthorized", { status: 401 });
    }

    const hrUserId = parseInt(payload.nameid, 10);
    const hrUser = await prisma.companyUsers.findUnique({
      where: { Id: hrUserId },
    });

    if (!hrUser) {
      return NextResponse.json("HR User not found.", { status: 404 });
    }

    // Get all active and approved students
    const students = await prisma.users.findMany({
      where: {
        Role: 1, // Student
        IsActive: true,
        Profiles: {
          some: {
            IsApproved: true,
          },
        },
      },
      include: {
        Profiles: {
          select: {
            Bio: true,
            CGPA: true,
            GraduationYear: true,
            LinkedInUrl: true,
            GitHubUrl: true,
          },
        },
      },
      orderBy: { FullName: "asc" },
    });

    const mapped = students.map((student) => ({
      id: student.Id,
      fullName: student.FullName,
      email: student.Email,
      department: student.Department,
      registerNumber: student.RegisterNumber,
      stream: student.Stream,
      cgpa: student.Profiles[0]?.CGPA || 0.0,
      graduationYear: student.Profiles[0]?.GraduationYear || null,
      bio: student.Profiles[0]?.Bio || "",
      linkedInUrl: student.Profiles[0]?.LinkedInUrl || "",
      gitHubUrl: student.Profiles[0]?.GitHubUrl || "",
    }));

    return NextResponse.json(mapped);
  } catch (err: any) {
    console.error("GET Recruiting Students Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
