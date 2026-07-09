import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { getUserFromRequest } from "@/utils/auth";

function escapeCsvField(field: string): string {
  if (!field) return "";
  if (field.includes(",") || field.includes('"') || field.includes("\n") || field.includes("\r")) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

export async function GET(request: Request) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload || (userPayload.role !== "Admin" && userPayload.role !== "Moderator")) {
      return NextResponse.json("Unauthorized", { status: 401 });
    }

    const users = await prisma.users.findMany({
      include: {
        Profiles: true
      }
    });

    let csv = "Id,RegisterNumber,FullName,Email,Department,Role,IsApproved,SelectedTheme,IsAlumni,GraduationYear,CreatedAt\n";

    for (const u of users) {
      const profile = u.Profiles[0] || null;
      const roleName = u.Role === 2 ? "Admin" : u.Role === 3 ? "Moderator" : "Student";
      
      const id = escapeCsvField(u.Id.toString());
      const regNum = escapeCsvField(u.RegisterNumber);
      const fullName = escapeCsvField(u.FullName);
      const email = escapeCsvField(u.Email);
      const dept = escapeCsvField(u.Department);
      const role = escapeCsvField(roleName);
      const isApproved = profile && profile.IsApproved ? "Yes" : "No";
      const theme = escapeCsvField(profile ? profile.SelectedTheme : "Academic");
      const isAlumni = profile && profile.IsAlumni ? "Yes" : "No";
      const gradYear = profile && profile.GraduationYear !== null ? profile.GraduationYear.toString() : "";
      
      const createdAtDate = new Date(u.CreatedAt);
      const year = createdAtDate.getFullYear();
      const month = String(createdAtDate.getMonth() + 1).padStart(2, "0");
      const day = String(createdAtDate.getDate()).padStart(2, "0");
      const hours = String(createdAtDate.getHours()).padStart(2, "0");
      const minutes = String(createdAtDate.getMinutes()).padStart(2, "0");
      const seconds = String(createdAtDate.getSeconds()).padStart(2, "0");
      const createdAt = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

      csv += `${id},${regNum},${fullName},${email},${dept},${role},${isApproved},${theme},${isAlumni},${gradYear},${createdAt}\n`;
    }

    const bytes = Buffer.from(csv, "utf-8");
    const dateStr = new Date().toISOString().split("T")[0].replace(/-/g, "");
    
    return new Response(bytes, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename=mcc_portfolios_report_${dateStr}.csv`
      }
    });
  } catch (err: any) {
    console.error("GET Export Reports Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
