import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { getUserFromRequest } from "@/utils/auth";

export async function GET(request: Request) {
  try {
    const payload = getUserFromRequest(request);
    if (!payload || payload.role !== "Company") {
      return NextResponse.json("Unauthorized", { status: 401 });
    }

    const hrUserId = parseInt(payload.nameid, 10);
    const hrUser = await prisma.companyUsers.findUnique({
      where: { Id: hrUserId },
    });

    if (!hrUser) {
      return NextResponse.json("HR User not found.", { status: 404 });
    }

    const jobs = await prisma.jobPosting.findMany({
      where: { CompanyId: hrUser.CompanyId },
      orderBy: { CreatedAt: "desc" },
    });

    return NextResponse.json(jobs);
  } catch (err: any) {
    console.error("GET Company Jobs Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = getUserFromRequest(request);
    if (!payload || payload.role !== "Company") {
      return NextResponse.json("Unauthorized", { status: 401 });
    }

    const hrUserId = parseInt(payload.nameid, 10);
    const hrUser = await prisma.companyUsers.findUnique({
      where: { Id: hrUserId },
    });

    if (!hrUser) {
      return NextResponse.json("HR User not found.", { status: 404 });
    }

    const body = await request.json();
    const {
      title,
      department,
      description,
      responsibilities,
      requirements,
      requiredSkills,
      preferredSkills,
      jobType,
      workMode,
      eligibilityDepartments,
      eligibilityYears,
      eligibilityMinCGPA,
      eligibilityExperience,
      vacancies,
      salary,
      lpa,
      benefits,
      selectionProcess,
      deadlines,
      attachments,
      assessmentId,
    } = body;

    if (!title || !department || !description) {
      return NextResponse.json("Title, Department, and Description are required.", { status: 400 });
    }

    const job = await prisma.jobPosting.create({
      data: {
        CompanyId: hrUser.CompanyId,
        Title: title,
        Department: department,
        Description: description,
        Responsibilities: responsibilities || "",
        Requirements: requirements || "",
        RequiredSkills: requiredSkills || "",
        PreferredSkills: preferredSkills || "",
        JobType: jobType || "FullTime",
        WorkMode: workMode || "OnSite",
        EligibilityDepartments: eligibilityDepartments || "",
        EligibilityYears: eligibilityYears || "",
        EligibilityMinCGPA: eligibilityMinCGPA ? parseFloat(eligibilityMinCGPA) : 0.0,
        EligibilityExperience: eligibilityExperience || "",
        Vacancies: vacancies ? parseInt(vacancies, 10) : 1,
        Salary: salary || "",
        LPA: lpa ? parseFloat(lpa) : 0.0,
        Benefits: benefits || "",
        SelectionProcess: selectionProcess || "",
        Deadlines: deadlines ? new Date(deadlines) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now default
        Attachments: attachments || "",
        Status: "Pending",
        AssessmentId: assessmentId ? parseInt(assessmentId, 10) : null,
      },
    });

    // Audit logs
    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    await prisma.companyAuditLogs.create({
      data: {
        CompanyId: hrUser.CompanyId,
        Action: "Job Created",
        PerformedByEmail: hrUser.Email,
        Timestamp: new Date(),
        Details: `Posted a new job: ${title}. Status is set to Pending for Admin approval.`,
        IpAddress: ip,
      },
    });

    return NextResponse.json(job);
  } catch (err: any) {
    console.error("POST Company Jobs Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
