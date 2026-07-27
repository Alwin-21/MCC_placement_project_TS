import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { getUserFromRequest } from "@/utils/auth";

export async function GET(request: Request) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload || (userPayload.role !== "Admin" && userPayload.role !== "Moderator")) {
      return NextResponse.json("Unauthorized", { status: 401 });
    }

    // Fetch all student attempts with details
    const attempts = await prisma.studentAttempts.findMany({
      include: {
        Users: {
          select: {
            FullName: true,
            RegisterNumber: true,
            Department: true
          }
        },
        Assessments: {
          select: {
            Title: true,
            TotalMarks: true
          }
        },
        ProctoringWarnings: true
      },
      orderBy: { StartTime: "desc" }
    });

    const formattedAttempts = attempts.map(att => ({
      id: att.Id,
      studentName: att.Users.FullName,
      registerNumber: att.Users.RegisterNumber,
      department: att.Users.Department,
      assessmentTitle: att.Assessments.Title,
      assessmentTotalMarks: att.Assessments.TotalMarks,
      startTime: att.StartTime,
      endTime: att.EndTime,
      score: att.Score,
      percentage: att.Percentage,
      status: att.Status,
      warningsCount: att.ProctoringWarnings.length,
      warnings: att.ProctoringWarnings.map(w => ({
        id: w.Id,
        warningNumber: w.WarningNumber,
        warningType: w.WarningType,
        timestamp: w.Timestamp,
        eventInfo: w.EventInfo
      }))
    }));

    // Fetch all malpractice reports
    const malpractice = await prisma.malpracticeReports.findMany({
      include: {
        Users: {
          select: {
            FullName: true,
            RegisterNumber: true,
            Department: true
          }
        },
        Assessments: {
          select: {
            Title: true
          }
        }
      },
      orderBy: { Timestamp: "desc" }
    });

    const formattedMalpractice = malpractice.map(m => ({
      id: m.Id,
      studentName: m.Users.FullName,
      registerNumber: m.Users.RegisterNumber,
      department: m.Users.Department,
      assessmentTitle: m.Assessments.Title,
      timestamp: m.Timestamp,
      details: m.Details,
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
