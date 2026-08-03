import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { getUserFromRequest } from "@/utils/auth";

function escapeField(field: any, delimiter: string): string {
  if (field === null || field === undefined) return "";
  const str = String(field);
  if (str.includes(delimiter) || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(request: Request) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload || userPayload.role !== "Company") {
      return NextResponse.json("Unauthorized", { status: 401 });
    }

    const hrUserId = parseInt(userPayload.nameid, 10);
    const hrUser = await prisma.companyUsers.findUnique({
      where: { Id: hrUserId }
    });

    if (!hrUser) {
      return NextResponse.json("HR User not found.", { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "csv"; // "csv", "excel"

    const delimiter = format === "excel" ? "\t" : ",";
    const contentType = format === "excel" ? "application/vnd.ms-excel" : "text/csv";
    const fileExtension = format === "excel" ? "xls" : "csv";
    const dateStr = new Date().toISOString().split("T")[0].replace(/-/g, "");

    const filename = `mcc_candidate_pipeline_${dateStr}.${fileExtension}`;

    // Query job applications with candidates profiles
    // Interviews live on JobApplication (not on Users directly)
    const applications = await prisma.jobApplication.findMany({
      where: {
        Job: {
          CompanyId: hrUser.CompanyId
        }
      },
      include: {
        Job: true,
        Student: {
          include: {
            Profiles: { take: 1 }
          }
        },
        Interviews: true
      },
      orderBy: { AppliedAt: "desc" }
    });

    const headers = [
      "Candidate Name",
      "Register Number",
      "Email",
      "Department",
      "CGPA",
      "Graduation Year",
      "Job Applied To",
      "Compensation (LPA)",
      "Current Pipeline Stage",
      "Applied At",
      "Interviews Scheduled",
      "Offer Status"
    ];

    let fileContent = headers.map((h) => escapeField(h, delimiter)).join(delimiter) + "\n";

    applications.forEach((app) => {
      const student = app.Student;
      const profile = student.Profiles[0] || null;
      const cgpa = profile?.CGPA || 0.0;
      const gradYear = profile?.GraduationYear || "N/A";
      const interviewsCount = app.Interviews.length;

      const row = [
        student.FullName,
        student.RegisterNumber,
        student.Email,
        student.Department,
        cgpa,
        gradYear,
        app.Job.Title,
        app.Job.LPA,
        app.Status,
        new Date(app.AppliedAt).toLocaleDateString(),
        interviewsCount,
        app.OfferStatus || "None"
      ];
      fileContent += row.map((r) => escapeField(r, delimiter)).join(delimiter) + "\n";
    });

    const bytes = Buffer.from(fileContent, "utf-8");
    return new Response(bytes, {
      status: 200,
      headers: {
        "Content-Type": `${contentType}; charset=utf-8`,
        "Content-Disposition": `attachment; filename=${filename}`
      }
    });

  } catch (err: any) {
    console.error("GET Company Reports Export Details Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
