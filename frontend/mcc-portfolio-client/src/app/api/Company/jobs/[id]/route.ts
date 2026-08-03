import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { getUserFromRequest } from "@/utils/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = getUserFromRequest(request);
    if (!payload || payload.role !== "Company") {
      return NextResponse.json("Unauthorized", { status: 401 });
    }

    const { id } = await params;
    const jobId = parseInt(id, 10);

    const hrUserId = parseInt(payload.nameid, 10);
    const hrUser = await prisma.companyUsers.findUnique({
      where: { Id: hrUserId },
    });

    if (!hrUser) {
      return NextResponse.json("HR User not found.", { status: 404 });
    }

    const job = await prisma.jobPosting.findFirst({
      where: {
        Id: jobId,
        CompanyId: hrUser.CompanyId,
      },
    });

    if (!job) {
      return NextResponse.json("Job not found.", { status: 404 });
    }

    return NextResponse.json(job);
  } catch (err: any) {
    console.error("GET Job Detail Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
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
    const jobId = parseInt(id, 10);

    const hrUserId = parseInt(payload.nameid, 10);
    const hrUser = await prisma.companyUsers.findUnique({
      where: { Id: hrUserId },
    });

    if (!hrUser) {
      return NextResponse.json("HR User not found.", { status: 404 });
    }

    const job = await prisma.jobPosting.findFirst({
      where: {
        Id: jobId,
        CompanyId: hrUser.CompanyId,
      },
    });

    if (!job) {
      return NextResponse.json("Job not found.", { status: 404 });
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

    const updatedJob = await prisma.jobPosting.update({
      where: { Id: jobId },
      data: {
        Title: title !== undefined ? title : job.Title,
        Department: department !== undefined ? department : job.Department,
        Description: description !== undefined ? description : job.Description,
        Responsibilities: responsibilities !== undefined ? responsibilities : job.Responsibilities,
        Requirements: requirements !== undefined ? requirements : job.Requirements,
        RequiredSkills: requiredSkills !== undefined ? requiredSkills : job.RequiredSkills,
        PreferredSkills: preferredSkills !== undefined ? preferredSkills : job.PreferredSkills,
        JobType: jobType !== undefined ? jobType : job.JobType,
        WorkMode: workMode !== undefined ? workMode : job.WorkMode,
        EligibilityDepartments: eligibilityDepartments !== undefined ? eligibilityDepartments : job.EligibilityDepartments,
        EligibilityYears: eligibilityYears !== undefined ? eligibilityYears : job.EligibilityYears,
        EligibilityMinCGPA: eligibilityMinCGPA !== undefined ? parseFloat(eligibilityMinCGPA) : job.EligibilityMinCGPA,
        EligibilityExperience: eligibilityExperience !== undefined ? eligibilityExperience : job.EligibilityExperience,
        Vacancies: vacancies !== undefined ? parseInt(vacancies, 10) : job.Vacancies,
        Salary: salary !== undefined ? salary : job.Salary,
        LPA: lpa !== undefined ? parseFloat(lpa) : job.LPA,
        Benefits: benefits !== undefined ? benefits : job.Benefits,
        SelectionProcess: selectionProcess !== undefined ? selectionProcess : job.SelectionProcess,
        Deadlines: deadlines !== undefined ? new Date(deadlines) : job.Deadlines,
        Attachments: attachments !== undefined ? attachments : job.Attachments,
        Status: "Pending", // Re-submit for review upon edits
        AssessmentId: assessmentId !== undefined ? (assessmentId ? parseInt(assessmentId, 10) : null) : job.AssessmentId,
      },
    });

    // Audit logs
    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    await prisma.companyAuditLogs.create({
      data: {
        CompanyId: hrUser.CompanyId,
        Action: "Job Updated",
        PerformedByEmail: hrUser.Email,
        Timestamp: new Date(),
        Details: `Updated job details for: ${updatedJob.Title}. Status reverted to Pending.`,
        IpAddress: ip,
      },
    });

    return NextResponse.json(updatedJob);
  } catch (err: any) {
    console.error("PUT Job Update Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = getUserFromRequest(request);
    if (!payload || payload.role !== "Company") {
      return NextResponse.json("Unauthorized", { status: 401 });
    }

    const { id } = await params;
    const jobId = parseInt(id, 10);

    const hrUserId = parseInt(payload.nameid, 10);
    const hrUser = await prisma.companyUsers.findUnique({
      where: { Id: hrUserId },
    });

    if (!hrUser) {
      return NextResponse.json("HR User not found.", { status: 404 });
    }

    const job = await prisma.jobPosting.findFirst({
      where: {
        Id: jobId,
        CompanyId: hrUser.CompanyId,
      },
    });

    if (!job) {
      return NextResponse.json("Job not found.", { status: 404 });
    }

    await prisma.jobPosting.delete({
      where: { Id: jobId },
    });

    // Audit logs
    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    await prisma.companyAuditLogs.create({
      data: {
        CompanyId: hrUser.CompanyId,
        Action: "Job Deleted",
        PerformedByEmail: hrUser.Email,
        Timestamp: new Date(),
        Details: `Deleted job posting: ${job.Title}`,
        IpAddress: ip,
      },
    });

    return NextResponse.json({ success: true, message: "Job deleted successfully." });
  } catch (err: any) {
    console.error("DELETE Job Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
