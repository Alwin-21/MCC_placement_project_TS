import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { getUserFromRequest } from "@/utils/auth";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ themeId: string }> }
) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload || userPayload.role !== "Admin") {
      return NextResponse.json("Forbidden", { status: 403 });
    }

    const { themeId: rawThemeId } = await params;
    const themeId = decodeURIComponent(rawThemeId).trim();

    const body = await request.json();
    const { displayName, description, isActive, primaryColor, secondaryColor, fontFamily } = body;

    const theme = await prisma.themeConfigs.findFirst({
      where: { ThemeId: { equals: themeId, mode: "insensitive" } }
    });

    if (!theme) {
      return NextResponse.json("Theme configuration not found.", { status: 404 });
    }

    const updatedTheme = await prisma.themeConfigs.update({
      where: { Id: theme.Id },
      data: {
        DisplayName: displayName || "",
        Description: description || "",
        IsActive: isActive !== undefined ? !!isActive : theme.IsActive,
        PrimaryColor: primaryColor || "",
        SecondaryColor: secondaryColor || "",
        FontFamily: fontFamily || ""
      }
    });

    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    await prisma.auditLogs.create({
      data: {
        Action: "Modify Theme Parameters",
        PerformedByEmail: userPayload.email,
        Timestamp: new Date(),
        Details: `Modified settings for theme: ${themeId} (Active: ${isActive})`,
        IpAddress: ip
      }
    });

    return NextResponse.json(updatedTheme);
  } catch (err: any) {
    console.error("PUT Admin Theme Config Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
