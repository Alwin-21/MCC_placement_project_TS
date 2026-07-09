import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { getUserFromRequest } from "@/utils/auth";
import { logActionAndNotify } from "@/utils/audit";

export async function GET(request: Request) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload) return NextResponse.json("Unauthorized", { status: 401 });
    const userId = parseInt(userPayload.nameid, 10);

    const projects = await prisma.projects.findMany({
      where: { UserId: userId }
    });

    return NextResponse.json(projects);
  } catch (err: any) {
    console.error("GET Projects Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload) return NextResponse.json("Unauthorized", { status: 401 });
    const userId = parseInt(userPayload.nameid, 10);

    const body = await request.json();
    const { title, description, technologies, githubUrl, liveUrl, category, demoVideoUrl, imageUrl } = body;

    const proj = await prisma.projects.create({
      data: {
        Title: title || "",
        Description: description || "",
        Technologies: technologies || "",
        GithubUrl: githubUrl || "",
        LiveUrl: liveUrl || "",
        Category: category || "",
        DemoVideoUrl: demoVideoUrl || "",
        ImageUrl: imageUrl || "",
        UserId: userId
      }
    });

    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    await logActionAndNotify(userId, userPayload.email, userPayload.unique_name, "Project Added", `Student ${userPayload.unique_name} added project: ${title}.`, ip);

    return NextResponse.json(proj);
  } catch (err: any) {
    console.error("POST Projects Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
