import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { getUserFromRequest } from "@/utils/auth";
import { logActionAndNotify } from "@/utils/audit";

export async function GET(request: Request) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload) return NextResponse.json("Unauthorized", { status: 401 });
    const userId = parseInt(userPayload.nameid, 10);

    const certs = await prisma.certifications.findMany({
      where: { UserId: userId }
    });

    return NextResponse.json(certs);
  } catch (err: any) {
    console.error("GET Certifications Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload) return NextResponse.json("Unauthorized", { status: 401 });
    const userId = parseInt(userPayload.nameid, 10);

    const body = await request.json();
    const { title, issuer, certificateUrl, issueDate, category } = body;

    const cert = await prisma.certifications.create({
      data: {
        Title: title || "",
        Issuer: issuer || "",
        CertificateUrl: certificateUrl || "",
        IssueDate: issueDate ? new Date(issueDate) : new Date(),
        Category: category || "",
        UserId: userId
      }
    });

    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    await logActionAndNotify(userId, userPayload.email, userPayload.unique_name, "Certificate Uploaded", `Student ${userPayload.unique_name} uploaded certificate: ${title}.`, ip);

    return NextResponse.json(cert);
  } catch (err: any) {
    console.error("POST Certifications Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
