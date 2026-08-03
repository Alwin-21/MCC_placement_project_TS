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
      include: {
        Company: {
          include: {
            Profile: true,
            Locations: true,
            Documents: true,
            Users: {
              select: {
                Id: true,
                FullName: true,
                Email: true,
                Designation: true,
                Phone: true,
                AlternatePhone: true,
                IsActive: true,
              },
            },
          },
        },
      },
    });

    if (!hrUser) {
      return NextResponse.json("HR representative user not found.", { status: 404 });
    }

    return NextResponse.json({
      hrUser: {
        id: hrUser.Id,
        fullName: hrUser.FullName,
        email: hrUser.Email,
        designation: hrUser.Designation,
        phone: hrUser.Phone,
        alternatePhone: hrUser.AlternatePhone,
      },
      company: hrUser.Company,
    });
  } catch (err: any) {
    console.error("GET Company Profile Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const payload = getUserFromRequest(request);
    if (!payload || payload.role !== "Company") {
      return NextResponse.json("Unauthorized", { status: 401 });
    }

    const hrUserId = parseInt(payload.nameid, 10);
    const hrUser = await prisma.companyUsers.findUnique({
      where: { Id: hrUserId },
    });

    if (!hrUser) {
      return NextResponse.json("HR User not found.", { status: 404 });
    }

    const body = await request.json();
    const {
      name,
      logoUrl,
      coverImageUrl,
      website,
      linkedInUrl,
      industry,
      companyType,
      companySize,
      foundedYear,
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
      headOffice,
      branchLocations, // array of strings
      workMode, // "Remote" | "Hybrid" | "OnSite"
    } = body;

    const companyId = hrUser.CompanyId;

    // Transaction to update Company details
    await prisma.$transaction(async (tx) => {
      // 1. Update Company Name
      if (name) {
        await tx.company.update({
          where: { Id: companyId },
          data: { Name: name.trim() },
        });
      }

      // 2. Update Profile
      await tx.companyProfile.update({
        where: { CompanyId: companyId },
        data: {
          LogoUrl: logoUrl !== undefined ? logoUrl : undefined,
          CoverImageUrl: coverImageUrl !== undefined ? coverImageUrl : undefined,
          Website: website !== undefined ? website : undefined,
          LinkedInUrl: linkedInUrl !== undefined ? linkedInUrl : undefined,
          Industry: industry || undefined,
          CompanyType: companyType || undefined,
          CompanySize: companySize || undefined,
          FoundedYear: foundedYear ? parseInt(foundedYear, 10) : undefined,
          Description: description !== undefined ? description : undefined,
          Mission: mission !== undefined ? mission : undefined,
          Vision: vision !== undefined ? vision : undefined,
          WorkCulture: workCulture !== undefined ? workCulture : undefined,
          Benefits: benefits !== undefined ? benefits : undefined,
          Awards: awards !== undefined ? awards : undefined,
          Achievements: achievements !== undefined ? achievements : undefined,
          RecruitmentProcess: recruitmentProcess !== undefined ? recruitmentProcess : undefined,
          InternshipAvailable: internshipAvailable !== undefined ? !!internshipAvailable : undefined,
          PlacementAvailable: placementAvailable !== undefined ? !!placementAvailable : undefined,
        },
      });

      // 3. Update locations if specified
      if (headOffice || branchLocations) {
        // Clear old locations
        await tx.companyLocations.deleteMany({
          where: { CompanyId: companyId },
        });

        // Add Head Office
        if (headOffice) {
          await tx.companyLocations.create({
            data: {
              CompanyId: companyId,
              Location: headOffice.trim(),
              IsHeadOffice: true,
              WorkMode: workMode || "OnSite",
            },
          });
        }

        // Add Branches
        if (branchLocations && Array.isArray(branchLocations)) {
          for (const branch of branchLocations) {
            if (branch && branch.trim()) {
              await tx.companyLocations.create({
                data: {
                  CompanyId: companyId,
                  Location: branch.trim(),
                  IsHeadOffice: false,
                  WorkMode: workMode || "OnSite",
                },
              });
            }
          }
        }
      }
    });

    // Audit logs
    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    await prisma.companyAuditLogs.create({
      data: {
        CompanyId: companyId,
        Action: "Profile Updated",
        PerformedByEmail: hrUser.Email,
        Timestamp: new Date(),
        Details: "Company profile details updated.",
        IpAddress: ip,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Company profile updated successfully.",
    });
  } catch (err: any) {
    console.error("PUT Company Profile Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
