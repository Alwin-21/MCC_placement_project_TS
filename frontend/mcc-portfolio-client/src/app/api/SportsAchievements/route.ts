import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { getUserFromRequest } from "@/utils/auth";

export async function GET(request: Request) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload) return NextResponse.json("Unauthorized", { status: 401 });
    const userId = parseInt(userPayload.nameid, 10);

    const sports = await prisma.sportsAchievements.findMany({
      where: { UserId: userId }
    });

    return NextResponse.json(sports);
  } catch (err: any) {
    console.error("GET SportsAchievements Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload) return NextResponse.json("Unauthorized", { status: 401 });
    const userId = parseInt(userPayload.nameid, 10);

    const body = await request.json();
    const { sportName, level, achievement, description, date, certificateUrl } = body;

    const sp = await prisma.sportsAchievements.create({
      data: {
        SportName: sportName || "",
        Level: level || "",
        Achievement: achievement || "",
        Description: description || "",
        Date: date ? new Date(date) : new Date(),
        CertificateUrl: certificateUrl || "",
        UserId: userId
      }
    });

    return NextResponse.json(sp);
  } catch (err: any) {
    console.error("POST SportsAchievements Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
