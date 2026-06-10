import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { 
  BookOpen, 
  Volume2, 
  Presentation, 
  ArrowLeftRight, 
  MessageSquare, 
  Award, 
  Sparkles, 
  ArrowRight,
  Code
} from "lucide-react";

export const metadata: Metadata = {
  title: "About Our AI Research Mission - GenAI Academy & Hub",
  description: "Learn about the mission behind the GenAI Academy & Hub. Discover our AI-powered workspace features: layout-aware PDF extractions, RAG chatbot assistance, comparative synchronized analysis, and automated presentation generation.",
  keywords: [
    "About GenAI Academy",
    "AI research workspace mission",
    "academic PDF tools project",
    "RAG engineering",
    "democratizing AI research"
  ],
  alternates: {
    canonical: "https://genaia-academy.com/about",
  },
  openGraph: {
    title: "About Our AI Research Mission - GenAI Academy & Hub",
    description: "Learn about the mission behind the GenAI Academy & Hub. Discover our AI-powered workspace features: layout-aware PDF extractions, RAG chatbot assistance, comparative synchronized analysis, and automated presentation generation.",
    url: "https://genaia-academy.com/about",
    type: "website",
    siteName: "GenAI Academy & Hub",
  },
};

export default function AboutPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "name": "About GenAI Academy & Hub",
    "url": "https://genaia-academy.com/about",
    "description": "Learn about the mission behind GenAI Academy & Hub, which focuses on democratizing ML and deep learning research with layout-aware parsers, voice audio guides, and RAG chatbots.",
    "mainEntity": {
      "@type": "Project",
      "name": "GenAI Academy & Hub",
      "description": "An AI-powered academic workspace designed for research discovery, paper reviews, audio insights, and visual summaries."
    }
  };

  const features = [
    {
      icon: <BookOpen className="w-5 h-5 text-indigo-400" />,
      title: "Research Explorer",
      description: "Browse the latest machine learning and AI research papers fetched directly from arXiv. Filter, search, and manage papers in a clean library interface.",
    },
    {
      icon: <Volume2 className="w-5 h-5 text-emerald-400" />,
      title: "AI Audio Reader",
      description: "Convert selected text or full PDFs to high-quality audio insights. Highlight complex passages, copy them, and let our text-to-speech system read them to you.",
    },
    {
      icon: <Presentation className="w-5 h-5 text-purple-400" />,
      title: "PPT Presentation Generator",
      description: "Transform complex research papers into beautiful, animated slide presentations instantly, providing a quick visual digest of academic insights.",
    },
    {
      icon: <ArrowLeftRight className="w-5 h-5 text-orange-400" />,
      title: "Comparative Analysis",
      description: "Toggle Compare Mode to read two documents side-by-side with synchronized scrolling, and generate an AI-driven comparison report.",
    },
    {
      icon: <MessageSquare className="w-5 h-5 text-cyan-400" />,
      title: "RAG Chatbot Assistant",
      description: "Interact with documents directly using our retrieval-augmented chatbot. Ask questions and get answers cited from context.",
    },
    {
      icon: <Award className="w-5 h-5 text-yellow-400" />,
      title: "Curated Courses",
      description: "Access structured learning paths with handpicked free YouTube courses and advanced paid certifications on ML, NLP, and GenAI.",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500/30 font-sans relative overflow-x-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Dynamic Background Glows */}
      <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[120px] opacity-70 pointer-events-none -z-10" />
      <div className="absolute top-1/3 right-1/4 w-[350px] h-[350px] bg-violet-600/5 rounded-full blur-[120px] opacity-60 pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 left-1/3 w-[450px] h-[450px] bg-cyan-600/5 rounded-full blur-[140px] opacity-60 pointer-events-none -z-10" />

      <Header showStats={false} />

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-10 md:py-16 flex flex-col items-center gap-12 sm:gap-16 md:gap-20">
        
        {/* Hero Banner with animated gradients */}
        <section className="text-center space-y-4 max-w-3xl relative">
          {/* Logo Brand Container */}
          <div className="flex justify-center mb-6">
            <div className="relative flex items-center justify-center select-none">
              {/* Outer decorative rings */}
              <div className="absolute inset-0 rounded-full border border-yellow-400/20 scale-135 animate-[spin_20s_linear_infinite] pointer-events-none" />
              <div className="absolute inset-0 rounded-full border border-dashed border-amber-400/40 scale-115 animate-[spin_10s_linear_infinite_reverse] pointer-events-none" />
              
              {/* Logo block with yellow ring */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-slate-900 border-2 border-yellow-400/80 flex items-center justify-center overflow-hidden p-2 shadow-lg shadow-yellow-500/10 hover:border-yellow-400 hover:shadow-yellow-500/30 transition-all duration-300">
                <img 
                  src="/logo-mark.png" 
                  alt="GenAI Academy & Hub Logo" 
                  className="w-full h-full object-contain" 
                />
              </div>
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] sm:text-xs font-semibold text-indigo-400 select-none backdrop-blur-md mb-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
            <span>Empowering AI Researchers & Learners</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-none bg-gradient-to-r from-violet-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">
            GenAI Academy & Hub
          </h1>
          
          <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-500 mt-1">
            About the Project & Mission
          </p>
          
          <p className="text-xs sm:text-sm md:text-base text-slate-400 leading-relaxed font-normal max-w-2xl mx-auto mt-4">
            GenAI Academy & Hub is a state-of-the-art research workspace designed to make reading, understanding, and summarizing academic literature effortless. By integrating conversational AI, audio generation, and comparative tools, we build a bridge between dense academic material and fast-paced learning workflows.
          </p>
        </section>

        {/* Features Grid */}
        <section className="w-full space-y-6 sm:space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-slate-200">
              Powerful Core Features
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Explore the capabilities available at your fingertips.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {features.map((feature, idx) => (
              <div 
                key={idx} 
                className="p-5 sm:p-6 rounded-2xl bg-slate-900/30 backdrop-blur-sm border border-slate-900/80 hover:border-slate-800 hover:bg-slate-900/50 hover:shadow-lg hover:shadow-indigo-500/[0.02] transition-all duration-300 flex flex-col gap-4 group"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center group-hover:scale-105 transition-transform duration-300 shrink-0">
                  {feature.icon}
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm sm:text-base font-bold text-slate-200 group-hover:text-white transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-normal">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>



        {/* Our Mission section */}
        <section className="w-full rounded-3xl bg-gradient-to-br from-violet-950/20 via-slate-900/5 to-cyan-950/20 border border-indigo-500/10 p-6 sm:p-8 md:p-12 relative overflow-hidden flex flex-col md:flex-row items-center gap-6 md:gap-12">
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/3 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="space-y-4 md:flex-1 w-full text-left">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
              <Code className="w-3.5 h-3.5" /> Built for modern developers & researchers
            </span>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-200 tracking-tight leading-snug">
              Democratizing Artificial Intelligence Research
            </h2>
            <p className="text-xs sm:text-sm md:text-base text-slate-400 leading-relaxed font-normal">
              Staying up-to-date with daily paper releases in Deep Learning and NLP is a massive bottleneck. The GenAI Academy & Hub speeds this up by utilizing dynamic programmatic parsing, layout-aware PDF extractions, customizable audio synthesis guides, and real-time news indexing.
            </p>
          </div>
          
          <div className="w-full md:w-auto shrink-0 grid grid-cols-2 md:flex md:flex-col gap-4">
            <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-900 text-center w-full md:w-32 hover:scale-[1.03] hover:border-slate-800 transition-all duration-300 shadow-md">
              <div className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">20k+</div>
              <div className="text-[9px] text-slate-500 font-extrabold uppercase mt-1 tracking-wider">ArXiv Index</div>
            </div>
            <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-900 text-center w-full md:w-32 hover:scale-[1.03] hover:border-slate-800 transition-all duration-300 shadow-md">
              <div className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">15+</div>
              <div className="text-[9px] text-slate-500 font-extrabold uppercase mt-1 tracking-wider">ML Courses</div>
            </div>
          </div>
        </section>

        {/* CTA Launch Section */}
        <section className="w-full flex flex-col items-center justify-center py-4 text-center">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold bg-indigo-650 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:shadow-indigo-500/35 hover:scale-[1.015] transition-all duration-300 cursor-pointer"
          >
            Launch Dashboard
            <ArrowRight className="w-4 h-4" />
          </Link>
        </section>

      </main>

      <Footer />
    </div>
  );
}
