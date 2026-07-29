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
      data: { IsPublished: true, IsClosed: false }
    });

    return NextResponse.json("Assessment published successfully.");
  } catch (err: any) {
    console.error("Publish Assessment Error:", err);
=======
import { getUserFromRequest, hasModulePermission } from "@/utils/auth";

// POST /api/Assessments/[id]/publish — toggle publish/unpublish
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload || !hasModulePermission(userPayload, "assessments", "write")) {
      return NextResponse.json("Forbidden", { status: 403 });
    }
    const { id } = await params;
    const assessment = await prisma.assessments.findUnique({ where: { Id: parseInt(id) } });
    if (!assessment) return NextResponse.json("Not found", { status: 404 });

    const newStatus = assessment.Status === "Published" ? "Draft" : "Published";
    await prisma.assessments.update({
      where: { Id: parseInt(id) },
      data: { Status: newStatus, UpdatedAt: new Date() },
    });

    return NextResponse.json({ success: true, status: newStatus });
  } catch (err: any) {
    console.error("POST Assessment publish Error:", err);
>>>>>>> 40a9e30e1da64064e79b351472bee8ee265619c7
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
