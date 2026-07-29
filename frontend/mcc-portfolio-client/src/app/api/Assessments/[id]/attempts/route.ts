import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { getUserFromRequest, hasModulePermission } from "@/utils/auth";

// GET /api/Assessments/[id]/attempts — admin view all attempts for an assessment
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload || !hasModulePermission(userPayload, "assessments", "read")) {
      return NextResponse.json("Unauthorized", { status: 401 });
    }
    const { id } = await params;

    const attempts = await prisma.assessmentAttempts.findMany({
      where: { AssessmentId: parseInt(id) },
      include: {
        User: { select: { FullName: true, Email: true, Department: true, RegisterNumber: true } },
        ProctoringSession: {
          include: { Warnings: { orderBy: { Timestamp: "asc" } } },
        },
        MalpracticeReport: true,
      },
      orderBy: { StartedAt: "desc" },
    });

    return NextResponse.json(
      attempts.map((a) => ({
        id: a.Id,
        userId: a.UserId,
        studentName: a.User.FullName,
        studentEmail: a.User.Email,
        studentDept: a.User.Department,
        registerNumber: a.User.RegisterNumber,
        status: a.Status,
        isMalpractice: a.IsMalpractice,
        startedAt: a.StartedAt,
        submittedAt: a.SubmittedAt,
        totalQuestions: a.TotalQuestions,
        attemptedQuestions: a.AttemptedQuestions,
        correctAnswers: a.CorrectAnswers,
        wrongAnswers: a.WrongAnswers,
        marksObtained: a.MarksObtained,
        totalMarks: a.TotalMarks,
        percentage: a.Percentage,
        warningCount: a.ProctoringSession?.WarningCount ?? 0,
        warnings: a.ProctoringSession?.Warnings.map((w) => ({
          id: w.Id,
          warningNum: w.WarningNum,
          warningType: w.WarningType,
          timestamp: w.Timestamp,
          details: w.Details,
        })) ?? [],
        malpracticeReport: a.MalpracticeReport
          ? {
              id: a.MalpracticeReport.Id,
              reason: a.MalpracticeReport.Reason,
              generatedAt: a.MalpracticeReport.GeneratedAt,
            }
          : null,
      }))
    );
  } catch (err: any) {
    console.error("GET Assessment Attempts Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
