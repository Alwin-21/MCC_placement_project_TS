import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
<<<<<<< HEAD
import { getUserFromRequest } from "@/utils/auth";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload) {
      return NextResponse.json("Unauthorized", { status: 401 });
    }

    const { id } = await params;
    const assessmentId = parseInt(id);

    const a = await prisma.assessments.findUnique({
      where: { Id: assessmentId }
    });

    if (!a) {
      return NextResponse.json("Assessment not found", { status: 404 });
    }

    return NextResponse.json({
      id: a.Id,
      title: a.Title,
      description: a.Description,
      instructions: a.Instructions,
      duration: a.Duration,
      totalMarks: a.TotalMarks,
      startDate: a.StartDate,
      endDate: a.EndDate,
      departments: a.Departments,
      isPublished: a.IsPublished,
      isClosed: a.IsClosed,
      createdAt: a.CreatedAt
    });
  } catch (err: any) {
    console.error("GET Assessment by ID Error:", err);
=======
import { getUserFromRequest, hasModulePermission } from "@/utils/auth";

// GET /api/Assessments/[id]
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload || !hasModulePermission(userPayload, "assessments", "read")) {
      return NextResponse.json("Unauthorized", { status: 401 });
    }
    const { id } = await params;
    const assessment = await prisma.assessments.findUnique({
      where: { Id: parseInt(id) },
      include: {
        AssessmentQuestions: { orderBy: { OrderIndex: "asc" } },
        _count: { select: { AssessmentAttempts: true } },
      },
    });
    if (!assessment) return NextResponse.json("Not found", { status: 404 });

    return NextResponse.json({
      id: assessment.Id,
      title: assessment.Title,
      description: assessment.Description,
      instructions: assessment.Instructions,
      durationMinutes: assessment.DurationMinutes,
      totalMarks: assessment.TotalMarks,
      startDate: assessment.StartDate,
      endDate: assessment.EndDate,
      status: assessment.Status,
      departments: assessment.Departments,
      createdAt: assessment.CreatedAt,
      updatedAt: assessment.UpdatedAt,
      attemptCount: assessment._count.AssessmentAttempts,
      questions: assessment.AssessmentQuestions.map((q) => ({
        id: q.Id,
        questionText: q.QuestionText,
        optionA: q.OptionA,
        optionB: q.OptionB,
        optionC: q.OptionC,
        optionD: q.OptionD,
        correctOption: q.CorrectOption,
        marks: q.Marks,
        orderIndex: q.OrderIndex,
      })),
    });
  } catch (err: any) {
    console.error("GET Assessment [id] Error:", err);
>>>>>>> 40a9e30e1da64064e79b351472bee8ee265619c7
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

<<<<<<< HEAD
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload || (userPayload.role !== "Admin" && userPayload.role !== "Moderator")) {
      return NextResponse.json("Unauthorized", { status: 401 });
    }

    const { id } = await params;
    const assessmentId = parseInt(id);
    const body = await request.json();
    const { title, description, instructions, duration, totalMarks, startDate, endDate, departments } = body;

    const existing = await prisma.assessments.findUnique({ where: { Id: assessmentId } });
    if (!existing) {
      return NextResponse.json("Assessment not found", { status: 404 });
    }

    const updated = await prisma.assessments.update({
      where: { Id: assessmentId },
      data: {
        Title: title !== undefined ? title : existing.Title,
        Description: description !== undefined ? description : existing.Description,
        Instructions: instructions !== undefined ? instructions : existing.Instructions,
        Duration: duration !== undefined ? parseInt(duration) : existing.Duration,
        TotalMarks: totalMarks !== undefined ? parseInt(totalMarks) : existing.TotalMarks,
        StartDate: startDate !== undefined ? new Date(startDate) : existing.StartDate,
        EndDate: endDate !== undefined ? new Date(endDate) : existing.EndDate,
        Departments: departments !== undefined ? departments : existing.Departments
      }
    });

    return NextResponse.json({
      id: updated.Id,
      title: updated.Title,
      description: updated.Description,
      instructions: updated.Instructions,
      duration: updated.Duration,
      totalMarks: updated.TotalMarks,
      startDate: updated.StartDate,
      endDate: updated.EndDate,
      departments: updated.Departments,
      isPublished: updated.IsPublished,
      isClosed: updated.IsClosed,
      createdAt: updated.CreatedAt
    });
  } catch (err: any) {
    console.error("PUT Assessment Error:", err);
=======
// PUT /api/Assessments/[id]
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload || !hasModulePermission(userPayload, "assessments", "write")) {
      return NextResponse.json("Forbidden", { status: 403 });
    }
    const { id } = await params;
    const body = await request.json();
    const { title, description, instructions, durationMinutes, totalMarks, startDate, endDate, departments } = body;

    const assessment = await prisma.assessments.update({
      where: { Id: parseInt(id) },
      data: {
        Title: title?.trim() || undefined,
        Description: description?.trim() ?? undefined,
        Instructions: instructions?.trim() ?? undefined,
        DurationMinutes: durationMinutes !== undefined ? parseInt(durationMinutes) : undefined,
        TotalMarks: totalMarks !== undefined ? parseInt(totalMarks) : undefined,
        StartDate: startDate ? new Date(startDate) : undefined,
        EndDate: endDate ? new Date(endDate) : undefined,
        Departments: Array.isArray(departments) ? departments.join(";") : departments ?? undefined,
        UpdatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, id: assessment.Id });
  } catch (err: any) {
    console.error("PUT Assessment [id] Error:", err);
>>>>>>> 40a9e30e1da64064e79b351472bee8ee265619c7
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

<<<<<<< HEAD
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload || (userPayload.role !== "Admin" && userPayload.role !== "Moderator")) {
      return NextResponse.json("Unauthorized", { status: 401 });
    }

    const { id } = await params;
    const assessmentId = parseInt(id);

    const existing = await prisma.assessments.findUnique({ where: { Id: assessmentId } });
    if (!existing) {
      return NextResponse.json("Assessment not found", { status: 404 });
    }

    await prisma.assessments.delete({
      where: { Id: assessmentId }
    });

    return NextResponse.json("Assessment deleted successfully.");
  } catch (err: any) {
    console.error("DELETE Assessment Error:", err);
=======
// DELETE /api/Assessments/[id]
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload || !hasModulePermission(userPayload, "assessments", "write")) {
      return NextResponse.json("Forbidden", { status: 403 });
    }
    const { id } = await params;
    await prisma.assessments.delete({ where: { Id: parseInt(id) } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("DELETE Assessment [id] Error:", err);
>>>>>>> 40a9e30e1da64064e79b351472bee8ee265619c7
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
