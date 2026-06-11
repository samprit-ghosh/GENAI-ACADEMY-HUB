"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { useAudio } from "@/components/audio-provider";
import {
  Share2,
  FileText,
  Sparkles,
  Copy,
  CheckCircle2,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Square,
  PenTool,
  User,
  Calendar,
  AlertCircle,
  HelpCircle,
  Link as LinkIcon,
  UploadCloud,
  File,
  Image,
  Trash2,
  Loader2,
  Eye
} from "lucide-react";

interface NoteAttachment {
  name: string;
  url: string;
  type: "image" | "pdf";
  size?: number;
  pages?: number;
}

interface NoteData {
  title: string;
  author: string;
  text: string;
  theme: string;
  date: string;
  viewLimit?: number; // 0 = unlimited, 1 = 1 view, 2 = 2 views
  attachment?: NoteAttachment;
}

const THEMES = [
  {
    id: "violet",
    name: "Cosmic Violet",
    colorClass: "from-violet-500 to-fuchsia-500",
    borderGlow: "shadow-violet-500/20 border-violet-500/30 hover:border-violet-500/60 focus:border-violet-500/60",
    gradientText: "bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent",
    bgHighlight: "bg-violet-950/20",
    badgeBg: "bg-violet-500/10 text-violet-300 border-violet-500/20",
    radialGlow: "from-violet-500/10",
    textColor: "text-violet-200"
  },
  {
    id: "emerald",
    name: "Emerald Forest",
    colorClass: "from-emerald-500 to-teal-500",
    borderGlow: "shadow-emerald-500/20 border-emerald-500/30 hover:border-emerald-500/60 focus:border-emerald-500/60",
    gradientText: "bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent",
    bgHighlight: "bg-emerald-950/20",
    badgeBg: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
    radialGlow: "from-emerald-500/10",
    textColor: "text-emerald-200"
  },
  {
    id: "amber",
    name: "Amber Glow",
    colorClass: "from-amber-500 to-orange-500",
    borderGlow: "shadow-amber-500/20 border-amber-500/30 hover:border-amber-500/60 focus:border-amber-500/60",
    gradientText: "bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent",
    bgHighlight: "bg-amber-950/20",
    badgeBg: "bg-amber-500/10 text-amber-300 border-amber-500/20",
    radialGlow: "from-amber-500/10",
    textColor: "text-amber-200"
  },
  {
    id: "indigo",
    name: "Indigo Wave",
    colorClass: "from-indigo-500 to-cyan-500",
    borderGlow: "shadow-indigo-500/20 border-indigo-500/30 hover:border-indigo-500/60 focus:border-indigo-500/60",
    gradientText: "bg-gradient-to-r from-indigo-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent",
    bgHighlight: "bg-indigo-950/20",
    badgeBg: "bg-indigo-500/10 text-indigo-300 border-indigo-500/20",
    radialGlow: "from-indigo-500/10",
    textColor: "text-indigo-200"
  },
  {
    id: "rose",
    name: "Rose Crimson",
    colorClass: "from-rose-500 to-red-500",
    borderGlow: "shadow-rose-500/20 border-rose-500/30 hover:border-rose-500/60 focus:border-rose-500/60",
    gradientText: "bg-gradient-to-r from-rose-400 via-pink-400 to-red-400 bg-clip-text text-transparent",
    bgHighlight: "bg-rose-950/20",
    badgeBg: "bg-rose-500/10 text-rose-300 border-rose-500/20",
    radialGlow: "from-rose-500/10",
    textColor: "text-rose-200"
  }
];

function encodeNote(note: NoteData): string {
  try {
    const json = JSON.stringify(note);
    const bytes = new TextEncoder().encode(json);
    const binString = Array.from(bytes, (b) => String.fromCharCode(b)).join("");
    const base64 = btoa(binString);
    return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  } catch (err) {
    console.error("Failed to encode note", err);
    return "";
  }
}

function decodeNote(urlSafeBase64: string): NoteData | null {
  try {
    let base64 = urlSafeBase64.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) {
      base64 += "=";
    }
    const binString = atob(base64);
    const bytes = Uint8Array.from(binString, (char) => char.charCodeAt(0));
    const json = new TextDecoder().decode(bytes);
    return JSON.parse(json) as NoteData;
  } catch (err) {
    console.error("Failed to decode note", err);
    return null;
  }
}

const BrandedLogo = ({ size = "md", animate = false }: { size?: "sm" | "md"; animate?: boolean }) => {
  const containerSize = size === "sm" ? "w-8 h-8" : "w-10 h-10";
  return (
    <div className="relative group/logo-link flex items-center justify-center shrink-0">
      {/* Animated yellow glow rings */}
      <div className="absolute inset-0 rounded-full border border-yellow-400/20 scale-120 group-hover/logo-link:scale-135 group-hover/logo-link:border-yellow-400/50 group-hover/logo-link:rotate-180 transition-all duration-700 ease-out pointer-events-none" />
      <div className="absolute inset-0 rounded-full border border-dashed border-amber-400/40 scale-110 group-hover/logo-link:scale-120 group-hover/logo-link:border-amber-400 group-hover/logo-link:rotate-90 transition-all duration-500 ease-out pointer-events-none" />
      
      {/* Logo container with yellow ring */}
      <div className={`${containerSize} rounded-full bg-slate-900 border-2 border-yellow-400/80 flex items-center justify-center overflow-hidden p-1 shadow-md shadow-yellow-500/10 group-hover/logo-link:border-yellow-400 group-hover/logo-link:shadow-yellow-500/30 transition-all duration-305`}>
        <img 
          src="/logo-mark.png" 
          alt="GenAI Academy & Hub Logo" 
          className={`w-full h-full object-contain group-hover/logo-link:scale-110 transition-transform duration-300 ${animate ? "animate-[spin_12s_linear_infinite]" : ""}`} 
        />
      </div>
    </div>
  );
};

const LogoLoader = ({ message = "Loading...", small = false }: { message?: string; small?: boolean }) => (
  <div className={`flex flex-col items-center justify-center w-full animate-in fade-in duration-350 ${small ? "py-2" : "py-10"}`}>
    <div className="relative flex items-center justify-center">
      {/* Outer glowing rings */}
      <div className={`absolute inset-0 rounded-full border border-yellow-400/20 scale-120 group-hover/logo-link:scale-135 group-hover/logo-link:border-yellow-400/50 group-hover/logo-link:rotate-180 transition-all duration-700 ease-out pointer-events-none ${small ? "scale-115" : "scale-125"}`} />
      <div className={`absolute inset-0 rounded-full border border-dashed border-amber-400/40 scale-110 group-hover/logo-link:scale-120 group-hover/logo-link:border-amber-400 group-hover/logo-link:rotate-90 transition-all duration-500 ease-out pointer-events-none ${small ? "scale-105" : "scale-115"}`} />
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
      <p className={`font-bold text-slate-400 tracking-widest uppercase animate-pulse flex items-center justify-center gap-1.5 ${small ? "mt-2.5 text-[9px]" : "mt-4.5 text-[10px] sm:text-xs"}`}>
        <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
        {message}
      </p>
    )}
  </div>
);

export default function NotesClientPage() {
  const [mounted, setMounted] = useState(false);
  
  // Editor State
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [text, setText] = useState("");
  const [selectedTheme, setSelectedTheme] = useState("violet");
  const [viewLimit, setViewLimit] = useState(0); // 0 = unlimited, 1 = 1 view, 2 = 2 views
  const [copied, setCopied] = useState(false);
  const [generatedLink, setGeneratedLink] = useState("");
  const [attachment, setAttachment] = useState<NoteAttachment | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Viewer State
  const [isViewMode, setIsViewMode] = useState(false);
  const [viewerNote, setViewerNote] = useState<NoteData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSelfDestructed, setIsSelfDestructed] = useState(false);
  const [currentViewNumber, setCurrentViewNumber] = useState(0);

  // Access global Audio Reader context
  const {
    currentTrack,
    trackTitle,
    trackType,
    isPlaying: globalIsPlaying,
    playTTS,
    stopTTS,
    pauseTrack,
    resumeTrack,
    playbackRate,
    setPlaybackRate,
    voiceType,
    setVoiceType,
    progress
  } = useAudio();

  useEffect(() => {
    setMounted(true);

    const handleUrlChange = () => {
      // Check query param first
      const searchParams = new URLSearchParams(window.location.search);
      const queryPayload = searchParams.get("n");

      // Check hash param second (e.g. #n=...)
      let hashPayload = "";
      if (window.location.hash && window.location.hash.includes("n=")) {
        const match = window.location.hash.match(/[#&]n=([^&]+)/);
        if (match) {
          hashPayload = match[1];
        }
      }

      const payload = queryPayload || hashPayload;

      if (payload) {
        const decoded = decodeNote(payload);
        if (decoded) {
          setViewerNote(decoded);
          setIsViewMode(true);
          setError(null);

          // Enforce self-destruction policy
          const limit = decoded.viewLimit || 0;
          if (limit > 0) {
            const hashId = payload.slice(0, 32);
            
            // Check views on the server globally across all users/devices
            fetch("/api/notes/view", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ hashId, viewLimit: limit })
            })
              .then((res) => {
                if (!res.ok) throw new Error("Server error checking views");
                return res.json();
              })
              .then((data) => {
                if (!data.allowed) {
                  setIsSelfDestructed(true);
                } else {
                  setCurrentViewNumber(data.count);
                  setIsSelfDestructed(false);
                }
              })
              .catch((err) => {
                console.error("Failed to fetch global views, falling back to local storage", err);
                // Local storage fallback for offline/transient errors
                const storageKey = `views_${hashId}`;
                const storedViews = localStorage.getItem(storageKey);
                const viewCount = storedViews ? parseInt(storedViews, 10) : 0;

                if (viewCount >= limit) {
                  setIsSelfDestructed(true);
                } else {
                  const nextCount = viewCount + 1;
                  localStorage.setItem(storageKey, nextCount.toString());
                  setCurrentViewNumber(nextCount);
                  setIsSelfDestructed(false);
                }
              });
          } else {
            setIsSelfDestructed(false);
            setCurrentViewNumber(0);
          }
        } else {
          setError("This note link appears to be corrupted or invalid.");
          setIsViewMode(true);
        }
      } else {
        setViewerNote(null);
        setIsViewMode(false);
        setError(null);
        setIsSelfDestructed(false);
        setCurrentViewNumber(0);
      }
    };

    handleUrlChange();
    window.addEventListener("hashchange", handleUrlChange);
    return () => {
      window.removeEventListener("hashchange", handleUrlChange);
      // Stop speech when navigating away
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const activeTheme = THEMES.find((t) => t.id === (isViewMode ? viewerNote?.theme : selectedTheme)) || THEMES[0];

  const handleGenerateLink = () => {
    if (!title.trim() || !text.trim()) return;

    const today = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });

    const notePayload: NoteData = {
      title: title.trim(),
      author: author.trim() || "Anonymous",
      text: text.trim(),
      theme: selectedTheme,
      date: today,
      viewLimit: viewLimit,
      ...(attachment ? { attachment } : {})
    };

    const hash = encodeNote(notePayload);
    const shareUrl = `${window.location.origin}${window.location.pathname}#n=${hash}`;
    
    setGeneratedLink(shareUrl);
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    });
  };

  const textToRead = viewerNote
    ? `Note: ${viewerNote.title}. Written by ${viewerNote.author}. ${viewerNote.text}`
    : "";

  const isThisNoteActive = trackType === "tts" && currentTrack === textToRead;
  const isThisNotePlaying = isThisNoteActive && globalIsPlaying;
  const isThisNotePaused = isThisNoteActive && !globalIsPlaying;

  const handleCreateNew = () => {
    stopTTS();
    window.location.hash = "";
    // If query parameters are present, clear them too
    if (window.location.search) {
      window.history.pushState({}, "", window.location.pathname);
    }
    setTitle("");
    setAuthor("");
    setText("");
    setViewLimit(0);
    setGeneratedLink("");
    setViewerNote(null);
    setIsViewMode(false);
    setIsSelfDestructed(false);
    setCurrentViewNumber(0);
    setAttachment(null);
    setUploadError(null);
  };

  if (!mounted) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
        <Header showStats={false} />
        <main className="flex-1 flex items-center justify-center">
          <LogoLoader message="Initializing Note Sharer..." />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 overflow-x-hidden">
      <Header showStats={false} />

      {/* Background Cyber-Glow Effect */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-b from-indigo-500/5 to-transparent rounded-full blur-[120px] pointer-events-none" />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 sm:px-6 relative z-10 flex flex-col items-center">
        {isViewMode ? (
          /* ========================================================================= */
          /* ======================== NOTE VIEWER SCREEN ============================= */
          /* ========================================================================= */
          <div className="w-full max-w-3xl flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {error ? (
              // Error Alert Box
              <div className="p-8 border border-red-500/20 bg-red-950/20 rounded-2xl flex flex-col items-center text-center gap-4 shadow-xl backdrop-blur-md">
                <AlertCircle className="w-12 h-12 text-red-500 animate-pulse" />
                <h2 className="text-xl font-bold text-red-400">Unable to load note</h2>
                <p className="text-sm text-slate-400 max-w-md leading-relaxed">{error}</p>
                <button
                  onClick={handleCreateNew}
                  className="mt-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 transition-all cursor-pointer"
                >
                  Create a New Note
                </button>
              </div>
            ) : isSelfDestructed ? (
              // Self-Destructed Screen
              <div className="p-8 sm:p-12 border border-red-500/30 bg-red-950/15 rounded-3xl flex flex-col items-center text-center gap-6 shadow-2xl backdrop-blur-md relative overflow-hidden">
                {/* Visual Glow */}
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-gradient-to-br from-red-500/10 to-transparent rounded-full blur-3xl opacity-60 pointer-events-none" />
                
                {/* Warning emblem */}
                <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 shadow shadow-red-500/20 animate-pulse">
                  <AlertCircle className="w-8 h-8" />
                </div>
                
                <div className="flex flex-col gap-2 relative z-10">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-red-400/80 bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-full w-fit mx-auto">
                    ACCESS REVOKED / CONTENT PURGED
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-100 leading-tight">
                    This note has self-destructed!
                  </h2>
                </div>
                
                <p className="text-sm text-slate-400 max-w-md leading-relaxed relative z-10">
                  The sender configured this message to destroy itself after <span className="font-bold text-red-400">{viewerNote?.viewLimit === 1 ? "1 view" : "2 views"}</span> on your device. The content has been permanently erased from your browser's local memory.
                </p>
                
                <div className="w-full h-px bg-slate-800/80 relative z-10" />
                
                <button
                  onClick={handleCreateNew}
                  className="px-6 py-3 rounded-xl text-xs font-bold bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-lg shadow-red-500/15 hover:shadow-red-500/25 transition-all hover:scale-102 cursor-pointer relative z-10"
                >
                  Create a New Note
                </button>
              </div>
            ) : (
              viewerNote && (
                <>
                  {/* Share Header / Top Info bar */}
                  <div className="flex flex-wrap items-center justify-between gap-4 p-4 px-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-md">
                    <div className="flex items-center gap-3.5">
                      <BrandedLogo size="sm" />
                      <div>
                        <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Shared Document</span>
                        <p className="text-xs font-semibold text-slate-300">Received via custom link</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleCreateNew}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-md shadow-indigo-500/10 hover:shadow-indigo-500/20 transition-all hover:scale-102 cursor-pointer flex items-center gap-1.5"
                      >
                        <PenTool className="w-3.5 h-3.5" />
                        Write Your Own Note
                      </button>
                    </div>
                  </div>

                  {/* Main Note Card */}
                  <div className={`relative rounded-3xl border bg-slate-900/60 shadow-2xl backdrop-blur-md p-6 sm:p-10 flex flex-col gap-6 overflow-hidden transition-all duration-300 ${activeTheme.borderGlow}`}>
                    {/* Themed Glow Ring */}
                    <div className={`absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-gradient-to-br ${activeTheme.radialGlow} to-transparent rounded-full blur-3xl opacity-60 pointer-events-none`} />

                    {/* Metadata Header */}
                    <div className="flex flex-wrap items-center gap-3 relative z-10">
                      <div className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase border ${activeTheme.badgeBg} flex items-center gap-1.5`}>
                        <Sparkles className="w-3 h-3" />
                        {activeTheme.name}
                      </div>
                      <span className="text-slate-600">•</span>
                      <div className="text-xs text-slate-500 flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-600" />
                        By <span className="font-semibold text-slate-400">{viewerNote.author}</span>
                      </div>
                      <span className="text-slate-600">•</span>
                      <div className="text-xs text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-600" />
                        {viewerNote.date}
                      </div>
                      {viewerNote.viewLimit && viewerNote.viewLimit > 0 && (
                        <>
                          <span className="text-slate-600">•</span>
                          <div className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase border border-red-500/20 bg-red-500/10 text-red-350 flex items-center gap-1 animate-pulse">
                            <AlertCircle className="w-3 h-3 text-red-400" />
                            {viewerNote.viewLimit === 1 ? "1 View Limit" : "2 Views Limit"} ({currentViewNumber === 1 ? "First View" : "Final View"})
                          </div>
                        </>
                      )}
                    </div>

                    {/* Title */}
                    <h1 className={`text-2xl sm:text-4xl font-extrabold tracking-tight relative z-10 leading-tight ${activeTheme.gradientText}`}>
                      {viewerNote.title}
                    </h1>

                    {/* Separator line */}
                    <div className="h-px w-full bg-slate-800/80 relative z-10" />

                    {/* Text Body */}
                    <div className="text-slate-300 text-sm sm:text-base leading-relaxed font-normal whitespace-pre-wrap select-text relative z-10 max-h-[50vh] overflow-y-auto pr-2 scrollbar-thin">
                      {viewerNote.text.split("\n\n").map((para, i) => (
                        <p key={i} className="mb-4 last:mb-0">
                          {para}
                        </p>
                      ))}
                    </div>

                    {viewerNote.attachment && (
                      <div className="relative rounded-2xl border border-slate-800 bg-slate-950/40 overflow-hidden flex flex-col gap-2 p-3 relative z-10 max-w-full">
                        <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-1 px-1">Attached file</span>
                        
                        {viewerNote.attachment.type === "image" ? (
                          <div className="relative rounded-xl overflow-hidden max-h-[450px] w-full flex items-center justify-center bg-slate-950 border border-slate-900/60 p-2 shadow-inner">
                            <img 
                              src={viewerNote.attachment.url} 
                              alt={viewerNote.attachment.name} 
                              className="max-h-[420px] w-auto object-contain rounded-lg hover:scale-101 transition-transform duration-300 cursor-zoom-in"
                              onClick={() => window.open(viewerNote.attachment!.url, "_blank")}
                            />
                          </div>
                        ) : (
                          <div className="flex flex-col gap-3 w-full">
                            <div className="p-4 bg-slate-950/80 rounded-xl flex flex-wrap sm:flex-nowrap items-center justify-between border border-slate-850 gap-4">
                              <div className="flex items-center gap-3 overflow-hidden">
                                <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                                  <File className="w-5 h-5 text-red-400" />
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <span className="text-xs font-bold text-slate-200 truncate pr-2">{viewerNote.attachment.name}</span>
                                  <span className="text-[10px] text-slate-500 font-semibold uppercase">
                                    PDF Document • {viewerNote.attachment.size ? `${(viewerNote.attachment.size / (1024 * 1024)).toFixed(2)} MB` : ""}
                                    {viewerNote.attachment.pages && viewerNote.attachment.pages > 0 ? ` • ${viewerNote.attachment.pages} ${viewerNote.attachment.pages === 1 ? 'page' : 'pages'}` : ""}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2 shrink-0">
                                <a 
                                  href={viewerNote.attachment.url} 
                                  target="_blank" 
                                  rel="noreferrer"
                                  className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:border-slate-700 text-slate-200 font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5"
                                >
                                  <Eye className="w-3.5 h-3.5 text-indigo-400" />
                                  View Document
                                </a>
                                <a 
                                  href={viewerNote.attachment.url} 
                                  download={viewerNote.attachment.name}
                                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-550 text-white font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5"
                                >
                                  Download
                                </a>
                              </div>
                            </div>
                            
                            {/* Interactive PDF Document Viewer */}
                            <div className="w-full h-[450px] rounded-xl overflow-hidden border border-slate-800 bg-slate-950 relative shadow-inner">
                              <iframe
                                src={viewerNote.attachment.url}
                                className="w-full h-full border-none"
                                title="PDF Document Viewer"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Text-To-Speech (TTS) Reader Controls */}
                    <div className="mt-4 pt-6 border-t border-slate-800/80 flex flex-col gap-4 relative z-10">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Note Vocal Guide</span>
                      
                      <div className="flex flex-col gap-3">
                        <div className="flex flex-wrap items-center gap-4">
                          {/* Audio Deck Controls */}
                          <div className="flex items-center gap-2">
                            {!isThisNoteActive ? (
                              <button
                                onClick={() => playTTS(textToRead, viewerNote.title)}
                                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 transition-all hover:scale-102 flex items-center gap-2 font-bold text-xs cursor-pointer"
                                title="Listen to Note"
                              >
                                <Volume2 className="w-4 h-4 text-emerald-400" />
                                Listen Note
                              </button>
                            ) : (
                              <>
                                {isThisNotePaused ? (
                                  <button
                                    onClick={resumeTrack}
                                    className="w-10 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center transition-all cursor-pointer"
                                    title="Resume"
                                  >
                                    <Play className="w-4 h-4 ml-0.5 fill-current" />
                                  </button>
                                ) : (
                                  <button
                                    onClick={pauseTrack}
                                    className="w-10 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center transition-all cursor-pointer relative"
                                    title="Pause"
                                  >
                                    <Pause className="w-4 h-4 fill-current" />
                                    <span className="absolute inset-0 rounded-xl border border-indigo-400 animate-ping opacity-25" />
                                  </button>
                                )}

                                <button
                                  onClick={stopTTS}
                                  className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-red-500/10 hover:text-red-400 border border-slate-700/80 text-slate-400 flex items-center justify-center transition-all cursor-pointer"
                                  title="Stop Reading"
                                >
                                  <Square className="w-3.5 h-3.5 fill-current" />
                                </button>
                              </>
                            )}
                          </div>

                          {/* Speech Voice Selection */}
                          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800/80 rounded-xl p-1 px-3 h-10">
                            <span className="text-[10px] font-bold text-slate-500 uppercase shrink-0">Voice:</span>
                            <select
                              value={voiceType}
                              onChange={(e) => {
                                const newVoice = e.target.value as any;
                                setVoiceType(newVoice);
                                if (isThisNotePlaying) {
                                  playTTS(textToRead, viewerNote.title, newVoice);
                                }
                              }}
                              className="bg-transparent text-xs font-bold text-slate-300 focus:outline-none cursor-pointer pr-1"
                            >
                              <option value="default" className="bg-slate-900 text-slate-300">Default Voice</option>
                              <option value="female" className="bg-slate-900 text-slate-300">Female Voice</option>
                              <option value="male" className="bg-slate-900 text-slate-300">Male Voice</option>
                              <option value="hi-IN" className="bg-slate-900 text-slate-300">Hindi Voice (हिंदी)</option>
                              <option value="en-IN-female" className="bg-slate-900 text-slate-300">Indian Female (Eng)</option>
                            </select>
                          </div>

                          {/* Speech Rate Control */}
                          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800/80 rounded-xl p-1 px-3 h-10">
                            <span className="text-[10px] font-bold text-slate-500 uppercase shrink-0">Speed:</span>
                            <select
                              value={playbackRate}
                              onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
                              className="bg-transparent text-xs font-bold text-slate-300 focus:outline-none cursor-pointer pr-1"
                            >
                              <option value={0.75} className="bg-slate-900 text-slate-300">0.75x</option>
                              <option value={1} className="bg-slate-900 text-slate-300">1.0x</option>
                              <option value={1.25} className="bg-slate-900 text-slate-300">1.25x</option>
                              <option value={1.5} className="bg-slate-900 text-slate-300">1.5x</option>
                              <option value={2} className="bg-slate-900 text-slate-300">2.0x</option>
                            </select>
                          </div>

                          {/* TTS Status animation when playing */}
                          {isThisNotePlaying && (
                            <div className="flex items-center gap-1.5 px-3">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                              <span className="text-xs text-emerald-400/90 font-medium">Reading note...</span>
                            </div>
                          )}
                        </div>

                        {/* Glowing Progress Bar */}
                        {isThisNoteActive && (
                          <div className="relative w-full h-1.5 bg-slate-950 border border-slate-850/50 rounded-full overflow-hidden mt-1 group">
                            <div 
                              className="absolute top-0 left-0 h-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-orange-500 transition-all duration-300 ease-out rounded-full"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )
            )}
          </div>
        ) : (
          /* ========================================================================= */
          /* ======================== NOTE EDITOR SCREEN ============================= */
          /* ========================================================================= */
          <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-in fade-in slide-in-from-bottom-4 duration-300">
            
            {/* Editor Input Controls (Left 7 Columns) */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              
              {/* Header Titles */}
              <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-violet-400 via-indigo-400 to-cyan-400 bg-clip-text text-transparent flex items-center gap-3.5">
                  <BrandedLogo size="md" animate={true} />
                Share Me
                </h1>
                <p className="text-sm text-slate-400 leading-relaxed max-w-xl">
                  Write beautiful notes, custom thoughts, or summaries. We serialize all content directly inside a sharing URL, meaning no DB accounts, tracking, or database records are ever saved.
                </p>
              </div>

              {/* Form Block */}
              <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-md shadow-xl flex flex-col gap-5">
                
                {/* Note Title Input */}
                <div className="flex flex-col gap-2">
                  <label htmlFor="note-title" className="text-xs font-bold tracking-widest text-slate-400 uppercase">Note Title</label>
                  <input
                    id="note-title"
                    type="text"
                    maxLength={100}
                    placeholder="Enter a captivating title..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500/80 rounded-xl px-4 py-3 text-sm font-semibold text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 transition-all"
                  />
                </div>

                {/* Author Info */}
                <div className="flex flex-col gap-2">
                  <label htmlFor="note-author" className="text-xs font-bold tracking-widest text-slate-400 uppercase">Author Name (Optional)</label>
                  <input
                    id="note-author"
                    type="text"
                    maxLength={50}
                    placeholder="e.g. Dr. Ada Lovelace"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500/80 rounded-xl px-4 py-3 text-sm font-semibold text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 transition-all"
                  />
                </div>

                {/* Theme Selector */}
                <div className="flex flex-col gap-2.5">
                  <span className="text-xs font-bold tracking-widest text-slate-400 uppercase">Visual Accent Theme</span>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {THEMES.map((theme) => {
                      const isSelected = selectedTheme === theme.id;
                      return (
                        <button
                          key={theme.id}
                          onClick={() => setSelectedTheme(theme.id)}
                          className={`p-3 rounded-xl border bg-slate-950 flex flex-col items-center gap-2 cursor-pointer transition-all hover:bg-slate-900 group ${
                            isSelected 
                              ? `border-indigo-500 shadow-lg shadow-indigo-500/10` 
                              : `border-slate-800/80`
                          }`}
                        >
                          <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${theme.colorClass} border border-white/10 group-hover:scale-110 transition-transform`} />
                          <span className="text-[10px] font-bold text-slate-400 group-hover:text-slate-200 transition-colors">
                            {theme.name.split(" ")[1]}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Self-Destruct Option */}
                <div className="flex flex-col gap-2.5">
                  <span className="text-xs font-bold tracking-widest text-slate-400 uppercase">Self-Destruction Policy</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { value: 0, label: "Unlimited Access", desc: "Safe to read forever" },
                      { value: 1, label: "Burn on 1st View", desc: "Destroys after 1 opening" },
                      { value: 2, label: "Burn on 2nd View", desc: "Destroys after 2 openings" }
                    ].map((opt) => {
                      const isSelected = viewLimit === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setViewLimit(opt.value)}
                          className={`p-3 rounded-xl border bg-slate-950 flex flex-col items-start gap-1 cursor-pointer transition-all hover:bg-slate-900 text-left ${
                            isSelected 
                              ? `border-indigo-500 shadow-lg shadow-indigo-500/10` 
                              : `border-slate-800/80`
                          }`}
                        >
                          <span className={`text-[11px] font-bold ${isSelected ? 'text-indigo-400' : 'text-slate-350'}`}>
                            {opt.label}
                          </span>
                          <span className="text-[9px] text-slate-500 font-medium">
                            {opt.desc}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* File Attachment Upload */}
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-bold tracking-widest text-slate-400 uppercase">Attachment (Photo or PDF)</span>
                  
                  {!attachment ? (
                    <div className={`relative border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center transition-all bg-slate-950/50 hover:bg-slate-900/40 ${uploadError ? 'border-red-500/40' : 'border-slate-800 hover:border-slate-700'}`}>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          
                          // Validate client-side size limit (5MB)
                          if (file.size > 5 * 1024 * 1024) {
                            setUploadError("File size exceeds 5MB limit.");
                            return;
                          }
                          
                          setIsUploading(true);
                          setUploadError(null);
                          
                          const formData = new FormData();
                          formData.append("file", file);
                          
                          try {
                            const res = await fetch("/api/notes/upload", {
                              method: "POST",
                              body: formData,
                            });
                            
                            if (!res.ok) {
                              const errData = await res.json();
                              throw new Error(errData.error || "Upload failed");
                            }
                            
                            const data = await res.json();
                            setAttachment({
                              name: data.name,
                              url: data.url,
                              type: data.type,
                              size: data.size,
                              pages: data.pages,
                            });
                          } catch (err: any) {
                            console.error("Upload error", err);
                            setUploadError(err.message || "Failed to upload file.");
                          } finally {
                            setIsUploading(false);
                          }
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        disabled={isUploading}
                      />
                      
                      {isUploading ? (
                        <div className="flex flex-col items-center gap-2 text-slate-400">
                          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                          <span className="text-xs font-semibold">Uploading attachment...</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-center text-slate-400 pointer-events-none">
                          <UploadCloud className="w-8 h-8 text-indigo-400" />
                          <span className="text-xs font-semibold">Drag & drop or click to upload</span>
                          <span className="text-[10px] text-slate-500">Supports JPG, PNG, WEBP, GIF, or PDF (Max 5MB)</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 animate-in fade-in zoom-in-95 duration-200">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                          {attachment.type === "image" ? (
                            <Image className="w-5 h-5 text-emerald-400" />
                          ) : (
                            <File className="w-5 h-5 text-red-400" />
                          )}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-bold text-slate-200 truncate pr-2">{attachment.name}</span>
                          <span className="text-[10px] text-slate-500 font-semibold uppercase">
                            {attachment.type} • {attachment.size ? `${(attachment.size / (1024 * 1024)).toFixed(2)} MB` : ""}
                            {attachment.pages && attachment.pages > 0 ? ` • ${attachment.pages} ${attachment.pages === 1 ? 'page' : 'pages'}` : ""}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAttachment(null)}
                        className="p-2 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-900 transition-colors shrink-0"
                        title="Remove Attachment"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  
                  {uploadError && (
                    <span className="text-[10px] font-bold text-red-400 flex items-center gap-1 mt-0.5">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {uploadError}
                    </span>
                  )}
                </div>

                {/* Content Area */}
                <div className="flex flex-col gap-2 relative">
                  <div className="flex justify-between items-center">
                    <label htmlFor="note-content" className="text-xs font-bold tracking-widest text-slate-400 uppercase">Note Body</label>
                    <span className={`text-[10px] font-bold ${text.length > 2900 ? 'text-amber-500' : 'text-slate-500'}`}>
                      {text.length} / 3000 chars
                    </span>
                  </div>
                  <textarea
                    id="note-content"
                    maxLength={3000}
                    rows={8}
                    placeholder="Write down your study guide, AI summaries, or general thoughts here... Supports multiple paragraphs by pressing Enter."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500/80 rounded-2xl px-4 py-3.5 text-sm leading-relaxed text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 transition-all scrollbar-thin resize-none"
                  />
                  {text.length >= 3000 && (
                    <span className="text-[10px] font-bold text-amber-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Reached limit to ensure URL compatibility across messaging apps.
                    </span>
                  )}
                </div>

                {/* Generate Link Trigger */}
                <button
                  disabled={!title.trim() || !text.trim()}
                  onClick={handleGenerateLink}
                  className={`w-full py-3.5 rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2 cursor-pointer transition-all ${
                    title.trim() && text.trim()
                      ? "bg-indigo-600 text-white hover:bg-indigo-500 hover:scale-101 shadow-lg shadow-indigo-500/20"
                      : "bg-slate-800/80 text-slate-500 cursor-not-allowed border border-slate-800"
                  }`}
                >
                  <Share2 className="w-4 h-4" />
                  Generate & Copy Share Link
                </button>

                {/* Share Link Alert Modal (Glows!) */}
                {generatedLink && (
                  <div className="mt-2 p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/20 flex flex-col gap-2.5 animate-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center gap-2 text-indigo-400">
                      {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400 animate-bounce" /> : <LinkIcon className="w-4 h-4" />}
                      <span className="text-xs font-bold uppercase tracking-wider">
                        {copied ? "Link Copied to Clipboard!" : "Global Link Ready!"}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        readOnly
                        value={generatedLink}
                        onClick={(e) => (e.target as HTMLInputElement).select()}
                        className="flex-1 bg-slate-950/80 border border-slate-850 rounded-xl px-3 py-2 text-xs font-medium text-slate-400 select-all focus:outline-none focus:border-indigo-500"
                      />
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(generatedLink);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 3000);
                        }}
                        className="px-4.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-bold text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-normal">
                      Anyone with this URL will load your note exactly as it is shown here, instantly. No database is hosting this note!
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Live Preview Pane (Right 5 Columns) */}
            <div className="lg:col-span-5 flex flex-col gap-4 sticky top-6">
              <span className="text-xs font-extrabold tracking-widest text-slate-500 uppercase flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
                Live Preview
              </span>

              {/* Preview Note Box */}
              <div className={`relative rounded-3xl border bg-slate-900/60 shadow-2xl backdrop-blur-md p-6 sm:p-8 flex flex-col gap-5 overflow-hidden transition-all duration-300 ${activeTheme.borderGlow}`}>
                
                {/* Visual Glow */}
                <div className={`absolute top-0 right-0 -mr-20 -mt-20 w-48 h-48 bg-gradient-to-br ${activeTheme.radialGlow} to-transparent rounded-full blur-3xl opacity-50 pointer-events-none`} />

                {/* Preview Theme Name Badge */}
                <div className="flex items-center gap-2 relative z-10">
                  <div className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${activeTheme.badgeBg} flex items-center gap-1`}>
                    <Sparkles className="w-2.5 h-2.5" />
                    {activeTheme.name}
                  </div>
                  <span className="text-slate-700 text-xs">•</span>
                  <div className="text-[11px] text-slate-500 font-medium">
                    By <span className="font-semibold text-slate-400">{author.trim() || "Anonymous"}</span>
                  </div>
                  {viewLimit > 0 && (
                    <>
                      <span className="text-slate-700 text-xs">•</span>
                      <div className="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase border border-red-500/20 bg-red-500/10 text-red-400 flex items-center gap-1 animate-pulse">
                        <AlertCircle className="w-2.5 h-2.5" />
                        {viewLimit === 1 ? "1 View" : "2 Views"}
                      </div>
                    </>
                  )}
                </div>

                {/* Title */}
                <h2 className={`text-xl sm:text-2xl font-extrabold tracking-tight relative z-10 leading-snug break-words ${activeTheme.gradientText}`}>
                  {title.trim() || "Your Note Title"}
                </h2>

                {/* Separator line */}
                <div className="h-px w-full bg-slate-800/80 relative z-10" />

                {/* Text Body */}
                <div className="text-slate-400 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap relative z-10 max-h-[30vh] overflow-y-auto pr-2 scrollbar-thin">
                  {text.trim() ? (
                    text.split("\n\n").map((para, i) => (
                      <p key={i} className="mb-3 last:mb-0">
                        {para}
                      </p>
                    ))
                  ) : (
                    <span className="text-slate-600 italic">No content written yet. Start typing on the left to see it styled here.</span>
                  )}
                </div>

                {/* Attachment Preview */}
                {attachment && (
                  <div className="relative rounded-2xl border border-slate-800 bg-slate-950/60 overflow-hidden flex flex-col gap-2 p-2 relative z-10 max-w-full">
                    {attachment.type === "image" ? (
                      <div className="relative rounded-xl overflow-hidden max-h-[250px] w-full flex items-center justify-center bg-slate-900 border border-slate-800">
                        <img 
                          src={attachment.url} 
                          alt={attachment.name} 
                          className="max-h-[250px] w-auto object-contain hover:scale-101 transition-transform duration-300"
                        />
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2 w-full">
                        <div className="p-3 bg-slate-900/50 rounded-xl flex items-center justify-between border border-slate-800/80 gap-3">
                          <div className="flex items-center gap-2.5 overflow-hidden">
                            <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                              <File className="w-4 h-4 text-red-400" />
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-[11px] font-bold text-slate-200 truncate">{attachment.name}</span>
                              <span className="text-[9px] text-slate-500 font-bold uppercase">
                                PDF Document{attachment.pages && attachment.pages > 0 ? ` • ${attachment.pages} ${attachment.pages === 1 ? 'page' : 'pages'}` : ""}
                              </span>
                            </div>
                          </div>
                          <a 
                            href={attachment.url} 
                            target="_blank" 
                            rel="noreferrer"
                            className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-slate-100 font-bold text-[10px] transition-all cursor-pointer flex items-center gap-1 shrink-0"
                          >
                            <Eye className="w-3 h-3" />
                            Open
                          </a>
                        </div>
                        {/* Interactive PDF Preview Iframe */}
                        <div className="w-full h-[220px] rounded-xl overflow-hidden border border-slate-800 bg-slate-950 relative">
                          <iframe
                            src={`${attachment.url}#toolbar=0`}
                            className="w-full h-full border-none"
                            title="PDF Preview"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Vocal Reader Preview */}
                <div className="mt-2 pt-4 border-t border-slate-800/60 flex items-center gap-3.5 relative z-10">
                  <BrandedLogo size="sm" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Includes Audio Reader</span>
                </div>

              </div>

              {/* Additional Database-less Tech Info Card */}
              <div className="p-4 rounded-2xl bg-slate-900/20 border border-slate-800/80 backdrop-blur-md flex gap-4.5 items-start">
                <BrandedLogo size="sm" />
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold text-slate-300">How is this database-less?</span>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    When you click generate, we encode the JSON object representing your note using a custom URL-safe Base64 conversion sequence. The entire content of your note is stored as the value of the URL parameter <code className="text-indigo-400/90 font-mono text-[10px]">#n=...</code>. Sharing the URL shares the data directly, instantly rendering it on your recipient's screen.
                  </p>
                </div>
              </div>

            </div>

          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
