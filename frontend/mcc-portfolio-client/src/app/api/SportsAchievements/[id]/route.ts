import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { getUserFromRequest } from "@/utils/auth";

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
    const { sportName, level, achievement, description, date, certificateUrl } = body;

    const sp = await prisma.sportsAchievements.findFirst({
      where: { Id: id, UserId: userId }
    });

    if (!sp) {
      return NextResponse.json("Sports achievement not found", { status: 404 });
    }

    const updatedSp = await prisma.sportsAchievements.update({
      where: { Id: id },
      data: {
        SportName: sportName || "",
        Level: level || "",
        Achievement: achievement || "",
        Description: description || "",
        Date: date ? new Date(date) : new Date(),
        CertificateUrl: certificateUrl || ""
      }
    });

    return NextResponse.json(updatedSp);
  } catch (err: any) {
    console.error("PUT SportsAchievement Error:", err);
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

    const sp = await prisma.sportsAchievements.findFirst({
      where: { Id: id, UserId: userId }
    });

    if (!sp) {
      return NextResponse.json("Sports achievement not found", { status: 404 });
    }

    await prisma.sportsAchievements.delete({
      where: { Id: id }
    });

    return NextResponse.json({ message: "Sports achievement deleted successfully." });
  } catch (err: any) {
    console.error("DELETE SportsAchievement Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
