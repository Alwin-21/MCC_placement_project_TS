import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { getUserFromRequest } from "@/utils/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload) return NextResponse.json("Unauthorized", { status: 401 });
    const userId = parseInt(userPayload.nameid, 10);

    const { id: idStr } = await params;
    const id = parseInt(idStr, 10);

    const existing = await prisma.savedResumes.findFirst({
      where: { Id: id, UserId: userId }
    });

    if (!existing) {
      return NextResponse.json("Resume not found", { status: 404 });
    }

    const duplicate = await prisma.savedResumes.create({
      data: {
        ResumeTitle: `${existing.ResumeTitle} (Copy)`,
        SelectedTheme: existing.SelectedTheme,
        AccentColor: existing.AccentColor,
        ResumeDataJson: existing.ResumeDataJson,
        UserId: existing.UserId,
        CreatedAt: new Date(),
        UpdatedAt: new Date()
      }
    });

    return NextResponse.json(duplicate);
  } catch (err: any) {
    console.error("Duplicate SavedResume Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
