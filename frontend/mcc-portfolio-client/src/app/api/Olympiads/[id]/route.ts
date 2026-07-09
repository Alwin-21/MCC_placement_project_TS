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
    const { name, subject, rank, year, description, certificateUrl } = body;

    const oly = await prisma.olympiads.findFirst({
      where: { Id: id, UserId: userId }
    });

    if (!oly) {
      return NextResponse.json("Olympiad not found", { status: 404 });
    }

    const updatedOly = await prisma.olympiads.update({
      where: { Id: id },
      data: {
        Name: name || "",
        Subject: subject || "",
        Rank: rank || "",
        Year: parseInt(year || "0", 10),
        Description: description || "",
        CertificateUrl: certificateUrl || ""
      }
    });

    return NextResponse.json(updatedOly);
  } catch (err: any) {
    console.error("PUT Olympiad Error:", err);
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

    const oly = await prisma.olympiads.findFirst({
      where: { Id: id, UserId: userId }
    });

    if (!oly) {
      return NextResponse.json("Olympiad not found", { status: 404 });
    }

    await prisma.olympiads.delete({
      where: { Id: id }
    });

    return NextResponse.json({ message: "Olympiad deleted successfully." });
  } catch (err: any) {
    console.error("DELETE Olympiad Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
