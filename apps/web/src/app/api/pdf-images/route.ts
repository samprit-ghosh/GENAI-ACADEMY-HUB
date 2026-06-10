import { NextResponse } from "next/server";

// Helper to resolve arXiv relative image sources to absolute URLs
function resolveArxivImageUrl(paperId: string, src: string): string {
  if (src.startsWith("http://") || src.startsWith("https://")) {
    return src;
  }
  if (src.startsWith("data:")) {
    return src;
  }
  if (src.startsWith(paperId)) {
    return `https://arxiv.org/html/${src}`;
  }
  if (src.startsWith("/")) {
    return `https://arxiv.org${src}`;
  }
  return `https://arxiv.org/html/${paperId}/${src}`;
}

const isContentImage = (src: string): boolean => {
  const s = src.toLowerCase();
  if (s.includes("logo") || s.includes("icon") || s.includes("avatar") || s.includes("button")) {
    return false;
  }
  if (s.startsWith("data:")) {
    return false;
  }
  return (
    s.endsWith(".png") ||
    s.endsWith(".jpg") ||
    s.endsWith(".jpeg") ||
    s.endsWith(".gif") ||
    s.endsWith(".svg")
  );
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const paperId = searchParams.get("id");

  if (!paperId) {
    return NextResponse.json({ error: "Missing paper ID" }, { status: 400 });
  }

  // Sanitize the ID
  const safeId = paperId.replace(/[^a-zA-Z0-9._\-\/]/g, "");
  const htmlUrl = `https://arxiv.org/html/${safeId}`;

  try {
    const response = await fetch(htmlUrl, {
      headers: {
        "User-Agent": "GenAI-Academy-Hub/1.0 (educational-platform)",
      },
    });

    if (!response.ok) {
      // If arXiv HTML is not available (404) or failed, return empty images list
      return NextResponse.json({ images: [] }, { status: 200 });
    }

    const html = await response.text();
    
    // Extract image tags
    const imgRegex = /<img[^>]+src=["']([^"']+)["']/g;
    let match;
    const rawImages: string[] = [];
    while ((match = imgRegex.exec(html)) !== null) {
      rawImages.push(match[1]);
    }

    // Filter and resolve URLs
    const resolvedImages = rawImages
      .filter(isContentImage)
      .map((src) => resolveArxivImageUrl(safeId, src));

    // Map resolved URLs to our proxy endpoint
    const proxiedImages = resolvedImages.map(
      (url) => `/api/pdf-image-proxy?url=${encodeURIComponent(url)}`
    );

    // Return unique images up to a reasonable limit (e.g. first 5 images)
    const uniqueImages = Array.from(new Set(proxiedImages)).slice(0, 5);

    return NextResponse.json({ images: uniqueImages }, { status: 200 });
  } catch (error) {
    console.error("Error fetching paper images:", error);
    // Return empty list on network or server error to avoid breaking the client
    return NextResponse.json({ images: [] }, { status: 200 });
  }
}
