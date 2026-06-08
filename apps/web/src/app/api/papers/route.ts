import { NextResponse } from "next/server";
import type { ResearchPaper } from "@/lib/types";

// API categories for AI/ML research
// cs.LG = Machine Learning, cs.CL = Computation & Language (NLP/LLMs),
// cs.AI = Artificial Intelligence, cs.CV = Computer Vision
const PAPER_CATEGORIES = "cat:cs.LG+OR+cat:cs.CL+OR+cat:cs.AI";
const MAX_RESULTS = 20;

function parsePaperXml(xml: string): ResearchPaper[] {
  const entries = xml.match(/<entry>[\s\S]*?<\/entry>/g) || [];

  return entries.map((entry) => {
    // Extract paper ID from the <id> tag
    const idMatch = entry.match(/<id>(.*?)<\/id>/);
    const abstractUrl = idMatch ? idMatch[1].trim() : "";
    const id = abstractUrl.split("/abs/")[1] || abstractUrl;

    // Extract title
    const titleMatch = entry.match(/<title>([\s\S]*?)<\/title>/);
    const title = titleMatch
      ? titleMatch[1].replace(/\s+/g, " ").trim()
      : "Unknown Title";

    // Extract authors
    const authors = [
      ...entry.matchAll(/<author>\s*<name>(.*?)<\/name>\s*<\/author>/g),
    ].map((m) => m[1]);

    // Extract summary/abstract
    const summaryMatch = entry.match(/<summary>([\s\S]*?)<\/summary>/);
    const summary = summaryMatch
      ? summaryMatch[1].replace(/\s+/g, " ").trim()
      : "";

    // Extract PDF link — XML puts title="pdf" AFTER href, so instead of
    // fragile regex, we reliably derive the PDF URL from the abstract URL.
    // Abstract: http://arxiv.org/abs/2606.06494v1 → PDF: https://arxiv.org/pdf/2606.06494v1
    const pdfUrl = abstractUrl
      ? abstractUrl.replace("/abs/", "/pdf/").replace("http://", "https://")
      : "";

    // Extract published date
    const publishedMatch = entry.match(/<published>(.*?)<\/published>/);
    const publishedDate = publishedMatch ? publishedMatch[1] : "";

    // Extract categories
    const categories = [
      ...entry.matchAll(/<category[^>]*term="([^"]*?)"/g),
    ].map((m) => m[1]);

    return {
      id,
      title,
      authors,
      summary,
      pdfUrl,
      abstractUrl,
      publishedDate,
      categories,
    };
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  const category = searchParams.get("cat") || "cs.LG+OR+cat:cs.CL+OR+cat:cs.AI";
  const maxResults = searchParams.get("max") || "20";
  const page = parseInt(searchParams.get("page") || "0", 10);
  const start = page * parseInt(maxResults);

  let apiUrl: string;

  if (query) {
    // Search by keyword
    apiUrl = `http://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(query)}+AND+(cat:cs.LG+OR+cat:cs.CL+OR+cat:cs.AI)&sortBy=relevance&max_results=${maxResults}&start=${start}`;
  } else {
    // Latest papers
    apiUrl = `http://export.arxiv.org/api/query?search_query=cat:${category}&sortBy=submittedDate&sortOrder=descending&max_results=${maxResults}&start=${start}`;
  }

  try {
    const response = await fetch(apiUrl, {
      headers: {
        "User-Agent": "GenAI-Academy-Hub/1.0 (educational-platform)",
      },
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!response.ok) {
      throw new Error(`API returned status ${response.status}`);
    }

    const xmlData = await response.text();
    const papers = parsePaperXml(xmlData);

    return NextResponse.json({ papers, count: papers.length });
  } catch (error) {
    console.error("Error fetching papers:", error);
    return NextResponse.json(
      { error: "Failed to fetch papers", papers: [] },
      { status: 500 }
    );
  }
}
