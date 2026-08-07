import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { getUserFromRequest } from "@/utils/auth";

// Full recruitment pipeline statuses — must match frontend + schema
const VALID_STATUSES = [
  "Applied",
  "Reviewed",
  "Shortlisted",
  "InterviewScheduled",
  "Selected",
  "Offer Sent",
  "Offer Accepted",
  "Joined",
  "Rejected",
];

function buildNotificationMessage(status: string, jobTitle: string, companyName: string): string {
  switch (status) {
    case "Reviewed":
      return `Your application for '${jobTitle}' at ${companyName} is under review. Stay tuned!`;
    case "Shortlisted":
      return `Great news! You have been shortlisted for '${jobTitle}' at ${companyName}. Keep an eye on your portal.`;
    case "InterviewScheduled":
      return `Congratulations! You have been scheduled for an interview for '${jobTitle}' at ${companyName}. Check your portal for date and meeting details.`;
    case "Selected":
      return `You have been selected for '${jobTitle}' at ${companyName}! An offer letter will be shared soon.`;
    case "Offer Sent":
      return `${companyName} has sent you an offer letter for the '${jobTitle}' position. Please review and respond in the portal.`;
    case "Offer Accepted":
      return `You have accepted the offer from ${companyName} for '${jobTitle}'. Congratulations on your placement!`;
    case "Joined":
      return `Your joining has been confirmed at ${companyName} for '${jobTitle}'. Congratulations on starting your journey!`;
    case "Rejected":
      return `Thank you for applying to '${jobTitle}' at ${companyName}. Unfortunately, your application was not shortlisted this time. Best of luck!`;
    default:
      return `Your application status for '${jobTitle}' at ${companyName} has been updated to: ${status}.`;
  }
}

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
    const applicationId = parseInt(id, 10);
    if (isNaN(applicationId)) {
      return NextResponse.json("Invalid application ID.", { status: 400 });
    }

    const hrUserId = parseInt(payload.nameid, 10);
    const hrUser = await prisma.companyUsers.findUnique({
      where: { Id: hrUserId },
      include: { Company: true },
    });

    if (!hrUser) {
      return NextResponse.json("HR User not found.", { status: 404 });
    }

    const app = await prisma.jobApplication.findUnique({
      where: { Id: applicationId },
      include: { Job: true, Student: true },
    });

    if (!app || app.Job.CompanyId !== hrUser.CompanyId) {
      return NextResponse.json("Application not found.", { status: 404 });
    }

    const body = await request.json();
    const { status } = body;

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        `Invalid status value. Allowed values: ${VALID_STATUSES.join(", ")}`,
        { status: 400 }
      );
    }

    const updatedApp = await prisma.jobApplication.update({
      where: { Id: applicationId },
      data: { Status: status },
    });

    // Write Company Audit Log
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "127.0.0.1";
    await prisma.companyAuditLogs.create({
      data: {
        CompanyId: hrUser.CompanyId,
        Action: `Application Status Updated: ${status}`,
        PerformedByEmail: hrUser.Email,
        Timestamp: new Date(),
        Details: `Hiring status for student '${app.Student.FullName}' updated to '${status}' for job: '${app.Job.Title}'`,
        IpAddress: ip,
      },
    });

    // Dispatch notification to student
    const messageText = buildNotificationMessage(status, app.Job.Title, hrUser.Company.Name);
    await prisma.notifications.create({
      data: {
        Title: `Application Update — ${status}`,
        Message: messageText,
        Type: "JobStatusChange",
        IsRead: false,
        CreatedAt: new Date(),
        UserId: app.StudentId,
      },
    });

    return NextResponse.json(updatedApp);
  } catch (err: any) {
    console.error("PUT Application Status Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
