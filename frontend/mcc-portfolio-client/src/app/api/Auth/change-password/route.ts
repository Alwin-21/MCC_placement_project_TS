import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { getUserFromRequest, hashPassword } from "@/utils/auth";

export async function POST(request: Request) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload) {
      return NextResponse.json("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const { newPassword } = body;

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json("Password must be at least 6 characters.", { status: 400 });
    }

    const userId = parseInt(userPayload.nameid, 10);
    const user = await prisma.users.findUnique({
      where: { Id: userId }
    });

    if (!user) {
      return NextResponse.json("User not found.", { status: 404 });
    }

    await prisma.users.update({
      where: { Id: userId },
      data: {
        PasswordHash: hashPassword(newPassword),
        IsTemporaryPassword: false
      }
    });

    return NextResponse.json({ success: true, message: "Password updated successfully." });
  } catch (err: any) {
    console.error("Change Password Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
