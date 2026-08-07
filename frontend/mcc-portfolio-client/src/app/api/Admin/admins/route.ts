import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { getUserFromRequest, hashPassword } from "@/utils/auth";

// GET: List all sub-admins (Role = 3)
export async function GET(request: Request) {
  try {
    const user = getUserFromRequest(request);
    if (!user || user.role !== "Admin") {
      return NextResponse.json("Unauthorized – Super Admin only", { status: 401 });
    }

    const admins = await prisma.users.findMany({
      where: { Role: 3 },
      select: {
        Id: true,
        FullName: true,
        Email: true,
        Username: true,
        PasswordHash: true,
        IsActive: true,
        AdminPermissions: true,
        CreatedAt: true,
      },
      orderBy: { CreatedAt: "desc" },
    });

    return NextResponse.json(admins);
  } catch (err: any) {
    console.error("GET Admins Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

// POST: Create a new sub-admin account
export async function POST(request: Request) {
  try {
    const user = getUserFromRequest(request);
    if (!user || user.role !== "Admin") {
      return NextResponse.json("Unauthorized – Super Admin only", { status: 401 });
    }

    const body = await request.json();
    const { fullName, email, username, password, permissions } = body;

    if (!fullName?.trim() || !email?.trim() || !username?.trim() || !password?.trim()) {
      return NextResponse.json({ message: "Full name, email, username and password are required." }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ message: "Password must be at least 6 characters." }, { status: 400 });
    }

    // Check uniqueness
    const existing = await prisma.users.findFirst({
      where: {
        OR: [
          { Email: { equals: email.trim(), mode: "insensitive" } },
          { Username: { equals: username.trim(), mode: "insensitive" } },
        ],
      },
    });

    if (existing) {
      return NextResponse.json({ message: "An account with this email or username already exists." }, { status: 400 });
    }

    const passwordHash = password;
    const permissionsStr = typeof permissions === "object" && permissions !== null ? JSON.stringify(permissions) : "{}";

    const admin = await prisma.users.create({
      data: {
        FullName: fullName.trim(),
        Email: email.trim().toLowerCase(),
        Username: username.trim().toLowerCase(),
        PasswordHash: passwordHash,
        Role: 3,
        Department: "Administration",
        RegisterNumber: "",
        ProfileImageUrl: "",
        Stream: "",
        IsActive: true,
        IsTemporaryPassword: false,
        AdminPermissions: permissionsStr,
        CreatedAt: new Date(),
      },
    });

    return NextResponse.json(
      { id: admin.Id, message: "Admin account created successfully." },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("POST Admins Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
