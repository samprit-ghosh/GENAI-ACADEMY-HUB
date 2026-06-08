import { NextResponse } from "next/server";

// This API route proxies PDFs through our own server.
// External sources often block iframe embedding via X-Frame-Options headers,
// so we fetch the PDF server-side and serve it from our domain.

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const paperId = searchParams.get("id");

  if (!paperId) {
    return NextResponse.json({ error: "Missing paper ID" }, { status: 400 });
  }

  // Sanitize the ID to prevent path traversal
  const safeId = paperId.replace(/[^a-zA-Z0-9._\-\/]/g, "");
  const pdfUrl = `https://arxiv.org/pdf/${safeId}`;

  try {
    const response = await fetch(pdfUrl, {
      headers: {
        "User-Agent": "GenAI-Academy-Hub/1.0 (educational-platform)",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch PDF: ${response.status}` },
        { status: response.status }
      );
    }

    const pdfBuffer = await response.arrayBuffer();

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${safeId}.pdf"`,
        "Cache-Control": "public, max-age=86400", // Cache for 24 hours
      },
    });
  } catch (error) {
    console.error("Error proxying PDF:", error);
    return NextResponse.json(
      { error: "Failed to fetch PDF from source server" },
      { status: 500 }
    );
  }
}
