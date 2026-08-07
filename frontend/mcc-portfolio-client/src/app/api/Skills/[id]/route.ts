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
    const { name, level, category } = body;

    const skill = await prisma.skills.findFirst({
      where: { Id: id, UserId: userId }
    });

    if (!skill) {
      return NextResponse.json("Skill not found", { status: 404 });
    }

    const updatedSkill = await prisma.skills.update({
      where: { Id: id },
      data: {
        Name: name || "",
        Level: level || "",
        Category: category || ""
      }
    });

    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    await logActionAndNotify(userId, userPayload.email, userPayload.unique_name, "Skills Updated", `Student ${userPayload.unique_name} updated skill: ${name}.`, ip);

    return NextResponse.json(updatedSkill);
  } catch (err: any) {
    console.error("PUT Skill Error:", err);
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

    const skill = await prisma.skills.findFirst({
      where: { Id: id, UserId: userId }
    });

    if (!skill) {
      return NextResponse.json("Skill not found", { status: 404 });
    }

    await prisma.skills.delete({
      where: { Id: id }
    });

    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    await logActionAndNotify(userId, userPayload.email, userPayload.unique_name, "Skills Deleted", `Student ${userPayload.unique_name} deleted skill: ${skill.Name}.`, ip);

    return NextResponse.json({ message: "Skill deleted successfully." });
  } catch (err: any) {
    console.error("DELETE Skill Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
