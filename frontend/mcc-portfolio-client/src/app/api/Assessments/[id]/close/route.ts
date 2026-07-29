import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
<<<<<<< HEAD
import { getUserFromRequest } from "@/utils/auth";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload || (userPayload.role !== "Admin" && userPayload.role !== "Moderator")) {
      return NextResponse.json("Unauthorized", { status: 401 });
    }

    const { id } = await params;
    const assessmentId = parseInt(id);

    await prisma.assessments.update({
      where: { Id: assessmentId },
      data: { IsClosed: true }
    });

    return NextResponse.json("Assessment closed successfully.");
  } catch (err: any) {
    console.error("Close Assessment Error:", err);
=======
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
>>>>>>> 40a9e30e1da64064e79b351472bee8ee265619c7
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
