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
    const student = await prisma.users.findUnique({
      where: { Id: userId },
      include: {
        Profiles: {
          take: 1,
        },
      },
    });

    if (!student) {
      return NextResponse.json("Student not found.", { status: 404 });
    }

    const body = await request.json();
    const { jobId, resumeUrl } = body;

    if (!jobId || !resumeUrl) {
      return NextResponse.json("Job ID and Resume URL are required.", { status: 400 });
    }

    const targetJobId = parseInt(jobId, 10);

    // 1. Fetch Job detail
    const job = await prisma.jobPosting.findUnique({
      where: { Id: targetJobId },
    });

    if (!job || job.Status !== "Approved") {
      return NextResponse.json("Job opportunity not found or is closed.", { status: 404 });
    }

    // 2. Check if student already applied
    const existingApp = await prisma.jobApplication.findFirst({
      where: {
        JobId: targetJobId,
        StudentId: userId,
      },
    });

    if (existingApp) {
      return NextResponse.json("You have already applied for this job opportunity.", { status: 400 });
    }

    // 3. Verify student eligibility (Strict Backend check)
    const profile = student.Profiles[0] || null;
    const studentCgpa = profile?.CGPA || 0.0;
    const studentDept = student.Department.trim().toLowerCase();
    const studentGradYear = profile?.GraduationYear ? String(profile.GraduationYear) : "";

    // CGPA check
    if (studentCgpa < job.EligibilityMinCGPA) {
      return NextResponse.json("You do not meet the minimum CGPA eligibility for this job.", { status: 400 });
    }

    // Department check
    if (job.EligibilityDepartments && job.EligibilityDepartments.trim() !== "" && job.EligibilityDepartments.toLowerCase() !== "all") {
      const allowedDepts = job.EligibilityDepartments.split(";").map((d: string) => d.trim().toLowerCase());
      if (!allowedDepts.includes(studentDept)) {
        return NextResponse.json("Your department is not eligible for this job.", { status: 400 });
      }
    }

    // Graduation Year check
    if (job.EligibilityYears && job.EligibilityYears.trim() !== "" && job.EligibilityYears.toLowerCase() !== "all") {
      const allowedYears = job.EligibilityYears.split(";").map((y: string) => y.trim());
      if (!allowedYears.includes(studentGradYear)) {
        return NextResponse.json("Your graduation year is not eligible for this job.", { status: 400 });
      }
    }

    // 4. Create Job Application
    const newApplication = await prisma.jobApplication.create({
      data: {
        JobId: targetJobId,
        StudentId: userId,
        ResumeUrl: resumeUrl,
        Status: "Applied",
      },
    });

    // Write audit log
    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    await prisma.auditLogs.create({
      data: {
        Action: "Job Applied",
        PerformedByEmail: student.Email,
        Timestamp: new Date(),
        Details: `Student ${student.FullName} applied to job '${job.Title}'. Resume: ${resumeUrl}`,
        IpAddress: ip,
      },
    });

    // Create Company Audit Log to notify company HR of application
    await prisma.companyAuditLogs.create({
      data: {
        CompanyId: job.CompanyId,
        Action: "Application Received",
        PerformedByEmail: student.Email,
        Timestamp: new Date(),
        Details: `New application from student ${student.FullName} (${student.RegisterNumber}) for job: ${job.Title}`,
        IpAddress: ip,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Application submitted successfully.",
      application: newApplication,
    });
  } catch (err: any) {
    console.error("POST Student Apply Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload || userPayload.role !== "Student") {
      return NextResponse.json("Unauthorized", { status: 401 });
    }

    const userId = parseInt(userPayload.nameid, 10);
    const { searchParams } = new URL(request.url);
    const jobIdStr = searchParams.get("jobId");

    if (!jobIdStr) {
      return NextResponse.json("Job ID is required.", { status: 400 });
    }

    const jobId = parseInt(jobIdStr, 10);

    const app = await prisma.jobApplication.findFirst({
      where: {
        JobId: jobId,
        StudentId: userId
      },
      include: {
        Job: true
      }
    });

    if (!app) {
      return NextResponse.json("Application not found.", { status: 404 });
    }

    // Delete application
    await prisma.jobApplication.delete({
      where: { Id: app.Id }
    });

    // Write audit logs
    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    await prisma.auditLogs.create({
      data: {
        Action: "Job Withdrawn",
        PerformedByEmail: userPayload.email,
        Timestamp: new Date(),
        Details: `Student withdrew application for job '${app.Job.Title}' (ID: ${jobId})`,
        IpAddress: ip,
      }
    });

    await prisma.companyAuditLogs.create({
      data: {
        CompanyId: app.Job.CompanyId,
        Action: "Application Withdrawn",
        PerformedByEmail: userPayload.email,
        Timestamp: new Date(),
        Details: `Student withdrew application for job: ${app.Job.Title}`,
        IpAddress: ip,
      }
    });

    return NextResponse.json({ success: true, message: "Application withdrawn successfully." });
  } catch (err: any) {
    console.error("DELETE Student Apply Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

