import type { Metadata } from "next";
import ContactClient from "./page-client";

export const metadata: Metadata = {
  title: "Contact GenAI Academy & Hub - Support & Inquiries",
  description: "Get in touch with the GenAI Academy & Hub team. Submit feedback, request features, report bugs, or contact support for our AI research workspace.",
  keywords: [
    "Contact GenAI Academy",
    "academic hub support",
    "feature requests",
    "submit feedback AI tool",
    "AI research helpdesk"
  ],
  alternates: {
    canonical: "https://genaia-academy.com/contact",
  },
  openGraph: {
    title: "Contact GenAI Academy & Hub - Support & Inquiries",
    description: "Get in touch with the GenAI Academy & Hub team. Submit feedback, request features, report bugs, or contact support for our AI research workspace.",
    url: "https://genaia-academy.com/contact",
    type: "website",
    siteName: "GenAI Academy & Hub",
  },
};

export default function ContactPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    "name": "Contact GenAI Academy & Hub",
    "url": "https://genaia-academy.com/contact",
    "description": "Contact form and helpdesk access page for users and researchers of the GenAI Academy & Hub portal."
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ContactClient />
    </>
  );
}
