import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { extractAnswer, extractSummary, extractOneLiner } from "@/lib/nlp";
import { getOrIngestPaper, searchRAG } from "@/lib/rag";
import fs from "fs";
import path from "path";

function getApiKey(): string | undefined {
  // 1. Try loading from .env.local dynamically first to ensure we get the latest key
  try {
    const envPaths = [
      path.join(process.cwd(), ".env.local"),
      path.join(process.cwd(), "apps", "web", ".env.local"),
      path.join(process.cwd(), "..", ".env.local")
    ];
    
    for (const p of envPaths) {
      if (fs.existsSync(p)) {
        const content = fs.readFileSync(p, "utf8");
        const match = content.match(/GEMINI_API_KEY\s*=\s*(.*)/);
        if (match && match[1]) {
          const key = match[1].trim().replace(/['"]/g, "");
          if (key) {
            return key;
          }
        }
      }
    }
  } catch (err) {
    console.warn("Could not read API key dynamically from file system:", err);
  }

  // 2. Fall back to process.env
  if (process.env.GEMINI_API_KEY) {
    return process.env.GEMINI_API_KEY;
  }
  
  return undefined;
}

async function stripHtml(html: string): Promise<string> {
  let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");
  text = text.replace(/<[^>]+>/g, " ");
  text = text.replace(/&amp;/g, "&");
  text = text.replace(/&lt;/g, "<");
  text = text.replace(/&gt;/g, ">");
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, "'");
  text = text.replace(/&nbsp;/g, " ");
  text = text.replace(/\s+/g, " ").trim();
  return text;
}

async function fetchPaperText(paperId: string): Promise<string> {
  const safeId = paperId.replace(/[^a-zA-Z0-9._\-\/]/g, "");
  const htmlUrl = `https://arxiv.org/html/${safeId}`;
  
  try {
    const response = await fetch(htmlUrl, {
      headers: { "User-Agent": "GenAI-Academy-Hub/1.0 (educational-platform)" },
    });
    if (response.ok) {
      const html = await response.text();
      const text = await stripHtml(html);
      if (text.length > 100) return text;
    }
  } catch (err) {
    console.warn(`[RAG] HTML fetch failed for ${paperId}, trying abstract fallback:`, err);
  }
  
  const abstractUrl = `https://arxiv.org/abs/${safeId}`;
  try {
    const absResponse = await fetch(abstractUrl, {
      headers: { "User-Agent": "GenAI-Academy-Hub/1.0 (educational-platform)" },
    });
    if (absResponse.ok) {
      const absHtml = await absResponse.text();
      const abstractMatch = absHtml.match(/<blockquote class="abstract[^"]*">([\s\S]*?)<\/blockquote>/i);
      const titleMatch = absHtml.match(/<h1 class="title[^"]*">([\s\S]*?)<\/h1>/i);
      
      const title = titleMatch ? await stripHtml(titleMatch[1]) : "";
      const abstract = abstractMatch ? await stripHtml(abstractMatch[1]) : "";
      return `${title}\n\n${abstract}`.trim();
    }
  } catch (err) {
    console.error(`[RAG] Fallback abstract fetch failed for ${paperId}:`, err);
  }
  
  return "";
}

export async function POST(request: Request) {
  try {
    const { query, paperId, allSummaries } = await request.json();

    if (!query) {
      return NextResponse.json({ error: "Missing query" }, { status: 400 });
    }

    const lowerQuery = query.toLowerCase();
    let responseText = "";
    const apiKey = getApiKey();

    // Intent routing based on keywords
    if (lowerQuery.includes("summarise") || lowerQuery.includes("summary")) {
      let corpus = allSummaries || "";
      if (paperId) {
        corpus = await fetchPaperText(paperId);
      }
      const summary = extractSummary(corpus, 4);
      responseText = `Here is a summary based on the document:\n\n${summary}`;
    } else if (lowerQuery.includes("one liner") || lowerQuery.includes("brief") || lowerQuery.includes("one-liner")) {
      let corpus = allSummaries || "";
      if (paperId) {
        corpus = await fetchPaperText(paperId);
      }
      const oneLiner = extractOneLiner(corpus);
      responseText = `Here is a brief one-liner:\n\n"${oneLiner}"`;
    } else {
      // Regular QA with Vector RAG
      if (apiKey) {
        try {
          let context = "";
          
          if (paperId) {
            const fullText = await fetchPaperText(paperId);
            if (fullText && fullText.length > 50) {
              const chunks = await getOrIngestPaper(paperId, fullText, apiKey);
              context = await searchRAG(query, chunks, apiKey, 4);
            }
          }
          
          // If no active paper context, use allSummaries
          if (!context && allSummaries) {
            context = allSummaries;
          }
          
          if (!context) {
            responseText = "I don't have enough context text to answer your question.";
          } else {
            const ai = new GoogleGenAI({ apiKey });
            const response = await ai.models.generateContent({
              model: "gemini-3.5-flash",
              contents: `Context:\n${context}\n\nQuestion: ${query}\n\nAnswer the question based strictly on the provided context.`
            });
            
            if (response && response.text) {
               responseText = response.text;
            } else {
               // Fallback to Algorithmic QA if Gemini returns empty
               const fallbackText = allSummaries || "";
               const answer = extractAnswer(query, fallbackText, 2);
               responseText = `Gemini is currently busy.\n\nAlgorithmic Fallback: ${answer}`;
            }
          }
        } catch (e: any) {
          console.warn(`[Info] Gemini API unavailable (${e?.status || 'Error'}), gracefully falling back to algorithmic search. Error details:`, e?.message || e);
          const fallbackText = allSummaries || "";
          const answer = extractAnswer(query, fallbackText, 2);
          responseText = `Gemini is currently busy.\n\nAlgorithmic Fallback found this:\n"...${answer}..."`;
        }
      } else {
        // Fallback to algorithmic NLP
        console.warn("[Info] No Gemini API key found, falling back to algorithmic search.");
        const fallbackText = allSummaries || "";
        const answer = extractAnswer(query, fallbackText, 2);
        if (answer.startsWith("I could not") || answer.startsWith("I couldn't")) {
           responseText = answer;
        } else {
           responseText = `Based on the text, I found this:\n\n"...${answer}..."`;
        }
      }
    }

    return NextResponse.json({ reply: responseText });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
