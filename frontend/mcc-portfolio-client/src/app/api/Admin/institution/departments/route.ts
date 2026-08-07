import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { getUserFromRequest } from "@/utils/auth";

export async function POST(request: Request) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload || userPayload.role !== "Admin") {
      return NextResponse.json("Forbidden", { status: 403 });
    }

    let deptName = await request.text();
    deptName = deptName.trim();
    if (deptName.startsWith('"') && deptName.endsWith('"')) {
      try {
        deptName = JSON.parse(deptName);
      } catch (e) {}
    }

    if (!deptName) {
      return NextResponse.json("Department name cannot be empty.", { status: 400 });
    }

    const inst = await prisma.institutionDetails.findFirst();
    if (!inst) {
      return NextResponse.json("Institution details not found.", { status: 404 });
    }

    const deptList = inst.Departments
      .split(";")
      .map(d => d.trim())
      .filter(d => d.length > 0);

    if (deptList.some(d => d.toLowerCase() === deptName.toLowerCase())) {
      return NextResponse.json("Department already exists.", { status: 400 });
    }

    deptList.push(deptName);
    const updatedDepartments = deptList.join(";");

    await prisma.institutionDetails.update({
      where: { Id: inst.Id },
      data: { Departments: updatedDepartments }
    });

    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    await prisma.auditLogs.create({
      data: {
        Action: "Add Department",
        PerformedByEmail: userPayload.email,
        Timestamp: new Date(),
        Details: `Added department: ${deptName}`,
        IpAddress: ip
      }
    });

    return NextResponse.json({ departments: updatedDepartments });
  } catch (err: any) {
    console.error("POST Admin Add Department Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
