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
    const { organizationName, role, description, hoursContributed, startDate, endDate, certificateUrl } = body;

    const ngo = await prisma.ngoActivities.findFirst({
      where: { Id: id, UserId: userId }
    });

    if (!ngo) {
      return NextResponse.json("NGO activity not found", { status: 404 });
    }

    const updatedNgo = await prisma.ngoActivities.update({
      where: { Id: id },
      data: {
        OrganizationName: organizationName || "",
        Role: role || "",
        Description: description || "",
        HoursContributed: parseFloat(hoursContributed || "0"),
        StartDate: startDate ? new Date(startDate) : new Date(),
        EndDate: endDate ? new Date(endDate) : null,
        CertificateUrl: certificateUrl || ""
      }
    });

    return NextResponse.json(updatedNgo);
  } catch (err: any) {
    console.error("PUT NgoActivity Error:", err);
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

    const ngo = await prisma.ngoActivities.findFirst({
      where: { Id: id, UserId: userId }
    });

    if (!ngo) {
      return NextResponse.json("NGO activity not found", { status: 404 });
    }

    await prisma.ngoActivities.delete({
      where: { Id: id }
    });

    return NextResponse.json({ message: "NGO activity deleted successfully." });
  } catch (err: any) {
    console.error("DELETE NgoActivity Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
