import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { getUserFromRequest } from "@/utils/auth";
import { logActionAndNotify } from "@/utils/audit";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload) return NextResponse.json("Unauthorized", { status: 401 });
    const userId = parseInt(userPayload.nameid, 10);

    const { id: idStr } = await params;
    const id = parseInt(idStr, 10);

    const body = await request.json();
    const { title, issuer, certificateUrl, issueDate, category } = body;

    const cert = await prisma.certifications.findFirst({
      where: { Id: id, UserId: userId }
    });

    if (!cert) {
      return NextResponse.json("Certification not found", { status: 404 });
    }

    const updatedCert = await prisma.certifications.update({
      where: { Id: id },
      data: {
        Title: title || "",
        Issuer: issuer || "",
        CertificateUrl: certificateUrl || "",
        IssueDate: issueDate ? new Date(issueDate) : new Date(),
        Category: category || ""
      }
    });

    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    await logActionAndNotify(userId, userPayload.email, userPayload.unique_name, "Certificate Edited", `Student ${userPayload.unique_name} edited certificate: ${title}.`, ip);

    return NextResponse.json(updatedCert);
  } catch (err: any) {
    console.error("PUT Certification Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload) return NextResponse.json("Unauthorized", { status: 401 });
    const userId = parseInt(userPayload.nameid, 10);

    const { id: idStr } = await params;
    const id = parseInt(idStr, 10);

    const cert = await prisma.certifications.findFirst({
      where: { Id: id, UserId: userId }
    });

    if (!cert) {
      return NextResponse.json("Certification not found", { status: 404 });
    }

    await prisma.certifications.delete({
      where: { Id: id }
    });

    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    await logActionAndNotify(userId, userPayload.email, userPayload.unique_name, "Certificate Deleted", `Student ${userPayload.unique_name} deleted certificate: ${cert.Title}.`, ip);

    return NextResponse.json({ message: "Certificate deleted successfully." });
  } catch (err: any) {
    console.error("DELETE Certification Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
