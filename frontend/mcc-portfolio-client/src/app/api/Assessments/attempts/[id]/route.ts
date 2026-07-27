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

    const attempt = await prisma.studentAttempts.findUnique({
      where: { Id: attemptId },
      include: {
        Assessments: true,
        StudentAnswers: true
      }
    });

    if (!attempt) {
      return NextResponse.json("Attempt not found", { status: 404 });
    }

    const durationMs = attempt.Assessments.Duration * 60 * 1000;
    const elapsedMs = Date.now() - new Date(attempt.StartTime).getTime();
    const remainingSeconds = Math.max(0, Math.floor((durationMs - elapsedMs) / 1000));

    return NextResponse.json({
      id: attempt.Id,
      assessmentId: attempt.AssessmentId,
      startTime: attempt.StartTime,
      endTime: attempt.EndTime,
      isSubmitted: attempt.IsSubmitted,
      status: attempt.Status,
      score: attempt.Score,
      percentage: attempt.Percentage,
      totalQuestions: attempt.TotalQuestions,
      attemptedQuestions: attempt.AttemptedQuestions,
      unattemptedQuestions: attempt.UnattemptedQuestions,
      correctAnswers: attempt.CorrectAnswers,
      wrongAnswers: attempt.WrongAnswers,
      duration: attempt.Assessments.Duration,
      title: attempt.Assessments.Title,
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
    const body = await request.json(); // { answers: { [questionId: string]: string } }
    const { answers } = body;

    const attempt = await prisma.studentAttempts.findUnique({
      where: { Id: attemptId },
      include: {
        Assessments: {
          include: {
            AssessmentQuestions: {
              include: { Questions: true }
            }
          }
        }
      }
    });

    if (!attempt) {
      return NextResponse.json("Attempt not found", { status: 404 });
    }

    if (attempt.IsSubmitted) {
      return NextResponse.json("Attempt has already been submitted", { status: 400 });
    }

    const questions = attempt.Assessments.AssessmentQuestions.map(aq => aq.Questions);
    let attemptedCount = 0;
    let correctCount = 0;
    let scoreObtained = 0;
    let totalMarksVal = 0;

    const answersDataToSave: any[] = [];

    for (const q of questions) {
      const selected = answers[q.Id.toString()];
      const isAttempted = selected !== undefined && selected !== null && selected !== "";
      const isCorrect = isAttempted && selected.trim().toUpperCase() === q.CorrectAnswer.trim().toUpperCase();

      if (isAttempted) attemptedCount++;
      if (isCorrect) {
        correctCount++;
        scoreObtained += q.Marks;
      }
      totalMarksVal += q.Marks;

      answersDataToSave.push({
        AttemptId: attemptId,
        QuestionId: q.Id,
        SelectedAnswer: isAttempted ? selected : null,
        IsCorrect: isCorrect,
        MarksObtained: isCorrect ? q.Marks : 0
      });
    }

    const unattemptedCount = questions.length - attemptedCount;
    const wrongCount = attemptedCount - correctCount;
    const percentage = totalMarksVal > 0 ? parseFloat(((scoreObtained / totalMarksVal) * 100).toFixed(2)) : 0;

    // Save student answers and update attempt in transaction
    const updated = await prisma.$transaction(async (tx) => {
      // Delete any pre-existing answers for safety
      await tx.studentAnswers.deleteMany({
        where: { AttemptId: attemptId }
      });

      // Save all answers
      await tx.studentAnswers.createMany({
        data: answersDataToSave
      });

      // Update attempt record
      return await tx.studentAttempts.update({
        where: { Id: attemptId },
        data: {
          IsSubmitted: true,
          EndTime: new Date(),
          Score: scoreObtained,
          TotalQuestions: questions.length,
          AttemptedQuestions: attemptedCount,
          UnattemptedQuestions: unattemptedCount,
          CorrectAnswers: correctCount,
          WrongAnswers: wrongCount,
          Percentage: percentage,
          Status: attempt.Status === "MALPRACTICE_TERMINATED" ? "MALPRACTICE_TERMINATED" : "SUBMITTED"
        }
      });
    });

    return NextResponse.json({
      id: updated.Id,
      score: updated.Score,
      totalMarks: totalMarksVal,
      totalQuestions: updated.TotalQuestions,
      attemptedQuestions: updated.AttemptedQuestions,
      unattemptedQuestions: updated.UnattemptedQuestions,
      correctAnswers: updated.CorrectAnswers,
      wrongAnswers: updated.WrongAnswers,
      percentage: updated.Percentage,
      status: updated.Status
    });
  } catch (err: any) {
    console.error("POST Submit Attempt Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
