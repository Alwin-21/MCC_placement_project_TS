import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { getUserFromRequest } from "@/utils/auth";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload || userPayload.role !== "Admin") {
      return NextResponse.json("Forbidden", { status: 403 });
    }

    const { id: idStr } = await params;
    const id = parseInt(idStr, 10);

    const body = await request.json();
    const { role } = body;

    const user = await prisma.users.findUnique({ where: { Id: id } });
    if (!user) {
      return NextResponse.json("User not found.", { status: 404 });
    }

    let parsedRole = 1;
    if (role === "Admin") parsedRole = 2;
    else if (role === "Moderator") parsedRole = 3;
    else if (role === "Student") parsedRole = 1;
    else {
      return NextResponse.json("Invalid role specified.", { status: 400 });
    }

    await prisma.users.update({
      where: { Id: id },
      data: { Role: parsedRole }
    });

    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    await prisma.auditLogs.create({
      data: {
        Action: "Modify Role",
        PerformedByEmail: userPayload.email,
        Timestamp: new Date(),
        Details: `Modified role of user ID ${id} (${user.Email}) to ${role}`,
        IpAddress: ip
      }
    });

    return NextResponse.json({ success: true, userId: user.Id, role: role });
  } catch (err: any) {
    console.error("PUT Admin User Role Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
