import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { hashPassword, generateToken } from "@/utils/auth";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    let { email, fullName } = body;

    email = (email || "").trim();
    fullName = (fullName || "").trim();

    if (!email) {
      return NextResponse.json("Email is required.", { status: 400 });
    }

    if (!email.toLowerCase().endsWith("@mcc.edu.in")) {
      return NextResponse.json(
        "External login is restricted to Madras Christian College email addresses ending with '@mcc.edu.in'.",
        { status: 400 }
      );
    }

    let user = await prisma.users.findFirst({
      where: { Email: { equals: email, mode: "insensitive" } }
    });

    if (!user) {
      const generatedPassword = crypto.randomBytes(16).toString("hex");
      const cleanName = (fullName || "External User").replace(/\s+/g, "").toLowerCase();
      
      // Find a unique username
      let username = "";
      let isUnique = false;
      while (!isUnique) {
        const rand = Math.floor(100 + Math.random() * 900);
        username = `mcc_${cleanName}_${rand}`;
        const count = await prisma.users.count({ where: { Username: username } });
        if (count === 0) {
          isUnique = true;
        }
      }

      user = await prisma.users.create({
        data: {
          FullName: fullName || "External User",
          Email: email,
          PasswordHash: hashPassword(generatedPassword),
          Department: "Computer Science (B.Sc)",
          Stream: "SFS",
          RegisterNumber: "EXT-" + crypto.randomBytes(4).toString("hex").toUpperCase(),
          Role: 1, // Student
          IsActive: true,
          CreatedAt: new Date(),
          ProfileImageUrl: "",
          IsTemporaryPassword: false,
          Username: username
        }
      });
    }

    const token = generateToken({
      Id: user.Id,
      FullName: user.FullName,
      Email: user.Email,
      Role: user.Role,
    });

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
    console.error("External Login Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
