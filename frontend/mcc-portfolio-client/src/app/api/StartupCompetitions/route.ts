import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { getUserFromRequest } from "@/utils/auth";

export async function GET(request: Request) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload) return NextResponse.json("Unauthorized", { status: 401 });
    const userId = parseInt(userPayload.nameid, 10);

    const comps = await prisma.startupCompetitions.findMany({
      where: { UserId: userId }
    });

    return NextResponse.json(comps);
  } catch (err: any) {
    console.error("GET StartupCompetitions Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload) return NextResponse.json("Unauthorized", { status: 401 });
    const userId = parseInt(userPayload.nameid, 10);

    const body = await request.json();
    const { competitionName, projectName, role, result, description, date, pitchDeckUrl } = body;

    const comp = await prisma.startupCompetitions.create({
      data: {
        CompetitionName: competitionName || "",
        ProjectName: projectName || "",
        Role: role || "",
        Result: result || "",
        Description: description || "",
        Date: date ? new Date(date) : new Date(),
        PitchDeckUrl: pitchDeckUrl || "",
        UserId: userId
      }
    });

    return NextResponse.json(comp);
  } catch (err: any) {
    console.error("POST StartupCompetitions Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
