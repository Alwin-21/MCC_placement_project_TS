import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { getUserFromRequest, hasModulePermission } from "@/utils/auth";

// MCC default Aided departments (well-known classification)
const DEFAULT_AIDED_DEPARTMENTS = new Set([
  "english",
  "tamil",
  "languages",
  "history",
  "political science",
  "public administration",
  "economics",
  "philosophy",
  "social work",
  "mathematics",
  "statistics",
  "physics",
  "chemistry",
  "botany",
  "zoology",
  "computer science",
  "computer science (b.sc)",
  "commerce",
  "physical education",
]);

export async function GET(request: Request) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload || !hasModulePermission(userPayload, "analytics", "read")) {
      return NextResponse.json("Unauthorized", { status: 401 });
    }

    const users = await prisma.users.findMany();
    const profiles = await prisma.profiles.findMany();
    const experiences = await prisma.experiences.findMany();
    const academicRecords = await prisma.academicRecords.findMany();
    const achievements = await prisma.achievements.findMany();
    const projects = await prisma.projects.findMany();
    const papers = await prisma.researchPapers.findMany();
    const skills = await prisma.skills.findMany();
    const certifications = await prisma.certifications.findMany();
    const resumes = await prisma.resumes.findMany();

    const inst = await prisma.institutionDetails.findFirst();
    const declaredDepts = inst
      ? inst.Departments.split(";").map(d => d.trim()).filter(d => d.length > 0)
      : [];

    // Parse the DeptStreams JSON config
    let deptStreamsMap: Record<string, string> = {};
    if (inst && inst.DeptStreams) {
      try {
        deptStreamsMap = JSON.parse(inst.DeptStreams);
      } catch {
        deptStreamsMap = {};
      }
    }

    const userDepts = Array.from(new Set(users.map(u => u.Department).filter(d => !!d)));
    
    // Combine declared and user-defined departments
    const allDepts = Array.from(new Set([...declaredDepts, ...userDepts]));

    // Fast O(1) lookups for portfolio completion calculations
    const expUserIds = new Set(experiences.map(e => e.UserId));
    const acadUserIds = new Set(academicRecords.map(a => a.UserId));
    const achUserIds = new Set(achievements.map(a => a.UserId));
    const projUserIds = new Set(projects.map(p => p.UserId));
    const paperUserIds = new Set(papers.map(p => p.UserId));
    const skillUserIds = new Set(skills.map(s => s.UserId));
    const certUserIds = new Set(certifications.map(c => c.UserId));
    const resumeUserIds = new Set(resumes.map(r => r.UserId));
    const profileMap = new Map(profiles.map(p => [p.UserId, p]));

    // Helper: calculate student completion % using the exact 15-field dashboard logic
    const calculateStudentCompletion = (u: any) => {
      const p = profileMap.get(u.Id);

      // 1. Header (5 required fields)
      const hasName = Boolean(u.FullName?.trim());
      const hasPhoto = Boolean(u.ProfileImageUrl?.trim() || p?.ProfileImageUrl?.trim());
      const hasCourse = Boolean(p?.Course?.trim() || u.Department?.trim());
      const hasYear = Boolean(p?.YearOfStudy?.trim());
      const hasPhone = Boolean(p?.Phone?.trim());

      // 2. About Section (1 required field)
      const hasBio = Boolean(p?.Bio?.trim());

      // 3. Experience (1 required: >= 1 record)
      const hasExp = expUserIds.has(u.Id);

      // 4. Academic Details (1 required: >= 1 record)
      const hasAcad = acadUserIds.has(u.Id);

      // 5. Achievements (1 required: >= 1 record)
      const hasAch = achUserIds.has(u.Id);

      // 6. Projects & Research (1 required: project or paper)
      const hasProjOrPaper = projUserIds.has(u.Id) || paperUserIds.has(u.Id);

      // 7. Skills (1 required: >= 1 skill)
      const hasSkill = skillUserIds.has(u.Id);

      // 8. Certifications (1 required: >= 1 cert)
      const hasCert = certUserIds.has(u.Id);

      // 9. Languages Known (1 required: text entered)
      const hasLang = Boolean(p?.Languages?.trim());

      // 10. Resume Document (1 required: >= 1 resume)
      const hasResume = resumeUserIds.has(u.Id);

      // 11. Media Handles (1 required: LinkedIn or other handle)
      const hasLinkedIn = Boolean(p?.LinkedInUrl?.trim());
      const hasOtherMedia = Boolean(
        p?.InstagramUrl?.trim() || p?.BlogUrl?.trim() || p?.OtherHandles?.trim()
      );
      const hasMedia = hasLinkedIn || hasOtherMedia;

      const fields = [
        hasName, hasPhoto, hasCourse, hasYear, hasPhone,
        hasBio,
        hasExp,
        hasAcad,
        hasAch,
        hasProjOrPaper,
        hasSkill,
        hasCert,
        hasLang,
        hasResume,
        hasMedia
      ];

      const filled = fields.filter(Boolean).length;
      return Math.min(100, Math.max(0, Math.round((filled / 15) * 100)));
    };

    const analytics = allDepts.map(dept => {
      const deptUsers = users.filter(u => u.Department && u.Department.toLowerCase() === dept.toLowerCase());
      const deptUserIds = new Set(deptUsers.map(u => u.Id));

      const studentCount = deptUsers.length;
      const projectCount = projects.filter(p => deptUserIds.has(p.UserId)).length;
      const paperCount = papers.filter(r => deptUserIds.has(r.UserId)).length;
      const skillCount = skills.filter(s => deptUserIds.has(s.UserId)).length;

      // Calculate completion % for each student in this department
      const deptStudents = deptUsers.map(u => ({
        id: u.Id,
        fullName: u.FullName || "Unnamed Student",
        registerNumber: u.RegisterNumber || "",
        completionPercentage: calculateStudentCompletion(u)
      }));

      // Department completion rate is the average across all enrolled students
      let completionRate: number | null = null;
      if (studentCount > 0) {
        const sumCompletion = deptStudents.reduce((acc, s) => acc + s.completionPercentage, 0);
        completionRate = Math.round((sumCompletion / studentCount) * 10) / 10;
      }

      // Determine stream: prefer explicit config, fall back to default classification
      let stream: "Aided" | "SFS" = "SFS";
      const deptLower = dept.toLowerCase();
      if (deptStreamsMap[dept]) {
        stream = deptStreamsMap[dept] === "Aided" ? "Aided" : "SFS";
      } else {
        // Try case-insensitive key lookup
        const configKey = Object.keys(deptStreamsMap).find(
          k => k.toLowerCase() === deptLower
        );
        if (configKey) {
          stream = deptStreamsMap[configKey] === "Aided" ? "Aided" : "SFS";
        } else if (DEFAULT_AIDED_DEPARTMENTS.has(deptLower)) {
          stream = "Aided";
        }
      }

      // Sort drill-down students descending by completion percentage
      deptStudents.sort((a, b) => b.completionPercentage - a.completionPercentage);

      return {
        department: dept,
        stream,
        studentCount: studentCount,
        projectCount: projectCount,
        paperCount: paperCount,
        skillCount: skillCount,
        approvalRate: completionRate !== null ? completionRate : 0, // Backward compatibility alias
        completionRate: completionRate, // null for 0 students, otherwise 0-100
        students: deptStudents // Per-student drill-down data
      };
    });

    // Sort descending by student count
    analytics.sort((a, b) => b.studentCount - a.studentCount);

    return NextResponse.json(analytics);
  } catch (err: any) {
    console.error("GET Admin Department Analytics Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
