import { NextResponse } from "next/server";
import { generateToken } from "@/utils/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    const superAdminEmail = "admin@mcc.com";
    const superAdminPassword = "admin123";

    const staffEmail = "staff@mcc.com";
    const staffPassword = "staff123";

    if (email === superAdminEmail && password === superAdminPassword) {
      const adminUser = {
        Id: 999,
        FullName: "Administrator",
        Email: superAdminEmail,
        Role: 2, // Admin
      };

      const token = generateToken(adminUser);

      return NextResponse.json({
        token: token,
        user: {
          fullName: adminUser.FullName,
          email: adminUser.Email,
          role: "Admin",
        },
      });
    } else if (email === staffEmail && password === staffPassword) {
      const staffUser = {
        Id: 998,
        FullName: "Staff Administrator",
        Email: staffEmail,
        Role: 3, // Moderator / Normal Admin
      };

      const token = generateToken(staffUser);

      return NextResponse.json({
        token: token,
        user: {
          fullName: staffUser.FullName,
          email: staffUser.Email,
          role: "Moderator",
        },
      });
    }

    return NextResponse.json({ message: "Invalid Admin Credentials" }, { status: 401 });
  } catch (err: any) {
    console.error("Admin Login Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
