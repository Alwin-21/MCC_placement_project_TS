import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { hashPassword } from "@/utils/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      companyName,
      companyEmail,
      officialHrEmail,
      hrName,
      hrDesignation,
      hrPassword,
      phone,
      alternatePhone,
      companyLogo,
      coverImage,
      website,
      linkedIn,
      industry,
      companyType,
      companySize,
      foundedYear,
      headOffice,
      branchLocations, // string array or string comma separated
      workMode, // "Remote" | "Hybrid" | "OnSite"
      description,
      mission,
      vision,
      workCulture,
      benefits,
      awards,
      achievements,
      recruitmentProcess,
      internshipAvailable,
      placementAvailable,
      gstDocUrl,
      regDocUrl,
      authDocUrl,
    } = body;

    // Simple Server-Side Validations
    if (!companyName || !companyEmail || !officialHrEmail || !hrName || !hrPassword) {
      return NextResponse.json("Required fields are missing.", { status: 400 });
    }

    const companyEmailTrim = companyEmail.trim().toLowerCase();
    const officialHrEmailTrim = officialHrEmail.trim().toLowerCase();

    // Check if company or user email already registered
    const existingCompany = await prisma.company.findFirst({
      where: {
        OR: [
          { Email: companyEmailTrim },
          { Name: { equals: companyName.trim(), mode: "insensitive" } },
        ],
      },
    });

    if (existingCompany) {
      return NextResponse.json("Company name or email is already registered.", { status: 400 });
    }

    const existingUser = await prisma.companyUsers.findUnique({
      where: { Email: officialHrEmailTrim },
    });

    if (existingUser) {
      return NextResponse.json("HR email is already registered.", { status: 400 });
    }

    const passwordHash = hashPassword(hrPassword);
    const parsedFoundedYear = parseInt(foundedYear) || new Date().getFullYear();

    // Create Company and sub-entities within transaction
    const newCompany = await prisma.$transaction(async (tx) => {
      // 1. Create Company
      const company = await tx.company.create({
        data: {
          Name: companyName.trim(),
          Email: companyEmailTrim,
          Status: "Pending",
        },
      });

      // 2. Create Profile
      await tx.companyProfile.create({
        data: {
          CompanyId: company.Id,
          LogoUrl: companyLogo || null,
          CoverImageUrl: coverImage || null,
          Website: website || null,
          LinkedInUrl: linkedIn || null,
          Industry: industry || "Other",
          CompanyType: companyType || "Private",
          CompanySize: companySize || "1-10",
          FoundedYear: parsedFoundedYear,
          Description: description || "",
          Mission: mission || null,
          Vision: vision || null,
          WorkCulture: workCulture || null,
          Benefits: benefits || null,
          Awards: awards || null,
          Achievements: achievements || null,
          RecruitmentProcess: recruitmentProcess || null,
          InternshipAvailable: !!internshipAvailable,
          PlacementAvailable: !!placementAvailable,
        },
      });

      // 3. Create Locations
      if (headOffice) {
        await tx.companyLocations.create({
          data: {
            CompanyId: company.Id,
            Location: headOffice.trim(),
            IsHeadOffice: true,
            WorkMode: workMode || "OnSite",
          },
        });
      }

      if (branchLocations) {
        const branches = Array.isArray(branchLocations)
          ? branchLocations
          : branchLocations.split(",").map((l: string) => l.trim()).filter(Boolean);

        for (const branch of branches) {
          await tx.companyLocations.create({
            data: {
              CompanyId: company.Id,
              Location: branch,
              IsHeadOffice: false,
              WorkMode: workMode || "OnSite",
            },
          });
        }
      }

      // 4. Create Documents
      const docs = [
        { type: "GST", url: gstDocUrl },
        { type: "RegistrationCertificate", url: regDocUrl },
        { type: "HiringAuthorization", url: authDocUrl },
      ].filter((d) => d.url);

      for (const doc of docs) {
        await tx.companyDocuments.create({
          data: {
            CompanyId: company.Id,
            DocType: doc.type,
            FileUrl: doc.url,
          },
        });
      }

      // 5. Create HR User
      const hrUser = await tx.companyUsers.create({
        data: {
          CompanyId: company.Id,
          Email: officialHrEmailTrim,
          PasswordHash: passwordHash,
          FullName: hrName.trim(),
          Designation: hrDesignation || "HR Representative",
          Phone: phone || "",
          AlternatePhone: alternatePhone || null,
          IsActive: true,
        },
      });

      // 6. Create Initial Status History
      await tx.companyStatusHistory.create({
        data: {
          CompanyId: company.Id,
          OldStatus: "None",
          NewStatus: "Pending",
          ChangedBy: officialHrEmailTrim,
          Comments: "Company self-registered onboarding request.",
        },
      });

      return { company, hrUser };
    });

    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";

    // Write System Audit Log
    await prisma.auditLogs.create({
      data: {
        Action: "Company Registration",
        PerformedByEmail: officialHrEmailTrim,
        Timestamp: new Date(),
        Details: `Company '${companyName}' submitted registration with HR user ${hrName}.`,
        IpAddress: ip,
      },
    });

    // Write Company Audit Log
    await prisma.companyAuditLogs.create({
      data: {
        CompanyId: newCompany.company.Id,
        Action: "Onboarding Submitted",
        PerformedByEmail: officialHrEmailTrim,
        Timestamp: new Date(),
        Details: "Company registration forms and verification documents submitted.",
        IpAddress: ip,
      },
    });

    // Create Notification for Admins (UserId = null)
    await prisma.notifications.create({
      data: {
        Title: "New Company Onboarding",
        Message: `Company '${companyName}' has registered and is pending verification.`,
        Type: "CompanyAction",
        IsRead: false,
        CreatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Company registered successfully and is pending verification review.",
      companyId: newCompany.company.Id,
    });
  } catch (err: any) {
    console.error("Company Registration Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
