import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { getUserFromRequest, hasModulePermission } from "@/utils/auth";

// GET /api/Admin/institution/dept-streams
// Returns the full DeptStreams JSON map { [deptName]: "Aided" | "SFS" }
export async function GET(request: Request) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload || !hasModulePermission(userPayload, "institution", "read")) {
      return NextResponse.json("Unauthorized", { status: 401 });
    }

    const inst = await prisma.institutionDetails.findFirst();
    if (!inst) {
      return NextResponse.json({});
    }

    let deptStreams: Record<string, string> = {};
    if (inst.DeptStreams) {
      try {
        deptStreams = JSON.parse(inst.DeptStreams);
      } catch {
        deptStreams = {};
      }
    }

    return NextResponse.json(deptStreams);
  } catch (err: any) {
    console.error("GET DeptStreams Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/Admin/institution/dept-streams
// Body: { deptStreams: { [deptName]: "Aided" | "SFS" } }
// Saves/merges a stream map into the InstitutionDetails record
export async function PUT(request: Request) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload || !hasModulePermission(userPayload, "institution", "write")) {
      return NextResponse.json("Forbidden", { status: 403 });
    }

    const body = await request.json();
    const { deptStreams } = body as { deptStreams: Record<string, string> };

    if (!deptStreams || typeof deptStreams !== "object") {
      return NextResponse.json({ message: "deptStreams must be an object" }, { status: 400 });
    }

    // Sanitize values to only allow "Aided" or "SFS"
    const sanitized: Record<string, string> = {};
    for (const [dept, stream] of Object.entries(deptStreams)) {
      if (dept && (stream === "Aided" || stream === "SFS")) {
        sanitized[dept] = stream;
      }
    }

    let inst = await prisma.institutionDetails.findFirst();
    if (!inst) {
      return NextResponse.json({ message: "No institution record found." }, { status: 404 });
    }

    // Merge with existing map (don't overwrite unrelated depts)
    let existing: Record<string, string> = {};
    if (inst.DeptStreams) {
      try {
        existing = JSON.parse(inst.DeptStreams);
      } catch {
        existing = {};
      }
    }
    const merged = { ...existing, ...sanitized };

    await prisma.institutionDetails.update({
      where: { Id: inst.Id },
      data: { DeptStreams: JSON.stringify(merged) },
    });

    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    await prisma.auditLogs.create({
      data: {
        Action: "Update Department Streams",
        PerformedByEmail: userPayload.email,
        Timestamp: new Date(),
        Details: `Updated stream classification for ${Object.keys(sanitized).length} departments.`,
        IpAddress: ip,
      },
    });

    return NextResponse.json({ success: true, deptStreams: merged });
  } catch (err: any) {
    console.error("PUT DeptStreams Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
