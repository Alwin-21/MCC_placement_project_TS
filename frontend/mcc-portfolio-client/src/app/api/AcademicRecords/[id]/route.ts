import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { getUserFromRequest } from "@/utils/auth";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload) return NextResponse.json("Unauthorized", { status: 401 });
    const userId = parseInt(userPayload.nameid, 10);

    const { id: idStr } = await params;
    const id = parseInt(idStr, 10);

    const body = await request.json();
    const { institution, degree, fieldOfStudy, grade, startYear, endYear, attachmentUrl } = body;

    const record = await prisma.academicRecords.findFirst({
      where: { Id: id, UserId: userId }
    });

    if (!record) {
      return NextResponse.json("Academic record not found", { status: 404 });
    }

    const updatedRecord = await prisma.academicRecords.update({
      where: { Id: id },
      data: {
        Institution: institution || "",
        Degree: degree || "",
        FieldOfStudy: fieldOfStudy || "",
        Grade: grade || "",
        StartYear: parseInt(startYear || "0", 10),
        EndYear: parseInt(endYear || "0", 10),
        AttachmentUrl: attachmentUrl || ""
      }
    });

    return NextResponse.json(updatedRecord);
  } catch (err: any) {
    console.error("PUT AcademicRecord Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload) return NextResponse.json("Unauthorized", { status: 401 });
    const userId = parseInt(userPayload.nameid, 10);

    const { id: idStr } = await params;
    const id = parseInt(idStr, 10);

    const record = await prisma.academicRecords.findFirst({
      where: { Id: id, UserId: userId }
    });

    if (!record) {
      return NextResponse.json("Academic record not found", { status: 404 });
    }

    await prisma.academicRecords.delete({
      where: { Id: id }
    });

    return NextResponse.json({ message: "Academic record deleted successfully." });
  } catch (err: any) {
    console.error("DELETE AcademicRecord Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
