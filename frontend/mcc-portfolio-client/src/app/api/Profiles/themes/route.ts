import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";

export async function GET() {
  try {
    const themes = await prisma.themeConfigs.findMany({
      where: { IsActive: true },
      select: {
        ThemeId: true,
        DisplayName: true,
        Description: true
      }
    });

    // Map keys to camelCase matching the typical C# API response
    const mapped = themes.map(t => ({
      themeId: t.ThemeId,
      displayName: t.DisplayName,
      description: t.Description
    }));

    return NextResponse.json(mapped);
  } catch (err: any) {
    console.error("GET Profile Themes Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
