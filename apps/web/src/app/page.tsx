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
import { Volume2, Download, Loader2, Clipboard, Database, Code2, Presentation, Library, LayoutTemplate, Activity } from "lucide-react";
import type { ResearchPaper, Course } from "@/lib/types";

export type SelectedDocument = {
  kind: "paper";
  paper: ResearchPaper;
} | {
  kind: "course";
  course: Course;
} | null;

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
      const res = await fetch(`/api/courses?${params.toString()}`);
      const data = await res.json();
      setCourses(data.courses || []);
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
        await Promise.all([fetchPapers(query, 0), fetchCourses(undefined, query)]);
      } else {
        await Promise.all([fetchPapers(undefined, 0), fetchCourses()]);
      }
    },
    [fetchPapers, fetchCourses]
  );

  // Filter handler
  useEffect(() => {
    fetchCourses(filter, searchQuery || undefined);
  }, [filter, fetchCourses, searchQuery]);

  // Reset PDF load state when changing documents
  useEffect(() => {
    setIsPdfLoaded(false);
  }, [leftDoc, rightDoc, compareMode]);

  const handleSelectDocument = (doc: SelectedDocument) => {
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
      if (text && text.trim().length > 0) {
        playTTS(text.trim(), "Copied Text");
      } else {
        alert("Your clipboard is empty! Please copy some text from the PDF first (Ctrl+C), then click this button.");
      }
    } catch (err) {
      console.error("Clipboard access denied or failed", err);
      alert("Failed to read clipboard. Please make sure you granted clipboard permissions, or try copying text again.");
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

  return (
    <div className="flex flex-col h-[100dvh] md:h-screen overflow-hidden bg-background">
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
        <div className="h-14 border-b border-border flex items-center justify-between px-4 shrink-0 bg-card/50 backdrop-blur-sm z-10 flex-wrap gap-2 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-3">
            <h1 className="font-semibold tracking-tight">
              {compareMode ? "Compare Documents" : "Active Document"}
            </h1>
            {compareMode && (
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {!leftDoc
                  ? "Select 1st paper →"
                  : !rightDoc
                  ? "Select 2nd paper →"
                  : "Scroll synced ✓"}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Read Copied Text button (Hidden in Compare Mode) */}
            {!compareMode && activePaper && (
              <button
                onClick={handleReadCopiedText}
                disabled={!isPdfLoaded}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:bg-emerald-500/10"
                title={isPdfLoaded ? "Highlight text in the PDF, copy it (Ctrl+C), then click here to listen" : "Wait for PDF to load..."}
              >
                <Clipboard className="w-3.5 h-3.5" />
                Read Copied Text
              </button>
            )}

            {/* Listen Full PDF button (Hidden in Compare Mode) */}
            {!compareMode && activePaper && (
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
            )}

            {/* Download button (Hidden in Compare Mode) */}
            {!compareMode && activePaper && (
              <button
                onClick={handleDownload}
                disabled={!isPdfLoaded}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-md shadow-cyan-500/20 hover:shadow-cyan-500/40 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:shadow-none"
                title={isPdfLoaded ? "" : "Wait for PDF to load..."}
              >
                <Download className="w-3.5 h-3.5" />
                Download PDF
              </button>
            )}
            {/* View Comparison Report button */}
            {compareMode && leftDoc && rightDoc && (
              <button
                onClick={() => setIsComparisonModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white shadow-md shadow-fuchsia-500/20 hover:shadow-fuchsia-500/40 transition-all hover:scale-105"
              >
                View Comparison Report
              </button>
            )}
            
            {compareMode && (leftDoc || rightDoc) && (
              <button
                onClick={() => {
                  setLeftDoc(null);
                  setRightDoc(null);
                }}
                className="px-2.5 py-1.5 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
              >
                Clear Both
              </button>
            )}
            <button
              onClick={() => {
                setCompareMode(!compareMode);
                if (!compareMode) {
                  setRightDoc(null);
                }
              }}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                compareMode
                  ? "bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg shadow-red-500/25 hover:shadow-red-500/40"
                  : "bg-gradient-to-r from-violet-600 to-blue-500 text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-105"
              }`}
            >
              {compareMode ? "✕ Exit Compare" : "⇔ Compare Mode"}
            </button>
          </div>
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
      </div>
    </div>
  );
}


