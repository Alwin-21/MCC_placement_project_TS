import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { getUserFromRequest, hasModulePermission } from "@/utils/auth";
import { getCachedTaxonomy, setCachedTaxonomy, invalidateTaxonomyCache } from "@/utils/taxonomyCache";

export async function GET(request: Request) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload || !hasModulePermission(userPayload, "institution", "read")) {
      return NextResponse.json("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const pageStr = searchParams.get("page");
    const pageSizeStr = searchParams.get("pageSize");

    // If pagination params are specified, return paginated results (bypass cache for accuracy)
    if (pageStr || pageSizeStr) {
      const page = parseInt(pageStr || "1", 10);
      const pageSize = parseInt(pageSizeStr || "20", 10);
      const skip = (page - 1) * pageSize;

      const totalItems = await prisma.skillTaxonomy.count();
      const taxonomy = await prisma.skillTaxonomy.findMany({
        skip,
        take: pageSize,
        orderBy: [
          { Department: "asc" },
          { Domain: "asc" },
          { SkillName: "asc" }
        ]
      });

      const mappedItems = taxonomy.map((item) => ({
        id: item.Id,
        department: item.Department,
        domain: item.Domain,
        skillName: item.SkillName,
        subSkills: item.SubSkills,
        category: item.Category,
        aliases: item.Aliases,
        relatedSkills: item.RelatedSkills,
        createdAt: item.CreatedAt
      }));

      return NextResponse.json({
        items: mappedItems,
        totalItems,
        totalPages: Math.ceil(totalItems / pageSize),
        currentPage: page
      });
    }

    // Try reading cache for complete unpaginated lists
    const cached = getCachedTaxonomy();
    if (cached) {
      return NextResponse.json(cached);
    }

    const taxonomy = await prisma.skillTaxonomy.findMany({
      orderBy: [
        { Department: "asc" },
        { Domain: "asc" },
        { SkillName: "asc" }
      ]
    });

    // Map database properties to camelCase for frontend
    const mapped = taxonomy.map((item) => ({
      id: item.Id,
      department: item.Department,
      domain: item.Domain,
      skillName: item.SkillName,
      subSkills: item.SubSkills,
      category: item.Category,
      aliases: item.Aliases,
      relatedSkills: item.RelatedSkills,
      createdAt: item.CreatedAt
    }));

    // Cache the mapped results
    setCachedTaxonomy(mapped);

    return NextResponse.json(mapped);
  } catch (err: any) {
    console.error("GET Skill Taxonomy Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload || !hasModulePermission(userPayload, "institution", "write")) {
      return NextResponse.json("Unauthorized", { status: 401 });
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

    if (!department || !domain || !skillName || !category) {
      return NextResponse.json("Department, Domain, SkillName, and Category are required.", { status: 400 });
    }

    const item = await prisma.skillTaxonomy.create({
      data: {
        Department: department,
        Domain: domain,
        SkillName: skillName,
        SubSkills: subSkills || "",
        Category: category,
        Aliases: aliases || "",
        RelatedSkills: relatedSkills || ""
      }
    });

    // Invalidate taxonomy cache on modification
    invalidateTaxonomyCache();

    // Security audit logging
    const adminEmail = userPayload.email;
    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    await prisma.auditLogs.create({
      data: {
        Action: "Taxonomy Created",
        PerformedByEmail: adminEmail,
        Timestamp: new Date(),
        Details: `Created taxonomy item: ${skillName} in domain ${domain} (${department})`,
        IpAddress: ip,
      }
    });

    return NextResponse.json({
      id: item.Id,
      department: item.Department,
      domain: item.Domain,
      skillName: item.SkillName,
      subSkills: item.SubSkills,
      category: item.Category,
      aliases: item.Aliases,
      relatedSkills: item.RelatedSkills,
    });
  } catch (err: any) {
    console.error("POST Skill Taxonomy Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
