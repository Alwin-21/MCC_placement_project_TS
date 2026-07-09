import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { getUserFromRequest } from "@/utils/auth";
import { logActionAndNotify } from "@/utils/audit";

export async function GET(request: Request) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload) return NextResponse.json("Unauthorized", { status: 401 });
    const userId = parseInt(userPayload.nameid, 10);

    const achievements = await prisma.achievements.findMany({
      where: { UserId: userId }
    });

    return NextResponse.json(achievements);
  } catch (err: any) {
    console.error("GET Achievements Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload) return NextResponse.json("Unauthorized", { status: 401 });
    const userId = parseInt(userPayload.nameid, 10);

    const body = await request.json();
    const { title, description, achievementUrl, achievementDate, category } = body;

    const ach = await prisma.achievements.create({
      data: {
        Title: title || "",
        Description: description || "",
        AchievementUrl: achievementUrl || "",
        AchievementDate: achievementDate ? new Date(achievementDate) : new Date(),
        Category: category || "",
        UserId: userId
      }
    });

    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    await logActionAndNotify(userId, userPayload.email, userPayload.unique_name, "Achievement Added", `Student ${userPayload.unique_name} added achievement: ${title}.`, ip);

    return NextResponse.json(ach);
  } catch (err: any) {
    console.error("POST Achievements Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
