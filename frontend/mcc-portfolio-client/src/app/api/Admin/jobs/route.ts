import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { getUserFromRequest, hasModulePermission } from "@/utils/auth";

export async function GET(request: Request) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload || !hasModulePermission(userPayload, "companies", "read")) {
      return NextResponse.json("Unauthorized", { status: 401 });
    }

    const jobs = await prisma.jobPosting.findMany({
      include: {
        Company: {
          select: {
            Id: true,
            Name: true,
            Status: true,
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

    const mapped = jobs.map((job: any) => ({
      id: job.Id,
      companyId: job.CompanyId,
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
      status: job.Status,
      changesFeedback: job.ChangesFeedback,
      createdAt: job.CreatedAt,
    }));

    return NextResponse.json(mapped);
  } catch (err: any) {
    console.error("GET Admin Jobs Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
