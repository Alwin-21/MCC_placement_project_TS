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
          Description: "Madras Christian College (MCC) is a liberal arts and sciences college in Chennai, India.",
          Address: "East Tambaram, Chennai - 600 059, Tamil Nadu, India",
          ContactEmail: "info@mcc.edu.in",
          ContactPhone: "+91-44-22390675",
          Website: "https://mcc.edu.in",
          LogoUrl: "/mcc-logo.png",
          Departments: "English;Tamil;Languages;History;Political Science;Public Administration;Economics;Philosophy;Commerce;Social Work;Mathematics;Statistics;Physics;Chemistry;Botany;Zoology;Journalism;Business Administration;Communication;Geography;Tourism Studies;Microbiology;Computer Application (BCA);Computer Science (B.Sc);Computer Science (MCA);Visual Communication;Physical Education, Health Education and Sports;Psychology;Data Science;Physical Education"
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
