import type { Metadata } from "next";
import ArticlesClient from "./page-client";

export const metadata: Metadata = {
  title: "Latest ML & AI Research Articles - GenAI Academy & Hub",
  description: "Read, summarize, and explore deep-dive AI and Machine Learning research papers directly from arXiv. Dynamically generateHighlights, listen to voice synthesis guides, and study core AI concepts.",
  keywords: [
    "Machine Learning articles",
    "AI paper summarizer",
    "deep learning publications",
    "vocal synthesis guide",
    "arXiv research papers",
    "AI academic notes"
  ],
  alternates: {
    canonical: "https://genaia-academy.com/articles",
  },
  openGraph: {
    title: "Latest ML & AI Research Articles - GenAI Academy & Hub",
    description: "Read, summarize, and explore deep-dive AI and Machine Learning research papers directly from arXiv. Dynamically generate Highlights, listen to voice synthesis guides, and study core AI concepts.",
    url: "https://genaia-academy.com/articles",
    type: "website",
    siteName: "GenAI Academy & Hub",
  },
};

export default function ArticlesPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Latest ML & AI Research Articles",
    "url": "https://genaia-academy.com/articles",
    "description": "Browse and read daily compiled machine learning research publications from arXiv, complete with interactive AI vocal guides and highlights extraction.",
    "provider": {
      "@type": "Organization",
      "name": "GenAI Academy & Hub",
      "url": "https://genaia-academy.com"
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ArticlesClient />
    </>
  );
}
