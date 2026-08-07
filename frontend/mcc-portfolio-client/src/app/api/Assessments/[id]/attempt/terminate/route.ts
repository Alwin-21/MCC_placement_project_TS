import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { getUserFromRequest } from "@/utils/auth";

// POST /api/Assessments/[id]/attempt/terminate — terminate for malpractice
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload || userPayload.role !== "Student") {
      return NextResponse.json("Unauthorized", { status: 401 });
    }
    const userId = parseInt(userPayload.nameid);
    const { id } = await params;

    const body = await request.json();
    const { attemptId, reason } = body;

    const attempt = await prisma.assessmentAttempts.findUnique({
      where: { Id: parseInt(attemptId) },
      include: {
        StudentAnswers: true,
        Assessment: { include: { AssessmentQuestions: true } },
      },
    });

    if (!attempt || attempt.UserId !== userId) {
      return NextResponse.json("Invalid attempt", { status: 400 });
    }

    if (attempt.Status !== "InProgress") {
      return NextResponse.json({ message: "Attempt already ended." }, { status: 409 });
    }

    // Evaluate answers so far
    const questions = attempt.Assessment.AssessmentQuestions;
    const answerMap: Record<number, string> = {};
    attempt.StudentAnswers.forEach((a) => { answerMap[a.QuestionId] = a.SelectedOption; });

    let correct = 0, wrong = 0, attempted = 0, marksObtained = 0;
    for (const q of questions) {
      const sel = answerMap[q.Id] || "";
      if (sel) {
        attempted++;
        if (sel === q.CorrectOption) { correct++; marksObtained += q.Marks; }
        else wrong++;
      }
    }

    const totalMarks = attempt.TotalMarks;
    const pct = totalMarks > 0 ? (marksObtained / totalMarks) * 100 : 0;

    // Update attempt to Terminated + malpractice flag
    await prisma.assessmentAttempts.update({
      where: { Id: parseInt(attemptId) },
      data: {
        Status: "Terminated",
        IsMalpractice: true,
        SubmittedAt: new Date(),
        TotalQuestions: questions.length,
        AttemptedQuestions: attempted,
        CorrectAnswers: correct,
        WrongAnswers: wrong,
        MarksObtained: marksObtained,
        TotalMarks: totalMarks,
        Percentage: Math.round(pct * 100) / 100,
      },
    });

    // Create malpractice report
    await prisma.malpracticeReport.create({
      data: {
        AttemptId: parseInt(attemptId),
        UserId: userId,
        AssessmentId: parseInt(id),
        Reason: reason || "Four proctoring violations recorded.",
        GeneratedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, status: "Terminated" });
  } catch (err: any) {
    console.error("POST Terminate Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
