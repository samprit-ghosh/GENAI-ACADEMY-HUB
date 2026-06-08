import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";

export interface RAGChunk {
  text: string;
  embedding: number[];
}

/**
 * Splits raw text into chunks of roughly wordCount length with an overlap.
 */
export function chunkText(text: string, chunkSize: number = 250, overlap: number = 40): string[] {
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const chunks: string[] = [];
  
  let i = 0;
  while (i < words.length) {
    const chunkWords = words.slice(i, i + chunkSize);
    chunks.push(chunkWords.join(" "));
    if (words.length <= chunkSize) {
      break;
    }
    i += chunkSize - overlap;
  }
  
  return chunks;
}

/**
 * Helper to resolve the RAG cache directory.
 */
function getCacheDir(): string {
  const cwd = process.cwd();
  let baseDir = cwd;
  // If run from the monorepo root, resolve to apps/web
  if (fs.existsSync(path.join(cwd, "apps", "web"))) {
    baseDir = path.join(cwd, "apps", "web");
  }
  const dir = path.join(baseDir, "data", "rag-cache");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

/**
 * Fetches a single embedding from the Gemini API.
 */
export async function getEmbedding(text: string, apiKey: string): Promise<number[]> {
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.embedContent({
    model: "gemini-embedding-2",
    contents: text,
  });
  if (response && response.embeddings && response.embeddings[0] && response.embeddings[0].values) {
    return response.embeddings[0].values as number[];
  }
  throw new Error("Failed to retrieve embedding values.");
}

/**
 * Fetches embeddings for a batch of texts in small parallel groups.
 */
export async function getEmbeddingsBatch(texts: string[], apiKey: string): Promise<number[][]> {
  const ai = new GoogleGenAI({ apiKey });
  const embeddings: number[][] = [];
  const batchSize = 6; // Keep request sizes manageable and stay under rate limits
  
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const promises = batch.map(async (text) => {
      try {
        const response = await ai.models.embedContent({
          model: "gemini-embedding-2",
          contents: text,
        });
        if (response && response.embeddings && response.embeddings[0] && response.embeddings[0].values) {
          return response.embeddings[0].values as number[];
        }
        return new Array(768).fill(0);
      } catch (err) {
        console.error("Embedding chunk failed, using zero-filled vector fallback:", err);
        return new Array(768).fill(0); // Standard embedding dimension
      }
    });
    
    const results = await Promise.all(promises);
    embeddings.push(...results);
  }
  
  return embeddings;
}

/**
 * Ingests a paper's text, chunks it, embeds it, and caches it locally.
 * If already cached, returns the cached chunks immediately.
 */
export async function getOrIngestPaper(paperId: string, fullText: string, apiKey: string): Promise<RAGChunk[]> {
  const safeId = paperId.replace(/[^a-zA-Z0-9._\-]/g, "");
  const cacheDir = getCacheDir();
  const cachePath = path.join(cacheDir, `${safeId}.json`);
  
  if (fs.existsSync(cachePath)) {
    try {
      const data = fs.readFileSync(cachePath, "utf8");
      return JSON.parse(data) as RAGChunk[];
    } catch (err) {
      console.warn(`Failed to parse cache for ${paperId}, re-ingesting:`, err);
    }
  }
  
  // console.log(`[RAG Brain] Ingesting paper ${paperId} (${fullText.length} characters)...`);
  const chunks = chunkText(fullText, 250, 40);
  
  // Filter out formula-heavy chunks to focus on textual narrative
  const cleanChunks = chunks.filter(chunk => {
    const wordCount = chunk.split(/\s+/).length;
    const hasMath = /[\^{}\\]/.test(chunk) || (chunk.match(/=/g) || []).length > 3;
    return wordCount >= 10 && !hasMath;
  });
  
  const finalChunks = cleanChunks.length > 0 ? cleanChunks : chunks;
  const embeddings = await getEmbeddingsBatch(finalChunks, apiKey);
  
  const ragChunks: RAGChunk[] = finalChunks.map((text, i) => ({
    text,
    embedding: embeddings[i]
  }));
  
  try {
    fs.writeFileSync(cachePath, JSON.stringify(ragChunks), "utf8");
    // console.log(`[RAG Brain] Successfully saved cache for ${paperId} with ${ragChunks.length} chunks.`);
  } catch (err) {
    console.error(`[RAG Brain] Failed to write cache for ${paperId}:`, err);
  }
  
  return ragChunks;
}

/**
 * Helper to compute vector dot product (cosine similarity since embeddings are normalized).
 */
function dotProduct(a: number[], b: number[]): number {
  let sum = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    sum += a[i] * b[i];
  }
  return sum;
}

/**
 * Searches the RAG brain chunks for the top matches relative to the query.
 */
export async function searchRAG(query: string, chunks: RAGChunk[], apiKey: string, topK: number = 4): Promise<string> {
  if (chunks.length === 0) return "";
  
  const queryEmbedding = await getEmbedding(query, apiKey);
  
  const scored = chunks.map(chunk => {
    const score = dotProduct(queryEmbedding, chunk.embedding);
    return { text: chunk.text, score };
  });
  
  // Sort descending by similarity score
  scored.sort((a, b) => b.score - a.score);
  
  // Return the joined top matches
  return scored.slice(0, topK).map(s => s.text).join("\n\n");
}
