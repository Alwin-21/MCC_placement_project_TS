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

    // 1. Fetch matching configurations
    let weights = DEFAULT_WEIGHTS;
    const config = await prisma.matchingEngineConfig.findUnique({
      where: { ConfigKey: "weights" }
    });
    if (config) {
      try {
        weights = JSON.parse(config.ConfigVal);
      } catch (e) {}
    }

    // 2. Fetch all job applications for this company
    const applications = await prisma.jobApplication.findMany({
      where: {
        Job: {
          CompanyId: hrUser.CompanyId
        }
      },
      include: {
        Job: true,
        Student: {
          include: {
            Profiles: { take: 1 },
            Skills: true,
            Projects: true,
            Experiences: true,
            Certifications: true,
            Achievements: true
          }
        }
      }
    });

    const totalApplications = applications.length;

    // A. Funnel stage counts
    const funnel: Record<string, number> = {
      Applied: 0,
      Reviewed: 0,
      Shortlisted: 0,
      InterviewScheduled: 0,
      Selected: 0,
      "Offer Sent": 0,
      "Offer Accepted": 0,
      Joined: 0,
      Rejected: 0
    };

    applications.forEach((app) => {
      if (funnel[app.Status] !== undefined) {
        funnel[app.Status]++;
      } else {
        // Safe fallback mappings
        if (app.Status === "Offered") funnel["Offer Sent"]++;
        else funnel.Applied++;
      }
    });

    // B. Placed/Conversion metric
    // Placed count: Joined + Offer Accepted
    const conversionsCount = funnel["Offer Accepted"] + funnel["Joined"];
    const conversionRate = totalApplications > 0 ? (conversionsCount / totalApplications) * 100 : 0.0;

    // C. Offers released and acceptance metrics
    // Released offers: Sent + Accepted + Joined + Rejected (if details state it was released)
    const offersReleased = (funnel["Offer Sent"] || 0) + (funnel["Offer Accepted"] || 0) + (funnel["Joined"] || 0);
    const offersAccepted = (funnel["Offer Accepted"] || 0) + (funnel["Joined"] || 0);
    const offerAcceptanceRate = offersReleased > 0 ? (offersAccepted / offersReleased) * 100 : 0.0;

    // D. Interview success metrics
    // Interview Scheduled -> Placed/Selected
    const interviewCount = funnel["InterviewScheduled"] + funnel["Selected"] + offersReleased;
    const interviewSuccessCount = funnel["Selected"] + offersReleased;
    const interviewSuccessRate = interviewCount > 0 ? (interviewSuccessCount / interviewCount) * 100 : 0.0;

    // E. Matching Calculations
    let totalMatchPctSum = 0;
    let matchPctsCalculated = 0;

    const skillFrequencies: Record<string, number> = {};
    const departmentFrequencies: Record<string, number> = {};

    applications.forEach((app) => {
      const student = app.Student;
      const job = app.Job;
      const profile = student.Profiles[0] || null;

      // Track department count
      const dept = student.Department || "Other";
      departmentFrequencies[dept] = (departmentFrequencies[dept] || 0) + 1;

      // Track skills
      student.Skills.forEach((s) => {
        const sName = s.Name.trim();
        skillFrequencies[sName] = (skillFrequencies[sName] || 0) + 1;
      });

      // Calculate match percentage for this student + job
      const requiredSkillsList = job.RequiredSkills
        ? job.RequiredSkills.split(/[;,]/).map((s) => s.trim().toLowerCase()).filter((s) => s.length > 0)
        : [];

      let skillsScore = 0.0;
      if (requiredSkillsList.length > 0) {
        let matches = 0;
        requiredSkillsList.forEach((reqSkill) => {
          const matched = student.Skills.some((s) => s.Name.trim().toLowerCase() === reqSkill);
          if (matched) matches++;
        });
        skillsScore = matches / requiredSkillsList.length;
      } else {
        skillsScore = 1.0;
      }

      // Experience Score
      const expCount = student.Experiences.length;
      const experienceScore = expCount >= 2 ? 1.0 : expCount === 1 ? 0.6 : 0.2;

      // Projects Score
      const projCount = student.Projects.length;
      const projectsScore = projCount >= 3 ? 1.0 : projCount === 2 ? 0.7 : projCount === 1 ? 0.4 : 0.1;

      // Certifications Score
      const certCount = student.Certifications.length;
      const certificationsScore = certCount >= 2 ? 1.0 : certCount === 1 ? 0.6 : 0.1;

      // Profile Completeness
      let filledFields = 0;
      let totalFields = 5;
      if (student.FullName) filledFields++;
      if (student.Department) filledFields++;
      if (profile?.Bio) filledFields++;
      if (profile?.LinkedInUrl) filledFields++;
      if (profile?.CGPA) filledFields++;
      const completenessScore = filledFields / totalFields;

      // Achievements Score
      const achCount = student.Achievements.length;
      const achievementsScore = achCount >= 2 ? 1.0 : achCount === 1 ? 0.5 : 0.1;

      // CGPA score
      const studentCgpa = profile?.CGPA || 0.0;
      const minCgpaReq = job.EligibilityMinCGPA || 0.0;
      const cgpaScore = minCgpaReq > 0 ? (studentCgpa >= minCgpaReq ? 1.0 : studentCgpa / minCgpaReq) : (studentCgpa / 10.0);

      // Weighted Matching Score Sum
      const totalPct = (
        skillsScore * weights.skills +
        experienceScore * weights.experience +
        projectsScore * weights.projects +
        certificationsScore * weights.certifications +
        completenessScore * weights.completeness +
        achievementsScore * weights.achievements +
        cgpaScore * weights.cgpa
      ) * 100;

      totalMatchPctSum += totalPct;
      matchPctsCalculated++;
    });

    const averageMatchScore = matchPctsCalculated > 0 ? totalMatchPctSum / matchPctsCalculated : 0.0;

    // Format popular skills
    const popularSkills = Object.entries(skillFrequencies)
      .map(([skill, count]) => ({ skill, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Format departments
    const departments = Object.entries(departmentFrequencies)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    return NextResponse.json({
      totalApplications,
      conversionRate: Math.round(conversionRate * 10) / 10,
      averageMatchScore: Math.round(averageMatchScore * 10) / 10,
      funnel,
      interviewCount,
      interviewSuccessRate: Math.round(interviewSuccessRate * 10) / 10,
      offersReleased,
      offerAcceptanceRate: Math.round(offerAcceptanceRate * 10) / 10,
      popularSkills,
      departments
    });
  } catch (err: any) {
    console.error("GET Company Analytics Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
