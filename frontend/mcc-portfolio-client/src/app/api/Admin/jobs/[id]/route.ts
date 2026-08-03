import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { getUserFromRequest, hasModulePermission } from "@/utils/auth";

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
    const jobId = parseInt(id, 10);

    const body = await request.json();
    const { action, comments } = body; // Expected action: "Approve" | "Reject" | "RequestChanges"

    const job = await prisma.jobPosting.findUnique({
      where: { Id: jobId },
      include: {
        Company: true,
      },
    });

    if (!job) {
      return NextResponse.json("Job posting not found.", { status: 404 });
    }

    let newStatus = job.Status;
    let changesFeedback = job.ChangesFeedback;

    if (action === "Approve") {
      newStatus = "Approved";
    } else if (action === "Reject") {
      newStatus = "Rejected";
    } else if (action === "RequestChanges") {
      newStatus = "ChangesRequested";
      changesFeedback = comments || "Changes requested by Admin.";
    } else {
      return NextResponse.json("Invalid review action.", { status: 400 });
    }

    // Update job status
    const updatedJob = await prisma.jobPosting.update({
      where: { Id: jobId },
      data: {
        Status: newStatus,
        ChangesFeedback: action === "RequestChanges" ? changesFeedback : "",
      },
    });

    // Write audit logs
    const adminEmail = userPayload.email;
    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    await prisma.auditLogs.create({
      data: {
        Action: `Job Status Update`,
        PerformedByEmail: adminEmail,
        Timestamp: new Date(),
        Details: `Job '${job.Title}' from '${job.Company.Name}' status updated to ${newStatus}. Action: ${action}. Comments: ${comments || "None"}`,
        IpAddress: ip,
      },
    });

    // Create Company Audit Log to inform HR
    await prisma.companyAuditLogs.create({
      data: {
        CompanyId: job.CompanyId,
        Action: `Job Review: ${newStatus}`,
        PerformedByEmail: adminEmail,
        Timestamp: new Date(),
        Details: `Placement Admin reviewed job '${job.Title}': ${action}. Feedback: ${comments || "None"}`,
        IpAddress: ip,
      },
    });

    // If job is APPROVED, search and notify eligible students
    if (action === "Approve") {
      // 1. Fetch active students
      const students = await prisma.users.findMany({
        where: {
          Role: 1, // Student
          IsActive: true,
        },
        include: {
          Profiles: {
            take: 1,
          },
        },
      });

      // 2. Filter students based on eligibility
      const eligibleStudents = students.filter((student) => {
        const profile = student.Profiles[0] || null;

        // CGPA eligibility
        const studentCgpa = profile?.CGPA || 0.0;
        if (studentCgpa < job.EligibilityMinCGPA) {
          return false;
        }

        // Department eligibility
        if (job.EligibilityDepartments && job.EligibilityDepartments.trim() !== "" && job.EligibilityDepartments.toLowerCase() !== "all") {
          const allowedDepts = job.EligibilityDepartments.split(";").map((d: string) => d.trim().toLowerCase());
          const studentDept = student.Department.trim().toLowerCase();
          if (!allowedDepts.includes(studentDept)) {
            return false;
          }
        }

        // Graduation Year eligibility
        if (job.EligibilityYears && job.EligibilityYears.trim() !== "" && job.EligibilityYears.toLowerCase() !== "all") {
          const allowedYears = job.EligibilityYears.split(";").map((y: string) => y.trim());
          const studentYear = profile?.GraduationYear ? String(profile.GraduationYear) : "";
          if (!allowedYears.includes(studentYear)) {
            return false;
          }
        }

        return true;
      });

      // 3. Dispatch standard notification to all eligible students
      if (eligibleStudents.length > 0) {
        const notificationsData = eligibleStudents.map((student) => ({
          Title: `New Eligible Job Opportunity: ${job.Title}`,
          Message: `You are eligible to apply for '${job.Title}' at ${job.Company.Name}. Min CGPA Required: ${job.EligibilityMinCGPA}. Deadline: ${new Date(job.Deadlines).toLocaleDateString("en-IN")}`,
          Type: "JobOpportunityAlert",
          IsRead: false,
          CreatedAt: new Date(),
          UserId: student.Id,
        }));

        await prisma.notifications.createMany({
          data: notificationsData,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Job review status updated successfully to ${newStatus}.`,
      job: updatedJob,
    });
  } catch (err: any) {
    console.error("PUT Admin Review Job Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
