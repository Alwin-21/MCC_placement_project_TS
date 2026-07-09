import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { getUserFromRequest } from "@/utils/auth";

export async function GET(request: Request) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload) return NextResponse.json("Unauthorized", { status: 401 });
    const userId = parseInt(userPayload.nameid, 10);

    const user = await prisma.users.findUnique({ where: { Id: userId } });
    if (!user) return NextResponse.json("User not found.", { status: 404 });

    const profile = await prisma.profiles.findFirst({ where: { UserId: userId } });
    const skills = await prisma.skills.findMany({ where: { UserId: userId } });
    const projects = await prisma.projects.findMany({ where: { UserId: userId } });
    const achievements = await prisma.achievements.findMany({ where: { UserId: userId } });
    const publications = await prisma.researchPapers.findMany({ where: { UserId: userId } });
    const hackathons = await prisma.hackathons.findMany({ where: { UserId: userId } });
    const certs = await prisma.certifications.findMany({ where: { UserId: userId } });
    const resumes = await prisma.resumes.findMany({ where: { UserId: userId } });

    // 1. Calculate Profile Completeness Score (max 100)
    let score = 20; // base register
    if (profile) {
      if (profile.Bio) score += 15;
      if (profile.ProfileImageUrl) score += 15;
      if (profile.LinkedInUrl) score += 10;
      if (profile.GitHubUrl) score += 10;
    }
    if (skills.length >= 3) score += 10;
    else if (skills.length > 0) score += 5;

    if (projects.length >= 2) score += 10;
    else if (projects.length > 0) score += 5;

    if (resumes.length > 0) score += 10;

    // 2. Skill Gap Analysis
    const targetCareer = profile?.TargetCareer || "Full-Stack Developer";
    const standardCareerRequirements: Record<string, string[]> = {
      "Full-Stack Developer": ["React", "NodeJS", "JavaScript", "HTML", "CSS", "SQL", "Git", "REST API"],
      "Data Scientist": ["Python", "SQL", "Machine Learning", "Pandas", "Statistics", "Data Visualization", "TensorFlow"],
      "AI Researcher / ML Engineer": ["Python", "PyTorch", "TensorFlow", "Deep Learning", "Algorithms", "Mathematics", "Git"],
      "Product Manager": ["Product Strategy", "Agile", "User Research", "Wireframing", "Roadmapping", "Data Analytics"],
      "Cloud Engineer / DevOps": ["Docker", "Kubernetes", "AWS", "CI/CD", "Linux", "Git", "Bash", "Terraform"]
    };

    // Find best career mapping match or fall back to Full-Stack Developer
    const matchedKey = Object.keys(standardCareerRequirements).find(k =>
      k.toLowerCase().includes(targetCareer.toLowerCase())
    ) || "Full-Stack Developer";

    const requiredSkills = standardCareerRequirements[matchedKey];
    const studentSkillsSet = new Set(skills.map(s => s.Name.trim().toLowerCase()));

    const matchedSkills = requiredSkills.filter(req => studentSkillsSet.has(req.toLowerCase()));
    const missingSkills = requiredSkills.filter(req => !studentSkillsSet.has(req.toLowerCase()));

    const skillMatchPercentage = requiredSkills.length > 0
      ? (matchedSkills.length / requiredSkills.length) * 100
      : 0.0;

    // 3. Internship Matches
    const internships = [
      { Company: "Zoho Corporation", Role: "Product Developer Intern", Location: "Chennai", Description: "Focus on backend modules, database design, and cloud scalability.", MatchReason: "Great fit for your C# & SQL skills." },
      { Company: "Freshworks", Role: "Associate Software Engineer", Location: "Chennai", Description: "Focus on building modern web apps, JavaScript architectures, and APIs.", MatchReason: "Perfect match for your frontend credentials." },
      { Company: "Microsoft India", Role: "Software Engineer Intern", Location: "Hyderabad", Description: "Deep dive into cloud platforms (Azure), developer tools, and system performance.", MatchReason: "Elite role matching your high cgpa and publications." }
    ];

    // 4. University Recommendations
    const cgpa = profile?.CGPA || 0.0;
    const universities: any[] = [];
    if (cgpa >= 8.5 || publications.length > 0) {
      universities.push({ Name: "Carnegie Mellon University", Country: "USA", Program: "MS in Software Engineering", Details: "Top technical match for advanced system designs." });
      universities.push({ Name: "University of Edinburgh", Country: "UK", Program: "MSc in Artificial Intelligence", Details: "Scholarly publications fit Edinburgh AI Lab guidelines." });
      universities.push({ Name: "National University of Singapore", Country: "Singapore", Program: "Master of Computing", Details: "Focus on enterprise systems and ML architectures." });
    } else {
      universities.push({ Name: "Arizona State University", Country: "USA", Program: "MS in Computer Science", Details: "Great curriculum matching software development stacks." });
      universities.push({ Name: "University of Texas at Dallas", Country: "USA", Program: "MS in Software Engineering", Details: "Very strong placement statistics for engineers." });
      universities.push({ Name: "BITS Pilani", Country: "India", Program: "M.Tech in Software Systems", Details: "Premier Indian higher education program with industry tie-ups." });
    }

    // 5. Scholarship Suggestions
    const scholarships = [
      { Title: "Erasmus Mundus Scholarship", Amount: "100% Fully Funded", Eligible: publications.length > 0 || cgpa >= 8.0, Details: "Joint postgraduate programs across the European Union." },
      { Title: "MCC Incubation Grant", Amount: "Up to ₹2,00,000", Eligible: projects.length > 0, Details: "Offered by MCC Entrepreneurship cell for prototype development." },
      { Title: "Rhodes Scholarship", Amount: "Fully Funded Oxford Tuition", Eligible: cgpa >= 9.0, Details: "Prestigious scholarship for leadership and academic excellence." }
    ];

    // 6. Actionable Resume Suggestions
    const resumeSuggestions: string[] = [];
    if (resumes.length === 0) {
      resumeSuggestions.push("Upload a professional resume in PDF format to enable placement matchmaking.");
    } else {
      resumeSuggestions.push(`Highlight your key technical skills (currently ${skills.length} listed) clearly at the top of your resume.`);
      if (projects.length > 0) {
        resumeSuggestions.push(`Include clickable hyperlinks to your ${projects.length} projects (e.g., GitHub links) to demonstrate practical coding skills.`);
      }
      if (cgpa >= 8.0) {
        resumeSuggestions.push(`Since you have a strong CGPA of ${cgpa.toFixed(2)}/10.0, feature this in your resume header or education section.`);
      }
      if (publications.length > 0) {
        resumeSuggestions.push(`Include your academic research publication '${publications[0].Title}' in a dedicated Publications section.`);
      }
    }

    // 7. Actionable Portfolio Improvement Suggestions
    const portfolioImprovementSuggestions: string[] = [];
    if (!profile || !profile.Bio) {
      portfolioImprovementSuggestions.push("Write a personal story or bio in your dashboard to help recruiters understand your background.");
    }
    if (!profile || !profile.ProfileImageUrl) {
      portfolioImprovementSuggestions.push("Upload a professional profile photo to personalize your public portfolio page.");
    }
    if (!profile || (!profile.LinkedInUrl && !profile.GitHubUrl)) {
      portfolioImprovementSuggestions.push("Connect your LinkedIn or GitHub accounts to build web presence and trust.");
    }
    if (profile && !profile.BehanceUrl && user.Department?.toLowerCase().includes("design")) {
      portfolioImprovementSuggestions.push("Add a Behance username link to showcase your creative and UI design portfolios.");
    }
    if (projects.length < 2) {
      portfolioImprovementSuggestions.push(`Add at least ${2 - projects.length} more real-world projects with source code repositories or live demonstration links.`);
    }
    if (certs.length === 0) {
      portfolioImprovementSuggestions.push("Upload professional certifications (e.g. cloud, development, or database credentials) to validate your capabilities.");
    }
    if (achievements.length === 0) {
      portfolioImprovementSuggestions.push("Add achievements (e.g., NGO / Community Service, Sports, Olympiads, Startup Competitions) to highlight leadership and extracurricular involvement.");
    }
    if (hackathons.length === 0) {
      portfolioImprovementSuggestions.push("Participate in and add Hackathons to demonstrate teamwork, fast execution, and problem solving.");
    }

    const careerRecommendations = [];
    for (const key of Object.keys(standardCareerRequirements)) {
      const reqSkills = standardCareerRequirements[key];
      const matches = reqSkills.filter(req => studentSkillsSet.has(req.toLowerCase()));
      const missing = reqSkills.filter(req => !studentSkillsSet.has(req.toLowerCase()));
      const matchPct = reqSkills.length > 0 ? (matches.length / reqSkills.length) * 100 : 0.0;

      careerRecommendations.push({
        career: key,
        matchPercentage: Math.round(matchPct * 10) / 10,
        matchedSkills: matches,
        missingSkills: missing
      });
    }

    // Sort by match percentage descending
    careerRecommendations.sort((a, b) => b.matchPercentage - a.matchPercentage);

    return NextResponse.json({
      profileCompleteness: score,
      targetCareer: matchedKey,
      skillMatchPercentage: Math.round(skillMatchPercentage * 10) / 10,
      matchedSkills,
      missingSkills,
      internships,
      universities,
      scholarships,
      resumeSuggestions,
      portfolioImprovementSuggestions,
      careerRecommendations
    });
  } catch (err: any) {
    console.error("Career Analysis Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
