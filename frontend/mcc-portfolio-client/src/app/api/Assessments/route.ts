import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { getUserFromRequest, hasModulePermission } from "@/utils/auth";

// GET /api/Assessments — Admin: list all assessments
export async function GET(request: Request) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload || !hasModulePermission(userPayload, "assessments", "read")) {
      return NextResponse.json("Unauthorized", { status: 401 });
    }

    const assessments = await prisma.assessments.findMany({
      orderBy: { CreatedAt: "desc" },
      include: {
        _count: {
          select: {
            AssessmentQuestions: true,
            AssessmentAttempts: true,
          },
        },
      },
    });

    return NextResponse.json(
      assessments.map((a) => ({
        id: a.Id,
        title: a.Title,
        description: a.Description,
        instructions: a.Instructions,
        durationMinutes: a.DurationMinutes,
        totalMarks: a.TotalMarks,
        startDate: a.StartDate,
        endDate: a.EndDate,
        status: a.Status,
        departments: a.Departments,
        createdAt: a.CreatedAt,
        updatedAt: a.UpdatedAt,
        questionCount: a._count.AssessmentQuestions,
        attemptCount: a._count.AssessmentAttempts,
      }))
    );
  } catch (err: any) {
    console.error("GET Assessments Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

// POST /api/Assessments — Admin: create assessment
export async function POST(request: Request) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload || !hasModulePermission(userPayload, "assessments", "write")) {
      return NextResponse.json("Forbidden", { status: 403 });
    }

    const body = await request.json();
    const { title, description, instructions, durationMinutes, totalMarks, startDate, endDate, departments } = body;

    if (!title?.trim()) {
      return NextResponse.json({ message: "Title is required." }, { status: 400 });
    }

    const now = new Date();

    // Ensure CreatedByUserId references an existing user in the database
    let createdByUserId = parseInt(userPayload.nameid);
    const userExists = await prisma.users.findUnique({ where: { Id: createdByUserId } });
    if (!userExists) {
      // Find any existing Super Admin user or create/use fallback admin account
      let adminUser = await prisma.users.findFirst({ where: { Role: 2 } });
      if (!adminUser) {
        adminUser = await prisma.users.create({
          data: {
            FullName: "Super Administrator",
            Email: "admin@mcc.com",
            PasswordHash: "$2a$10$abcdefghijklmnopqrstuv",
            Department: "Administration",
            RegisterNumber: "ADMIN001",
            ProfileImageUrl: "",
            Role: 2,
            CreatedAt: now,
            Stream: "Admin",
            Username: "superadmin",
            IsActive: true,
          },
        });
      }
      createdByUserId = adminUser.Id;
    }

    const assessment = await prisma.assessments.create({
      data: {
        Title: title.trim(),
        Description: description?.trim() || "",
        Instructions: instructions?.trim() || "",
        DurationMinutes: parseInt(durationMinutes) || 60,
        TotalMarks: parseInt(totalMarks) || 100,
        StartDate: startDate ? new Date(startDate) : now,
        EndDate: endDate ? new Date(endDate) : new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        Status: "Draft",
        Departments: Array.isArray(departments) ? departments.join(";") : (departments || ""),
        CreatedAt: now,
        UpdatedAt: now,
        CreatedByUserId: createdByUserId,
      },
    });

    return NextResponse.json({ success: true, id: assessment.Id });
  } catch (err: any) {
    console.error("POST Assessment Error:", err);
    return NextResponse.json({ message: err.message || "Internal server error" }, { status: 500 });
  }
}
