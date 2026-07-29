import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { getUserFromRequest } from "@/utils/auth";

// POST /api/Assessments/[id]/attempt/answer — save a single answer in real-time
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload || userPayload.role !== "Student") {
      return NextResponse.json("Unauthorized", { status: 401 });
    }
    const userId = parseInt(userPayload.nameid);

    const body = await request.json();
    const { attemptId, questionId, selectedOption } = body;

    if (!attemptId || !questionId) {
      return NextResponse.json({ message: "attemptId and questionId are required." }, { status: 400 });
    }

    const attemptIdInt = parseInt(attemptId);
    const questionIdInt = parseInt(questionId);

    // Validate attempt belongs to this student and is still active
    const attempt = await prisma.assessmentAttempts.findUnique({ where: { Id: attemptIdInt } });
    if (!attempt || attempt.UserId !== userId || attempt.Status !== "InProgress") {
      return NextResponse.json({ message: "Invalid or closed attempt." }, { status: 400 });
    }

    const question = await prisma.assessmentQuestions.findUnique({ where: { Id: questionIdInt } });
    if (!question || question.AssessmentId !== attempt.AssessmentId) {
      return NextResponse.json({ message: "Question not found." }, { status: 404 });
    }

    const selected = selectedOption?.toUpperCase() || "";
    const isCorrect = selected !== "" && question.CorrectOption === selected;

    // Find-or-create pattern (safe upsert without composite unique)
    const existing = await prisma.studentAnswers.findFirst({
      where: { AttemptId: attemptIdInt, QuestionId: questionIdInt },
    });

    if (existing) {
      await prisma.studentAnswers.update({
        where: { Id: existing.Id },
        data: { SelectedOption: selected, IsCorrect: isCorrect },
      });
    } else {
      await prisma.studentAnswers.create({
        data: {
          AttemptId: attemptIdInt,
          QuestionId: questionIdInt,
          SelectedOption: selected,
          IsCorrect: isCorrect,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("POST Answer Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
