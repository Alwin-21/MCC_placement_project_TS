import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { getUserFromRequest, hasModulePermission } from "@/utils/auth";

export async function GET(request: Request) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload || !hasModulePermission(userPayload, "institution", "read")) {
      return NextResponse.json("Unauthorized", { status: 401 });
    }

    let inst = await prisma.institutionDetails.findFirst();
    if (!inst) {
      inst = await prisma.institutionDetails.create({
        data: {
          Name: "Madras Christian College",
          Code: "MCC",
          Description: "A premier institution of higher education in South India.",
          Address: "Tambaram, Chennai, Tamil Nadu 600059",
          ContactEmail: "info@mcc.edu.in",
          ContactPhone: "044 2239 0675",
          Website: "https://mcc.edu.in",
          LogoUrl: "/assets/mcc_logo.png",
          Departments: "Computer Science;Computer Applications (BCA);Information Technology;Mathematics;Physics;Chemistry;Commerce;Business Administration (BBA);English;Economics"
        }
      });
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
    if (!userPayload || !hasModulePermission(userPayload, "institution", "write")) {
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
