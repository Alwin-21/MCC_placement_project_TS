import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { getUserFromRequest } from "@/utils/auth";

export async function GET(request: Request) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload || (userPayload.role !== "Admin" && userPayload.role !== "Moderator")) {
      return NextResponse.json("Unauthorized", { status: 401 });
    }

    const themes = await prisma.themeConfigs.findMany();
    const profiles = await prisma.profiles.findMany();

    const analytics = themes.map(t => {
      const studentCount = profiles.filter(p => p.SelectedTheme.toLowerCase() === t.ThemeId.toLowerCase()).length;
      return {
        id: t.Id,
        themeId: t.ThemeId,
        displayName: t.DisplayName,
        description: t.Description,
        isActive: t.IsActive,
        primaryColor: t.PrimaryColor,
        secondaryColor: t.SecondaryColor,
        fontFamily: t.FontFamily,
        studentCount: studentCount
      };
    });

    return NextResponse.json(analytics);
  } catch (err: any) {
    console.error("GET Admin Themes Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
