import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file || file.size === 0) {
      return NextResponse.json("No file was uploaded.", { status: 400 });
    }

    const extension = path.extname(file.name).toLowerCase();
    const allowedExtensions = [".pdf", ".jpg", ".jpeg", ".png", ".gif"];

    if (!allowedExtensions.includes(extension)) {
      return NextResponse.json(
        "Invalid file type. Only PDF and images (JPG, PNG, GIF) are allowed.",
        { status: 400 }
      );
    }

    const uploadsFolder = path.join(process.cwd(), "public", "uploads");
    
    // Ensure the folder exists
    await fs.mkdir(uploadsFolder, { recursive: true });

    const uniqueFileName = `${crypto.randomUUID()}_${file.name}`;
    const filePath = path.join(uploadsFolder, uniqueFileName);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    await fs.writeFile(filePath, buffer);

    const origin = request.headers.get("origin") || new URL(request.url).origin;
    const fileUrl = `${origin}/uploads/${uniqueFileName}`;

    return NextResponse.json({ url: fileUrl });
  } catch (err: any) {
    console.error("Upload Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
