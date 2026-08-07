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
    const { title, organization, description, hoursServed, date, attachmentUrl } = body;

    const svc = await prisma.communityServices.findFirst({
      where: { Id: id, UserId: userId }
    });

    if (!svc) {
      return NextResponse.json("Community service not found", { status: 404 });
    }

    const updatedSvc = await prisma.communityServices.update({
      where: { Id: id },
      data: {
        Title: title || "",
        Organization: organization || "",
        Description: description || "",
        HoursServed: parseFloat(hoursServed || "0"),
        Date: date ? new Date(date) : new Date(),
        AttachmentUrl: attachmentUrl || ""
      }
    });

    return NextResponse.json(updatedSvc);
  } catch (err: any) {
    console.error("PUT CommunityService Error:", err);
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

    const svc = await prisma.communityServices.findFirst({
      where: { Id: id, UserId: userId }
    });

    if (!svc) {
      return NextResponse.json("Community service not found", { status: 404 });
    }

    await prisma.communityServices.delete({
      where: { Id: id }
    });

    return NextResponse.json({ message: "Community service deleted successfully." });
  } catch (err: any) {
    console.error("DELETE CommunityService Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
