"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HelpCircle, Menu, X } from "lucide-react";

export interface HeaderProps {
  papersCount?: number;
  coursesCount?: number;
  showStats?: boolean;
  onOpenHelp?: () => void;
}

export function Header({
  papersCount = 0,
  coursesCount = 0,
  showStats = true,
  onOpenHelp,
}: HeaderProps) {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  const isLinkActive = (href: string) => {
    return pathname === href;
  };

  return (
    <header className="h-16 border-b border-slate-800/80 bg-slate-950 flex items-center justify-between px-4 sm:px-6 shrink-0 z-30 select-none relative">
      {/* Left Side: Logo & Brand */}
      <Link href="/" className="flex items-center gap-2 sm:gap-3.5 group/logo-link">
        <div className="relative group/logo flex items-center justify-center shrink-0">
          {/* Animated yellow glow rings */}
          <div className="absolute inset-0 rounded-full border border-yellow-400/20 scale-120 group-hover/logo-link:scale-135 group-hover/logo-link:border-yellow-400/50 group-hover/logo-link:rotate-180 transition-all duration-700 ease-out pointer-events-none" />
          <div className="absolute inset-0 rounded-full border border-dashed border-amber-400/40 scale-110 group-hover/logo-link:scale-120 group-hover/logo-link:border-amber-400 group-hover/logo-link:rotate-90 transition-all duration-500 ease-out pointer-events-none" />
          
          {/* Logo container with yellow ring */}
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-900 border-2 border-yellow-400/80 flex items-center justify-center overflow-hidden p-1 shadow-md shadow-yellow-500/10 group-hover/logo-link:border-yellow-400 group-hover/logo-link:shadow-yellow-500/30 transition-all duration-300">
            <img 
              src="/logo-mark.png" 
              alt="GenAI Academy & Hub Logo" 
              className="w-full h-full object-contain group-hover/logo-link:scale-110 transition-transform duration-300" 
            />
          </div>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] sm:text-sm font-extrabold tracking-wider bg-gradient-to-r from-violet-400 via-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            GENAI ACADEMY & HUB
          </span>
          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest leading-none hidden sm:block">
            AI-Powered Research Workspace
          </span>
        </div>
      </Link>

      {/* Middle Side: Navigation Links */}
      <div className="hidden md:flex items-center text-sm text-slate-400">
        <nav className="flex items-center gap-6 font-semibold">
          <Link
            href="/"
            className={`transition-colors hover:text-foreground relative py-1 ${
              isLinkActive("/") 
                ? "text-slate-100 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-gradient-to-r after:from-violet-400 after:to-cyan-400" 
                : ""
            }`}
          >
            Home
          </Link>
          <Link
            href="/articles"
            className={`transition-colors hover:text-foreground relative py-1 ${
              isLinkActive("/articles") 
                ? "text-slate-100 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-gradient-to-r after:from-violet-400 after:to-cyan-400" 
                : ""
            }`}
          >
            AI Articles
          </Link>
          <Link
            href="/ppt-maker"
            className={`transition-colors hover:text-foreground relative py-1 ${
              isLinkActive("/ppt-maker") 
                ? "text-slate-100 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-gradient-to-r after:from-violet-400 after:to-cyan-400" 
                : ""
            }`}
          >
            AI PPT Maker
          </Link>
          <Link
            href="/notes"
            className={`transition-colors hover:text-foreground relative py-1 ${
              isLinkActive("/notes") 
                ? "text-slate-100 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-gradient-to-r after:from-violet-400 after:to-cyan-400" 
                : ""
            }`}
          >
            Share Me
          </Link>
          <Link
            href="/about"
            className={`transition-colors hover:text-foreground relative py-1 ${
              isLinkActive("/about") 
                ? "text-slate-100 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-gradient-to-r after:from-violet-400 after:to-cyan-400" 
                : ""
            }`}
          >
            About
          </Link>
          <Link
            href="/contact"
            className={`transition-colors hover:text-foreground relative py-1 ${
              isLinkActive("/contact") 
                ? "text-slate-100 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-gradient-to-r after:from-violet-400 after:to-cyan-400" 
                : ""
            }`}
          >
            Contact
          </Link>
        </nav>
      </div>

      {/* Right Side: Help and Mobile Nav Toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenHelp || (() => setIsGuideOpen(true))}
          className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 flex items-center justify-center border border-slate-800 transition-colors cursor-pointer shrink-0"
          title="Quick User Guide"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* Hamburger Menu Button */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="md:hidden w-8 h-8 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 flex items-center justify-center border border-slate-800 transition-colors cursor-pointer shrink-0 relative z-50"
          title="Toggle Navigation Menu"
        >
          {isMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </div>

      {/* Mobile Dropdown Menu Drawer */}
      {isMenuOpen && (
        <>
          {/* Backdrop overlay */}
          <div 
            className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden" 
            onClick={() => setIsMenuOpen(false)}
          />
          <div className="absolute top-16 left-0 right-0 bg-slate-950/95 border-b border-slate-800/85 p-5 z-40 md:hidden flex flex-col gap-4 shadow-2xl animate-in slide-in-from-top-3 duration-200 backdrop-blur-md">
            <nav className="flex flex-col gap-3.5">
              <Link 
                href="/" 
                onClick={() => setIsMenuOpen(false)}
                className={`text-sm font-semibold py-2 px-3 rounded-lg transition-colors hover:bg-slate-900 ${
                  isLinkActive("/") ? "text-slate-100 bg-slate-900/50" : "text-slate-400 hover:text-foreground"
                }`}
              >
                Home
              </Link>
              <Link 
                href="/articles" 
                onClick={() => setIsMenuOpen(false)}
                className={`text-sm font-semibold py-2 px-3 rounded-lg transition-colors hover:bg-slate-900 ${
                  isLinkActive("/articles") ? "text-slate-100 bg-slate-900/50" : "text-slate-400 hover:text-foreground"
                }`}
              >
                AI Articles
              </Link>
              <Link 
                href="/ppt-maker" 
                onClick={() => setIsMenuOpen(false)}
                className={`text-sm font-semibold py-2 px-3 rounded-lg transition-colors hover:bg-slate-900 ${
                  isLinkActive("/ppt-maker") ? "text-slate-100 bg-slate-900/50" : "text-slate-400 hover:text-foreground"
                }`}
              >
                AI PPT Maker
              </Link>
              <Link 
                href="/notes" 
                onClick={() => setIsMenuOpen(false)}
                className={`text-sm font-semibold py-2 px-3 rounded-lg transition-colors hover:bg-slate-900 ${
                  isLinkActive("/notes") ? "text-slate-100 bg-slate-900/50" : "text-slate-400 hover:text-foreground"
                }`}
              >
                Share Me
              </Link>
              <Link 
                href="/about" 
                onClick={() => setIsMenuOpen(false)}
                className={`text-sm font-semibold py-2 px-3 rounded-lg transition-colors hover:bg-slate-900 ${
                  isLinkActive("/about") ? "text-slate-100 bg-slate-900/50" : "text-slate-400 hover:text-foreground"
                }`}
              >
                About
              </Link>
              <Link 
                href="/contact" 
                onClick={() => setIsMenuOpen(false)}
                className={`text-sm font-semibold py-2 px-3 rounded-lg transition-colors hover:bg-slate-900 ${
                  isLinkActive("/contact") ? "text-slate-100 bg-slate-900/50" : "text-slate-400 hover:text-foreground"
                }`}
              >
                Contact
              </Link>
            </nav>
          </div>
        </>
      )}

      {/* Built-in Workspace Guide Modal */}
      {isGuideOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-200 select-text p-4">
          <div className="relative w-full max-w-md max-h-[85vh] flex flex-col bg-slate-900 border border-slate-800/80 rounded-2xl shadow-2xl shadow-yellow-500/5 text-slate-100 overflow-hidden">
            {/* Glow effect */}
            <div className="absolute -inset-px bg-gradient-to-r from-yellow-500/10 via-amber-500/5 to-cyan-500/10 rounded-2xl blur-sm pointer-events-none -z-10" />
            
            {/* Close Button */}
            <button
              onClick={() => setIsGuideOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-800 cursor-pointer z-10 animate-pulse"
              title="Close Guide"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Scrollable Content Container */}
            <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center border bg-yellow-500/10 text-yellow-400 border-yellow-500/20">
                  <HelpCircle className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-slate-100 tracking-tight mb-2 pr-8">
                    GenAI Academy & Hub Guide
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">
                    Welcome to the ultimate workspace for AI and Machine Learning research. Here is how to navigate and use our key features:
                  </p>
                  
                  <div className="space-y-3 mt-1 text-slate-300 text-xs font-normal">
                    <ul className="space-y-3">
                      <li className="flex gap-2">
                        <span className="text-yellow-400 font-bold shrink-0">1.</span>
                        <span><strong>Research Portal:</strong> Select a paper from the arXiv library sidebar to review it instantly in our layout-aware PDF viewer.</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-yellow-400 font-bold shrink-0">2.</span>
                        <span><strong>AI Slideshow (PPT):</strong> Click <strong className="text-purple-400">Watch PPT</strong> to auto-synthesize and animate slide presentations from papers.</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-yellow-400 font-bold shrink-0">3.</span>
                        <span><strong>System Architecture:</strong> Click <strong className="text-sky-400">View Architecture</strong> to generate dynamic diagram extractions of model architectures.</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-yellow-400 font-bold shrink-0">4.</span>
                        <span><strong>Audio Reader (TTS):</strong> Copy text in the PDF viewer, click <strong className="text-emerald-400">Read Copied Text</strong> to play high-quality AI vocal guides.</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-yellow-400 font-bold shrink-0">5.</span>
                        <span><strong>Compare Mode:</strong> Toggle synchronized side-by-side scrolls to analyze and generate reports for two documents concurrently.</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Footer Actions (Sticky at bottom) */}
            <div className="p-4 px-6 bg-slate-950/40 border-t border-slate-800/50 flex justify-end shrink-0">
              <button
                onClick={() => setIsGuideOpen(false)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-900 bg-yellow-400 hover:bg-yellow-300 shadow-md shadow-yellow-500/10 transition-all hover:scale-105 cursor-pointer"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

