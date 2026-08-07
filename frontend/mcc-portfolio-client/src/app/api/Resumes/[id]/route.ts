import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { getUserFromRequest } from "@/utils/auth";
import { logActionAndNotify } from "@/utils/audit";

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
    const { resumeTitle, resumeUrl } = body;

    const resume = await prisma.resumes.findFirst({
      where: { Id: id, UserId: userId }
    });

    if (!resume) {
      return NextResponse.json("Resume not found", { status: 404 });
    }

    const updatedResume = await prisma.resumes.update({
      where: { Id: id },
      data: {
        ResumeTitle: resumeTitle || "",
        ResumeUrl: resumeUrl || ""
      }
    });

    return NextResponse.json(updatedResume);
  } catch (err: any) {
    console.error("PUT Resume Error:", err);
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

    const resume = await prisma.resumes.findFirst({
      where: { Id: id, UserId: userId }
    });

    if (!resume) {
      return NextResponse.json("Resume not found", { status: 404 });
    }

    await prisma.resumes.delete({
      where: { Id: id }
    });

    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    await logActionAndNotify(userId, userPayload.email, userPayload.unique_name, "Resume Deleted", `Student ${userPayload.unique_name} deleted resume: ${resume.ResumeTitle}.`, ip);

    return NextResponse.json({ message: "Resume deleted successfully." });
  } catch (err: any) {
    console.error("DELETE Resume Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
