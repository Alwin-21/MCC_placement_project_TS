import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { getUserFromRequest } from "@/utils/auth";

/**
 * POST /api/Assessments/[id]/attempt/device-info
 *
 * Stores the student's device information as a special ProctoringWarnings entry
 * (WarningType = "DeviceInfo") so it is visible in the proctoring session log
 * without requiring a schema migration.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload || userPayload.role !== "Student") {
      return NextResponse.json("Unauthorized", { status: 401 });
    }
    const userId = parseInt(userPayload.nameid);
    const { id } = await params;

    const body = await request.json();
    const { attemptId, deviceInfo } = body;

    if (!attemptId || !deviceInfo) {
      return NextResponse.json({ message: "attemptId and deviceInfo are required" }, { status: 400 });
    }

    // Validate ownership
    const attempt = await prisma.assessmentAttempts.findUnique({
      where: { Id: parseInt(attemptId) },
    });
    if (!attempt || attempt.UserId !== userId || attempt.AssessmentId !== parseInt(id)) {
      return NextResponse.json("Invalid attempt", { status: 400 });
    }

    // Ensure proctoring session exists
    let session = await prisma.proctoringSession.findUnique({
      where: { AttemptId: parseInt(attemptId) },
    });
    if (!session) {
      session = await prisma.proctoringSession.create({
        data: { AttemptId: parseInt(attemptId) },
      });
    }

    // Store device info JSON as a special "DeviceInfo" warning entry
    await prisma.proctoringWarnings.create({
      data: {
        SessionId: session.Id,
        WarningNum: 0, // 0 indicates device info, not a violation
        WarningType: "DeviceInfo",
        Timestamp: new Date(),
        Details: JSON.stringify(deviceInfo),
      },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("POST Device Info Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
