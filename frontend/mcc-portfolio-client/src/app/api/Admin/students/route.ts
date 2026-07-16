import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { getUserFromRequest, hashPassword } from "@/utils/auth";

export async function GET(request: Request) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload || (userPayload.role !== "Admin" && userPayload.role !== "Moderator")) {
      return NextResponse.json("Unauthorized", { status: 401 });
    }

    const users = await prisma.users.findMany({
      include: {
        Profiles: true
      }
    });

    const students = users.map(user => {
      const profile = user.Profiles[0] || null;
      const roleName = user.Role === 2 ? "Admin" : user.Role === 3 ? "Moderator" : "Student";
      return {
        id: user.Id,
        fullName: user.FullName,
        email: user.Email,
        department: user.Department,
        stream: user.Stream,
        registerNumber: user.RegisterNumber,
        role: roleName,
        isApproved: profile ? profile.IsApproved : false,
        selectedTheme: profile ? profile.SelectedTheme : "Academic",
        isAlumni: profile ? profile.IsAlumni : false,
        graduationYear: profile ? profile.GraduationYear : null,
        currentCompany: profile ? profile.CurrentCompany : "",
        currentJobTitle: profile ? profile.CurrentJobTitle : "",
        higherStudyUniversity: profile ? profile.HigherStudyUniversity : "",
        higherStudyProgram: profile ? profile.HigherStudyProgram : ""
      };
    });

    return NextResponse.json(students);
  } catch (err: any) {
    console.error("GET Admin Students Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload || userPayload.role !== "Admin") {
      return NextResponse.json("Forbidden", { status: 403 });
    }

    const body = await request.json();
    let { fullName, email, password, department, stream, registerNumber } = body;

    fullName = (fullName || "").trim();
    email = (email || "").trim();
    department = (department || "").trim();
    stream = (stream || "").trim();
    registerNumber = (registerNumber || "").trim();

    if (!email || !password) {
      return NextResponse.json("Email and Password are required.", { status: 400 });
    }

    const existingUser = await prisma.users.findFirst({
      where: { Email: { equals: email, mode: "insensitive" } }
    });

    if (existingUser) {
      return NextResponse.json("Email already exists.", { status: 400 });
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

    const user = await prisma.users.create({
      data: {
        FullName: fullName,
        Email: email,
        Username: username,
        PasswordHash: hashPassword(password),
        Department: department,
        Stream: stream,
        RegisterNumber: registerNumber,
        Role: 1, // Student
        IsActive: true,
        CreatedAt: new Date(),
        ProfileImageUrl: "",
        IsTemporaryPassword: false
      }
    });

    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    // Log Audit action
    await prisma.auditLogs.create({
      data: {
        Action: "Create Student",
        PerformedByEmail: userPayload.email,
        Timestamp: new Date(),
        Details: `Created user ${email} (${fullName})`,
        IpAddress: ip
      }
    });

    return NextResponse.json({ success: true, userId: user.Id });
  } catch (err: any) {
    console.error("POST Admin Create Student Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
