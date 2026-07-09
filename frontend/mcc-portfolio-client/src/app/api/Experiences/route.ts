import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { getUserFromRequest } from "@/utils/auth";
import { logActionAndNotify } from "@/utils/audit";

export async function GET(request: Request) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload) return NextResponse.json("Unauthorized", { status: 401 });
    const userId = parseInt(userPayload.nameid, 10);

    const experiences = await prisma.experiences.findMany({
      where: { UserId: userId }
    });

    return NextResponse.json(experiences);
  } catch (err: any) {
    console.error("GET Experiences Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload) return NextResponse.json("Unauthorized", { status: 401 });
    const userId = parseInt(userPayload.nameid, 10);

    const body = await request.json();
    const { title, company, location, description, startDate, endDate, isCurrent, category } = body;

    const exp = await prisma.experiences.create({
      data: {
        Title: title || "",
        Company: company || "",
        Location: location || "",
        Description: description || "",
        StartDate: startDate || "",
        EndDate: endDate || "",
        IsCurrent: !!isCurrent,
        Category: category || "",
        UserId: userId
      }
    });

    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    await logActionAndNotify(userId, userPayload.email, userPayload.unique_name, "Internship Added", `Student ${userPayload.unique_name} added an internship: ${title}.`, ip);

    return NextResponse.json(exp);
  } catch (err: any) {
    console.error("POST Experiences Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
