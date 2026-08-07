import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { getUserFromRequest } from "@/utils/auth";
import { logActionAndNotify } from "@/utils/audit";

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
    const { title, company, location, description, startDate, endDate, isCurrent, category } = body;

    const exp = await prisma.experiences.findFirst({
      where: { Id: id, UserId: userId }
    });

    if (!exp) {
      return NextResponse.json("Experience not found", { status: 404 });
    }

    const updatedExp = await prisma.experiences.update({
      where: { Id: id },
      data: {
        Title: title || "",
        Company: company || "",
        Location: location || "",
        Description: description || "",
        StartDate: startDate || "",
        EndDate: endDate || "",
        IsCurrent: !!isCurrent,
        Category: category || ""
      }
    });

    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    await logActionAndNotify(userId, userPayload.email, userPayload.unique_name, "Internship Updated", `Student ${userPayload.unique_name} updated internship: ${title}.`, ip);

    return NextResponse.json(updatedExp);
  } catch (err: any) {
    console.error("PUT Experience Error:", err);
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

    const exp = await prisma.experiences.findFirst({
      where: { Id: id, UserId: userId }
    });

    if (!exp) {
      return NextResponse.json("Experience not found", { status: 404 });
    }

    await prisma.experiences.delete({
      where: { Id: id }
    });

    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    await logActionAndNotify(userId, userPayload.email, userPayload.unique_name, "Internship Deleted", `Student ${userPayload.unique_name} deleted internship: ${exp.Title}.`, ip);

    return NextResponse.json({ message: "Internship deleted successfully." });
  } catch (err: any) {
    console.error("DELETE Experience Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
