import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { getUserFromRequest } from "@/utils/auth";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload) {
      return NextResponse.json("Unauthorized", { status: 401 });
    }

    const { id } = await params;
    const attemptId = parseInt(id);
    const body = await request.json();
    const { warningNumber, warningType, eventInfo, currentAnswers } = body;

    if (!warningNumber || !warningType) {
      return NextResponse.json("Missing required fields (warningNumber, warningType).", { status: 400 });
    }

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
      return NextResponse.json("Attempt is already submitted or closed", { status: 400 });
    }

    let session = await prisma.proctoringSession.findUnique({ where: { AttemptId: attemptId } });
    if (!session) {
      session = await prisma.proctoringSession.create({
        data: { AttemptId: attemptId, WarningCount: 0 }
      });
    }

    const warning = await prisma.proctoringWarnings.create({
      data: {
        SessionId: session.Id,
        WarningNum: warningNumber,
        WarningType: warningType,
        Details: eventInfo || "",
        Timestamp: new Date()
      }
    });

    await prisma.proctoringSession.update({
      where: { Id: session.Id },
      data: { WarningCount: warningNumber }
    });

    let terminated = false;
    
    if (body.forceTerminate) {
      terminated = true;

      let attemptedCount = 0;
      let correctCount = 0;
      let scoreObtained = 0;
      const questions = attempt.Assessment.AssessmentQuestions;
      const answersDataToSave: any[] = [];

      for (const q of questions) {
        const selected = currentAnswers ? currentAnswers[q.Id.toString()] : null;
        const isAttempted = selected !== undefined && selected !== null && selected !== "";
        const isCorrect = isAttempted && selected.trim().toUpperCase() === q.CorrectOption.trim().toUpperCase();

        if (isAttempted) attemptedCount++;
        if (isCorrect) {
          correctCount++;
          scoreObtained += q.Marks;
        }

        answersDataToSave.push({
          AttemptId: attemptId,
          QuestionId: q.Id,
          SelectedOption: isAttempted ? selected : "",
          IsCorrect: isCorrect
        });
      }

      const wrongCount = attemptedCount - correctCount;
      const totalMarksVal = attempt.TotalMarks || 1;
      const percentage = parseFloat(((scoreObtained / totalMarksVal) * 100).toFixed(2));

      await prisma.$transaction(async (tx) => {
        if (answersDataToSave.length > 0) {
          await tx.studentAnswers.deleteMany({
            where: { AttemptId: attemptId }
          });
          await tx.studentAnswers.createMany({
            data: answersDataToSave
          });
        }

        await tx.assessmentAttempts.update({
          where: { Id: attemptId },
          data: {
            SubmittedAt: new Date(),
            MarksObtained: scoreObtained,
            AttemptedQuestions: attemptedCount,
            CorrectAnswers: correctCount,
            WrongAnswers: wrongCount,
            Percentage: percentage,
            Status: "Terminated",
            IsMalpractice: true
          }
        });

        const student = await tx.users.findUnique({
          where: { Id: attempt.UserId }
        });

        const studentDetails = student 
          ? `Student ${student.FullName} (Reg: ${student.RegisterNumber})`
          : `Student ID ${attempt.UserId}`;

        await tx.malpracticeReport.create({
          data: {
            UserId: attempt.UserId,
            AssessmentId: attempt.AssessmentId,
            AttemptId: attemptId,
            Reason: warningType,
            GeneratedAt: new Date()
          }
        });
      });
    }

    return NextResponse.json({
      success: true,
      warningId: warning.Id,
      terminated
    });
  } catch (err: any) {
    console.error("POST Warning Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
