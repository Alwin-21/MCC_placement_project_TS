import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { getUserFromRequest } from "@/utils/auth";

export async function GET(request: Request) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload) return NextResponse.json("Unauthorized", { status: 401 });
    const userId = parseInt(userPayload.nameid, 10);

    const olympiads = await prisma.olympiads.findMany({
      where: { UserId: userId }
    });

    return NextResponse.json(olympiads);
  } catch (err: any) {
    console.error("GET Olympiads Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload) return NextResponse.json("Unauthorized", { status: 401 });
    const userId = parseInt(userPayload.nameid, 10);

    const body = await request.json();
    const { name, subject, rank, year, description, certificateUrl } = body;

    const oly = await prisma.olympiads.create({
      data: {
        Name: name || "",
        Subject: subject || "",
        Rank: rank || "",
        Year: parseInt(year || "0", 10),
        Description: description || "",
        CertificateUrl: certificateUrl || "",
        UserId: userId
      }
    });

    return NextResponse.json(oly);
  } catch (err: any) {
    console.error("POST Olympiads Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
