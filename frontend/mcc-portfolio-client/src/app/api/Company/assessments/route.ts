import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { getUserFromRequest } from "@/utils/auth";

export async function GET(request: Request) {
  try {
    const payload = getUserFromRequest(request);
    if (!payload || payload.role !== "Company") {
      return NextResponse.json("Unauthorized", { status: 401 });
    }

    // Return all assessments that are active/published
    const list = await prisma.assessments.findMany({
      where: {
        Status: "Published"
      },
      orderBy: { CreatedAt: "desc" }
    });

    const mapped = list.map((a) => ({
      id: a.Id,
      title: a.Title,
      description: a.Description,
      durationMinutes: a.DurationMinutes,
      totalMarks: a.TotalMarks,
      startDate: a.StartDate,
      endDate: a.EndDate,
      departments: a.Departments
    }));

    return NextResponse.json(mapped);
  } catch (err: any) {
    console.error("GET Company Assessments Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
