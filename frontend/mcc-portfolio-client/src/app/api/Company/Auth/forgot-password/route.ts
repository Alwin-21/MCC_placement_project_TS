import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import crypto from "crypto";
import { checkRateLimit, getClientIp, RATE_LIMITS } from "@/utils/rateLimiter";

export async function POST(request: Request) {
  try {
    // Rate limiting — max 3 per 10 minutes
    const ip = getClientIp(request);
    if (!checkRateLimit(ip, "company-forgot-password", RATE_LIMITS.FORGOT_PASSWORD.maxRequests, RATE_LIMITS.FORGOT_PASSWORD.windowMs)) {
      return NextResponse.json("Too many password reset requests. Please try again later.", { status: 429 });
    }

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
      // Avoid enumerating emails for security — always return success
      return NextResponse.json({
        success: true,
        message: "If the email is registered, a password reset link has been sent.",
      });
    }

    // Generate simulated reset token
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Store in status history for simulated email
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

    const responseBody: any = {
      success: true,
      message: "If the email is registered, a password reset link has been sent.",
    };

    // Only expose the token in non-production environments for testing
    if (process.env.NODE_ENV !== "production") {
      responseBody.simulatedToken = resetToken;
    }

    return NextResponse.json(responseBody);
  } catch (err: any) {
    console.error("Forgot Password Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
