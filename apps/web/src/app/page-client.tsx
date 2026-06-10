"use client";

import { useState, useEffect, useCallback } from "react";
import { RadarSidebar } from "@/components/radar-sidebar";
import { DocumentViewer } from "@/components/document-viewer";
import { AudioDeck } from "@/components/audio-deck";
import { ComparisonModal } from "@/components/comparison-modal";
import { PptModal } from "@/components/ppt-modal";
import { ArchitectureModal } from "@/components/architecture-modal";
import { KnowledgeChatbot } from "@/components/knowledge-chatbot";
import { useAudio } from "@/components/audio-provider";
import { Volume2, Download, Loader2, Clipboard, Database, Code2, Presentation, Library, LayoutTemplate, Activity, Settings2, AlertTriangle, Sparkles, Terminal, HelpCircle, X } from "lucide-react";
import type { ResearchPaper, Course } from "@/lib/types";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export type SelectedDocument = {
  kind: "paper";
  paper: ResearchPaper;
} | {
  kind: "course";
  course: Course;
} | null;

interface LogoLoaderProps {
  message?: string;
  small?: boolean;
}

const LogoLoader = ({ message = "Loading...", small = false }: LogoLoaderProps) => (
  <div className={`flex flex-col items-center justify-center w-full animate-in fade-in duration-300 ${small ? "py-4" : "py-12"}`}>
    <div className="relative flex items-center justify-center">
      {/* Outer glowing rings */}
      <div className={`absolute inset-0 rounded-full border border-yellow-400/20 animate-[spin_8s_linear_infinite] pointer-events-none ${small ? "scale-125" : "scale-135"}`} />
      <div className={`absolute inset-0 rounded-full border border-dashed border-indigo-400/40 animate-[spin_4s_linear_infinite_reverse] pointer-events-none ${small ? "scale-110" : "scale-115"}`} />
      <div className="absolute inset-0 rounded-full bg-indigo-500/10 blur-xl scale-75 animate-pulse" />
      
      {/* Logo mark with yellow ring */}
      <div className={`rounded-full bg-slate-900 border-2 border-yellow-400/80 flex items-center justify-center overflow-hidden shadow-md shadow-yellow-500/10 animate-bounce ${small ? "w-8 h-8 p-1" : "w-12 h-12 p-1.5"}`}>
        <img 
          src="/logo-mark.png" 
          alt="Logo" 
          className="w-full h-full object-contain" 
        />
      </div>
    </div>
    {message && (
      <p className={`font-bold text-slate-400 tracking-widest uppercase animate-pulse flex items-center justify-center gap-1.5 ${small ? "mt-3 text-[9px]" : "mt-5 text-[10px] sm:text-xs"}`}>
        <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
        {message}
      </p>
    )}
  </div>
);

export default function Home() {
  const [filter, setFilter] = useState("all");
  const [compareMode, setCompareMode] = useState(false);
  const [leftDoc, setLeftDoc] = useState<SelectedDocument>(null);
  const [rightDoc, setRightDoc] = useState<SelectedDocument>(null);
  const [papers, setPapers] = useState<ResearchPaper[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingPdfText, setLoadingPdfText] = useState(false);
  const [isComparisonModalOpen, setIsComparisonModalOpen] = useState(false);
  const [isPptModalOpen, setIsPptModalOpen] = useState(false);
  const [isArchitectureModalOpen, setIsArchitectureModalOpen] = useState(false);
  const [isPdfLoaded, setIsPdfLoaded] = useState(false);
  const [paperPage, setPaperPage] = useState(0);
  const [hasMorePapers, setHasMorePapers] = useState(true);
  const [isLoadingMorePapers, setIsLoadingMorePapers] = useState(false);
  const { playTTS } = useAudio();
  const [mobileTab, setMobileTab] = useState<"library" | "viewer" | "insights">("library");
  const [isActionsMenuOpen, setIsActionsMenuOpen] = useState(false);
  const [lastReadText, setLastReadText] = useState<string>("");
  const [hasCopiedText, setHasCopiedText] = useState<boolean>(false);
  const [clipboardWarning, setClipboardWarning] = useState<{
    isOpen: boolean;
    type: "empty" | "no-change" | "help";
    textToRead?: string;
  }>({ isOpen: false, type: "empty" });

  const syncClipboardStatus = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.trim().length > 0 && text.trim() !== lastReadText) {
        setHasCopiedText(true);
      } else {
        setHasCopiedText(false);
      }
    } catch (e) {
      // ignore
    }
  }, [lastReadText]);

  useEffect(() => {
    const handleFocus = () => {
      syncClipboardStatus();
    };
    const handleCopy = () => {
      setHasCopiedText(true);
    };
    window.addEventListener("focus", handleFocus);
    window.addEventListener("copy", handleCopy);
    
    // Initial check
    syncClipboardStatus();
    
    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("copy", handleCopy);
    };
  }, [syncClipboardStatus]);

  // Fetch papers from API route
  const fetchPapers = useCallback(async (query?: string, pageNum = 0) => {
    try {
      const url = query
        ? `/api/papers?q=${encodeURIComponent(query)}&page=${pageNum}`
        : `/api/papers?page=${pageNum}`;
      const res = await fetch(url);
      const data = await res.json();
      const newPapers = data.papers || [];

      if (pageNum >= 2) {
        setHasMorePapers(false);
      } else if (newPapers.length < 20) {
        setHasMorePapers(false);
      } else {
        setHasMorePapers(true);
      }

      if (pageNum === 0) {
        setPapers(newPapers);
      } else {
        setPapers((prev) => {
          // Prevent duplicates by checking ids
          const existingIds = new Set(prev.map(p => p.id));
          const uniqueNewPapers = newPapers.filter((p: ResearchPaper) => !existingIds.has(p.id));
          const combined = [...prev, ...uniqueNewPapers];
          
          // Cap at 50 items for optimal performance
          if (combined.length >= 50) {
            return combined.slice(0, 50);
          }
          return combined;
        });
      }
    } catch (err) {
      console.error("Failed to fetch papers:", err);
    }
  }, []);

  // Fetch courses from our API route
  const fetchCourses = useCallback(async (type?: string, query?: string) => {
    try {
      const params = new URLSearchParams();
      if (type && type !== "all") params.set("type", type);
      if (query) params.set("q", query);
      
      // Fetch local matches instantly (Fast path)
      const res = await fetch(`/api/courses?${params.toString()}`);
      const data = await res.json();
      setCourses(data.courses || []);

      // If a search query is active, request AI recommendations in the background
      if (query) {
        params.set("ai", "true");
        fetch(`/api/courses?${params.toString()}`)
          .then((res) => res.json())
          .then((bgData) => {
            if (bgData.courses && bgData.courses.length > 0) {
              setCourses(bgData.courses);
            }
          })
          .catch((err) => console.warn("Background AI courses query failed:", err));
      }
    } catch (err) {
      console.error("Failed to fetch courses:", err);
    }
  }, []);

  const loadMorePapers = useCallback(async () => {
    if (isLoadingMorePapers || !hasMorePapers) return;
    setIsLoadingMorePapers(true);
    const nextPage = paperPage + 1;
    setPaperPage(nextPage);
    await fetchPapers(searchQuery || undefined, nextPage);
    setIsLoadingMorePapers(false);
  }, [isLoadingMorePapers, hasMorePapers, paperPage, fetchPapers, searchQuery]);

  // Initial load
  useEffect(() => {
    async function load() {
      setLoading(true);
      await Promise.all([fetchPapers(), fetchCourses()]);
      setLoading(false);
    }
    load();
  }, [fetchPapers, fetchCourses]);

  // Search handler
  const handleSearch = useCallback(
    async (query: string) => {
      setSearchQuery(query);
      setPaperPage(0);
      setHasMorePapers(true);
      if (query.trim()) {
        fetchPapers(query, 0);
        fetchCourses(undefined, query);
      } else {
        fetchPapers(undefined, 0);
        fetchCourses();
      }
    },
    [fetchPapers, fetchCourses]
  );

  // Filter handler
  useEffect(() => {
    fetchCourses(filter, searchQuery || undefined);
  }, [filter, fetchCourses, searchQuery]);

  // Reset PDF load state and actions menu when changing documents
  useEffect(() => {
    setIsPdfLoaded(false);
    setIsActionsMenuOpen(false);
    setLastReadText("");
    setHasCopiedText(false);
  }, [leftDoc, rightDoc, compareMode]);

  // Capture the initial clipboard text when a new PDF completes loading
  useEffect(() => {
    if (isPdfLoaded) {
      const captureInitialClipboard = async () => {
        try {
          const text = await navigator.clipboard.readText();
          const trimmed = text ? text.trim() : "";
          setLastReadText(trimmed);
          setHasCopiedText(false);
        } catch (e) {
          setLastReadText("");
          setHasCopiedText(false);
        }
      };
      captureInitialClipboard();
    }
  }, [isPdfLoaded]);

  // Close actions menu when window blurs (e.g. user clicks inside the PDF iframe)
  useEffect(() => {
    const handleBlur = () => {
      setIsActionsMenuOpen(false);
      setHasCopiedText(false); // Reset copy button state when user interacts with PDF/iframe
    };
    window.addEventListener("blur", handleBlur);
    return () => window.removeEventListener("blur", handleBlur);
  }, []);

  const handleSelectDocument = async (doc: SelectedDocument) => {
    // Read the clipboard text immediately on this user gesture before loading the PDF
    try {
      const text = await navigator.clipboard.readText();
      const trimmed = text ? text.trim() : "";
      setLastReadText(trimmed);
      setHasCopiedText(false);
    } catch (e) {
      setLastReadText("");
      setHasCopiedText(false);
    }

    if (compareMode) {
      if (!leftDoc) {
        setLeftDoc(doc);
      } else if (!rightDoc) {
        setRightDoc(doc);
      } else {
        setLeftDoc(doc);
        setRightDoc(null);
      }
    } else {
      setLeftDoc(doc);
      setRightDoc(null);
      setMobileTab("viewer");
    }
  };

  // Extract a summary snippet for the AI summary chips from the selected paper
  const activePaper = leftDoc?.kind === "paper" ? leftDoc.paper : null;

  // Read copied text from clipboard (solves iframe security issues)
  const handleReadCopiedText = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const trimmedText = text ? text.trim() : "";
      
      if (!trimmedText) {
        setClipboardWarning({ isOpen: true, type: "empty" });
        return;
      }
      
      // If the clipboard text is the same as the last read text,
      // it means they clicked the button but haven't copied anything new.
      // We warn them using our custom warning box.
      if (trimmedText === lastReadText) {
        setClipboardWarning({ isOpen: true, type: "no-change", textToRead: trimmedText });
        return;
      }
      
      playTTS(trimmedText, "Copied Text");
      setLastReadText(trimmedText);
      setHasCopiedText(false); // Reset until next copy
    } catch (err) {
      console.error("Clipboard access denied or failed", err);
      const pastedText = prompt("⚠️ Clipboard access is restricted. Please paste the text you want to listen to below:");
      if (pastedText && pastedText.trim().length > 0) {
        playTTS(pastedText.trim(), "Pasted Text");
        setLastReadText(pastedText.trim());
        setHasCopiedText(false);
      }
    }
  };

  // Listen Full PDF
  const handleListenFullPdf = async () => {
    if (!activePaper) return;
    setLoadingPdfText(true);
    try {
      const res = await fetch(`/api/pdf-text?id=${encodeURIComponent(activePaper.id)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to extract PDF text");
      if (data.text) {
        playTTS(data.text, `Full PDF: ${activePaper.title}`);
      }
    } catch (err: any) {
      console.error(err);
      alert("Failed to read PDF: " + err.message);
    } finally {
      setLoadingPdfText(false);
    }
  };

  // Download handler
  const handleDownload = async () => {
    if (!activePaper) return;
    try {
      const res = await fetch(`/api/pdf?id=${encodeURIComponent(activePaper.id)}`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const safeTitle = activePaper.title
        .replace(/[^a-z0-9]/gi, "_")
        .toLowerCase()
        .substring(0, 60);
      a.download = `${safeTitle}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-slate-950 text-slate-100 select-none">
        <LogoLoader message="Initializing AI Research Portal..." />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[100dvh] md:h-screen overflow-hidden bg-background">
      <Header
        papersCount={papers.length}
        coursesCount={courses.length}
        onOpenHelp={() => setClipboardWarning({ isOpen: true, type: "help" })}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Knowledge & Media Radar */}
        <div className={`w-full md:w-[320px] lg:w-[400px] border-r border-border shrink-0 flex-col ${mobileTab === 'library' ? 'flex' : 'hidden md:flex'}`}>
        <RadarSidebar
          filter={filter}
          setFilter={setFilter}
          papers={papers}
          courses={courses}
          loading={loading}
          onSearch={handleSearch}
          onSelectDocument={handleSelectDocument}
          selectedDocument={leftDoc}
          compareDocument={rightDoc}
          loadMorePapers={loadMorePapers}
          hasMorePapers={hasMorePapers}
          isLoadingMorePapers={isLoadingMorePapers}
        />
      </div>

      {/* Middle Column: Active Document Viewer */}
      <div className={`flex-1 flex-col relative overflow-hidden ${mobileTab === 'viewer' ? 'flex' : 'hidden md:flex'}`}>
        <div className="h-14 border-b border-border flex items-center justify-between px-3 md:px-4 shrink-0 bg-card/50 backdrop-blur-sm z-10 gap-2 relative">
          {/* Left/Main Side: Title & Status */}
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="font-semibold tracking-tight text-xs sm:text-sm md:text-base truncate">
              {compareMode ? "Compare Documents" : "Active Document"}
            </h1>
            {compareMode && (
              <span className="text-[10px] md:text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full shrink-0">
                {!leftDoc
                  ? "Select 1st"
                  : !rightDoc
                  ? "Select 2nd"
                  : "Synced"}
              </span>
            )}
          </div>

          {/* Right Side Controls */}
          <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
            {/* Desktop View Buttons: Hidden on Mobile */}
            {!compareMode && activePaper && (
              <div className="hidden md:flex items-center gap-2">
                <button
                  onClick={handleReadCopiedText}
                  disabled={!isPdfLoaded}
                  onMouseEnter={syncClipboardStatus}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 ${
                    hasCopiedText
                      ? "text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/20 animate-pulse"
                      : "text-emerald-400/50 bg-emerald-500/5 hover:bg-emerald-500/10 border-emerald-500/10 opacity-60 cursor-pointer"
                  }`}
                  title={
                    !isPdfLoaded
                      ? "Wait for PDF to load..."
                      : hasCopiedText
                      ? "Read copied text aloud"
                      : "Highlight text, press Ctrl+C to copy, then click here to listen"
                  }
                >
                  <Clipboard className="w-3.5 h-3.5" />
                  Read Copied Text
                </button>

                <button
                  onClick={handleListenFullPdf}
                  disabled={loadingPdfText || !isPdfLoaded}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:bg-amber-500/10"
                  title={isPdfLoaded ? "" : "Wait for PDF to load..."}
                >
                  {loadingPdfText ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5" />
                  )}
                  {loadingPdfText ? "Loading..." : "Listen Full PDF"}
                </button>

                <button
                  onClick={handleDownload}
                  disabled={!isPdfLoaded}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-md shadow-cyan-500/20 hover:shadow-cyan-500/40 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:shadow-none"
                  title={isPdfLoaded ? "" : "Wait for PDF to load..."}
                >
                  <Download className="w-3.5 h-3.5" />
                  Download PDF
                </button>
              </div>
            )}

            {/* Mobile Actions Dropdown Trigger Button */}
            {!compareMode && activePaper && (
              <button
                onClick={() => setIsActionsMenuOpen(!isActionsMenuOpen)}
                disabled={!isPdfLoaded}
                className={`flex md:hidden items-center justify-center p-2 rounded-md transition-all border shrink-0 disabled:opacity-40 disabled:cursor-not-allowed ${
                  isActionsMenuOpen 
                    ? "bg-primary text-primary-foreground border-primary" 
                    : "bg-muted/30 text-muted-foreground hover:text-foreground border-border/50"
                }`}
                title={isPdfLoaded ? "Audio & PDF Options" : "Wait for PDF to load..."}
              >
                <Settings2 className="w-4 h-4" />
              </button>
            )}

            {/* Compare Mode controls */}
            {compareMode && leftDoc && rightDoc && (
              <button
                onClick={() => setIsComparisonModalOpen(true)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] md:text-xs font-medium bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white shadow-md shadow-fuchsia-500/20 hover:shadow-fuchsia-500/40 transition-all hover:scale-105"
              >
                <span className="hidden sm:inline">View Comparison Report</span>
                <span className="sm:hidden">Report</span>
              </button>
            )}
            
            {compareMode && (leftDoc || rightDoc) && (
              <button
                onClick={() => {
                  setLeftDoc(null);
                  setRightDoc(null);
                }}
                className="px-2.5 py-1.5 rounded-md text-[11px] md:text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
              >
                Clear
              </button>
            )}
            
            <button
              onClick={() => {
                setCompareMode(!compareMode);
                if (!compareMode) {
                  setRightDoc(null);
                }
              }}
              className={`px-2.5 py-1.5 rounded-md text-xs md:text-sm font-medium transition-all ${
                compareMode
                  ? "bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg shadow-red-500/25 hover:shadow-red-500/40"
                  : "bg-gradient-to-r from-violet-600 to-blue-500 text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-105"
              }`}
            >
              {compareMode ? "✕ Exit Compare" : "⇔ Compare Mode"}
            </button>
          </div>

          {/* Mobile Actions Dropdown Overlay (rendered relative to header bounds) */}
          {!compareMode && activePaper && isActionsMenuOpen && (
            <>
              <div 
                className="fixed inset-0 z-40 bg-black/10 backdrop-blur-[1px]" 
                onClick={() => setIsActionsMenuOpen(false)}
              />
              <div className="absolute right-3 top-[52px] w-56 bg-slate-900 border border-slate-700 rounded-xl p-1.5 shadow-2xl z-50 flex flex-col gap-1 text-left animate-in fade-in slide-in-from-top-2 duration-200 md:hidden">
                <div className="px-2.5 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800 mb-1">
                  Audio & PDF Actions
                </div>
                
                <button
                  onClick={() => {
                    setIsActionsMenuOpen(false);
                    handleReadCopiedText();
                  }}
                  disabled={!isPdfLoaded}
                  onMouseEnter={syncClipboardStatus}
                  className={`flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg text-xs font-medium border transition-all ${
                    hasCopiedText
                      ? "text-emerald-400 hover:bg-emerald-500/10 border-transparent hover:border-emerald-500/20"
                      : "text-emerald-400/50 hover:bg-emerald-500/5 border-transparent opacity-60 cursor-pointer"
                  }`}
                >
                  <Clipboard className="w-3.5 h-3.5 shrink-0" />
                  Read Selected Text
                </button>

                <button
                  onClick={() => {
                    setIsActionsMenuOpen(false);
                    handleListenFullPdf();
                  }}
                  disabled={loadingPdfText || !isPdfLoaded}
                  className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg text-xs font-medium text-amber-400 hover:bg-amber-500/10 border border-transparent hover:border-amber-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {loadingPdfText ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5 shrink-0" />
                  )}
                  {loadingPdfText ? "Loading PDF..." : "Listen Full PDF"}
                </button>

                <button
                  onClick={() => {
                    setIsActionsMenuOpen(false);
                    handleDownload();
                  }}
                  disabled={!isPdfLoaded}
                  className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg text-xs font-medium text-sky-400 hover:bg-sky-500/10 border border-transparent hover:border-sky-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Download className="w-3.5 h-3.5 shrink-0" />
                  Download PDF
                </button>
              </div>
            </>
          )}
        </div>

        <div className="flex-1 overflow-hidden flex">
          <DocumentViewer
            document={leftDoc}
            isLeft={true}
            compareMode={compareMode}
            onOpenPpt={() => setIsPptModalOpen(true)}
            onOpenArchitecture={() => setIsArchitectureModalOpen(true)}
            onPdfLoad={setIsPdfLoaded}
          />
          {compareMode && <div className="w-px bg-border shrink-0" />}
          {compareMode && (
            <DocumentViewer
              document={rightDoc}
              isLeft={false}
              compareMode={compareMode}
            />
          )}
        </div>
      </div>

      {/* Right Column: Audio & Insights / Comparison Results */}
      <div className={`w-full md:w-[320px] border-l border-border shrink-0 bg-card flex-col ${mobileTab === 'insights' ? 'flex' : 'hidden md:flex'}`}>
        <AudioDeck />
        <div className="flex-1 p-5 overflow-y-auto">

          <h3 className="text-sm font-semibold uppercase tracking-wider mb-4 bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
            ✦ AI Summary Chips
          </h3>
          {activePaper ? (
            <div className="space-y-3 pb-8">
                  {/* Paper Title - Violet */}
                  <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500/10 to-violet-600/5 border border-violet-500/20">
                    <span className="text-[10px] font-bold text-violet-400 mb-1.5 block uppercase tracking-widest flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                      Paper Title
                    </span>
                    <p className="text-sm text-foreground/80 font-medium">{activePaper.title}</p>
                  </div>

                  {/* Authors - Blue */}
                  <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/5 border border-blue-500/20">
                    <span className="text-[10px] font-bold text-blue-400 mb-1.5 block uppercase tracking-widest flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                      Authors
                    </span>
                    <p className="text-sm text-foreground/70">
                      {activePaper.authors.slice(0, 5).join(", ")}
                      {activePaper.authors.length > 5 && " et al."}
                    </p>
                  </div>

                  {/* Categories - Emerald */}
                  <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-500/20">
                    <span className="text-[10px] font-bold text-emerald-400 mb-1.5 block uppercase tracking-widest flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      Categories
                    </span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {activePaper.categories.slice(0, 5).map((cat, i) => {
                        const colors = [
                          "bg-violet-500/15 text-violet-300 border-violet-500/20",
                          "bg-blue-500/15 text-blue-300 border-blue-500/20",
                          "bg-emerald-500/15 text-emerald-300 border-emerald-500/20",
                          "bg-amber-500/15 text-amber-300 border-amber-500/20",
                          "bg-pink-500/15 text-pink-300 border-pink-500/20",
                        ];
                        return (
                          <span key={cat} className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${colors[i % colors.length]}`}>{cat}</span>
                        );
                      })}
                    </div>
                  </div>

                  {/* Published - Amber */}
                  <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/20">
                    <span className="text-[10px] font-bold text-amber-400 mb-1.5 block uppercase tracking-widest flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      Published
                    </span>
                    <p className="text-sm text-foreground/70">
                      {new Date(activePaper.publishedDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                    </p>
                  </div>
                  
                  {/* Detailed Summary Section */}
                  <div className="mt-6 pt-4 border-t border-border/50">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-bold bg-gradient-to-r from-rose-400 via-fuchsia-400 to-violet-400 bg-clip-text text-transparent uppercase tracking-wider">
                        Detailed Summary
                      </span>
                      <button
                        onClick={() => playTTS(activePaper.summary, activePaper.title)}
                        className="flex items-center gap-1 text-xs font-medium text-fuchsia-400 hover:text-fuchsia-300 transition-colors bg-fuchsia-500/10 hover:bg-fuchsia-500/20 px-2 py-1 rounded-md border border-fuchsia-500/20"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>Listen</span>
                      </button>
                    </div>

                    {/* Extracted Links Section */}
                    {(() => {
                      const urlRegex = /(https?:\/\/[^\s]+)/g;
                      const rawMatches = activePaper.summary.match(urlRegex) || [];
                      const urls = Array.from(new Set(rawMatches.map(u => u.replace(/[.,;:)]+$/, ''))));
                      
                      const codeUrls = urls.filter(u => u.includes('github') || u.includes('4open.science') || u.includes('gitlab'));
                      const datasetUrls = urls.filter(u => u.includes('huggingface') || u.includes('kaggle') || u.includes('dataset'));

                      if (codeUrls.length === 0 && datasetUrls.length === 0) return null;

                      return (
                        <div className="flex flex-col gap-2 mb-4">
                          {codeUrls.map(url => (
                            <a
                              key={url}
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/20 hover:border-blue-500/40 rounded-lg group transition-all"
                            >
                              <div className="p-1.5 bg-blue-500/20 text-blue-400 rounded-md group-hover:scale-110 transition-transform">
                                <Code2 className="w-4 h-4" />
                              </div>
                              <div className="flex flex-col overflow-hidden">
                                <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Code Repository</span>
                                <span className="text-xs text-muted-foreground truncate">{url.replace(/^https?:\/\//, '')}</span>
                              </div>
                            </a>
                          ))}
                          {datasetUrls.map(url => (
                            <a
                              key={url}
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/20 hover:border-orange-500/40 rounded-lg group transition-all"
                            >
                              <div className="p-1.5 bg-orange-500/20 text-orange-400 rounded-md group-hover:scale-110 transition-transform">
                                <Database className="w-4 h-4" />
                              </div>
                              <div className="flex flex-col overflow-hidden">
                                <span className="text-xs font-bold text-orange-400 uppercase tracking-wider">Dataset</span>
                                <span className="text-xs text-muted-foreground truncate">{url.replace(/^https?:\/\//, '')}</span>
                              </div>
                            </a>
                          ))}
                        </div>
                      );
                    })()}

                    <div className="p-4 rounded-xl bg-gradient-to-br from-fuchsia-500/5 to-violet-500/5 border border-fuchsia-500/10">
                      <p className="text-sm text-foreground/60 leading-relaxed whitespace-pre-wrap break-words">
                        {/* We use a simple regex replacement to make URLs clickable within the text too! */}
                        {activePaper.summary.split(/(https?:\/\/[^\s]+)/g).map((part, i) => {
                          if (part.match(/^https?:\/\//)) {
                            const cleanUrl = part.replace(/[.,;:)]+$/, '');
                            const punctuation = part.slice(cleanUrl.length);
                            return (
                              <span key={i}>
                                <a href={cleanUrl} target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-300 underline underline-offset-2">
                                  {cleanUrl}
                                </a>
                                {punctuation}
                              </span>
                            );
                          }
                          return <span key={i}>{part}</span>;
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500/10 to-violet-600/5 border border-violet-500/20">
                    <span className="text-[10px] font-bold text-violet-400 mb-1 block uppercase tracking-widest flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                      Methodology
                    </span>
                    <p className="text-sm text-muted-foreground">Select a paper to see its details here.</p>
                  </div>
                  <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/5 border border-blue-500/20">
                    <span className="text-[10px] font-bold text-blue-400 mb-1 block uppercase tracking-widest flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                      Key Benchmarks
                    </span>
                    <p className="text-sm text-muted-foreground">Paper metadata, authors, and categories will appear.</p>
                  </div>
                  <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-500/20">
                    <span className="text-[10px] font-bold text-emerald-400 mb-1 block uppercase tracking-widest flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      Abstract Preview
                    </span>
                    <p className="text-sm text-muted-foreground">The full abstract of the selected paper will be shown.</p>
                  </div>
                </div>
              )}

        </div>
      </div>

      {/* Comparison Modal Overlay */}
      {isComparisonModalOpen && leftDoc && rightDoc && (
        <ComparisonModal
          leftDoc={leftDoc}
          rightDoc={rightDoc}
          onClose={() => setIsComparisonModalOpen(false)}
        />
      )}

      {/* PPT Modal Overlay */}
      {isPptModalOpen && activePaper && (
        <PptModal
          document={leftDoc!}
          onClose={() => setIsPptModalOpen(false)}
        />
      )}

      {/* Architecture Modal Overlay */}
      {isArchitectureModalOpen && activePaper && (
        <ArchitectureModal
          document={leftDoc!}
          onClose={() => setIsArchitectureModalOpen(false)}
        />
      )}
      
      {/* Custom Clipboard Warning & Help Modal */}
      {clipboardWarning.isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md max-h-[85vh] flex flex-col bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200 text-slate-100 mx-4 overflow-hidden">
            {/* Close Button in Top-Right */}
            <button
              onClick={() => setClipboardWarning(prev => ({ ...prev, isOpen: false }))}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-800 cursor-pointer z-10"
              title="Close Modal"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
              <div className="flex items-start gap-4">
                <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center border ${
                  clipboardWarning.type === "help"
                    ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                    : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                }`}>
                  {clipboardWarning.type === "help" ? (
                    <HelpCircle className="w-6 h-6" />
                  ) : (
                    <AlertTriangle className="w-6 h-6 animate-pulse" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-slate-100 tracking-tight mb-2 pr-8">
                    {clipboardWarning.type === "empty" 
                      ? "Clipboard is Empty" 
                      : clipboardWarning.type === "no-change"
                      ? "Did you forget to copy?"
                      : "GenAI Academy & Hub Guide"}
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    {clipboardWarning.type === "empty" && 
                      "Your system clipboard is empty. Please select and copy (Ctrl+C / Cmd+C) some text from the PDF before clicking this button."}
                    {clipboardWarning.type === "no-change" && 
                      "It looks like you highlighted text but forgot to copy it. The clipboard still contains the text you listened to previously."}
                  </p>
                  
                  {clipboardWarning.type === "help" && (
                    <div className="space-y-3 mt-1 text-slate-300 text-xs">
                      <p className="text-slate-400">Welcome to your AI research workspace. Here is how to use the key features:</p>
                      <ul className="space-y-2.5">
                        <li className="flex gap-2">
                          <span className="text-indigo-400 font-bold shrink-0">1.</span>
                          <span>Select a <strong>Research Paper</strong> or Course from the library sidebar to load it.</span>
                        </li>
                        <li className="flex gap-2">
                          <span className="text-indigo-400 font-bold shrink-0">2.</span>
                          <span>Click <strong className="text-purple-400">Watch PPT</strong> to view an animated slideshow of the paper.</span>
                        </li>
                        <li className="flex gap-2">
                          <span className="text-indigo-400 font-bold shrink-0">3.</span>
                          <span>Click <strong className="text-sky-400">View Architecture</strong> to generate dynamic system diagrams.</span>
                        </li>
                        <li className="flex gap-2">
                          <span className="text-indigo-400 font-bold shrink-0">4.</span>
                          <span>Highlight text in the PDF, press <strong className="bg-slate-800 px-1.5 py-0.5 rounded text-[10px]">Ctrl+C</strong>, then click <strong className="text-emerald-400">Read Copied Text</strong> to hear an AI audio voiceover.</span>
                        </li>
                        <li className="flex gap-2">
                          <span className="text-indigo-400 font-bold shrink-0">5.</span>
                          <span>Toggle <strong className="text-rose-400">Compare Mode</strong> to analyze two documents side-by-side with synced scrolling.</span>
                        </li>
                      </ul>
                    </div>
                  )}

                  {clipboardWarning.type === "no-change" && clipboardWarning.textToRead && (
                    <div className="mt-3 p-3 bg-slate-950 border border-slate-800/60 rounded-xl max-h-24 overflow-y-auto">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">
                        Current Clipboard content
                      </span>
                      <p className="text-xs text-slate-400 italic">
                        "{clipboardWarning.textToRead.substring(0, 120)}{clipboardWarning.textToRead.length > 120 ? "..." : ""}"
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="p-4 px-6 bg-slate-950/40 border-t border-slate-800/60 flex flex-wrap items-center justify-end gap-3 shrink-0">
              {clipboardWarning.type === "no-change" && (
                <button
                  onClick={() => {
                    if (clipboardWarning.textToRead) {
                      playTTS(clipboardWarning.textToRead, "Copied Text");
                      setLastReadText(clipboardWarning.textToRead);
                      setHasCopiedText(false);
                    }
                    setClipboardWarning(prev => ({ ...prev, isOpen: false }));
                  }}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Read Previous Anyway
                </button>
              )}
              <button
                onClick={() => setClipboardWarning(prev => ({ ...prev, isOpen: false }))}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all hover:scale-105 cursor-pointer shadow-md ${
                  clipboardWarning.type === "help"
                    ? "text-slate-900 bg-indigo-400 hover:bg-indigo-300 shadow-indigo-500/10"
                    : "text-slate-900 bg-amber-400 hover:bg-amber-300 shadow-amber-500/10"
                }`}
              >
                {clipboardWarning.type === "help" ? "Get Started" : "Understood"}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Knowledge Chatbot Overlay */}
      <KnowledgeChatbot activePaper={activePaper} papers={papers} />
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden flex border-t border-border bg-card shrink-0 h-16 pb-safe">
        <button
          onClick={() => setMobileTab("library")}
          className={`flex-1 flex flex-col items-center justify-center gap-1 ${mobileTab === "library" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
        >
          <Library className="w-5 h-5" />
          <span className="text-[10px] font-medium uppercase tracking-wider">Library</span>
        </button>
        <button
          onClick={() => setMobileTab("viewer")}
          className={`flex-1 flex flex-col items-center justify-center gap-1 ${mobileTab === "viewer" ? "text-blue-500" : "text-muted-foreground hover:text-foreground"}`}
        >
          <LayoutTemplate className="w-5 h-5" />
          <span className="text-[10px] font-medium uppercase tracking-wider">Viewer</span>
        </button>
        <button
          onClick={() => setMobileTab("insights")}
          className={`flex-1 flex flex-col items-center justify-center gap-1 ${mobileTab === "insights" ? "text-purple-500" : "text-muted-foreground hover:text-foreground"}`}
        >
          <Activity className="w-5 h-5" />
          <span className="text-[10px] font-medium uppercase tracking-wider">Insights</span>
        </button>
      </div> {/* Correctly closes the Mobile Bottom Navigation container */}
      <Footer />
    </div>
  );
}


