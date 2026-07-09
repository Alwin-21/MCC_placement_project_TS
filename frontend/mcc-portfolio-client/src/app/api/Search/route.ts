import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = (searchParams.get("query") || "").trim().toLowerCase();

    // Base filters: User must be active, Student (1), and have an approved profile
    const whereClause: any = {
      IsActive: true,
      Role: 1, // Student
      Profiles: {
        some: {
          IsApproved: true
        }
      }
    };

    if (query) {
      whereClause.OR = [
        { FullName: { contains: query, mode: "insensitive" } },
        { Department: { contains: query, mode: "insensitive" } },
        {
          Profiles: {
            some: {
              CurrentLocation: { contains: query, mode: "insensitive" }
            }
          }
        },
        {
          Skills: {
            some: {
              Name: { contains: query, mode: "insensitive" }
            }
          }
        }
      ];
    }

    const students = await prisma.users.findMany({
      where: whereClause,
      include: {
        Profiles: true
      }
    });

    const results = students.map(student => {
      const profile = student.Profiles[0] || null;
      return {
        id: student.Id,
        fullName: student.FullName,
        email: student.Email,
        department: student.Department,
        currentLocation: profile ? profile.CurrentLocation : ""
      };
    });

    return NextResponse.json(results);
  } catch (err: any) {
    console.error("Search Students Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
