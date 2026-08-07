import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { getUserFromRequest } from "@/utils/auth";

export async function GET(request: Request) {
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
        JobApplications: true,
      },
    });

    if (!student) {
      return NextResponse.json("Student not found.", { status: 404 });
    }

    const profile = student.Profiles[0] || null;
    const studentCgpa = profile?.CGPA || 0.0;
    const studentDept = student.Department.trim().toLowerCase();
    const studentGradYear = profile?.GraduationYear ? String(profile.GraduationYear) : "";

    // Fetch all approved jobs
    const jobs = await prisma.jobPosting.findMany({
      where: { Status: "Approved" },
      include: {
        Company: {
          select: {
            Name: true,
            Profile: {
              select: {
                LogoUrl: true,
                Industry: true,
              },
            },
          },
        },
      },
      orderBy: { CreatedAt: "desc" },
    });

    // Filter jobs based on eligibility
    const eligibleJobs = jobs.filter((job) => {
      // 1. CGPA Check
      if (studentCgpa < job.EligibilityMinCGPA) {
        return false;
      }

      // 2. Department Check
      if (job.EligibilityDepartments && job.EligibilityDepartments.trim() !== "" && job.EligibilityDepartments.toLowerCase() !== "all") {
        const allowedDepts = job.EligibilityDepartments.split(";").map((d) => d.trim().toLowerCase());
        if (!allowedDepts.includes(studentDept)) {
          return false;
        }
      }

      // 3. Graduation Year Check
      if (job.EligibilityYears && job.EligibilityYears.trim() !== "" && job.EligibilityYears.toLowerCase() !== "all") {
        const allowedYears = job.EligibilityYears.split(";").map((y) => y.trim());
        if (!allowedYears.includes(studentGradYear)) {
          return false;
        }
      }

      return true;
    });

    // Map response and append application status with recruitment pipeline data
    const mapped = await Promise.all(eligibleJobs.map(async (job) => {
      const application = student.JobApplications.find((app) => app.JobId === job.Id) || null;
      let interviews: any[] = [];
      if (application) {
        interviews = await prisma.interview.findMany({
          where: { ApplicationId: application.Id },
          orderBy: { ScheduleTime: "asc" }
        });
      }

      return {
        id: job.Id,
        companyName: job.Company.Name,
        companyLogoUrl: job.Company.Profile?.LogoUrl || "",
        companyIndustry: job.Company.Profile?.Industry || "",
        title: job.Title,
        department: job.Department,
        description: job.Description,
        responsibilities: job.Responsibilities,
        requirements: job.Requirements,
        requiredSkills: job.RequiredSkills,
        preferredSkills: job.PreferredSkills,
        jobType: job.JobType,
        workMode: job.WorkMode,
        eligibilityDepartments: job.EligibilityDepartments,
        eligibilityYears: job.EligibilityYears,
        eligibilityMinCGPA: job.EligibilityMinCGPA,
        eligibilityExperience: job.EligibilityExperience,
        vacancies: job.Vacancies,
        salary: job.Salary,
        lpa: job.LPA,
        benefits: job.Benefits,
        selectionProcess: job.SelectionProcess,
        deadlines: job.Deadlines,
        attachments: job.Attachments,
        createdAt: job.CreatedAt,
        applied: !!application,
        applicationId: application ? application.Id : null,
        applicationStatus: application ? application.Status : null,
        appliedAt: application ? application.AppliedAt : null,
        resumeUrl: application ? application.ResumeUrl : null,
        offerLetterUrl: application ? application.OfferLetterUrl : null,
        offerStatus: application ? application.OfferStatus : null,
        offerReleasedAt: application ? application.OfferReleasedAt : null,
        assessmentId: job.AssessmentId,
        interviews: interviews.map(i => ({
          id: i.Id,
          type: i.Type,
          scheduleTime: i.ScheduleTime,
          meetLink: i.MeetLink,
          venue: i.Venue,
          status: i.Status
        }))
      };
    }));

    return NextResponse.json(mapped);
  } catch (err: any) {
    console.error("GET Student Jobs Board Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
