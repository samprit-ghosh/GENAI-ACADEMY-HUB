import { NextResponse } from "next/server";
import { YoutubeTranscript } from "youtube-transcript";
import { getYoutubeVideoId } from "@/lib/youtube";
import https from "https";
import http from "http";
import { HttpsProxyAgent } from "https-proxy-agent";

// Custom fetch implementation supporting HttpsProxyAgent
function customFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
  redirectCount = 0
): Promise<Response> {
  if (redirectCount > 5) {
    return Promise.reject(new Error("Too many redirects"));
  }
  const proxyUrl = process.env.PROXY_URL;
  const agent = proxyUrl ? new HttpsProxyAgent(proxyUrl) : undefined;

  const urlString = typeof input === "string" 
    ? input 
    : (input instanceof URL 
      ? input.toString() 
      : (input as any).url || "");

  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(urlString);
    const reqOptions: https.RequestOptions = {
      method: init?.method || "GET",
      headers: (init?.headers as any) || {},
      agent: agent,
    };

    const isSecure = parsedUrl.protocol === "https:";
    const requestFn = isSecure ? https.request : http.request;

    const req = requestFn(urlString, reqOptions, (res) => {
      // Handle redirects
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const redirectUrl = new URL(res.headers.location, urlString).toString();
        resolve(customFetch(redirectUrl, init, redirectCount + 1));
        return;
      }

      const chunks: any[] = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => {
        const bodyBuffer = Buffer.concat(chunks);
        const textContent = bodyBuffer.toString("utf8");

        const responseObj = {
          ok: (res.statusCode || 0) >= 200 && (res.statusCode || 0) < 300,
          status: res.statusCode || 200,
          statusText: res.statusMessage || "",
          headers: new Headers(res.headers as any),
          text: async () => textContent,
          json: async () => JSON.parse(textContent),
          clone: () => responseObj,
          body: null,
          bodyUsed: true,
          arrayBuffer: async () => bodyBuffer.buffer.slice(bodyBuffer.byteOffset, bodyBuffer.byteOffset + bodyBuffer.byteLength),
          blob: async () => new Blob([bodyBuffer]),
          formData: async () => new FormData(),
          type: "basic" as ResponseType,
          url: urlString,
          redirected: redirectCount > 0,
        };

        resolve(responseObj as unknown as Response);
      });
    });

    req.on("error", (err) => {
      reject(err);
    });

    if (init?.body) {
      req.write(init.body as any);
    }
    req.end();
  });
}

function translateText(text: string, targetLang = 'en'): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed && parsed[0]) {
            const translated = parsed[0].map((item: any) => item[0]).join('');
            resolve(translated);
          } else {
            reject(new Error("Invalid translate response"));
          }
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function translateTranscript(items: any[]): Promise<any[]> {
  const lines = items.map(item => item.text);
  
  // Group lines into chunks of max 1500 characters
  const chunks: string[][] = [];
  let currentChunk: string[] = [];
  let currentLength = 0;
  
  for (const line of lines) {
    if (currentLength + line.length + 1 > 1500) {
      chunks.push(currentChunk);
      currentChunk = [line];
      currentLength = line.length;
    } else {
      currentChunk.push(line);
      currentLength += line.length + 1;
    }
  }
  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }
  
  // Run all translation requests in parallel
  const promises = chunks.map(chunk => {
    const joined = chunk.join('\n');
    return translateText(joined).then(translatedJoined => {
      const split = translatedJoined.split('\n');
      return chunk.map((orig, i) => split[i] || orig);
    }).catch(e => {
      console.error("Chunk translation failed:", e.message);
      return chunk; // fallback to original lines on error
    });
  });
  
  const results = await Promise.all(promises);
  const translatedLines = ([] as string[]).concat(...results);
  
  return items.map((item, idx) => ({
    ...item,
    text: translatedLines[idx] || item.text
  }));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");
  const checkOnly = searchParams.get("check") === "true";

  if (!url) {
    return NextResponse.json(
      { error: "Missing url parameter" },
      { status: 400 }
    );
  }

  const videoId = getYoutubeVideoId(url);
  if (!videoId) {
    return NextResponse.json(
      checkOnly ? { extractable: false } : { error: "The provided URL is not a direct YouTube video. Transcripts can only be extracted from single videos." },
      { status: checkOnly ? 200 : 400 }
    );
  }

  try {
    const config = process.env.PROXY_URL ? { fetch: customFetch } : undefined;
    let transcript = await YoutubeTranscript.fetchTranscript(videoId, config);

    if (checkOnly) {
      return NextResponse.json({ extractable: Array.isArray(transcript) && transcript.length > 0 });
    }

    // Check if the transcript contains non-English characters and needs translation
    const needsTranslation = transcript.some(item => {
      const cleaned = item.text.replace(/[\x00-\x7F\u2010-\u201F\u2022\u2026\u2122\u00A9\u00AE]/g, "");
      return cleaned.length > 0;
    });

    if (needsTranslation) {
      console.log(`[Translation] Translating transcript for video ${videoId} to English...`);
      transcript = await translateTranscript(transcript);
    }

    // If we had an AI API Key, we would pass the text to an LLM here to generate
    // intelligent semantic topics. Without one, we will use a time-chunking heuristic
    // to group the transcript into "Topics" (every 5 minutes) and "Subtopics" (sentences).
    
    const CHUNK_MS = 5 * 60 * 1000; // 5 minutes
    
    const topics: { title: string; timestamp: number; subtopics: string[] }[] = [];
    
    let currentTopicIndex = -1;
    let currentChunkBoundary = -1;

    for (const item of transcript) {
      if (item.offset >= currentChunkBoundary) {
        currentTopicIndex++;
        currentChunkBoundary += CHUNK_MS;
        
        // Format timestamp as M:SS
        const minutes = Math.floor(item.offset / 60000);
        const seconds = Math.floor((item.offset % 60000) / 1000).toString().padStart(2, '0');
        
        topics.push({
          title: `Segment ${currentTopicIndex + 1} (${minutes}:${seconds})`,
          timestamp: item.offset,
          subtopics: [],
        });
      }
      
      topics[currentTopicIndex].subtopics.push(item.text);
    }

    return NextResponse.json({ topics });
  } catch (error: any) {
    console.error("Error fetching transcript:", error);
    
    // Detect if we are likely blocked by YouTube in production (Vercel)
    const errorStr = (error.message || "").toLowerCase();
    const isRateLimited = errorStr.includes("too many requests") || errorStr.includes("captcha") || errorStr.includes("429");
    const isUnavailable = errorStr.includes("disabled") || errorStr.includes("no transcripts") || errorStr.includes("not available");
    
    // On serverless / Vercel, requests failing with generic errors or blocks are highly likely IP blocks.
    const isVercel = !!(process.env.VERCEL || process.env.LAMBDA_TASK_ROOT || process.env.NETLIFY);
    const probablyBlocked = isVercel && (isRateLimited || !isUnavailable);

    if (checkOnly) {
      return NextResponse.json({
        extractable: false,
        reason: probablyBlocked ? "ip_blocked" : "not_available",
        error: error.message || "Unknown error"
      });
    }
    return NextResponse.json(
      {
        error: error.message || "Failed to extract transcript",
        reason: probablyBlocked ? "ip_blocked" : "not_available"
      },
      { status: 500 }
    );
  }
}
