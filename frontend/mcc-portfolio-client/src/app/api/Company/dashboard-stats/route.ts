import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { getUserFromRequest } from "@/utils/auth";

// Offer-related statuses across the full pipeline
const OFFER_STATUSES = ["Offer Sent", "Offer Accepted", "Joined"];

export async function GET(request: Request) {
  try {
    const payload = getUserFromRequest(request);
    if (!payload || payload.role !== "Company") {
      return NextResponse.json("Unauthorized", { status: 401 });
    }

    const hrUserId = parseInt(payload.nameid, 10);
    const hrUser = await prisma.companyUsers.findUnique({
      where: { Id: hrUserId },
      select: { CompanyId: true },
    });

    if (!hrUser) {
      return NextResponse.json("HR User not found.", { status: 404 });
    }

    const companyId = hrUser.CompanyId;
    console.log("NextJS Prisma Keys:", Object.keys(prisma).filter(k => !k.startsWith('_') && !k.startsWith('$')));

    // Fetch all jobs for this company in a single query
    const jobs = await prisma.jobPosting.findMany({
      where: { CompanyId: companyId },
      select: { Status: true },
    });

    const activeJobs = jobs.filter((j) => j.Status === "Approved").length;
    const pendingJobs = jobs.filter((j) => j.Status === "Pending").length;
    const rejectedJobs = jobs.filter((j) => j.Status === "Rejected").length;
    // Note: approvedJobs = activeJobs (same Status value)
    const approvedJobs = activeJobs;

    // Fetch all applications in a single query
    const applications = await prisma.jobApplication.findMany({
      where: { Job: { CompanyId: companyId } },
      select: { Status: true },
    });

    const applicationsReceived = applications.length;
    const studentsShortlisted = applications.filter((a) =>
      ["Shortlisted", "InterviewScheduled", "Selected", ...OFFER_STATUSES].includes(a.Status)
    ).length;
    const interviewsScheduled = applications.filter((a) =>
      a.Status === "InterviewScheduled"
    ).length;
    // Count ALL offer-related stages
    const offersReleased = applications.filter((a) =>
      OFFER_STATUSES.includes(a.Status)
    ).length;

    // Fetch saved talent pools count
    const savedTalentPools = await prisma.savedTalentPool.count({
      where: { CompanyId: companyId },
    });

    // Resume downloads count from Company Audit Logs
    const resumeDownloads = await prisma.companyAuditLogs.count({
      where: {
        CompanyId: companyId,
        Action: { contains: "Resume Download", mode: "insensitive" },
      },
    });

    // Recent notifications (scoped — pick notifications from system or related student actions)
    const notifications = await prisma.notifications.findMany({
      where: { Type: { in: ["JobStatusChange", "System", "PlacementAlert"] } },
      orderBy: { CreatedAt: "desc" },
      take: 10,
      select: { Id: true, Title: true, Message: true, Type: true, CreatedAt: true, IsRead: true },
    });

    // Recent company activities from audit log
    const recentActivities = await prisma.companyAuditLogs.findMany({
      where: { CompanyId: companyId },
      orderBy: { Timestamp: "desc" },
      take: 10,
      select: { Id: true, Action: true, PerformedByEmail: true, Timestamp: true, Details: true },
    });

    return NextResponse.json({
      activeJobs,
      pendingJobs,
      approvedJobs,
      rejectedJobs,
      applicationsReceived,
      studentsShortlisted,
      interviewsScheduled,
      offersReleased,
      savedTalentPools,
      resumeDownloads,
      notifications: notifications.map((n) => ({
        id: n.Id,
        title: n.Title,
        message: n.Message,
        type: n.Type,
        isRead: n.IsRead,
        createdAt: n.CreatedAt,
      })),
      recentActivities: recentActivities.map((a) => ({
        id: a.Id,
        action: a.Action,
        performedByEmail: a.PerformedByEmail,
        timestamp: a.Timestamp,
        details: a.Details,
      })),
    });
  } catch (err: any) {
    console.error("GET Company Dashboard Stats Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
