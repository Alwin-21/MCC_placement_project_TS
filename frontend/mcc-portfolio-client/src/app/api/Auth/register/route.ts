import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { hashPassword, generateToken } from "@/utils/auth";
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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    let { fullName, email, department, stream, registerNumber, username, password, course } = body;

    fullName = (fullName || "").trim();
    email = (email || "").trim();
    department = (department || "").trim();
    stream = (stream || "").trim();
    registerNumber = (registerNumber || "").trim();
    username = (username || "").trim();
    password = (password || "").trim();
    course = (course || "").trim();

    if (!fullName || !email || !department || !stream || !registerNumber || !username || !password || !course) {
      return NextResponse.json("All registration inputs are compulsory.", { status: 400 });
    }

    if (!email.toLowerCase().endsWith("@mcc.edu.in")) {
      return NextResponse.json(
        "Registration is restricted to Madras Christian College email addresses ending with '@mcc.edu.in'.",
        { status: 400 }
      );
    }

    const emailLocalPart = email.split("@")[0];
    if (emailLocalPart !== registerNumber) {
      return NextResponse.json(
        `Email mismatch: the part before '@' ("${emailLocalPart}") must exactly match your register number ("${registerNumber}").`,
        { status: 400 }
      );
    }

    if (stream !== "Aided" && stream !== "SFS") {
      return NextResponse.json("Stream must be either 'Aided' or 'SFS'.", { status: 400 });
    }

    const deptLower = department.toLowerCase();
    if (stream === "Aided" && !AidedDepartments.has(deptLower)) {
      return NextResponse.json(`Department '${department}' is not valid for Aided stream.`, { status: 400 });
    }

    if (stream === "SFS" && !SfsDepartments.has(deptLower)) {
      return NextResponse.json(`Department '${department}' is not valid for SFS stream.`, { status: 400 });
    }

    const existingEmail = await prisma.users.findFirst({
      where: { Email: { equals: email, mode: "insensitive" } }
    });

    if (existingEmail) {
      return NextResponse.json("Email already exists", { status: 400 });
    }

    const existingUsername = await prisma.users.findFirst({
      where: { Username: { equals: username, mode: "insensitive" } }
    });

    if (existingUsername) {
      return NextResponse.json("Username already taken", { status: 400 });
    }

    const user = await prisma.users.create({
      data: {
        FullName: fullName,
        Email: email,
        Username: username,
        PasswordHash: hashPassword(password),
        IsTemporaryPassword: false,
        Department: department,
        Stream: stream,
        RegisterNumber: registerNumber,
        Role: 1, // Student
        IsActive: true,
        CreatedAt: new Date(),
        ProfileImageUrl: ""
      }
    });

    // Pre-create the student's profile and save the course details
    await prisma.profiles.create({
      data: {
        UserId: user.Id,
        Course: course,
        Bio: "",
        LinkedInUrl: "",
        GitHubUrl: "",
        BehanceUrl: "",
        GitHubUsername: "",
        TargetCareer: "",
        CGPA: 0.0,
        ProfileImageUrl: "",
        SelectedTheme: "Academic",
        PersonalStory: "",
        SOP: "",
        IsAlumni: false,
        GraduationYear: null,
        CurrentCompany: "",
        CurrentJobTitle: "",
        HigherStudyUniversity: "",
        HigherStudyProgram: "",
        YearOfStudy: "",
        CurrentLocation: "",
        Phone: "",
        Languages: "",
        TestScores: "",
        Patents: "",
        InstagramUrl: "",
        BlogUrl: "",
        OtherHandles: "",
        IsApproved: false
      }
    });

    const token = generateToken({
      Id: user.Id,
      FullName: user.FullName,
      Email: user.Email,
      Role: user.Role,
    });

    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";

    // Create Audit Log
    await prisma.auditLogs.create({
      data: {
        Action: "Student Registration",
        PerformedByEmail: user.Email,
        Timestamp: new Date(),
        Details: `Student ${user.FullName} registered successfully with custom credentials.`,
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

    const roleName = "Student";

    return NextResponse.json({
      success: true,
      token: token,
      id: user.Id,
      fullName: user.FullName,
      email: user.Email,
      role: roleName,
      isTemporaryPassword: user.IsTemporaryPassword,
      registerNumber: user.RegisterNumber,
      username: user.Username
    });
  } catch (err: any) {
    console.error("Registration Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
