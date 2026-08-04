import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { getUserFromRequest } from "@/utils/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = getUserFromRequest(request);
    if (!payload || payload.role !== "Company") {
      return NextResponse.json("Unauthorized", { status: 401 });
    }

    const { id } = await params;
    const assessmentId = parseInt(id, 10);

    const assessment = await prisma.assessments.findUnique({
      where: { Id: assessmentId }
    });

    if (!assessment) {
      return NextResponse.json("Assessment not found.", { status: 404 });
    }

    // Query attempts with student details
    const attempts = await prisma.assessmentAttempts.findMany({
      where: {
        AssessmentId: assessmentId,
        Status: "Submitted"
      },
      include: {
        User: true
      },
      orderBy: {
        MarksObtained: "desc"
      }
    });

    // Map to formatted list with rank
    const rankedResults = attempts.map((attempt, index) => ({
      rank: index + 1,
      attemptId: attempt.Id,
      studentId: attempt.UserId,
      studentName: attempt.User.FullName,
      studentEmail: attempt.User.Email,
      studentDept: attempt.User.Department,
      registerNumber: attempt.User.RegisterNumber,
      marksObtained: attempt.MarksObtained,
      totalMarks: attempt.TotalMarks,
      percentage: attempt.Percentage,
      submittedAt: attempt.SubmittedAt,
      isMalpractice: attempt.IsMalpractice
    }));

    return NextResponse.json(rankedResults);
  } catch (err: any) {
    console.error("GET Assessment Results Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
