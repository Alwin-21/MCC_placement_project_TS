import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { getUserFromRequest } from "@/utils/auth";

const DEFAULT_CONFIG = {
  lookAwayDurationLimit: 5, // default 5 seconds
  faceMissingTimeout: 5,
  pauseTimerOnFaceMissing: false,
  objectDetectionEnabled: true,
};

export async function GET(request: Request) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload) {
      return NextResponse.json("Unauthorized", { status: 401 });
    }

    try {
      const config = await prisma.matchingEngineConfig.findUnique({
        where: { ConfigKey: "proctoring_config" }
      });

      if (config) {
        const parsed = JSON.parse(config.ConfigVal);
        return NextResponse.json({ ...DEFAULT_CONFIG, ...parsed });
      }
    } catch (e) {
      console.warn("Could not fetch proctoring config from DB, returning defaults:", e);
    }

    return NextResponse.json(DEFAULT_CONFIG);
  } catch (err: any) {
    console.error("GET Proctoring Config Error:", err);
    return NextResponse.json(DEFAULT_CONFIG);
  }
}

export async function POST(request: Request) {
  try {
    const userPayload = getUserFromRequest(request);
    const role = userPayload?.role || userPayload?.Role;
    
    // Only Admin and Moderator can edit configurations
    if (!userPayload || (role !== "Admin" && role !== "Moderator" && role !== 2 && role !== 3)) {
      return NextResponse.json("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const { lookAwayDurationLimit, faceMissingTimeout, pauseTimerOnFaceMissing, objectDetectionEnabled } = body;

    if (lookAwayDurationLimit === undefined || typeof lookAwayDurationLimit !== "number" || lookAwayDurationLimit <= 0) {
      return NextResponse.json("Valid lookAwayDurationLimit is required.", { status: 400 });
    }

    const newConfig = {
      lookAwayDurationLimit,
      faceMissingTimeout: typeof faceMissingTimeout === "number" ? faceMissingTimeout : 5,
      pauseTimerOnFaceMissing: typeof pauseTimerOnFaceMissing === "boolean" ? pauseTimerOnFaceMissing : false,
      objectDetectionEnabled: typeof objectDetectionEnabled === "boolean" ? objectDetectionEnabled : true,
    };

    const config = await prisma.matchingEngineConfig.upsert({
      where: { ConfigKey: "proctoring_config" },
      update: { ConfigVal: JSON.stringify(newConfig) },
      create: { ConfigKey: "proctoring_config", ConfigVal: JSON.stringify(newConfig) }
    });

    // Write audit log
    const email = userPayload.email || "admin";
    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    await prisma.auditLogs.create({
      data: {
        Action: "Update Proctoring Config",
        PerformedByEmail: email,
        Timestamp: new Date(),
        Details: `Updated global proctoring config: ${config.ConfigVal}`,
        IpAddress: ip,
      }
    });

    return NextResponse.json({ success: true, config: newConfig });
  } catch (err: any) {
    console.error("POST Proctoring Config Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
