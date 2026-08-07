import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { getUserFromRequest } from "@/utils/auth";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload || userPayload.role !== "Admin") {
      return NextResponse.json("Forbidden", { status: 403 });
    }

    const { name: rawName } = await params;
    const name = decodeURIComponent(rawName).trim();

    const inst = await prisma.institutionDetails.findFirst();
    if (!inst) {
      return NextResponse.json("Institution details not found.", { status: 404 });
    }

    const deptList = inst.Departments
      .split(";")
      .map(d => d.trim())
      .filter(d => d.length > 0);

    const match = deptList.find(d => d.toLowerCase() === name.toLowerCase());
    if (!match) {
      return NextResponse.json("Department not found.", { status: 404 });
    }

    const updatedDeptList = deptList.filter(d => d !== match);
    const updatedDepartments = updatedDeptList.join(";");

    await prisma.institutionDetails.update({
      where: { Id: inst.Id },
      data: { Departments: updatedDepartments }
    });

    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    await prisma.auditLogs.create({
      data: {
        Action: "Delete Department",
        PerformedByEmail: userPayload.email,
        Timestamp: new Date(),
        Details: `Deleted department: ${name}`,
        IpAddress: ip
      }
    });

    return NextResponse.json({ departments: updatedDepartments });
  } catch (err: any) {
    console.error("DELETE Admin Department Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
