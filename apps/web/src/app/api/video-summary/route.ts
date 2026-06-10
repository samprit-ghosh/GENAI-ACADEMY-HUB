import { NextResponse } from "next/server";
import { YoutubeTranscript } from "youtube-transcript";
import { getYoutubeVideoId } from "@/lib/youtube";
import https from "https";

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
    let transcript = await YoutubeTranscript.fetchTranscript(videoId);

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
    if (checkOnly) {
      return NextResponse.json({ extractable: false });
    }
    return NextResponse.json(
      { error: error.message || "Failed to extract transcript" },
      { status: 500 }
    );
  }
}
