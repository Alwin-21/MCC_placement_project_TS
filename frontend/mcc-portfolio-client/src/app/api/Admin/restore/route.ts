import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { getUserFromRequest } from "@/utils/auth";

export async function POST(request: Request) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload || userPayload.role !== "Admin") {
      return NextResponse.json("Forbidden", { status: 403 });
    }

    const backup = await request.json();
    if (!backup) {
      return NextResponse.json("Invalid backup payload", { status: 400 });
    }

    try {
      // 1. Delete dependent tables first to avoid key constraints
      await prisma.skills.deleteMany();
      await prisma.projects.deleteMany();
      await prisma.achievements.deleteMany();
      await prisma.hackathons.deleteMany();
      await prisma.certifications.deleteMany();
      await prisma.researchPapers.deleteMany();
      await prisma.resumes.deleteMany();
      await prisma.academicRecords.deleteMany();
      await prisma.olympiads.deleteMany();
      await prisma.startupCompetitions.deleteMany();
      await prisma.ngoActivities.deleteMany();
      await prisma.sportsAchievements.deleteMany();
      await prisma.profiles.deleteMany();
      await prisma.notifications.deleteMany();
      await prisma.savedResumes.deleteMany();
      await prisma.experiences.deleteMany();
      await prisma.communityServices.deleteMany();
      await prisma.creativeWorks.deleteMany();
      await prisma.themeConfigs.deleteMany();
      await prisma.institutionDetails.deleteMany();
      await prisma.users.deleteMany();
      await prisma.auditLogs.deleteMany();

      // 2. Restore primary independent tables
      const backupUsers = backup.users || backup.Users || [];
      for (const u of backupUsers) {
        let parsedRole = 1;
        const roleVal = u.role ?? u.Role;
        if (roleVal !== undefined) {
          if (typeof roleVal === "string") {
            if (roleVal === "Admin") parsedRole = 2;
            else if (roleVal === "Moderator") parsedRole = 3;
            else parsedRole = 1;
          } else {
            parsedRole = roleVal;
          }
        }
        await prisma.users.create({
          data: {
            Id: u.id ?? u.Id,
            FullName: u.fullName ?? u.FullName ?? "",
            Email: u.email ?? u.Email ?? "",
            PasswordHash: u.passwordHash ?? u.PasswordHash ?? "",
            Department: u.department ?? u.Department ?? "",
            RegisterNumber: u.registerNumber ?? u.RegisterNumber ?? "",
            ProfileImageUrl: u.profileImageUrl ?? u.ProfileImageUrl ?? "",
            Role: parsedRole,
            CreatedAt: new Date(u.createdAt ?? u.CreatedAt ?? new Date()),
            Stream: u.stream ?? u.Stream ?? "",
            IsTemporaryPassword: u.isTemporaryPassword !== undefined ? !!u.isTemporaryPassword : !!u.IsTemporaryPassword,
            Username: u.username ?? u.Username ?? "",
            IsActive: u.isActive !== undefined ? !!u.isActive : !!u.IsActive
          }
        });
      }

      const backupInst = backup.institutionDetails || backup.InstitutionDetails || [];
      for (const inst of backupInst) {
        await prisma.institutionDetails.create({
          data: {
            Id: inst.id ?? inst.Id,
            Name: inst.name ?? inst.Name ?? "",
            Code: inst.code ?? inst.Code ?? "",
            Description: inst.description ?? inst.Description ?? "",
            Address: inst.address ?? inst.Address ?? "",
            ContactEmail: inst.contactEmail ?? inst.ContactEmail ?? "",
            ContactPhone: inst.contactPhone ?? inst.ContactPhone ?? "",
            Website: inst.website ?? inst.Website ?? "",
            LogoUrl: inst.logoUrl ?? inst.LogoUrl ?? "",
            Departments: inst.departments ?? inst.Departments ?? ""
          }
        });
      }

      const backupThemes = backup.themeConfigs || backup.ThemeConfigs || [];
      for (const t of backupThemes) {
        await prisma.themeConfigs.create({
          data: {
            Id: t.id ?? t.Id,
            ThemeId: t.themeId ?? t.ThemeId ?? "",
            DisplayName: t.displayName ?? t.DisplayName ?? "",
            Description: t.description ?? t.Description ?? "",
            IsActive: t.isActive !== undefined ? !!t.isActive : !!t.IsActive,
            FontFamily: t.fontFamily ?? t.FontFamily ?? "",
            PrimaryColor: t.primaryColor ?? t.PrimaryColor ?? "",
            SecondaryColor: t.secondaryColor ?? t.SecondaryColor ?? ""
          }
        });
      }

      // 3. Restore remaining dependent tables
      const backupProfiles = backup.profiles || backup.Profiles || [];
      for (const p of backupProfiles) {
        await prisma.profiles.create({
          data: {
            Id: p.id ?? p.Id,
            Bio: p.bio ?? p.Bio ?? "",
            LinkedInUrl: p.linkedInUrl ?? p.LinkedInUrl ?? "",
            GitHubUrl: p.gitHubUrl ?? p.GitHubUrl ?? "",
            ProfileImageUrl: p.profileImageUrl ?? p.ProfileImageUrl ?? "",
            UserId: p.userId ?? p.UserId,
            IsApproved: p.isApproved !== undefined ? !!p.isApproved : !!p.IsApproved,
            SelectedTheme: p.selectedTheme ?? p.SelectedTheme ?? "Academic",
            BehanceUrl: p.behanceUrl ?? p.BehanceUrl ?? "",
            CGPA: p.cgpa ?? p.CGPA ?? 0.0,
            GitHubUsername: p.gitHubUsername ?? p.GitHubUsername ?? "",
            TargetCareer: p.targetCareer ?? p.TargetCareer ?? "",
            PersonalStory: p.personalStory ?? p.PersonalStory ?? "",
            SOP: p.sop ?? p.SOP ?? "",
            CurrentCompany: p.currentCompany ?? p.CurrentCompany ?? "",
            CurrentJobTitle: p.currentJobTitle ?? p.CurrentJobTitle ?? "",
            GraduationYear: p.graduationYear !== undefined ? (p.graduationYear ?? p.GraduationYear) : null,
            HigherStudyProgram: p.higherStudyProgram ?? p.HigherStudyProgram ?? "",
            HigherStudyUniversity: p.higherStudyUniversity ?? p.HigherStudyUniversity ?? "",
            IsAlumni: p.isAlumni !== undefined ? !!p.isAlumni : !!p.IsAlumni,
            BlogUrl: p.blogUrl ?? p.BlogUrl ?? "",
            Course: p.course ?? p.Course ?? "",
            CurrentLocation: p.currentLocation ?? p.CurrentLocation ?? "",
            InstagramUrl: p.instagramUrl ?? p.InstagramUrl ?? "",
            Languages: p.languages ?? p.Languages ?? "",
            OtherHandles: p.otherHandles ?? p.OtherHandles ?? "",
            Patents: p.patents ?? p.Patents ?? "",
            Phone: p.phone ?? p.Phone ?? "",
            TestScores: p.testScores ?? p.TestScores ?? "",
            YearOfStudy: p.yearOfStudy ?? p.YearOfStudy ?? ""
          }
        });
      }

      const backupSkills = backup.skills || backup.Skills || [];
      for (const s of backupSkills) {
        await prisma.skills.create({
          data: {
            Id: s.id ?? s.Id,
            Name: s.name ?? s.Name ?? "",
            Level: s.level ?? s.Level ?? "",
            UserId: s.userId ?? s.UserId,
            Category: s.category ?? s.Category ?? ""
          }
        });
      }

      const backupProjects = backup.projects || backup.Projects || [];
      for (const proj of backupProjects) {
        await prisma.projects.create({
          data: {
            Id: proj.id ?? proj.Id,
            Title: proj.title ?? proj.Title ?? "",
            Description: proj.description ?? proj.Description ?? "",
            Technologies: proj.technologies ?? proj.Technologies ?? "",
            GithubUrl: proj.githubUrl ?? proj.GithubUrl ?? "",
            LiveUrl: proj.liveUrl ?? proj.LiveUrl ?? "",
            UserId: proj.userId ?? proj.UserId,
            Category: proj.category ?? proj.Category ?? "",
            DemoVideoUrl: proj.demoVideoUrl ?? proj.DemoVideoUrl ?? "",
            ImageUrl: proj.imageUrl ?? proj.ImageUrl ?? ""
          }
        });
      }

      const backupAchievements = backup.achievements || backup.Achievements || [];
      for (const a of backupAchievements) {
        await prisma.achievements.create({
          data: {
            Id: a.id ?? a.Id,
            Title: a.title ?? a.Title ?? "",
            Description: a.description ?? a.Description ?? "",
            AchievementUrl: a.achievementUrl ?? a.AchievementUrl ?? "",
            AchievementDate: new Date(a.achievementDate ?? a.AchievementDate ?? new Date()),
            UserId: a.userId ?? a.UserId,
            Category: a.category ?? a.Category ?? ""
          }
        });
      }

      const backupHackathons = backup.hackathons || backup.Hackathons || [];
      for (const h of backupHackathons) {
        await prisma.hackathons.create({
          data: {
            Id: h.id ?? h.Id,
            Title: h.title ?? h.Title ?? "",
            Organizer: h.organizer ?? h.Organizer ?? "",
            Description: h.description ?? h.Description ?? "",
            ProjectName: h.projectName ?? h.ProjectName ?? "",
            HackathonUrl: h.hackathonUrl ?? h.HackathonUrl ?? "",
            EventDate: new Date(h.eventDate ?? h.EventDate ?? new Date()),
            UserId: h.userId ?? h.UserId,
            CertificateUrl: h.certificateUrl ?? h.CertificateUrl ?? ""
          }
        });
      }

      const backupCerts = backup.certifications || backup.Certifications || [];
      for (const c of backupCerts) {
        await prisma.certifications.create({
          data: {
            Id: c.id ?? c.Id,
            Title: c.title ?? c.Title ?? "",
            Issuer: c.issuer ?? c.Issuer ?? "",
            CertificateUrl: c.certificateUrl ?? c.CertificateUrl ?? "",
            IssueDate: new Date(c.issueDate ?? c.IssueDate ?? new Date()),
            UserId: c.userId ?? c.UserId,
            Category: c.category ?? c.Category ?? ""
          }
        });
      }

      const backupPapers = backup.researchPapers || backup.ResearchPapers || [];
      for (const rp of backupPapers) {
        await prisma.researchPapers.create({
          data: {
            Id: rp.id ?? rp.Id,
            Title: rp.title ?? rp.Title ?? "",
            Abstract: rp.abstract ?? rp.Abstract ?? "",
            Conference: rp.conference ?? rp.Conference ?? "",
            PaperUrl: rp.paperUrl ?? rp.PaperUrl ?? "",
            PublishedDate: new Date(rp.publishedDate ?? rp.PublishedDate ?? new Date()),
            UserId: rp.userId ?? rp.UserId,
            Category: rp.category ?? rp.Category ?? ""
          }
        });
      }

      const backupResumes = backup.resumes || backup.Resumes || [];
      for (const r of backupResumes) {
        await prisma.resumes.create({
          data: {
            Id: r.id ?? r.Id,
            ResumeTitle: r.resumeTitle ?? r.ResumeTitle ?? "",
            ResumeUrl: r.resumeUrl ?? r.ResumeUrl ?? "",
            UserId: r.userId ?? r.UserId
          }
        });
      }

      const backupAcademic = backup.academicRecords || backup.AcademicRecords || [];
      for (const ar of backupAcademic) {
        await prisma.academicRecords.create({
          data: {
            Id: ar.id ?? ar.Id,
            Institution: ar.institution ?? ar.Institution ?? "",
            Degree: ar.degree ?? ar.Degree ?? "",
            FieldOfStudy: ar.fieldOfStudy ?? ar.FieldOfStudy ?? "",
            Grade: ar.grade ?? ar.Grade ?? "",
            StartYear: ar.startYear ?? ar.StartYear ?? 0,
            EndYear: ar.endYear ?? ar.EndYear ?? 0,
            AttachmentUrl: ar.attachmentUrl ?? ar.AttachmentUrl ?? "",
            UserId: ar.userId ?? ar.UserId
          }
        });
      }

      const backupOlympiads = backup.olympiads || backup.Olympiads || [];
      for (const o of backupOlympiads) {
        await prisma.olympiads.create({
          data: {
            Id: o.id ?? o.Id,
            Name: o.name ?? o.Name ?? "",
            Subject: o.subject ?? o.Subject ?? "",
            Rank: o.rank ?? o.Rank ?? "",
            Year: o.year ?? o.Year ?? 0,
            Description: o.description ?? o.Description ?? "",
            CertificateUrl: o.certificateUrl ?? o.CertificateUrl ?? "",
            UserId: o.userId ?? o.UserId
          }
        });
      }

      const backupStartup = backup.startupCompetitions || backup.StartupCompetitions || [];
      for (const sc of backupStartup) {
        await prisma.startupCompetitions.create({
          data: {
            Id: sc.id ?? sc.Id,
            CompetitionName: sc.competitionName ?? sc.CompetitionName ?? "",
            ProjectName: sc.projectName ?? sc.ProjectName ?? "",
            Role: sc.role ?? sc.Role ?? "",
            Result: sc.result ?? sc.Result ?? "",
            Description: sc.description ?? sc.Description ?? "",
            Date: new Date(sc.date ?? sc.Date ?? new Date()),
            PitchDeckUrl: sc.pitchDeckUrl ?? sc.PitchDeckUrl ?? "",
            UserId: sc.userId ?? sc.UserId
          }
        });
      }

      const backupNgos = backup.ngoActivities || backup.NgoActivities || [];
      for (const n of backupNgos) {
        await prisma.ngoActivities.create({
          data: {
            Id: n.id ?? n.Id,
            OrganizationName: n.organizationName ?? n.OrganizationName ?? "",
            Role: n.role ?? n.Role ?? "",
            Description: n.description ?? n.Description ?? "",
            HoursContributed: n.hoursContributed ?? n.HoursContributed ?? 0,
            StartDate: new Date(n.startDate ?? n.StartDate ?? new Date()),
            EndDate: n.endDate || n.EndDate ? new Date(n.endDate ?? n.EndDate) : null,
            CertificateUrl: n.certificateUrl ?? n.CertificateUrl ?? "",
            UserId: n.userId ?? n.UserId
          }
        });
      }

      const backupSports = backup.sportsAchievements || backup.SportsAchievements || [];
      for (const sp of backupSports) {
        await prisma.sportsAchievements.create({
          data: {
            Id: sp.id ?? sp.Id,
            SportName: sp.sportName ?? sp.SportName ?? "",
            Level: sp.level ?? sp.Level ?? "",
            Achievement: sp.achievement ?? sp.Achievement ?? "",
            Description: sp.description ?? sp.Description ?? "",
            Date: new Date(sp.date ?? sp.Date ?? new Date()),
            CertificateUrl: sp.certificateUrl ?? sp.CertificateUrl ?? "",
            UserId: sp.userId ?? sp.UserId
          }
        });
      }

      const backupNotifications = backup.notifications || backup.Notifications || [];
      for (const notif of backupNotifications) {
        await prisma.notifications.create({
          data: {
            Id: notif.id ?? notif.Id,
            Title: notif.title ?? notif.Title ?? "",
            Message: notif.message ?? notif.Message ?? "",
            Type: notif.type ?? notif.Type ?? "Info",
            IsRead: notif.isRead !== undefined ? !!notif.isRead : !!notif.IsRead,
            CreatedAt: new Date(notif.createdAt ?? notif.CreatedAt ?? new Date()),
            UserId: notif.userId !== undefined ? (notif.userId ?? notif.UserId) : null
          }
        });
      }

      const backupSavedResumes = backup.savedResumes || backup.SavedResumes || [];
      for (const sr of backupSavedResumes) {
        await prisma.savedResumes.create({
          data: {
            Id: sr.id ?? sr.Id,
            ResumeTitle: sr.resumeTitle ?? sr.ResumeTitle ?? "",
            SelectedTheme: sr.selectedTheme ?? sr.SelectedTheme ?? "Professional",
            AccentColor: sr.accentColor ?? sr.AccentColor ?? "#18233c",
            ResumeDataJson: sr.resumeDataJson ?? sr.ResumeDataJson ?? "",
            CreatedAt: new Date(sr.createdAt ?? sr.CreatedAt ?? new Date()),
            UpdatedAt: new Date(sr.updatedAt ?? sr.UpdatedAt ?? new Date()),
            UserId: sr.userId ?? sr.UserId
          }
        });
      }

      const backupExp = backup.experiences || backup.Experiences || [];
      for (const ex of backupExp) {
        await prisma.experiences.create({
          data: {
            Id: ex.id ?? ex.Id,
            Title: ex.title ?? ex.Title ?? "",
            Company: ex.company ?? ex.Company ?? "",
            Location: ex.location ?? ex.Location ?? "",
            Description: ex.description ?? ex.Description ?? "",
            StartDate: ex.startDate ?? ex.StartDate ?? "",
            EndDate: ex.endDate ?? ex.EndDate ?? "",
            IsCurrent: ex.isCurrent !== undefined ? !!ex.isCurrent : !!ex.IsCurrent,
            Category: ex.category ?? ex.Category ?? "",
            UserId: ex.userId ?? ex.UserId
          }
        });
      }

      const backupComm = backup.communityServices || backup.CommunityServices || [];
      for (const cs of backupComm) {
        await prisma.communityServices.create({
          data: {
            Id: cs.id ?? cs.Id,
            Title: cs.title ?? cs.Title ?? "",
            Organization: cs.organization ?? cs.Organization ?? "",
            Description: cs.description ?? cs.Description ?? "",
            HoursServed: cs.hoursServed ?? cs.HoursServed ?? 0,
            Date: new Date(cs.date ?? cs.Date ?? new Date()),
            AttachmentUrl: cs.attachmentUrl ?? cs.AttachmentUrl ?? "",
            UserId: cs.userId ?? cs.UserId
          }
        });
      }

      const backupCreative = backup.creativeWorks || backup.CreativeWorks || [];
      for (const cw of backupCreative) {
        await prisma.creativeWorks.create({
          data: {
            Id: cw.id ?? cw.Id,
            Title: cw.title ?? cw.Title ?? "",
            Category: cw.category ?? cw.Category ?? "",
            Description: cw.description ?? cw.Description ?? "",
            WorkUrl: cw.workUrl ?? cw.WorkUrl ?? "",
            MediaUrl: cw.mediaUrl ?? cw.MediaUrl ?? "",
            Date: new Date(cw.date ?? cw.Date ?? new Date()),
            UserId: cw.userId ?? cw.UserId
          }
        });
      }

      const backupLogs = backup.auditLogs || backup.AuditLogs || [];
      for (const log of backupLogs) {
        await prisma.auditLogs.create({
          data: {
            Id: log.id ?? log.Id,
            Action: log.action ?? log.Action ?? "",
            PerformedByEmail: log.performedByEmail ?? log.PerformedByEmail ?? "",
            Timestamp: new Date(log.timestamp ?? log.Timestamp ?? new Date()),
            Details: log.details ?? log.Details ?? "",
            IpAddress: log.ipAddress ?? log.IpAddress ?? "127.0.0.1"
          }
        });
      }

      const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
      await prisma.auditLogs.create({
        data: {
          Action: "System Restore Triggered",
          PerformedByEmail: userPayload.email,
          Timestamp: new Date(),
          Details: "Successfully restored database tables from uploaded backup file",
          IpAddress: ip
        }
      });

      return NextResponse.json({ success: true, message: "System state restored successfully." });
    } catch (dbErr: any) {
      console.error("DB Restore Operations Error:", dbErr);
      return NextResponse.json(`Restore failed: ${dbErr.message}`, { status: 500 });
    }
  } catch (err: any) {
    console.error("Admin Restore Router Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
