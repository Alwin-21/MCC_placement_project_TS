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
    const { title, description, technologies, githubUrl, liveUrl, category, demoVideoUrl, imageUrl } = body;

    const proj = await prisma.projects.findFirst({
      where: { Id: id, UserId: userId }
    });

    if (!proj) {
      return NextResponse.json("Project not found", { status: 404 });
    }

    const updatedProj = await prisma.projects.update({
      where: { Id: id },
      data: {
        Title: title || "",
        Description: description || "",
        Technologies: technologies || "",
        GithubUrl: githubUrl || "",
        LiveUrl: liveUrl || "",
        Category: category || "",
        DemoVideoUrl: demoVideoUrl || "",
        ImageUrl: imageUrl || ""
      }
    });

    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    await logActionAndNotify(userId, userPayload.email, userPayload.unique_name, "Project Updated", `Student ${userPayload.unique_name} updated project: ${title}.`, ip);

    return NextResponse.json(updatedProj);
  } catch (err: any) {
    console.error("PUT Project Error:", err);
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

    const proj = await prisma.projects.findFirst({
      where: { Id: id, UserId: userId }
    });

    if (!proj) {
      return NextResponse.json("Project not found", { status: 404 });
    }

    await prisma.projects.delete({
      where: { Id: id }
    });

    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    await logActionAndNotify(userId, userPayload.email, userPayload.unique_name, "Project Deleted", `Student ${userPayload.unique_name} deleted project: ${proj.Title}.`, ip);

    return NextResponse.json({ message: "Project deleted successfully." });
  } catch (err: any) {
    console.error("DELETE Project Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
