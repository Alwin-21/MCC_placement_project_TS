import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { getUserFromRequest } from "@/utils/auth";

export async function POST(request: Request) {
  try {
    const payload = getUserFromRequest(request);
    if (!payload || payload.role !== "Company") {
      return NextResponse.json("Unauthorized HR access", { status: 401 });
    }

    const hrUserId = parseInt(payload.nameid, 10);
    const hrUser = await prisma.companyUsers.findUnique({
      where: { Id: hrUserId },
      include: { Company: true },
    });

    if (!hrUser) {
      return NextResponse.json("HR User not found.", { status: 404 });
    }

    const companyAllowedDepts = hrUser.Company?.AllowedDepartments
      ? hrUser.Company.AllowedDepartments.split(";").map((d) => d.trim().toLowerCase()).filter(Boolean)
      : [];

    const body = await request.json();
    const { department = "", minCgpa = 0.0, studentIds = [] } = body;

    // Build department filter
    let deptFilter: any = {};
    if (department && department.trim() !== "all" && department.trim() !== "") {
      const requestedDeptLower = department.trim().toLowerCase();
      // Check if HR has permission for requested department
      if (companyAllowedDepts.length > 0 && !companyAllowedDepts.includes(requestedDeptLower)) {
        return NextResponse.json(
          { message: `Access denied. You do not have permission to view/download data for department: ${department}` },
          { status: 403 }
        );
      }
      deptFilter = { Department: { equals: department.trim(), mode: "insensitive" } };
    } else if (companyAllowedDepts.length > 0) {
      // HR requesting all allowed departments
      deptFilter = {
        Department: {
          in: companyAllowedDepts.map((d) => new RegExp(`^${d}$`, "i").source),
        },
      };
    }

    // ID filter if provided
    let idFilter = {};
    if (Array.isArray(studentIds) && studentIds.length > 0) {
      idFilter = { Id: { in: studentIds.map((id: any) => Number(id)) } };
    }

    const students = await prisma.users.findMany({
      where: {
        Role: 1, // Student
        IsActive: true,
        ...deptFilter,
        ...idFilter,
      },
      include: {
        Profiles: { take: 1 },
        Resumes: true,
        AcademicRecords: true,
        Skills: true,
        Projects: true,
        Certifications: true,
      },
      orderBy: [
        { Department: "asc" },
        { FullName: "asc" },
      ],
    });

    // Filter by allowed departments fallback check & CGPA
    const filteredStudents = students.filter((student) => {
      const studentDeptLower = (student.Department || "").trim().toLowerCase();
      if (companyAllowedDepts.length > 0 && !companyAllowedDepts.includes(studentDeptLower)) {
        return false;
      }
      const cgpa = student.Profiles[0]?.CGPA || 0.0;
      if (minCgpa > 0.0 && cgpa < minCgpa) {
        return false;
      }
      return true;
    });

    const exportData = filteredStudents.map((s) => {
      const profile = s.Profiles[0] || null;
      return {
        id: s.Id,
        fullName: s.FullName,
        registerNumber: s.RegisterNumber,
        email: s.Email,
        department: s.Department,
        cgpa: profile?.CGPA || 0.0,
        graduationYear: profile?.GraduationYear || null,
        phone: profile?.Phone || "",
        linkedInUrl: profile?.LinkedInUrl || "",
        githubUrl: profile?.GitHubUrl || "",
        resumes: s.Resumes.map((r) => ({
          id: r.Id,
          title: r.ResumeTitle,
          url: r.ResumeUrl,
        })),
        primaryResumeUrl: s.Resumes[0]?.ResumeUrl || null,
        topSkills: s.Skills.slice(0, 5).map((sk) => sk.Name).join(", "),
        projectCount: s.Projects.length,
        certificationsCount: s.Certifications.length,
      };
    });

    return NextResponse.json({
      companyName: hrUser.Company.Name,
      exportedAt: new Date().toISOString(),
      filterDepartment: department || "All Allowed Departments",
      totalStudents: exportData.length,
      students: exportData,
    });
  } catch (err: any) {
    console.error("POST Bulk Resumes Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
