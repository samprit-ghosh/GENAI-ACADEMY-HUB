import type { Metadata } from "next";
import PptMakerClient from "./page-client";

export const metadata: Metadata = {
  title: "Free AI PPT Maker - Create Presentations Online - GenAI Academy & Hub",
  description: "Instantly transform complex research papers or custom topics into beautiful, animated slideshow presentations online. Customize templates, layout designs, and download as PPTX files.",
  keywords: [
    "AI PPT maker",
    "online presentation generator",
    "text to slideshow tool",
    "academic paper PPT converter",
    "download PPTX presentations"
  ],
  alternates: {
    canonical: "https://genaia-academy.com/ppt-maker",
  },
  openGraph: {
    title: "Free AI PPT Maker - Create Presentations Online - GenAI Academy & Hub",
    description: "Instantly transform complex research papers or custom topics into beautiful, animated slideshow presentations online. Customize templates, layout designs, and download as PPTX files.",
    url: "https://genaia-academy.com/ppt-maker",
    type: "website",
    siteName: "GenAI Academy & Hub",
  },
};

export default function PptMakerPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Free Online AI PPT Maker",
    "url": "https://genaia-academy.com/ppt-maker",
    "description": "An interactive web application that auto-synthesizes and styles PowerPoint presentation slides from academic research papers or custom text inputs.",
    "applicationCategory": "EducationalApplication",
    "operatingSystem": "All",
    "browserRequirements": "Requires JavaScript. Requires HTML5.",
    "offers": {
      "@type": "Offer",
      "price": "0.00",
      "priceCurrency": "USD"
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PptMakerClient />
    </>
  );
}
