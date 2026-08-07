import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { getUserFromRequest, hasModulePermission } from "@/utils/auth";

export async function GET(request: Request) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload || !hasModulePermission(userPayload, "notifications", "read")) {
      return NextResponse.json("Unauthorized", { status: 401 });
    }

    const notifications = await prisma.notifications.findMany({
      include: {
        Users: true
      },
      orderBy: { CreatedAt: "desc" }
    });

    const mapped = notifications.map(n => ({
      id: n.Id,
      title: n.Title,
      message: n.Message,
      type: n.Type,
      isRead: n.IsRead,
      createdAt: n.CreatedAt,
      targetUser: n.Users ? n.Users.FullName : "Broadcast (All)",
      userId: n.UserId
    }));

    return NextResponse.json(mapped);
  } catch (err: any) {
    console.error("GET Admin Notifications Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload || !hasModulePermission(userPayload, "notifications", "write")) {
      return NextResponse.json("Forbidden", { status: 403 });
    }

    const body = await request.json();
    const { title, message, type, userId, department } = body;

    if (!title || !message) {
      return NextResponse.json("Title and Message are required.", { status: 400 });
    }

    if (type === "Department" && department) {
      // Find all students in department
      const students = await prisma.users.findMany({
        where: {
          Role: 1, // Student
          Department: { equals: department, mode: "insensitive" }
        }
      });

      if (students.length > 0) {
        const notificationsData = students.map(student => ({
          Title: title,
          Message: message,
          Type: "Department",
          IsRead: false,
          CreatedAt: new Date(),
          UserId: student.Id
        }));

        await prisma.notifications.createMany({
          data: notificationsData
        });

        return NextResponse.json({
          success: true,
          count: students.length,
          message: `Notifications sent to ${students.length} students in ${department}.`
        });
      } else {
        return NextResponse.json(`No students found in the department '${department}'.`, { status: 400 });
      }
    }

    // Broadcast or Single user
    const targetUserId = userId && userId > 0 ? parseInt(userId, 10) : null;
    const notif = await prisma.notifications.create({
      data: {
        Title: title,
        Message: message,
        Type: type || "Info",
        IsRead: false,
        CreatedAt: new Date(),
        UserId: targetUserId
      }
    });

    return NextResponse.json({
      id: notif.Id,
      title: notif.Title,
      message: notif.Message,
      type: notif.Type,
      isRead: notif.IsRead,
      createdAt: notif.CreatedAt,
      userId: notif.UserId
    });
  } catch (err: any) {
    console.error("POST Admin Notification Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
