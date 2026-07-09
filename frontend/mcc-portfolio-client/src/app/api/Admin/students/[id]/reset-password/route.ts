import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { getUserFromRequest, hashPassword } from "@/utils/auth";

export async function POST(
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
    const { password } = body;

    if (!password) {
      return NextResponse.json("Password is required.", { status: 400 });
    }

    const user = await prisma.users.findUnique({ where: { Id: id } });
    if (!user) {
      return NextResponse.json("Student not found.", { status: 404 });
    }

    await prisma.users.update({
      where: { Id: id },
      data: {
        PasswordHash: hashPassword(password),
        IsTemporaryPassword: false
      }
    });

    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    await prisma.auditLogs.create({
      data: {
        Action: "Reset Password",
        PerformedByEmail: userPayload.email,
        Timestamp: new Date(),
        Details: `Reset password for student ${user.Email} (${user.FullName})`,
        IpAddress: ip
      }
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("POST Admin Reset Password Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
