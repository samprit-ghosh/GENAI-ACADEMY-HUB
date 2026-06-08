import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { text, lang } = await request.json();

    if (!text || !lang) {
      return new NextResponse("Missing text or lang", { status: 400 });
    }

    // Google's unofficial TTS endpoint has a ~200 character limit.
    // We chunk the text by words to ensure we never exceed it.
    const chunks: string[] = [];
    let currentChunk = "";
    const words = text.split(/\s+/);
    
    for (const word of words) {
      if (currentChunk.length + word.length + 1 > 200) {
        chunks.push(currentChunk.trim());
        currentChunk = word + " ";
      } else {
        currentChunk += word + " ";
      }
    }
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    // Fetch all audio chunks in parallel to preserve speed, then preserve order
    const chunkPromises = chunks.map(async (chunk, index) => {
      const url = `https://translate.googleapis.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${lang}&q=${encodeURIComponent(chunk)}`;
      const response = await fetch(url);
      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        return { index, buffer: Buffer.from(arrayBuffer) };
      } else {
        console.warn(`Failed to fetch chunk at index ${index}: ${chunk}`);
        return { index, buffer: null };
      }
    });

    const results = await Promise.all(chunkPromises);
    results.sort((a, b) => a.index - b.index);

    const buffers = results
      .filter(r => r.buffer !== null)
      .map(r => r.buffer as Buffer);

    if (buffers.length === 0) {
      return new NextResponse("Failed to generate audio chunks", { status: 500 });
    }

    // Stitch the MP3 buffers perfectly together into a single continuous track
    const finalBuffer = Buffer.concat(buffers);

    return new NextResponse(finalBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=31536000",
      },
    });
  } catch (error) {
    console.error("TTS Generation Error:", error);
    return new NextResponse("Failed to generate audio", { status: 500 });
  }
}
