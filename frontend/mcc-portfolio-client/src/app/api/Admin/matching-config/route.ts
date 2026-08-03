import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { getUserFromRequest, hasModulePermission } from "@/utils/auth";

const DEFAULT_WEIGHTS = {
  skills: 0.35,
  experience: 0.20,
  projects: 0.15,
  certifications: 0.10,
  completeness: 0.10,
  achievements: 0.05,
  cgpa: 0.05
};

export async function GET(request: Request) {
  try {
    const userPayload = getUserFromRequest(request);
    // Allow admins to read configurations, also allow recruiters (role === "Company") to read weights for matching percentage display!
    if (!userPayload) {
      return NextResponse.json("Unauthorized", { status: 401 });
    }

    if (userPayload.role !== "Company" && !hasModulePermission(userPayload, "institution", "read")) {
      return NextResponse.json("Unauthorized", { status: 401 });
    }

    const config = await prisma.matchingEngineConfig.findUnique({
      where: { ConfigKey: "weights" }
    });

    if (!config) {
      return NextResponse.json(DEFAULT_WEIGHTS);
    }

    try {
      const parsed = JSON.parse(config.ConfigVal);
      return NextResponse.json(parsed);
    } catch (e) {
      return NextResponse.json(DEFAULT_WEIGHTS);
    }
  } catch (err: any) {
    console.error("GET Matching Config Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload || !hasModulePermission(userPayload, "institution", "write")) {
      return NextResponse.json("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const { weights } = body;

    if (!weights) {
      return NextResponse.json("Weights are required.", { status: 400 });
    }

    // Verify weights sum to 1.0 approximately
    const sum = Object.values(weights).reduce((acc: number, val: any) => acc + parseFloat(val), 0);
    if (Math.abs(sum - 1.0) > 0.01) {
      return NextResponse.json("Weights must sum to 100% (1.0). Current sum: " + sum, { status: 400 });
    }

    const config = await prisma.matchingEngineConfig.upsert({
      where: { ConfigKey: "weights" },
      update: { ConfigVal: JSON.stringify(weights) },
      create: { ConfigKey: "weights", ConfigVal: JSON.stringify(weights) }
    });

    // Security audit logging
    const adminEmail = userPayload.email;
    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    await prisma.auditLogs.create({
      data: {
        Action: "Config Updated",
        PerformedByEmail: adminEmail,
        Timestamp: new Date(),
        Details: `Updated global talent matching weights: ${config.ConfigVal}`,
        IpAddress: ip,
      }
    });

    return NextResponse.json({ success: true, weights });
  } catch (err: any) {
    console.error("POST Matching Config Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
