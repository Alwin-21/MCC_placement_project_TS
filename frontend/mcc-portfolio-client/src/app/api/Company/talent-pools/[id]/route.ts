import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { getUserFromRequest } from "@/utils/auth";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = getUserFromRequest(request);
    if (!payload || payload.role !== "Company") {
      return NextResponse.json("Unauthorized", { status: 401 });
    }

    const { id } = await params;
    const poolId = parseInt(id, 10);

    const hrUserId = parseInt(payload.nameid, 10);
    const hrUser = await prisma.companyUsers.findUnique({
      where: { Id: hrUserId },
    });

    if (!hrUser) {
      return NextResponse.json("HR User not found.", { status: 404 });
    }

    const pool = await prisma.savedTalentPool.findFirst({
      where: {
        Id: poolId,
        CompanyId: hrUser.CompanyId,
      },
    });

    if (!pool) {
      return NextResponse.json("Talent pool not found.", { status: 404 });
    }

    const body = await request.json();
    const { name, studentIds, criteria } = body;

    const studentIdsStr = studentIds !== undefined
      ? (Array.isArray(studentIds) ? studentIds.join(",") : String(studentIds))
      : pool.StudentIds;

    const criteriaJsonStr = criteria !== undefined
      ? (criteria ? JSON.stringify(criteria) : "")
      : pool.CriteriaJson;

    const updatedPool = await prisma.savedTalentPool.update({
      where: { Id: poolId },
      data: {
        Name: name !== undefined ? name : pool.Name,
        StudentIds: studentIdsStr,
        CriteriaJson: criteriaJsonStr
      },
    });

    return NextResponse.json({
      id: updatedPool.Id,
      name: updatedPool.Name,
      studentIds: updatedPool.StudentIds,
      criteria: criteria !== undefined ? criteria : (updatedPool.CriteriaJson ? JSON.parse(updatedPool.CriteriaJson) : null),
      isDynamic: updatedPool.CriteriaJson !== ""
    });
  } catch (err: any) {
    console.error("PUT Talent Pool Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = getUserFromRequest(request);
    if (!payload || payload.role !== "Company") {
      return NextResponse.json("Unauthorized", { status: 401 });
    }

    const { id } = await params;
    const poolId = parseInt(id, 10);

    const hrUserId = parseInt(payload.nameid, 10);
    const hrUser = await prisma.companyUsers.findUnique({
      where: { Id: hrUserId },
    });

    if (!hrUser) {
      return NextResponse.json("HR User not found.", { status: 404 });
    }

    const pool = await prisma.savedTalentPool.findFirst({
      where: {
        Id: poolId,
        CompanyId: hrUser.CompanyId,
      },
    });

    if (!pool) {
      return NextResponse.json("Talent pool not found.", { status: 404 });
    }

    await prisma.savedTalentPool.delete({
      where: { Id: poolId },
    });

    return NextResponse.json({ success: true, message: "Talent pool deleted successfully." });
  } catch (err: any) {
    console.error("DELETE Talent Pool Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
