import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AudioProvider } from "@/components/audio-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: "%s | GenAI Academy & Hub",
    default: "GenAI Academy & Hub | AI Research, Courses & Insights",
  },
  description: "Explore the latest ML research, courses, and certifications with integrated AI summaries and text-to-speech insights.",
  keywords: ["AI", "Generative AI", "Machine Learning", "Research Papers", "AI Courses", "Text to Speech"],
  authors: [{ name: "GenAI Academy & Hub" }],
  creator: "GenAI Academy & Hub",
  openGraph: {
    title: {
      template: "%s | GenAI Academy & Hub",
      default: "GenAI Academy & Hub | AI Research, Courses & Insights",
    },
    description: "Your ultimate portal for AI research, courses, and insights.",
    siteName: "GenAI Academy & Hub",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: {
      template: "%s | GenAI Academy & Hub",
      default: "GenAI Academy & Hub",
    },
    description: "Your ultimate portal for AI research, courses, and insights.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
      suppressHydrationWarning
    >
      <body 
        className="min-h-full flex flex-col bg-background text-foreground"
        suppressHydrationWarning
      >
        <AudioProvider>
          {children}
        </AudioProvider>
      </body>
    </html>
  );
}
