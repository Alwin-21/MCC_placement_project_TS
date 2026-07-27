import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { getUserFromRequest } from "@/utils/auth";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload) {
      return NextResponse.json("Unauthorized", { status: 401 });
    }

    const { id } = await params;
    const assessmentId = parseInt(id);

    const a = await prisma.assessments.findUnique({
      where: { Id: assessmentId }
    });

    if (!a) {
      return NextResponse.json("Assessment not found", { status: 404 });
    }

    return NextResponse.json({
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
      createdAt: a.CreatedAt
    });
  } catch (err: any) {
    console.error("GET Assessment by ID Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload || (userPayload.role !== "Admin" && userPayload.role !== "Moderator")) {
      return NextResponse.json("Unauthorized", { status: 401 });
    }

    const { id } = await params;
    const assessmentId = parseInt(id);
    const body = await request.json();
    const { title, description, instructions, duration, totalMarks, startDate, endDate, departments } = body;

    const existing = await prisma.assessments.findUnique({ where: { Id: assessmentId } });
    if (!existing) {
      return NextResponse.json("Assessment not found", { status: 404 });
    }

    const updated = await prisma.assessments.update({
      where: { Id: assessmentId },
      data: {
        Title: title !== undefined ? title : existing.Title,
        Description: description !== undefined ? description : existing.Description,
        Instructions: instructions !== undefined ? instructions : existing.Instructions,
        Duration: duration !== undefined ? parseInt(duration) : existing.Duration,
        TotalMarks: totalMarks !== undefined ? parseInt(totalMarks) : existing.TotalMarks,
        StartDate: startDate !== undefined ? new Date(startDate) : existing.StartDate,
        EndDate: endDate !== undefined ? new Date(endDate) : existing.EndDate,
        Departments: departments !== undefined ? departments : existing.Departments
      }
    });

    return NextResponse.json({
      id: updated.Id,
      title: updated.Title,
      description: updated.Description,
      instructions: updated.Instructions,
      duration: updated.Duration,
      totalMarks: updated.TotalMarks,
      startDate: updated.StartDate,
      endDate: updated.EndDate,
      departments: updated.Departments,
      isPublished: updated.IsPublished,
      isClosed: updated.IsClosed,
      createdAt: updated.CreatedAt
    });
  } catch (err: any) {
    console.error("PUT Assessment Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload || (userPayload.role !== "Admin" && userPayload.role !== "Moderator")) {
      return NextResponse.json("Unauthorized", { status: 401 });
    }

    const { id } = await params;
    const assessmentId = parseInt(id);

    const existing = await prisma.assessments.findUnique({ where: { Id: assessmentId } });
    if (!existing) {
      return NextResponse.json("Assessment not found", { status: 404 });
    }

    await prisma.assessments.delete({
      where: { Id: assessmentId }
    });

    return NextResponse.json("Assessment deleted successfully.");
  } catch (err: any) {
    console.error("DELETE Assessment Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
