import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { getUserFromRequest, hasModulePermission } from "@/utils/auth";

// GET /api/Assessments/[id]/report — admin summary report
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload || !hasModulePermission(userPayload, "assessments", "read")) {
      return NextResponse.json("Unauthorized", { status: 401 });
    }
    const { id } = await params;
    const assessmentId = parseInt(id);

    const assessment = await prisma.assessments.findUnique({ where: { Id: assessmentId } });
    if (!assessment) return NextResponse.json("Not found", { status: 404 });

    const attempts = await prisma.assessmentAttempts.findMany({
      where: { AssessmentId: assessmentId },
    });

    const submitted = attempts.filter((a) => ["Submitted", "AutoSubmitted", "Terminated"].includes(a.Status));
    const malpracticeCount = submitted.filter((a) => a.IsMalpractice).length;
    const avgMarks = submitted.length > 0 ? submitted.reduce((s, a) => s + a.MarksObtained, 0) / submitted.length : 0;
    const avgPct = submitted.length > 0 ? submitted.reduce((s, a) => s + a.Percentage, 0) / submitted.length : 0;
    const highestMarks = submitted.length > 0 ? Math.max(...submitted.map((a) => a.MarksObtained)) : 0;
    const lowestMarks = submitted.length > 0 ? Math.min(...submitted.map((a) => a.MarksObtained)) : 0;

    return NextResponse.json({
      assessmentId,
      title: assessment.Title,
      status: assessment.Status,
      totalAttempts: attempts.length,
      submittedAttempts: submitted.length,
      inProgressAttempts: attempts.filter((a) => a.Status === "InProgress").length,
      malpracticeCount,
      averageMarks: Math.round(avgMarks * 10) / 10,
      averagePercentage: Math.round(avgPct * 10) / 10,
      highestMarks,
      lowestMarks,
      departments: assessment.Departments,
    });
  } catch (err: any) {
    console.error("GET Assessment Report Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
