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
    const { title, category, description, workUrl, mediaUrl, date } = body;

    const work = await prisma.creativeWorks.findFirst({
      where: { Id: id, UserId: userId }
    });

    if (!work) {
      return NextResponse.json("Creative work not found", { status: 404 });
    }

    const updatedWork = await prisma.creativeWorks.update({
      where: { Id: id },
      data: {
        Title: title || "",
        Category: category || "",
        Description: description || "",
        WorkUrl: workUrl || "",
        MediaUrl: mediaUrl || "",
        Date: date ? new Date(date) : new Date()
      }
    });

    return NextResponse.json(updatedWork);
  } catch (err: any) {
    console.error("PUT CreativeWork Error:", err);
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

    const work = await prisma.creativeWorks.findFirst({
      where: { Id: id, UserId: userId }
    });

    if (!work) {
      return NextResponse.json("Creative work not found", { status: 404 });
    }

    await prisma.creativeWorks.delete({
      where: { Id: id }
    });

    return NextResponse.json({ message: "Creative work deleted successfully." });
  } catch (err: any) {
    console.error("DELETE CreativeWork Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
