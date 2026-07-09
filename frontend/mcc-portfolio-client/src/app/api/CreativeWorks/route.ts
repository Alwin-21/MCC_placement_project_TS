import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { getUserFromRequest } from "@/utils/auth";

export async function GET(request: Request) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload) return NextResponse.json("Unauthorized", { status: 401 });
    const userId = parseInt(userPayload.nameid, 10);

    const works = await prisma.creativeWorks.findMany({
      where: { UserId: userId }
    });

    return NextResponse.json(works);
  } catch (err: any) {
    console.error("GET CreativeWorks Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload) return NextResponse.json("Unauthorized", { status: 401 });
    const userId = parseInt(userPayload.nameid, 10);

    const body = await request.json();
    const { title, category, description, workUrl, mediaUrl, date } = body;

    const work = await prisma.creativeWorks.create({
      data: {
        Title: title || "",
        Category: category || "",
        Description: description || "",
        WorkUrl: workUrl || "",
        MediaUrl: mediaUrl || "",
        Date: date ? new Date(date) : new Date(),
        UserId: userId
      }
    });

    return NextResponse.json(work);
  } catch (err: any) {
    console.error("POST CreativeWorks Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
