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
    const { competitionName, projectName, role, result, description, date, pitchDeckUrl } = body;

    const comp = await prisma.startupCompetitions.findFirst({
      where: { Id: id, UserId: userId }
    });

    if (!comp) {
      return NextResponse.json("Startup competition not found", { status: 404 });
    }

    const updatedComp = await prisma.startupCompetitions.update({
      where: { Id: id },
      data: {
        CompetitionName: competitionName || "",
        ProjectName: projectName || "",
        Role: role || "",
        Result: result || "",
        Description: description || "",
        Date: date ? new Date(date) : new Date(),
        PitchDeckUrl: pitchDeckUrl || ""
      }
    });

    return NextResponse.json(updatedComp);
  } catch (err: any) {
    console.error("PUT StartupCompetition Error:", err);
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

    const comp = await prisma.startupCompetitions.findFirst({
      where: { Id: id, UserId: userId }
    });

    if (!comp) {
      return NextResponse.json("Startup competition not found", { status: 404 });
    }

    await prisma.startupCompetitions.delete({
      where: { Id: id }
    });

    return NextResponse.json({ message: "Startup competition deleted successfully." });
  } catch (err: any) {
    console.error("DELETE StartupCompetition Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
