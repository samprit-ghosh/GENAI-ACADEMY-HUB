"use client";

import { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight, Play, Pause, Presentation, Download } from "lucide-react";
import pptxgen from "pptxgenjs";
import type { SelectedDocument } from "@/app/page";

type PptModalProps = {
  document: SelectedDocument;
  onClose: () => void;
};

export function PptModal({ document, onClose }: PptModalProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Parse slides
  const slides: { title: string; points: string[] }[] = [];

  if (document?.kind === "paper") {
    const p = document.paper;
    
    // Slide 1: Title
    slides.push({
      title: p.title,
      points: [
        `Authors: ${p.authors.slice(0, 3).join(", ")}${p.authors.length > 3 ? " et al." : ""}`,
        `Published: ${new Date(p.publishedDate).toLocaleDateString()}`,
        `Categories: ${p.categories.join(", ")}`
      ]
    });

    // Split summary into sentences and make them concise "points"
    const sentences = p.summary
      .replace(/([.?!])\s*(?=[A-Z])/g, "$1|")
      .split("|")
      .map(s => s.trim().replace(/^(Furthermore|Moreover|However|Finally|In addition),\s*/i, ''))
      .filter(s => s.length > 20)
      .map(s => s.length > 140 ? s.substring(0, 137).trim() + "..." : s);

    // Group sentences into slides (max 2 points per slide for readability)
    for (let i = 0; i < sentences.length; i += 2) {
      slides.push({
        title: "Key Findings",
        points: sentences.slice(i, i + 2)
      });
    }
  }

  const handleNext = () => {
    setCurrentSlide(s => Math.min(slides.length - 1, s + 1));
  };

  const handlePrev = () => {
    setCurrentSlide(s => Math.max(0, s - 1));
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [slides.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-play logic
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      if (currentSlide < slides.length - 1) {
        handleNext();
      } else {
        setIsPlaying(false); // Stop at end
      }
    }, 5000); // 5 seconds per slide
    return () => clearInterval(interval);
  }, [isPlaying, currentSlide, slides.length]);

  const handleDownloadPpt = () => {
    const pptx = new pptxgen();
    pptx.layout = "LAYOUT_16x9";
    
    slides.forEach((slideData, idx) => {
      const slide = pptx.addSlide();
      
      // Clean, professional white background
      slide.background = { fill: "FFFFFF" };
      
      // Add Logo Image and Text in top left
      try {
        slide.addImage({
          path: `${window.location.origin}/logo-mark.png`,
          x: 0.5, y: 0.25, w: 0.35, h: 0.35
        });
        slide.addText("GENAI ACADEMY & HUB", {
          x: 0.95, y: 0.22, w: 4, h: 0.4,
          fontSize: 9, bold: true, color: "94A3B8"
        });
      } catch (e) {
        slide.addText("GENAI ACADEMY & HUB", {
          x: 0.5, y: 0.3, w: 4, h: 0.5,
          fontSize: 10, bold: true, color: "94A3B8"
        });
      }

      // Slide Title
      slide.addText(slideData.title, {
        x: 0.5, y: 1.0, w: "90%", h: 1.5,
        fontSize: 32, bold: true, color: "0F172A",
        align: "center"
      });

      // Bullet Points
      let currentY = 3.0;
      slideData.points.forEach((point) => {
        slide.addText(point, {
          x: 1.0, y: currentY, w: "80%", h: 1.0,
          fontSize: 18, color: "334155",
          bullet: true
        });
        currentY += 1.2;
      });
      
      // Slide Number
      slide.addText(String(idx + 1), {
        x: "90%", y: "90%", w: "10%", h: 0.5,
        fontSize: 12, color: "CBD5E1", align: "right"
      });
    });

    const safeTitle = slides[0]?.title.replace(/[^a-z0-9]/gi, '_').toLowerCase().substring(0, 30) || "presentation";
    pptx.writeFile({ fileName: `${safeTitle}.pptx` });
  };

  if (!document) return null;

  const progress = ((currentSlide + 1) / slides.length) * 100;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-3xl animate-in fade-in duration-500">
      <style>{`
        @keyframes float1 {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        @keyframes float2 {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(-30px, 50px) scale(0.9); }
          66% { transform: translate(20px, -20px) scale(1.1); }
        }
        .animate-float-1 { animation: float1 15s ease-in-out infinite; }
        .animate-float-2 { animation: float2 20s ease-in-out infinite; }
      `}</style>
      
      {/* Header Controls */}
      <div className="absolute top-0 inset-x-0 flex items-center justify-between p-4 md:p-6 z-50">
        <div className="flex items-center gap-2 md:gap-3 text-white/70">
          <Presentation className="w-5 h-5 md:w-6 md:h-6 text-indigo-400 drop-shadow-md shrink-0" />
          <span className="hidden sm:inline text-xs md:text-sm font-bold uppercase tracking-widest drop-shadow-md">Presentation Mode</span>
        </div>
        <div className="flex items-center gap-2 md:gap-4 bg-black/20 backdrop-blur-md p-1.5 rounded-full">
          <button
            onClick={handleDownloadPpt}
            className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-indigo-500 hover:bg-indigo-400 text-white transition-all shadow-md hover:shadow-indigo-500/40 hover:-translate-y-0.5"
            title="Download as PPTX file"
          >
            <Download className="w-3.5 h-3.5 md:w-4 md:h-4" />
            <span className="hidden sm:inline text-xs md:text-sm font-bold">Download PPT</span>
            <span className="sm:hidden text-xs font-bold">PPT</span>
          </button>
          <div className="w-px h-5 md:h-6 bg-white/20" />
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5 md:w-4 md:h-4" /> : <Play className="w-3.5 h-3.5 md:w-4 md:h-4" />}
            <span className="hidden sm:inline text-xs md:text-sm font-medium">{isPlaying ? "Pause" : "Auto-Play"}</span>
          </button>
          <button
            onClick={onClose}
            className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/40 hover:text-white transition-colors"
          >
            <X className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        </div>
      </div>

      {/* Main Slide Content - Realistic Slide Container */}
      <div className="w-full max-w-5xl px-4 md:px-8 pb-32 md:pb-24 pt-20 md:pt-0 flex flex-col items-center justify-center h-[100dvh] md:h-full relative z-10 overflow-hidden">
        <div 
          key={currentSlide} 
          className="w-full h-full md:h-auto min-h-[60vh] md:aspect-video bg-white border border-slate-200 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.4)] overflow-y-auto md:overflow-hidden relative flex flex-col items-center justify-center p-6 sm:p-8 lg:p-14 animate-in slide-in-from-right-16 fade-in duration-700 ease-out fill-mode-forwards"
        >
          {/* Grid pattern background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none opacity-50" />

          {/* Stronger animated slide background accents */}
          <div className="absolute -top-20 -right-20 w-[600px] h-[600px] bg-indigo-300/30 rounded-full blur-[120px] pointer-events-none animate-float-1 hidden md:block" />
          <div className="absolute -bottom-20 -left-20 w-[600px] h-[600px] bg-fuchsia-300/30 rounded-full blur-[120px] pointer-events-none animate-float-2 hidden md:block" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-200/20 rounded-full blur-[150px] pointer-events-none animate-pulse hidden md:block" style={{ animationDuration: '8s' }} />

          {/* Logo Placeholder */}
          <div className="absolute top-4 left-4 sm:top-8 sm:left-10 flex items-center gap-2 sm:gap-3.5 bg-white/90 p-2 rounded-xl border border-slate-100 shadow-sm z-20 hover:border-yellow-400/30 transition-colors group/logo">
            <div className="relative flex items-center justify-center shrink-0">
              {/* Animated yellow glow rings */}
              <div className="absolute -inset-1 rounded-full border border-yellow-400/20 scale-115 group-hover/logo:scale-130 group-hover/logo:border-yellow-400/50 group-hover/logo:rotate-180 transition-all duration-700 ease-out pointer-events-none" />
              <div className="absolute -inset-0.5 rounded-full border border-dashed border-amber-400/40 scale-105 group-hover/logo:scale-115 group-hover/logo:border-amber-400 group-hover/logo:rotate-90 transition-all duration-500 ease-out pointer-events-none" />
              
              {/* Logo container with yellow ring */}
              <div className="w-8 h-8 rounded-full bg-slate-900 border border-yellow-400/80 flex items-center justify-center overflow-hidden p-1 shadow-sm shadow-yellow-500/10 group-hover/logo:border-yellow-400 group-hover/logo:shadow-yellow-500/30 transition-all duration-300">
                <img 
                  src="/logo-mark.png" 
                  alt="GenAI Academy & Hub Logo" 
                  className="w-full h-full object-contain group-hover/logo:scale-110 transition-transform duration-300" 
                />
              </div>
            </div>
            <span className="text-[10px] sm:text-xs font-bold text-slate-600 uppercase tracking-widest hidden xs:inline-block transition-colors group-hover/logo:text-slate-800">GENAI ACADEMY & HUB</span>
          </div>

          <div className="w-full h-full flex flex-col justify-center my-auto pt-10 sm:pt-0 pb-10">
            <h2 className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-900 mb-6 md:mb-8 text-center leading-snug z-10 relative px-2 sm:px-4">
              {slides[currentSlide].title}
            </h2>
            
            <div className="space-y-4 md:space-y-5 flex flex-col justify-center w-full max-w-4xl z-10 relative px-2">
            {slides[currentSlide].points.map((point, idx) => (
              <div 
                key={idx} 
                className="flex items-start gap-3 md:gap-6 text-left w-full animate-in slide-in-from-bottom-8 fade-in duration-700 fill-mode-forwards"
                style={{ animationDelay: `${400 + (idx * 200)}ms` }}
              >
                <div className="shrink-0 w-2 h-2 md:w-3 md:h-3 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 mt-1.5 md:mt-2 shadow-sm" />
                <p className="text-sm sm:text-base md:text-xl lg:text-2xl text-slate-700 leading-relaxed font-normal">
                  {point}
                </p>
              </div>
            ))}
          </div>
          </div>

          {/* Slide Number Bottom Right */}
          <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-8 text-slate-300 font-mono text-base md:text-xl font-bold bg-white/80 p-1 rounded-md backdrop-blur-sm">
            {currentSlide + 1}
          </div>
        </div>
      </div>

      {/* Footer Controls & Progress */}
      <div className="absolute bottom-0 inset-x-0 p-4 pb-6 md:p-8 flex flex-col gap-4 md:gap-6 z-30 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
        <div className="flex items-center justify-center gap-6 md:gap-8">
          <button
            onClick={handlePrev}
            disabled={currentSlide === 0}
            className="w-12 h-12 md:w-14 md:h-14 flex items-center justify-center rounded-full bg-white hover:bg-slate-100 text-slate-900 transition-all disabled:opacity-50 disabled:hover:bg-white disabled:cursor-not-allowed shadow-[0_8px_30px_rgb(0,0,0,0.4)] hover:scale-110 active:scale-95"
          >
            <ChevronLeft className="w-6 h-6 md:w-7 md:h-7 -ml-1" />
          </button>
          
          <span className="text-white font-mono text-sm md:text-lg tabular-nums tracking-widest drop-shadow-md bg-black/60 px-4 py-1.5 rounded-full backdrop-blur-md">
            {String(currentSlide + 1).padStart(2, '0')} <span className="text-white/40">/</span> {String(slides.length).padStart(2, '0')}
          </span>

          <button
            onClick={handleNext}
            disabled={currentSlide === slides.length - 1}
            className="w-12 h-12 md:w-14 md:h-14 flex items-center justify-center rounded-full bg-white hover:bg-slate-100 text-indigo-600 transition-all shadow-[0_8px_30px_rgb(0,0,0,0.4)] disabled:opacity-50 disabled:hover:bg-white disabled:cursor-not-allowed hover:scale-110 active:scale-95"
          >
            <ChevronRight className="w-6 h-6 md:w-7 md:h-7 -mr-1" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1 md:h-1.5 bg-white/20 rounded-full overflow-hidden shadow-[0_0_10px_rgba(0,0,0,0.5)]">
          <div 
            className="h-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

    </div>
  );
}
