import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { getUserFromRequest } from "@/utils/auth";

export async function GET(request: Request) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload) return NextResponse.json("Unauthorized", { status: 401 });
    const userId = parseInt(userPayload.nameid, 10);

    const notifications = await prisma.notifications.findMany({
      where: { UserId: userId },
      orderBy: { CreatedAt: "desc" }
    });

    return NextResponse.json(notifications);
  } catch (err: any) {
    console.error("GET Student Notifications Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
