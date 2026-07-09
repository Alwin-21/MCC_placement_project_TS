import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/utils/auth";
import { prisma } from "@/utils/db";

export async function POST(request: Request) {
  try {
    const userPayload = getUserFromRequest(request);
    if (userPayload) {
      const userId = parseInt(userPayload.nameid, 10);
      const user = await prisma.users.findUnique({ where: { Id: userId } });
      if (user) {
        const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
        
        await prisma.auditLogs.create({
          data: {
            Action: "Student Logout",
            PerformedByEmail: user.Email,
            Timestamp: new Date(),
            Details: `Student ${user.FullName} logged out.`,
            IpAddress: ip
          }
        });

        await prisma.notifications.create({
          data: {
            Title: "Student Logout",
            Message: `${user.FullName} logged out.`,
            Type: "StudentAction",
            IsRead: false,
            CreatedAt: new Date(),
            UserId: user.Id
          }
        });
      }
    }
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Logout Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
