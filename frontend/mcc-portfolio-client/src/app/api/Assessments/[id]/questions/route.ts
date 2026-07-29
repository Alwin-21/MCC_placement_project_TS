import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { getUserFromRequest, hasModulePermission } from "@/utils/auth";

// GET /api/Assessments/[id]/questions
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload || !hasModulePermission(userPayload, "assessments", "read")) {
      return NextResponse.json("Unauthorized", { status: 401 });
    }
    const { id } = await params;
    const questions = await prisma.assessmentQuestions.findMany({
      where: { AssessmentId: parseInt(id) },
      orderBy: { OrderIndex: "asc" },
    });

    return NextResponse.json(
      questions.map((q) => ({
        id: q.Id,
        assessmentId: q.AssessmentId,
        questionText: q.QuestionText,
        optionA: q.OptionA,
        optionB: q.OptionB,
        optionC: q.OptionC,
        optionD: q.OptionD,
        correctOption: q.CorrectOption,
        marks: q.Marks,
        orderIndex: q.OrderIndex,
      }))
    );
  } catch (err: any) {
    console.error("GET Questions Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

// POST /api/Assessments/[id]/questions — bulk import / save
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload || !hasModulePermission(userPayload, "assessments", "write")) {
      return NextResponse.json("Forbidden", { status: 403 });
    }
    const { id } = await params;
    const assessmentId = parseInt(id);

    const body = await request.json();
    const { questions, replace } = body;

    if (!Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json({ message: "No questions provided." }, { status: 400 });
    }

    // Validate all questions
    const invalid: number[] = [];
    const valid = questions.filter((q: any, idx: number) => {
      const hasRequired =
        q.questionText?.trim() &&
        q.optionA?.trim() &&
        q.optionB?.trim() &&
        q.optionC?.trim() &&
        q.optionD?.trim() &&
        ["A", "B", "C", "D"].includes((q.correctOption || "").toUpperCase()) &&
        !isNaN(parseInt(q.marks)) &&
        parseInt(q.marks) > 0;
      if (!hasRequired) invalid.push(idx + 1);
      return hasRequired;
    });

    if (replace) {
      await prisma.assessmentQuestions.deleteMany({ where: { AssessmentId: assessmentId } });
    }

    // Get current max order index
    const existing = await prisma.assessmentQuestions.findMany({
      where: { AssessmentId: assessmentId },
      orderBy: { OrderIndex: "desc" },
      take: 1,
    });
    let startIndex = existing.length > 0 ? existing[0].OrderIndex + 1 : 0;

    const created = await prisma.assessmentQuestions.createMany({
      data: valid.map((q: any, i: number) => ({
        AssessmentId: assessmentId,
        QuestionText: q.questionText.trim(),
        OptionA: q.optionA.trim(),
        OptionB: q.optionB.trim(),
        OptionC: q.optionC.trim(),
        OptionD: q.optionD.trim(),
        CorrectOption: q.correctOption.toUpperCase(),
        Marks: parseInt(q.marks),
        OrderIndex: startIndex + i,
      })),
    });

    // Update assessment total marks
    const allQ = await prisma.assessmentQuestions.findMany({ where: { AssessmentId: assessmentId } });
    const total = allQ.reduce((sum, q) => sum + q.Marks, 0);
    await prisma.assessments.update({
      where: { Id: assessmentId },
      data: { TotalMarks: total, UpdatedAt: new Date() },
    });

    return NextResponse.json({ success: true, created: created.count, invalidRows: invalid });
  } catch (err: any) {
    console.error("POST Questions Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
