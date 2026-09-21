import { NextResponse } from "next/server";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;

    // Direct path traversal mitigation
    const cleanFilename = path.basename(filename);
    if (cleanFilename !== filename) {
      return NextResponse.json("Forbidden", { status: 403 });
    }

    // Dynamic path resolution to prevent Turbopack from crawling and bundling all upload files at build time
    const uploadsDir = [process.cwd(), "public", "uploads"].join(path.sep);
    const filePath = path.resolve(uploadsDir, cleanFilename);

    if (!filePath.startsWith(uploadsDir)) {
      return NextResponse.json("Forbidden", { status: 403 });
    }

    try {
      const fs = await import(/* webpackIgnore: true */ "fs/promises");
      const fileBuffer = await fs.readFile(filePath);

      const ext = path.extname(cleanFilename).toLowerCase();
      let contentType = "application/octet-stream";
      
      if (ext === ".pdf") {
        contentType = "application/pdf";
      } else if (ext === ".jpg" || ext === ".jpeg") {
        contentType = "image/jpeg";
      } else if (ext === ".png") {
        contentType = "image/png";
      } else if (ext === ".gif") {
        contentType = "image/gif";
      }

      return new NextResponse(fileBuffer, {
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    } catch (err) {
      console.error("Serve Uploads Read File Error:", err, "Path:", filePath);
      return NextResponse.json("File not found", { status: 404 });
    }
  } catch (err) {
    console.error("Serve Uploads Error:", err);
    return NextResponse.json("Internal server error", { status: 500 });
  }
}
