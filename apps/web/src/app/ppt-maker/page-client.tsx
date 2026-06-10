"use client";

import { useState, useRef, useEffect } from "react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import pptxgen from "pptxgenjs";
import {
  Plus,
  Trash2,
  Image as ImageIcon,
  Download,
  LayoutTemplate,
  Palette,
  Type,
  X,
  Presentation,
  CheckCircle2,
  List,
  Play,
  Layers,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Wand2,
  Settings2
} from "lucide-react";

type Slide = {
  id: string;
  type: "title" | "content";
  title: string;
  subtitle: string;
  bullets: string[];
  bgColor: string;
  textColor: string;
  imageUrl: string;
  bgStyle: "solid" | "gradient" | "gradient-radial" | "pattern" | "pattern-dots" | "image";
  bgImageUrl: string;
  transition: "none" | "fade" | "slide-left" | "zoom";
  layout?: "title" | "intro" | "objectives" | "scope" | "timeline" | "budget" | "conclusion";
  imgX?: number;
  imgY?: number;
  imgW?: number;
  imgH?: number;
};

// Helper to get default image bounds based on layout
const getDefaultImageBounds = (layout?: string) => {
  switch (layout) {
    case "intro":
    case "objectives":
      return { x: 69, y: 24, w: 24, h: 60 };
    case "scope":
      return { x: 67.5, y: 16, w: 26.3, h: 66.7 };
    case "timeline":
    case "budget":
    case "conclusion":
      return { x: 63.8, y: 24, w: 30, h: 60 };
    default:
      return { x: 62, y: 15, w: 32, h: 70 };
  }
};

// Helper to calculate pptx bounds from %
const getImageExportBounds = (s: Slide) => {
  const slideW = 13.33;
  const slideH = 7.5;
  const defaults = getDefaultImageBounds(s.layout);
  const xPct = s.imgX ?? defaults.x;
  const yPct = s.imgY ?? defaults.y;
  const wPct = s.imgW ?? defaults.w;
  const hPct = s.imgH ?? defaults.h;
  return {
    x: (xPct / 100) * slideW,
    y: (yPct / 100) * slideH,
    w: (wPct / 100) * slideW,
    h: (hPct / 100) * slideH
  };
};

// DraggableResizableImage Component
const DraggableResizableImage = ({
  imageUrl,
  slideId,
  imgX,
  imgY,
  imgW,
  imgH,
  isPlaying,
  updateSlide,
  layout,
  isSelected,
  setSelected
}: {
  imageUrl: string;
  slideId: string;
  imgX?: number;
  imgY?: number;
  imgW?: number;
  imgH?: number;
  isPlaying: boolean;
  updateSlide: (id: string, updates: Partial<Slide>) => void;
  layout?: string;
  isSelected: boolean;
  setSelected: (id: string | null) => void;
}) => {
  const defaults = getDefaultImageBounds(layout);
  const x = imgX ?? defaults.x;
  const y = imgY ?? defaults.y;
  const w = imgW ?? defaults.w;
  const h = imgH ?? defaults.h;

  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const startPos = useRef({ x: 0, y: 0 });
  const startCoords = useRef({ x: 0, y: 0, w: 0, h: 0 });
  const resizeDir = useRef<string>("se");

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isPlaying) return;
    e.preventDefault();
    e.stopPropagation();
    setSelected(slideId); // Select this slide's image
    setIsDragging(true);
    startPos.current = { x: e.clientX, y: e.clientY };
    startCoords.current = { x, y, w, h };
  };

  const handleResizeMouseDown = (e: React.MouseEvent, dir: string) => {
    if (isPlaying) return;
    e.stopPropagation();
    e.preventDefault();
    setSelected(slideId); // Keep selected
    setIsResizing(true);
    resizeDir.current = dir;
    startPos.current = { x: e.clientX, y: e.clientY };
    startCoords.current = { x, y, w, h };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging && !isResizing) return;

      const slideElement = containerRef.current?.parentElement;
      if (!slideElement) return;
      const rect = slideElement.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const dx = ((e.clientX - startPos.current.x) / rect.width) * 100;
      const dy = ((e.clientY - startPos.current.y) / rect.height) * 100;

      if (isDragging) {
        let newX = Math.max(0, Math.min(100 - w, startCoords.current.x + dx));
        let newY = Math.max(0, Math.min(100 - h, startCoords.current.y + dy));
        updateSlide(slideId, {
          imgX: Math.round(newX * 10) / 10,
          imgY: Math.round(newY * 10) / 10
        });
      } else if (isResizing) {
        const dir = resizeDir.current;
        let updates: Partial<Slide> = {};

        if (dir.includes("e")) {
          const newW = Math.max(10, Math.min(100 - startCoords.current.x, startCoords.current.w + dx));
          updates.imgW = Math.round(newW * 10) / 10;
        }
        if (dir.includes("w")) {
          const newX = Math.max(0, Math.min(startCoords.current.x + startCoords.current.w - 10, startCoords.current.x + dx));
          const newW = startCoords.current.x + startCoords.current.w - newX;
          updates.imgX = Math.round(newX * 10) / 10;
          updates.imgW = Math.round(newW * 10) / 10;
        }
        if (dir.includes("s")) {
          const newH = Math.max(10, Math.min(100 - startCoords.current.y, startCoords.current.h + dy));
          updates.imgH = Math.round(newH * 10) / 10;
        }
        if (dir.includes("n")) {
          const newY = Math.max(0, Math.min(startCoords.current.y + startCoords.current.h - 10, startCoords.current.y + dy));
          const newH = startCoords.current.y + startCoords.current.h - newY;
          updates.imgY = Math.round(newY * 10) / 10;
          updates.imgH = Math.round(newH * 10) / 10;
        }

        updateSlide(slideId, updates);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, slideId, x, y, w, h]);

  return (
    <div
      ref={containerRef}
      className={`draggable-image-container absolute select-none overflow-visible ${!isPlaying && isSelected ? 'border-2 border-dashed border-indigo-500 hover:border-indigo-400 cursor-move shadow-md' : ''}`}
      style={{
        left: `${x}%`,
        top: `${y}%`,
        width: `${w}%`,
        height: `${h}%`,
        zIndex: 50,
      }}
      onMouseDown={handleMouseDown}
    >
      <img
        src={imageUrl}
        alt="Visual content"
        className="w-full h-full object-contain pointer-events-none rounded"
      />

      {!isPlaying && isSelected && (
        <>
          {/* Edge handles */}
          <div
            className="absolute top-0 left-1/2 w-3 h-3 -translate-x-1/2 -translate-y-1/2 bg-white border-2 border-indigo-500 rounded-full cursor-ns-resize z-50 hover:bg-indigo-100"
            onMouseDown={(e) => handleResizeMouseDown(e, "n")}
          />
          <div
            className="absolute bottom-0 left-1/2 w-3 h-3 -translate-x-1/2 translate-y-1/2 bg-white border-2 border-indigo-500 rounded-full cursor-ns-resize z-50 hover:bg-indigo-100"
            onMouseDown={(e) => handleResizeMouseDown(e, "s")}
          />
          <div
            className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-white border-2 border-indigo-500 rounded-full cursor-ew-resize z-50 hover:bg-indigo-100"
            onMouseDown={(e) => handleResizeMouseDown(e, "w")}
          />
          <div
            className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-white border-2 border-indigo-500 rounded-full cursor-ew-resize z-50 hover:bg-indigo-100"
            onMouseDown={(e) => handleResizeMouseDown(e, "e")}
          />

          {/* Corner handles */}
          <div
            className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white border-2 border-indigo-500 rounded-full cursor-nwse-resize z-50 hover:bg-indigo-100"
            onMouseDown={(e) => handleResizeMouseDown(e, "nw")}
          />
          <div
            className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white border-2 border-indigo-500 rounded-full cursor-nesw-resize z-50 hover:bg-indigo-100"
            onMouseDown={(e) => handleResizeMouseDown(e, "ne")}
          />
          <div
            className="absolute bottom-0 left-0 -translate-x-1/2 translate-y-1/2 w-3.5 h-3.5 bg-white border-2 border-indigo-500 rounded-full cursor-nesw-resize z-50 hover:bg-indigo-100"
            onMouseDown={(e) => handleResizeMouseDown(e, "sw")}
          />
          <div
            className="absolute bottom-0 right-0 translate-x-1/2 translate-y-1/2 w-3.5 h-3.5 bg-white border-2 border-indigo-500 rounded-full cursor-nwse-resize z-50 hover:bg-indigo-100"
            onMouseDown={(e) => handleResizeMouseDown(e, "se")}
          />
        </>
      )}
    </div>
  );
};

const DEFAULT_BG = "#FFFFFF";
const DEFAULT_TEXT = "#0F172A";

export default function PptMakerClient() {
  const [slides, setSlides] = useState<Slide[]>([
    {
      id: "1",
      type: "title",
      title: "My Presentation | PROPOSAL",
      subtitle: "Strategic planning, defined scope, execution timeline, and measurable outcomes.",
      bullets: [],
      bgColor: DEFAULT_BG,
      textColor: DEFAULT_TEXT,
      imageUrl: "",
      bgStyle: "solid",
      bgImageUrl: "",
      transition: "fade",
      layout: "title"
    }
  ]);
  const [activeSlideId, setActiveSlideId] = useState<string>("1");
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "4:3" | "16:10">("16:9");
  const [isExporting, setIsExporting] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAutoplay, setIsAutoplay] = useState(false);
  const [playIndex, setPlayIndex] = useState(0);
  const [zoom, setZoom] = useState<number>(100);
  const [isGenerating, setIsGenerating] = useState(false);

  // Outside click handler to deselect the active image
  useEffect(() => {
    const handleWindowClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.draggable-image-container')) {
        setSelectedImageId(null);
      }
    };
    window.addEventListener('mousedown', handleWindowClick);
    return () => window.removeEventListener('mousedown', handleWindowClick);
  }, []);

  // Auto Generator State
  const [appMode, setAppMode] = useState<"manual" | "automatic">("manual");
  const [autoTopic, setAutoTopic] = useState("");
  const [autoPages, setAutoPages] = useState(5);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const bgFileInputRef = useRef<HTMLInputElement>(null);

  // Set document title dynamically
  useEffect(() => {
    document.title = "Online AI PPT Maker | GenAI Academy & Hub";
  }, []);

  const activeSlideIndex = slides.findIndex(s => s.id === activeSlideId);
  const activeSlide = slides[activeSlideIndex] || slides[0];

  const updateSlide = (id: string, updates: Partial<Slide>) => {
    setSlides(slides.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const addSlide = (type: "title" | "content") => {
    const newSlide: Slide = {
      id: Math.random().toString(36).substring(7),
      type,
      title: type === "title" ? "New Title Slide" : "New Content Slide",
      subtitle: type === "title" ? "Subtitle here" : "",
      bullets: type === "content" ? ["First point | Description point details"] : [],
      bgColor: DEFAULT_BG,
      textColor: DEFAULT_TEXT,
      imageUrl: "",
      bgStyle: "solid",
      bgImageUrl: "",
      transition: "fade",
      layout: type === "title" ? "title" : "intro"
    };
    setSlides([...slides, newSlide]);
    setActiveSlideId(newSlide.id);
  };

  const deleteSlide = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (slides.length <= 1) return; // Must have at least 1 slide
    const filtered = slides.filter(s => s.id !== id);
    setSlides(filtered);
    if (activeSlideId === id) {
      setActiveSlideId(filtered[0].id);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, isBg: boolean = false) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        if (isBg) {
          updateSlide(activeSlide.id, { bgImageUrl: ev.target.result as string, bgStyle: "image" });
        } else {
          updateSlide(activeSlide.id, { imageUrl: ev.target.result as string });
        }
      }
    };
    reader.readAsDataURL(file);
    if (isBg && bgFileInputRef.current) bgFileInputRef.current.value = "";
    if (!isBg && fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleBulletChange = (idx: number, val: string) => {
    const newBullets = [...activeSlide.bullets];
    newBullets[idx] = val;
    updateSlide(activeSlide.id, { bullets: newBullets });
  };

  const addBullet = () => {
    if (activeSlide.bullets.length >= 5) return;
    updateSlide(activeSlide.id, { bullets: [...activeSlide.bullets, ""] });
  };

  const removeBullet = (idx: number) => {
    const newBullets = activeSlide.bullets.filter((_, i) => i !== idx);
    updateSlide(activeSlide.id, { bullets: newBullets });
  };

  const handleDownload = async () => {
    setIsExporting(true);
    try {
      const pptx = new pptxgen();

      if (aspectRatio === "16:9") pptx.layout = "LAYOUT_16x9";
      else if (aspectRatio === "4:3") pptx.layout = "LAYOUT_4x3";
      else if (aspectRatio === "16:10") pptx.layout = "LAYOUT_16x10";

      slides.forEach((s) => {
        const slide = pptx.addSlide();
        const layout = s.layout || (s.type === "title" ? "title" : "intro");

        // Background mapping
        if (s.bgStyle === "image" && s.bgImageUrl) {
          slide.background = { data: s.bgImageUrl };
        } else if (s.bgStyle === "pattern") {
          slide.background = { fill: "020617" }; // Export as dark base for cyber grid
        } else {
          // Fallback to base color
          slide.background = { fill: s.bgColor.replace("#", "") };
        }

        if (layout === "title") {
          const parts = s.title.split("|");
          const part1 = parts[0]?.trim() || "Project";
          const part2 = parts[1]?.trim() || "PROPOSAL";

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
            { text: (part1 || "GEN | AI").toUpperCase(), options: { fontSize: 22, color: '0F172A', bold: true, align: 'center' } }
          ], {
            x: 9.55, y: 3.84, w: 2.12, h: 1.5,
            align: 'center',
            valign: 'middle'
          });

          // 3. Title text left

          slide.addText([
            { text: part1.toUpperCase() + "\n", options: { fontSize: 54, color: '0F172A', fontFace: 'Calibri' } },
            { text: part2.toUpperCase(), options: { fontSize: 54, bold: true, color: '6F51D3', fontFace: 'Calibri' } }
          ], {
            x: 0.53, y: 2.3, w: 7.89, h: 3.0,
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
          const hasImg = !!s.imageUrl;
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

          // Description (Left)
          slide.addText(desc, {
            x: 0.9, y: 1.8, w: hasImg ? 4.5 : 6.0, h: 4.5,
            fontSize: 18, color: '475569', fontFace: 'Calibri',
            valign: 'top'
          });

          // Metrics (Right)
          let currentY = 2.2;
          const defaultMetrics = [
            { label: "Execution & Monitoring", val: "64%", color: "6F51D3" },
            { label: "Documentation & Reporting", val: "36%", color: "9937CE" }
          ];

          const finalMetrics = metrics.length > 0 ? metrics.map((m, idx) => ({
            label: m.label,
            val: m.val,
            color: idx === 0 ? "6F51D3" : "9937CE"
          })) : defaultMetrics;

          const metricsX = hasImg ? 5.8 : 7.5;
          finalMetrics.forEach((m) => {
            const numericVal = parseInt(m.val) || 50;
            const barWidth = hasImg ? 3.0 : 4.0;

            // Label and Percent
            slide.addText(m.label, {
              x: metricsX, y: currentY, w: barWidth - 1.0, h: 0.3,
              fontSize: 16, bold: true, color: '64748B', fontFace: 'Calibri'
            });
            slide.addText(m.val, {
              x: metricsX + barWidth - 1.0, y: currentY, w: 1.0, h: 0.3,
              fontSize: 18, bold: true, color: m.color, fontFace: 'Calibri', align: 'right'
            });

            currentY += 0.35;

            // Bar Background
            slide.addShape('roundRect', {
              x: metricsX, y: currentY, w: barWidth, h: 0.15,
              fill: { color: 'F1EDFF' },
              line: { color: 'F1EDFF' }
            });
            // Bar Progress
            slide.addShape('roundRect', {
              x: metricsX, y: currentY, w: barWidth * (numericVal / 100), h: 0.15,
              fill: { color: m.color },
              line: { color: m.color }
            });

            currentY += 0.65;
          });

          if (hasImg) {
            const bounds = getImageExportBounds(s);
            slide.addImage({ data: s.imageUrl, x: bounds.x, y: bounds.y, w: bounds.w, h: bounds.h });
          }
        }
        else if (layout === "objectives") {
          const hasImg = !!s.imageUrl;
          // SlideEgg Project Objectives Layout
          // Title on left
          slide.addText(s.title || "Project Objectives", {
            x: 0.9, y: 1.8, w: hasImg ? 3.5 : 4.5, h: 3.0,
            fontSize: 46, bold: true, color: '0F172A', fontFace: 'Calibri',
            valign: 'middle'
          });

          // Left indicator line
          slide.addShape('rect', {
            x: 0.9, y: 4.8, w: 1.5, h: 0.05,
            fill: { color: '6F51D3' }
          });

          // Far-right accent block (only if no image)
          if (!hasImg) {
            slide.addShape('roundRect', {
              x: 12.0, y: 1.5, w: 1.33, h: 4.5,
              fill: { color: '6F51D3' },
              line: { color: '6F51D3' }
            });
          }

          // 3 Objectives on right
          let currentY = 1.6;
          const listItems = s.bullets.length > 0 ? s.bullets : [
            "Expand Market Reach | Enter new target markets, attract diverse client segments.",
            "Optimize Resource ROI | Align human capital, technical tools, and operations.",
            "Enhance Operations | Build scalable processes and establish tracking."
          ];

          const bulletsX = hasImg ? 4.8 : 6.5;
          const bulletsW = hasImg ? 4.0 : 4.3;

          listItems.slice(0, 3).forEach((item, idx) => {
            const parts = item.split("|");
            const heading = parts[0]?.trim() || `Objective ${idx + 1}`;
            const desc = parts[1]?.trim() || "Details about this objective...";
            const themeColor = idx % 2 === 0 ? "6F51D3" : "9937CE";

            // Circle shape
            slide.addShape('ellipse', {
              x: bulletsX, y: currentY + 0.1, w: 0.5, h: 0.5,
              line: { color: themeColor, width: 2 },
              fill: { color: 'FFFFFF' }
            });
            // Circle Number
            slide.addText((idx + 1).toString(), {
              x: bulletsX, y: currentY + 0.1, w: 0.5, h: 0.5,
              fontSize: 16, bold: true, color: themeColor, fontFace: 'Calibri',
              align: 'center', valign: 'middle'
            });

            // Heading and description
            slide.addText([
              { text: heading + "\n", options: { fontSize: 20, bold: true, color: '0F172A' } },
              { text: desc, options: { fontSize: 15, color: '64748B' } }
            ], {
              x: bulletsX + 0.7, y: currentY, w: bulletsW, h: 1.0,
              valign: 'top'
            });

            currentY += 1.6;
          });

          if (hasImg) {
            const bounds = getImageExportBounds(s);
            slide.addImage({ data: s.imageUrl, x: bounds.x, y: bounds.y, w: bounds.w, h: bounds.h });
          }
        }
        else if (layout === "scope") {
          const hasImg = !!s.imageUrl;
          // SlideEgg Scope of Work (2x2 grid or 1x4 list if image is present) Layout
          // Title on left
          slide.addText(s.title || "Scope of Work", {
            x: 0.8, y: 1.8, w: hasImg ? 3.5 : 5.0, h: 3.0,
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
            "System Development | Engineering and system integration testing.",
            "Growth Marketing | Launch campaigns and community adoption.",
            "Launch Execution | Coordinate public launch events and support."
          ];

          if (hasImg) {
            // Render as a single column of 4 items next to the image
            const colors = ['6F51D3', '9937CE', '9937CE', '6F51D3'];
            listItems.slice(0, 4).forEach((item, idx) => {
              const cardX = 4.8;
              const cardY = 1.2 + idx * 1.35;
              const cardW = 3.8;
              const cardH = 1.25;
              const themeColor = colors[idx % colors.length];

              const parts = item.split("|");
              const heading = parts[0]?.trim() || `Scope ${idx + 1}`;
              const desc = parts[1]?.trim() || "Details about this task...";

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
                fontSize: 16, bold: true, color: '0F172A', fontFace: 'Calibri',
                valign: 'middle'
              });

              // Description
              slide.addText(desc, {
                x: cardX + 0.2, y: cardY + 0.6, w: cardW - 0.4, h: cardH - 0.7,
                fontSize: 14, color: '64748B', fontFace: 'Calibri',
                valign: 'top'
              });
            });

            const bounds = getImageExportBounds(s);
            slide.addImage({ data: s.imageUrl, x: bounds.x, y: bounds.y, w: bounds.w, h: bounds.h });
          } else {
            // Grid coordinates for 2x2 cards
            const gridCoords = [
              { x: 6.5, y: 1.2, color: '6F51D3' },
              { x: 9.5, y: 1.2, color: '9937CE' },
              { x: 6.5, y: 3.8, color: '9937CE' },
              { x: 9.5, y: 3.8, color: '6F51D3' }
            ];

            listItems.slice(0, 4).forEach((item, idx) => {
              const coord = gridCoords[idx];
              const parts = item.split("|");
              const heading = parts[0]?.trim() || `Scope ${idx + 1}`;
              const desc = parts[1]?.trim() || "Details about this task...";

              // Card background
              slide.addShape('roundRect', {
                x: coord.x, y: coord.y, w: 2.6, h: 2.2,
                fill: { color: 'F8F6FF' },
                line: { color: 'E2E8F0', width: 1.5 }
              });

              // Dot shape
              slide.addShape('ellipse', {
                x: coord.x + 0.2, y: coord.y + 0.2, w: 0.3, h: 0.3,
                fill: { color: coord.color },
                line: { color: coord.color }
              });

              // Heading
              slide.addText(heading, {
                x: coord.x + 0.6, y: coord.y + 0.2, w: 1.8, h: 0.3,
                fontSize: 16, bold: true, color: '0F172A', fontFace: 'Calibri',
                valign: 'middle'
              });

              // Description
              slide.addText(desc, {
                x: coord.x + 0.2, y: coord.y + 0.7, w: 2.2, h: 1.3,
                fontSize: 14, color: '64748B', fontFace: 'Calibri',
                valign: 'top'
              });
            });
          }
        }
        else if (layout === "timeline") {
          const hasImg = !!s.imageUrl;
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

          // START indicator text
          slide.addText("START", {
            x: 0.5, y: 2.9, w: 1.2, h: 0.5,
            fontSize: 24, bold: true, color: '6F51D3', fontFace: 'Calibri',
            align: 'center'
          });

          // Connecting timeline line
          slide.addShape('rect', {
            x: 1.8, y: 3.15, w: hasImg ? 6.0 : 8.0, h: 0.05,
            fill: { color: 'E2E8F0' }
          });

          const timelineNodes = hasImg ? [
            { x: 1.8, color: '6F51D3' },
            { x: 4.3, color: '9937CE' },
            { x: 6.8, color: '6F51D3' }
          ] : [
            { x: 2.2, color: '6F51D3' },
            { x: 5.7, color: '9937CE' },
            { x: 9.2, color: '6F51D3' }
          ];

          const listItems = s.bullets.length > 0 ? s.bullets : [
            "Planning & Research | Define project scope, conduct research.",
            "Development & Execution | Develop solutions, implement tasks.",
            "Launch & Evaluation | Launch project and measure performance."
          ];

          const nodeW = hasImg ? 1.8 : 2.3;

          listItems.slice(0, 3).forEach((item, idx) => {
            const node = timelineNodes[idx];
            const parts = item.split("|");
            const heading = parts[0]?.trim() || `Phase ${idx + 1}`;
            const desc = parts[1]?.trim() || "Milestone details...";

            // Outer Circle
            slide.addShape('ellipse', {
              x: node.x, y: 2.7, w: 0.9, h: 0.9,
              fill: { color: 'FFFFFF' },
              line: { color: node.color, width: 3 }
            });
            // Inner Circle Dot
            slide.addShape('ellipse', {
              x: node.x + 0.25, y: 2.95, w: 0.4, h: 0.4,
              fill: { color: node.color },
              line: { color: node.color }
            });

            // Text box for Phase Title
            slide.addText(heading, {
              x: node.x - (nodeW - 0.9) / 2, y: 3.8, w: nodeW, h: 0.4,
              fontSize: 18, bold: true, color: '0F172A', fontFace: 'Calibri',
              align: 'center'
            });

            // Text box for Phase Description
            slide.addText(desc, {
              x: node.x - (nodeW - 0.9) / 2, y: 4.3, w: nodeW, h: 1.8,
              fontSize: 14, color: '64748B', fontFace: 'Calibri',
              align: 'center', valign: 'top'
            });
          });

          if (hasImg) {
            const bounds = getImageExportBounds(s);
            slide.addImage({ data: s.imageUrl, x: bounds.x, y: bounds.y, w: bounds.w, h: bounds.h });
          }
        }
        else if (layout === "budget") {
          const hasImg = !!s.imageUrl;
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

          const cardXCoords = hasImg ? [0.8, 3.3, 5.8] : [0.8, 4.9, 9.0];
          const cardW = hasImg ? 2.3 : 3.5;
          const listItems = s.bullets.length > 0 ? s.bullets : [
            "Research & Feasibility | $89K | Initial assessments and consulting.",
            "Development & Engineering | $113K | Tooling and core development.",
            "Marketing & Launch | $219K | Promotion and community growth."
          ];

          listItems.slice(0, 3).forEach((item, idx) => {
            const startX = cardXCoords[idx];
            const parts = item.split("|");
            const heading = parts[0]?.trim() || `Item ${idx + 1}`;
            const val = parts[1]?.trim() || "$0K";
            const desc = parts[2]?.trim() || "Allocation details...";
            const badgeColor = idx === 1 ? "9937CE" : "6F51D3";

            // Snipped card shape
            slide.addShape('snip1Rect', {
              x: startX, y: 2.4, w: cardW, h: 4.2,
              fill: { color: 'F8F6FF' },
              line: { color: 'E2E8F0', width: 1.5 }
            });

            // Card Title
            slide.addText(heading, {
              x: startX + 0.2, y: 2.7, w: cardW - 0.4, h: 0.6,
              fontSize: 18, bold: true, color: '0F172A', fontFace: 'Calibri'
            });

            // Card Description
            slide.addText(desc, {
              x: startX + 0.2, y: 3.5, w: cardW - 0.4, h: 1.8,
              fontSize: 14, color: '64748B', fontFace: 'Calibri',
              valign: 'top'
            });

            // Money Badge Shape
            slide.addShape('roundRect', {
              x: startX + (cardW - 1.5) / 2, y: 5.6, w: 1.5, h: 0.5,
              fill: { color: badgeColor },
              line: { color: badgeColor }
            });
            // Money Badge Text
            slide.addText(val, {
              x: startX + (cardW - 1.5) / 2, y: 5.6, w: 1.5, h: 0.5,
              fontSize: 18, bold: true, color: 'FFFFFF', fontFace: 'Calibri',
              align: 'center', valign: 'middle'
            });
          });

          if (hasImg) {
            const bounds = getImageExportBounds(s);
            slide.addImage({ data: s.imageUrl, x: bounds.x, y: bounds.y, w: bounds.w, h: bounds.h });
          }
        }
        else if (layout === "conclusion") {
          const hasImg = !!s.imageUrl;
          // SlideEgg Conclusion Layout
          // Title
          slide.addText(s.title || "Conclusion", {
            x: 1.0, y: 2.0, w: hasImg ? 7.0 : 11.3, h: 0.8,
            fontSize: 46, bold: true, color: '0F172A', fontFace: 'Calibri',
            align: hasImg ? 'left' : 'center'
          });

          // Horizontal indicator line
          slide.addShape('rect', {
            x: hasImg ? 1.0 : 5.9, y: 3.0, w: 1.5, h: 0.05,
            fill: { color: '6F51D3' }
          });

          // Text content
          const contentText = s.subtitle || (s.bullets[0] ? s.bullets.join(" ") : "This project proposal presents a structured and result-driven plan. We appreciate your partnership.");
          slide.addText(contentText, {
            x: hasImg ? 1.0 : 2.0, y: hasImg ? 6.8 : 9.3, w: hasImg ? 6.8 : 9.3, h: 2.5,
            fontSize: 22, color: '475569', fontFace: 'Calibri',
            align: hasImg ? 'left' : 'center', valign: 'top'
          });

          if (hasImg) {
            const bounds = getImageExportBounds(s);
            slide.addImage({ data: s.imageUrl, x: bounds.x, y: bounds.y, w: bounds.w, h: bounds.h });
          } else {
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
        }
      });

      const safeTitle = slides[0]?.title.split("|")[0].replace(/[^a-z0-9]/gi, '_').toLowerCase().substring(0, 30) || "presentation";
      await pptx.writeFile({ fileName: `${safeTitle}.pptx` });
    } catch (err) {
      console.error("Failed to export PPT:", err);
      alert("An error occurred while exporting your presentation.");
    } finally {
      setIsExporting(false);
    }
  };

  // Procedural Auto-Generator — Powered Up
  const generateProceduralSlides = () => {
    if (!autoTopic.trim()) {
      alert("Please enter a topic name.");
      return;
    }

    setIsGenerating(true);

    const transitions: Slide["transition"][] = ["fade", "slide-left", "zoom", "fade", "slide-left", "fade", "zoom", "slide-left", "fade", "zoom", "slide-left", "fade"];

    const createSlide = (
      type: "title" | "content",
      title: string,
      subtitle: string,
      bullets: string[],
      layout: Slide["layout"],
      idx = 0
    ): Slide => ({
      id: Math.random().toString(36).substring(7),
      type,
      title,
      subtitle,
      bullets: bullets.slice(0, 5),
      bgColor: "#FFFFFF",
      textColor: "#0F172A",
      bgStyle: "solid",
      bgImageUrl: "",
      transition: transitions[idx % transitions.length],
      imageUrl: "",
      layout
    });

    const t = autoTopic.trim();
    const newSlides: Slide[] = [];
    let idx = 0;

    // ── SLIDE 1: Title ──────────────────────────────────────────────
    newSlides.push(createSlide(
      "title",
      `${t.toUpperCase()} | PROPOSAL`,
      "A comprehensive strategic framework covering objectives, scope, execution roadmap, resource planning, and measurable success criteria.",
      [], "title", idx++
    ));

    // ── SLIDE 2: Executive Summary (always shown) ───────────────────
    newSlides.push(createSlide(
      "content", "Executive Summary", "",
      [
        `Context & Challenge | ${t} addresses a critical gap in current operations. This initiative targets measurable improvements across productivity, market penetration, and efficiency.`,
        `Proposed Solution | A phased deployment of ${t} integrating best-in-class tools, cross-functional collaboration, and data-driven decision-making frameworks.`,
        `Key Value Drivers | Cost reduction, accelerated time-to-market, improved stakeholder satisfaction, and sustainable scalability form the core value pillars.`,
        `Success Criteria | KPIs include 30%+ throughput uplift, ≥99.5% uptime, NPS score above 70, and on-time delivery across all project phases.`,
        `Strategic Alignment | ${t} directly supports organizational growth targets and regulatory compliance requirements for the upcoming fiscal cycle.`
      ],
      "intro", idx++
    ));

    // ── Full slide pool ─────────────────────────────────────────────
    const slidePool: Array<() => Slide> = [

      () => createSlide("content", "Strategic Objectives", "",
        [
          `Market Expansion | Position ${t} to penetrate new verticals, capture high-intent customer segments, and establish authority in underserved markets.`,
          `Operational Efficiency | Automate redundant workflows, eliminate bottlenecks, and align team roles with delivery tooling for faster cycle times.`,
          `Brand & Trust Building | Deliver consistent, high-quality touchpoints that build long-term customer loyalty and competitive differentiation.`,
          `Revenue Diversification | Introduce tiered service models, upsell pathways, and recurring revenue streams directly linked to ${t} adoption.`,
          `Compliance & Governance | Ensure all deliverables meet applicable regulatory, security, and data privacy standards from day one of launch.`,
          `Innovation Velocity | Foster rapid iteration, validated experimentation, and knowledge-sharing to sustain competitive long-term advantage.`
        ],
        "objectives", idx++),

      () => createSlide("content", "Scope of Work", "",
        [
          `Discovery & Research | Stakeholder interviews, competitive landscape analysis, market sizing, and needs assessment across all impacted departments.`,
          `Architecture & Design | Define system architecture, data models, API contracts, UI/UX wireframes, and integration blueprints for ${t}.`,
          `Engineering & Build | Full-stack development, CI/CD pipeline setup, database configuration, security hardening, and performance optimization.`,
          `Quality Assurance | Unit, integration, load, and user acceptance testing with documented test plans and defect tracking protocols.`,
          `Deployment & Migration | Staged rollout across environments, legacy data migration, cutover planning, and zero-downtime deployment strategy.`,
          `Training & Enablement | Role-specific onboarding, knowledge base creation, video tutorials, and live Q&A sessions for all end-users.`
        ],
        "scope", idx++),

      () => createSlide("content", "Project Roadmap", "",
        [
          `Phase 1 — Foundation (Weeks 1–3) | Kick-off, team onboarding, environment provisioning, requirements lock, and sprint 0 setup for ${t}.`,
          `Phase 2 — Core Build (Weeks 4–9) | Iterative feature development, bi-weekly demos, stakeholder feedback loops, and code review cycles.`,
          `Phase 3 — Integration (Weeks 10–12) | Third-party API connections, SSO configuration, data pipeline validation, and end-to-end testing.`,
          `Phase 4 — UAT & Hardening (Weeks 13–14) | User acceptance testing, performance benchmarking, security audit, and bug-fix sprints.`,
          `Phase 5 — Launch (Week 15) | Production deployment, hypercare support window, real-time monitoring, and go-live communications.`,
          `Phase 6 — Post-Launch (Weeks 16–20) | Retrospective, performance review, feature backlog grooming, and handoff to operations team.`
        ],
        "timeline", idx++),

      () => createSlide("content", "Budget Allocation",
        `Estimated financial investment for a full-lifecycle ${t} deployment across all functional areas and phases.`,
        [
          `Discovery & Planning | $42,000 | Requirements workshops, competitive research, feasibility analysis, and project management tooling.`,
          `Design & UX | $38,000 | UI/UX design sprints, prototyping, user research sessions, border alignment, and design system creation.`,
          `Engineering & Dev | $128,000 | Frontend, backend, database, DevOps, QA engineers, and code review infrastructure over 15 weeks.`,
          `Infrastructure & Cloud | $34,000 | Cloud hosting, CDN, storage, security certs, monitoring services, and disaster recovery setup.`,
          `Marketing & Launch | $55,000 | Campaign creation, PR outreach, social amplification, launch events, and early adopter incentives.`,
          `Contingency Reserve | $23,000 | 10% buffer for scope changes, unexpected technical complexity, and external vendor delays.`
        ],
        "budget", idx++),

      () => createSlide("content", "Key Performance Indicators", "",
        [
          `Adoption Rate | Target ≥80% active usage within 60 days of launch across all designated user cohorts and departments.`,
          `System Reliability | Maintain ≥99.5% uptime SLA with P1 incident response time under 15 minutes and daily health monitoring.`,
          `Throughput Uplift | Achieve 35–45% improvement in process throughput vs. pre-${t} baseline benchmarks within Q1.`,
          `Cost Per Unit | Reduce operational cost-per-output by at least 22% within the first two quarters post-deployment.`,
          `Customer Satisfaction | Net Promoter Score (NPS) ≥72 and Customer Effort Score (CES) ≤2.5 in post-deployment surveys.`,
          `Time to Value | Demonstrate measurable ROI within 90 days through quantified efficiency gains and revenue attribution.`
        ],
        "intro", idx++),

      () => createSlide("content", `Technology Stack for ${t}`, "",
        [
          `Frontend Layer | React 18 + TypeScript with Tailwind CSS, Storybook component library, and Lighthouse-audited performance.`,
          `Backend & APIs | Node.js microservices on Docker containers, RESTful + GraphQL API gateway, rate limiting, and OAuth 2.0 security.`,
          `Data & Storage | PostgreSQL for relational data, Redis for caching, S3-compatible object storage, and Kafka event streaming.`,
          `DevOps & CI/CD | GitHub Actions pipelines, Terraform infrastructure-as-code, automated staging deploys, and rollback mechanisms.`,
          `Observability | Datadog APM, structured logging via Winston, custom dashboards, and PagerDuty alert routing for on-call teams.`,
          `Security & Compliance | AES-256 encryption, GDPR-compliant data handling, penetration testing, and SOC 2 Type II alignment.`
        ],
        "scope", idx++),

      () => createSlide("content", "Risk Management", "",
        [
          `Scope Creep | Mitigation: Strict change control process, weekly scope reviews, and locked requirements sign-off before development.`,
          `Resource Availability | Mitigation: 15% capacity buffer, cross-trained team members, and pre-qualified backup contractors for critical roles.`,
          `Technical Complexity | Mitigation: Spike stories for unknowns, proof-of-concept builds in Phase 1, and senior architect review gates.`,
          `Vendor Dependencies | Mitigation: Multi-vendor sourcing for key integrations, contractual SLAs, and documented fallback paths.`,
          `Data Security Breach | Mitigation: Zero-trust network design, encrypted secrets management, mandatory security review per release.`,
          `Market Timing Risk | Mitigation: Agile delivery with phased MVP releases to capture early feedback and adjust positioning pre-launch.`
        ],
        "intro", idx++),

      () => createSlide("content", "Team Structure & Responsibilities", "",
        [
          `Project Sponsor | Executive champion accountable for budget approval, strategic alignment, and escalation of critical blockers.`,
          `Project Manager | Owns delivery timeline, sprint planning, status reporting, risk register, and stakeholder communication cadence.`,
          `Lead Architect | Defines technical vision, reviews system design decisions, ensures scalability and architecture governance.`,
          `Engineering Squad | 4 full-stack engineers responsible for feature delivery, code quality, automated testing, and peer reviews.`,
          `UX/Design Lead | Drives user research, wireframing, accessibility compliance, design system ownership, and usability testing.`,
          `QA & DevOps | Manages test strategy, automated pipelines, environment stability, deployment orchestration, and monitoring.`
        ],
        "objectives", idx++),

      () => createSlide("content", "Stakeholder Engagement Plan", "",
        [
          `Executive Leadership | Monthly steering committee meetings with status dashboards, ROI tracking, and strategic decision escalations.`,
          `Department Heads | Bi-weekly working group sessions to align on cross-functional dependencies, resources, and milestone reviews.`,
          `End Users | Weekly demo sessions, early beta access, feedback surveys, and a dedicated support Slack channel for ${t}.`,
          `IT & Security | Sprint-level security reviews, infrastructure change approvals, penetration test scheduling, and audit access.`,
          `Finance Team | Monthly budget reconciliation, variance reporting, and forecast updates tied to project phase completions.`,
          `External Vendors | Weekly check-ins, SLA performance reviews, joint escalation protocols, and quarterly business reviews.`
        ],
        "scope", idx++),

      () => createSlide("content", "Competitive Landscape", "",
        [
          `Market Position | ${t} targets the premium tier where quality, reliability, and depth of features outweigh lowest-cost offerings.`,
          `Unique Value Proposition | End-to-end workflow coverage, native integrations, and a UX that requires zero specialized training.`,
          `Competitor Gap Analysis | Key competitors lack real-time collaboration, enterprise-grade security, and configurability at scale.`,
          `Defensible Moat | Proprietary data network effects, high switching costs after integration, and a growing certified partner ecosystem.`,
          `Customer Success Model | Dedicated onboarding, proactive health scores, and SLA-backed support differentiate post-sale experience.`,
          `Go-to-Market Edge | Thought leadership content, community building, and influencer advocacy in key verticals drives organic growth.`
        ],
        "objectives", idx++),

      () => createSlide("content", `Future Roadmap — ${t} v2.0`, "",
        [
          `AI-Powered Automation | Integrate ML models to predict demand patterns, automate routine tasks, and surface actionable insights.`,
          `Global Expansion | Multi-region deployment with localized content, currency support, language packs, and per-market compliance.`,
          `Advanced Analytics | Self-serve BI dashboards, cohort analysis, funnel visualization, and real-time anomaly detection.`,
          `Partner Ecosystem | Open API marketplace, third-party integration library, and co-development partnerships with complementary SaaS.`,
          `Mobile-First Experience | Native iOS and Android applications with offline sync, push notifications, and biometric authentication.`,
          `Sustainability Initiatives | Carbon-neutral cloud infrastructure, green computing practices, and ESG reporting integration.`
        ],
        "intro", idx++),

      () => createSlide("content", "Implementation Best Practices", "",
        [
          `Agile Execution | Two-week sprints with daily standups, sprint reviews, and retrospectives ensure continuous delivery and feedback.`,
          `Documentation First | Every API, architecture decision, and process change documented before code is merged to production.`,
          `Test-Driven Development | Unit test coverage ≥85%, mandatory integration tests, and automated regression suites on every build.`,
          `Feature Flags | All new features deployed behind toggles enabling safe A/B testing, gradual rollouts, and instant kill-switches.`,
          `Observability by Design | Logging, tracing, and metrics instrumented from day one — not retrofitted — across every service layer.`,
          `Blameless Post-Mortems | Every incident triggers structured root-cause analysis with corrective actions tracked to completion.`
        ],
        "scope", idx++),
    ];

    // ── Distribute slides based on page count ──────────────────────
    // We already have: Title (1) + Executive Summary (1) = 2
    // Reserve 1 for Conclusion at end → middle slots = autoPages - 3
    const targetMiddle = Math.max(0, autoPages - 3);
    const toAdd = slidePool.slice(0, Math.min(targetMiddle, slidePool.length));
    toAdd.forEach(fn => newSlides.push(fn()));

    // Pad with generated deep-dives if user wants more than pool size
    let extra = (autoPages - 3) - toAdd.length;
    let extraIdx = 1;
    while (extra > 0) {
      newSlides.push(createSlide(
        "content", `${t} — Deep Dive ${extraIdx}`, "",
        [
          `Strategic Insight ${extraIdx}.1 | Detailed breakdown of performance metrics, adoption patterns, and cross-departmental impact.`,
          `Operational Analysis | Workflow optimization, bottleneck identification, and recommended process re-engineering steps.`,
          `Data-Driven Decisions | Quantitative analysis of usage data, conversion funnels, and feedback loops for improvement.`,
          `Team Collaboration | Structured communication protocols, shared OKRs, and transparent progress tracking across stakeholders.`,
          `Risk & Mitigation | Ongoing risk radar reviews, adaptive response plans, and stakeholder escalation pathways.`,
          `Next Iteration Goals | Planned feature enhancements, user research priorities, and backlog items for the following sprint.`
        ],
        "intro", idx++
      ));
      extra--;
      extraIdx++;
    }

    // ── Final Slide: Conclusion ────────────────────────────────────
    newSlides.push(createSlide(
      "content",
      "Conclusion & Next Steps",
      `${t} is a high-impact, strategically aligned initiative with a clear path to measurable ROI. The roadmap is structured, resourced, and ready for execution.`,
      [
        `Immediate Actions | Finalize stakeholder sign-off, allocate sprint team, provision environments, and schedule kick-off workshop within 5 business days.`,
        `Quick Wins | Deliver a working MVP of core features within the first 30 days to validate assumptions and build organizational momentum.`,
        `Success Milestones | Track weekly against KPIs, surface blockers early, and maintain a transparent project health dashboard for all stakeholders.`,
        `Long-Term Vision | ${t} lays the foundation for a scalable, data-driven operating model that will compound in value over 3–5 years.`
      ],
      "conclusion", idx++
    ));

    setTimeout(() => {
      setSlides(newSlides);
      setActiveSlideId(newSlides[0].id);
      setAppMode("manual");
      setPlayIndex(0);
      setIsPlaying(true);
      setIsGenerating(false);
    }, 2500);
  };

  // Keyboard Navigation for Slideshow
  useEffect(() => {
    if (!isPlaying) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        setPlayIndex(i => Math.min(slides.length - 1, i + 1));
      } else if (e.key === "ArrowLeft") {
        setPlayIndex(i => Math.max(0, i - 1));
      } else if (e.key === "Escape") {
        setIsPlaying(false);
        setIsAutoplay(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPlaying, slides.length]);

  // Autoplay Logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && isAutoplay) {
      interval = setInterval(() => {
        setPlayIndex(i => {
          if (i >= slides.length - 1) {
            setIsAutoplay(false); // Stop at the end
            return i;
          }
          return i + 1;
        });
      }, 3000); // 3 seconds per slide
    }
    return () => clearInterval(interval);
  }, [isPlaying, isAutoplay, slides.length]);

  // Helper to render slide background CSS
  const getSlideBackgroundStyle = (s: Slide) => {
    if (s.bgStyle === "image" && s.bgImageUrl) {
      return { backgroundImage: `url(${s.bgImageUrl})`, backgroundSize: "cover", backgroundPosition: "center" };
    }
    if (s.bgStyle === "gradient") {
      return { background: `linear-gradient(135deg, ${s.bgColor} 0%, #020617 100%)` };
    }
    if (s.bgStyle === "gradient-radial") {
      return { background: `radial-gradient(circle at top right, ${s.bgColor} 0%, #020617 80%)` };
    }
    if (s.bgStyle === "pattern") {
      return {
        backgroundColor: "#020617",
        backgroundImage: `linear-gradient(to right, ${s.bgColor}22 2px, transparent 2px), linear-gradient(to bottom, ${s.bgColor}22 2px, transparent 2px)`,
        backgroundSize: "40px 40px"
      };
    }
    if (s.bgStyle === "pattern-dots") {
      return {
        backgroundColor: "#020617",
        backgroundImage: `radial-gradient(${s.bgColor}44 1.5px, transparent 1.5px)`,
        backgroundSize: "24px 24px"
      };
    }
    return { backgroundColor: s.bgColor };
  };

  // Slide content renderer
  const renderSlideContent = (s: Slide) => {
    const layout = s.layout || (s.type === "title" ? "title" : "intro");

    if (layout === "title") {
      const parts = s.title.split("|");
      return (
        <div className="absolute inset-0 w-full h-full flex z-10 p-[4.5cqw] items-center text-left bg-white select-none">
          <div className="w-[60%] flex flex-col justify-center">
            <h2 className="text-[5.5cqw] font-normal tracking-tight leading-tight text-slate-900">
              {(parts[0] || "Project").toUpperCase()}
              {parts[1] && (
                <span className="block font-black text-[#6F51D3] mt-1 text-[6.5cqw]">
                  {parts[1].trim().toUpperCase()}
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
                <span className="text-[2.2cqw] font-black text-slate-800 block break-words leading-tight uppercase">
                  {(parts[0] || "GEN | AI")}
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
      const hasImg = !!s.imageUrl;
      return (
        <div className="absolute inset-0 w-full h-full flex flex-col z-10 pt-[2.2cqw] pb-[3.5cqw] px-[4cqw] bg-white text-slate-900 overflow-hidden select-none">
          {/* Header */}
          <div className="flex items-center gap-[1.5cqw] mb-[1cqw]">
            <div className="w-[0.6cqw] h-[3.2cqw] rounded-full" style={{ background: "linear-gradient(to bottom, #6F51D3, #9937CE)" }} />
            <h2 className="text-[3.2cqw] font-extrabold text-slate-900 leading-tight">{s.title}</h2>
          </div>
          {s.subtitle && (
            <p className="text-[1.4cqw] text-slate-500 mb-[1.5cqw] leading-relaxed italic border-l-2 border-slate-200 pl-[1.2cqw]">{s.subtitle}</p>
          )}

          {/* Body Content */}
          <div className="flex-1 flex gap-[2cqw] min-h-0 overflow-hidden">
            {/* Bullets Column */}
            <div className={`${hasImg ? "w-[60%]" : "w-full"} flex flex-col gap-[1cqw] flex-1 min-h-0`}>
              {s.bullets.slice(0, 4).map((b, idx) => {
                const parts = b.split("|");
                const label = parts[0]?.trim();
                const detail = parts[1]?.trim();
                const accent = accentColors[idx % accentColors.length];
                return (
                  <div key={idx} className="flex-1 flex items-center gap-[1.5cqw] p-[1.4cqw] rounded-[1.2cqw] bg-slate-50 border border-slate-100/80 shadow-sm min-h-0">
                    <div className="shrink-0 w-[2.6cqw] h-[2.6cqw] rounded-full flex items-center justify-center text-white text-[1.3cqw] font-black shadow-sm" style={{ backgroundColor: accent }}>
                      {idx + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      {label && detail ? (
                        <div className="leading-snug">
                          <span className="font-bold text-[1.6cqw] text-slate-800">{label}</span>
                          <span className="text-[1.6cqw] text-slate-500 ml-2">{detail}</span>
                        </div>
                      ) : (
                        <div className="text-[1.6cqw] text-slate-700 leading-snug">{b}</div>
                      )}
                    </div>
                  </div>
                );
              })}
              {s.bullets.length === 0 && (
                <p className="text-[1.5cqw] text-slate-400 italic">Add bullet points with format: Title | Description</p>
              )}
            </div>
          </div>

          {s.imageUrl && (
            <DraggableResizableImage
              imageUrl={s.imageUrl}
              slideId={s.id}
              imgX={s.imgX}
              imgY={s.imgY}
              imgW={s.imgW}
              imgH={s.imgH}
              isPlaying={isPlaying}
              updateSlide={updateSlide}
              layout={s.layout}
              isSelected={selectedImageId === s.id}
              setSelected={setSelectedImageId}
            />
          )}
        </div>
      );
    }

    if (layout === "objectives") {
      const hasImg = !!s.imageUrl;
      return (
        <div className="absolute inset-0 w-full h-full flex z-10 p-[4cqw] bg-white text-slate-900 overflow-hidden select-none">
          {/* Left title panel */}
          <div className={`${hasImg ? "w-[25%]" : "w-[35%]"} shrink-0 flex flex-col justify-center pr-[2.5cqw]`}>
            <h2 className="text-[3.5cqw] font-black text-slate-900 leading-tight">
              {s.title}
            </h2>
            <div className="w-[8cqw] h-[0.5cqw] bg-[#6F51D3] mt-[2cqw] rounded-full" />
          </div>

          {/* Center Objectives panel */}
          <div className="flex-1 flex flex-col justify-center gap-[1.2cqw] z-10 overflow-hidden px-2">
            {s.bullets.slice(0, 5).map((b, idx) => {
              const parts = b.split("|");
              const title = parts[0]?.trim() || `Objective ${idx + 1}`;
              const desc = parts[1]?.trim() || "Details about this objective...";
              const color = idx % 2 === 0 ? "border-[#6F51D3] text-[#6F51D3]" : "border-[#9937CE] text-[#9937CE]";
              return (
                <div key={idx} className="flex items-start gap-[1cqw]">
                  <div className={`w-[2cqw] h-[2cqw] rounded-full border-2 ${color} flex items-center justify-center shrink-0 text-[1cqw] font-bold bg-white mt-0.5 shadow-sm`}>
                    {idx + 1}
                  </div>
                  <div>
                    <h3 className="font-bold text-[1.4cqw] text-slate-800 leading-snug">{title}</h3>
                    <p className="text-[1.1cqw] text-slate-500 leading-normal mt-0.5">{desc}</p>
                  </div>
                </div>
              );
            })}
            {s.bullets.length === 0 && (
              <p className="text-[1.5cqw] text-slate-400 italic">Add bullet points with format: Title | Description</p>
            )}
          </div>

          {!hasImg && (
            <div className="absolute right-0 top-[4cqw] bottom-[4cqw] w-[2cqw] bg-[#6F51D3] rounded-l-xl opacity-90" />
          )}

          {s.imageUrl && (
            <DraggableResizableImage
              imageUrl={s.imageUrl}
              slideId={s.id}
              imgX={s.imgX}
              imgY={s.imgY}
              imgW={s.imgW}
              imgH={s.imgH}
              isPlaying={isPlaying}
              updateSlide={updateSlide}
              layout={s.layout}
              isSelected={selectedImageId === s.id}
              setSelected={setSelectedImageId}
            />
          )}
        </div>
      );
    }

    if (layout === "scope") {
      const accentPairs = ["bg-[#6F51D3]", "bg-[#9937CE]", "bg-[#6F51D3]", "bg-[#9937CE]", "bg-[#6F51D3]", "bg-[#9937CE]"];
      const hasImg = !!s.imageUrl;
      return (
        <div className="absolute inset-0 w-full h-full flex z-10 p-[4cqw] bg-white text-slate-900 overflow-hidden select-none">
          {/* Left title panel */}
          <div className={`${hasImg ? "w-[22%]" : "w-[28%]"} flex flex-col justify-center pr-[1.5cqw] shrink-0`}>
            <h2 className="text-[3.5cqw] font-black text-slate-900 leading-tight">{s.title}</h2>
            <div className="w-[7cqw] h-[0.5cqw] bg-[#6F51D3] mt-[1.5cqw] rounded-full" />
            {s.subtitle && <p className="text-[1.3cqw] text-slate-500 mt-[1cqw] leading-relaxed">{s.subtitle}</p>}
          </div>

          {/* Right cards grid */}
          <div className={`${hasImg ? "w-[43%] max-w-[43%]" : ""} flex-1 grid ${hasImg ? "grid-cols-1" : "grid-cols-2"} gap-[0.8cqw] content-center overflow-hidden px-1`}>
            {s.bullets.slice(0, 5).map((b, idx) => {
              const parts = b.split("|");
              const title = parts[0]?.trim() || `Scope ${idx + 1}`;
              const desc = parts[1]?.trim() || "Task description details...";
              return (
                <div key={idx} className="bg-slate-50 border border-slate-100 p-[0.8cqw] rounded-[0.8cqw] flex flex-col gap-1 shadow-sm">
                  <div className="flex items-center gap-[0.6cqw]">
                    <div className={`w-[0.6cqw] h-[0.6cqw] rounded-full shrink-0 ${accentPairs[idx % accentPairs.length]}`} />
                    <h3 className="font-bold text-[1.3cqw] text-slate-800 truncate">{title}</h3>
                  </div>
                  <p className="text-[1.1cqw] text-slate-500 leading-relaxed line-clamp-2">{desc}</p>
                </div>
              );
            })}
            {s.bullets.length === 0 && (
              <p className="text-[1.5cqw] text-slate-400 italic col-span-2">Add bullet points with format: Title | Description</p>
            )}
          </div>

          {s.imageUrl && (
            <DraggableResizableImage
              imageUrl={s.imageUrl}
              slideId={s.id}
              imgX={s.imgX}
              imgY={s.imgY}
              imgW={s.imgW}
              imgH={s.imgH}
              isPlaying={isPlaying}
              updateSlide={updateSlide}
              layout={s.layout}
              isSelected={selectedImageId === s.id}
              setSelected={setSelectedImageId}
            />
          )}
        </div>
      );
    }

    if (layout === "timeline") {
      const accentColors = ["#6F51D3", "#9937CE", "#6F51D3", "#9937CE", "#6F51D3", "#9937CE"];
      const hasImg = !!s.imageUrl;
      return (
        <div className="absolute inset-0 w-full h-full flex flex-col z-10 p-[4cqw] bg-white text-slate-900 overflow-hidden select-none">
          {/* Header */}
          <div className="flex items-center gap-[1.5cqw] mb-[1.5cqw]">
            <div className="w-[0.6cqw] h-[3.2cqw] rounded-full" style={{ background: "linear-gradient(to bottom, #6F51D3, #9937CE)" }} />
            <h2 className="text-[3.2cqw] font-extrabold text-slate-900">{s.title}</h2>
          </div>

          {/* Body Content */}
          <div className="flex-1 flex gap-5 min-h-0 overflow-hidden">
            {/* Vertical timeline */}
            <div className={`${hasImg ? "w-[60%] max-w-[60%]" : "w-full"} flex-1 relative pl-[3cqw] flex flex-col gap-[0.8cqw] min-h-0 overflow-hidden`}>
              {/* Vertical line */}
              <div className="absolute left-[1.3cqw] top-1 bottom-1 w-[0.15cqw] bg-gradient-to-b from-[#6F51D3] via-[#9937CE] to-slate-200 rounded-full" />

              {s.bullets.slice(0, 5).map((b, idx) => {
                const parts = b.split("|");
                const title = parts[0]?.trim() || `Phase ${idx + 1}`;
                const desc = parts[1]?.trim() || "Milestone details...";
                const accent = accentColors[idx % accentColors.length];
                return (
                  <div key={idx} className="relative flex items-start gap-4">
                    {/* Dot */}
                    <div className="absolute -left-[2.8cqw] w-[2cqw] h-[2cqw] rounded-full border-2 border-white shadow-md flex items-center justify-center text-white text-[1cqw] font-black shrink-0 z-10" style={{ backgroundColor: accent }}>
                      {idx + 1}
                    </div>
                    {/* Content */}
                    <div className="flex-1 bg-slate-50 border border-slate-100 rounded-[0.8cqw] p-[0.7cqw] px-[1cqw] shadow-sm">
                      <h3 className="font-bold text-[1.3cqw] text-slate-800 leading-snug">{title}</h3>
                      <p className="text-[1.1cqw] text-slate-500 mt-0.5 leading-relaxed line-clamp-2">{desc}</p>
                    </div>
                  </div>
                );
              })}
              {s.bullets.length === 0 && (
                <p className="text-[1.5cqw] text-slate-400 italic">Add bullet points with format: Phase Title | Description</p>
              )}
            </div>
          </div>

          {s.imageUrl && (
            <DraggableResizableImage
              imageUrl={s.imageUrl}
              slideId={s.id}
              imgX={s.imgX}
              imgY={s.imgY}
              imgW={s.imgW}
              imgH={s.imgH}
              isPlaying={isPlaying}
              updateSlide={updateSlide}
              layout={s.layout}
              isSelected={selectedImageId === s.id}
              setSelected={setSelectedImageId}
            />
          )}
        </div>
      );
    }

    if (layout === "budget") {
      const accentColors = ["#6F51D3", "#9937CE", "#7C3AED", "#6F51D3", "#9937CE", "#7C3AED"];
      const hasImg = !!s.imageUrl;
      return (
        <div className="absolute inset-0 w-full h-full flex flex-col z-10 p-[4cqw] bg-white text-slate-900 overflow-hidden select-none">
          {/* Header */}
          <div className="flex justify-between items-end border-b border-slate-100 pb-[1cqw] mb-[1.5cqw]">
            <h2 className="text-[3.2cqw] font-extrabold text-slate-900">{s.title}</h2>
            {s.subtitle && <p className="text-[1.3cqw] text-slate-400 font-medium max-w-[45%] text-right truncate">{s.subtitle}</p>}
          </div>

          <div className="flex-1 flex gap-5 min-h-0 overflow-hidden">
            {/* Grid of budget cards */}
            <div className={`${hasImg ? "w-[62%] max-w-[62%]" : "w-full"} flex-1 grid ${hasImg ? "grid-cols-2" : "grid-cols-3"} gap-[0.8cqw] content-start overflow-hidden px-1`}>
              {s.bullets.slice(0, 5).map((b, idx) => {
                const parts = b.split("|");
                const title = parts[0]?.trim() || `Item ${idx + 1}`;
                const val = parts[1]?.trim() || "$0K";
                const desc = parts[2]?.trim() || "Allocation details...";
                const accent = accentColors[idx % accentColors.length];
                return (
                  <div key={idx} className="bg-[#F8F6FF] border border-slate-100 rounded-[0.8cqw] p-[0.8cqw] flex flex-col justify-between shadow-sm relative overflow-hidden">
                    <div className="h-[0.4cqw] w-full rounded-full mb-[0.6cqw]" style={{ backgroundColor: accent, opacity: 0.7 }} />
                    <h3 className="font-bold text-[1.3cqw] text-slate-800 leading-snug">{title}</h3>
                    <p className="text-[1.1cqw] text-slate-500 mt-[0.6cqw] leading-relaxed line-clamp-2">{desc}</p>
                    <div className="mt-[0.8cqw] px-[0.6cqw] py-[0.2cqw] text-white font-black text-[1.1cqw] rounded-[0.5cqw] text-center w-fit" style={{ backgroundColor: accent }}>
                      {val}
                    </div>
                  </div>
                );
              })}
              {s.bullets.length === 0 && (
                <p className="text-[1.5cqw] text-slate-400 italic col-span-3">Add bullet points with format: Title | Amount | Description</p>
              )}
            </div>
          </div>

          {s.imageUrl && (
            <DraggableResizableImage
              imageUrl={s.imageUrl}
              slideId={s.id}
              imgX={s.imgX}
              imgY={s.imgY}
              imgW={s.imgW}
              imgH={s.imgH}
              isPlaying={isPlaying}
              updateSlide={updateSlide}
              layout={s.layout}
              isSelected={selectedImageId === s.id}
              setSelected={setSelectedImageId}
            />
          )}
        </div>
      );
    }

    if (layout === "conclusion") {
      const hasImg = !!s.imageUrl;
      return (
        <div className="absolute inset-0 w-full h-full flex z-10 bg-white text-slate-900 overflow-hidden">
          {/* Left accent strip */}
          <div className="w-[1.2cqw] h-full shrink-0" style={{ background: "linear-gradient(to bottom, #6F51D3, #9937CE)" }} />

          <div className={`${hasImg ? "w-[60%] max-w-[60%]" : "w-full"} flex-1 flex flex-col p-[3.5cqw] justify-center min-h-0`}>
            {/* Title */}
            <h2 className="text-[3.2cqw] font-black text-slate-900 mb-1.5">{s.title}</h2>
            <div className="w-[8cqw] h-[0.5cqw] bg-[#6F51D3] mb-[1.5cqw] rounded-full" />

            {/* Subtitle / summary */}
            {s.subtitle && (
              <p className="text-[1.3cqw] text-slate-500 leading-relaxed mb-[1.5cqw] italic">{s.subtitle}</p>
            )}

            <div className="flex-1 flex gap-[2cqw] min-h-0 overflow-hidden">
              {/* Action bullets */}
              {s.bullets.length > 0 && (
                <div className="flex-1 flex flex-col gap-[0.6cqw] overflow-hidden pr-1">
                  {s.bullets.slice(0, 5).map((b, idx) => {
                    const parts = b.split("|");
                    const label = parts[0]?.trim();
                    const detail = parts[1]?.trim();
                    const accent = idx % 2 === 0 ? "#6F51D3" : "#9937CE";
                    return (
                      <div key={idx} className="flex items-start gap-[1cqw] p-[0.7cqw] rounded-[0.8cqw] bg-slate-50 border border-slate-100 shadow-sm">
                        <div className="shrink-0 w-[1.8cqw] h-[1.8cqw] rounded-full flex items-center justify-center text-white text-[0.9cqw] font-black shadow-sm" style={{ backgroundColor: accent }}>
                          {idx + 1}
                        </div>
                        <div className="min-w-0">
                          {label && detail ? (
                            <><span className="font-bold text-[1.2cqw] text-slate-800">{label} </span><span className="text-[1.2cqw] text-slate-500">{detail}</span></>
                          ) : (
                            <span className="text-[1.2cqw] text-slate-700">{b}</span>
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
          {!hasImg && (
            <>
              <div className="absolute -bottom-6 -right-6 w-[12cqw] h-[12cqw] bg-[#6F51D3] rounded-[2cqw] rotate-12 opacity-70" />
              <div className="absolute top-4 right-4 w-[8cqw] h-[8cqw] bg-[#9937CE] rounded-full opacity-30" />
            </>
          )}

          {s.imageUrl && (
            <DraggableResizableImage
              imageUrl={s.imageUrl}
              slideId={s.id}
              imgX={s.imgX}
              imgY={s.imgY}
              imgW={s.imgW}
              imgH={s.imgH}
              isPlaying={isPlaying}
              updateSlide={updateSlide}
              layout={s.layout}
              isSelected={selectedImageId === s.id}
              setSelected={setSelectedImageId}
            />
          )}
        </div>
      );
    }

    return (
      <div className="absolute inset-0 w-full h-full flex flex-col z-10 p-[4.5cqw]">
        {s.type === "title" ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <h2 className="text-[5.5cqw] font-extrabold break-words w-full" style={{ color: s.textColor }}>
              {(s.title || "Title Here").toUpperCase()}
            </h2>
            <p className="text-[2.2cqw] mt-4 break-words w-full opacity-90" style={{ color: s.textColor }}>
              {s.subtitle}
            </p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col">
            <h2 className="text-[3.5cqw] font-extrabold mb-6" style={{ color: s.textColor }}>
              {s.title || "Content Title"}
            </h2>

            <div className="flex-1 flex gap-6 min-h-0 overflow-hidden">
              <div className={`${s.imageUrl ? "w-[60%] max-w-[60%]" : "w-full"} flex-1 flex flex-col gap-[1cqw] overflow-hidden`}>
                {s.bullets.slice(0, 5).map((b, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="w-[0.6cqw] h-[0.6cqw] rounded-full mt-[0.7cqw] shrink-0 shadow-sm" style={{ backgroundColor: s.textColor, opacity: 0.9 }} />
                    <p className="text-[1.8cqw] leading-snug break-words" style={{ color: s.textColor }}>
                      {b || "Bullet point..."}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {s.imageUrl && (
          <DraggableResizableImage
            imageUrl={s.imageUrl}
            slideId={s.id}
            imgX={s.imgX}
            imgY={s.imgY}
            imgW={s.imgW}
            imgH={s.imgH}
            isPlaying={isPlaying}
            updateSlide={updateSlide}
            layout={s.layout}
            isSelected={selectedImageId === s.id}
            setSelected={setSelectedImageId}
          />
        )}
      </div>
    );
  };

  // Slide Transition CSS Mapper
  const getTransitionClass = (trans: string) => {
    switch (trans) {
      case "fade": return "animate-in fade-in duration-1000";
      case "slide-left": return "animate-in slide-in-from-right-full fade-in duration-700 ease-out";
      case "zoom": return "animate-in zoom-in-50 fade-in duration-700 ease-out";
      default: return "";
    }
  };

  const aspectClass = aspectRatio === "16:9" ? "aspect-video" : aspectRatio === "4:3" ? "aspect-[4/3]" : "aspect-[16/10]";

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-200 font-sans relative">
      <Header />

      <main className="flex-1 w-full max-w-[1600px] mx-auto px-2 sm:px-4 py-4 sm:py-6 flex flex-col lg:h-[calc(100vh-80px)] relative z-10">

        {/* Top Action Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between mb-4 sm:mb-6 gap-4 bg-slate-900/50 p-4 rounded-2xl border border-slate-800 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 rounded-xl border border-indigo-500/30">
              <Presentation className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">AI PPT Maker</h1>
              <p className="text-[10px] sm:text-xs text-slate-400">Design and download custom PPTX slides</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            {/* Mode Switcher */}
            <div className="flex bg-slate-950 rounded-lg p-1 border border-slate-800 w-full sm:w-auto shrink-0">
              <button
                onClick={() => setAppMode("manual")}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${appMode === "manual" ? "bg-slate-800 text-white shadow" : "text-slate-400 hover:text-slate-200"}`}
              >
                <Settings2 className="w-3.5 h-3.5" /> Manual
              </button>
              <button
                onClick={() => setAppMode("automatic")}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${appMode === "automatic" ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-slate-200"}`}
              >
                <Wand2 className="w-3.5 h-3.5" /> Auto-Gen
              </button>
            </div>

            {appMode === "manual" && (
              <select
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value as any)}
                className="bg-slate-950 border border-slate-800 text-slate-300 text-xs font-bold rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500 hidden sm:block"
              >
                <option value="16:9" className="bg-slate-950 text-slate-200">16:9 Widescreen</option>
                <option value="4:3" className="bg-slate-950 text-slate-200">4:3 Standard</option>
                <option value="16:10" className="bg-slate-950 text-slate-200">16:10 MacBook</option>
              </select>
            )}

            {appMode === "manual" && (
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={() => { setPlayIndex(activeSlideIndex); setIsPlaying(true); }}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-emerald-500/20"
                >
                  <Play className="w-4 h-4 fill-current" /> Play
                </button>
                <button
                  onClick={handleDownload}
                  disabled={isExporting}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isExporting ? <span className="animate-pulse">Exporting...</span> : <><Download className="w-4 h-4" /> Download</>}
                </button>
              </div>
            )}
          </div>
        </div>

        {appMode === "automatic" ? (
          /* Auto Generator Wizard UI */
          <div className="flex-1 flex items-center justify-center pt-2">
            <div className="w-full h-full bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 sm:p-16 shadow-2xl relative overflow-hidden flex flex-col justify-center">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500"></div>

              <div className="flex items-center justify-center gap-4 text-center mb-10">
                <div className="flex items-center justify-center shrink-0 w-12 h-12 bg-indigo-500/20 rounded-2xl border border-indigo-500/30 shadow-[0_0_30px_rgba(99,102,241,0.2)]">
                  <Wand2 className="w-6 h-6 text-indigo-400" />
                </div>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Automatic PPT Generator</h2>
              </div>

              <div className="space-y-8">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Topic Name</label>
                  <input
                    type="text"
                    value={autoTopic}
                    onChange={(e) => setAutoTopic(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-4 text-lg text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium placeholder:text-slate-600 shadow-inner"
                    placeholder="e.g. Cybersecurity Fundamentals"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-950/50 p-6 rounded-2xl border border-slate-800/50">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex justify-between">
                      Number of Slides
                      <span className="text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded-md font-mono">
                        {autoPages} {autoPages === 1 ? "slide" : "slides"}
                      </span>
                    </label>
                    <input
                      type="range" min="3" max="15"
                      value={autoPages}
                      onChange={(e) => setAutoPages(parseInt(e.target.value))}
                      className="w-full accent-indigo-500 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 mt-3 font-bold">
                      <span>3 (Minimal)</span>
                      <span>8 (Standard)</span>
                      <span>15 (Full)</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Aspect Ratio</label>
                    <select
                      value={aspectRatio}
                      onChange={(e) => setAspectRatio(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 font-medium cursor-pointer"
                    >
                      <option value="16:9" className="bg-slate-900 text-slate-200">16:9 Widescreen</option>
                      <option value="4:3" className="bg-slate-900 text-slate-200">4:3 Standard</option>
                      <option value="16:10" className="bg-slate-900 text-slate-200">16:10 MacBook</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={generateProceduralSlides}
                  className="group w-full py-4 mt-2 bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 hover:from-indigo-500 hover:via-violet-500 hover:to-indigo-500 text-white rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-3 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.01] active:scale-[0.99]"
                >
                  <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
                  Generate Full Presentation
                  <Presentation className="w-5 h-5 group-hover:translate-x-0.5 transition-transform duration-300" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Manual Builder Layout: Left Nav, Center Preview, Right Editor */
          <div className="flex-1 flex flex-col lg:flex-row gap-4 sm:gap-6 lg:overflow-hidden min-h-0 lg:min-h-[600px]">

            {/* Left Panel: Slide Navigator */}
            <div className="w-full lg:w-48 xl:w-64 flex flex-col gap-3 shrink-0 bg-slate-900/30 rounded-2xl border border-slate-800 p-3 h-auto lg:h-full relative">
              <div className="flex lg:flex-row flex-col items-start lg:items-center justify-between lg:sticky top-0 bg-slate-950/85 backdrop-blur-md pb-0 lg:pb-2 z-10 mb-0 lg:mb-2 shrink-0">
                <span className="text-[10px] lg:text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5"><List className="w-3.5 h-3.5" /> Slides ({slides.length})</span>
              </div>

              {/* Scrollable Thumbnail List */}
              <div className="flex flex-row lg:flex-col gap-3 overflow-x-auto lg:overflow-y-auto overflow-y-hidden lg:overflow-x-hidden scrollbar-thin pb-2 lg:pb-0 flex-1">
                {slides.map((s, idx) => (
                  <div
                    key={s.id}
                    onClick={() => setActiveSlideId(s.id)}
                    className={`relative group cursor-pointer border-2 rounded-xl p-2 transition-all shrink-0 h-20 w-32 lg:h-24 lg:w-full flex flex-col justify-center overflow-hidden
                      ${activeSlideId === s.id ? "border-indigo-500 shadow-lg shadow-indigo-500/20 scale-[1.02]" : "border-slate-800 hover:border-slate-600"}
                    `}
                    style={getSlideBackgroundStyle(s)}
                  >
                    {/* Dark overlay for thumbnail readability if gradient/image */}
                    {(s.bgStyle !== "solid") && <div className="absolute inset-0 bg-black/40" />}

                    <div className="absolute top-1 left-2 text-[10px] font-bold z-10" style={{ color: s.textColor, opacity: 0.8 }}>{idx + 1}</div>

                    <div className="text-center truncate px-2 text-[10px] sm:text-xs font-bold mt-2 z-10 relative drop-shadow-md" style={{ color: s.textColor }}>
                      {s.title || "Untitled"}
                    </div>

                    {slides.length > 1 && (
                      <button
                        onClick={(e) => deleteSlide(s.id, e)}
                        className="absolute top-1 right-1 p-1 text-white bg-black/60 hover:bg-rose-500 rounded opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all z-20 cursor-pointer"
                        title="Delete Slide"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Add Slides Action Buttons */}
              <div className="flex flex-row lg:flex-col gap-2 shrink-0 bg-slate-950/80 backdrop-blur p-1 rounded-xl border border-slate-800/80 lg:border-0 lg:border-t lg:mt-2 lg:pt-2">
                <button
                  onClick={() => addSlide("title")}
                  className="flex-1 lg:flex-none flex items-center justify-center gap-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[10px] font-bold transition-colors border border-slate-700 shadow-sm shrink-0"
                >
                  <Plus className="w-3 h-3" /> Title Slide
                </button>
                <button
                  onClick={() => addSlide("content")}
                  className="flex-1 lg:flex-none flex items-center justify-center gap-1 px-3 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 hover:text-indigo-200 rounded-lg text-[10px] font-bold transition-colors shadow-sm shrink-0"
                >
                  <Plus className="w-3 h-3" /> Content Slide
                </button>
              </div>
            </div>

            {/* Center Panel: Live Visual Preview */}
            <div className="flex-1 bg-slate-900 rounded-2xl border border-slate-800 flex items-center justify-center p-4 lg:p-8 min-h-[300px] overflow-auto relative">
              <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-slate-950/80 backdrop-blur px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase text-slate-400 border border-slate-800/50 z-20">
                <LayoutTemplate className="w-3 h-3 text-indigo-400" /> Live Preview
              </div>

              {/* Zoom Controls */}
              <div className="absolute top-4 right-4 flex items-center gap-2 bg-slate-950/80 backdrop-blur px-2 py-1 rounded-md text-[10px] font-bold uppercase text-slate-400 border border-slate-800/50 z-20">
                <span>Zoom:</span>
                <button
                  onClick={() => setZoom(z => Math.max(50, z - 10))}
                  className="px-1.5 hover:text-white transition-colors cursor-pointer"
                >
                  -
                </button>
                <span className="font-mono text-slate-200">{zoom}%</span>
                <button
                  onClick={() => setZoom(z => Math.min(150, z + 10))}
                  className="px-1.5 hover:text-white transition-colors cursor-pointer"
                >
                  +
                </button>
              </div>

              {/* Dynamic Aspect Ratio Container for Slide Preview */}
              <div
                key={activeSlide.id + activeSlide.transition}
                className={`w-full max-w-6xl ${aspectClass} rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden relative flex flex-col ring-1 ring-slate-700 transition-all duration-300 @container ${getTransitionClass(activeSlide.transition)}`}
                style={{
                  ...getSlideBackgroundStyle(activeSlide),
                  transform: `scale(${zoom / 100})`,
                  transformOrigin: 'center center',
                  transition: 'transform 0.2s, background 0.3s'
                }}
              >
                {renderSlideContent(activeSlide)}
              </div>
            </div>

            {/* Right Panel: Property Editor */}
            <div className="w-full lg:w-72 xl:w-80 shrink-0 bg-slate-900/30 rounded-2xl border border-slate-800 flex flex-col overflow-hidden h-auto min-h-[400px] lg:h-full">
              <div className="p-4 border-b border-slate-800 bg-slate-900/50">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                  <Type className="w-4 h-4 text-indigo-400" /> Slide Editor
                </span>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-6">

                {/* Template & Styles */}
                <div className="space-y-4">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
                    <LayoutTemplate className="w-3 h-3" /> Design Layout Template
                  </label>
                  <select
                    value={activeSlide.layout || (activeSlide.type === "title" ? "title" : "intro")}
                    onChange={(e) => updateSlide(activeSlide.id, { layout: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="title" className="bg-slate-950 text-slate-200">Title Slide (Cover)</option>
                    <option value="intro" className="bg-slate-950 text-slate-200">Executive Intro (Metrics)</option>
                    <option value="objectives" className="bg-slate-950 text-slate-200">Objectives (3-Row List)</option>
                    <option value="scope" className="bg-slate-950 text-slate-200">Scope of Work (2x2 Cards)</option>
                    <option value="timeline" className="bg-slate-950 text-slate-200">Project Timeline (Nodes)</option>
                    <option value="budget" className="bg-slate-950 text-slate-200">Budget Breakdown (3-Card)</option>
                    <option value="conclusion" className="bg-slate-950 text-slate-200">Conclusion Slide (Summary)</option>
                  </select>

                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5 mt-4">
                    <Layers className="w-3 h-3" /> Graphic Style (Manual BG Override)
                  </label>
                  <select
                    value={activeSlide.bgStyle}
                    onChange={(e) => updateSlide(activeSlide.id, { bgStyle: e.target.value as Slide["bgStyle"] })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="solid" className="bg-slate-950 text-slate-200">Solid Color (Classic)</option>
                    <option value="gradient" className="bg-slate-950 text-slate-200">Modern Linear Gradient</option>
                    <option value="gradient-radial" className="bg-slate-950 text-slate-200">Deep Glow (Radial)</option>
                    <option value="pattern" className="bg-slate-950 text-slate-200">Cyber Grid (Dark + Neon)</option>
                    <option value="pattern-dots" className="bg-slate-950 text-slate-200">Minimal Dots</option>
                    <option value="image" className="bg-slate-950 text-slate-200">Picture Background</option>
                  </select>

                  {activeSlide.bgStyle === "image" && (
                    <div className="pt-2">
                      <input type="file" ref={bgFileInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, true)} />
                      <button
                        onClick={() => bgFileInputRef.current?.click()}
                        className="w-full py-2 border border-dashed border-indigo-500/50 hover:bg-indigo-500/10 rounded-lg text-xs font-bold text-indigo-400 transition-colors flex items-center justify-center gap-2"
                      >
                        <ImageIcon className="w-4 h-4" /> {activeSlide.bgImageUrl ? "Change Background Image" : "Upload Background"}
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div>
                      <span className="text-[9px] text-slate-400 mb-1 block uppercase font-bold tracking-wider">Base Color</span>
                      <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 p-1.5 rounded-lg">
                        <input
                          type="color" value={activeSlide.bgColor}
                          onChange={(e) => updateSlide(activeSlide.id, { bgColor: e.target.value })}
                          className="w-6 h-6 rounded cursor-pointer bg-transparent"
                        />
                        <span className="text-[10px] text-slate-300 font-mono uppercase">{activeSlide.bgColor}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 mb-1 block uppercase font-bold tracking-wider">Text Color</span>
                      <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 p-1.5 rounded-lg">
                        <input
                          type="color" value={activeSlide.textColor}
                          onChange={(e) => updateSlide(activeSlide.id, { textColor: e.target.value })}
                          className="w-6 h-6 rounded cursor-pointer bg-transparent"
                        />
                        <span className="text-[10px] text-slate-300 font-mono uppercase">{activeSlide.textColor}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-slate-800 w-full" />

                {/* Text Content Editors */}
                <div className="space-y-4">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
                    <Type className="w-3 h-3" /> Content
                  </label>

                  <div>
                    <input
                      type="text" value={activeSlide.title}
                      onChange={(e) => updateSlide(activeSlide.id, { title: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 font-bold placeholder:font-normal"
                      placeholder="Enter main title..."
                    />
                  </div>

                  {activeSlide.type === "title" && (
                    <div>
                      <input
                        type="text" value={activeSlide.subtitle}
                        onChange={(e) => updateSlide(activeSlide.id, { subtitle: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                        placeholder="Enter subtitle..."
                      />
                    </div>
                  )}

                  {activeSlide.type === "content" && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Bullet Points</span>
                        <button
                          onClick={addBullet}
                          disabled={activeSlide.bullets.length >= 5}
                          className="text-indigo-400 hover:text-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-0.5 bg-indigo-500/10 px-1.5 py-0.5 rounded text-[10px] font-bold transition-colors"
                        >
                          <Plus className="w-3 h-3" /> Add Point
                        </button>
                      </div>

                      {/* Layout guidelines tooltips */}
                      {activeSlide.layout === "objectives" && (
                        <p className="text-[10px] text-indigo-400 mb-2 font-medium">Use format: <code className="bg-slate-950 px-1.5 py-0.5 rounded font-mono">Title | Description</code></p>
                      )}
                      {activeSlide.layout === "scope" && (
                        <p className="text-[10px] text-indigo-400 mb-2 font-medium">Use format: <code className="bg-slate-950 px-1.5 py-0.5 rounded font-mono">Title | Description</code> (Max 4 items)</p>
                      )}
                      {activeSlide.layout === "timeline" && (
                        <p className="text-[10px] text-indigo-400 mb-2 font-medium">Use format: <code className="bg-slate-950 px-1.5 py-0.5 rounded font-mono">Phase Title | Description</code> (Max 3 items)</p>
                      )}
                      {activeSlide.layout === "budget" && (
                        <p className="text-[10px] text-indigo-400 mb-2 font-medium">Use format: <code className="bg-slate-950 px-1.5 py-0.5 rounded font-mono">Title | Amount | Description</code> (Max 3 items)</p>
                      )}
                      {activeSlide.layout === "intro" && (
                        <p className="text-[10px] text-indigo-400 mb-2 font-medium">Bullet 1 is description. Subsequent bullets can be progress indicators in format: <code className="bg-slate-950 px-1.5 py-0.5 rounded font-mono">Label: 64%</code></p>
                      )}

                      <div className="space-y-2">
                        {activeSlide.bullets.map((b, idx) => (
                          <div key={idx} className="flex gap-2">
                            <input
                              type="text" value={b}
                              onChange={(e) => handleBulletChange(idx, e.target.value)}
                              className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                              placeholder="Type a point..."
                            />
                            <button
                              onClick={() => removeBullet(idx)}
                              className="p-1.5 text-slate-500 hover:text-rose-400 bg-slate-950 border border-slate-800 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                        {activeSlide.bullets.length === 0 && (
                          <p className="text-[10px] text-slate-500 italic p-2 bg-slate-950 rounded-lg border border-slate-800">No bullets added yet.</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Media Upload (Only for Content Slides) */}
                {activeSlide.type === "content" && (
                  <>
                    <div className="h-px bg-slate-800 w-full" />
                    <div className="space-y-2 pb-4">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
                        <ImageIcon className="w-3 h-3" /> Content Image (Right Side)
                      </label>

                      {activeSlide.imageUrl ? (
                        <div className="relative rounded-lg overflow-hidden border border-slate-700 group">
                          <div className="aspect-video bg-slate-950 flex items-center justify-center p-2">
                            <img src={activeSlide.imageUrl} alt="preview" className="max-w-full max-h-full object-contain" />
                          </div>
                          <button
                            onClick={() => updateSlide(activeSlide.id, { imageUrl: "" })}
                            className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-rose-500 text-white rounded-md backdrop-blur-sm transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full py-4 border-2 border-dashed border-slate-700 hover:border-indigo-500 hover:bg-indigo-500/5 rounded-xl flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-indigo-400 transition-colors cursor-pointer"
                        >
                          <ImageIcon className="w-5 h-5" />
                          <span className="text-xs font-medium">Add Content Image</span>
                        </button>
                      )}
                      <input
                        type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, false)}
                      />
                    </div>
                  </>
                )}

              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />

      {/* AI Loader Overlay */}
      {isGenerating && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl flex flex-col items-center justify-center z-[200] animate-in fade-in duration-300">
          <div className="relative flex flex-col items-center max-w-md p-8 text-center">
            {/* Glowing Neon Ring Loader */}
            <div className="relative w-24 h-24 mb-8">
              <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20" />
              <div className="absolute inset-0 rounded-full border-4 border-t-indigo-500 border-r-purple-500 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-10 h-10 text-indigo-400 animate-pulse" />
              </div>
            </div>

            <h3 className="text-2xl font-extrabold text-white mb-2 tracking-tight">GenAI PowerPoint Crafter</h3>
            <div className="flex items-center gap-1.5 justify-center mb-6">
              <span className="inline-block w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="inline-block w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="inline-block w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <p className="text-sm text-slate-400 font-medium">
              Structuring sections, designing custom layouts, and applying cybersecurity-safe color palettes for <span className="text-indigo-400 font-bold">"{autoTopic}"</span>...
            </p>
          </div>
        </div>
      )}

      {/* Full Screen Slideshow Overlay */}
      {isPlaying && (
        <div className="fixed inset-0 z-[100] bg-[#0a0a0f] flex flex-col overflow-hidden">

          {/* ── Top Controls Bar (outside the slide) ── */}
          <div className="flex-none w-full flex items-center justify-between px-4 sm:px-6 py-3 border-b border-white/10 bg-gradient-to-r from-[#0f0f1a] via-[#12122a] to-[#0f0f1a] shadow-lg z-50">
            {/* Left: Branding */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                <Presentation className="w-4 h-4 text-indigo-400" />
                <span className="text-indigo-300 text-xs font-bold uppercase tracking-widest hidden sm:inline">Presentation Mode</span>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 border border-white/10">
                <span className="text-white/50 text-xs font-mono">{playIndex + 1}</span>
                <span className="text-white/20 text-xs">/</span>
                <span className="text-white/50 text-xs font-mono">{slides.length}</span>
              </div>
            </div>

            {/* Center: Navigation arrows + counter */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPlayIndex(i => Math.max(0, i - 1))}
                disabled={playIndex === 0}
                className="group flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-indigo-600/40 hover:border-indigo-500/50 disabled:opacity-25 disabled:cursor-not-allowed transition-all duration-200 text-white text-xs font-semibold"
              >
                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform duration-200" />
                <span className="hidden sm:inline">Prev</span>
              </button>

              {/* Slide dots */}
              <div className="hidden md:flex items-center gap-1 px-2">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPlayIndex(i)}
                    className={`rounded-full transition-all duration-300 ${i === playIndex
                      ? "w-5 h-2 bg-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.8)]"
                      : "w-2 h-2 bg-white/20 hover:bg-white/50"
                      }`}
                  />
                ))}
              </div>

              <button
                onClick={() => setPlayIndex(i => Math.min(slides.length - 1, i + 1))}
                disabled={playIndex === slides.length - 1}
                className="group flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-indigo-600/40 hover:border-indigo-500/50 disabled:opacity-25 disabled:cursor-not-allowed transition-all duration-200 text-white text-xs font-semibold"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200" />
              </button>
            </div>

            {/* Right: Action buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsAutoplay(!isAutoplay)}
                className={`group flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-bold transition-all duration-200 ${isAutoplay
                  ? "border-emerald-500/60 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.25)]"
                  : "border-white/10 bg-white/5 text-white/70 hover:bg-purple-600/30 hover:border-purple-500/50 hover:text-purple-300"
                  }`}
              >
                <Play className={`w-3.5 h-3.5 transition-transform duration-200 ${isAutoplay ? "scale-90" : "group-hover:scale-110"}`} />
                <span className="hidden sm:inline">{isAutoplay ? "Stop" : "Autoplay"}</span>
              </button>

              <button
                onClick={handleDownload}
                disabled={isExporting}
                className="group flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-white/70 text-xs font-bold hover:bg-indigo-600/40 hover:border-indigo-500/50 hover:text-indigo-300 hover:shadow-[0_0_12px_rgba(99,102,241,0.3)] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Download className="w-3.5 h-3.5 group-hover:translate-y-0.5 transition-transform duration-200" />
                <span className="hidden sm:inline">{isExporting ? "Saving…" : "Download"}</span>
              </button>

              <div className="w-px h-6 bg-white/10 mx-1" />

              <button
                onClick={() => { setIsPlaying(false); setIsAutoplay(false); }}
                title="Exit Presentation"
                className="group flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-white/70 text-xs font-bold hover:bg-rose-600/40 hover:border-rose-500/50 hover:text-rose-300 hover:shadow-[0_0_12px_rgba(239,68,68,0.3)] transition-all duration-200"
              >
                <X className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform duration-300" />
                <span className="hidden sm:inline">Exit</span>
              </button>
            </div>
          </div>

          {/* ── Slide Area (takes all remaining vertical space) ── */}
          <div className="flex-1 w-full flex items-center justify-center p-6 overflow-hidden">
            <div
              key={playIndex}
              className={`w-full max-h-full ${aspectClass} relative flex items-center justify-center overflow-hidden rounded-2xl shadow-[0_0_80px_rgba(99,102,241,0.15),0_0_200px_rgba(0,0,0,0.8)] ring-1 ring-white/5 @container ${getTransitionClass(slides[playIndex].transition)}`}
              style={getSlideBackgroundStyle(slides[playIndex])}
            >
              {renderSlideContent(slides[playIndex])}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
