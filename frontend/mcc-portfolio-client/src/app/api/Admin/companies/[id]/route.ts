import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { getUserFromRequest, hasModulePermission } from "@/utils/auth";
import { sendEmail } from "@/utils/email";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload || !hasModulePermission(userPayload, "companies", "write")) {
      return NextResponse.json("Unauthorized", { status: 401 });
    }

    const { id } = await params;
    const companyId = parseInt(id, 10);

    const body = await request.json();
    const { action, comments } = body;

    const company = await prisma.company.findUnique({
      where: { Id: companyId },
      include: {
        Users: {
          where: { IsActive: true },
          take: 1,
        },
      },
    });

    if (!company) {
      return NextResponse.json("Company not found.", { status: 404 });
    }

    const hrContact = company.Users[0] || null;
    const hrEmail = hrContact ? hrContact.Email : company.Email;
    const hrName = hrContact ? hrContact.FullName : "Representative";

    let oldStatus = company.Status;
    let newStatus = oldStatus;

    const adminEmail = userPayload.email;
    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";

    if (action === "Approve") {
      newStatus = "Verified";
    } else if (action === "Reject") {
      newStatus = "Rejected";
    } else if (action === "RequestChanges") {
      // In this placement flow, requesting changes keeps it in Pending status but alerts the HR
      newStatus = "Pending";
    } else if (action === "Suspend") {
      newStatus = "Suspended";
    } else if (action === "Restore") {
      newStatus = "Verified";
    } else if (action === "Delete") {
      // Perform delete operations inside transaction
      await prisma.$transaction(async (tx) => {
        await tx.companyProfile.deleteMany({ where: { CompanyId: companyId } });
        await tx.companyLocations.deleteMany({ where: { CompanyId: companyId } });
        await tx.companyDocuments.deleteMany({ where: { CompanyId: companyId } });
        await tx.companyUsers.deleteMany({ where: { CompanyId: companyId } });
        await tx.companyVerification.deleteMany({ where: { CompanyId: companyId } });
        await tx.companyStatusHistory.deleteMany({ where: { CompanyId: companyId } });
        await tx.companyAuditLogs.deleteMany({ where: { CompanyId: companyId } });
        await tx.company.delete({ where: { Id: companyId } });
      });

      // Write System Audit Log
      await prisma.auditLogs.create({
        data: {
          Action: "Company Deleted",
          PerformedByEmail: adminEmail,
          Timestamp: new Date(),
          Details: `Company '${company.Name}' and all associated profiles/HR users were deleted.`,
          IpAddress: ip,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Company deleted successfully.",
      });
    } else {
      return NextResponse.json("Invalid review action.", { status: 400 });
    }

    // Execute state changes inside transaction
    await prisma.$transaction(async (tx) => {
      // 1. Update company status
      await tx.company.update({
        where: { Id: companyId },
        data: { Status: newStatus },
      });

      // 2. Add verification history
      await tx.companyVerification.create({
        data: {
          CompanyId: companyId,
          ReviewedByEmail: adminEmail,
          Action: action,
          Comments: comments || null,
        },
      });

      // 3. Add status history
      await tx.companyStatusHistory.create({
        data: {
          CompanyId: companyId,
          OldStatus: oldStatus,
          NewStatus: newStatus,
          ChangedBy: adminEmail,
          Comments: comments || `Admin review action: ${action}`,
        },
      });
    });

    // Write audit logs
    await prisma.companyAuditLogs.create({
      data: {
        CompanyId: companyId,
        Action: `Admin ${action}`,
        PerformedByEmail: adminEmail,
        Timestamp: new Date(),
        Details: `Verification status transitioned from ${oldStatus} to ${newStatus}. Comments: ${comments || "None"}`,
        IpAddress: ip,
      },
    });

    await prisma.auditLogs.create({
      data: {
        Action: `Company Status Update`,
        PerformedByEmail: adminEmail,
        Timestamp: new Date(),
        Details: `Company '${company.Name}' status updated to ${newStatus} (Action: ${action}).`,
        IpAddress: ip,
      },
    });

    // Dispatch Standard System Notification
    await prisma.notifications.create({
      data: {
        Title: `Company Status: ${newStatus}`,
        Message: `Verification review update for '${company.Name}': ${action}. Comments: ${comments || "None"}`,
        Type: "CompanyAction",
        IsRead: false,
        CreatedAt: new Date(),
      },
    });

    // Trigger Notification Email to Company HR Contact
    let emailSubject = "";
    let emailBody = "";

    if (action === "Approve") {
      emailSubject = `Placement Platform Account Approved - ${company.Name}`;
      emailBody = `Dear ${hrName},\n\nWe are pleased to inform you that your registration request for '${company.Name}' on the MCC Placement Platform has been approved!\n\nYou can now log in to the Company / HR portal using your official email credentials to access dashboards and profiles.\n\nBest regards,\nMCC Placement Office`;
    } else if (action === "Reject") {
      emailSubject = `Placement Platform Onboarding Request Update - ${company.Name}`;
      emailBody = `Dear ${hrName},\n\nThank you for your interest in the MCC Placement Platform. Your onboarding verification request has been rejected.\n\nReason/Comments: ${comments || "None"}\n\nIf you have any questions, please reach out to the Placement Office.\n\nBest regards,\nMCC Placement Office`;
    } else if (action === "RequestChanges") {
      emailSubject = `Placement Platform Onboarding: Changes Required - ${company.Name}`;
      emailBody = `Dear ${hrName},\n\nThe administrator reviewed your registration onboarding details for '${company.Name}'. Changes or additional information are required before verification approval.\n\nAdministrator Notes: ${comments || "None"}\n\nPlease submit updates in the portal.\n\nBest regards,\nMCC Placement Office`;
    } else if (action === "Suspend") {
      emailSubject = `Placement Platform Account Suspended - ${company.Name}`;
      emailBody = `Dear ${hrName},\n\nWe regret to inform you that your placement account for '${company.Name}' has been suspended.\n\nNotes: ${comments || "None"}\n\nPlease contact the administration for restoration assistance.\n\nBest regards,\nMCC Placement Office`;
    } else if (action === "Restore") {
      emailSubject = `Placement Platform Account Restored - ${company.Name}`;
      emailBody = `Dear ${hrName},\n\nYour placement account for '${company.Name}' has been restored successfully.\n\nYou can now log in and resume placing offers.\n\nBest regards,\nMCC Placement Office`;
    }

    if (emailSubject && emailBody) {
      await sendEmail(hrEmail, emailSubject, emailBody);
    }

    return NextResponse.json({
      success: true,
      message: `Action '${action}' completed successfully.`,
      newStatus: newStatus,
    });
  } catch (err: any) {
    console.error("PUT Review Admin Company Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
