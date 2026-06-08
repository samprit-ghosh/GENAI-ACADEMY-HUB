"use client";

import { useEffect, useRef, useState } from "react";
import { FileText, ExternalLink, Download, ArrowLeftRight, Maximize, Minimize, ListTree, Loader2, ChevronDown, ChevronRight, Volume2, Presentation, BookOpen, Network } from "lucide-react";
import { useAudio } from "@/components/audio-provider";
import { PdfLoader } from "@/components/pdf-loader";
import type { SelectedDocument } from "@/app/page";

type DocumentViewerProps = {
  document: SelectedDocument;
  isLeft: boolean;
  compareMode: boolean;
  onOpenPpt?: () => void;
  onOpenArchitecture?: () => void;
  onPdfLoad?: (loaded: boolean) => void;
};

export function DocumentViewer({
  document: doc,
  isLeft,
  compareMode,
  onOpenPpt,
  onOpenArchitecture,
  onPdfLoad,
}: DocumentViewerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isSyncingRef = useRef(false);
  const { playTrack, playTTS } = useAudio();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // PDF Audio state
  const [loadingPdfText, setLoadingPdfText] = useState(false);
  const [pdfTextError, setPdfTextError] = useState<string | null>(null);
  const [pdfLoaded, setPdfLoaded] = useState(false);

  const fetchAndPlayPdf = async (paperId: string, paperTitle: string) => {
    setLoadingPdfText(true);
    setPdfTextError(null);
    try {
      const res = await fetch(`/api/pdf-text?id=${encodeURIComponent(paperId)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to extract PDF text");
      
      if (data.text) {
        playTTS(data.text, `Full PDF: ${paperTitle}`);
      }
    } catch (err: any) {
      setPdfTextError(err.message);
      console.error(err);
      alert("Failed to read PDF: " + err.message);
    } finally {
      setLoadingPdfText(false);
    }
  };

  // Transcript state
  const [transcriptData, setTranscriptData] = useState<{title: string; timestamp: number; subtopics: string[]}[] | null>(null);
  const [loadingTranscript, setLoadingTranscript] = useState(false);
  const [transcriptError, setTranscriptError] = useState<string | null>(null);
  const [expandedTopics, setExpandedTopics] = useState<Record<number, boolean>>({});

  useEffect(() => {
    // Reset transcript state when document changes
    setTranscriptData(null);
    setTranscriptError(null);
    setExpandedTopics({});
    setPdfLoaded(false);
    onPdfLoad?.(false);
  }, [doc]);

  const fetchTranscript = async (url: string) => {
    setLoadingTranscript(true);
    setTranscriptError(null);
    try {
      const res = await fetch(`/api/video-summary?url=${encodeURIComponent(url)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch transcript");
      setTranscriptData(data.topics);
      // Expand the first topic by default
      if (data.topics && data.topics.length > 0) {
        setExpandedTopics({ 0: true });
      }
    } catch (err: any) {
      setTranscriptError(err.message);
    } finally {
      setLoadingTranscript(false);
    }
  };

  const toggleTopic = (index: number) => {
    setExpandedTopics(prev => ({ ...prev, [index]: !prev[index] }));
  };

  // Synchronized scroll for compare mode
  useEffect(() => {
    if (!compareMode) return;

    const handleSync = (
      e: CustomEvent<{ percentage: number; sourceIsLeft: boolean }>
    ) => {
      if (e.detail.sourceIsLeft === isLeft) return;
      if (scrollRef.current) {
        isSyncingRef.current = true;
        const maxScroll =
          scrollRef.current.scrollHeight - scrollRef.current.clientHeight;
        scrollRef.current.scrollTop = e.detail.percentage * maxScroll;
      }
    };

    window.addEventListener("sync-scroll" as any, handleSync);
    return () => window.removeEventListener("sync-scroll" as any, handleSync);
  }, [compareMode, isLeft]);

  // Listen for fullscreen change events to sync state
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === containerRef.current);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const handleScroll = () => {
    if (!compareMode || !scrollRef.current) return;
    if (isSyncingRef.current) {
      isSyncingRef.current = false;
      return;
    }
    const maxScroll =
      scrollRef.current.scrollHeight - scrollRef.current.clientHeight;
    const percentage =
      maxScroll > 0 ? scrollRef.current.scrollTop / maxScroll : 0;
    window.dispatchEvent(
      new CustomEvent("sync-scroll", {
        detail: { percentage, sourceIsLeft: isLeft },
      })
    );
  };

  // Download handler — fetches from our proxy and triggers a file download
  const handleDownload = async (paperId: string, paperTitle: string) => {
    try {
      const res = await fetch(`/api/pdf?id=${encodeURIComponent(paperId)}`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const safeTitle = paperTitle
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

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  // ─── Empty State (User Guide) ───────────────────────────────────────────────────
  if (!doc) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-card overflow-y-auto">
        <div className="max-w-2xl w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          
          <div className="text-center space-y-3">
            <div className="w-16 h-16 mx-auto bg-gradient-to-tr from-blue-500 to-purple-500 rounded-2xl shadow-xl shadow-purple-500/20 flex items-center justify-center mb-6">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
              Welcome to GenAI Hub
            </h2>
            <p className="text-muted-foreground text-lg">
              Your AI-powered research and learning assistant. Get started with these features:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
            {/* Guide Cards */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-indigo-600/5 border border-indigo-500/20 hover:border-indigo-500/40 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center mb-4">
                <BookOpen className="w-5 h-5 text-indigo-400" />
              </div>
              <h3 className="font-semibold text-indigo-700 dark:text-indigo-300 mb-2">1. Explore Research</h3>
              <p className="text-sm text-indigo-900/70 dark:text-indigo-200/70 leading-relaxed">
                Scroll through the left sidebar to discover the latest AI/ML papers from Arxiv. Click any paper to read the PDF.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 hover:border-purple-500/40 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center mb-4">
                <Presentation className="w-5 h-5 text-purple-400" />
              </div>
              <h3 className="font-semibold text-purple-700 dark:text-purple-300 mb-2">2. Watch PPTs</h3>
              <p className="text-sm text-purple-900/70 dark:text-purple-200/70 leading-relaxed">
                Click the <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-600 dark:text-purple-300 text-[10px] font-bold mx-1"><Presentation className="w-3 h-3"/> Watch PPT</span> button in the top bar to view a beautiful animated presentation of any paper.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 hover:border-emerald-500/40 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center mb-4">
                <Volume2 className="w-5 h-5 text-emerald-400" />
              </div>
              <h3 className="font-semibold text-emerald-700 dark:text-emerald-300 mb-2">3. AI Audio Reader</h3>
              <p className="text-sm text-emerald-900/70 dark:text-emerald-200/70 leading-relaxed">
                Highlight text in the PDF, press Ctrl+C, then click <span className="text-emerald-600 dark:text-emerald-400 font-medium">Read Copied Text</span> to hear an AI read and explain it to you.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20 hover:border-orange-500/40 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center mb-4">
                <ArrowLeftRight className="w-5 h-5 text-orange-400" />
              </div>
              <h3 className="font-semibold text-orange-700 dark:text-orange-300 mb-2">4. Compare Papers</h3>
              <p className="text-sm text-orange-900/70 dark:text-orange-200/70 leading-relaxed">
                Toggle <span className="text-orange-600 dark:text-orange-400 font-medium">Compare Mode</span> to view two papers side-by-side with synchronized scrolling and generate AI comparison reports.
              </p>
            </div>
          </div>

        </div>
      </div>
    );
  }

  // ─── Course View (external link + description) ─────────────────────
  if (doc.kind === "course") {
    const c = doc.course;
    return (
      <div className="flex-1 flex flex-col h-full bg-card overflow-hidden">
        <div className="h-12 border-b border-border/50 flex items-center justify-between px-4 bg-muted/10 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            {compareMode && (
              <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-sm bg-muted text-muted-foreground shrink-0">
                {isLeft ? "LEFT" : "RIGHT"}
              </span>
            )}
            <span className="text-sm font-medium truncate">
              {c.title}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span
              className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-sm ${
                c.type === "free"
                  ? "bg-green-500/20 text-green-500"
                  : "bg-purple-500/20 text-purple-500"
              }`}
            >
              {c.type}
            </span>
            <a
              href={c.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors bg-primary/10 hover:bg-primary/20 px-2.5 py-1 rounded-full"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open on {c.platform}</span>
            </a>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-2xl mx-auto">
            <div className="mb-6">
              <h2 className="text-2xl font-bold tracking-tight mb-2">
                {c.title}
              </h2>
              <p className="text-muted-foreground text-sm">
                by{" "}
                <span className="text-foreground font-medium">
                  {c.creator}
                </span>{" "}
                on {c.platform}
              </p>
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-foreground">Course Description</h3>
                <button
                  onClick={() => playTTS(c.description, c.title)}
                  className="flex items-center space-x-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors bg-primary/10 hover:bg-primary/20 px-2.5 py-1.5 rounded-md"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Listen</span>
                </button>
              </div>
              <div className="p-4 bg-muted/30 rounded-xl border border-border/50">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {c.description}
                </p>
              </div>
            </div>

            {/* Embed YouTube if it's a YouTube course */}
            {c.platform === "YouTube" && c.url.includes("youtu") && (
              <>
                <div className="flex items-start gap-2 p-3 mb-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-600/90 dark:text-yellow-400/90 text-xs">
                  <div className="shrink-0 mt-0.5">ℹ️</div>
                  <p>
                    <strong>Note:</strong> If the video below says "unavailable", it means the creator (like Stanford) has disabled viewing on other websites. Please click the <strong>"Open on YouTube"</strong> button in the top right to watch it!
                  </p>
                </div>
                <div className="aspect-video rounded-xl overflow-hidden border border-border/50 bg-black">
                  <iframe
                    src={(() => {
                      let embed = "";
                      const hasList = c.url.includes("list=");
                      const listId = hasList ? c.url.split("list=")[1].split("&")[0] : null;
                      
                      if (c.url.includes("watch?v=")) {
                        const videoId = c.url.split("v=")[1].split("&")[0];
                        embed = `https://www.youtube.com/embed/${videoId}${listId ? `?list=${listId}` : ""}`;
                      } else if (c.url.includes("youtu.be/")) {
                        const videoId = c.url.split("youtu.be/")[1].split("?")[0];
                        embed = `https://www.youtube.com/embed/${videoId}${listId ? `?list=${listId}` : ""}`;
                      } else if (hasList) {
                        embed = `https://www.youtube.com/embed/videoseries?list=${listId}`;
                      }
                      return embed;
                    })()}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={c.title}
                  />
                </div>
              </>
            )}

            {/* For paid courses, show a CTA */}
            {c.type === "paid" && (
              <a
                href={c.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 w-full flex items-center justify-center gap-2 py-3 px-6 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
              >
                <ExternalLink className="w-4 h-4" />
                Enroll on {c.platform}
              </a>
            )}

            {/* AI Transcript & Topics section */}
            {c.platform === "YouTube" && (
              <div className="mt-8 border-t border-border/50 pt-8">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <ListTree className="w-5 h-5 text-primary" />
                      Video Content & Topics
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Extract structured topics and transcript directly from the video.
                    </p>
                  </div>
                  {!transcriptData && !loadingTranscript && (
                    <button
                      onClick={() => fetchTranscript(c.url)}
                      className="px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary font-medium rounded-lg text-sm transition-colors"
                    >
                      Extract Topics
                    </button>
                  )}
                </div>

                {loadingTranscript && (
                  <div className="flex flex-col items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary mb-2" />
                    <p className="text-sm text-muted-foreground">Extracting and structuring video content...</p>
                  </div>
                )}

                {transcriptError && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm">
                    <strong>Error:</strong> {transcriptError}
                  </div>
                )}

                {transcriptData && (
                  <div className="space-y-3 mt-4">
                    {transcriptData.map((topic, index) => (
                      <div key={index} className="border border-border/50 rounded-xl overflow-hidden bg-card">
                        <button
                          onClick={() => toggleTopic(index)}
                          className="w-full flex items-center justify-between p-4 bg-muted/20 hover:bg-muted/40 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-mono font-medium px-2 py-1 bg-primary/10 text-primary rounded-md">
                              {topic.title.split(' ')[2] /* Extracts the M:SS part */}
                            </span>
                            <span className="font-semibold text-left">{topic.title.split(' (')[0]}</span>
                          </div>
                          {expandedTopics[index] ? (
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          )}
                        </button>
                        
                        {expandedTopics[index] && (
                          <div className="p-4 border-t border-border/50 bg-background/50">
                            <ul className="space-y-2">
                              {topic.subtopics.map((line, lineIdx) => (
                                <li key={lineIdx} className="text-sm text-muted-foreground flex items-start gap-2">
                                  <span className="w-1 h-1 rounded-full bg-primary/40 shrink-0 mt-2"></span>
                                  <span className="leading-relaxed">{line}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ─── Paper View (Embedded PDF) ─────────────────────────────────────
  const paper = doc.paper;


  return (
    <div ref={containerRef} className="flex-1 flex flex-col h-full bg-card overflow-hidden">
      {/* Toolbar */}
      <div className="h-11 border-b border-border/50 flex items-center justify-between px-3 bg-muted/10 shrink-0 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-2 min-w-0 mr-2">
          {compareMode && (
            <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-sm bg-blue-500/20 text-blue-400 shrink-0">
              {isLeft ? "LEFT" : "RIGHT"}
            </span>
          )}
          <span className="text-xs font-medium truncate max-w-[200px]">
            {paper.title}
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {!compareMode && onOpenPpt && (
            <button
              onClick={onOpenPpt}
              disabled={!pdfLoaded}
              className="flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:-translate-y-0 disabled:shadow-none"
              title={pdfLoaded ? "View Animated Presentation" : "Wait for PDF to load..."}
            >
              <Presentation className="w-4 h-4" />
              <span className="hidden sm:inline">Watch PPT</span>
            </button>
          )}
          {!compareMode && onOpenArchitecture && (
            <button
              onClick={onOpenArchitecture}
              disabled={!pdfLoaded}
              className="flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-lg text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all mr-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:-translate-y-0 disabled:shadow-none"
              title={pdfLoaded ? "View Project Architecture Diagram" : "Wait for PDF to load..."}
            >
              <Network className="w-4 h-4 text-indigo-500" />
              <span className="hidden sm:inline">View Architecture</span>
            </button>
          )}
          <button
            onClick={toggleFullscreen}
            disabled={!pdfLoaded}
            className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
            title={isFullscreen ? "Exit Fullscreen" : (pdfLoaded ? "Fullscreen PDF" : "Wait for PDF to load...")}
          >
            {isFullscreen ? (
              <Minimize className="w-3.5 h-3.5" />
            ) : (
              <Maximize className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* PDF Embed */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-hidden relative"
      >
        {paper.id ? (
          <>
            {/* Loading animation while PDF loads */}
            {!pdfLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-card z-10">
                <PdfLoader />
              </div>
            )}
            <iframe
              src={`/api/pdf?id=${encodeURIComponent(paper.id)}${isMobile ? "#scrollbar=0&navpanes=0" : ""}`}
              className="w-full h-full border-0"
              title={paper.title}
              onLoad={() => {
                setPdfLoaded(true);
                onPdfLoad?.(true);
              }}
            />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <FileText className="w-12 h-12 opacity-30 mb-3" />
            <p className="text-sm">No PDF available for this paper.</p>
          </div>
        )}
      </div>
    </div>
  );
}
