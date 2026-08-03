import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { getUserFromRequest } from "@/utils/auth";

export async function GET(request: Request) {
  try {
    const payload = getUserFromRequest(request);
    if (!payload || payload.role !== "Company") {
      return NextResponse.json("Unauthorized", { status: 401 });
    }

    const hrUserId = parseInt(payload.nameid, 10);
    const hrUser = await prisma.companyUsers.findUnique({
      where: { Id: hrUserId },
      select: { CompanyId: true },
    });

    if (!hrUser) {
      return NextResponse.json("HR User not found.", { status: 404 });
    }

    // Fetch all applications WITH interviews included — eliminates the N+1 for interviews
    const applications = await prisma.jobApplication.findMany({
      where: {
        Job: { CompanyId: hrUser.CompanyId },
      },
      include: {
        Job: {
          include: { Assessment: true },
        },
        Student: {
          select: {
            Id: true,
            FullName: true,
            Email: true,
            Department: true,
            RegisterNumber: true,
            Profiles: {
              select: { Bio: true, CGPA: true, GraduationYear: true, LinkedInUrl: true },
              take: 1,
            },
          },
        },
        Interviews: {
          orderBy: { ScheduleTime: "desc" },
        },
      },
      orderBy: { AppliedAt: "desc" },
    });

    // Batch-fetch all relevant assessment attempts in ONE query — eliminates N+1
    // Build a set of (assessmentId, studentId) pairs where assessmentId is not null
    const assessmentPairs = applications
      .filter((app) => !!app.Job.AssessmentId)
      .map((app) => ({ assessmentId: app.Job.AssessmentId!, studentId: app.Student.Id }));

    let attemptsMap: Map<string, any> = new Map();

    if (assessmentPairs.length > 0) {
      const assessmentIds = [...new Set(assessmentPairs.map((p) => p.assessmentId))];
      const studentIds = [...new Set(assessmentPairs.map((p) => p.studentId))];

      const allAttempts = await prisma.assessmentAttempts.findMany({
        where: {
          AssessmentId: { in: assessmentIds },
          UserId: { in: studentIds },
          Status: "Submitted",
        },
      });

      // Map by "assessmentId:studentId" for O(1) lookup
      for (const attempt of allAttempts) {
        const key = `${attempt.AssessmentId}:${attempt.UserId}`;
        // Keep only the most recent attempt per key
        const prevAttempt = attemptsMap.get(key);
        if (!prevAttempt || (attempt.SubmittedAt && (!prevAttempt.SubmittedAt || attempt.SubmittedAt > prevAttempt.SubmittedAt))) {
          attemptsMap.set(key, attempt);
        }
      }
    }

    const mapped = applications.map((app) => {
      const attemptKey = `${app.Job.AssessmentId}:${app.Student.Id}`;
      const attempt = app.Job.AssessmentId ? attemptsMap.get(attemptKey) ?? null : null;

      return {
        id: app.Id,
        jobId: app.JobId,
        jobTitle: app.Job.Title,
        jobType: app.Job.JobType,
        salary: app.Job.Salary,
        lpa: app.Job.LPA,
        status: app.Status,
        appliedAt: app.AppliedAt,
        resumeUrl: app.ResumeUrl,
        assessmentId: app.Job.AssessmentId,
        assessmentTitle: app.Job.Assessment?.Title || "",
        assessmentAttempt: attempt
          ? {
              marksObtained: attempt.MarksObtained,
              totalMarks: attempt.TotalMarks,
              percentage: attempt.Percentage,
              submittedAt: attempt.SubmittedAt,
              isMalpractice: attempt.IsMalpractice,
            }
          : null,
        interviews: app.Interviews.map((i) => ({
          id: i.Id,
          type: i.Type,
          scheduleTime: i.ScheduleTime,
          meetLink: i.MeetLink,
          venue: i.Venue,
          status: i.Status,
          feedback: i.Feedback,
        })),
        offerLetterUrl: app.OfferLetterUrl,
        offerStatus: app.OfferStatus,
        offerReleasedAt: app.OfferReleasedAt,
        student: {
          id: app.Student.Id,
          fullName: app.Student.FullName,
          email: app.Student.Email,
          department: app.Student.Department,
          registerNumber: app.Student.RegisterNumber,
          cgpa: app.Student.Profiles[0]?.CGPA || 0.0,
          graduationYear: app.Student.Profiles[0]?.GraduationYear || null,
          bio: app.Student.Profiles[0]?.Bio || "",
          linkedInUrl: app.Student.Profiles[0]?.LinkedInUrl || "",
        },
      };
    });

    return NextResponse.json(mapped);
  } catch (err: any) {
    console.error("GET Company Applications Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
