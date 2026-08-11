import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { getUserFromRequest } from "@/utils/auth";

// GET /api/Assessments/student — get assessments for student's department
export async function GET(request: Request) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload || userPayload.role !== "Student") {
      return NextResponse.json("Unauthorized", { status: 401 });
    }

    const userId = parseInt(userPayload.nameid);
    const user = await prisma.users.findUnique({ where: { Id: userId } });
    if (!user) return NextResponse.json("User not found", { status: 404 });

    const userStream = user.Stream?.trim().toLowerCase() || "";
    const userDept = user.Department?.trim().toLowerCase() || "";
    const fullAidedSfsDept = userStream && userDept ? `${userStream} - ${userDept}` : "";
    const altParenDept = userStream && userDept ? `${userDept} (${userStream})` : "";

    // Get all Published assessments
    const allAssessments = await prisma.assessments.findMany({
      where: { Status: "Published" },
      orderBy: { StartDate: "desc" },
    });

    // Filter by department (case-insensitive, support multi-dept & stream differentiation)
    const relevant = allAssessments.filter((a) => {
      if (!a.Departments) return false;
      const depts = a.Departments.split(/[,;]/).map((d) => d.trim().toLowerCase());
      if (depts.includes("all") || depts.includes("")) return true;

      return depts.some((d) => {
        if (!d) return false;
        // Exact match with "aided - social work" or "sfs - social work"
        if (fullAidedSfsDept && d === fullAidedSfsDept) return true;
        if (altParenDept && d === altParenDept) return true;
        // Legacy fallback: if target department has no stream prefix/suffix, match userDept
        if (!d.startsWith("aided -") && !d.startsWith("sfs -") && !d.includes("(aided)") && !d.includes("(sfs)")) {
          return d === userDept;
        }
        return false;
      });
    });

    // Get attempts for this student
    const attempts = await prisma.assessmentAttempts.findMany({
      where: {
        UserId: userId,
        AssessmentId: { in: relevant.map((a) => a.Id) },
      },
    });

    const attemptMap: Record<number, any> = {};
    attempts.forEach((a) => { attemptMap[a.AssessmentId] = a; });

    const now = new Date();
    return NextResponse.json(
      relevant.map((a) => {
        const attempt = attemptMap[a.Id];
        return {
          id: a.Id,
          title: a.Title,
          description: a.Description,
          instructions: a.Instructions,
          durationMinutes: a.DurationMinutes,
          totalMarks: a.TotalMarks,
          startDate: a.StartDate,
          endDate: a.EndDate,
          status: a.Status,
          departments: a.Departments,
          isStarted: !!attempt,
          isCompleted: attempt ? ["Submitted", "AutoSubmitted", "Terminated"].includes(attempt.Status) : false,
          attemptStatus: attempt?.Status || null,
          attemptId: attempt?.Id || null,
          isAvailable: new Date(a.StartDate) <= now && new Date(a.EndDate) >= now,
        };
      })
    );
  } catch (err: any) {
    console.error("GET Student Assessments Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
