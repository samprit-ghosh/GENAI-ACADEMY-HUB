import { NextResponse } from "next/server";

// Source servers often provide HTML versions of papers at https://arxiv.org/html/{id}
// We fetch the HTML and strip tags to get plain text — no external PDF library needed.

async function stripHtml(html: string): Promise<string> {
  // Remove script and style elements entirely
  let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");
  // Remove HTML tags
  text = text.replace(/<[^>]+>/g, " ");
  // Decode common HTML entities
  text = text.replace(/&amp;/g, "&");
  text = text.replace(/&lt;/g, "<");
  text = text.replace(/&gt;/g, ">");
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, "'");
  text = text.replace(/&nbsp;/g, " ");
  // Collapse whitespace
  text = text.replace(/\s+/g, " ").trim();
  return text;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const paperId = searchParams.get("id");

  if (!paperId) {
    return NextResponse.json({ error: "Missing paper ID" }, { status: 400 });
  }

  // Sanitize the ID to prevent path traversal
  const safeId = paperId.replace(/[^a-zA-Z0-9._\-\/]/g, "");

  // Try the HTML version first (available for most recent papers)
  const htmlUrl = `https://arxiv.org/html/${safeId}`;

  try {
    const response = await fetch(htmlUrl, {
      headers: {
        "User-Agent": "GenAI-Academy-Hub/1.0 (educational-platform)",
      },
    });

    if (response.ok) {
      const html = await response.text();
      const text = await stripHtml(html);

      if (text.length > 100) {
        return NextResponse.json({ text }, { status: 200 });
      }
    }

    // Fallback: fetch the abstract page and extract the abstract text
    const abstractUrl = `https://arxiv.org/abs/${safeId}`;
    const absResponse = await fetch(abstractUrl, {
      headers: {
        "User-Agent": "GenAI-Academy-Hub/1.0 (educational-platform)",
      },
    });

    if (!absResponse.ok) {
      return NextResponse.json(
        { error: `Failed to fetch paper: ${absResponse.status}` },
        { status: absResponse.status }
      );
    }

    const absHtml = await absResponse.text();

    // Extract the abstract block specifically
    const abstractMatch = absHtml.match(
      /<blockquote class="abstract[^"]*">([\s\S]*?)<\/blockquote>/i
    );
    const titleMatch = absHtml.match(
      /<h1 class="title[^"]*">([\s\S]*?)<\/h1>/i
    );

    const title = titleMatch ? await stripHtml(titleMatch[1]) : "";
    const abstract = abstractMatch ? await stripHtml(abstractMatch[1]) : "";

    const fallbackText = `${title}\n\n${abstract}`.trim();

    if (fallbackText.length > 10) {
      return NextResponse.json(
        {
          text: fallbackText,
          note: "Full HTML text was not available for this paper. Showing the abstract instead.",
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { error: "Could not extract text from this paper" },
      { status: 404 }
    );
  } catch (error) {
    console.error("Error extracting paper text:", error);
    return NextResponse.json(
      { error: "Failed to fetch text from source server" },
      { status: 500 }
    );
  }
}
