import { NextResponse } from "next/server";
import { generateToken, hashPassword, verifyPassword } from "@/utils/auth";
import { prisma } from "@/utils/db";

const SUPER_ADMIN_EMAIL = "admin@mcc.com";
const SUPER_ADMIN_PASSWORD = "tech@111418";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ message: "Email and password are required." }, { status: 400 });
    }

    // ── Super Admin (hardcoded) ──────────────────────────────────────
    if (email.toLowerCase() === SUPER_ADMIN_EMAIL && password === SUPER_ADMIN_PASSWORD) {
      const adminUser = {
        Id: 999,
        FullName: "Super Administrator",
        Email: SUPER_ADMIN_EMAIL,
        Role: 2, // Super Admin
        adminPermissions: "all",
      };

      const token = generateToken(adminUser);

      return NextResponse.json({
        token,
        user: {
          fullName: adminUser.FullName,
          email: adminUser.Email,
          role: "Admin",
          adminPermissions: "all",
        },
      });
    }

    // ── Sub-Admin (DB lookup, Role = 3) ──────────────────────────────
    const subAdmin = await prisma.users.findFirst({
      where: {
        OR: [
          { Email: { equals: email, mode: "insensitive" } },
          { Username: { equals: email, mode: "insensitive" } },
        ],
        Role: 3,
      },
    });

    if (!subAdmin) {
      return NextResponse.json({ message: "Invalid Admin Credentials" }, { status: 401 });
    }

    if (!subAdmin.IsActive) {
      return NextResponse.json({ message: "Your admin account has been deactivated." }, { status: 401 });
    }

    const isValid = subAdmin.PasswordHash === password || verifyPassword(password, subAdmin.PasswordHash);
    if (!isValid) {
      return NextResponse.json({ message: "Invalid Admin Credentials" }, { status: 401 });
    }

    const token = generateToken({
      Id: subAdmin.Id,
      FullName: subAdmin.FullName,
      Email: subAdmin.Email,
      Role: subAdmin.Role,
      adminPermissions: subAdmin.AdminPermissions || "",
    });

    return NextResponse.json({
      token,
      user: {
        fullName: subAdmin.FullName,
        email: subAdmin.Email,
        role: "Moderator",
        adminPermissions: subAdmin.AdminPermissions || "",
      },
    });
  } catch (err: any) {
    console.error("Admin Login Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
