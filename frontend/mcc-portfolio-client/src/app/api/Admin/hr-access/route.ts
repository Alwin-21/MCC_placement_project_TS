import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { getUserFromRequest } from "@/utils/auth";

export async function GET(request: Request) {
  try {
    const userPayload = getUserFromRequest(request);
    const role = userPayload?.role || userPayload?.Role;
    if (!userPayload || (role !== "Admin" && role !== 1 && role !== "1")) {
      return NextResponse.json({ message: "Unauthorized Admin access required" }, { status: 401 });
    }

    const companies = await prisma.company.findMany({
      select: {
        Id: true,
        Name: true,
        Email: true,
        Status: true,
        AllowedDepartments: true,
        CreatedAt: true,
        Users: {
          select: {
            Id: true,
            FullName: true,
            Email: true,
            Designation: true,
            Phone: true,
            IsActive: true,
          },
        },
      },
      orderBy: { Name: "asc" },
    });

    // Extract unique student departments from database for convenient admin selection
    const rawDepts = await prisma.users.findMany({
      select: { Department: true },
      distinct: ["Department"],
    });

    const defaultDepts = [
      "Computer Science",
      "Information Technology",
      "Computer Applications",
      "MCA",
      "BCA",
      "Commerce",
      "Business Administration",
      "Physics",
      "Chemistry",
      "Mathematics",
      "English",
    ];

    const studentDepts = rawDepts
      .map((d) => d.Department?.trim())
      .filter((d): d is string => Boolean(d && d.length > 0));

    const allDepartments = Array.from(new Set([...defaultDepts, ...studentDepts])).sort();

    return NextResponse.json({
      companies,
      allDepartments,
    });
  } catch (err: any) {
    console.error("GET HR Access Control Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const userPayload = getUserFromRequest(request);
    const role = userPayload?.role || userPayload?.Role;
    if (!userPayload || (role !== "Admin" && role !== 1 && role !== "1")) {
      return NextResponse.json({ message: "Unauthorized Admin access required" }, { status: 401 });
    }

    const body = await request.json();
    const { companyId, allowedDepartments } = body;

    if (!companyId || typeof companyId !== "number") {
      return NextResponse.json({ message: "Valid companyId is required." }, { status: 400 });
    }

    // allowedDepartments can be array of strings or string
    let deptString = "";
    if (Array.isArray(allowedDepartments)) {
      deptString = allowedDepartments.map((d) => d.trim()).filter(Boolean).join(";");
    } else if (typeof allowedDepartments === "string") {
      deptString = allowedDepartments;
    }

    const updatedCompany = await prisma.company.update({
      where: { Id: companyId },
      data: {
        AllowedDepartments: deptString,
      },
    });

    // Write audit log
    await prisma.auditLogs.create({
      data: {
        Action: "Update HR Department Permissions",
        PerformedByEmail: userPayload.Email || "admin",
        Timestamp: new Date(),
        Details: `Updated allowed departments for ${updatedCompany.Name} (ID: ${companyId}) to: "${deptString || "All Departments"}"`,
        IpAddress: "127.0.0.1",
      },
    });

    return NextResponse.json({
      message: "HR department permissions updated successfully.",
      companyId: updatedCompany.Id,
      allowedDepartments: updatedCompany.AllowedDepartments,
    });
  } catch (err: any) {
    console.error("PUT HR Access Control Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
