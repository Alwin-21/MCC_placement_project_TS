import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { getUserFromRequest } from "@/utils/auth";

export async function GET(request: Request) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload || (userPayload.role !== "Admin" && userPayload.role !== "Moderator")) {
      return NextResponse.json("Unauthorized", { status: 401 });
    }

    const assessments = await prisma.assessments.findMany({
      orderBy: { CreatedAt: "desc" },
      include: {
        AssessmentQuestions: {
          include: {
            Questions: true
          }
        }
      }
    });

    // Format for client consumption
    const formatted = assessments.map(a => ({
      id: a.Id,
      title: a.Title,
      description: a.Description,
      instructions: a.Instructions,
      duration: a.Duration,
      totalMarks: a.TotalMarks,
      startDate: a.StartDate,
      endDate: a.EndDate,
      departments: a.Departments,
      isPublished: a.IsPublished,
      isClosed: a.IsClosed,
      createdAt: a.CreatedAt,
      questionsCount: a.AssessmentQuestions.length
    }));

    return NextResponse.json(formatted);
  } catch (err: any) {
    console.error("GET Assessments Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload || (userPayload.role !== "Admin" && userPayload.role !== "Moderator")) {
      return NextResponse.json("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const { title, description, instructions, duration, totalMarks, startDate, endDate, departments } = body;

    if (!title || !startDate || !endDate || !departments) {
      return NextResponse.json("Missing required fields (title, startDate, endDate, departments).", { status: 400 });
    }

    const newAssessment = await prisma.assessments.create({
      data: {
        Title: title,
        Description: description || "",
        Instructions: instructions || "",
        Duration: parseInt(duration) || 30,
        TotalMarks: parseInt(totalMarks) || 100,
        StartDate: new Date(startDate),
        EndDate: new Date(endDate),
        Departments: departments, // semicolon-separated
        IsPublished: false,
        IsClosed: false,
        CreatedAt: new Date()
      }
    });

    return NextResponse.json({
      id: newAssessment.Id,
      title: newAssessment.Title,
      description: newAssessment.Description,
      instructions: newAssessment.Instructions,
      duration: newAssessment.Duration,
      totalMarks: newAssessment.TotalMarks,
      startDate: newAssessment.StartDate,
      endDate: newAssessment.EndDate,
      departments: newAssessment.Departments,
      isPublished: newAssessment.IsPublished,
      isClosed: newAssessment.IsClosed,
      createdAt: newAssessment.CreatedAt
    });
  } catch (err: any) {
    console.error("POST Assessments Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
