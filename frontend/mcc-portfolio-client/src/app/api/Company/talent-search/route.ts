import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { getUserFromRequest } from "@/utils/auth";

interface WeightsConfig {
  skills: number;
  experience: number;
  projects: number;
  certifications: number;
  completeness: number;
  achievements: number;
  cgpa: number;
}

const DEFAULT_WEIGHTS: WeightsConfig = {
  skills: 0.35,
  experience: 0.20,
  projects: 0.15,
  certifications: 0.10,
  completeness: 0.10,
  achievements: 0.05,
  cgpa: 0.05
};

export async function POST(request: Request) {
  try {
    const payload = getUserFromRequest(request);
    const userRole = payload?.role || payload?.Role;
    if (!payload || (userRole !== "Company" && userRole !== 4 && userRole !== "4")) {
      return NextResponse.json("Unauthorized", { status: 401 });
    }

    const hrUserId = parseInt(payload.nameid, 10);
    const hrUser = await prisma.companyUsers.findUnique({
      where: { Id: hrUserId },
      include: {
        Company: true,
      },
    });

    if (!hrUser) {
      return NextResponse.json("HR User not found.", { status: 404 });
    }

    const companyAllowedDepts = hrUser.Company?.AllowedDepartments
      ? hrUser.Company.AllowedDepartments.split(";").map((d) => d.trim().toLowerCase()).filter(Boolean)
      : [];

    const body = await request.json();
    const {
      keywords = "",
      domains = [],
      skills = [],
      departments = [],
      experience = "all", // "all", "freshers", "internships", "experienced"
      certifications = [],
      projects = [],
      languages = [],
      minCgpa = 0.0
    } = body;

    // 1. Fetch matching engine weights config
    let weights = DEFAULT_WEIGHTS;
    const config = await prisma.matchingEngineConfig.findUnique({
      where: { ConfigKey: "weights" }
    });
    if (config) {
      try {
        weights = JSON.parse(config.ConfigVal);
      } catch (e) {}
    }

    // 2. Fetch centralized skill taxonomy to expand skills
    const taxonomy = await prisma.skillTaxonomy.findMany();

    // Skill Expansion mapping
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
          aliases: match.Aliases ? match.Aliases.split(";").map((a) => a.trim().toLowerCase()) : [],
          subSkills: match.SubSkills ? match.SubSkills.split(";").map((s) => s.trim().toLowerCase()) : [],
          related: match.RelatedSkills ? match.RelatedSkills.split(";").map((r) => r.trim().toLowerCase()) : []
        };
      } else {
        skillExpansions[skillName] = { aliases: [], subSkills: [], related: [] };
      }
    });

    // 3. Fetch all active, approved students
    const students = await prisma.users.findMany({
      where: {
        Role: 1, // Student
        IsActive: true,
        Profiles: {
          some: {
            IsApproved: true
          }
        }
      },
      include: {
        Profiles: {
          take: 1
        },
        Skills: true,
        Projects: true,
        Experiences: true,
        Certifications: true,
        Achievements: true,
        SportsAchievements: true,
        StartupCompetitions: true,
        AcademicRecords: true,
        Resumes: true
      }
    });

    // 4. Score and filter candidates
    const scoredCandidates = students.map((student: any) => {
      const profile = student.Profiles[0] || null;
      const studentCgpa = profile?.CGPA || 0.0;
      const studentDept = student.Department.toLowerCase().trim();
      
      // A. HR Department Permissions Restriction (Set by Admin)
      if (companyAllowedDepts.length > 0 && !companyAllowedDepts.includes(studentDept)) {
        return null; // Skip students outside assigned HR department permissions
      }

      // B. Department Filter (Hard constraint if specified in search query)
      if (departments.length > 0) {
        const lowerDepts = departments.map((d: string) => d.toLowerCase().trim());
        if (!lowerDepts.includes(studentDept)) {
          return null; // Skip this student
        }
      }

      // B. CGPA Filter (Hard constraint if specified)
      if (minCgpa > 0.0 && studentCgpa < minCgpa) {
        return null; // Skip this student
      }

      // --- Match Scoring Components (Weighted) ---
      let skillsScore = 0.0;
      const matchedSkillsList: string[] = [];
      const missingSkillsList: string[] = [];

      // Skills matching logic
      if (skills.length > 0) {
        let matchedValSum = 0;
        skills.forEach((skillReq: string) => {
          const reqLower = skillReq.toLowerCase().trim();
          const expansion = skillExpansions[skillReq] || { aliases: [], subSkills: [], related: [] };

          // Look for direct skill match in student skills
          const studentSkillMatch = student.Skills.find((s: any) => s.Name.toLowerCase().trim() === reqLower);

          if (studentSkillMatch) {
            matchedValSum += 1.0; // Direct match
            matchedSkillsList.push(studentSkillMatch.Name);
          } else {
            // Check aliases
            const aliasMatch = student.Skills.find((s: any) => expansion.aliases.includes(s.Name.toLowerCase().trim()));
            if (aliasMatch) {
              matchedValSum += 1.0;
              matchedSkillsList.push(`${aliasMatch.Name} (alias of ${skillReq})`);
            } else {
              // Check subskills
              const subMatch = student.Skills.find((s: any) => expansion.subSkills.includes(s.Name.toLowerCase().trim()));
              if (subMatch) {
                matchedValSum += 0.9;
                matchedSkillsList.push(`${subMatch.Name} (subskill of ${skillReq})`);
              } else {
                // Check related skills
                const relatedMatch = student.Skills.find((s: any) => expansion.related.includes(s.Name.toLowerCase().trim()));
                if (relatedMatch) {
                  matchedValSum += 0.7;
                  matchedSkillsList.push(`${relatedMatch.Name} (related to ${skillReq})`);
                } else {
                  missingSkillsList.push(skillReq);
                }
              }
            }
          }
        });
        skillsScore = (matchedValSum / skills.length) * 100;
      } else {
        skillsScore = 100; // default full marks if no skills requested
      }

      // Experience matching score
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
        // general experience scoring
        expScore = expCount === 0 ? 40 : Math.min(100, 50 + expCount * 25);
      }

      // Projects matching score
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

      // Certifications matching score
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

      // Portfolio Completeness score
      let completenessScore = 20; // default 20% for active account
      if (profile?.Bio) completenessScore += 20;
      if (profile?.LinkedInUrl || profile?.GitHubUrl) completenessScore += 20;
      if (student.Projects.length > 0) completenessScore += 20;
      if (student.Skills.length > 0) completenessScore += 20;

      // Achievements matching score
      const achsCount = student.Achievements.length + student.SportsAchievements.length + student.StartupCompetitions.length;
      const achievementsScore = achsCount === 0 ? 40 : Math.min(100, 50 + achsCount * 25);

      // CGPA score
      const cgpaScore = studentCgpa > 0.0 ? (studentCgpa / 10.0) * 100 : 50;

      // --- Weighted Total Match Calculation ---
      const totalMatchPct = Math.round(
        (skillsScore * weights.skills) +
        (expScore * weights.experience) +
        (projectsScore * weights.projects) +
        (certsScore * weights.certifications) +
        (completenessScore * weights.completeness) +
        (achievementsScore * weights.achievements) +
        (cgpaScore * weights.cgpa)
      );

      // Verify keywords match (Soft constraint: bonus points or general filters)
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
        // If query keywords are present but student matches none, penalize match score slightly
        if (keywordMatches === 0 && searchTerms.length > 0) {
          // Subtract small penalty (e.g. 10%)
          return {
            student,
            matchPct: Math.max(5, totalMatchPct - 15),
            matchedSkills: matchedSkillsList,
            missingSkills: missingSkillsList
          };
        }
      }

      return {
        student,
        matchPct: totalMatchPct,
        matchedSkills: matchedSkillsList,
        missingSkills: missingSkillsList
      };
    });

    // Filter nulls and sort by matchPct desc
    const results = scoredCandidates
      .filter(Boolean)
      .sort((a: any, b: any) => b.matchPct - a.matchPct)
      .map((item: any) => ({
        matchPct: item.matchPct,
        matchedSkills: item.matchedSkills,
        missingSkills: item.missingSkills,
        id: item.student.Id,
        fullName: item.student.FullName,
        email: item.student.Email,
        department: item.student.Department,
        registerNumber: item.student.RegisterNumber,
        bio: item.student.Profiles[0]?.Bio || "",
        cgpa: item.student.Profiles[0]?.CGPA || 0.0,
        graduationYear: item.student.Profiles[0]?.GraduationYear || null,
        linkedInUrl: item.student.Profiles[0]?.LinkedInUrl || "",
        gitHubUrl: item.student.Profiles[0]?.GitHubUrl || "",
        projects: (item.student.Projects || []).map((p: any) => ({
          title: p.Title,
          description: p.Description,
          technologies: p.Technologies,
          githubUrl: p.GithubUrl
        })),
        resumes: (item.student.Resumes || []).map((r: any) => ({
          title: r.ResumeTitle,
          url: r.ResumeUrl
        })),
        certificates: (item.student.Certifications || []).map((c: any) => ({
          title: c.Title,
          issuer: c.Issuer,
          date: c.IssueDate
        }))
      }));

    return NextResponse.json(results);
  } catch (err: any) {
    console.error("POST Talent Matching Error:", err);
    return NextResponse.json({ message: "Internal server error", error: err?.message }, { status: 500 });
  }
}
