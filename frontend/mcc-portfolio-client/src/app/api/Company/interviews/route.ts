import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { getUserFromRequest } from "@/utils/auth";

export async function POST(request: Request) {
  try {
    const payload = getUserFromRequest(request);
    if (!payload || payload.role !== "Company") {
      return NextResponse.json("Unauthorized", { status: 401 });
    }

    const hrUserId = parseInt(payload.nameid, 10);
    const hrUser = await prisma.companyUsers.findUnique({
      where: { Id: hrUserId }
    });

    if (!hrUser) {
      return NextResponse.json("HR User not found.", { status: 404 });
    }

    const body = await request.json();
    const {
      applicationId,
      type, // "Online", "Offline", "Campus"
      scheduleTime,
      meetLink = "",
      venue = "",
      feedback = ""
    } = body;

    if (!applicationId || !type || !scheduleTime) {
      return NextResponse.json("Application ID, interview type, and schedule time are required.", { status: 400 });
    }

    const appId = parseInt(applicationId, 10);
    const app = await prisma.jobApplication.findUnique({
      where: { Id: appId },
      include: {
        Job: true,
        Student: true
      }
    });

    if (!app || app.Job.CompanyId !== hrUser.CompanyId) {
      return NextResponse.json("Application not found or access denied.", { status: 404 });
    }

    // Create interview
    const interview = await prisma.interview.create({
      data: {
        ApplicationId: appId,
        Type: type,
        ScheduleTime: new Date(scheduleTime),
        MeetLink: meetLink,
        Venue: venue,
        Status: "Scheduled",
        Feedback: feedback
      }
    });

    // Update Application Status to InterviewScheduled
    await prisma.jobApplication.update({
      where: { Id: appId },
      data: { Status: "InterviewScheduled" }
    });

    // Notify candidate student
    await prisma.notifications.create({
      data: {
        Title: "Interview Scheduled!",
        Message: `An interview for ${app.Job.Title} has been scheduled on ${new Date(scheduleTime).toLocaleString()}. Mode: ${type}. ${meetLink ? 'Link: ' + meetLink : ''} ${venue ? 'Venue: ' + venue : ''}`,
        Type: "placement",
        IsRead: false,
        CreatedAt: new Date(),
        UserId: app.StudentId
      }
    });

    // Logging
    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    await prisma.companyAuditLogs.create({
      data: {
        CompanyId: hrUser.CompanyId,
        Action: "Interview Scheduled",
        PerformedByEmail: hrUser.Email,
        Timestamp: new Date(),
        Details: `Scheduled an interview for candidate ${app.Student.FullName} (App ID: ${appId})`,
        IpAddress: ip
      }
    });

    return NextResponse.json(interview);
  } catch (err: any) {
    console.error("POST Interview Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
