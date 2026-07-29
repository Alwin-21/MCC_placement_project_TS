import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { getUserFromRequest, hasModulePermission } from "@/utils/auth";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload || !hasModulePermission(userPayload, "assessments", "write")) {
      return NextResponse.json("Forbidden", { status: 403 });
    }

    const { id } = await params;
    const assessmentId = parseInt(id);

    await prisma.assessments.update({
      where: { Id: assessmentId },
      data: { Status: "Draft", UpdatedAt: new Date() }
    });

    return NextResponse.json({ success: true, status: "Draft" });
  } catch (err: any) {
    console.error("Unpublish Assessment Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
