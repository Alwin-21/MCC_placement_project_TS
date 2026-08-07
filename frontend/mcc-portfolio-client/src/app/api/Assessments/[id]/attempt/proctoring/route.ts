import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { getUserFromRequest } from "@/utils/auth";

// GET /api/Assessments/[id]/attempt/proctoring — get session
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload || userPayload.role !== "Student") {
      return NextResponse.json("Unauthorized", { status: 401 });
    }
    const userId = parseInt(userPayload.nameid);
    const { id } = await params;

    const attempt = await prisma.assessmentAttempts.findFirst({
      where: { AssessmentId: parseInt(id), UserId: userId, Status: "InProgress" },
    });
    if (!attempt) return NextResponse.json("No active attempt", { status: 404 });

    const session = await prisma.proctoringSession.findUnique({
      where: { AttemptId: attempt.Id },
      include: { Warnings: { orderBy: { Timestamp: "asc" } } },
    });

    return NextResponse.json({
      sessionId: session?.Id || null,
      warningCount: session?.WarningCount ?? 0,
      warnings: session?.Warnings.map((w) => ({
        warningNum: w.WarningNum,
        warningType: w.WarningType,
        timestamp: w.Timestamp,
        details: w.Details,
      })) ?? [],
    });
  } catch (err: any) {
    console.error("GET Proctoring Session Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

// POST /api/Assessments/[id]/attempt/proctoring — log a warning
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload || userPayload.role !== "Student") {
      return NextResponse.json("Unauthorized", { status: 401 });
    }
    const userId = parseInt(userPayload.nameid);
    const { id } = await params;

    const body = await request.json();
    const { attemptId, warningType, details } = body;

    const attempt = await prisma.assessmentAttempts.findUnique({ where: { Id: parseInt(attemptId) } });
    if (!attempt || attempt.UserId !== userId || attempt.Status !== "InProgress") {
      return NextResponse.json("Invalid attempt", { status: 400 });
    }

    let session = await prisma.proctoringSession.findUnique({ where: { AttemptId: parseInt(attemptId) } });
    if (!session) {
      session = await prisma.proctoringSession.create({ data: { AttemptId: parseInt(attemptId) } });
    }

    const newWarningCount = session.WarningCount + 1;

    await prisma.proctoringWarnings.create({
      data: {
        SessionId: session.Id,
        WarningNum: newWarningCount,
        WarningType: warningType || "Unknown",
        Timestamp: new Date(),
        Details: details || "",
      },
    });

    await prisma.proctoringSession.update({
      where: { Id: session.Id },
      data: { WarningCount: newWarningCount },
    });

    return NextResponse.json({
      success: true,
      warningNum: newWarningCount,
      shouldTerminate: newWarningCount >= 4,
    });
  } catch (err: any) {
    console.error("POST Proctoring Warning Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
