import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { getUserFromRequest } from "@/utils/auth";
import { logActionAndNotify } from "@/utils/audit";

export async function GET(request: Request) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload) return NextResponse.json("Unauthorized", { status: 401 });
    const userId = parseInt(userPayload.nameid, 10);

    const skills = await prisma.skills.findMany({
      where: { UserId: userId }
    });

    return NextResponse.json(skills);
  } catch (err: any) {
    console.error("GET Skills Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload) return NextResponse.json("Unauthorized", { status: 401 });
    const userId = parseInt(userPayload.nameid, 10);

    const body = await request.json();
    const { name, level, category } = body;

    const skill = await prisma.skills.create({
      data: {
        Name: name || "",
        Level: level || "",
        Category: category || "",
        UserId: userId
      }
    });

    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    await logActionAndNotify(userId, userPayload.email, userPayload.unique_name, "Skills Added", `Student ${userPayload.unique_name} added skill: ${name}.`, ip);

    return NextResponse.json(skill);
  } catch (err: any) {
    console.error("POST Skills Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
