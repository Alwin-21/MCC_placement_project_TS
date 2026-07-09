import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { getUserFromRequest } from "@/utils/auth";

export async function GET(request: Request) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload) return NextResponse.json("Unauthorized", { status: 401 });
    const userId = parseInt(userPayload.nameid, 10);

    const resumes = await prisma.savedResumes.findMany({
      where: { UserId: userId },
      orderBy: { UpdatedAt: "desc" }
    });

    return NextResponse.json(resumes);
  } catch (err: any) {
    console.error("GET SavedResumes Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload) return NextResponse.json("Unauthorized", { status: 401 });
    const userId = parseInt(userPayload.nameid, 10);

    const body = await request.json();
    const { resumeTitle, selectedTheme, accentColor, resumeDataJson } = body;

    const resume = await prisma.savedResumes.create({
      data: {
        ResumeTitle: resumeTitle || "Untitled Resume",
        SelectedTheme: selectedTheme || "Professional",
        AccentColor: accentColor || "#18233c",
        ResumeDataJson: resumeDataJson || "",
        UserId: userId,
        CreatedAt: new Date(),
        UpdatedAt: new Date()
      }
    });

    return NextResponse.json(resume);
  } catch (err: any) {
    console.error("POST SavedResumes Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
