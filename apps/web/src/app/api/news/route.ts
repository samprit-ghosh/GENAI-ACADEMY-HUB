import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

function getApiKey(): string | undefined {
  return process.env.GEMINI_API_KEY;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "artificial intelligence";
  
  const url = `https://content.guardianapis.com/search?q=${encodeURIComponent(q)}&tag=technology/technology&show-fields=trailText,thumbnail,body&api-key=test`;
  
  try {
    const res = await fetch(url);
    const data = await res.json();
    
    if (data.response?.status === "ok") {
      const mappedResults = (data.response?.results || []).map((art: any) => ({
        article_id: art.id,
        title: art.webTitle,
        link: art.webUrl,
        description: art.fields?.trailText || "",
        content: art.fields?.body || "",
        pubDate: art.webPublicationDate,
        image_url: art.fields?.thumbnail || null,
        source_name: "The Guardian",
        source_icon: "https://www.theguardian.com/favicon.ico"
      }));
      
      return NextResponse.json({ status: "success", results: mappedResults });
    } else {
      return NextResponse.json({ status: "error", message: data.response?.message || "Guardian API Error" }, { status: 400 });
    }
  } catch (err: any) {
    return NextResponse.json({ status: "error", message: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let title = "";
  let description = "";
  try {
    const body = await request.json();
    title = body.title || "";
    description = body.description || "";
    if (!title) {
      return NextResponse.json({ error: "Missing title" }, { status: 400 });
    }

    const apiKey = getApiKey();
    if (!apiKey) {
      return NextResponse.json({ 
        article: `## ${title}\n\n${description || "No description available."}\n\n*(Gemini API Key missing: Could not generate deep-dive AI article)*` 
      });
    }

    const ai = new GoogleGenAI({ apiKey });
    const prompt = `You are a Senior Technology Journalist and AI Expert.
Write a beautifully formatted, premium educational article explaining the following news event:
Title: ${title}
Context: ${description || "No description provided."}

The article should be:
1. Around 3 paragraphs of deep explanation.
2. Structured with:
   - An engaging introduction outlining what this means.
   - A technical breakdown of the underlying technology or mechanism involved.
   - An impact analysis on what this means for the AI industry, researchers, and society.
3. Formatted in clean Markdown (use ## headings, **bold** text, etc.). Do not include title heading (we already have it).

Write in a professional, authoritative, yet engaging tone. Return ONLY the markdown content.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const markdownText = response?.text || `## ${title}\n\n${description || ""}\n\n*(Could not generate details)*`;
    return NextResponse.json({ article: markdownText });
  } catch (err: any) {
    console.error("AI Article Generation Error:", err);
    const is503 = err.message?.includes("503") || err.status === 503;
    const errorNotice = is503
      ? "*(Gemini API is currently experiencing high demand. Below is the original summary context.)*"
      : `*(Gemini synthesis unavailable: ${err.message})*`;

    return NextResponse.json({
      article: `## ${title}\n\n${errorNotice}\n\n${description || "No description available."}`
    });
  }
}

