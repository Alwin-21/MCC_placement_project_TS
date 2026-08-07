import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { getUserFromRequest } from "@/utils/auth";

export async function GET(request: Request) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload || userPayload.role !== "Admin") {
      return NextResponse.json("Forbidden", { status: 403 });
    }

    const logs = await prisma.auditLogs.findMany({
      orderBy: { Timestamp: "desc" }
    });

    return NextResponse.json(logs);
  } catch (err: any) {
    console.error("GET Admin Audit Logs Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
