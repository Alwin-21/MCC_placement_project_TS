import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { getUserFromRequest } from "@/utils/auth";

export async function POST(request: Request) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload) {
      return NextResponse.json("Unauthorized", { status: 401 });
    }

    const studentId = parseInt(userPayload.nameid);
    const body = await request.json();
    const { assessmentId } = body;

    if (!assessmentId) {
      return NextResponse.json("assessmentId is required", { status: 400 });
    }

    const aid = parseInt(assessmentId);

    // Check if there is already an active or completed attempt
    const existing = await prisma.studentAttempts.findFirst({
      where: {
        StudentId: studentId,
        AssessmentId: aid
      }
    });

    if (existing) {
      return NextResponse.json({
        id: existing.Id,
        startTime: existing.StartTime,
        isSubmitted: existing.IsSubmitted,
        status: existing.Status,
        score: existing.Score
      });
    }

    // Verify assessment exists and is open for student
    const assessment = await prisma.assessments.findUnique({
      where: { Id: aid },
      include: {
        AssessmentQuestions: true
      }
    });

    if (!assessment) {
      return NextResponse.json("Assessment not found", { status: 404 });
    }

    if (!assessment.IsPublished || assessment.IsClosed) {
      return NextResponse.json("Assessment is currently closed or unpublished", { status: 400 });
    }

    const now = new Date();
    if (now < new Date(assessment.StartDate) || now > new Date(assessment.EndDate)) {
      return NextResponse.json("Assessment is outside the active testing window", { status: 400 });
    }

    const attempt = await prisma.studentAttempts.create({
      data: {
        StudentId: studentId,
        AssessmentId: aid,
        StartTime: now,
        IsSubmitted: false,
        Status: "IN_PROGRESS",
        TotalQuestions: assessment.AssessmentQuestions.length
      }
    });

    return NextResponse.json({
      id: attempt.Id,
      startTime: attempt.StartTime,
      isSubmitted: attempt.IsSubmitted,
      status: attempt.Status
    });
  } catch (err: any) {
    console.error("POST Start Attempt Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
