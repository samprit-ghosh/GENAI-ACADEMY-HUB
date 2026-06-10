import { NextResponse } from "next/server";

// This API route proxies PDFs through our own server.
// External sources often block iframe embedding via X-Frame-Options headers,
// so we fetch the PDF server-side and serve it from our domain.

export async function GET(request: Request) {
  return handlePdfRequest(request);
}

export async function HEAD(request: Request) {
  return handlePdfRequest(request);
}

async function handlePdfRequest(request: Request) {
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

    // Calculate dynamic PDF page count
    let pageCount = 0;
    try {
      const text = new TextDecoder("latin1").decode(pdfBuffer);
      const pageMatches = text.match(/\/Type\s*\/Page\b/g);
      pageCount = pageMatches ? pageMatches.length : 0;
      
      if (pageCount === 0) {
        const countMatches = text.match(/\/Count\s+(\d+)/);
        if (countMatches && countMatches[1]) {
          pageCount = parseInt(countMatches[1]);
        }
      }
    } catch (e) {
      console.warn("Failed to parse PDF pages count:", e);
    }

    const headers = {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${safeId}.pdf"`,
      "Cache-Control": "public, max-age=86400", // Cache for 24 hours
      "X-PDF-Pages": String(pageCount),
    };

    if (request.method === "HEAD") {
      return new NextResponse(null, {
        status: 200,
        headers,
      });
    }

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("Error proxying PDF:", error);
    return NextResponse.json(
      { error: "Failed to fetch PDF from source server" },
      { status: 500 }
    );
  }
}
