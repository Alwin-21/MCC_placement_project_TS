import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { getUserFromRequest, hasModulePermission } from "@/utils/auth";

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
    if (!userPayload || !hasModulePermission(userPayload, "reports", "read")) {
      return NextResponse.json("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get("reportType") || "placement"; // "placement", "department", "company"
    const format = searchParams.get("format") || "csv"; // "csv", "excel"

    const delimiter = format === "excel" ? "\t" : ",";
    const contentType = format === "excel" ? "application/vnd.ms-excel" : "text/csv";
    const fileExtension = format === "excel" ? "xls" : "csv";
    const dateStr = new Date().toISOString().split("T")[0].replace(/-/g, "");

    let filename = `mcc_${reportType}_report_${dateStr}.${fileExtension}`;
    let fileContent = "";

    if (reportType === "placement") {
      // 1. Placements Export
      const applications = await prisma.jobApplication.findMany({
        where: {
          Status: { in: ["Offer Accepted", "Joined"] }
        },
        include: {
          Job: { include: { Company: true } },
          Student: true
        }
      });

      const headers = ["Student ID", "Register Number", "Full Name", "Email", "Department", "Company", "Job Title", "Compensation (LPA)", "Offer Status", "Applied At"];
      fileContent += headers.map((h) => escapeField(h, delimiter)).join(delimiter) + "\n";

      applications.forEach((app) => {
        const row = [
          app.Student.Id,
          app.Student.RegisterNumber,
          app.Student.FullName,
          app.Student.Email,
          app.Student.Department,
          app.Job.Company.Name,
          app.Job.Title,
          app.Job.LPA,
          app.Status,
          new Date(app.AppliedAt).toLocaleDateString()
        ];
        fileContent += row.map((r) => escapeField(r, delimiter)).join(delimiter) + "\n";
      });

    } else if (reportType === "department") {
      // 2. Department Analytics Export
      const students = await prisma.users.findMany({
        where: { Role: 1 },
        include: { Profiles: { take: 1 } }
      });

      const placedApps = await prisma.jobApplication.findMany({
        where: { Status: { in: ["Offer Accepted", "Joined"] } },
        include: { Job: true, Student: true }
      });

      const institution = await prisma.institutionDetails.findFirst();
      const declaredDepts = institution
        ? institution.Departments.split(";").map((d) => d.trim()).filter((d) => d.length > 0)
        : [];
      const userDepts = Array.from(new Set(students.map((s) => s.Department).filter((d) => !!d)));
      const allDepts = Array.from(new Set([...declaredDepts, ...userDepts]));

      const headers = ["Department", "Total Students", "Placed Students", "Placement %", "Highest Package (LPA)", "Average Package (LPA)"];
      fileContent += headers.map((h) => escapeField(h, delimiter)).join(delimiter) + "\n";

      allDepts.forEach((dept) => {
        const deptStudents = students.filter((s) => s.Department && s.Department.toLowerCase() === dept.toLowerCase());
        const totalCount = deptStudents.length;

        const placedInDept = placedApps.filter(
          (app) => app.Student.Department && app.Student.Department.toLowerCase() === dept.toLowerCase()
        );
        const uniquePlacedInDept = new Set(placedInDept.map((app) => app.StudentId)).size;
        const placementPct = totalCount > 0 ? (uniquePlacedInDept / totalCount) * 100 : 0.0;

        const lpas = placedInDept.map((app) => app.Job.LPA).filter((lpa) => lpa !== null && lpa > 0);
        const highestPackage = lpas.length > 0 ? Math.max(...lpas) : 0.0;
        const averagePackage = lpas.length > 0 ? lpas.reduce((a, b) => a + b, 0) / lpas.length : 0.0;

        const row = [
          dept,
          totalCount,
          uniquePlacedInDept,
          `${Math.round(placementPct * 10) / 10}%`,
          `${Math.round(highestPackage * 10) / 10} LPA`,
          `${Math.round(averagePackage * 10) / 10} LPA`
        ];
        fileContent += row.map((r) => escapeField(r, delimiter)).join(delimiter) + "\n";
      });

    } else if (reportType === "company") {
      // 3. Company Statistics Export
      const companies = await prisma.company.findMany({
        include: {
          Profile: true,
          JobPostings: {
            include: {
              Applications: true
            }
          }
        }
      });

      const headers = ["Company ID", "Company Name", "Industry", "Status", "Total Jobs Posted", "Applications Received", "Selected Candidates", "Offers Released"];
      fileContent += headers.map((h) => escapeField(h, delimiter)).join(delimiter) + "\n";

      companies.forEach((comp: any) => {
        let totalJobs = comp.JobPostings.length;
        let totalApps = 0;
        let placedCount = 0;
        let offersReleased = 0;

        comp.JobPostings.forEach((job: any) => {
          totalApps += job.Applications.length;
          placedCount += job.Applications.filter((a: any) => ["Joined", "Offer Accepted"].includes(a.Status)).length;
          offersReleased += job.Applications.filter((a: any) => ["Offer Sent", "Offer Accepted", "Joined"].includes(a.Status)).length;
        });

        const row = [
          comp.Id,
          comp.Name,
          comp.Profile?.Industry || "N/A",
          comp.Status,
          totalJobs,
          totalApps,
          placedCount,
          offersReleased
        ];
        fileContent += row.map((r) => escapeField(r, delimiter)).join(delimiter) + "\n";
      });
    } else {
      return NextResponse.json("Invalid report type.", { status: 400 });
    }

    const bytes = Buffer.from(fileContent, "utf-8");
    return new Response(bytes, {
      status: 200,
      headers: {
        "Content-Type": `${contentType}; charset=utf-8`,
        "Content-Disposition": `attachment; filename=${filename}`
      }
    });

  } catch (err: any) {
    console.error("GET Admin Reports Export Details Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
