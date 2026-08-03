import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const uploadType = formData.get("type") as string | null; // "logo" | "cover" | "document"

    if (!file || file.size === 0) {
      return NextResponse.json("No file was uploaded.", { status: 400 });
    }

    const extension = path.extname(file.name).toLowerCase();
    const allowedExtensions = [".pdf", ".jpg", ".jpeg", ".png", ".gif", ".webp"];

    if (!allowedExtensions.includes(extension)) {
      return NextResponse.json(
        "Invalid file type. Only PDF and images (JPG, PNG, GIF, WEBP) are allowed.",
        { status: 400 }
      );
    }

    // Size Validations (Logo <= 2MB, Cover <= 5MB, Document <= 10MB)
    const sizeInMB = file.size / (1024 * 1024);
    if (uploadType === "logo" && sizeInMB > 2) {
      return NextResponse.json("Logo image size must be under 2MB.", { status: 400 });
    } else if (uploadType === "cover" && sizeInMB > 5) {
      return NextResponse.json("Cover image size must be under 5MB.", { status: 400 });
    } else if (sizeInMB > 10) {
      return NextResponse.json("Document size must be under 10MB.", { status: 400 });
    }

    const uploadsFolder = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadsFolder, { recursive: true });

    // Safe File Name Generator (UUID prefix + alphanumeric sanitize)
    const sanitizedBase = path.basename(file.name, extension).replace(/[^a-zA-Z0-9_-]/g, "_");
    const uniqueFileName = `${crypto.randomUUID()}_${sanitizedBase}${extension}`;
    const filePath = path.join(uploadsFolder, uniqueFileName);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    await fs.writeFile(filePath, buffer);

    const origin = request.headers.get("origin") || new URL(request.url).origin;
    const fileUrl = `${origin}/uploads/${uniqueFileName}`;

    return NextResponse.json({ url: fileUrl });
  } catch (err: any) {
    console.error("Company Upload Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
