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
    const body = await request.json(); // { warningNumber: number, warningType: string, eventInfo: string, currentAnswers?: any }
    const { warningNumber, warningType, eventInfo, currentAnswers } = body;

    if (!warningNumber || !warningType) {
      return NextResponse.json("Missing required fields (warningNumber, warningType).", { status: 400 });
    }

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
      return NextResponse.json("Attempt is already submitted or closed", { status: 400 });
    }

    // Save warning entry
    const warning = await prisma.proctoringWarnings.create({
      data: {
        AttemptId: attemptId,
        WarningNumber: warningNumber,
        WarningType: warningType,
        EventInfo: eventInfo || "",
        Timestamp: new Date()
      }
    });

    let terminated = false;

    if (warningNumber >= 4) {
      terminated = true;

      // Evaluate score so far if currentAnswers is provided
      let attemptedCount = 0;
      let correctCount = 0;
      let scoreObtained = 0;
      const questions = attempt.Assessments.AssessmentQuestions.map(aq => aq.Questions);
      const answersDataToSave: any[] = [];

      for (const q of questions) {
        const selected = currentAnswers ? currentAnswers[q.Id.toString()] : null;
        const isAttempted = selected !== undefined && selected !== null && selected !== "";
        const isCorrect = isAttempted && selected.trim().toUpperCase() === q.CorrectAnswer.trim().toUpperCase();

        if (isAttempted) attemptedCount++;
        if (isCorrect) {
          correctCount++;
          scoreObtained += q.Marks;
        }

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

      await prisma.$transaction(async (tx) => {
        // Save student answers so far
        if (answersDataToSave.length > 0) {
          await tx.studentAnswers.deleteMany({
            where: { AttemptId: attemptId }
          });
          await tx.studentAnswers.createMany({
            data: answersDataToSave
          });
        }

        // Close attempt as malpractice terminated
        await tx.studentAttempts.update({
          where: { Id: attemptId },
          data: {
            IsSubmitted: true,
            EndTime: new Date(),
            Score: scoreObtained,
            AttemptedQuestions: attemptedCount,
            UnattemptedQuestions: unattemptedCount,
            CorrectAnswers: correctCount,
            WrongAnswers: wrongCount,
            Status: "MALPRACTICE_TERMINATED"
          }
        });

        // Fetch student's details
        const student = await tx.users.findUnique({
          where: { Id: attempt.StudentId }
        });

        const studentDetails = student 
          ? `Student ${student.FullName} (Reg: ${student.RegisterNumber})`
          : `Student ID ${attempt.StudentId}`;

        // Create malpractice report
        await tx.malpracticeReports.create({
          data: {
            StudentId: attempt.StudentId,
            AssessmentId: attempt.AssessmentId,
            AttemptId: attemptId,
            Timestamp: new Date(),
            Details: `Assessment auto-terminated due to Warning 4. Warned for: ${warningType}. Log: ${eventInfo}. ${studentDetails}`
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
    console.error("POST Proctoring Warning error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
