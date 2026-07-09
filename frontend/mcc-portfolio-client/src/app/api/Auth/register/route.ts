import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { hashPassword } from "@/utils/auth";
import { sendEmail } from "@/utils/email";

const AidedDepartments = new Set([
  "English", "Tamil", "Languages", "History", "Political Science", "Public Administration",
  "Economics", "Philosophy", "Commerce", "Social Work", "Mathematics", "Statistics",
  "Physics", "Chemistry", "Botany", "Zoology"
].map(d => d.toLowerCase()));

const SfsDepartments = new Set([
  "English", "Tamil", "Languages", "Journalism", "Social Work", "Commerce",
  "Business Administration", "Communication", "Geography", "Tourism Studies",
  "Mathematics", "Physics", "Chemistry", "Microbiology", "Computer Application (BCA)",
  "Computer Science (B.Sc)", "Computer Science (MCA)", "Visual Communication",
  "Physical Education, Health Education and Sports", "Psychology", "Data Science", "Physical Education"
].map(d => d.toLowerCase()));

function generateTemporaryPassword(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  let pass = "";
  for (let i = 0; i < 10; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    let { fullName, email, department, stream, registerNumber } = body;

    fullName = (fullName || "").trim();
    email = (email || "").trim();
    department = (department || "").trim();
    stream = (stream || "").trim();
    registerNumber = (registerNumber || "").trim();

    if (!email || !email.toLowerCase().endsWith("@mcc.edu.in")) {
      return NextResponse.json(
        "Registration is restricted to Madras Christian College email addresses ending with '@mcc.edu.in'.",
        { status: 400 }
      );
    }

    if (!stream && department) {
      const deptLower = department.toLowerCase();
      if (AidedDepartments.has(deptLower)) {
        stream = "Aided";
      } else if (SfsDepartments.has(deptLower)) {
        stream = "SFS";
      }
    }

    if (!stream) {
      return NextResponse.json("Stream is required.", { status: 400 });
    }

    if (stream !== "Aided" && stream !== "SFS") {
      return NextResponse.json("Stream must be either 'Aided' or 'SFS'.", { status: 400 });
    }

    if (!department) {
      return NextResponse.json("Department is required.", { status: 400 });
    }

    const deptLower = department.toLowerCase();
    if (stream === "Aided" && !AidedDepartments.has(deptLower)) {
      return NextResponse.json(`Department '${department}' is not valid for Aided stream.`, { status: 400 });
    }

    if (stream === "SFS" && !SfsDepartments.has(deptLower)) {
      return NextResponse.json(`Department '${department}' is not valid for SFS stream.`, { status: 400 });
    }

    const existingUser = await prisma.users.findFirst({
      where: { Email: { equals: email, mode: "insensitive" } }
    });

    if (existingUser) {
      return NextResponse.json("Email already exists", { status: 400 });
    }

    // Generate unique username
    let username = "";
    let isUnique = false;
    const cleanName = fullName.replace(/\s+/g, "").toLowerCase();
    while (!isUnique) {
      const rand = Math.floor(100 + Math.random() * 900);
      username = `mcc_${cleanName}_${rand}`;
      const count = await prisma.users.count({ where: { Username: username } });
      if (count === 0) {
        isUnique = true;
      }
    }

    const temporaryPassword = generateTemporaryPassword();

    const user = await prisma.users.create({
      data: {
        FullName: fullName,
        Email: email,
        Username: username,
        PasswordHash: hashPassword(temporaryPassword),
        IsTemporaryPassword: true,
        Department: department,
        Stream: stream,
        RegisterNumber: registerNumber,
        Role: 1, // Student
        IsActive: true,
        CreatedAt: new Date(),
        ProfileImageUrl: ""
      }
    });

    // Send Email Credentials
    const subject = "Your Madras Christian College Portfolio Credentials";
    const emailBody = `Dear ${user.FullName},\n\n` +
                 `Your student portfolio account has been created successfully!\n\n` +
                 `Please use the following credentials to access the placement platform:\n` +
                 `  Username: ${username}\n` +
                 `  Temporary Password: ${temporaryPassword}\n\n` +
                 `Instructions:\n` +
                 `1. Visit the portal login page.\n` +
                 `2. Enter your generated username and temporary password.\n` +
                 `3. Upon first login, you will be prompted to change your temporary password to a secure permanent one.\n\n` +
                 `Best regards,\n` +
                 `Placement Cell, Madras Christian College`;

    await sendEmail(user.Email, subject, emailBody);

    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";

    // Create Audit Log
    await prisma.auditLogs.create({
      data: {
        Action: "Student Registration",
        PerformedByEmail: user.Email,
        Timestamp: new Date(),
        Details: `Student ${user.FullName} registered successfully with temporary credentials.`,
        IpAddress: ip
      }
    });

    // Create Notification
    await prisma.notifications.create({
      data: {
        Title: "Student Registration",
        Message: `${user.FullName} registered.`,
        Type: "StudentAction",
        IsRead: false,
        CreatedAt: new Date(),
        UserId: user.Id
      }
    });

    return NextResponse.json({ success: true, message: "Registration successful. Login credentials have been sent to your registered email." });
  } catch (err: any) {
    console.error("Registration Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
