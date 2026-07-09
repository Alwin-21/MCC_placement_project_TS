import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { verifyPassword, generateToken } from "@/utils/auth";
import { logActionAndNotify } from "@/utils/audit";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, email, password } = body;

    const searchKey = (username || email || "").trim();
    if (!searchKey || !password) {
      return NextResponse.json({ message: "Username/Email and Password are required." }, { status: 400 });
    }

    // Search user by username or email
    const user = await prisma.users.findFirst({
      where: {
        OR: [
          { Username: { equals: searchKey, mode: "insensitive" } },
          { Email: { equals: searchKey, mode: "insensitive" } },
        ],
      },
    });

    if (!user) {
      return NextResponse.json("Invalid credentials", { status: 401 });
    }

    if (!user.IsActive) {
      return NextResponse.json("Your account has been deactivated by the administrator.", { status: 401 });
    }

    const isValid = verifyPassword(password, user.PasswordHash);
    if (!isValid) {
      return NextResponse.json("Invalid credentials", { status: 401 });
    }

    const token = generateToken({
      Id: user.Id,
      FullName: user.FullName,
      Email: user.Email,
      Role: user.Role,
    });

    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    
    // Log Audit and Notification
    await logActionAndNotify(
      user.Id,
      user.Email,
      user.FullName,
      "Student Login",
      `Student ${user.FullName} logged in successfully.`,
      ip
    );

    const roleName = user.Role === 2 ? "Admin" : user.Role === 3 ? "Moderator" : "Student";

    return NextResponse.json({
      id: user.Id,
      token: token,
      fullName: user.FullName,
      email: user.Email,
      role: roleName,
      isTemporaryPassword: user.IsTemporaryPassword,
    });
  } catch (err: any) {
    console.error("Login Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
