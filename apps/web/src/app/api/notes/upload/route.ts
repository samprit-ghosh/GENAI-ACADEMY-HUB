import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB limit

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
];

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided in request." },
        { status: 400 }
      );
    }

    // Validate type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `File type ${file.type} is not supported. Only images and PDFs are allowed.` },
        { status: 400 }
      );
    }

    // Validate size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds the 5MB limit.` },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create public/uploads folder if it doesn't exist
    await fs.mkdir(UPLOAD_DIR, { recursive: true });

    // Generate unique name
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const sanitizedOriginal = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filename = `${uniqueSuffix}-${sanitizedOriginal}`;
    const filePath = path.join(UPLOAD_DIR, filename);

    // Write file to disk
    await fs.writeFile(filePath, buffer);

    // Return relative URL for loading in components
    const fileUrl = `/uploads/${filename}`;
    
    // Parse PDF page count if applicable
    let pages = 0;
    if (file.type === "application/pdf") {
      try {
        const text = new TextDecoder("latin1").decode(bytes);
        const pageMatches = text.match(/\/Type\s*\/Page\b/g);
        pages = pageMatches ? pageMatches.length : 0;
        
        if (pages === 0) {
          const countMatches = text.match(/\/Count\s+(\d+)/);
          if (countMatches && countMatches[1]) {
            pages = parseInt(countMatches[1]);
          }
        }
      } catch (e) {
        console.warn("Failed to parse PDF pages count:", e);
      }
    }
    
    return NextResponse.json({
      success: true,
      name: file.name,
      url: fileUrl,
      type: file.type.startsWith("image/") ? "image" : "pdf",
      size: file.size,
      ...(pages > 0 ? { pages } : {}),
    });
  } catch (err: any) {
    console.error("API File Upload Error:", err);
    return NextResponse.json(
      { error: "Failed to upload file due to server error." },
      { status: 500 }
    );
  }
}
