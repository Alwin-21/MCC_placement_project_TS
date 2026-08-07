import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { getUserFromRequest } from "@/utils/auth";

// Helper for dynamic talent matching
function getMatchingStudentIds(criteria: any, students: any[], taxonomy: any[], weights: any): string {
  const {
    keywords = "",
    domains = [],
    skills = [],
    departments = [],
    experience = "all",
    certifications = [],
    projects = [],
    languages = [],
    minCgpa = 0.0
  } = criteria;

  // Build taxonomy expansion mapping
  const skillExpansions: Record<string, { aliases: string[]; subSkills: string[]; related: string[] }> = {};
  skills.forEach((skillName: string) => {
    const searchSkill = skillName.toLowerCase().trim();
    const match = taxonomy.find(
      (t) =>
        t.SkillName.toLowerCase() === searchSkill ||
        t.Aliases.toLowerCase().split(";").includes(searchSkill)
    );
    if (match) {
      skillExpansions[skillName] = {
        aliases: match.Aliases ? match.Aliases.split(";").map((a: string) => a.trim().toLowerCase()) : [],
        subSkills: match.SubSkills ? match.SubSkills.split(";").map((s: string) => s.trim().toLowerCase()) : [],
        related: match.RelatedSkills ? match.RelatedSkills.split(";").map((r: string) => r.trim().toLowerCase()) : []
      };
    } else {
      skillExpansions[skillName] = { aliases: [], subSkills: [], related: [] };
    }
  });

  const matchingIds: number[] = [];

  students.forEach((student) => {
    const profile = student.Profiles[0] || null;
    const studentCgpa = profile?.CGPA || 0.0;
    const studentDept = student.Department.toLowerCase().trim();

    // 1. Department Filter (Hard constraint)
    if (departments.length > 0) {
      const lowerDepts = departments.map((d: string) => d.toLowerCase().trim());
      if (!lowerDepts.includes(studentDept)) return;
    }

    // 2. CGPA Filter (Hard constraint)
    if (minCgpa > 0.0 && studentCgpa < minCgpa) return;

    // --- Scoring component logic ---
    let skillsScore = 0.0;
    if (skills.length > 0) {
      let matchedValSum = 0;
      skills.forEach((skillReq: string) => {
        const reqLower = skillReq.toLowerCase().trim();
        const expansion = skillExpansions[skillReq] || { aliases: [], subSkills: [], related: [] };
        const directMatch = student.Skills.find((s: any) => s.Name.toLowerCase().trim() === reqLower);
        if (directMatch) {
          matchedValSum += 1.0;
        } else {
          const aliasMatch = student.Skills.find((s: any) => expansion.aliases.includes(s.Name.toLowerCase().trim()));
          if (aliasMatch) {
            matchedValSum += 1.0;
          } else {
            const subMatch = student.Skills.find((s: any) => expansion.subSkills.includes(s.Name.toLowerCase().trim()));
            if (subMatch) {
              matchedValSum += 0.9;
            } else {
              const relatedMatch = student.Skills.find((s: any) => expansion.related.includes(s.Name.toLowerCase().trim()));
              if (relatedMatch) {
                matchedValSum += 0.7;
              }
            }
          }
        }
      });
      skillsScore = (matchedValSum / skills.length) * 100;
    } else {
      skillsScore = 100;
    }

    let expScore = 0.0;
    const expCount = student.Experiences.length;
    if (experience === "freshers") {
      expScore = expCount === 0 ? 100 : Math.max(0, 100 - expCount * 30);
    } else if (experience === "internships") {
      const hasInternship = student.Experiences.some((e: any) => e.Title.toLowerCase().includes("intern") || e.Description.toLowerCase().includes("intern"));
      expScore = hasInternship ? 100 : (expCount > 0 ? 60 : 20);
    } else if (experience === "experienced") {
      expScore = expCount > 0 ? Math.min(100, expCount * 50) : 0;
    } else {
      expScore = expCount === 0 ? 40 : Math.min(100, 50 + expCount * 25);
    }

    let projectsScore = 0.0;
    const projCount = student.Projects.length;
    if (projects.length > 0) {
      let projMatches = 0;
      projects.forEach((term: string) => {
        const lowerTerm = term.toLowerCase().trim();
        const hasMatch = student.Projects.some(
          (p: any) =>
            p.Title.toLowerCase().includes(lowerTerm) ||
            p.Description.toLowerCase().includes(lowerTerm) ||
            p.Technologies.toLowerCase().includes(lowerTerm)
        );
        if (hasMatch) projMatches++;
      });
      projectsScore = (projMatches / projects.length) * 100;
    } else {
      projectsScore = projCount === 0 ? 30 : Math.min(100, 50 + projCount * 25);
    }

    let certsScore = 0.0;
    const certsCount = student.Certifications.length;
    if (certifications.length > 0) {
      let certMatches = 0;
      certifications.forEach((certReq: string) => {
        const lowerCert = certReq.toLowerCase().trim();
        const hasMatch = student.Certifications.some(
          (c: any) => c.Title.toLowerCase().includes(lowerCert) || c.Issuer.toLowerCase().includes(lowerCert)
        );
        if (hasMatch) certMatches++;
      });
      certsScore = (certMatches / certifications.length) * 100;
    } else {
      certsScore = certsCount > 0 ? 100 : 40;
    }

    let completenessScore = 20;
    if (profile?.Bio) completenessScore += 20;
    if (profile?.LinkedInUrl || profile?.GitHubUrl) completenessScore += 20;
    if (student.Projects.length > 0) completenessScore += 20;
    if (student.Skills.length > 0) completenessScore += 20;

    const achsCount = student.Achievements.length + student.SportsAchievements.length + student.StartupCompetitions.length;
    const achievementsScore = achsCount === 0 ? 40 : Math.min(100, 50 + achsCount * 25);

    const cgpaScore = studentCgpa > 0.0 ? (studentCgpa / 10.0) * 100 : 50;

    const matchPct = Math.round(
      (skillsScore * weights.skills) +
      (expScore * weights.experience) +
      (projectsScore * weights.projects) +
      (certsScore * weights.certifications) +
      (completenessScore * weights.completeness) +
      (achievementsScore * weights.achievements) +
      (cgpaScore * weights.cgpa)
    );

    // Apply keyword filter
    if (keywords && keywords.trim() !== "") {
      const searchTerms = keywords.toLowerCase().split(/\s+/).filter(Boolean);
      const bioText = (profile?.Bio || "").toLowerCase();
      const targetCareer = (profile?.TargetCareer || "").toLowerCase();
      const fullName = student.FullName.toLowerCase();
      let keywordMatches = 0;
      searchTerms.forEach((term: string) => {
        if (bioText.includes(term) || targetCareer.includes(term) || fullName.includes(term)) {
          keywordMatches++;
        }
      });
      if (keywordMatches === 0 && searchTerms.length > 0) {
        return; // Skip if query keywords are requested but student has no match
      }
    }

    // Qualification threshold (e.g. at least 50% match)
    if (matchPct >= 45) {
      matchingIds.push(student.Id);
    }
  });

  return matchingIds.join(",");
}

export async function GET(request: Request) {
  try {
    const payload = getUserFromRequest(request);
    if (!payload || payload.role !== "Company") {
      return NextResponse.json("Unauthorized", { status: 401 });
    }

    const hrUserId = parseInt(payload.nameid, 10);
    const hrUser = await prisma.companyUsers.findUnique({
      where: { Id: hrUserId }
    });

    if (!hrUser) {
      return NextResponse.json("HR User not found.", { status: 404 });
    }

    const pools = await prisma.savedTalentPool.findMany({
      where: { CompanyId: hrUser.CompanyId },
      orderBy: { CreatedAt: "desc" }
    });

    // Determine if any pool needs dynamic resolving
    const dynamicPools = [];
    let studentsCache: any[] | null = null;
    let taxonomyCache: any[] | null = null;
    let weightsCache = {
      skills: 0.35,
      experience: 0.20,
      projects: 0.15,
      certifications: 0.10,
      completeness: 0.10,
      achievements: 0.05,
      cgpa: 0.05
    };

    for (const pool of pools) {
      if (pool.CriteriaJson && pool.CriteriaJson.trim() !== "") {
        // Resolve dynamic candidates
        try {
          const criteria = JSON.parse(pool.CriteriaJson);

          // Lazy load student & taxonomy records
          if (!studentsCache) {
            studentsCache = await prisma.users.findMany({
              where: { Role: 1, IsActive: true, Profiles: { some: { IsApproved: true } } },
              include: {
                Profiles: { take: 1 },
                Skills: true,
                Projects: true,
                Experiences: true,
                Certifications: true,
                Achievements: true,
                SportsAchievements: true,
                StartupCompetitions: true,
                AcademicRecords: true
              }
            });
            taxonomyCache = await prisma.skillTaxonomy.findMany();
            const config = await prisma.matchingEngineConfig.findUnique({ where: { ConfigKey: "weights" } });
            if (config) {
              weightsCache = JSON.parse(config.ConfigVal);
            }
          }

          const dynamicIds = getMatchingStudentIds(criteria, studentsCache || [], taxonomyCache || [], weightsCache);
          dynamicPools.push({
            id: pool.Id,
            name: pool.Name,
            studentIds: dynamicIds,
            criteria: criteria,
            isDynamic: true,
            createdAt: pool.CreatedAt
          });
        } catch (e) {
          // Fallback to saved static IDs if parsing fails
          dynamicPools.push({
            id: pool.Id,
            name: pool.Name,
            studentIds: pool.StudentIds,
            criteria: null,
            isDynamic: false,
            createdAt: pool.CreatedAt
          });
        }
      } else {
        dynamicPools.push({
          id: pool.Id,
          name: pool.Name,
          studentIds: pool.StudentIds,
          criteria: null,
          isDynamic: false,
          createdAt: pool.CreatedAt
        });
      }
    }

    return NextResponse.json(dynamicPools);
  } catch (err: any) {
    console.error("GET Talent Pools Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = getUserFromRequest(request);
    if (!payload || payload.role !== "Company") {
      return NextResponse.json("Unauthorized", { status: 401 });
    }

    const hrUserId = parseInt(payload.nameid, 10);
    const hrUser = await prisma.companyUsers.findUnique({
      where: { Id: hrUserId }
    });

    if (!hrUser) {
      return NextResponse.json("HR User not found.", { status: 404 });
    }

    const body = await request.json();
    const { name, studentIds = [], criteria = null } = body;

    if (!name) {
      return NextResponse.json("Pool name is required.", { status: 400 });
    }

    const studentIdsStr = Array.isArray(studentIds) ? studentIds.join(",") : String(studentIds);
    const criteriaJsonStr = criteria ? JSON.stringify(criteria) : "";

    const pool = await prisma.savedTalentPool.create({
      data: {
        CompanyId: hrUser.CompanyId,
        Name: name,
        StudentIds: studentIdsStr,
        CriteriaJson: criteriaJsonStr
      }
    });

    // Audit logs
    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    await prisma.companyAuditLogs.create({
      data: {
        CompanyId: hrUser.CompanyId,
        Action: "Talent Pool Created",
        PerformedByEmail: hrUser.Email,
        Timestamp: new Date(),
        Details: `Created dynamic talent pool: ${name}`,
        IpAddress: ip
      }
    });

    return NextResponse.json({
      id: pool.Id,
      name: pool.Name,
      studentIds: pool.StudentIds,
      criteria: criteria,
      isDynamic: !!criteria
    });
  } catch (err: any) {
    console.error("POST Talent Pools Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
