import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { getUserFromRequest } from "@/utils/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload) return NextResponse.json("Unauthorized", { status: 401 });
    const userId = parseInt(userPayload.nameid, 10);

    const { id: idStr } = await params;
    const id = parseInt(idStr, 10);

    const notif = await prisma.notifications.findFirst({
      where: { Id: id, UserId: userId }
    });

    if (!notif) {
      return NextResponse.json("Notification not found", { status: 404 });
    }

    const updatedNotif = await prisma.notifications.update({
      where: { Id: id },
      data: { IsRead: true }
    });

    return NextResponse.json(updatedNotif);
  } catch (err: any) {
    console.error("POST Read Notification Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
