"use client";

import { X, Volume2, Download, FileText, Beaker, Users, BarChart3, Pause } from "lucide-react";
import type { SelectedDocument } from "@/app/page";
import { useAudio } from "@/components/audio-provider";

type ComparisonModalProps = {
  leftDoc: SelectedDocument;
  rightDoc: SelectedDocument;
  onClose: () => void;
};

export function ComparisonModal({ leftDoc, rightDoc, onClose }: ComparisonModalProps) {
  const { playTTS, stopTTS, isPlaying, trackTitle } = useAudio();

  // We only compare papers in this app context based on current implementation
  if (leftDoc?.kind !== "paper" || rightDoc?.kind !== "paper") return null;

  const p1 = leftDoc.paper;
  const p2 = rightDoc.paper;

  // Pre-compute shared categories
  const sharedCategories = p1.categories.filter((c) => p2.categories.includes(c));

  // ─── REPORT SECTIONS DATA ───
  const topics = [
    {
      id: "focus",
      icon: <FileText className="w-5 h-5 text-fuchsia-400" />,
      title: "Core Focus & Methodology",
      color: "from-fuchsia-500/20 to-pink-500/10",
      border: "border-fuchsia-500/30",
      contentLeft: p1.summary,
      contentRight: p2.summary,
      ttsText: `Comparing Core Focus. Paper 1, titled ${p1.title}, focuses on: ${p1.summary}. In contrast, Paper 2, titled ${p2.title}, focuses on: ${p2.summary}.`,
    },
    {
      id: "domains",
      icon: <Beaker className="w-5 h-5 text-blue-400" />,
      title: "Research Domains",
      color: "from-blue-500/20 to-cyan-500/10",
      border: "border-blue-500/30",
      contentLeft: p1.categories.join(", "),
      contentRight: p2.categories.join(", "),
      shared: sharedCategories.length > 0 ? `Shared domains: ${sharedCategories.join(", ")}` : "No shared domains.",
      ttsText: `Comparing Research Domains. Paper 1 belongs to categories: ${p1.categories.join(", ")}. Paper 2 belongs to: ${p2.categories.join(", ")}. ${sharedCategories.length > 0 ? `Both papers share the following domains: ${sharedCategories.join(", ")}.` : 'They do not share any domains.'}`,
    },
    {
      id: "authorship",
      icon: <Users className="w-5 h-5 text-emerald-400" />,
      title: "Authorship & Timeline",
      color: "from-emerald-500/20 to-teal-500/10",
      border: "border-emerald-500/30",
      contentLeft: `Authors: ${p1.authors.join(", ")}\nPublished: ${new Date(p1.publishedDate).toLocaleDateString()}`,
      contentRight: `Authors: ${p2.authors.join(", ")}\nPublished: ${new Date(p2.publishedDate).toLocaleDateString()}`,
      ttsText: `Comparing Authorship and Timeline. Paper 1 was authored by ${p1.authors.slice(0, 3).join(", ")} and others, published on ${new Date(p1.publishedDate).toLocaleDateString()}. Paper 2 was authored by ${p2.authors.slice(0, 3).join(", ")} and others, published on ${new Date(p2.publishedDate).toLocaleDateString()}.`,
    },
    {
      id: "metrics",
      icon: <BarChart3 className="w-5 h-5 text-orange-400" />,
      title: "Metrics & Stats",
      color: "from-orange-500/20 to-amber-500/10",
      border: "border-orange-500/30",
      contentLeft: `Abstract Length: ${p1.summary.split(" ").length} words\nAuthor Count: ${p1.authors.length}`,
      contentRight: `Abstract Length: ${p2.summary.split(" ").length} words\nAuthor Count: ${p2.authors.length}`,
      ttsText: `Comparing Metrics. Paper 1 has ${p1.authors.length} authors and an abstract length of ${p1.summary.split(" ").length} words. Paper 2 has ${p2.authors.length} authors and an abstract length of ${p2.summary.split(" ").length} words.`,
    }
  ];

  const handleDownload = () => {
    let reportText = `=== COMPARISON REPORT ===\n\n`;
    reportText += `Document 1 (Left): ${p1.title}\n`;
    reportText += `Document 2 (Right): ${p2.title}\n`;
    reportText += `\n=========================\n\n`;

    topics.forEach((topic) => {
      reportText += `--- ${topic.title.toUpperCase()} ---\n\n`;
      reportText += `[Document 1]:\n${topic.contentLeft}\n\n`;
      reportText += `[Document 2]:\n${topic.contentRight}\n\n`;
      if (topic.shared) {
        reportText += `[Analysis]: ${topic.shared}\n\n`;
      }
    });

    const blob = new Blob([reportText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Comparison_Report_${new Date().getTime()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleListenAll = () => {
    const fullText = topics.map(t => t.ttsText).join(" Next topic. ");
    playTTS(`Starting Comparison Report. ${fullText} End of report.`, "Full Comparison Report");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-300">
      {/* Glassmorphic Backdrop */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-xl transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-5xl max-h-full flex flex-col bg-card/90 border border-border/50 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 lg:p-6 border-b border-border/50 bg-gradient-to-r from-muted/50 to-transparent">
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              Topic-by-Topic Comparison Report
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Analyzing key differences between the selected research papers.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleListenAll}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm text-fuchsia-400 bg-fuchsia-500/10 hover:bg-fuchsia-500/20 border border-fuchsia-500/20 transition-colors"
            >
              {isPlaying && trackTitle === "Full Comparison Report" ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
              {isPlaying && trackTitle === "Full Comparison Report" ? "Playing..." : "Listen to Full Report"}
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm text-white bg-gradient-to-r from-blue-600 to-cyan-500 shadow-md hover:shadow-cyan-500/20 hover:scale-105 transition-all"
            >
              <Download className="w-4 h-4" />
              Download Text Report
            </button>
            <div className="w-px h-6 bg-border mx-1" />
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-muted/50 text-muted-foreground hover:bg-red-500/20 hover:text-red-400 transition-colors"
              title="Close Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 px-6 py-3 bg-muted/30 border-b border-border/50 text-xs font-semibold uppercase tracking-wider">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.5)]" />
            <span className="text-muted-foreground max-w-[300px] truncate" title={p1.title}>Left: {p1.title}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.5)]" />
            <span className="text-muted-foreground max-w-[300px] truncate" title={p2.title}>Right: {p2.title}</span>
          </div>
        </div>

        {/* Scrollable Topics */}
        <div className="flex-1 overflow-y-auto p-5 lg:p-6 space-y-6">
          {topics.map((topic) => (
            <div key={topic.id} className={`flex flex-col bg-gradient-to-br ${topic.color} border ${topic.border} rounded-xl overflow-hidden`}>
              
              {/* Topic Header */}
              <div className="flex items-center justify-between p-3 border-b border-black/5 bg-black/10">
                <div className="flex items-center gap-2.5">
                  {topic.icon}
                  <h3 className="font-semibold text-foreground tracking-wide">{topic.title}</h3>
                </div>
                <button
                  onClick={() => isPlaying && trackTitle === topic.title ? stopTTS() : playTTS(topic.ttsText, topic.title)}
                  className="p-1.5 rounded-md hover:bg-black/20 text-muted-foreground hover:text-foreground transition-colors"
                  title={`Listen to ${topic.title} comparison`}
                >
                  {isPlaying && trackTitle === topic.title ? <Pause className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
              </div>

              {/* Topic Content */}
              <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-black/10">
                <div className="flex-1 p-4 bg-blue-500/5">
                  <span className="text-[10px] uppercase font-bold text-blue-400 mb-2 block">Document 1 (Left)</span>
                  <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{topic.contentLeft}</p>
                </div>
                <div className="flex-1 p-4 bg-purple-500/5">
                  <span className="text-[10px] uppercase font-bold text-purple-400 mb-2 block">Document 2 (Right)</span>
                  <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{topic.contentRight}</p>
                </div>
              </div>

              {/* Shared / Analysis (optional) */}
              {topic.shared && (
                <div className="p-3 bg-black/20 border-t border-black/10 flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold text-green-400">Analysis</span>
                  <p className="text-xs text-foreground/70">{topic.shared}</p>
                </div>
              )}
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
