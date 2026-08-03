import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { getUserFromRequest, hasModulePermission } from "@/utils/auth";

export async function GET(request: Request) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload || !hasModulePermission(userPayload, "companies", "read")) {
      return NextResponse.json("Unauthorized", { status: 401 });
    }

    const companies = await prisma.company.findMany({
      include: {
        Profile: true,
        Locations: true,
        Documents: true,
        Users: {
          select: {
            Id: true,
            FullName: true,
            Email: true,
            Designation: true,
            Phone: true,
            AlternatePhone: true,
            IsActive: true,
          },
        },
        Verifications: {
          orderBy: { Timestamp: "desc" },
        },
      },
      orderBy: { CreatedAt: "desc" },
    });

    return NextResponse.json(companies);
  } catch (err: any) {
    console.error("GET Admin Companies Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
