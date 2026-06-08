import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { text, targetLang } = await request.json();

    if (!text || !targetLang) {
      return NextResponse.json(
        { error: "Missing text or targetLang" },
        { status: 400 }
      );
    }

    const res = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(
        text
      )}`
    );
    const data = await res.json();

    if (data && data[0]) {
      const translatedText = data[0].map((item: any) => item[0]).join("");
      return NextResponse.json({ translatedText });
    }

    throw new Error("Invalid response from Google Translate");
  } catch (error: any) {
    console.error("Translation API error:", error);
    return NextResponse.json(
      { error: "Failed to translate text" },
      { status: 500 }
    );
  }
}
