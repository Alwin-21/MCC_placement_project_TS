import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { getUserFromRequest } from "@/utils/auth";
import { logActionAndNotify } from "@/utils/audit";

import { mapKeysToCamelCase } from "@/utils/mapper";

export async function GET(request: Request) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload) return NextResponse.json("Unauthorized", { status: 401 });
    const userId = parseInt(userPayload.nameid, 10);

    const profile = await prisma.profiles.findFirst({
      where: { UserId: userId },
      include: { Users: true }
    });

    // Map `Users` relation to `User` matching the C# JSON response style
    if (profile) {
      const { Users, ...profileData } = profile;
      return NextResponse.json(
        mapKeysToCamelCase({
          ...profileData,
          User: Users
        })
      );
    }

    return NextResponse.json(null);
  } catch (err: any) {
    console.error("GET Profile Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload) return NextResponse.json("Unauthorized", { status: 401 });
    const userId = parseInt(userPayload.nameid, 10);

    const body = await request.json();
    const {
      bio, linkedInUrl, gitHubUrl, behanceUrl, gitHubUsername, targetCareer,
      cgpa, profileImageUrl, selectedTheme, personalStory, sop,
      isAlumni, graduationYear, currentCompany, currentJobTitle,
      higherStudyUniversity, higherStudyProgram, course, yearOfStudy,
      currentLocation, phone, languages, testScores, patents, instagramUrl,
      blogUrl, otherHandles, fullName
    } = body;

    // Check if selected theme is active
    if (selectedTheme) {
      const themeConfig = await prisma.themeConfigs.findFirst({
        where: { ThemeId: { equals: selectedTheme, mode: "insensitive" } }
      });
      if (themeConfig && !themeConfig.IsActive) {
        return NextResponse.json(`The theme '${selectedTheme}' is currently disabled by the administrator.`, { status: 400 });
      }
    }

    // Update User FullName if provided
    if (fullName) {
      await prisma.users.update({
        where: { Id: userId },
        data: { FullName: fullName }
      });
    }

    const existingProfile = await prisma.profiles.findFirst({
      where: { UserId: userId }
    });

    const parsedCGPA = parseFloat(cgpa || "0.0");
    const parsedGradYear = graduationYear ? parseInt(graduationYear, 10) : null;

    const dataPayload = {
      Bio: bio || "",
      LinkedInUrl: linkedInUrl || "",
      GitHubUrl: gitHubUrl || "",
      BehanceUrl: behanceUrl || "",
      GitHubUsername: gitHubUsername || "",
      TargetCareer: targetCareer || "",
      CGPA: parsedCGPA,
      ProfileImageUrl: profileImageUrl || "",
      SelectedTheme: selectedTheme || "Academic",
      PersonalStory: personalStory || "",
      SOP: sop || "",
      IsAlumni: !!isAlumni,
      GraduationYear: parsedGradYear,
      CurrentCompany: currentCompany || "",
      CurrentJobTitle: currentJobTitle || "",
      HigherStudyUniversity: higherStudyUniversity || "",
      HigherStudyProgram: higherStudyProgram || "",
      Course: course || "",
      YearOfStudy: yearOfStudy || "",
      CurrentLocation: currentLocation || "",
      Phone: phone || "",
      Languages: languages || "",
      TestScores: testScores || "",
      Patents: patents || "",
      InstagramUrl: instagramUrl || "",
      BlogUrl: blogUrl || "",
      OtherHandles: otherHandles || "",
      IsApproved: existingProfile ? existingProfile.IsApproved : false
    };

    if (existingProfile) {
      await prisma.profiles.update({
        where: { Id: existingProfile.Id },
        data: dataPayload
      });
    } else {
      await prisma.profiles.create({
        data: {
          ...dataPayload,
          UserId: userId
        }
      });
    }

    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    await logActionAndNotify(userId, userPayload.email, userPayload.unique_name, "Profile Updated", `Student ${userPayload.unique_name} updated profile.`, ip);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("POST Profiles Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
