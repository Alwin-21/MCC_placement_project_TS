import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { getUserFromRequest, hasModulePermission } from "@/utils/auth";

export async function GET(request: Request) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload || !hasModulePermission(userPayload, "analytics", "read")) {
      return NextResponse.json("Unauthorized", { status: 401 });
    }

    // 1. Company stats
    const totalCompanies = await prisma.company.count();
    const verifiedCompanies = await prisma.company.count({ where: { Status: "Verified" } });
    const pendingCompanies = await prisma.company.count({ where: { Status: "Pending" } });
    const inactiveCompanies = await prisma.company.count({ where: { Status: "Suspended" } });

    // 2. Placement stats
    const totalJobs = await prisma.jobPosting.count();
    const activeJobs = await prisma.jobPosting.count({ where: { Status: "Approved" } });
    const expiredJobs = await prisma.jobPosting.count({ where: { Status: "Expired" } });
    const totalApplications = await prisma.jobApplication.count();

    // Placed applications (Status: Joined or Offer Accepted)
    const placedApps = await prisma.jobApplication.findMany({
      where: {
        Status: {
          in: ["Offer Accepted", "Joined"]
        }
      },
      include: {
        Job: true,
        Student: {
          include: {
            Profiles: { take: 1 }
          }
        }
      }
    });

    const uniquePlacedStudentIds = new Set(placedApps.map((a) => a.StudentId));
    const totalPlacedStudents = uniquePlacedStudentIds.size;

    // 3. Department Analytics
    // Fetch all student users and their profiles
    const students = await prisma.users.findMany({
      where: { Role: 1 },
      include: {
        Profiles: { take: 1 }
      }
    });

    const institution = await prisma.institutionDetails.findFirst();
    const declaredDepts = institution
      ? institution.Departments.split(";").map((d) => d.trim()).filter((d) => d.length > 0)
      : [];

    const userDepts = Array.from(new Set(students.map((s) => s.Department).filter((d) => !!d)));
    const allDepts = Array.from(new Set([...declaredDepts, ...userDepts]));

    const departmentReports = allDepts.map((dept) => {
      const deptStudents = students.filter((s) => s.Department && s.Department.toLowerCase() === dept.toLowerCase());
      const totalCount = deptStudents.length;

      // Unique placed students in this department
      const placedInDept = placedApps.filter(
        (app) => app.Student.Department && app.Student.Department.toLowerCase() === dept.toLowerCase()
      );
      const uniquePlacedInDept = new Set(placedInDept.map((app) => app.StudentId)).size;

      const placementPct = totalCount > 0 ? (uniquePlacedInDept / totalCount) * 100 : 0.0;

      // Calculate salary package details (LPA)
      const lpas = placedInDept.map((app) => app.Job.LPA).filter((lpa) => lpa !== null && lpa > 0);
      const highestPackage = lpas.length > 0 ? Math.max(...lpas) : 0.0;
      const averagePackage = lpas.length > 0 ? lpas.reduce((a, b) => a + b, 0) / lpas.length : 0.0;

      return {
        department: dept,
        totalStudents: totalCount,
        placedStudents: uniquePlacedInDept,
        placementPercentage: Math.round(placementPct * 10) / 10,
        highestPackage: Math.round(highestPackage * 10) / 10,
        averagePackage: Math.round(averagePackage * 10) / 10
      };
    });

    // Sort by placement rate desc
    departmentReports.sort((a, b) => b.placementPercentage - a.placementPercentage);

    // 4. Student Trends (Placed by Graduation Year)
    const yearPlacements: Record<number, number> = {};
    placedApps.forEach((app) => {
      const gradYear = app.Student.Profiles[0]?.GraduationYear;
      if (gradYear) {
        yearPlacements[gradYear] = (yearPlacements[gradYear] || 0) + 1;
      }
    });

    const studentTrends = Object.entries(yearPlacements).map(([year, count]) => ({
      year: parseInt(year, 10),
      placedCount: count
    })).sort((a, b) => a.year - b.year);

    return NextResponse.json({
      companyStats: {
        totalCompanies,
        verifiedCompanies,
        pendingCompanies,
        inactiveCompanies
      },
      placementStats: {
        totalJobs,
        activeJobs,
        expiredJobs,
        totalApplications,
        totalPlacedStudents
      },
      departmentReports,
      studentTrends
    });
  } catch (err: any) {
    console.error("GET Admin Analytics Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
