import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { hashPassword } from "@/utils/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, token, newPassword } = body;

    const emailTrim = (email || "").trim().toLowerCase();
    if (!emailTrim || !token || !newPassword) {
      return NextResponse.json("Email, token, and new password are required.", { status: 400 });
    }

    const hrUser = await prisma.companyUsers.findUnique({
      where: { Email: emailTrim },
      include: { Company: true },
    });

    if (!hrUser) {
      return NextResponse.json("Invalid request", { status: 400 });
    }

    // Verify token from CompanyStatusHistory comments
    const matchingHistory = await prisma.companyStatusHistory.findFirst({
      where: {
        CompanyId: hrUser.CompanyId,
        Comments: { contains: token },
      },
      orderBy: { Timestamp: "desc" },
    });

    if (!matchingHistory) {
      return NextResponse.json("Invalid or expired reset token.", { status: 400 });
    }

    // Hash and update password
    const passwordHash = hashPassword(newPassword);

    await prisma.companyUsers.update({
      where: { Id: hrUser.Id },
      data: {
        PasswordHash: passwordHash,
        FailedLoginAttempts: 0,
        LockedUntil: null,
      },
    });

    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    await prisma.companyAuditLogs.create({
      data: {
        CompanyId: hrUser.CompanyId,
        Action: "Password Reset Completed",
        PerformedByEmail: hrUser.Email,
        Timestamp: new Date(),
        Details: "HR Representative successfully reset account password.",
        IpAddress: ip,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Password reset completed successfully. You can now login.",
    });
  } catch (err: any) {
    console.error("Reset Password Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
