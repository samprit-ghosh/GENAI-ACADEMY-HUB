import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get("url");

  if (!imageUrl) {
    return NextResponse.json({ error: "Missing image URL" }, { status: 400 });
  }

  // Security: Only allow proxying images from arXiv to prevent SSRF
  if (!imageUrl.startsWith("https://arxiv.org/")) {
    return NextResponse.json(
      { error: "Forbidden: URL must be an arXiv domain" },
      { status: 403 }
    );
  }

  try {
    const response = await fetch(imageUrl, {
      headers: {
        "User-Agent": "GenAI-Academy-Hub/1.0 (educational-platform)",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch image from arXiv: ${response.status}` },
        { status: response.status }
      );
    }

    const contentType = response.headers.get("content-type") || "image/png";
    const imageBuffer = await response.arrayBuffer();

    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400", // Cache for 24 hours
      },
    });
  } catch (error) {
    console.error("Error proxying image:", error);
    return NextResponse.json(
      { error: "Failed to fetch image from source server" },
      { status: 500 }
    );
  }
}
