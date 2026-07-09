import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { getUserFromRequest } from "@/utils/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload) return NextResponse.json("Unauthorized", { status: 401 });
    const userId = parseInt(userPayload.nameid, 10);

    const { id: idStr } = await params;
    const id = parseInt(idStr, 10);

    const resume = await prisma.savedResumes.findFirst({
      where: { Id: id, UserId: userId }
    });

    if (!resume) {
      return NextResponse.json("Resume not found", { status: 404 });
    }

    return NextResponse.json(resume);
  } catch (err: any) {
    console.error("GET SavedResume Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

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
    const { resumeTitle, selectedTheme, accentColor, resumeDataJson } = body;

    const resume = await prisma.savedResumes.findFirst({
      where: { Id: id, UserId: userId }
    });

    if (!resume) {
      return NextResponse.json("Resume not found", { status: 404 });
    }

    const updatedResume = await prisma.savedResumes.update({
      where: { Id: id },
      data: {
        ResumeTitle: resumeTitle || "",
        SelectedTheme: selectedTheme || "",
        AccentColor: accentColor || "",
        ResumeDataJson: resumeDataJson || "",
        UpdatedAt: new Date()
      }
    });

    return NextResponse.json(updatedResume);
  } catch (err: any) {
    console.error("PUT SavedResume Error:", err);
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

    const resume = await prisma.savedResumes.findFirst({
      where: { Id: id, UserId: userId }
    });

    if (!resume) {
      return NextResponse.json("Resume not found", { status: 404 });
    }

    await prisma.savedResumes.delete({
      where: { Id: id }
    });

    return NextResponse.json({ message: "Resume deleted successfully." });
  } catch (err: any) {
    console.error("DELETE SavedResume Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
