import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { getUserFromRequest } from "@/utils/auth";

export async function GET(request: Request) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload) return NextResponse.json("Unauthorized", { status: 401 });
    const userId = parseInt(userPayload.nameid, 10);

    const ngos = await prisma.ngoActivities.findMany({
      where: { UserId: userId }
    });

    return NextResponse.json(ngos);
  } catch (err: any) {
    console.error("GET NgoActivities Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload) return NextResponse.json("Unauthorized", { status: 401 });
    const userId = parseInt(userPayload.nameid, 10);

    const body = await request.json();
    const { organizationName, role, description, hoursContributed, startDate, endDate, certificateUrl } = body;

    const ngo = await prisma.ngoActivities.create({
      data: {
        OrganizationName: organizationName || "",
        Role: role || "",
        Description: description || "",
        HoursContributed: parseFloat(hoursContributed || "0"),
        StartDate: startDate ? new Date(startDate) : new Date(),
        EndDate: endDate ? new Date(endDate) : null,
        CertificateUrl: certificateUrl || "",
        UserId: userId
      }
    });

    return NextResponse.json(ngo);
  } catch (err: any) {
    console.error("POST NgoActivities Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
