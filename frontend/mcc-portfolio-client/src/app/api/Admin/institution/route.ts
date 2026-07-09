import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { getUserFromRequest } from "@/utils/auth";

export async function GET(request: Request) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload || (userPayload.role !== "Admin" && userPayload.role !== "Moderator")) {
      return NextResponse.json("Unauthorized", { status: 401 });
    }

    const inst = await prisma.institutionDetails.findFirst();
    if (!inst) {
      return NextResponse.json("Institution details not found.", { status: 404 });
    }

    return NextResponse.json(inst);
  } catch (err: any) {
    console.error("GET Admin Institution Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload || userPayload.role !== "Admin") {
      return NextResponse.json("Forbidden", { status: 403 });
    }

    const body = await request.json();
    const { name, code, description, address, contactEmail, contactPhone, website, logoUrl, departments } = body;

    let inst = await prisma.institutionDetails.findFirst();
    if (!inst) {
      inst = await prisma.institutionDetails.create({
        data: {
          Name: name || "",
          Code: code || "",
          Description: description || "",
          Address: address || "",
          ContactEmail: contactEmail || "",
          ContactPhone: contactPhone || "",
          Website: website || "",
          LogoUrl: logoUrl || "",
          Departments: departments || ""
        }
      });
    } else {
      inst = await prisma.institutionDetails.update({
        where: { Id: inst.Id },
        data: {
          Name: name || "",
          Code: code || "",
          Description: description || "",
          Address: address || "",
          ContactEmail: contactEmail || "",
          ContactPhone: contactPhone || "",
          Website: website || "",
          LogoUrl: logoUrl || "",
          Departments: departments || ""
        }
      });
    }

    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    await prisma.auditLogs.create({
      data: {
        Action: "Update Institution",
        PerformedByEmail: userPayload.email,
        Timestamp: new Date(),
        Details: `Updated details of institution: ${name}`,
        IpAddress: ip
      }
    });

    return NextResponse.json(inst);
  } catch (err: any) {
    console.error("PUT Admin Institution Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
