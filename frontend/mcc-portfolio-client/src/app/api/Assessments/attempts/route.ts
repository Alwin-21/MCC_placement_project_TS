import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { getUserFromRequest } from "@/utils/auth";

export async function POST(request: Request) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload) {
      return NextResponse.json("Unauthorized", { status: 401 });
    }

    const userId = parseInt(userPayload.nameid);
    const body = await request.json();
    const { assessmentId } = body;

    if (!assessmentId) {
      return NextResponse.json("assessmentId is required", { status: 400 });
    }

    const aid = parseInt(assessmentId);

    const existing = await prisma.assessmentAttempts.findFirst({
      where: {
        UserId: userId,
        AssessmentId: aid
      }
    });

    if (existing) {
      return NextResponse.json({
        id: existing.Id,
        startedAt: existing.StartedAt,
        status: existing.Status,
        marksObtained: existing.MarksObtained
      });
    }

    const assessment = await prisma.assessments.findUnique({
      where: { Id: aid },
      include: {
        AssessmentQuestions: true
      }
    });

    if (!assessment) {
      return NextResponse.json("Assessment not found", { status: 404 });
    }

    if (assessment.Status !== "Published") {
      return NextResponse.json("Assessment is currently closed or unpublished", { status: 400 });
    }

    const now = new Date();
    if (now < new Date(assessment.StartDate) || now > new Date(assessment.EndDate)) {
      return NextResponse.json("Assessment is outside the active testing window", { status: 400 });
    }

    const attempt = await prisma.assessmentAttempts.create({
      data: {
        UserId: userId,
        AssessmentId: aid,
        StartedAt: now,
        Status: "InProgress",
        TotalQuestions: assessment.AssessmentQuestions.length,
        TotalMarks: assessment.TotalMarks
      }
    });

    return NextResponse.json({
      id: attempt.Id,
      startedAt: attempt.StartedAt,
      status: attempt.Status
    });
  } catch (err: any) {
    console.error("POST Attempt Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
