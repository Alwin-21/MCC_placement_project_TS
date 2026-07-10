import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { getUserFromRequest } from "@/utils/auth";
import { logActionAndNotify } from "@/utils/audit";

import { mapKeysToCamelCase, fixUrlsInObject } from "@/utils/mapper";

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
      const origin = request.headers.get("origin") || new URL(request.url).origin;
      return NextResponse.json(
        fixUrlsInObject(
          mapKeysToCamelCase({
            ...profileData,
            User: Users
          }),
          origin
        )
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

    const parsedCGPA = cgpa !== undefined ? parseFloat(cgpa || "0.0") : (existingProfile?.CGPA ?? 0.0);
    const parsedGradYear = graduationYear !== undefined ? (graduationYear ? parseInt(graduationYear, 10) : null) : (existingProfile?.GraduationYear ?? null);

    const dataPayload = {
      Bio: bio !== undefined ? (bio || "") : (existingProfile?.Bio ?? ""),
      LinkedInUrl: linkedInUrl !== undefined ? (linkedInUrl || "") : (existingProfile?.LinkedInUrl ?? ""),
      GitHubUrl: gitHubUrl !== undefined ? (gitHubUrl || "") : (existingProfile?.GitHubUrl ?? ""),
      BehanceUrl: behanceUrl !== undefined ? (behanceUrl || "") : (existingProfile?.BehanceUrl ?? ""),
      GitHubUsername: gitHubUsername !== undefined ? (gitHubUsername || "") : (existingProfile?.GitHubUsername ?? ""),
      TargetCareer: targetCareer !== undefined ? (targetCareer || "") : (existingProfile?.TargetCareer ?? ""),
      CGPA: parsedCGPA,
      ProfileImageUrl: profileImageUrl !== undefined ? (profileImageUrl || "") : (existingProfile?.ProfileImageUrl ?? ""),
      SelectedTheme: selectedTheme !== undefined ? (selectedTheme || "Academic") : (existingProfile?.SelectedTheme ?? "Academic"),
      PersonalStory: personalStory !== undefined ? (personalStory || "") : (existingProfile?.PersonalStory ?? ""),
      SOP: sop !== undefined ? (sop || "") : (existingProfile?.SOP ?? ""),
      IsAlumni: isAlumni !== undefined ? !!isAlumni : (existingProfile?.IsAlumni ?? false),
      GraduationYear: parsedGradYear,
      CurrentCompany: currentCompany !== undefined ? (currentCompany || "") : (existingProfile?.CurrentCompany ?? ""),
      CurrentJobTitle: currentJobTitle !== undefined ? (currentJobTitle || "") : (existingProfile?.CurrentJobTitle ?? ""),
      HigherStudyUniversity: higherStudyUniversity !== undefined ? (higherStudyUniversity || "") : (existingProfile?.HigherStudyUniversity ?? ""),
      HigherStudyProgram: higherStudyProgram !== undefined ? (higherStudyProgram || "") : (existingProfile?.HigherStudyProgram ?? ""),
      Course: course !== undefined ? (course || "") : (existingProfile?.Course ?? ""),
      YearOfStudy: yearOfStudy !== undefined ? (yearOfStudy || "") : (existingProfile?.YearOfStudy ?? ""),
      CurrentLocation: currentLocation !== undefined ? (currentLocation || "") : (existingProfile?.CurrentLocation ?? ""),
      Phone: phone !== undefined ? (phone || "") : (existingProfile?.Phone ?? ""),
      Languages: languages !== undefined ? (languages || "") : (existingProfile?.Languages ?? ""),
      TestScores: testScores !== undefined ? (testScores || "") : (existingProfile?.TestScores ?? ""),
      Patents: patents !== undefined ? (patents || "") : (existingProfile?.Patents ?? ""),
      InstagramUrl: instagramUrl !== undefined ? (instagramUrl || "") : (existingProfile?.InstagramUrl ?? ""),
      BlogUrl: blogUrl !== undefined ? (blogUrl || "") : (existingProfile?.BlogUrl ?? ""),
      OtherHandles: otherHandles !== undefined ? (otherHandles || "") : (existingProfile?.OtherHandles ?? ""),
      IsApproved: existingProfile ? existingProfile.IsApproved : false
    };

    // Update User details if provided, keeping tables in sync
    const userUpdateData: any = {};
    if (fullName) {
      userUpdateData.FullName = fullName;
    }
    if (profileImageUrl !== undefined) {
      userUpdateData.ProfileImageUrl = profileImageUrl || "";
    }
    if (Object.keys(userUpdateData).length > 0) {
      await prisma.users.update({
        where: { Id: userId },
        data: userUpdateData
      });
    }

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
