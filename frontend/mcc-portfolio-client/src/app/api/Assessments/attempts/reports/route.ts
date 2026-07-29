import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { getUserFromRequest, hasModulePermission } from "@/utils/auth";

export async function GET(request: Request) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload || !hasModulePermission(userPayload, "assessments", "read")) {
      return NextResponse.json("Unauthorized", { status: 401 });
    }

    const attempts = await prisma.assessmentAttempts.findMany({
      include: {
        User: {
          select: {
            FullName: true,
            RegisterNumber: true,
            Department: true
          }
        },
        Assessment: {
          select: {
            Title: true,
            TotalMarks: true
          }
        },
        ProctoringSession: {
          include: {
            Warnings: true
          }
        }
      },
      orderBy: { StartedAt: "desc" }
    });

    const formattedAttempts = attempts.map((att: any) => ({
      id: att.Id,
      studentName: att.User?.FullName || "Student",
      registerNumber: att.User?.RegisterNumber || "",
      department: att.User?.Department || "",
      assessmentTitle: att.Assessment?.Title || "",
      assessmentTotalMarks: att.Assessment?.TotalMarks || 0,
      startTime: att.StartedAt,
      endTime: att.SubmittedAt,
      score: att.MarksObtained,
      percentage: att.Percentage,
      status: att.Status,
      warningsCount: att.ProctoringSession?.WarningCount || 0,
      warnings: (att.ProctoringSession?.Warnings || []).map((w: any) => ({
        id: w.Id,
        warningNumber: w.WarningNum,
        warningType: w.WarningType,
        timestamp: w.Timestamp,
        eventInfo: w.Details
      }))
    }));

    const malpractice = await prisma.malpracticeReport.findMany({
      include: {
        User: {
          select: {
            FullName: true,
            RegisterNumber: true,
            Department: true
          }
        },
        Attempt: {
          include: {
            Assessment: {
              select: {
                Title: true
              }
            }
          }
        }
      },
      orderBy: { GeneratedAt: "desc" }
    });

    const formattedMalpractice = malpractice.map((m: any) => ({
      id: m.Id,
      studentName: m.User?.FullName || "Student",
      registerNumber: m.User?.RegisterNumber || "",
      department: m.User?.Department || "",
      assessmentTitle: m.Attempt?.Assessment?.Title || "",
      timestamp: m.GeneratedAt,
      details: m.Reason,
      attemptId: m.AttemptId
    }));

    return NextResponse.json({
      attempts: formattedAttempts,
      malpractice: formattedMalpractice
    });
  } catch (err: any) {
    console.error("GET Assessment Reports Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
