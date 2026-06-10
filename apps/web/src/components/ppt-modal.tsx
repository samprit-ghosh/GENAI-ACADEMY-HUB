"use client";

import { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight, Play, Pause, Presentation, Download, Loader2 } from "lucide-react";
import pptxgen from "pptxgenjs";
import type { SelectedDocument } from "@/app/page-client";

function SlideImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
  }, [src]);

  return (
    <div className="relative w-full h-full flex items-center justify-center min-h-0 min-w-0">
      {isLoading && !hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50/50 backdrop-blur-[1px] gap-2 rounded-xl z-20">
          <Loader2 className="w-[4cqw] h-[4cqw] text-indigo-500 animate-spin" />
          <span className="text-[1.3cqw] text-indigo-500 font-semibold animate-pulse">Loading image...</span>
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={`${className} transition-opacity duration-300 ${isLoading ? "opacity-0" : "opacity-100"}`}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
      />
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100 rounded-xl p-[2cqw] text-center z-20">
          <span className="text-[1.4cqw] text-slate-400 font-medium">Failed to load slide image</span>
        </div>
      )}
    </div>
  );
}

type PptModalProps = {
  document: SelectedDocument;
  onClose: () => void;
};

export function PptModal({ document, onClose }: PptModalProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGenerating, setIsGenerating] = useState(true);
  const [genStep, setGenStep] = useState(0);

  useEffect(() => {
    if (isGenerating) {
      const stepTimer1 = setTimeout(() => setGenStep(1), 600);
      const stepTimer2 = setTimeout(() => setGenStep(2), 1200);
      const stepTimer3 = setTimeout(() => setGenStep(3), 1700);
      
      const doneTimer = setTimeout(() => {
        setIsGenerating(false);
      }, 2100);
      
      return () => {
        clearTimeout(stepTimer1);
        clearTimeout(stepTimer2);
        clearTimeout(stepTimer3);
        clearTimeout(doneTimer);
      };
    }
  }, [isGenerating]);

  type Slide = {
    type: "title" | "content";
    title: string;
    subtitle: string;
    bullets: string[];
    layout: "title" | "intro" | "objectives" | "scope" | "timeline" | "budget" | "conclusion";
    bgColor: string;
    textColor: string;
    imageUrl: string;
    bgStyle: "solid" | "gradient" | "gradient-radial" | "pattern" | "pattern-dots" | "image";
    bgImageUrl: string;
  };

  const [slides, setSlides] = useState<Slide[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);

  const toNormalCasing = (str: string): string => {
    if (!str) return "";
    if (str === str.toUpperCase()) {
      return str
        .toLowerCase()
        .split(" ")
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
    }
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  // Generate slides and load images dynamically when document changes
  useEffect(() => {
    if (!document || document.kind !== "paper") return;
    
    const p = document.paper;
    
    // Split summary into sentences and make them concise "points"
    const sentences = p.summary
      .replace(/([.?!])\s*(?=[A-Z])/g, "$1|")
      .split("|")
      .map(s => s.trim().replace(/^(Furthermore|Moreover|However|Finally|In addition),\s*/i, ''))
      .filter(s => s.length > 20)
      .map(s => s.length > 140 ? s.substring(0, 137).trim() + "..." : s);

    // Number of content slides (max 2 points per slide)
    const contentSlidesCount = Math.ceil(sentences.length / 2);
    const totalSlidesCount = contentSlidesCount + 2; // Title + Content + Conclusion

    // Helper for splitting a sentence into heading and detail
    const splitSentence = (s: string): [string, string] => {
      const words = s.split(/\s+/);
      if (words.length <= 4) {
        return [s, s];
      }
      let headingWords = words.slice(0, 3);
      let heading = headingWords.join(" ");
      if (heading.length > 25) {
        headingWords = words.slice(0, 2);
        heading = headingWords.join(" ");
      }
      heading = heading.charAt(0).toUpperCase() + heading.slice(1);
      heading = heading.replace(/[,.;:]+$/, "");
      const desc = words.slice(headingWords.length).join(" ");
      return [heading, desc];
    };

    // Helper to get layout by index
    const getLayoutForIndex = (idx: number, total: number): Slide["layout"] => {
      if (idx === 0) return "title";
      if (idx === total - 1) return "conclusion";
      const layouts: Slide["layout"][] = ["intro", "objectives", "scope", "timeline", "budget"];
      return layouts[(idx - 1) % layouts.length];
    };

    const initialSlides: Slide[] = [];

    // Slide 1: Title
    initialSlides.push({
      type: "title",
      title: p.title,
      subtitle: `Authors: ${p.authors.slice(0, 3).join(", ")}${p.authors.length > 3 ? " et al." : ""} | Published: ${new Date(p.publishedDate).toLocaleDateString()} | Categories: ${p.categories.slice(0, 3).join(", ")}`,
      bullets: [],
      layout: "title",
      bgColor: "#FFFFFF",
      textColor: "#0F172A",
      imageUrl: "",
      bgStyle: "solid",
      bgImageUrl: ""
    });

    // Content Slides
    for (let i = 0; i < sentences.length; i += 2) {
      const currentIdx = initialSlides.length;
      const layout = getLayoutForIndex(currentIdx, totalSlidesCount);
      const points = sentences.slice(i, i + 2);
      
      let title = "Key Findings";
      let formattedBullets: string[] = [];

      if (layout === "intro") {
        title = "Executive Summary";
        formattedBullets.push(points[0]);
        if (points[1]) {
          const [h, d] = splitSentence(points[1]);
          formattedBullets.push(`${h}: ${Math.floor(Math.random() * 20) + 70}%`);
        }
      } else if (layout === "objectives") {
        title = "Research Objectives";
        formattedBullets = points.map((pt) => {
          const [h, d] = splitSentence(pt);
          return `${h} | ${d}`;
        });
      } else if (layout === "scope") {
        title = "Scope of Research";
        formattedBullets = points.map((pt) => {
          const [h, d] = splitSentence(pt);
          return `${h} | ${d}`;
        });
      } else if (layout === "timeline") {
        title = "Project Timeline";
        formattedBullets = points.map((pt) => {
          const [h, d] = splitSentence(pt);
          return `${h} | ${d}`;
        });
      } else if (layout === "budget") {
        title = "Resource Allocation";
        formattedBullets = points.map((pt) => {
          const [h, d] = splitSentence(pt);
          const mockAmt = `$${Math.floor(Math.random() * 40) + 40}K`;
          return `${h} | ${mockAmt} | ${d}`;
        });
      }

      initialSlides.push({
        type: "content",
        title,
        subtitle: "",
        bullets: formattedBullets,
        layout,
        bgColor: "#FFFFFF",
        textColor: "#0F172A",
        imageUrl: "",
        bgStyle: "solid",
        bgImageUrl: ""
      });
    }

    // Slide N: Conclusion
    initialSlides.push({
      type: "content",
      title: "Conclusion",
      subtitle: "This journal review summarizes the main achievements, methodology, and objectives of the research.",
      bullets: sentences.slice(-2).map((pt) => {
        const [h, d] = splitSentence(pt);
        return `${h} | ${d}`;
      }),
      layout: "conclusion",
      bgColor: "#FFFFFF",
      textColor: "#0F172A",
      imageUrl: "",
      bgStyle: "solid",
      bgImageUrl: ""
    });

    setSlides(initialSlides);
    setCurrentSlide(0);

    // Fetch PDF images asynchronously
    setLoadingImages(true);
    fetch(`/api/pdf-images?id=${encodeURIComponent(p.id)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.images && data.images.length > 0) {
          setSlides((prev) => {
            const updated = [...prev];
            // Place image 1 on index 1 (intro layout / executive summary)
            if (updated[1] && data.images[0]) {
              updated[1] = { ...updated[1], imageUrl: data.images[0] };
            }
            // Place image 2 on index 3 (scope layout)
            if (updated[3] && data.images[1]) {
              updated[3] = { ...updated[3], imageUrl: data.images[1] };
            } else if (updated[2] && data.images[1]) {
              // Fallback to objectives if index 3 is not present
              updated[2] = { ...updated[2], imageUrl: data.images[1] };
            }
            return updated;
          });
        }
      })
      .catch((err) => console.error("Error fetching paper images:", err))
      .finally(() => setLoadingImages(false));

  }, [document]);

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
    
    slides.forEach((s, idx) => {
      const slide = pptx.addSlide();
      const layout = s.layout || (s.type === "title" ? "title" : "intro");
      
      // Clean, professional white background
      slide.background = { fill: "FFFFFF" };
      
      if (layout === "title") {
        const parts = s.title.split("|");
        const part1 = parts[0]?.trim() || "Project";
        const part2 = parts[1]?.trim() || "";

        const titleText1 = toNormalCasing(part1);
        const titleText2 = part2 ? toNormalCasing(part2) : "";

        // SlideEgg Title Layout
        // 1. Right side violet shape block
        slide.addShape('roundRect', {
          x: 10.48, y: 1.45, w: 2.86, h: 3.83,
          fill: { color: '6F51D3' },
          line: { color: '6F51D3' }
        });

        // 2. White card overlay
        slide.addShape('roundRect', {
          x: 9.55, y: 3.54, w: 2.12, h: 2.12,
          fill: { color: 'FFFFFF' },
          line: { color: 'E2E8F0', width: 2 }
        });

        // Badge inside white card
        slide.addText([
          { text: "PRESENTATION\n", options: { fontSize: 12, color: '6F51D3', bold: true, align: 'center' } },
          { text: toNormalCasing(part1.split(" ").slice(0, 2).join(" ") || "GenAI"), options: { fontSize: 16, color: '0F172A', bold: true, align: 'center' } }
        ], {
          x: 9.55, y: 3.84, w: 2.12, h: 1.5,
          align: 'center',
          valign: 'middle'
        });

        // 3. Title text left (Standard Title Case capitalization)
        slide.addText([
          { text: titleText1 + "\n", options: { fontSize: 40, color: '0F172A', fontFace: 'Calibri' } },
          { text: titleText2, options: { fontSize: 40, bold: true, color: '6F51D3', fontFace: 'Calibri' } }
        ], {
          x: 0.53, y: 1.8, w: 7.89, h: 3.5,
          valign: 'middle'
        });

        // Horizontal purple line
        slide.addShape('rect', {
          x: 0.53, y: 5.3, w: 1.5, h: 0.05,
          fill: { color: '6F51D3' }
        });

        // Subtitle
        slide.addText(s.subtitle || "Clear goals, smart planning, defined scope, timeline, budget, and outcomes.", {
          x: 0.53, y: 5.5, w: 7.12, h: 1.0,
          fontSize: 18, color: '64748B',
          fontFace: 'Calibri'
        });
      }
      else if (layout === "intro") {
        // SlideEgg Introduction / Executive Summary Layout
        // Title
        slide.addText(s.title || "Introduction", {
          x: 0.9, y: 0.6, w: 10.0, h: 0.8,
          fontSize: 40, bold: true, color: '0F172A', fontFace: 'Calibri'
        });

        // Divider Line
        slide.addShape('rect', {
          x: 0.9, y: 1.4, w: 11.5, h: 0.02,
          fill: { color: 'E2E8F0' }
        });

        const desc = s.bullets[0] || s.subtitle || "Overview details here...";
        const metrics = s.bullets.slice(1).map(b => {
          const parts = b.split(":");
          return {
            label: parts[0]?.trim() || "Metric",
            val: parts[1]?.trim() || "50%"
          };
        });

        const isSingle = s.bullets.length === 1;

        if (isSingle) {
          // Centered visual quote-style layout for 1-liner slides
          slide.addShape('roundRect', {
            x: 1.5, y: 2.2, w: 10.33, h: 3.5,
            fill: { color: 'F8F6FF' },
            line: { color: 'E2E8F0', width: 1.5 }
          });

          // Large numbering badge
          slide.addShape('ellipse', {
            x: 2.2, y: 3.45, w: 1.0, h: 1.0,
            fill: { color: '6F51D3' },
            line: { color: '6F51D3' }
          });
          slide.addText("1", {
            x: 2.2, y: 3.45, w: 1.0, h: 1.0,
            fontSize: 28, bold: true, color: 'FFFFFF', align: 'center', valign: 'middle'
          });

          // Headline content
          slide.addText(desc, {
            x: 3.6, y: 2.4, w: 7.6, h: 3.1,
            fontSize: 24, bold: true, color: '0F172A', fontFace: 'Calibri',
            valign: 'middle'
          });
        } else {
          // Description (Left)
          slide.addText(desc, {
            x: 0.9, y: 1.8, w: s.imageUrl ? 5.5 : 6.0, h: 4.5,
            fontSize: 22, color: '475569', fontFace: 'Calibri',
            valign: 'top'
          });

          if (s.imageUrl) {
            // Add rounded card container
            slide.addShape('roundRect', {
              x: 7.0, y: 1.6, w: 5.4, h: 4.8,
              fill: { color: 'F8F6FF' },
              line: { color: 'E2E8F0', width: 1.5 }
            });
            // Add image inside it
            slide.addImage({
              path: window.location.origin + s.imageUrl,
              x: 7.2, y: 1.8, w: 5.0, h: 4.4,
              sizing: { type: 'contain', w: 5.0, h: 4.4 }
            });
          } else {
          // Metrics (Right)
          let currentY = 3.2;
          const defaultMetrics = [
            { label: "Execution & Monitoring", val: "64%", color: "6F51D3" }
          ];

          const finalMetrics = metrics.length > 0 ? metrics.map((m, idx) => ({
            label: m.label,
            val: m.val,
            color: idx === 0 ? "6F51D3" : "9937CE"
          })) : defaultMetrics;

          const metricsX = 7.5;
          finalMetrics.forEach((m) => {
            const numericVal = parseInt(m.val) || 50;
            const barWidth = 4.0;

            // Label and Percent
            slide.addText(m.label, {
              x: metricsX, y: currentY, w: barWidth - 1.0, h: 0.4,
              fontSize: 20, bold: true, color: '64748B', fontFace: 'Calibri'
            });
            slide.addText(m.val, {
              x: metricsX + barWidth - 1.0, y: currentY, w: 1.0, h: 0.4,
              fontSize: 22, bold: true, color: m.color, fontFace: 'Calibri', align: 'right'
            });

            // Bar Background
            slide.addShape('roundRect', {
              x: metricsX, y: currentY + 0.5, w: barWidth, h: 0.3,
              fill: { color: 'F1EDFF' },
              line: { color: 'F1EDFF' }
            });
            // Bar Progress
            slide.addShape('roundRect', {
              x: metricsX, y: currentY + 0.5, w: barWidth * (numericVal / 100), h: 0.3,
              fill: { color: m.color },
              line: { color: m.color }
            });

            currentY += 1.0;
          });
        }
      }
      }
      else if (layout === "objectives") {
        // SlideEgg Project Objectives Layout
        // Title on left
        slide.addText(s.title || "Project Objectives", {
          x: 0.9, y: 1.8, w: s.imageUrl ? 3.5 : 4.5, h: 3.0,
          fontSize: 46, bold: true, color: '0F172A', fontFace: 'Calibri',
          valign: 'middle'
        });

        // Left indicator line
        slide.addShape('rect', {
          x: 0.9, y: 4.8, w: 1.5, h: 0.05,
          fill: { color: '6F51D3' }
        });

        // Far-right accent block
        if (!s.imageUrl) {
          slide.addShape('roundRect', {
            x: 12.0, y: 1.5, w: 1.33, h: 4.5,
            fill: { color: '6F51D3' },
            line: { color: '6F51D3' }
          });
        }

        // Objectives on right
        let currentY = 2.2;
        const listItems = s.bullets.length > 0 ? s.bullets : [
          "Expand Market Reach | Enter new target markets, attract diverse client segments.",
          "Optimize Resource ROI | Align human capital, technical tools, and operations."
        ];

        const bulletsX = s.imageUrl ? 4.8 : 6.5;
        const bulletsW = s.imageUrl ? 3.6 : 4.3;

        listItems.slice(0, 2).forEach((item, idx) => {
          const parts = item.split("|");
          const heading = parts[0]?.trim() || `Objective ${idx + 1}`;
          const desc = parts[1]?.trim() || "Details about this objective...";
          const themeColor = idx % 2 === 0 ? "6F51D3" : "9937CE";

          // Circle shape
          slide.addShape('ellipse', {
            x: bulletsX, y: currentY + 0.1, w: 0.7, h: 0.7,
            line: { color: themeColor, width: 2 },
            fill: { color: 'FFFFFF' }
          });
          // Circle Number
          slide.addText((idx + 1).toString(), {
            x: bulletsX, y: currentY + 0.1, w: 0.7, h: 0.7,
            fontSize: 22, bold: true, color: themeColor, fontFace: 'Calibri',
            align: 'center', valign: 'middle'
          });

          // Heading and description
          slide.addText([
            { text: heading + "\n", options: { fontSize: 24, bold: true, color: '0F172A' } },
            { text: desc, options: { fontSize: 18, color: '64748B' } }
          ], {
            x: bulletsX + 1.0, y: currentY, w: bulletsW, h: 1.5,
            valign: 'top'
          });

          currentY += 2.4;
        });

        if (s.imageUrl) {
          // Card background
          slide.addShape('roundRect', {
            x: 8.8, y: 1.6, w: 4.0, h: 4.8,
            fill: { color: 'F8F6FF' },
            line: { color: 'E2E8F0', width: 1.5 }
          });
          // Image
          slide.addImage({
            path: window.location.origin + s.imageUrl,
            x: 9.0, y: 1.8, w: 3.6, h: 4.4,
            sizing: { type: 'contain', w: 3.6, h: 4.4 }
          });
        }
      }
      else if (layout === "scope") {
        // SlideEgg Scope of Work (2x2 grid) Layout
        // Title on left
        slide.addText(s.title || "Scope of Work", {
          x: 0.8, y: 1.8, w: s.imageUrl ? 3.8 : 5.0, h: 3.0,
          fontSize: 46, bold: true, color: '0F172A', fontFace: 'Calibri',
          valign: 'middle'
        });

        // Left indicator line
        slide.addShape('rect', {
          x: 0.8, y: 4.8, w: 1.5, h: 0.05,
          fill: { color: '6F51D3' }
        });

        const listItems = s.bullets.length > 0 ? s.bullets : [
          "Market Analysis | Identify demographics and competitor offerings.",
          "System Development | Engineering and system integration testing."
        ];

        if (s.imageUrl) {
          // Stacks cards vertically
          const cardX = 4.8;
          const cardW = 3.4;
          const cardH = 2.0;

          listItems.slice(0, 2).forEach((item, idx) => {
            const cardY = 1.8 + idx * 2.3;
            const parts = item.split("|");
            const heading = parts[0]?.trim() || `Scope ${idx + 1}`;
            const desc = parts[1]?.trim() || "Details about this task...";
            const themeColor = idx % 2 === 0 ? "6F51D3" : "9937CE";

            // Card background
            slide.addShape('roundRect', {
              x: cardX, y: cardY, w: cardW, h: cardH,
              fill: { color: 'F8F6FF' },
              line: { color: 'E2E8F0', width: 1.5 }
            });

            // Dot shape
            slide.addShape('ellipse', {
              x: cardX + 0.2, y: cardY + 0.2, w: 0.3, h: 0.3,
              fill: { color: themeColor },
              line: { color: themeColor }
            });

            // Heading
            slide.addText(heading, {
              x: cardX + 0.6, y: cardY + 0.2, w: cardW - 0.8, h: 0.3,
              fontSize: 18, bold: true, color: '0F172A', fontFace: 'Calibri',
              valign: 'middle'
            });

            // Description
            slide.addText(desc, {
              x: cardX + 0.2, y: cardY + 0.6, w: cardW - 0.4, h: cardH - 0.8,
              fontSize: 14, color: '64748B', fontFace: 'Calibri',
              valign: 'top'
            });
          });

          // Draw image on right
          slide.addShape('roundRect', {
            x: 8.6, y: 1.6, w: 4.2, h: 4.8,
            fill: { color: 'F8F6FF' },
            line: { color: 'E2E8F0', width: 1.5 }
          });
          slide.addImage({
            path: window.location.origin + s.imageUrl,
            x: 8.8, y: 1.8, w: 3.8, h: 4.4,
            sizing: { type: 'contain', w: 3.8, h: 4.4 }
          });
        } else {
          // Grid coordinates for 2 cards side-by-side
          const gridCoords = [
            { x: 6.5, y: 2.2, color: '6F51D3' },
            { x: 9.6, y: 2.2, color: '9937CE' }
          ];

          listItems.slice(0, 2).forEach((item, idx) => {
            const coord = gridCoords[idx];
            if (!coord) return;
            const parts = item.split("|");
            const heading = parts[0]?.trim() || `Scope ${idx + 1}`;
            const desc = parts[1]?.trim() || "Details about this task...";

            // Card background
            slide.addShape('roundRect', {
              x: coord.x, y: coord.y, w: 2.9, h: 3.5,
              fill: { color: 'F8F6FF' },
              line: { color: 'E2E8F0', width: 1.5 }
            });

            // Dot shape
            slide.addShape('ellipse', {
              x: coord.x + 0.3, y: coord.y + 0.3, w: 0.4, h: 0.4,
              fill: { color: coord.color },
              line: { color: coord.color }
            });

            // Heading
            slide.addText(heading, {
              x: coord.x + 0.9, y: coord.y + 0.3, w: 1.8, h: 0.4,
              fontSize: 20, bold: true, color: '0F172A', fontFace: 'Calibri',
              valign: 'middle'
            });

            // Description
            slide.addText(desc, {
              x: coord.x + 0.3, y: coord.y + 0.9, w: 2.3, h: 2.3,
              fontSize: 16, color: '64748B', fontFace: 'Calibri',
              valign: 'top'
            });
          });
        }
      }
      else if (layout === "timeline") {
        // SlideEgg Timeline Layout
        // Title
        slide.addText(s.title || "Project Timeline", {
          x: 0.8, y: 0.6, w: 10.0, h: 0.8,
          fontSize: 40, bold: true, color: '0F172A', fontFace: 'Calibri'
        });

        // Divider Line
        slide.addShape('rect', {
          x: 0.8, y: 1.4, w: 11.5, h: 0.02,
          fill: { color: 'E2E8F0' }
        });

        const listItems = s.bullets.length > 0 ? s.bullets : [
          "Planning & Research | Define project scope, conduct research.",
          "Development & Execution | Develop solutions, implement tasks."
        ];

        if (s.imageUrl) {
          // Shorter timeline on left
          slide.addShape('rect', {
            x: 1.0, y: 3.3, w: 4.5, h: 0.05,
            fill: { color: 'E2E8F0' }
          });

          const timelineNodes = [
            { x: 1.2, color: '6F51D3' },
            { x: 3.8, color: '9937CE' }
          ];

          const nodeW = 2.4;

          listItems.slice(0, 2).forEach((item, idx) => {
            const node = timelineNodes[idx];
            if (!node) return;
            const parts = item.split("|");
            const heading = parts[0]?.trim() || `Phase ${idx + 1}`;
            const desc = parts[1]?.trim() || "Milestone details...";

            // Outer Circle
            slide.addShape('ellipse', {
              x: node.x, y: 2.7, w: 1.2, h: 1.2,
              fill: { color: 'FFFFFF' },
              line: { color: node.color, width: 3 }
            });
            // Inner Circle Dot
            slide.addShape('ellipse', {
              x: node.x + 0.35, y: 3.05, w: 0.5, h: 0.5,
              fill: { color: node.color },
              line: { color: node.color }
            });

            // Text box for Phase Title
            slide.addText(heading, {
              x: node.x - (nodeW - 1.2) / 2, y: 4.1, w: nodeW, h: 0.5,
              fontSize: 20, bold: true, color: '0F172A', fontFace: 'Calibri',
              align: 'center'
            });

            // Text box for Phase Description
            slide.addText(desc, {
              x: node.x - (nodeW - 1.2) / 2, y: 4.8, w: nodeW, h: 2.2,
              fontSize: 14, color: '64748B', fontFace: 'Calibri',
              align: 'center', valign: 'top'
            });
          });

          // Draw image on right
          slide.addShape('roundRect', {
            x: 6.8, y: 1.6, w: 5.6, h: 4.8,
            fill: { color: 'F8F6FF' },
            line: { color: 'E2E8F0', width: 1.5 }
          });
          slide.addImage({
            path: window.location.origin + s.imageUrl,
            x: 7.0, y: 1.8, w: 5.2, h: 4.4,
            sizing: { type: 'contain', w: 5.2, h: 4.4 }
          });
        } else {
          // Connecting timeline line
          slide.addShape('rect', {
            x: 2.5, y: 3.3, w: 6.5, h: 0.05,
            fill: { color: 'E2E8F0' }
          });

          const timelineNodes = [
            { x: 3.0, color: '6F51D3' },
            { x: 7.5, color: '9937CE' }
          ];

          const nodeW = 2.8;

          listItems.slice(0, 2).forEach((item, idx) => {
            const node = timelineNodes[idx];
            if (!node) return;
            const parts = item.split("|");
            const heading = parts[0]?.trim() || `Phase ${idx + 1}`;
            const desc = parts[1]?.trim() || "Milestone details...";

            // Outer Circle
            slide.addShape('ellipse', {
              x: node.x, y: 2.7, w: 1.2, h: 1.2,
              fill: { color: 'FFFFFF' },
              line: { color: node.color, width: 3 }
            });
            // Inner Circle Dot
            slide.addShape('ellipse', {
              x: node.x + 0.35, y: 3.05, w: 0.5, h: 0.5,
              fill: { color: node.color },
              line: { color: node.color }
            });

            // Text box for Phase Title
            slide.addText(heading, {
              x: node.x - (nodeW - 1.2) / 2, y: 4.1, w: nodeW, h: 0.5,
              fontSize: 22, bold: true, color: '0F172A', fontFace: 'Calibri',
              align: 'center'
            });

            // Text box for Phase Description
            slide.addText(desc, {
              x: node.x - (nodeW - 1.2) / 2, y: 4.8, w: nodeW, h: 2.2,
              fontSize: 16, color: '64748B', fontFace: 'Calibri',
              align: 'center', valign: 'top'
            });
          });
        }
      }
      else if (layout === "budget") {
        // SlideEgg Budget Breakdown (3 snippet cards) Layout
        // Title
        slide.addText(s.title || "Budget Breakdown", {
          x: 0.8, y: 0.6, w: 6.0, h: 0.6,
          fontSize: 40, bold: true, color: '0F172A', fontFace: 'Calibri'
        });

        // Subtitle Overview
        slide.addText(s.subtitle || "Estimated financial requirements for project execution.", {
          x: 0.8, y: 1.3, w: 11.0, h: 0.8,
          fontSize: 16, color: '64748B', fontFace: 'Calibri'
        });

        const listItems = s.bullets.length > 0 ? s.bullets : [
          "Research & Feasibility | $89K | Initial assessments.",
          "Development & Engineering | $113K | Core engineering."
        ];

        if (s.imageUrl) {
          const cardXCoords = [0.8, 4.3];
          const cardW = 3.2;

          listItems.slice(0, 2).forEach((item, idx) => {
            const startX = cardXCoords[idx];
            if (startX === undefined) return;
            const parts = item.split("|");
            const heading = parts[0]?.trim() || `Item ${idx + 1}`;
            const val = parts[1]?.trim() || "$0K";
            const desc = parts[2]?.trim() || "Allocation details...";
            const badgeColor = idx === 1 ? "9937CE" : "6F51D3";

            // Snipped card shape
            slide.addShape('snip1Rect', {
              x: startX, y: 2.2, w: cardW, h: 4.4,
              fill: { color: 'F8F6FF' },
              line: { color: 'E2E8F0', width: 1.5 }
            });

            // Card Title
            slide.addText(heading, {
              x: startX + 0.2, y: 2.5, w: cardW - 0.4, h: 0.6,
              fontSize: 18, bold: true, color: '0F172A', fontFace: 'Calibri'
            });

            // Card Description
            slide.addText(desc, {
              x: startX + 0.2, y: 3.3, w: cardW - 0.4, h: 2.0,
              fontSize: 14, color: '64748B', fontFace: 'Calibri',
              valign: 'top'
            });

            // Money Badge Shape
            slide.addShape('roundRect', {
              x: startX + (cardW - 1.5) / 2, y: 5.8, w: 1.5, h: 0.5,
              fill: { color: badgeColor },
              line: { color: badgeColor }
            });
            // Money Badge Text
            slide.addText(val, {
              x: startX + (cardW - 1.5) / 2, y: 5.8, w: 1.5, h: 0.5,
              fontSize: 18, bold: true, color: 'FFFFFF', fontFace: 'Calibri',
              align: 'center', valign: 'middle'
            });
          });

          // Draw image on right
          slide.addShape('roundRect', {
            x: 7.8, y: 2.0, w: 4.8, h: 4.8,
            fill: { color: 'F8F6FF' },
            line: { color: 'E2E8F0', width: 1.5 }
          });
          slide.addImage({
            path: window.location.origin + s.imageUrl,
            x: 8.0, y: 2.2, w: 4.4, h: 4.4,
            sizing: { type: 'contain', w: 4.4, h: 4.4 }
          });
        } else {
          const cardXCoords = [1.5, 7.0];
          const cardW = 4.8;

          listItems.slice(0, 2).forEach((item, idx) => {
            const startX = cardXCoords[idx];
            if (startX === undefined) return;
            const parts = item.split("|");
            const heading = parts[0]?.trim() || `Item ${idx + 1}`;
            const val = parts[1]?.trim() || "$0K";
            const desc = parts[2]?.trim() || "Allocation details...";
            const badgeColor = idx === 1 ? "9937CE" : "6F51D3";

            // Snipped card shape
            slide.addShape('snip1Rect', {
              x: startX, y: 2.2, w: cardW, h: 4.4,
              fill: { color: 'F8F6FF' },
              line: { color: 'E2E8F0', width: 1.5 }
            });

            // Card Title
            slide.addText(heading, {
              x: startX + 0.3, y: 2.5, w: cardW - 0.6, h: 0.6,
              fontSize: 22, bold: true, color: '0F172A', fontFace: 'Calibri'
            });

            // Card Description
            slide.addText(desc, {
              x: startX + 0.3, y: 3.3, w: cardW - 0.6, h: 2.0,
              fontSize: 16, color: '64748B', fontFace: 'Calibri',
              valign: 'top'
            });

            // Money Badge Shape
            slide.addShape('roundRect', {
              x: startX + (cardW - 1.8) / 2, y: 5.7, w: 1.8, h: 0.6,
              fill: { color: badgeColor },
              line: { color: badgeColor }
            });
            // Money Badge Text
            slide.addText(val, {
              x: startX + (cardW - 1.8) / 2, y: 5.7, w: 1.8, h: 0.6,
              fontSize: 22, bold: true, color: 'FFFFFF', fontFace: 'Calibri',
              align: 'center', valign: 'middle'
            });
          });
        }
      }
      else if (layout === "conclusion") {
        // SlideEgg Conclusion Layout
        // Title
        slide.addText(s.title || "Conclusion", {
          x: 1.0, y: 2.0, w: 11.3, h: 0.8,
          fontSize: 46, bold: true, color: '0F172A', fontFace: 'Calibri',
          align: 'center'
        });

        // Horizontal indicator line
        slide.addShape('rect', {
          x: 5.9, y: 3.0, w: 1.5, h: 0.05,
          fill: { color: '6F51D3' }
        });

        // Text content
        const contentText = s.subtitle || (s.bullets[0] ? s.bullets.join(" ") : "This project proposal presents a structured and result-driven plan. We appreciate your partnership.");
        slide.addText(contentText, {
          x: 1.5, y: 3.8, w: 10.3, h: 2.5,
          fontSize: 24, color: '475569', fontFace: 'Calibri',
          align: 'center', valign: 'top'
        });

        // Bottom right corner graphic block
        slide.addShape('roundRect', {
          x: 11.0, y: 5.0, w: 2.5, h: 2.5,
          fill: { color: '6F51D3' },
          line: { color: '6F51D3' }
        });
        // Top left corner graphic block
        slide.addShape('ellipse', {
          x: -0.5, y: -0.5, w: 2.0, h: 2.0,
          fill: { color: '9937CE' },
          line: { color: '9937CE' }
        });
      }

      // Slide Number
      if (layout !== "title") {
        slide.addText(String(idx + 1), {
          x: "90%", y: "90%", w: "10%", h: 0.5,
          fontSize: 12, color: "CBD5E1", align: "right"
        });
      }
    });

    const safeTitle = slides[0]?.title.split("|")[0].replace(/[^a-z0-9]/gi, '_').toLowerCase().substring(0, 30) || "presentation";
    pptx.writeFile({ fileName: `${safeTitle}.pptx` });
  };

  const renderSlideContent = (s: Slide) => {
    const layout = s.layout || (s.type === "title" ? "title" : "intro");

    if (layout === "title") {
      const parts = s.title.split("|");
      const part1 = toNormalCasing(parts[0]?.trim() || "Project");
      const part2 = parts[1] ? toNormalCasing(parts[1].trim()) : "";
      return (
        <div className="absolute inset-0 w-full h-full flex z-10 p-[4.5cqw] items-center text-left bg-white select-none">
          <div className="w-[60%] flex flex-col justify-center">
            <h2 className="text-[4.5cqw] font-normal tracking-tight leading-tight text-slate-900">
              {part1}
              {part2 && (
                <span className="block font-black text-[#6F51D3] mt-1 text-[5cqw]">
                  {part2}
                </span>
              )}
            </h2>
            <div className="w-[10cqw] h-[0.5cqw] bg-[#6F51D3] my-[2cqw] rounded-full" />
            <p className="text-[1.8cqw] text-slate-500 leading-relaxed font-medium">
              {s.subtitle || "Clear goals, smart planning, defined scope, timeline, budget, and outcomes."}
            </p>
          </div>

          <div className="absolute right-0 top-0 bottom-0 w-[40%] overflow-hidden pointer-events-none">
            <div className="absolute top-[20%] -right-[10%] w-[90%] h-[60%] bg-[#6F51D3] rounded-[3cqw] transform rotate-12 shadow-2xl opacity-90" />
            <div className="absolute bottom-[20%] right-[15%] w-[25cqw] h-[25cqw] bg-white rounded-[3cqw] border border-slate-100 shadow-xl flex items-center justify-center p-[2cqw]">
              <div className="text-center w-full">
                <span className="text-[1.2cqw] uppercase tracking-widest text-[#6F51D3] font-bold block mb-1">PRESENTATION</span>
                <span className="text-[1.8cqw] font-black text-slate-800 block break-words leading-tight">
                  {toNormalCasing(part1.split(" ").slice(0, 2).join(" ") || "GenAI")}
                </span>
              </div>
            </div>
            <div className="absolute top-[4cqw] right-[4cqw] w-[10cqw] h-[10cqw] bg-[radial-gradient(#9937CE_2px,transparent_2px)] [background-size:1.2cqw_1.2cqw] opacity-30" />
          </div>
        </div>
      );
    }

    if (layout === "intro") {
      const accentColors = ["#6F51D3", "#9937CE", "#6F51D3", "#9937CE", "#6F51D3", "#9937CE"];
      return (
        <div className="absolute inset-0 w-full h-full flex flex-col z-10 pt-[2.2cqw] pb-[3.5cqw] px-[4cqw] bg-white text-slate-900 overflow-hidden select-none">
          {/* Header */}
          <div className="flex items-center gap-[1.5cqw] mb-[1cqw]">
            <div className="w-[0.6cqw] h-[3.2cqw] rounded-full" style={{ background: "linear-gradient(to bottom, #6F51D3, #9937CE)" }} />
            <h2 className="text-[3.2cqw] font-extrabold text-slate-900 leading-tight">{s.title}</h2>
          </div>
          {s.subtitle && (
            <p className="text-[1.4cqw] text-slate-50 mb-[1.5cqw] leading-relaxed italic border-l-2 border-slate-200 pl-[1.2cqw]">{s.subtitle}</p>
          )}

          {/* Body Content */}
          <div className="flex-1 flex gap-[3cqw] min-h-0 overflow-hidden items-center justify-center">
            {/* Bullets Column */}
            <div className={`${s.imageUrl ? "w-[55%]" : "w-full"} flex flex-col gap-[3cqw] justify-center py-[2cqw] min-h-0`}>
              {s.bullets.slice(0, 4).map((b, idx) => {
                const parts = b.split("|");
                const label = parts[0]?.trim();
                const detail = parts[1]?.trim();
                const accent = accentColors[idx % accentColors.length];
                const isSingle = s.bullets.length === 1;
                return (
                  <div key={idx} className={`flex-initial flex items-center gap-[2.5cqw] rounded-[1.5cqw] bg-slate-50 border border-slate-100/80 shadow-sm min-h-0 ${isSingle ? "p-[4cqw] py-[5cqw] mx-auto max-w-[85%] text-center justify-center" : "p-[2.2cqw]"}`}>
                    <div className={`shrink-0 rounded-full flex items-center justify-center text-white font-black shadow-sm ${isSingle ? "w-[6cqw] h-[6cqw] text-[2.8cqw]" : "w-[4.5cqw] h-[4.5cqw] text-[2cqw]"}`} style={{ backgroundColor: accent }}>
                      {idx + 1}
                    </div>
                    <div className="min-w-0">
                      {label && detail ? (
                        <div className="leading-snug">
                          <span className={`font-bold text-slate-800 ${isSingle ? "text-[2.8cqw]" : "text-[2.2cqw]"}`}>{label}</span>
                          <span className={`text-slate-500 ml-2 ${isSingle ? "text-[2.4cqw]" : "text-[1.8cqw]"}`}>{detail}</span>
                        </div>
                      ) : (
                        <div className={`text-slate-700 leading-snug font-semibold ${isSingle ? "text-[2.6cqw]" : "text-[2.2cqw]"}`}>{b}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {s.imageUrl && (
              <div className="w-[42%] h-[85%] flex items-center justify-center bg-[#F8F6FF] border border-slate-100 rounded-[2cqw] p-[1.5cqw] shadow-md overflow-hidden shrink-0">
                <SlideImage src={s.imageUrl} alt="Graph / Visual representation" className="max-w-full max-h-full object-contain rounded-xl" />
              </div>
            )}
          </div>
        </div>
      );
    }

    if (layout === "objectives") {
      return (
        <div className="absolute inset-0 w-full h-full flex z-10 p-[4cqw] bg-white text-slate-900 overflow-hidden select-none items-center">
          {/* Left title panel */}
          <div className="w-[30%] shrink-0 flex flex-col justify-center pr-[2.5cqw]">
            <h2 className="text-[4.2cqw] font-black text-slate-900 leading-tight">
              {s.title}
            </h2>
            <div className="w-[10cqw] h-[0.6cqw] bg-[#6F51D3] mt-[2cqw] rounded-full" />
          </div>

          {/* Center Objectives panel */}
          <div className="flex-1 flex gap-[3cqw] z-10 overflow-hidden px-2 items-center">
            <div className={`${s.imageUrl ? "w-[58%]" : "w-full"} flex flex-col justify-center gap-[3cqw] overflow-hidden`}>
              {s.bullets.slice(0, 5).map((b, idx) => {
                const parts = b.split("|");
                const title = parts[0]?.trim() || `Objective ${idx + 1}`;
                const desc = parts[1]?.trim() || "Details about this objective...";
                const color = idx % 2 === 0 ? "border-[#6F51D3] text-[#6F51D3]" : "border-[#9937CE] text-[#9937CE]";
                return (
                  <div key={idx} className="flex items-start gap-[2cqw]">
                    <div className={`w-[3.2cqw] h-[3.2cqw] rounded-full border-2 ${color} flex items-center justify-center shrink-0 text-[1.4cqw] font-bold bg-white mt-1 shadow-sm`}>
                      {idx + 1}
                    </div>
                    <div>
                      <h3 className="font-bold text-[2.2cqw] text-slate-800 leading-snug">{title}</h3>
                      <p className="text-[1.8cqw] text-slate-500 leading-normal mt-1">{desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            {s.imageUrl && (
              <div className="w-[38%] h-[85%] flex items-center justify-center bg-[#F8F6FF] border border-slate-100 rounded-[2cqw] p-[1.5cqw] shadow-md overflow-hidden shrink-0">
                <SlideImage src={s.imageUrl} alt="Objectives Graph" className="max-w-full max-h-full object-contain rounded-xl" />
              </div>
            )}
          </div>

          {!s.imageUrl && (
            <div className="absolute right-0 top-[4cqw] bottom-[4cqw] w-[2cqw] bg-[#6F51D3] rounded-l-xl opacity-90" />
          )}
        </div>
      );
    }

    if (layout === "scope") {
      const accentPairs = ["bg-[#6F51D3]", "bg-[#9937CE]", "bg-[#6F51D3]", "bg-[#9937CE]", "bg-[#6F51D3]", "bg-[#9937CE]"];
      return (
        <div className="absolute inset-0 w-full h-full flex z-10 p-[4cqw] bg-white text-slate-900 overflow-hidden select-none items-center">
          {/* Left title panel */}
          <div className="w-[28%] flex flex-col justify-center pr-[1.5cqw] shrink-0">
            <h2 className="text-[4.2cqw] font-black text-slate-900 leading-tight">{s.title}</h2>
            <div className="w-[8cqw] h-[0.6cqw] bg-[#6F51D3] mt-[1.5cqw] rounded-full" />
            {s.subtitle && <p className="text-[1.5cqw] text-slate-50 mt-[1cqw] leading-relaxed">{s.subtitle}</p>}
          </div>

          {/* Right cards grid */}
          <div className="flex-1 flex gap-[3cqw] overflow-hidden px-1 items-center justify-center w-full h-full">
            <div className={`${s.imageUrl ? "w-[58%] grid-cols-1" : "w-full grid-cols-2"} grid gap-[2cqw] content-center items-center overflow-hidden`}>
              {s.bullets.slice(0, 5).map((b, idx) => {
                const parts = b.split("|");
                const title = parts[0]?.trim() || `Scope ${idx + 1}`;
                const desc = parts[1]?.trim() || "Task description details...";
                return (
                  <div key={idx} className="bg-slate-50 border border-slate-100 p-[2cqw] rounded-[1.2cqw] flex flex-col gap-2 shadow-sm min-h-[20cqw] justify-center text-left">
                    <div className="flex items-center gap-[1cqw]">
                      <div className={`w-[1.2cqw] h-[1.2cqw] rounded-full shrink-0 ${accentPairs[idx % accentPairs.length]}`} />
                      <h3 className="font-bold text-[2.2cqw] text-slate-800 truncate">{title}</h3>
                    </div>
                    <p className="text-[1.7cqw] text-slate-500 leading-relaxed line-clamp-3">{desc}</p>
                  </div>
                );
              })}
            </div>
            {s.imageUrl && (
              <div className="w-[38%] h-[85%] flex items-center justify-center bg-[#F8F6FF] border border-slate-100 rounded-[2cqw] p-[1.5cqw] shadow-md overflow-hidden shrink-0">
                <SlideImage src={s.imageUrl} alt="Scope Visual" className="max-w-full max-h-full object-contain rounded-xl" />
              </div>
            )}
          </div>
        </div>
      );
    }

    if (layout === "timeline") {
      const accentColors = ["#6F51D3", "#9937CE", "#6F51D3", "#9937CE", "#6F51D3", "#9937CE"];
      return (
        <div className="absolute inset-0 w-full h-full flex flex-col z-10 p-[4cqw] bg-white text-slate-900 overflow-hidden select-none justify-center">
          {/* Header */}
          <div className="flex items-center gap-[1.5cqw] mb-[2cqw]">
            <div className="w-[0.6cqw] h-[3.2cqw] rounded-full" style={{ background: "linear-gradient(to bottom, #6F51D3, #9937CE)" }} />
            <h2 className="text-[3.2cqw] font-extrabold text-slate-900">{s.title}</h2>
          </div>

          {/* Body Content */}
          <div className="flex-1 flex gap-5 min-h-0 overflow-hidden items-center">
            {/* Vertical timeline */}
            <div className={`${s.imageUrl ? "w-[58%]" : "w-full"} flex-1 relative pl-[4cqw] flex flex-col gap-[3cqw] justify-center py-[2cqw] min-h-0 overflow-hidden text-left`}>
              {/* Vertical line */}
              <div className="absolute left-[1.8cqw] top-4 bottom-4 w-[0.2cqw] bg-gradient-to-b from-[#6F51D3] via-[#9937CE] to-slate-200 rounded-full" />

              {s.bullets.slice(0, 5).map((b, idx) => {
                const parts = b.split("|");
                const title = parts[0]?.trim() || `Phase ${idx + 1}`;
                const desc = parts[1]?.trim() || "Milestone details...";
                const accent = accentColors[idx % accentColors.length];
                return (
                  <div key={idx} className="relative flex items-start gap-4">
                    {/* Dot */}
                    <div className="absolute -left-[3.4cqw] w-[3.2cqw] h-[3.2cqw] rounded-full border-2 border-white shadow-md flex items-center justify-center text-white text-[1.4cqw] font-black shrink-0 z-10" style={{ backgroundColor: accent }}>
                      {idx + 1}
                    </div>
                    {/* Content */}
                    <div className="flex-1 bg-slate-50 border border-slate-100 rounded-[1.2cqw] p-[1.8cqw] px-[2cqw] shadow-sm">
                      <h3 className="font-bold text-[2.2cqw] text-slate-800 leading-snug">{title}</h3>
                      <p className="text-[1.8cqw] text-slate-500 mt-1 leading-relaxed">{desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            {s.imageUrl && (
              <div className="w-[38%] h-[85%] flex items-center justify-center bg-[#F8F6FF] border border-slate-100 rounded-[2cqw] p-[1.5cqw] shadow-md overflow-hidden shrink-0">
                <SlideImage src={s.imageUrl} alt="Timeline Graph" className="max-w-full max-h-full object-contain rounded-xl" />
              </div>
            )}
          </div>
        </div>
      );
    }

    if (layout === "budget") {
      const accentColors = ["#6F51D3", "#9937CE", "#7C3AED", "#6F51D3", "#9937CE", "#7C3AED"];
      const isTwo = s.bullets.length === 2;
      return (
        <div className="absolute inset-0 w-full h-full flex flex-col z-10 p-[4cqw] bg-white text-slate-900 overflow-hidden select-none justify-center">
          {/* Header */}
          <div className="flex justify-between items-end border-b border-slate-100 pb-[1.5cqw] mb-[2.5cqw]">
            <h2 className="text-[3.2cqw] font-extrabold text-slate-900">{s.title}</h2>
            {s.subtitle && <p className="text-[1.5cqw] text-slate-400 font-medium max-w-[45%] text-right truncate">{s.subtitle}</p>}
          </div>

          <div className="flex-1 flex gap-5 min-h-0 overflow-hidden items-center">
            {/* Grid of budget cards */}
            <div className={`${s.imageUrl ? "w-[58%] grid-cols-1" : "w-full " + (isTwo ? "grid-cols-2" : "grid-cols-3")} grid gap-[2cqw] content-center overflow-hidden px-1 text-left`}>
              {s.bullets.slice(0, 5).map((b, idx) => {
                const parts = b.split("|");
                const title = parts[0]?.trim() || `Item ${idx + 1}`;
                const val = parts[1]?.trim() || "$0K";
                const desc = parts[2]?.trim() || "Allocation details...";
                const accent = accentColors[idx % accentColors.length];
                return (
                  <div key={idx} className="bg-[#F8F6FF] border border-slate-100 rounded-[1.2cqw] p-[2cqw] flex flex-col justify-between shadow-sm relative overflow-hidden min-h-[22cqw]">
                    <div>
                      <div className="h-[0.6cqw] w-full rounded-full mb-[1cqw]" style={{ backgroundColor: accent, opacity: 0.7 }} />
                      <h3 className="font-bold text-[2.2cqw] text-slate-800 leading-snug">{title}</h3>
                      <p className="text-[1.7cqw] text-slate-500 mt-[1cqw] leading-relaxed line-clamp-3">{desc}</p>
                    </div>
                    <div className="mt-[1.5cqw] px-[1.2cqw] py-[0.5cqw] text-white font-black text-[1.6cqw] rounded-[0.8cqw] text-center w-fit shadow-sm" style={{ backgroundColor: accent }}>
                      {val}
                    </div>
                  </div>
                );
              })}
            </div>
            {s.imageUrl && (
              <div className="w-[38%] h-[85%] flex items-center justify-center bg-[#F8F6FF] border border-slate-100 rounded-[2cqw] p-[1.5cqw] shadow-md overflow-hidden shrink-0">
                <SlideImage src={s.imageUrl} alt="Budget Visual" className="max-w-full max-h-full object-contain rounded-xl" />
              </div>
            )}
          </div>
        </div>
      );
    }

    if (layout === "conclusion") {
      return (
        <div className="absolute inset-0 w-full h-full flex z-10 bg-white text-slate-900 overflow-hidden items-center">
          {/* Left accent strip */}
          <div className="w-[1.2cqw] h-full shrink-0" style={{ background: "linear-gradient(to bottom, #6F51D3, #9937CE)" }} />

          <div className="w-full flex-1 flex flex-col p-[4cqw] justify-center min-h-0 gap-[2cqw] text-left">
            {/* Title */}
            <div>
              <h2 className="text-[4.2cqw] font-black text-slate-900 mb-1">{s.title}</h2>
              <div className="w-[10cqw] h-[0.6cqw] bg-[#6F51D3] rounded-full" />
            </div>

            {/* Subtitle / summary */}
            {s.subtitle && (
              <p className="text-[2.2cqw] text-slate-500 leading-relaxed font-medium">{s.subtitle}</p>
            )}

            <div className="flex-1 flex gap-[2cqw] min-h-0 overflow-hidden items-center">
              {/* Action bullets */}
              {s.bullets.length > 0 && (
                <div className="flex-1 flex flex-col gap-[2cqw] overflow-hidden pr-1">
                  {s.bullets.slice(0, 5).map((b, idx) => {
                    const parts = b.split("|");
                    const label = parts[0]?.trim();
                    const detail = parts[1]?.trim();
                    const accent = idx % 2 === 0 ? "#6F51D3" : "#9937CE";
                    return (
                      <div key={idx} className="flex items-start gap-[1.5cqw] p-[1.5cqw] rounded-[1.2cqw] bg-slate-50 border border-slate-100 shadow-sm">
                        <div className="shrink-0 w-[2.8cqw] h-[2.8cqw] rounded-full flex items-center justify-center text-white text-[1.4cqw] font-black shadow-sm" style={{ backgroundColor: accent }}>
                          {idx + 1}
                        </div>
                        <div className="min-w-0">
                          {label && detail ? (
                            <><span className="font-bold text-[1.8cqw] text-slate-800">{label} </span><span className="text-[1.8cqw] text-slate-500">{detail}</span></>
                          ) : (
                            <span className="text-[1.8cqw] text-slate-700">{b}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Decorative shapes */}
          <div className="absolute -bottom-6 -right-6 w-[12cqw] h-[12cqw] bg-[#6F51D3] rounded-[2cqw] rotate-12 opacity-70" />
          <div className="absolute top-4 right-4 w-[8cqw] h-[8cqw] bg-[#9937CE] rounded-full opacity-30" />
        </div>
      );
    }

    return null;
  };

  if (!document) return null;

  const paperTitle = document.kind === "paper" ? document.paper.title : "Research Paper";

  if (isGenerating) {
    return (
      <div className="fixed inset-0 z-[120] flex flex-col items-center justify-center bg-slate-950 text-slate-100 select-none overflow-hidden animate-in fade-in duration-300">
        {/* Dynamic background glows */}
        <div className="absolute top-1/4 left-1/4 w-[350px] h-[350px] bg-violet-600/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] bg-cyan-600/10 rounded-full blur-[100px] pointer-events-none" />

        {/* Central Card */}
        <div className="relative w-full max-w-md p-8 bg-slate-900/40 border border-slate-800/80 rounded-3xl shadow-2xl backdrop-blur-md flex flex-col items-center text-center mx-4">
          {/* Animated Glow Rings */}
          <div className="relative w-24 h-24 mb-6 flex items-center justify-center">
            {/* Spinning gradient rings */}
            <div className="absolute inset-0 rounded-full border-2 border-dashed border-violet-500/30 animate-[spin_8s_linear_infinite]" />
            <div className="absolute inset-2 rounded-full border-2 border-dashed border-cyan-500/40 animate-[spin_4s_linear_infinite_reverse]" />
            <div className="absolute inset-4 rounded-full border-2 border-yellow-400/50 animate-[spin_6s_linear_infinite]" />
            
            {/* Pulsing Core with Brand Logo */}
            <div className="w-16 h-16 rounded-full bg-slate-950 border-2 border-yellow-400/80 flex items-center justify-center overflow-hidden p-2 shadow-lg shadow-yellow-500/30 animate-pulse">
              <img 
                src="/logo-mark.png" 
                alt="GenAI Academy & Hub Logo" 
                className="w-full h-full object-contain" 
              />
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-xs font-semibold text-violet-300 select-none mb-4 animate-pulse">
            ✦ AI Slideshow Generation Active
          </span>

          <h2 className="text-lg font-bold text-slate-100 mb-2 truncate max-w-xs" title={paperTitle}>
            Generating presentation for:
          </h2>
          <p className="text-xs text-slate-400 italic mb-6 max-w-sm line-clamp-2 px-2">
            "{paperTitle}"
          </p>

          {/* Loading Logs */}
          <div className="w-full text-left bg-slate-950/80 rounded-2xl border border-slate-800/60 p-4 h-28 flex flex-col justify-center gap-1 font-mono">
            <div className={`text-[10px] transition-all duration-300 ${genStep >= 0 ? "text-emerald-400 font-semibold" : "text-slate-600 animate-pulse"}`}>
              {genStep >= 0 ? "✔ Structure parsing complete" : "⚙ Reading paper sections..."}
            </div>
            <div className={`text-[10px] transition-all duration-300 ${genStep >= 1 ? "text-emerald-400 font-semibold" : genStep === 0 ? "text-violet-400 animate-pulse" : "text-slate-650"}`}>
              {genStep >= 1 ? "✔ Key insights synthesized" : genStep === 0 ? "● Synthesizing methodologies..." : "⚙ Synthesizing insights..."}
            </div>
            <div className={`text-[10px] transition-all duration-300 ${genStep >= 2 ? "text-emerald-400 font-semibold" : genStep === 1 ? "text-cyan-400 animate-pulse" : "text-slate-650"}`}>
              {genStep >= 2 ? "✔ Visual slide layouts mapped" : genStep === 1 ? "● Mapping slide layouts..." : "⚙ Building layouts..."}
            </div>
            <div className={`text-[10px] transition-all duration-300 ${genStep >= 3 ? "text-emerald-400 font-semibold" : genStep === 2 ? "text-yellow-400 animate-pulse" : "text-slate-650"}`}>
              {genStep >= 3 ? "✔ Presentation compiled successfully" : genStep === 2 ? "● Applying animations..." : "⚙ Applying transitions..."}
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full h-1.5 bg-slate-800 rounded-full mt-6 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-500 transition-all duration-300"
              style={{ width: `${(genStep + 1) * 25}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  if (slides.length === 0) return null;

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
          className="w-full h-full md:h-auto min-h-[60vh] md:aspect-video bg-white border border-slate-200 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.4)] relative overflow-hidden animate-in slide-in-from-right-16 fade-in duration-700 ease-out fill-mode-forwards @container"
        >
          {renderSlideContent(slides[currentSlide])}

          {/* Slide Number Bottom Right */}
          <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-8 text-slate-300 font-mono text-base md:text-xl font-bold bg-white/80 p-1 rounded-md backdrop-blur-sm z-30">
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
          
          <span className="text-white font-mono text-xs md:text-sm tracking-wider drop-shadow-md bg-black/60 px-4 py-1.5 rounded-full backdrop-blur-md select-none">
            {currentSlide + 1} out of {slides.length} {slides.length === 1 ? "page" : "pages"}
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
