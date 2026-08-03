import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    const emailTrim = (email || "").trim().toLowerCase();
    if (!emailTrim) {
      return NextResponse.json("Email is required.", { status: 400 });
    }

    const hrUser = await prisma.companyUsers.findUnique({
      where: { Email: emailTrim },
      include: { Company: true },
    });

    if (!hrUser) {
      // Avoid enumerating emails for security, but return success message
      return NextResponse.json({
        success: true,
        message: "If the email is registered, a password reset link has been sent.",
      });
    }

    // Generate simulated reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const tokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    // Store in a status history or log for simulated email
    await prisma.companyStatusHistory.create({
      data: {
        CompanyId: hrUser.CompanyId,
        OldStatus: hrUser.Company.Status,
        NewStatus: hrUser.Company.Status,
        ChangedBy: "System",
        Comments: `Password reset requested. Token: ${resetToken}`,
      },
    });

    // Write audit log
    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    await prisma.companyAuditLogs.create({
      data: {
        CompanyId: hrUser.CompanyId,
        Action: "Password Reset Requested",
        PerformedByEmail: hrUser.Email,
        Timestamp: new Date(),
        Details: "HR Representative requested password reset link.",
        IpAddress: ip,
      },
    });

    // For ease of development/testing, return the token in the response
    return NextResponse.json({
      success: true,
      message: "If the email is registered, a password reset link has been sent.",
      simulatedToken: resetToken, // Useful for UI walkthroughs
    });
  } catch (err: any) {
    console.error("Forgot Password Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
