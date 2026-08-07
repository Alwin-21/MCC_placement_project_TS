import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { getUserFromRequest } from "@/utils/auth";
import { fixUrlsInObject } from "@/utils/mapper";

export async function GET(request: Request) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload) return NextResponse.json("Unauthorized", { status: 401 });
    const userId = parseInt(userPayload.nameid, 10);

    const user = await prisma.users.findUnique({
      where: { Id: userId }
    });

    if (!user) {
      return NextResponse.json("User not found", { status: 404 });
    }

    const roleName = user.Role === 2 ? "Admin" : user.Role === 3 ? "Moderator" : "Student";

    const origin = request.headers.get("origin") || new URL(request.url).origin;
    return NextResponse.json(
      fixUrlsInObject({
        id: user.Id,
        fullName: user.FullName,
        email: user.Email,
        department: user.Department,
        stream: user.Stream,
        username: user.Username,
        isTemporaryPassword: user.IsTemporaryPassword,
        registerNumber: user.RegisterNumber,
        profileImageUrl: user.ProfileImageUrl,
        role: roleName
      }, origin)
    );
  } catch (err: any) {
    console.error("GET Users me Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
