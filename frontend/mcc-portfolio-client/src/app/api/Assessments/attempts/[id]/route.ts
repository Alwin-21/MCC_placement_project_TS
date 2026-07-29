import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { getUserFromRequest } from "@/utils/auth";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload) {
      return NextResponse.json("Unauthorized", { status: 401 });
    }

    const { id } = await params;
    const attemptId = parseInt(id);

    const attempt = await prisma.assessmentAttempts.findUnique({
      where: { Id: attemptId },
      include: {
        Assessment: true,
        StudentAnswers: true
      }
    });

    if (!attempt) {
      return NextResponse.json("Attempt not found", { status: 404 });
    }

    const durationMs = (attempt.Assessment.DurationMinutes || 60) * 60 * 1000;
    const elapsedMs = Date.now() - new Date(attempt.StartedAt).getTime();
    const remainingSeconds = Math.max(0, Math.floor((durationMs - elapsedMs) / 1000));

    return NextResponse.json({
      id: attempt.Id,
      assessmentId: attempt.AssessmentId,
      startedAt: attempt.StartedAt,
      submittedAt: attempt.SubmittedAt,
      isCompleted: ["Submitted", "AutoSubmitted", "Terminated"].includes(attempt.Status),
      status: attempt.Status,
      marksObtained: attempt.MarksObtained,
      percentage: attempt.Percentage,
      totalQuestions: attempt.TotalQuestions,
      attemptedQuestions: attempt.AttemptedQuestions,
      correctAnswers: attempt.CorrectAnswers,
      wrongAnswers: attempt.WrongAnswers,
      durationMinutes: attempt.Assessment.DurationMinutes,
      title: attempt.Assessment.Title,
      remainingSeconds
    });
  } catch (err: any) {
    console.error("GET Student Attempt status error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload) {
      return NextResponse.json("Unauthorized", { status: 401 });
    }

    const { id } = await params;
    const attemptId = parseInt(id);
    const body = await request.json();
    const { answers } = body;

    const attempt = await prisma.assessmentAttempts.findUnique({
      where: { Id: attemptId },
      include: {
        Assessment: {
          include: {
            AssessmentQuestions: true
          }
        }
      }
    });

    if (!attempt) {
      return NextResponse.json("Attempt not found", { status: 404 });
    }

    if (["Submitted", "AutoSubmitted", "Terminated"].includes(attempt.Status)) {
      return NextResponse.json("Attempt has already been submitted", { status: 400 });
    }

    const questions = attempt.Assessment.AssessmentQuestions;
    let attemptedCount = 0;
    let correctCount = 0;
    let scoreObtained = 0;
    let totalMarksVal = 0;

    const answersDataToSave: any[] = [];

    for (const q of questions) {
      const selected = answers ? answers[q.Id.toString()] : null;
      const isAttempted = selected !== undefined && selected !== null && selected !== "";
      const isCorrect = isAttempted && selected.trim().toUpperCase() === q.CorrectOption.trim().toUpperCase();

      if (isAttempted) attemptedCount++;
      if (isCorrect) {
        correctCount++;
        scoreObtained += q.Marks;
      }
      totalMarksVal += q.Marks;

      answersDataToSave.push({
        AttemptId: attemptId,
        QuestionId: q.Id,
        SelectedOption: isAttempted ? selected : "",
        IsCorrect: isCorrect,
        MarksObtained: isCorrect ? q.Marks : 0
      });
    }

    const wrongCount = attemptedCount - correctCount;
    const percentage = totalMarksVal > 0 ? parseFloat(((scoreObtained / totalMarksVal) * 100).toFixed(2)) : 0;

    const updated = await prisma.$transaction(async (tx) => {
      await tx.studentAnswers.deleteMany({
        where: { AttemptId: attemptId }
      });

      await tx.studentAnswers.createMany({
        data: answersDataToSave
      });

      return await tx.assessmentAttempts.update({
        where: { Id: attemptId },
        data: {
          SubmittedAt: new Date(),
          MarksObtained: scoreObtained,
          TotalQuestions: questions.length,
          AttemptedQuestions: attemptedCount,
          CorrectAnswers: correctCount,
          WrongAnswers: wrongCount,
          Percentage: percentage,
          Status: attempt.Status === "Terminated" ? "Terminated" : "Submitted"
        }
      });
    });

    return NextResponse.json({
      success: true,
      score: updated.MarksObtained,
      percentage: updated.Percentage
    });
  } catch (err: any) {
    console.error("POST Student Attempt submit error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
