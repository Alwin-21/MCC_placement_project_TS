import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { getUserFromRequest } from "@/utils/auth";

export async function GET(request: Request) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload) return NextResponse.json("Unauthorized", { status: 401 });
    const userId = parseInt(userPayload.nameid, 10);

    const services = await prisma.communityServices.findMany({
      where: { UserId: userId }
    });

    return NextResponse.json(services);
  } catch (err: any) {
    console.error("GET CommunityServices Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload) return NextResponse.json("Unauthorized", { status: 401 });
    const userId = parseInt(userPayload.nameid, 10);

    const body = await request.json();
    const { title, organization, description, hoursServed, date, attachmentUrl } = body;

    const svc = await prisma.communityServices.create({
      data: {
        Title: title || "",
        Organization: organization || "",
        Description: description || "",
        HoursServed: parseFloat(hoursServed || "0"),
        Date: date ? new Date(date) : new Date(),
        AttachmentUrl: attachmentUrl || "",
        UserId: userId
      }
    });

    return NextResponse.json(svc);
  } catch (err: any) {
    console.error("POST CommunityServices Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
