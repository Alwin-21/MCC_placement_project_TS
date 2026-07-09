import { NextResponse } from "next/server";
import { generateToken } from "@/utils/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    const adminEmail = "admin@mcc.com";
    const adminPassword = "admin123";

    if (email !== adminEmail || password !== adminPassword) {
      return NextResponse.json({ message: "Invalid Admin Credentials" }, { status: 401 });
    }

    // Mock admin user to generate token
    const adminUser = {
      Id: 999,
      FullName: "Administrator",
      Email: adminEmail,
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
  } catch (err: any) {
    console.error("Admin Login Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
