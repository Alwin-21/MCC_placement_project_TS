import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { getUserFromRequest } from "@/utils/auth";

// GET /api/Assessments/[id]/attempt/result — get result after submission
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload || userPayload.role !== "Student") {
      return NextResponse.json("Unauthorized", { status: 401 });
    }
    const userId = parseInt(userPayload.nameid);
    const { id } = await params;

    const attempt = await prisma.assessmentAttempts.findFirst({
      where: { AssessmentId: parseInt(id), UserId: userId },
      include: {
        Assessment: { select: { Title: true, TotalMarks: true } },
        StudentAnswers: {
          include: { Question: true },
        },
        MalpracticeReport: true,
      },
      orderBy: { StartedAt: "desc" },
    });

    if (!attempt) return NextResponse.json("No attempt found", { status: 404 });

    const isCompleted = ["Submitted", "AutoSubmitted", "Terminated"].includes(attempt.Status);
    if (!isCompleted) return NextResponse.json("Attempt not yet submitted.", { status: 400 });

    return NextResponse.json({
      attemptId: attempt.Id,
      assessmentTitle: attempt.Assessment.Title,
      status: attempt.Status,
      isMalpractice: attempt.IsMalpractice,
      startedAt: attempt.StartedAt,
      submittedAt: attempt.SubmittedAt,
      totalQuestions: attempt.TotalQuestions,
      attemptedQuestions: attempt.AttemptedQuestions,
      unattemptedQuestions: attempt.TotalQuestions - attempt.AttemptedQuestions,
      correctAnswers: attempt.CorrectAnswers,
      wrongAnswers: attempt.WrongAnswers,
      marksObtained: attempt.MarksObtained,
      totalMarks: attempt.TotalMarks,
      percentage: attempt.Percentage,
      malpracticeReason: attempt.MalpracticeReport?.Reason || null,
      answers: attempt.StudentAnswers.map((a) => ({
        questionId: a.QuestionId,
        questionText: a.Question.QuestionText,
        optionA: a.Question.OptionA,
        optionB: a.Question.OptionB,
        optionC: a.Question.OptionC,
        optionD: a.Question.OptionD,
        selectedOption: a.SelectedOption,
        correctOption: a.Question.CorrectOption,
        isCorrect: a.IsCorrect,
        marks: a.Question.Marks,
      })),
    });
  } catch (err: any) {
    console.error("GET Result Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
