import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { getUserFromRequest } from "@/utils/auth";
import { logActionAndNotify } from "@/utils/audit";

export async function GET(request: Request) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload) return NextResponse.json("Unauthorized", { status: 401 });
    const userId = parseInt(userPayload.nameid, 10);

    const resumes = await prisma.resumes.findMany({
      where: { UserId: userId }
    });

    return NextResponse.json(resumes);
  } catch (err: any) {
    console.error("GET Resumes Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload) return NextResponse.json("Unauthorized", { status: 401 });
    const userId = parseInt(userPayload.nameid, 10);

    const body = await request.json();
    const { resumeTitle, resumeUrl } = body;

    const resume = await prisma.resumes.create({
      data: {
        ResumeTitle: resumeTitle || "",
        ResumeUrl: resumeUrl || "",
        UserId: userId
      }
    });

    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    await logActionAndNotify(userId, userPayload.email, userPayload.unique_name, "Resume Uploaded", `Student ${userPayload.unique_name} uploaded resume: ${resumeTitle}.`, ip);

    return NextResponse.json(resume);
  } catch (err: any) {
    console.error("POST Resumes Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
