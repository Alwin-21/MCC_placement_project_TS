import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
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
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

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
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/Assessments/[id]
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload || !hasModulePermission(userPayload, "assessments", "write")) {
      return NextResponse.json("Forbidden", { status: 403 });
    }
    const { id } = await params;
    await prisma.assessments.delete({
      where: { Id: parseInt(id) },
    });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("DELETE Assessment [id] Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
