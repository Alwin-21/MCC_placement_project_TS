import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { getUserFromRequest, hasModulePermission } from "@/utils/auth";
import { invalidateTaxonomyCache } from "@/utils/taxonomyCache";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload || !hasModulePermission(userPayload, "institution", "write")) {
      return NextResponse.json("Unauthorized", { status: 401 });
    }

    const { id } = await params;
    const itemId = parseInt(id, 10);

    const targetNode = await prisma.skillTaxonomy.findUnique({
      where: { Id: itemId }
    });

    if (!targetNode) {
      return NextResponse.json("Taxonomy node not found.", { status: 404 });
    }

    const body = await request.json();
    const {
      department,
      domain,
      skillName,
      subSkills,
      category,
      aliases,
      relatedSkills
    } = body;

    const updated = await prisma.skillTaxonomy.update({
      where: { Id: itemId },
      data: {
        Department: department !== undefined ? department : targetNode.Department,
        Domain: domain !== undefined ? domain : targetNode.Domain,
        SkillName: skillName !== undefined ? skillName : targetNode.SkillName,
        SubSkills: subSkills !== undefined ? subSkills : targetNode.SubSkills,
        Category: category !== undefined ? category : targetNode.Category,
        Aliases: aliases !== undefined ? aliases : targetNode.Aliases,
        RelatedSkills: relatedSkills !== undefined ? relatedSkills : targetNode.RelatedSkills,
      }
    });

    // Security audit logging
    const adminEmail = userPayload.email;
    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    await prisma.auditLogs.create({
      data: {
        Action: "Taxonomy Updated",
        PerformedByEmail: adminEmail,
        Timestamp: new Date(),
        Details: `Updated taxonomy item: ${updated.SkillName} (ID: ${itemId})`,
        IpAddress: ip,
      }
    });

    // Invalidate taxonomy cache on update
    invalidateTaxonomyCache();

    return NextResponse.json({
      id: updated.Id,
      department: updated.Department,
      domain: updated.Domain,
      skillName: updated.SkillName,
      subSkills: updated.SubSkills,
      category: updated.Category,
      aliases: updated.Aliases,
      relatedSkills: updated.RelatedSkills
    });
  } catch (err: any) {
    console.error("PUT Skill Taxonomy Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload || !hasModulePermission(userPayload, "institution", "write")) {
      return NextResponse.json("Unauthorized", { status: 401 });
    }

    const { id } = await params;
    const itemId = parseInt(id, 10);

    const targetNode = await prisma.skillTaxonomy.findUnique({
      where: { Id: itemId }
    });

    if (!targetNode) {
      return NextResponse.json("Taxonomy node not found.", { status: 404 });
    }

    await prisma.skillTaxonomy.delete({
      where: { Id: itemId }
    });

    // Security audit logging
    const adminEmail = userPayload.email;
    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    await prisma.auditLogs.create({
      data: {
        Action: "Taxonomy Deleted",
        PerformedByEmail: adminEmail,
        Timestamp: new Date(),
        Details: `Deleted taxonomy item: ${targetNode.SkillName} (ID: ${itemId})`,
        IpAddress: ip,
      }
    });

    // Invalidate taxonomy cache on delete
    invalidateTaxonomyCache();

    return NextResponse.json({ success: true, message: "Taxonomy node deleted successfully." });
  } catch (err: any) {
    console.error("DELETE Skill Taxonomy Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
