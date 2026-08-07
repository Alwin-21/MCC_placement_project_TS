import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { getUserFromRequest } from "@/utils/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload || userPayload.role !== "Admin") {
      return NextResponse.json("Forbidden", { status: 403 });
    }

    const { studentId: studentIdStr } = await params;
    const studentId = parseInt(studentIdStr, 10);

    const bodyText = await request.text();
    const isApproved = bodyText.trim() === "true";

    let profile = await prisma.profiles.findFirst({
      where: { UserId: studentId }
    });

    if (!profile) {
      // Create profile with default values if it doesn't exist
      profile = await prisma.profiles.create({
        data: {
          UserId: studentId,
          IsApproved: isApproved,
          Bio: "",
          LinkedInUrl: "",
          GitHubUrl: "",
          ProfileImageUrl: "",
          SelectedTheme: "Academic",
          BehanceUrl: "",
          CGPA: 0.0,
          GitHubUsername: "",
          TargetCareer: "",
          PersonalStory: "",
          SOP: "",
          CurrentCompany: "",
          CurrentJobTitle: "",
          HigherStudyProgram: "",
          HigherStudyUniversity: "",
          BlogUrl: "",
          Course: "",
          CurrentLocation: "",
          InstagramUrl: "",
          Languages: "",
          OtherHandles: "",
          Patents: "",
          Phone: "",
          TestScores: "",
          YearOfStudy: ""
        }
      });
    } else {
      profile = await prisma.profiles.update({
        where: { Id: profile.Id },
        data: { IsApproved: isApproved }
      });
    }

    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    await prisma.auditLogs.create({
      data: {
        Action: "Portfolio Verification Update",
        PerformedByEmail: userPayload.email,
        Timestamp: new Date(),
        Details: `Portfolio of student ID ${studentId} verification status set to ${isApproved}`,
        IpAddress: ip
      }
    });

    return NextResponse.json({ isApproved: profile.IsApproved });
  } catch (err: any) {
    console.error("POST Admin Approve Portfolio Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
