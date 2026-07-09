import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { getUserFromRequest } from "@/utils/auth";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload || (userPayload.role !== "Admin" && userPayload.role !== "Moderator")) {
      return NextResponse.json("Unauthorized", { status: 401 });
    }

    const { id: idStr } = await params;
    const id = parseInt(idStr, 10);

    const notif = await prisma.notifications.findUnique({ where: { Id: id } });
    if (!notif) {
      return NextResponse.json("Notification not found.", { status: 404 });
    }

    await prisma.notifications.delete({ where: { Id: id } });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("DELETE Admin Notification Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
