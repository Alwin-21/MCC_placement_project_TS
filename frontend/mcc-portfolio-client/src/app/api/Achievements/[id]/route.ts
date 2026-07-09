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
    const { title, description, achievementUrl, achievementDate, category } = body;

    const ach = await prisma.achievements.findFirst({
      where: { Id: id, UserId: userId }
    });

    if (!ach) {
      return NextResponse.json("Achievement not found", { status: 404 });
    }

    const updatedAch = await prisma.achievements.update({
      where: { Id: id },
      data: {
        Title: title || "",
        Description: description || "",
        AchievementUrl: achievementUrl || "",
        AchievementDate: achievementDate ? new Date(achievementDate) : new Date(),
        Category: category || ""
      }
    });

    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    await logActionAndNotify(userId, userPayload.email, userPayload.unique_name, "Achievement Updated", `Student ${userPayload.unique_name} updated achievement: ${title}.`, ip);

    return NextResponse.json(updatedAch);
  } catch (err: any) {
    console.error("PUT Achievement Error:", err);
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

    const ach = await prisma.achievements.findFirst({
      where: { Id: id, UserId: userId }
    });

    if (!ach) {
      return NextResponse.json("Achievement not found", { status: 404 });
    }

    await prisma.achievements.delete({
      where: { Id: id }
    });

    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    await logActionAndNotify(userId, userPayload.email, userPayload.unique_name, "Achievement Deleted", `Student ${userPayload.unique_name} deleted achievement: ${ach.Title}.`, ip);

    return NextResponse.json({ message: "Achievement deleted successfully." });
  } catch (err: any) {
    console.error("DELETE Achievement Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
