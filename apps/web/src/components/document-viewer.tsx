"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { FileText, ExternalLink, Download, ArrowLeftRight, Maximize, Minimize, ListTree, Loader2, ChevronDown, ChevronRight, Volume2, Presentation, BookOpen, Network, Sparkles } from "lucide-react";
import { useAudio } from "@/components/audio-provider";
import { PdfLoader } from "@/components/pdf-loader";
import type { SelectedDocument } from "@/app/page-client";
import { getYoutubeVideoId, getYoutubePlaylistId } from "@/lib/youtube";
import { getSentences, tokenize, removeStopWords } from "@/lib/nlp";

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
  const { playTrack, playTTS, stopTTS, isPlaying, currentTrack } = useAudio();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isNarrowMobile, setIsNarrowMobile] = useState(false);
  const [pdfPagesCount, setPdfPagesCount] = useState<number | null>(null);
  const [videoViewMode, setVideoViewMode] = useState<"topics" | "summary">("topics");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      setIsNarrowMobile(window.innerWidth < 450);
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
  const [isExtractable, setIsExtractable] = useState<boolean | null>(null); // null = checking, true = yes, false = no
  const [extractionReason, setExtractionReason] = useState<"ip_blocked" | "not_available" | null>(null);

  useEffect(() => {
    // Reset transcript state when document changes
    setTranscriptData(null);
    setTranscriptError(null);
    setExpandedTopics({});
    setPdfLoaded(false);
    onPdfLoad?.(false);
    setPdfPagesCount(null);
    setIsExtractable(null);
    setExtractionReason(null);
    setVideoViewMode("topics");
    stopTTS();

    if (doc && doc.kind === "paper" && doc.paper?.id) {
      const fetchPageCount = async () => {
        try {
          const res = await fetch(`/api/pdf?id=${encodeURIComponent(doc.paper.id)}`, {
            method: "HEAD",
          });
          const pages = res.headers.get("X-PDF-Pages");
          if (pages) {
            setPdfPagesCount(parseInt(pages, 10));
          }
        } catch (e) {
          console.error("Error fetching PDF pages count:", e);
        }
      };
      fetchPageCount();
    }

    if (doc && doc.kind === "course" && doc.course && doc.course.platform === "YouTube") {
      const checkExtractable = async () => {
        try {
          const res = await fetch(`/api/video-summary?url=${encodeURIComponent(doc.course.url)}&check=true`);
          const data = await res.json();
          if (data.extractable === true) {
            setIsExtractable(true);
            setExtractionReason(null);
          } else {
            setIsExtractable(false);
            setExtractionReason(data.reason || "not_available");
          }
        } catch (e) {
          console.error("Error checking video extractability:", e);
          setIsExtractable(false);
          setExtractionReason("not_available");
        }
      };
      checkExtractable();
    }
  }, [doc]);

  const fetchTranscript = async (url: string) => {
    setLoadingTranscript(true);
    setTranscriptError(null);
    try {
      const res = await fetch(`/api/video-summary?url=${encodeURIComponent(url)}`);
      const data = await res.json();
      if (!res.ok) {
        let errorMsg = data.error || "Failed to fetch transcript";
        if (data.reason === "ip_blocked") {
          errorMsg = `${errorMsg}. YouTube has blocked requests from Vercel's IP address. Please configure a PROXY_URL in your Vercel Environment Variables.`;
        }
        throw new Error(errorMsg);
      }
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

  const handleDownloadTranscriptPdf = () => {
    if (!transcriptData || !doc || doc.kind !== "course") return;

    const c = doc.course;
    import("jspdf").then(({ jsPDF }) => {
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageHeight = pdf.internal.pageSize.getHeight();
      const pageWidth = pdf.internal.pageSize.getWidth();

      // Style setups
      pdf.setFont("helvetica", "bold");

      // Title
      pdf.setFontSize(16);
      pdf.setTextColor(30, 27, 75); // Dark Indigo

      const title = `Extracted Video Topics: ${c.title}`;
      const titleLines = pdf.splitTextToSize(title, 180);

      let y = 20;
      pdf.text(titleLines, 15, y);
      y += titleLines.length * 7;

      // Meta headers
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9.5);
      pdf.setTextColor(100, 116, 139); // Slate

      pdf.text(`Creator: ${c.creator} | Platform: ${c.platform}`, 15, y);
      y += 5.5;
      pdf.text(`Video Link: ${c.url}`, 15, y);
      y += 8;

      // Decorative line
      pdf.setDrawColor(99, 102, 241); // Indigo line
      pdf.setLineWidth(0.5);
      pdf.line(15, y, 195, y);
      y += 10;

      // Segments
      pdf.setFontSize(10);

      for (const topic of transcriptData) {
        // Section Header (Segment Title)
        const segmentHeader = `${topic.title.split(' (')[0]} [Timestamp: ${topic.title.split(' (')[1]?.replace(')', '') || '0:00'}]`;
        
        // Check height for segment header
        if (y + 15 > pageHeight - 15) {
          pdf.addPage();
          y = 20;
        }

        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(99, 102, 241); // Indigo for segment headers
        pdf.text(segmentHeader, 15, y);
        y += 6;

        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(51, 65, 85); // Slate body color

        // Subtopics/Lines
        for (const line of topic.subtopics) {
          const bulletLine = `• ${line}`;
          const lines = pdf.splitTextToSize(bulletLine, 175);
          const blockHeight = lines.length * 5.5;

          if (y + blockHeight > pageHeight - 15) {
            pdf.addPage();
            y = 20;
          }

          pdf.text(lines, 15, y);
          y += blockHeight + 1.5;
        }

        y += 4.5; // Gap between segments
      }

      // Footers on all pages
      const pageCount = (pdf as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(156, 163, 175);
        pdf.text("GenAI Academy & Hub • AI Research Synthesis Engine", 15, pageHeight - 8);
        pdf.text(`Page ${i} of ${pageCount}`, pageWidth - 30, pageHeight - 8);
      }

      // Save PDF
      const safeTitle = c.title
        .replace(/[^a-z0-9]/gi, "_")
        .toLowerCase()
        .substring(0, 45);
      pdf.save(`segments_${safeTitle}.pdf`);
    });
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
  const summarySentences = useMemo(() => {
    if (!transcriptData) return [];
    
    // Combine all subtopics text
    const rawText = transcriptData.map(t => t.subtopics.join(" ")).join(" ");
    let sentences = getSentences(rawText);
    
    // Fallback to subtitle phrases if we didn't find enough sentences with standard punctuation
    if (sentences.length < 5) {
      sentences = transcriptData.flatMap(t => t.subtopics)
        .map(s => s.trim())
        .filter(s => s.length > 20 && s.split(/\s+/).length >= 5);
    }
    
    if (sentences.length <= 5) {
      return sentences.map(s => /[.!?]$/.test(s) ? s : s + ".");
    }
    
    // Extractive summary scoring
    const allTokens = removeStopWords(tokenize(rawText));
    const wordFreq: Record<string, number> = {};
    for (const word of allTokens) {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    }
    
    const scores = sentences.map(s => {
      const tokens = removeStopWords(tokenize(s));
      let score = 0;
      for (const token of tokens) {
        score += wordFreq[token] || 0;
      }
      return score / (tokens.length || 1);
    });
    
    const rankedIndices = sentences.map((_, i) => i).sort((a, b) => scores[b] - scores[a]);
    const topIndices = rankedIndices.slice(0, 5).sort((a, b) => a - b);
    
    return topIndices.map(i => {
      let s = sentences[i];
      if (s && !/[.!?]$/.test(s)) {
        s += ".";
      }
      return s;
    });
  }, [transcriptData]);

  const summaryText = useMemo(() => summarySentences.join(" "), [summarySentences]);
  const isSummaryTtsPlaying = isPlaying && currentTrack === summaryText;

  const handleToggleSummaryTts = () => {
    if (!doc || doc.kind !== "course") return;
    if (isSummaryTtsPlaying) {
      stopTTS();
    } else {
      playTTS(summaryText, `Summary: ${doc.course.title}`);
    }
  };

  if (!doc) {
    return (
      <div 
        className="flex-1 relative bg-cover bg-center bg-no-repeat overflow-hidden"
        style={{ backgroundImage: "url('/indian-flag-bg.png')" }}
      >
        {/* Dark overlay for premium readability */}
        <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-[0.5px] pointer-events-none" />

        {/* Scrollable content container */}
        <div className="absolute inset-0 overflow-y-auto flex flex-col items-center justify-start p-8 pt-8 sm:pt-12">
          <div className="max-w-2xl w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 relative z-10">
          
          <div className="text-center space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-5 mb-4">
              <div className="relative group/logo flex items-center justify-center shrink-0">
                {/* Animated yellow glow rings */}
                <div className="absolute -inset-2 rounded-full border border-yellow-400/20 scale-115 group-hover/logo:scale-130 group-hover/logo:border-yellow-400/50 group-hover/logo:rotate-180 transition-all duration-700 ease-out pointer-events-none" />
                <div className="absolute -inset-1 rounded-full border border-dashed border-amber-400/40 scale-105 group-hover/logo:scale-115 group-hover/logo:border-amber-400 group-hover/logo:rotate-90 transition-all duration-500 ease-out pointer-events-none" />
                
                {/* Logo container with yellow ring */}
                <div className="w-16 h-16 rounded-full bg-slate-900/95 border-2 border-yellow-400/80 flex items-center justify-center overflow-hidden p-2 shadow-lg shadow-yellow-500/10 group-hover/logo:border-yellow-400 group-hover/logo:shadow-yellow-500/30 transition-all duration-300">
                  <img 
                    src="/logo-mark.png" 
                    alt="GenAI Academy & Hub Logo" 
                    className="w-full h-full object-contain group-hover/logo:scale-110 transition-transform duration-300" 
                  />
                </div>
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)] text-center sm:text-left">
                Welcome to GenAI Academy & Hub
              </h2>
            </div>
            <p className="text-slate-200 text-lg max-w-xl mx-auto drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
              Your AI-powered research and learning assistant. Get started with these features:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
            {/* Guide Cards */}
            <div className="p-5 rounded-2xl bg-slate-950/85 border border-indigo-500/30 hover:border-indigo-400/60 shadow-xl transition-all duration-300 group/card h-full flex flex-col">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center mb-4 transition-transform group-hover/card:scale-110">
                <BookOpen className="w-5 h-5 text-indigo-400" />
              </div>
              <h3 className="font-bold text-indigo-300 mb-2 text-base">1. Explore Research</h3>
              <p className="text-sm text-slate-300 leading-relaxed font-normal flex-1">
                Scroll through the left sidebar to discover the latest AI/ML papers from Arxiv. Click any paper to read the PDF.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-950/85 border border-purple-500/30 hover:border-purple-400/60 shadow-xl transition-all duration-300 group/card h-full flex flex-col">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center mb-4 transition-transform group-hover/card:scale-110">
                <Presentation className="w-5 h-5 text-purple-400" />
              </div>
              <h3 className="font-bold text-purple-300 mb-2 text-base">2. Watch PPTs</h3>
              <p className="text-sm text-slate-300 leading-relaxed font-normal flex-1">
                Click the <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px] font-bold mx-1"><Presentation className="w-3 h-3"/> Watch PPT</span> button in the top bar to view a beautiful animated presentation of any paper.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-950/85 border border-emerald-500/30 hover:border-emerald-400/60 shadow-xl transition-all duration-300 group/card h-full flex flex-col">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center mb-4 transition-transform group-hover/card:scale-110">
                <Volume2 className="w-5 h-5 text-emerald-400" />
              </div>
              <h3 className="font-bold text-emerald-300 mb-2 text-base">3. AI Audio Reader</h3>
              <p className="text-sm text-slate-300 leading-relaxed font-normal flex-1">
                Highlight text in the PDF, press Ctrl+C, then click <span className="text-emerald-400 font-medium">Read Copied Text</span> to hear an AI read and explain it to you.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-950/85 border border-orange-500/30 hover:border-orange-400/60 shadow-xl transition-all duration-300 group/card h-full flex flex-col">
              <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center mb-4 transition-transform group-hover/card:scale-110">
                <ArrowLeftRight className="w-5 h-5 text-orange-400" />
              </div>
              <h3 className="font-bold text-orange-300 mb-2 text-base">4. Compare Papers</h3>
              <p className="text-sm text-slate-300 leading-relaxed font-normal flex-1">
                Toggle <span className="text-orange-400 font-medium">Compare Mode</span> to view two papers side-by-side with synchronized scrolling and generate AI comparison reports.
              </p>
            </div>
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

            {/* Embed YouTube if it's a YouTube course video or playlist */}
            {c.platform === "YouTube" && (() => {
              const videoId = getYoutubeVideoId(c.url);
              const playlistId = getYoutubePlaylistId(c.url);
              let embed = "";
              if (videoId) {
                embed = `https://www.youtube.com/embed/${videoId}${playlistId ? `?list=${playlistId}` : ""}`;
              } else if (playlistId) {
                embed = `https://www.youtube.com/embed/videoseries?list=${playlistId}`;
              }

              if (!embed) return null;

              return (
                <>
                  <div className="flex items-start gap-2 p-3 mb-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-600/90 dark:text-yellow-400/90 text-xs">
                    <div className="shrink-0 mt-0.5">ℹ️</div>
                    <p>
                      <strong>Note:</strong> If the video below says "unavailable", it means the creator (like Stanford) has disabled viewing on other websites. Please click the <strong>"Open on YouTube"</strong> button in the top right to watch it!
                    </p>
                  </div>
                  <div className="aspect-video rounded-xl overflow-hidden border border-border/50 bg-black">
                    <iframe
                      src={embed}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title={c.title}
                    />
                  </div>
                </>
              );
            })()}

            {/* Curated Search Directory Placeholder */}
            {c.platform === "YouTube" && !getYoutubeVideoId(c.url) && !getYoutubePlaylistId(c.url) && (
              <div className="p-8 rounded-2xl border border-dashed border-primary/20 bg-muted/5 flex flex-col items-center text-center gap-4 animate-in fade-in duration-500">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <ListTree className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1 text-base">Curated Search Directory</h4>
                  <p className="text-sm text-muted-foreground max-w-md">
                    This recommendation is a search directory query designed to help you discover the latest tutorials and builds. Please open it directly on YouTube to browse and watch the videos.
                  </p>
                </div>
                <a
                  href={c.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl text-xs hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Open YouTube Search Results</span>
                </a>
              </div>
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
            {c.platform === "YouTube" && (getYoutubeVideoId(c.url) || getYoutubePlaylistId(c.url)) && (
              <div className="mt-8 border-t border-border/50 pt-8">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <ListTree className="w-5 h-5 text-primary" />
                      Video Content & Topics
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {getYoutubeVideoId(c.url)
                        ? "Extract structured topics and transcript directly from the video."
                        : "Topics extraction is available for individual videos."}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {transcriptData && (
                      <button
                        onClick={handleDownloadTranscriptPdf}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 hover:text-emerald-400 border border-emerald-500/20 hover:border-emerald-500/40 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                        title="Download transcript segments as PDF"
                      >
                        <Download className="w-3.5 h-3.5 shrink-0" />
                        <span>Download PDF</span>
                      </button>
                    )}
                    {isExtractable === null ? (
                      <span className="text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-lg border border-border flex items-center gap-1.5">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                        Checking availability...
                      </span>
                    ) : isExtractable === true ? (
                      !transcriptData && !loadingTranscript && (
                        <button
                          onClick={() => fetchTranscript(c.url)}
                          className="px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary font-medium rounded-lg text-sm transition-colors"
                        >
                          Extract Topics
                        </button>
                      )
                    ) : extractionReason === "ip_blocked" ? (
                      <div className="flex flex-col items-end gap-1 select-none">
                        <span className="text-xs text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20 font-medium flex items-center gap-1.5 shadow-sm">
                          <span>⚠️</span> Blocked by YouTube (Production IP)
                        </span>
                        <span className="text-[10px] text-muted-foreground text-right max-w-[280px]">
                          Configure a <code>PROXY_URL</code> in Vercel to bypass.
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-lg border border-border">
                        Transcript extraction not available
                      </span>
                    )}
                  </div>
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
                  <>
                    {/* Tab Switcher */}
                    <div className="flex items-center gap-1 p-1 bg-muted/50 border border-border/30 rounded-xl max-w-sm mb-6 mt-4">
                      <button
                        onClick={() => setVideoViewMode("topics")}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                          videoViewMode === "topics"
                            ? "bg-primary text-primary-foreground shadow-md"
                            : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                        }`}
                      >
                        <ListTree className="w-3.5 h-3.5" />
                        Topics & Segments
                      </button>
                      <button
                        onClick={() => setVideoViewMode("summary")}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                          videoViewMode === "summary"
                            ? "bg-primary text-primary-foreground shadow-md"
                            : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        5-Sentence Summary
                      </button>
                    </div>

                    {videoViewMode === "topics" ? (
                      <div className="space-y-3">
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
                    ) : (
                      <div className="space-y-4 animate-in fade-in duration-300">
                        <div className="flex items-center justify-between p-4 bg-muted/20 border border-border/40 rounded-2xl">
                          <div>
                            <h4 className="font-semibold text-sm text-foreground">AI Generated Summary</h4>
                            <p className="text-xs text-muted-foreground mt-0.5">Quick 5-sentence breakdown of this video</p>
                          </div>
                          <button
                            onClick={handleToggleSummaryTts}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 shadow-sm cursor-pointer ${
                              isSummaryTtsPlaying
                                ? "bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 animate-pulse"
                                : "bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20"
                            }`}
                          >
                            {isSummaryTtsPlaying ? (
                              <>
                                <span className="flex gap-0.5 items-center justify-center h-3 w-3 shrink-0">
                                  <span className="w-0.5 h-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                                  <span className="w-0.5 h-3 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                                  <span className="w-0.5 h-1.5 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                                </span>
                                <span>Stop Listening</span>
                              </>
                            ) : (
                              <>
                                <Volume2 className="w-3.5 h-3.5" />
                                <span>Listen Summary</span>
                              </>
                            )}
                          </button>
                        </div>

                        {summarySentences.length > 0 ? (
                          <div className="relative border-l-2 border-primary/20 ml-3 pl-6 space-y-6 py-2">
                            {summarySentences.map((sentence, idx) => (
                              <div key={idx} className="relative group">
                                {/* Timeline dot */}
                                <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-background border-2 border-primary flex items-center justify-center font-bold text-[8px] text-primary shadow-sm group-hover:scale-110 transition-transform">
                                  {idx + 1}
                                </div>
                                
                                {/* Sentence box */}
                                <div className="p-4 bg-card hover:bg-muted/30 border border-border/50 hover:border-primary/20 rounded-xl transition-all duration-200 shadow-sm hover:shadow">
                                  <p className="text-sm text-foreground leading-relaxed">
                                    {sentence}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-8 text-center text-sm text-muted-foreground border border-dashed border-border/50 rounded-xl bg-card">
                            No summary sentences could be extracted from this transcript.
                          </div>
                        )}
                      </div>
                    )}
                  </>
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
          <span className="text-xs font-semibold truncate max-w-[140px] sm:max-w-[350px]">
            {paper.title}
          </span>
          {pdfPagesCount !== null && isNarrowMobile && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0 select-none">
              {pdfPagesCount} {pdfPagesCount === 1 ? "page" : "pages"}
            </span>
          )}
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
              src={`/api/pdf?id=${encodeURIComponent(paper.id)}#view=FitH${isMobile ? "&scrollbar=0&navpanes=0" : ""}`}
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
