"use client";

import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { useAudio } from "@/components/audio-provider";
import {
  Search,
  Sparkles,
  Loader2,
  Calendar,
  BookOpen,
  ExternalLink,
  X,
  Play,
  Pause,
  Volume2,
  ArrowRight,
  AlertTriangle,
  Globe,
  Newspaper,
  Download
} from "lucide-react";

interface Article {
  article_id: string;
  title: string;
  link: string;
  description: string;
  content: string;
  pubDate: string;
  image_url: string | null;
  source_name: string;
  source_icon: string | null;
}

interface LogoLoaderProps {
  message?: string;
  small?: boolean;
}

const LogoLoader = ({ message = "Generating AI Articles Feed...", small = false }: LogoLoaderProps) => (
  <div className={`flex flex-col items-center justify-center w-full animate-in fade-in duration-300 ${small ? "py-8" : "py-20"}`}>
    <div className="relative flex items-center justify-center">
      {/* Outer glowing rings */}
      <div className={`absolute inset-0 rounded-full border border-yellow-400/20 animate-[spin_8s_linear_infinite] pointer-events-none ${small ? "scale-125" : "scale-135"}`} />
      <div className={`absolute inset-0 rounded-full border border-dashed border-indigo-400/40 animate-[spin_4s_linear_infinite_reverse] pointer-events-none ${small ? "scale-110" : "scale-115"}`} />
      <div className="absolute inset-0 rounded-full bg-indigo-500/10 blur-xl scale-75 animate-pulse" />

      {/* Logo mark with yellow ring */}
      <div className={`rounded-full bg-slate-900 border-2 border-yellow-400/80 flex items-center justify-center overflow-hidden shadow-md shadow-yellow-500/10 animate-bounce ${small ? "w-10 h-10 p-1" : "w-14 h-14 p-1.5"}`}>
        <img
          src="/logo-mark.png"
          alt="Logo"
          className="w-full h-full object-contain"
        />
      </div>
    </div>
    {message && (
      <p className={`font-bold text-slate-400 tracking-widest uppercase animate-pulse flex items-center justify-center gap-1.5 ${small ? "mt-4 text-[9px] sm:text-[10px]" : "mt-6 text-[10px] sm:text-xs"}`}>
        <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
        {message}
      </p>
    )}
  </div>
);

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [articleContent, setArticleContent] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [viewMode, setViewMode] = useState<"full" | "summary">("full");
  const [isSynthesizing, setIsSynthesizing] = useState<boolean>(false);
  const [isTabLoading, setIsTabLoading] = useState<boolean>(false);

  const { isPlaying, playTTS, stopTTS, currentTrack, progress, voiceType, setVoiceType } = useAudio();

  // Set document title
  useEffect(() => {
    document.title = "AI News & Articles - GenAI Academy & Hub";
  }, []);

  // Fetch news from API route proxy
  const fetchArticles = useCallback(async (query: string = "") => {
    setLoading(true);
    setError(null);
    try {
      const q = query.trim() || "artificial intelligence";
      const res = await fetch(`/api/news?q=${encodeURIComponent(q)}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch articles (Status: ${res.status})`);
      }
      const data = await res.json();
      if (data.status === "error") {
        throw new Error(data.message || "Error from News API");
      }
      setArticles(data.results || []);
    } catch (err: any) {
      console.error("Error fetching news:", err);
      setError(err.message || "Failed to load articles. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchArticles(searchQuery);
  };

  const handleQuickSearch = (tag: string) => {
    setSearchQuery(tag);
    fetchArticles(tag);
  };

  const extractSummaryFromHtml = (html: string, fallback: string) => {
    const decodeHtmlEntities = (str: string) => {
      return str
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&nbsp;/g, ' ')
        .replace(/&rdquo;/g, '"')
        .replace(/&ldquo;/g, '"')
        .replace(/&rsquo;/g, "'")
        .replace(/&lsquo;/g, "'")
        .replace(/&mdash;/g, '—')
        .replace(/&ndash;/g, '–')
        .replace(/&#39;/g, "'")
        .replace(/&#x27;/g, "'")
        .replace(/&#x2F;/g, '/')
        .replace(/&#x60;/g, '`')
        .replace(/&#x3D;/g, '=');
    };

    const sourceText = html || fallback || "";
    // Clean HTML tags and entities
    let cleanText = decodeHtmlEntities(sourceText);
    cleanText = cleanText.replace(/<[^>]*>/g, " ");

    // Also decode again just in case there were nested entities
    cleanText = decodeHtmlEntities(cleanText);

    // Clean up multiple spaces/newlines
    cleanText = cleanText.replace(/\s+/g, " ").trim();

    // Split raw text into sentences
    let sentences = cleanText
      .split(/(?<=[.!?])\s+(?=[A-Z0-9“"'])/g)
      .map(s => s.trim())
      .filter(s => s.length > 20 && !s.includes("Related:") && !s.includes("Read more") && !s.includes("Follow live") && !s.includes("Share on "));

    // If sentences has fewer than 5 items, try to split at semicolons
    if (sentences.length < 5) {
      const subSentences: string[] = [];
      for (const sent of sentences) {
        if (subSentences.length >= 5) {
          subSentences.push(sent);
          continue;
        }
        const parts = sent.split(/;\s+/).map(p => p.trim());
        if (parts.length > 1) {
          parts.forEach((p, idx) => {
            if (p.length > 0) {
              const capitalized = p.charAt(0).toUpperCase() + p.slice(1);
              const suffix = idx === parts.length - 1 ? "" : ".";
              subSentences.push(capitalized + suffix);
            }
          });
        } else {
          subSentences.push(sent);
        }
      }
      sentences = subSentences.filter(s => s.length > 15);
    }

    // If still less than 5, try splitting long sentences on ', and ' or ', but '
    if (sentences.length < 5) {
      const subSentences: string[] = [];
      for (const sent of sentences) {
        if (subSentences.length >= 5) {
          subSentences.push(sent);
          continue;
        }
        const parts = sent.split(/,\s+(?:and|but|or)\s+/i).map(p => p.trim());
        if (parts.length > 1 && sent.length > 60) {
          parts.forEach((p, idx) => {
            if (p.length > 0) {
              const capitalized = p.charAt(0).toUpperCase() + p.slice(1);
              const hasTerminator = /[.!?]$/.test(p);
              subSentences.push(capitalized + (hasTerminator ? "" : "."));
            }
          });
        } else {
          subSentences.push(sent);
        }
      }
      sentences = subSentences.filter(s => s.length > 15);
    }

    // Construct the final points
    const points: string[] = [];
    for (let i = 0; i < Math.min(sentences.length, 5); i++) {
      let p = sentences[i];
      if (!/[.!?]$/.test(p)) {
        p += ".";
      }
      points.push(p);
    }

    // Pad to EXACTLY 5 lines using contextual information if needed
    const padItems = [
      `Key tech insights compiled and presented by the ${selectedArticle?.source_name || "The Guardian"} news desk.`,
      `Published date and tracking reference for this update: ${formatDate(selectedArticle?.pubDate)}.`,
      `Explore related tutorials and courses on artificial intelligence in our GenAI Academy hub.`,
      `Read the original source coverage using the link provided above to get more details.`,
      `Stay tuned to the AI Research & News Hub for daily breakthroughs and technological progress.`
    ];

    while (points.length < 5) {
      const nextPad = padItems[points.length];
      if (nextPad) {
        points.push(nextPad);
      } else {
        points.push("Full coverage and detailed analysis is available inside the original publication.");
      }
    }

    // Return exactly 5 lines, formatted point-wise
    return points.slice(0, 5).map(p => `- ${p}`).join("\n");
  };

  const handleOpenArticle = (article: Article) => {
    setSelectedArticle(article);
    setDrawerOpen(true);
    setViewMode("full");
    setArticleContent(article.content || article.description || "No description preview available for this headline.");

    // Simulate AI synthesis with a premium loader
    setIsSynthesizing(true);
    setTimeout(() => {
      setIsSynthesizing(false);
    }, 1200);
  };

  const handleViewModeChange = (mode: "full" | "summary") => {
    setViewMode(mode);
    stopTTS(); // Stop reading current text on mode switch

    // Simulate AI summary/compilation loader
    setIsTabLoading(true);
    setTimeout(() => {
      setIsTabLoading(false);
      if (selectedArticle) {
        if (mode === "summary") {
          setArticleContent(extractSummaryFromHtml(selectedArticle.content, selectedArticle.description));
        } else {
          setArticleContent(selectedArticle.content || selectedArticle.description || "No content available for this headline.");
        }
      }
    }, 600);
  };

  const isTtsPlaying = isPlaying && currentTrack === articleContent;

  const handleToggleTts = () => {
    if (isTtsPlaying) {
      stopTTS();
    } else {
      let textToSpeak = articleContent;
      if (/<[a-z/][\s\S]*>/i.test(textToSpeak)) {
        // Strip HTML tags for clean SpeechSynthesis
        textToSpeak = textToSpeak.replace(/<[^>]*>/g, "");
      } else {
        // Stripping markdown tags for cleaner vocal translation
        textToSpeak = textToSpeak
          .replace(/#+\s*/g, "")
          .replace(/\*\*+/g, "")
          .replace(/-\s*/g, "");
      }
      playTTS(textToSpeak.trim(), `Article: ${selectedArticle?.title}`);
    }
  };

  const handleDownloadPdf = () => {
    if (!selectedArticle) return;

    // Import jsPDF dynamically for Next.js SSR-safe loading
    import("jspdf").then(({ jsPDF }) => {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // Style setups
      doc.setFont("helvetica", "bold");

      // Title
      doc.setFontSize(16);
      doc.setTextColor(30, 27, 75); // Indigo/dark purple accent color

      const title = selectedArticle.title;
      const titleLines = doc.splitTextToSize(title, 180);

      let y = 20;
      doc.text(titleLines, 15, y);
      y += titleLines.length * 7;

      // Meta headers
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(100, 116, 139); // Slate meta color

      const source = selectedArticle.source_name || "The Guardian";
      const dateStr = formatDate(selectedArticle.pubDate);
      const docType = viewMode === "summary" ? "AI Point-wise Highlights" : "AI Synthesized Article Details";

      doc.text(`Source: ${source} | Published: ${dateStr}`, 15, y);
      y += 5.5;
      doc.text(`Document Type: ${docType}`, 15, y);
      y += 8;

      // Decorative line
      doc.setDrawColor(99, 102, 241); // Indigo color
      doc.setLineWidth(0.5);
      doc.line(15, y, 195, y);
      y += 10;

      // Content body text
      doc.setFont("helvetica", "normal");
      doc.setTextColor(51, 65, 85); // Slate body color

      let rawContent = articleContent;
      if (/<[a-z/][\s\S]*>/i.test(rawContent)) {
        // Strip Guardian HTML paragraph structures nicely
        rawContent = rawContent
          .replace(/<\/p>\s*<p>/gi, "\n\n")
          .replace(/<p>/gi, "")
          .replace(/<\/p>/gi, "")
          .replace(/<br\s*\/?>/gi, "\n")
          .replace(/<[^>]*>/g, "");
      }

      // Decode HTML entities
      const decodeHtmlEntities = (str: string) => {
        return str
          .replace(/&quot;/g, '"')
          .replace(/&apos;/g, "'")
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&amp;/g, '&')
          .replace(/&nbsp;/g, ' ')
          .replace(/&rdquo;/g, '"')
          .replace(/&ldquo;/g, '"')
          .replace(/&rsquo;/g, "'")
          .replace(/&lsquo;/g, "'")
          .replace(/&mdash;/g, '—')
          .replace(/&ndash;/g, '–')
          .replace(/&#39;/g, "'")
          .replace(/&#x27;/g, "'")
          .replace(/&#x2F;/g, '/')
          .replace(/&#x60;/g, '`')
          .replace(/&#x3D;/g, '=');
      };

      rawContent = decodeHtmlEntities(rawContent);
      rawContent = rawContent.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n");

      const paragraphs = rawContent.split("\n\n");

      doc.setFontSize(10);
      const pageHeight = doc.internal.pageSize.getHeight();

      for (const para of paragraphs) {
        if (!para.trim()) continue;

        let displayPara = para.trim();
        if (viewMode === "summary" && displayPara.startsWith("-")) {
          displayPara = "✦ " + displayPara.slice(1).trim();
        }

        const lines = doc.splitTextToSize(displayPara, 175);
        const paragraphHeight = lines.length * 5.5;

        if (y + paragraphHeight > pageHeight - 15) {
          doc.addPage();
          y = 20;
        }

        doc.text(lines, 15, y);
        y += paragraphHeight + 5.5;
      }

      // Footers on all pages
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(156, 163, 175);
        doc.text("GenAI Academy & Hub • AI Research Synthesis Engine", 15, pageHeight - 8);
        doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.getWidth() - 30, pageHeight - 8);
      }

      // Sanitized file output
      const safeTitle = selectedArticle.title
        .replace(/[^a-z0-9]/gi, "_")
        .toLowerCase()
        .substring(0, 45);

      const fileName = `${viewMode}_${safeTitle}.pdf`;
      doc.save(fileName);
    });
  };

  // Clean Markdown Renderer
  const formatMarkdown = (text: string) => {
    if (!text) return null;
    return text.split("\n").map((line, i) => {
      // Headers
      if (line.trim().startsWith("##")) {
        return (
          <h3 key={i} className="text-sm sm:text-base font-bold text-indigo-300 mt-5 mb-2 border-b border-indigo-950 pb-1 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            {line.replace(/^#+\s*/, "")}
          </h3>
        );
      }

      if (line.trim().startsWith("#")) {
        return (
          <h2 key={i} className="text-base sm:text-lg font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-300 mt-6 mb-3 border-b border-indigo-900/40 pb-1.5">
            {line.replace(/^#+\s*/, "")}
          </h2>
        );
      }

      // Inline Bold formatting
      const parts = line.split(/(\*\*.*?\*\*)/g);
      const formattedLine = parts.map((part, j) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={j} className="font-semibold text-teal-300">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return part;
      });

      // Bullets list items
      if (line.trim().match(/^(\d+\.|-|\*)\s/)) {
        return (
          <div key={i} className="flex gap-2 my-1.5 ml-2.5 text-slate-300 text-xs sm:text-sm leading-relaxed">
            <span className="text-indigo-400 font-bold text-xs mt-0.5">✦</span>
            <div>
              {formattedLine.map((p, k) => (
                <span key={k}>
                  {typeof p === 'string' ? p.replace(/^(\d+\.|-|\*)\s/, '') : p}
                </span>
              ))}
            </div>
          </div>
        );
      }

      return (
        <p key={i} className={line.trim() === "" ? "h-2.5" : "my-2 text-slate-300 text-xs sm:text-sm leading-relaxed"}>
          {formattedLine}
        </p>
      );
    });
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    try {
      const date = new Date(dateStr.replace(" ", "T"));
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
      });
    } catch (e) {
      return dateStr;
    }
  };

  const quickTags = ["LLMs", "Gemini", "Agents", "OpenAI", "Robotics", "Neural Networks"];

  const ArticleSkeleton = () => (
    <div className="bg-slate-900/20 border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between h-[380px] animate-pulse">
      <div>
        <div className="flex justify-between items-center mb-3">
          <div className="w-24 h-4 bg-slate-800/60 rounded" />
          <div className="w-16 h-3 bg-slate-800/60 rounded" />
        </div>
        <div className="aspect-video w-full bg-slate-800/50 rounded-xl mb-3" />
        <div className="w-3/4 h-5 bg-slate-800/60 rounded mb-2.5" />
        <div className="w-full h-3 bg-slate-800/40 rounded mb-1.5" />
        <div className="w-5/6 h-3 bg-slate-800/40 rounded" />
      </div>
      <div className="w-28 h-8 bg-slate-800/60 rounded mt-4" />
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-foreground font-sans">
      <Header />

      <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
        {/* Title Banner */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-indigo-950/20 via-slate-900/10 to-cyan-950/20 p-6 sm:p-8 flex flex-col gap-4 shadow-xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Newspaper className="w-5 h-5" />
            </div>
            <span className="text-xs font-extrabold uppercase tracking-widest text-indigo-400">Intelligence Newsroom</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-slate-100 via-indigo-200 to-cyan-100 bg-clip-text text-transparent">
            AI News Synthesis Hub
          </h1>

          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
            Real-time breakthroughs in Machine Learning. Click any card to dynamically synthesize AI articles, generate point-wise highlights, and play vocal guides.
          </p>

          {/* Search bar & Quick Tags */}
          <div className="mt-2 flex flex-col gap-3.5">
            <form onSubmit={handleSearchSubmit} className="relative flex items-center max-w-md w-full">
              <input
                type="text"
                placeholder="Search AI concepts (e.g. nlp, agent, transformers)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-4 pr-10 text-xs sm:text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner"
              />
              <button
                type="submit"
                className="absolute right-2 p-1.5 bg-indigo-600/15 hover:bg-indigo-600/30 text-indigo-400 rounded-lg transition-colors cursor-pointer"
                title="Execute Search"
              >
                <Search className="w-4 h-4" />
              </button>
            </form>

            <div className="flex flex-wrap gap-1.5 items-center">
              <span className="text-[10px] sm:text-xs font-semibold text-slate-500">Popular:</span>
              {quickTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleQuickSearch(tag)}
                  className="text-[10px] sm:text-xs bg-slate-900 border border-slate-800 hover:border-indigo-500/40 text-slate-400 hover:text-slate-200 px-2.5 py-1 rounded-full transition-all cursor-pointer"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-xs sm:text-sm animate-in fade-in duration-300">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <div>
              <p className="font-semibold">Failed to load live AI headlines</p>
              <p className="opacity-90">{error}</p>
            </div>
          </div>
        )}

        {/* Article Grid Container */}
        {loading ? (
          <LogoLoader message="Synthesizing Real-time AI News Feed..." />
        ) : articles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center border border-slate-800 border-dashed rounded-3xl bg-slate-900/5">
            <div className="w-12 h-12 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center mb-3.5 text-slate-500">
              <Globe className="w-6 h-6 animate-pulse" />
            </div>
            <h3 className="font-bold text-slate-300">No headlines found</h3>
            <p className="text-xs text-slate-500 max-w-[280px] mt-1.5">
              We couldn't locate any recent news articles for "{searchQuery || "artificial intelligence"}". Please refine your keywords.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 animate-in fade-in duration-500">
            {articles.map((article) => (
              <div
                key={article.article_id}
                className="bg-slate-900/20 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 flex flex-col justify-between transition-all duration-300 hover:scale-[1.015] hover:shadow-xl hover:shadow-indigo-500/[0.02] group/card relative overflow-hidden"
              >
                <div>
                  {/* Headline Header */}
                  <div className="flex justify-between items-center text-[10px] sm:text-xs text-slate-500 mb-3">
                    <span className="font-bold tracking-wider text-indigo-400 uppercase flex items-center gap-1">
                      {article.source_icon ? (
                        <img
                          src={article.source_icon}
                          alt={article.source_name}
                          className="w-3.5 h-3.5 rounded-full object-cover shrink-0"
                          onError={(e) => { e.currentTarget.style.display = "none"; }}
                        />
                      ) : (
                        <Globe className="w-3 h-3 text-indigo-400 shrink-0" />
                      )}
                      {article.source_name || "Global Media"}
                    </span>
                    <span className="flex items-center gap-1 font-medium">
                      <Calendar className="w-3 h-3 shrink-0" />
                      {formatDate(article.pubDate)}
                    </span>
                  </div>

                  {/* Headline Thumbnail */}
                  <div className="aspect-video w-full rounded-xl overflow-hidden mb-3 bg-slate-950 relative border border-slate-900 select-none">
                    {article.image_url && !imageErrors[article.article_id] ? (
                      <img
                        src={article.image_url}
                        alt={article.title}
                        className="w-full h-full object-cover transition-transform duration-500 scale-100 group-hover/card:scale-105"
                        onError={() => {
                          setImageErrors((prev) => ({ ...prev, [article.article_id]: true }));
                        }}
                      />
                    ) : (
                      /* Fallback Beautiful geometric pattern overlay when image fails/missing */
                      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/35 via-slate-900 to-cyan-950/35 flex items-center justify-center group-hover/card:brightness-110 transition-all pointer-events-none">
                        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />
                        <Sparkles className="w-7 h-7 text-indigo-500/60 animate-pulse" />
                      </div>
                    )}
                  </div>

                  {/* Headline Title */}
                  <h3 className="font-bold text-slate-100 text-sm sm:text-base tracking-tight mb-2 group-hover/card:text-indigo-200 transition-colors line-clamp-2 leading-snug">
                    {article.title}
                  </h3>

                  {/* Headline Snippet */}
                  <p className="text-slate-400 text-xs leading-relaxed line-clamp-3 mb-4 font-normal">
                    {article.description?.replace(/<[^>]*>/g, '') || "No description preview available for this headline. Click below to read more details."}
                  </p>
                </div>

                {/* Card Button */}
                <button
                  onClick={() => handleOpenArticle(article)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-950/20 hover:bg-indigo-650 text-indigo-400 hover:text-white border border-indigo-900/60 hover:border-indigo-550 transition-all duration-300 w-fit group/btn cursor-pointer hover:shadow-lg hover:shadow-indigo-500/10"
                >
                  <Sparkles className="w-3.5 h-3.5 shrink-0 group-hover/btn:rotate-12 transition-transform duration-300" />
                  AI Generate Article
                  <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover/btn:translate-x-0.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Drawer Overlay for AI Deep-Dive article details */}
      {drawerOpen && selectedArticle && (
        <>
          {/* Drawer Backdrop overlay */}
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
            onClick={() => setDrawerOpen(false)}
          />

          {/* Sliding sheet container */}
          <div className="fixed top-0 right-0 h-full w-full sm:w-[500px] md:w-[600px] bg-slate-950 border-l border-slate-900 shadow-2xl z-50 flex flex-col transform transition-transform duration-300 animate-in slide-in-from-right">
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-4 bg-slate-900/50 border-b border-slate-900 shrink-0">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span className="font-bold uppercase tracking-wider text-[10px] text-indigo-400">AI Research Synthesis Engine</span>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="w-8 h-8 rounded-lg bg-slate-900/50 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Content wrapper */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {isSynthesizing ? (
                <LogoLoader message="AI Synthesis Engine is generating article..." />
              ) : (
                <>
                  <div className="space-y-2.5">
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                      <span className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                        {selectedArticle.source_name || "News"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 shrink-0" />
                        {formatDate(selectedArticle.pubDate)}
                      </span>
                    </div>

                    <h1 className="text-lg sm:text-xl font-extrabold text-slate-100 tracking-tight leading-tight">
                      {selectedArticle.title}
                    </h1>

                    <a
                      href={selectedArticle.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
                    >
                      View Original Publications
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  {/* Tab Selector for view mode */}
                  <div className="flex bg-slate-900/60 p-1 rounded-xl border border-slate-900/85 gap-1 select-none w-full shrink-0">
                    <button
                      onClick={() => handleViewModeChange("full")}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-bold tracking-wide uppercase transition-all cursor-pointer ${viewMode === "full"
                          ? "bg-indigo-650 text-white shadow-md shadow-indigo-600/10"
                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
                        }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      AI Synthesized Article
                    </button>
                    <button
                      onClick={() => handleViewModeChange("summary")}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-bold tracking-wide uppercase transition-all cursor-pointer ${viewMode === "summary"
                          ? "bg-indigo-650 text-white shadow-md shadow-indigo-600/10"
                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
                        }`}
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      AI Point-wise Highlights
                    </button>
                  </div>

                  {/* Article Content Area */}
                  <div className="border border-slate-900 rounded-2xl bg-slate-900/10 p-5 space-y-4">
                    {isTabLoading ? (
                      <LogoLoader message={viewMode === "summary" ? "AI is generating summary highlights..." : "AI is compiling article structure..."} small />
                    ) : (
                      <div className="space-y-4">
                        {/* Audio TTS Guide Player */}
                        {articleContent && (
                          <div className="flex flex-col gap-2 p-3.5 bg-slate-950 border border-slate-900 rounded-xl">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Volume2 className="w-4 h-4 text-indigo-400" />
                                <span className="text-xs font-bold text-slate-300">AI Vocal Synthesis Guide</span>
                              </div>
                              {isTtsPlaying && (
                                <span className="text-[10px] text-slate-400 font-semibold animate-pulse">
                                  Playing ({Math.round(progress)}%)
                                </span>
                              )}
                            </div>

                            {/* Speech synthesis selector and control */}
                            <div className="flex flex-wrap items-center gap-2 justify-between mt-1.5">
                              <div className="flex gap-2">
                                <button
                                  onClick={handleToggleTts}
                                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${isTtsPlaying
                                      ? "bg-rose-600 text-white hover:bg-rose-500"
                                      : "bg-indigo-650/10 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/20 hover:border-transparent"
                                    }`}
                                >
                                  {isTtsPlaying ? (
                                    <>
                                      <Pause className="w-3 h-3 fill-current" /> Stop Audio
                                    </>
                                  ) : (
                                    <>
                                      <Play className="w-3 h-3 fill-current" /> Play Audio Guide
                                    </>
                                  )}
                                </button>

                                <button
                                  onClick={handleDownloadPdf}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-cyan-600/10 hover:bg-cyan-600 text-cyan-400 hover:text-white border border-cyan-500/20 hover:border-transparent transition-all cursor-pointer"
                                  title="Download this view as PDF"
                                >
                                  <Download className="w-3.5 h-3.5" /> Download PDF
                                </button>
                              </div>

                              <select
                                value={voiceType}
                                onChange={(e) => setVoiceType(e.target.value as any)}
                                className="bg-slate-900 border border-slate-800 text-[10px] text-slate-400 px-2 py-1 rounded focus:outline-none cursor-pointer font-medium"
                              >
                                <option value="default">System Default Voice</option>
                                <option value="female">Samantha (US Female)</option>
                                <option value="male">David (US Male)</option>
                                <option value="hi-IN">Aditi (Hindi/IN Accent)</option>
                                <option value="en-IN-female">Indian English (Stitched MP3)</option>
                              </select>
                            </div>

                            {/* Progress slider bar */}
                            {isTtsPlaying && (
                              <div className="w-full bg-slate-900 rounded-full h-1 mt-2.5 overflow-hidden">
                                <div
                                  className="bg-indigo-500 h-1 rounded-full transition-all duration-300"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                            )}
                          </div>
                        )}

                        {/* Content display (Supports both HTML from Guardian and Markdown) */}
                        {/<[a-z/][\s\S]*>/i.test(articleContent) ? (
                          <div
                            className="prose prose-invert prose-sm max-w-none text-slate-300 space-y-4 [&>p]:leading-relaxed [&>p]:text-xs [&>p]:sm:text-sm [&>p]:my-3 [&>a]:text-indigo-400 [&>a]:hover:underline [&>aside]:hidden"
                            dangerouslySetInnerHTML={{ __html: articleContent }}
                          />
                        ) : (
                          <div className="prose prose-invert prose-sm max-w-none text-slate-300">
                            {formatMarkdown(articleContent)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Drawer Footer info */}
            <div className="p-4 bg-slate-900/50 border-t border-slate-900 shrink-0 text-center text-[10px] text-slate-500 select-none">
              Global Newsroom • Information provided by original source.
            </div>
          </div>
        </>
      )}

      <Footer />
    </div>
  );
}
