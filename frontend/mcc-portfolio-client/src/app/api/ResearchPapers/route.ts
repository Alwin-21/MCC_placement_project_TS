import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { getUserFromRequest } from "@/utils/auth";

export async function GET(request: Request) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload) return NextResponse.json("Unauthorized", { status: 401 });
    const userId = parseInt(userPayload.nameid, 10);

    const papers = await prisma.researchPapers.findMany({
      where: { UserId: userId }
    });

    return NextResponse.json(papers);
  } catch (err: any) {
    console.error("GET ResearchPapers Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload) return NextResponse.json("Unauthorized", { status: 401 });
    const userId = parseInt(userPayload.nameid, 10);

    const body = await request.json();
    const { title, abstract, conference, paperUrl, publishedDate, category } = body;

    const paper = await prisma.researchPapers.create({
      data: {
        Title: title || "",
        Abstract: abstract || "",
        Conference: conference || "",
        PaperUrl: paperUrl || "",
        PublishedDate: publishedDate ? new Date(publishedDate) : new Date(),
        Category: category || "",
        UserId: userId
      }
    });

    return NextResponse.json(paper);
  } catch (err: any) {
    console.error("POST ResearchPapers Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
