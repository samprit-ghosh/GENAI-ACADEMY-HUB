import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
  title: "GenAI Academy & Hub - AI Research Workspace & Interactive Learning",
  description: "Explore the latest Machine Learning and AI research papers from arXiv. Read, analyze, compare, listen with AI-powered TTS voiceovers, and generate slide presentations instantly.",
  keywords: [
    "Machine Learning research",
    "AI Research Portal",
    "arXiv papers client",
    "text-to-speech PDF reader",
    "RAG research chatbot",
    "AI PPT presentation maker",
    "PDF comparison tool"
  ],
  alternates: {
    canonical: "https://genaia-academy.com/",
  },
  openGraph: {
    title: "GenAI Academy & Hub - AI Research Workspace & Interactive Learning",
    description: "Explore the latest Machine Learning and AI research papers from arXiv. Read, analyze, compare, listen with AI-powered TTS voiceovers, and generate slide presentations instantly.",
    url: "https://genaia-academy.com/",
    type: "website",
    siteName: "GenAI Academy & Hub",
  },
};

export default function HomePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "GenAI Academy & Hub",
    "url": "https://genaia-academy.com/",
    "description": "State-of-the-art research workspace featuring PDF extractions, RAG chatbot assistance, comparative synchronized analysis, and automated presentation generation.",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://genaia-academy.com/?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PageClient />
    </>
  );
}
