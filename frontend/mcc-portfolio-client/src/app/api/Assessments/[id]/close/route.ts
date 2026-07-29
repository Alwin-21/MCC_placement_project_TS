import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { getUserFromRequest, hasModulePermission } from "@/utils/auth";

// POST /api/Assessments/[id]/close
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload || !hasModulePermission(userPayload, "assessments", "write")) {
      return NextResponse.json("Forbidden", { status: 403 });
    }
    const { id } = await params;
    await prisma.assessments.update({
      where: { Id: parseInt(id) },
      data: { Status: "Closed", UpdatedAt: new Date() },
    });

    return NextResponse.json({ success: true, status: "Closed" });
  } catch (err: any) {
    console.error("POST Assessment close Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
