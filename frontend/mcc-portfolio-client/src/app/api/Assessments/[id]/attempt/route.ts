import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { getUserFromRequest } from "@/utils/auth";

// GET /api/Assessments/[id]/attempt — get active/existing attempt
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload || userPayload.role !== "Student") {
      return NextResponse.json("Unauthorized", { status: 401 });
    }
    const { id } = await params;
    const userId = parseInt(userPayload.nameid);
    const assessmentId = parseInt(id);

    const attempt = await prisma.assessmentAttempts.findFirst({
      where: { AssessmentId: assessmentId, UserId: userId },
      include: {
        StudentAnswers: true,
      },
      orderBy: { StartedAt: "desc" },
    });

    if (!attempt) return NextResponse.json(null);

    // Get questions (without revealing correct answers during InProgress)
    const questions = await prisma.assessmentQuestions.findMany({
      where: { AssessmentId: assessmentId },
      orderBy: { OrderIndex: "asc" },
    });

    const answerMap: Record<number, string> = {};
    attempt.StudentAnswers.forEach((a) => {
      answerMap[a.QuestionId] = a.SelectedOption;
    });

    const isCompleted = ["Submitted", "AutoSubmitted", "Terminated"].includes(attempt.Status);

    return NextResponse.json({
      attemptId: attempt.Id,
      status: attempt.Status,
      startedAt: attempt.StartedAt,
      submittedAt: attempt.SubmittedAt,
      isCompleted,
      isMalpractice: attempt.IsMalpractice,
      questions: questions.map((q) => ({
        id: q.Id,
        questionText: q.QuestionText,
        optionA: q.OptionA,
        optionB: q.OptionB,
        optionC: q.OptionC,
        optionD: q.OptionD,
        // Only expose correctOption if completed
        correctOption: isCompleted ? q.CorrectOption : undefined,
        marks: q.Marks,
        orderIndex: q.OrderIndex,
        selectedOption: answerMap[q.Id] || "",
      })),
    });
  } catch (err: any) {
    console.error("GET Attempt Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

// POST /api/Assessments/[id]/attempt — start a new attempt
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload || userPayload.role !== "Student") {
      return NextResponse.json("Unauthorized", { status: 401 });
    }
    const { id } = await params;
    const userId = parseInt(userPayload.nameid);
    const assessmentId = parseInt(id);

    const assessment = await prisma.assessments.findUnique({
      where: { Id: assessmentId },
      include: { AssessmentQuestions: true },
    });
    if (!assessment) return NextResponse.json("Assessment not found", { status: 404 });
    if (assessment.Status !== "Published") {
      return NextResponse.json("Assessment is not available.", { status: 403 });
    }

    const now = new Date();
    if (now < assessment.StartDate || now > assessment.EndDate) {
      return NextResponse.json("Assessment is not within the active time window.", { status: 403 });
    }

    // Check if already attempted
    const existing = await prisma.assessmentAttempts.findFirst({
      where: { AssessmentId: assessmentId, UserId: userId },
    });
    if (existing) {
      return NextResponse.json({ message: "You have already attempted this assessment.", attemptId: existing.Id }, { status: 409 });
    }

    const attempt = await prisma.assessmentAttempts.create({
      data: {
        AssessmentId: assessmentId,
        UserId: userId,
        StartedAt: now,
        Status: "InProgress",
        TotalQuestions: assessment.AssessmentQuestions.length,
        TotalMarks: assessment.TotalMarks,
      },
    });

    // Create proctoring session
    await prisma.proctoringSession.create({
      data: { AttemptId: attempt.Id },
    });

    // Get questions without correct answers
    const questions = assessment.AssessmentQuestions.sort((a, b) => a.OrderIndex - b.OrderIndex);

    return NextResponse.json({
      attemptId: attempt.Id,
      status: attempt.Status,
      startedAt: attempt.StartedAt,
      durationMinutes: assessment.DurationMinutes,
      questions: questions.map((q) => ({
        id: q.Id,
        questionText: q.QuestionText,
        optionA: q.OptionA,
        optionB: q.OptionB,
        optionC: q.OptionC,
        optionD: q.OptionD,
        marks: q.Marks,
        orderIndex: q.OrderIndex,
        selectedOption: "",
      })),
    });
  } catch (err: any) {
    console.error("POST Start Attempt Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
