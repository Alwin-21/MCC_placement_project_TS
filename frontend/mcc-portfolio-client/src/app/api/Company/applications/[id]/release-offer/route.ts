import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { getUserFromRequest } from "@/utils/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const applicationId = parseInt(id, 10);

    const app = await prisma.jobApplication.findUnique({
      where: { Id: applicationId },
      include: {
        Job: true,
        Student: true
      }
    });

    if (!app || app.Job.CompanyId !== hrUser.CompanyId) {
      return NextResponse.json("Application not found or access denied.", { status: 404 });
    }

    const body = await request.json();
    const { offerLetterUrl } = body;

    if (!offerLetterUrl || offerLetterUrl.trim() === "") {
      return NextResponse.json("Offer Letter URL is required.", { status: 400 });
    }

    const updated = await prisma.jobApplication.update({
      where: { Id: applicationId },
      data: {
        Status: "Offer Sent",
        OfferStatus: "Sent",
        OfferLetterUrl: offerLetterUrl,
        OfferReleasedAt: new Date()
      }
    });

    // Student notification
    await prisma.notifications.create({
      data: {
        Title: "Offer Letter Released!",
        Message: `Congratulations! ${app.Job.CompanyId} has released an offer letter for the role of ${app.Job.Title}. Please check your application status board to accept or reject the offer.`,
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
        Action: "Offer Letter Released",
        PerformedByEmail: hrUser.Email,
        Timestamp: new Date(),
        Details: `Released an offer letter to candidate ${app.Student.FullName} for job: ${app.Job.Title}`,
        IpAddress: ip
      }
    });

    return NextResponse.json({
      success: true,
      message: "Offer letter released successfully.",
      application: updated
    });
  } catch (err: any) {
    console.error("POST Release Offer Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
