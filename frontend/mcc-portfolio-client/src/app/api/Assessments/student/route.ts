import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { getUserFromRequest } from "@/utils/auth";

export async function GET(request: Request) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload) {
      return NextResponse.json("Unauthorized", { status: 401 });
    }

    const studentId = parseInt(userPayload.nameid);

    // Fetch student's department details
    const student = await prisma.users.findUnique({
      where: { Id: studentId }
    });

    if (!student) {
      return NextResponse.json("Student not found", { status: 404 });
    }

    const studentDept = (student.Department || "").trim();

    // Fetch published assessments
    const assessments = await prisma.assessments.findMany({
      where: {
        IsPublished: true
      },
      include: {
        StudentAttempts: {
          where: { StudentId: studentId }
        }
      },
      orderBy: { StartDate: "asc" }
    });

    // Filter assessments where student's department is matched
    const filtered = assessments.filter(a => {
      const depts = a.Departments.split(";").map(d => d.trim().toLowerCase());
      return depts.includes(studentDept.toLowerCase());
    });

    const formatted = filtered.map(a => {
      const attempt = a.StudentAttempts[0] || null;
      return {
        id: a.Id,
        title: a.Title,
        description: a.Description,
        instructions: a.Instructions,
        duration: a.Duration,
        totalMarks: a.TotalMarks,
        startDate: a.StartDate,
        endDate: a.EndDate,
        isClosed: a.IsClosed,
        attempt: attempt ? {
          id: attempt.Id,
          startTime: attempt.StartTime,
          endTime: attempt.EndTime,
          isSubmitted: attempt.IsSubmitted,
          score: attempt.Score,
          status: attempt.Status,
          percentage: attempt.Percentage
        } : null
      };
    });

    return NextResponse.json(formatted);
  } catch (err: any) {
    console.error("GET Student Assessments Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
