import { prisma } from "./db";

export async function logActionAndNotify(
  userId: number,
  userEmail: string,
  userFullName: string,
  action: string,
  details: string,
  ipAddress: string = "127.0.0.1"
) {
  try {
    // 1. Create Audit Log
    await prisma.auditLogs.create({
      data: {
        Action: action,
        PerformedByEmail: userEmail,
        Timestamp: new Date(),
        Details: details,
        IpAddress: ipAddress,
      },
    });

    // 2. Create Notification
    await prisma.notifications.create({
      data: {
        Title: action,
        Message: `${userFullName} performed ${action.toLowerCase()}.`,
        Type: "StudentAction",
        IsRead: false,
        CreatedAt: new Date(),
        UserId: userId,
      },
    });
  } catch (err) {
    console.error("Failed to log audit/notification:", err);
  }
}
