import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
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
      data: { IsPublished: false }
    });

    return NextResponse.json("Assessment unpublished successfully.");
  } catch (err: any) {
    console.error("Unpublish Assessment Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
