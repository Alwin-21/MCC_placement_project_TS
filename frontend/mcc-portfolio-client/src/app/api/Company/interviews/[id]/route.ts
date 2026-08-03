import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { getUserFromRequest } from "@/utils/auth";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = getUserFromRequest(request);
    if (!payload || payload.role !== "Company") {
      return NextResponse.json("Unauthorized", { status: 401 });
    }

    const { id } = await params;
    const interviewId = parseInt(id, 10);

    const hrUserId = parseInt(payload.nameid, 10);
    const hrUser = await prisma.companyUsers.findUnique({
      where: { Id: hrUserId }
    });

    if (!hrUser) {
      return NextResponse.json("HR User not found.", { status: 404 });
    }

    const interview = await prisma.interview.findUnique({
      where: { Id: interviewId },
      include: {
        Application: {
          include: {
            Job: true,
            Student: true
          }
        }
      }
    });

    if (!interview || interview.Application.Job.CompanyId !== hrUser.CompanyId) {
      return NextResponse.json("Interview not found or access denied.", { status: 404 });
    }

    const body = await request.json();
    const { status, scheduleTime, meetLink, venue, feedback } = body;

    const updated = await prisma.interview.update({
      where: { Id: interviewId },
      data: {
        Status: status !== undefined ? status : interview.Status,
        ScheduleTime: scheduleTime ? new Date(scheduleTime) : interview.ScheduleTime,
        MeetLink: meetLink !== undefined ? meetLink : interview.MeetLink,
        Venue: venue !== undefined ? venue : interview.Venue,
        Feedback: feedback !== undefined ? feedback : interview.Feedback
      }
    });

    // Notify student of rescheduling or cancellation
    let msg = "";
    if (status === "Cancelled") {
      msg = `Your interview for ${interview.Application.Job.Title} has been cancelled by the recruiter.`;
      
      // Also revert application status back to Shortlisted
      await prisma.jobApplication.update({
        where: { Id: interview.ApplicationId },
        data: { Status: "Shortlisted" }
      });
    } else if (status === "Rescheduled" || scheduleTime) {
      msg = `Your interview for ${interview.Application.Job.Title} has been rescheduled to ${new Date(updated.ScheduleTime).toLocaleString()}. Mode: ${updated.Type}. ${updated.MeetLink ? 'Link: ' + updated.MeetLink : ''} ${updated.Venue ? 'Venue: ' + updated.Venue : ''}`;
    } else {
      msg = `Your interview details for ${interview.Application.Job.Title} have been updated. Mode: ${updated.Type}. ${updated.MeetLink ? 'Link: ' + updated.MeetLink : ''} ${updated.Venue ? 'Venue: ' + updated.Venue : ''}`;
    }

    await prisma.notifications.create({
      data: {
        Title: status === "Cancelled" ? "Interview Cancelled" : "Interview Updated",
        Message: msg,
        Type: "placement",
        IsRead: false,
        CreatedAt: new Date(),
        UserId: interview.Application.StudentId
      }
    });

    // Logging
    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    await prisma.companyAuditLogs.create({
      data: {
        CompanyId: hrUser.CompanyId,
        Action: status === "Cancelled" ? "Interview Cancelled" : "Interview Updated",
        PerformedByEmail: hrUser.Email,
        Timestamp: new Date(),
        Details: `${status === "Cancelled" ? "Cancelled" : "Updated/Rescheduled"} interview (ID: ${interviewId}) for candidate ${interview.Application.Student.FullName}`,
        IpAddress: ip
      }
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    console.error("PUT Interview Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
