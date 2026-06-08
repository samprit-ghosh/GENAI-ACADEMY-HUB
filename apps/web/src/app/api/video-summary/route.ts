import { NextResponse } from "next/server";
import { YoutubeTranscript } from "youtube-transcript";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json(
      { error: "Missing url parameter" },
      { status: 400 }
    );
  }

  try {
    const transcript = await YoutubeTranscript.fetchTranscript(url);

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
    return NextResponse.json(
      { error: error.message || "Failed to extract transcript" },
      { status: 500 }
    );
  }
}
