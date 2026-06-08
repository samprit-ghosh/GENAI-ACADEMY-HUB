"use client";

import { useState, useRef } from "react";
import {
  Search,
  Loader2,
  ExternalLink,
  BookOpen,
  GraduationCap,
  FileText,
} from "lucide-react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useEffect } from "react";
import type { ResearchPaper, Course } from "@/lib/types";
import type { SelectedDocument } from "@/app/page";

type RadarSidebarProps = {
  filter: string;
  setFilter: (filter: string) => void;
  papers: ResearchPaper[];
  courses: Course[];
  loading: boolean;
  onSearch: (query: string) => void;
  onSelectDocument: (doc: SelectedDocument) => void;
  selectedDocument?: SelectedDocument | null;
  compareDocument?: SelectedDocument | null;
  loadMorePapers?: () => void;
  hasMorePapers?: boolean;
  isLoadingMorePapers?: boolean;
};

export function RadarSidebar({
  filter,
  setFilter,
  papers,
  courses,
  loading,
  onSearch,
  onSelectDocument,
  selectedDocument,
  compareDocument,
  loadMorePapers,
  hasMorePapers,
  isLoadingMorePapers,
}: RadarSidebarProps) {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"papers" | "courses">("papers");
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: hasMorePapers ? papers.length + 1 : papers.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100,
    overscan: 5,
  });

  useEffect(() => {
    const [lastItem] = [...rowVirtualizer.getVirtualItems()].reverse();
    if (
      lastItem &&
      lastItem.index >= papers.length - 1 &&
      hasMorePapers &&
      !isLoadingMorePapers
    ) {
      loadMorePapers?.();
    }
  }, [
    hasMorePapers,
    isLoadingMorePapers,
    papers.length,
    rowVirtualizer.getVirtualItems(),
    loadMorePapers,
  ]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onSearch(value);
    }, 400);
  };

  // Filter courses by type
  const filteredCourses =
    filter === "all"
      ? courses
      : filter === "free"
      ? courses.filter((c) => c.type === "free")
      : courses.filter((c) => c.type === "paid");

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border bg-card/80 backdrop-blur-md">
        <h2 className="text-xl font-bold tracking-tight bg-gradient-to-br from-primary to-primary/60 bg-clip-text text-transparent mb-4">
          GENAI ACADEMY & HUB
        </h2>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={
              activeTab === "papers"
                ? "Search research papers..."
                : "Search courses..."
            }
            className="w-full bg-muted/50 border border-border/50 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
      </div>

      {/* Main Tab Switcher: Papers vs Courses */}
      <div className="border-b border-border bg-muted/10">
        <div className="flex">
          <button
            onClick={() => setActiveTab("papers")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-all border-b-2 ${
              activeTab === "papers"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <FileText className="w-4 h-4" />
            Research Papers
          </button>
          <button
            onClick={() => setActiveTab("courses")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-all border-b-2 ${
              activeTab === "courses"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            Courses
          </button>
        </div>
      </div>

      {/* Sub-filter for Courses tab */}
      {activeTab === "courses" && (
        <div className="p-3 border-b border-border bg-muted/20">
          <div className="flex items-center space-x-1 bg-muted/50 p-1 rounded-md">
            {["All", "Free", "Paid"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f.toLowerCase())}
                className={`flex-1 text-xs font-medium py-1.5 rounded-sm transition-all ${
                  filter === f.toLowerCase()
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      )}



      {/* Content */}
      <div className="flex-1 overflow-y-auto" ref={parentRef}>
        {loading && papers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
            <p className="text-sm text-muted-foreground">
              {activeTab === "papers"
                ? "Fetching latest research papers..."
                : "Loading courses..."}
            </p>
          </div>
        ) : activeTab === "papers" ? (
          /* ─── PAPERS TAB ─────────────────────────────────────────── */
          <div 
            className="w-full relative"
            style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
          >
            {papers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center w-full absolute top-0">
                <BookOpen className="w-8 h-8 text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground">
                  No papers found.
                </p>
              </div>
            ) : (
              rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const isLoaderRow = virtualRow.index > papers.length - 1;
                
                if (isLoaderRow) {
                  return (
                    <div
                      key="loader"
                      ref={rowVirtualizer.measureElement}
                      data-index={virtualRow.index}
                      className="absolute top-0 left-0 w-full p-4 flex justify-center"
                      style={{ transform: `translateY(${virtualRow.start}px)` }}
                    >
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                  );
                }

                const p = papers[virtualRow.index];
                const isSelected = selectedDocument?.kind === "paper" && selectedDocument.paper.id === p.id;
                const isCompared = compareDocument?.kind === "paper" && compareDocument.paper.id === p.id;
                const isActive = isSelected || isCompared;

                return (
                  <div
                    key={p.id}
                    ref={rowVirtualizer.measureElement}
                    data-index={virtualRow.index}
                    className="absolute top-0 left-0 w-full px-3 pb-1"
                    style={{ transform: `translateY(${virtualRow.start}px)` }}
                  >
                    <button
                      onClick={() =>
                        onSelectDocument({ kind: "paper", paper: p })
                      }
                      className={`w-full text-left p-3 rounded-lg border transition-all group ${
                        isActive
                          ? isSelected
                            ? "border-blue-500 bg-blue-500/10 shadow-[0_0_15px_rgba(59,130,246,0.15)] ring-1 ring-blue-500/30"
                            : "border-purple-500 bg-purple-500/10 shadow-[0_0_15px_rgba(168,85,247,0.15)] ring-1 ring-purple-500/30"
                          : "border-transparent hover:border-blue-500/30 hover:bg-blue-500/5"
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <div className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${isActive ? isSelected ? "bg-blue-500/20" : "bg-purple-500/20" : "bg-blue-500/10"}`}>
                          <FileText className={`w-4 h-4 ${isActive ? isSelected ? "text-blue-400" : "text-purple-400" : "text-blue-400"}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className={`text-sm font-medium transition-colors block leading-snug ${isActive ? "text-foreground" : "group-hover:text-blue-400"}`}>
                            {p.title}
                          </span>
                          <span className={`text-xs block mt-1 ${isActive ? "text-muted-foreground" : "text-muted-foreground"}`}>
                            {p.authors.slice(0, 3).join(", ")}
                            {p.authors.length > 3 && ` +${p.authors.length - 3} more`}
                          </span>
                          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                            <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-sm ${isActive ? isSelected ? "bg-blue-500/30 text-blue-300" : "bg-purple-500/30 text-purple-300" : "bg-blue-500/20 text-blue-400"}`}>
                              PDF
                            </span>
                            {p.categories.slice(0, 2).map((cat) => (
                              <span
                                key={cat}
                                className="text-[10px] px-1.5 py-0.5 rounded-sm bg-muted text-muted-foreground"
                              >
                                {cat}
                              </span>
                            ))}
                            <span className="text-[10px] text-muted-foreground ml-auto">
                              {new Date(p.publishedDate).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          /* ─── COURSES TAB ────────────────────────────────────────── */
          <div className="p-3 space-y-1">
            {filteredCourses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <GraduationCap className="w-8 h-8 text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground">
                  No courses found.
                </p>
              </div>
            ) : (
              filteredCourses.map((c) => {
                const isSelected = selectedDocument?.kind === "course" && selectedDocument.course.id === c.id;
                const isCompared = compareDocument?.kind === "course" && compareDocument.course.id === c.id;
                const isActive = isSelected || isCompared;
                const isFree = c.type === "free";

                return (
                  <button
                    key={c.id}
                    onClick={() =>
                      onSelectDocument({ kind: "course", course: c })
                    }
                    className={`w-full text-left p-3 rounded-lg border transition-all group ${
                      isActive
                        ? isSelected
                          ? isFree
                            ? "border-green-500 bg-green-500/10 shadow-[0_0_15px_rgba(34,197,94,0.15)] ring-1 ring-green-500/30"
                            : "border-purple-500 bg-purple-500/10 shadow-[0_0_15px_rgba(168,85,247,0.15)] ring-1 ring-purple-500/30"
                          : "border-blue-500 bg-blue-500/10 shadow-[0_0_15px_rgba(59,130,246,0.15)] ring-1 ring-blue-500/30"
                        : isFree
                          ? "border-transparent hover:border-green-500/30 hover:bg-green-500/5"
                          : "border-transparent hover:border-purple-500/30 hover:bg-purple-500/5"
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div
                        className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
                          isActive
                            ? isSelected
                              ? isFree ? "bg-green-500/20" : "bg-purple-500/20"
                              : "bg-blue-500/20"
                            : isFree ? "bg-green-500/10" : "bg-purple-500/10"
                        }`}
                      >
                        <GraduationCap
                          className={`w-4 h-4 ${
                            isActive
                              ? isSelected
                                ? isFree ? "text-green-400" : "text-purple-400"
                                : "text-blue-400"
                              : isFree ? "text-green-400" : "text-purple-400"
                          }`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-sm shrink-0 ${
                              isActive
                                ? isSelected
                                  ? isFree ? "bg-green-500/30 text-green-300" : "bg-purple-500/30 text-purple-300"
                                  : "bg-blue-500/30 text-blue-300"
                                : isFree ? "bg-green-500/20 text-green-400" : "bg-purple-500/20 text-purple-400"
                            }`}
                          >
                            {c.type}
                          </span>
                          <span className="text-[10px] uppercase font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded-sm shrink-0">
                            {c.platform}
                          </span>
                        </div>
                        <span
                          className={`text-sm font-medium transition-colors block truncate ${
                            isActive ? "text-foreground" : isFree ? "group-hover:text-green-400" : "group-hover:text-purple-400"
                          }`}
                        >
                          {c.title}
                        </span>
                        <span className="text-xs text-muted-foreground block mt-0.5">
                          {c.creator}
                        </span>
                      </div>
                      <ExternalLink className={`w-3.5 h-3.5 shrink-0 mt-1 ${isActive ? "text-primary/50" : "text-muted-foreground/30"}`} />
                    </div>
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
