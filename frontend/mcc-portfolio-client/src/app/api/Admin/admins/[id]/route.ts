import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { getUserFromRequest, hashPassword } from "@/utils/auth";

// PUT: Update a sub-admin's permissions, name, active status, or password
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getUserFromRequest(request);
    if (!user || user.role !== "Admin") {
      return NextResponse.json("Unauthorized – Super Admin only", { status: 401 });
    }

    const { id } = await params;
    const adminId = parseInt(id, 10);
    if (isNaN(adminId)) {
      return NextResponse.json({ message: "Invalid admin ID" }, { status: 400 });
    }

    const body = await request.json();
    const { fullName, permissions, password, isActive } = body;

    const updateData: Record<string, any> = {};

    if (fullName !== undefined) updateData.FullName = fullName.trim();
    if (permissions !== undefined) {
      updateData.AdminPermissions = typeof permissions === "object" && permissions !== null ? JSON.stringify(permissions) : "{}";
    }
    if (password !== undefined && password.trim()) {
      if (password.trim().length < 6) {
        return NextResponse.json({ message: "Password must be at least 6 characters." }, { status: 400 });
      }
      updateData.PasswordHash = password.trim();
    }
    if (isActive !== undefined) updateData.IsActive = Boolean(isActive);

    await prisma.users.update({
      where: { Id: adminId },
      data: updateData,
    });

    return NextResponse.json({ message: "Admin updated successfully." });
  } catch (err: any) {
    console.error("PUT Admins/[id] Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

// DELETE: Remove a sub-admin account
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getUserFromRequest(request);
    if (!user || user.role !== "Admin") {
      return NextResponse.json("Unauthorized – Super Admin only", { status: 401 });
    }

    const { id } = await params;
    const adminId = parseInt(id, 10);
    if (isNaN(adminId)) {
      return NextResponse.json({ message: "Invalid admin ID" }, { status: 400 });
    }

    // Make sure we're only deleting Role=3 accounts
    const target = await prisma.users.findFirst({ where: { Id: adminId, Role: 3 } });
    if (!target) {
      return NextResponse.json({ message: "Admin account not found." }, { status: 404 });
    }

    await prisma.users.delete({ where: { Id: adminId } });

    return NextResponse.json({ message: "Admin account deleted successfully." });
  } catch (err: any) {
    console.error("DELETE Admins/[id] Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
