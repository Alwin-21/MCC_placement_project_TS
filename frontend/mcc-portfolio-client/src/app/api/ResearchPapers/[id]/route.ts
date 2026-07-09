import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { getUserFromRequest } from "@/utils/auth";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload) return NextResponse.json("Unauthorized", { status: 401 });
    const userId = parseInt(userPayload.nameid, 10);

    const { id: idStr } = await params;
    const id = parseInt(idStr, 10);

    const body = await request.json();
    const { title, abstract, conference, paperUrl, publishedDate, category } = body;

    const paper = await prisma.researchPapers.findFirst({
      where: { Id: id, UserId: userId }
    });

    if (!paper) {
      return NextResponse.json("Research paper not found", { status: 404 });
    }

    const updatedPaper = await prisma.researchPapers.update({
      where: { Id: id },
      data: {
        Title: title || "",
        Abstract: abstract || "",
        Conference: conference || "",
        PaperUrl: paperUrl || "",
        PublishedDate: publishedDate ? new Date(publishedDate) : new Date(),
        Category: category || ""
      }
    });

    return NextResponse.json(updatedPaper);
  } catch (err: any) {
    console.error("PUT ResearchPaper Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload) return NextResponse.json("Unauthorized", { status: 401 });
    const userId = parseInt(userPayload.nameid, 10);

    const { id: idStr } = await params;
    const id = parseInt(idStr, 10);

    const paper = await prisma.researchPapers.findFirst({
      where: { Id: id, UserId: userId }
    });

    if (!paper) {
      return NextResponse.json("Research paper not found", { status: 404 });
    }

    await prisma.researchPapers.delete({
      where: { Id: id }
    });

    return NextResponse.json({ message: "Research paper deleted successfully." });
  } catch (err: any) {
    console.error("DELETE ResearchPaper Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
