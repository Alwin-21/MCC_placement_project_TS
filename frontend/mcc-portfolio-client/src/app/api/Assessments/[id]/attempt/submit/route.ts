import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { getUserFromRequest } from "@/utils/auth";

async function evaluateAndSave(attemptId: number, finalStatus: string) {
  const attempt = await prisma.assessmentAttempts.findUnique({
    where: { Id: attemptId },
    include: {
      StudentAnswers: true,
      Assessment: { include: { AssessmentQuestions: true } },
    },
  });
  if (!attempt) return null;

  const questions = attempt.Assessment.AssessmentQuestions;
  const answers = attempt.StudentAnswers;
  const answerMap: Record<number, string> = {};
  answers.forEach((a) => { answerMap[a.QuestionId] = a.SelectedOption; });

  let correct = 0;
  let wrong = 0;
  let attempted = 0;
  let marksObtained = 0;

  for (const q of questions) {
    const sel = answerMap[q.Id] || "";
    if (sel) {
      attempted++;
      if (sel === q.CorrectOption) {
        correct++;
        marksObtained += q.Marks;
      } else {
        wrong++;
      }
    }
  }

  const totalQ = questions.length;
  const totalMarks = attempt.TotalMarks || questions.reduce((s, q) => s + q.Marks, 0);
  const pct = totalMarks > 0 ? (marksObtained / totalMarks) * 100 : 0;

  await prisma.assessmentAttempts.update({
    where: { Id: attemptId },
    data: {
      Status: finalStatus,
      SubmittedAt: new Date(),
      TotalQuestions: totalQ,
      AttemptedQuestions: attempted,
      CorrectAnswers: correct,
      WrongAnswers: wrong,
      MarksObtained: marksObtained,
      TotalMarks: totalMarks,
      Percentage: Math.round(pct * 100) / 100,
    },
  });

  return { totalQ, attempted, correct, wrong, marksObtained, totalMarks, pct };
}

// POST /api/Assessments/[id]/attempt/submit — submit + evaluate
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload || userPayload.role !== "Student") {
      return NextResponse.json("Unauthorized", { status: 401 });
    }
    const userId = parseInt(userPayload.nameid);
    const { id } = await params;

    const body = await request.json();
    const { attemptId, autoSubmit } = body;

    const attempt = await prisma.assessmentAttempts.findUnique({ where: { Id: parseInt(attemptId) } });
    if (!attempt || attempt.UserId !== userId) {
      return NextResponse.json("Invalid attempt", { status: 400 });
    }
    if (attempt.Status !== "InProgress") {
      return NextResponse.json({ message: "Attempt already completed." }, { status: 409 });
    }

    const finalStatus = autoSubmit ? "AutoSubmitted" : "Submitted";
    const result = await evaluateAndSave(parseInt(attemptId), finalStatus);
    if (!result) return NextResponse.json({ message: "Evaluation failed." }, { status: 500 });

    return NextResponse.json({ success: true, status: finalStatus, ...result });
  } catch (err: any) {
    console.error("POST Submit Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
