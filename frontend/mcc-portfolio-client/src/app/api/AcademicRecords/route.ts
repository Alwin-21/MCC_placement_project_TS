import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { getUserFromRequest } from "@/utils/auth";

export async function GET(request: Request) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload) return NextResponse.json("Unauthorized", { status: 401 });
    const userId = parseInt(userPayload.nameid, 10);

    const records = await prisma.academicRecords.findMany({
      where: { UserId: userId }
    });

    return NextResponse.json(records);
  } catch (err: any) {
    console.error("GET AcademicRecords Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload) return NextResponse.json("Unauthorized", { status: 401 });
    const userId = parseInt(userPayload.nameid, 10);

    const body = await request.json();
    const { institution, degree, fieldOfStudy, grade, startYear, endYear, attachmentUrl } = body;

    const record = await prisma.academicRecords.create({
      data: {
        Institution: institution || "",
        Degree: degree || "",
        FieldOfStudy: fieldOfStudy || "",
        Grade: grade || "",
        StartYear: parseInt(startYear || "0", 10),
        EndYear: parseInt(endYear || "0", 10),
        AttachmentUrl: attachmentUrl || "",
        UserId: userId
      }
    });

    return NextResponse.json(record);
  } catch (err: any) {
    console.error("POST AcademicRecords Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
