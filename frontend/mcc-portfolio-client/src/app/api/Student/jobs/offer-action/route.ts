import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { getUserFromRequest } from "@/utils/auth";

export async function POST(request: Request) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload || userPayload.role !== "Student") {
      return NextResponse.json("Unauthorized", { status: 401 });
    }

    const userId = parseInt(userPayload.nameid, 10);
    const body = await request.json();
    const { applicationId, action, feedback = "" } = body;

    if (!applicationId || !action) {
      return NextResponse.json("Application ID and action are required.", { status: 400 });
    }

    const app = await prisma.jobApplication.findFirst({
      where: {
        Id: parseInt(applicationId, 10),
        StudentId: userId
      },
      include: {
        Job: true
      }
    });

    if (!app) {
      return NextResponse.json("Application details not found.", { status: 404 });
    }

    if (app.Status !== "Offered" && app.Status !== "Offer Sent") {
      return NextResponse.json("Offer is not released yet or has already been processed.", { status: 400 });
    }

    let finalStatus = "";
    let offerStatusVal = "";

    if (action === "Accept") {
      finalStatus = "Offer Accepted";
      offerStatusVal = "Accepted";
    } else if (action === "Reject") {
      finalStatus = "Rejected";
      offerStatusVal = "Rejected";
    } else {
      return NextResponse.json("Invalid action. Supported: Accept, Reject.", { status: 400 });
    }

    const updatedApp = await prisma.jobApplication.update({
      where: { Id: app.Id },
      data: {
        Status: finalStatus,
        OfferStatus: offerStatusVal,
        OfferFeedback: feedback
      }
    });

    // Logging & Notifications
    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    await prisma.auditLogs.create({
      data: {
        Action: `Offer ${offerStatusVal}`,
        PerformedByEmail: userPayload.email,
        Timestamp: new Date(),
        Details: `Student ${action}ed offer letter for job '${app.Job.Title}'`,
        IpAddress: ip,
      }
    });

    await prisma.companyAuditLogs.create({
      data: {
        CompanyId: app.Job.CompanyId,
        Action: `Offer ${offerStatusVal}`,
        PerformedByEmail: userPayload.email,
        Timestamp: new Date(),
        Details: `Candidate ${userPayload.email} ${action}ed offer for job: ${app.Job.Title}. Feedback: ${feedback}`,
        IpAddress: ip,
      }
    });

    // Create a notification for the recruiter
    const hrUsers = await prisma.companyUsers.findMany({
      where: { CompanyId: app.Job.CompanyId }
    });
    // Wait, do we want to notify HR users? Yes, or add notification row for student or simply company stats.
    // Let's create an institutional notification or alert. 
    // We can create a notification for the student too to confirm their action.
    await prisma.notifications.create({
      data: {
        Title: `Offer Action: ${action}ed`,
        Message: `You have successfully ${action.toLowerCase()}ed the offer from ${app.Job.CompanyId} for the role of ${app.Job.Title}.`,
        Type: "placement",
        IsRead: false,
        CreatedAt: new Date(),
        UserId: userId
      }
    });

    return NextResponse.json({
      success: true,
      message: `Offer ${action.toLowerCase()}ed successfully.`,
      application: updatedApp
    });
  } catch (err: any) {
    console.error("POST Offer Action Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
