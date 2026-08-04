import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { verifyPassword, generateToken, UserRole } from "@/utils/auth";
import { checkRateLimit, getClientIp, RATE_LIMITS } from "@/utils/rateLimiter";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    // Rate limiting
    const ip = getClientIp(request);
    if (!checkRateLimit(ip, "company-login", RATE_LIMITS.LOGIN.maxRequests, RATE_LIMITS.LOGIN.windowMs)) {
      return NextResponse.json(
        "Too many login attempts. Please try again later.",
        { status: 429 }
      );
    }

    const body = await request.json();
    const { email, password } = body;

    const emailTrim = (email || "").trim().toLowerCase();
    if (!emailTrim || !password) {
      return NextResponse.json({ message: "Email and Password are required." }, { status: 400 });
    }

    if (!EMAIL_REGEX.test(emailTrim)) {
      return NextResponse.json({ message: "Please enter a valid email address." }, { status: 400 });
    }

    if (typeof password !== "string" || password.length < 8) {
      return NextResponse.json({ message: "Password must be at least 8 characters." }, { status: 400 });
    }

    const hrUser = await prisma.companyUsers.findUnique({
      where: { Email: emailTrim },
      include: {
        Company: true,
      },
    });

    if (!hrUser) {
      return NextResponse.json("Invalid credentials", { status: 401 });
    }

    // Check Lockout
    if (hrUser.LockedUntil && new Date() < hrUser.LockedUntil) {
      const remainingMinutes = Math.ceil(
        (hrUser.LockedUntil.getTime() - Date.now()) / (60 * 1000)
      );
      return NextResponse.json(
        `This account has been locked due to repeated login failures. Please try again in ${remainingMinutes} minutes.`,
        { status: 403 }
      );
    }

    const isPasswordValid = verifyPassword(password, hrUser.PasswordHash);

    if (!isPasswordValid) {
      // Increment failed attempts
      const newFailedCount = hrUser.FailedLoginAttempts + 1;
      const isLocking = newFailedCount >= 5;
      const lockedUntil = isLocking ? new Date(Date.now() + 15 * 60 * 1000) : null;

      await prisma.companyUsers.update({
        where: { Id: hrUser.Id },
        data: {
          FailedLoginAttempts: newFailedCount,
          LockedUntil: lockedUntil,
        },
      });

      if (isLocking) {
        return NextResponse.json(
          "Too many failed login attempts. Your account has been locked for 15 minutes.",
          { status: 403 }
        );
      }

      return NextResponse.json("Invalid credentials", { status: 401 });
    }

    // Check Company Status (Only Approved/Verified companies can login)
    const company = hrUser.Company;
    if (company.Status === "Pending") {
      return NextResponse.json(
        "Your company onboarding is pending verification review. You will receive a notification once approved.",
        { status: 403 }
      );
    } else if (company.Status === "Rejected") {
      return NextResponse.json(
        "Your company registration request was rejected by the administrator.",
        { status: 403 }
      );
    } else if (company.Status === "Suspended") {
      return NextResponse.json(
        "Your company account has been suspended by the placement administration.",
        { status: 403 }
      );
    } else if (company.Status === "Inactive" || company.Status === "Archived") {
      return NextResponse.json(
        `Your company account status is currently ${company.Status}.`,
        { status: 403 }
      );
    }

    // Correct login - clear lockout state
    await prisma.companyUsers.update({
      where: { Id: hrUser.Id },
      data: {
        FailedLoginAttempts: 0,
        LockedUntil: null,
      },
    });

    const token = generateToken({
      Id: hrUser.Id,
      FullName: hrUser.FullName,
      Email: hrUser.Email,
      Role: UserRole.Company,
    });

    // ip already captured by getClientIp at the start of the handler

    // Write audit logs
    await prisma.companyAuditLogs.create({
      data: {
        CompanyId: company.Id,
        Action: "Company User Login",
        PerformedByEmail: hrUser.Email,
        Timestamp: new Date(),
        Details: `HR Representative ${hrUser.FullName} logged in successfully.`,
        IpAddress: ip,
      },
    });

    await prisma.auditLogs.create({
      data: {
        Action: "Company Login",
        PerformedByEmail: hrUser.Email,
        Timestamp: new Date(),
        Details: `Company HR user ${hrUser.FullName} (${company.Name}) logged in successfully.`,
        IpAddress: ip,
      },
    });

    return NextResponse.json({
      id: hrUser.Id,
      token: token,
      fullName: hrUser.FullName,
      email: hrUser.Email,
      role: "Company",
      companyId: company.Id,
      companyName: company.Name,
      companyStatus: company.Status,
    });
  } catch (err: any) {
    console.error("Company Login Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
