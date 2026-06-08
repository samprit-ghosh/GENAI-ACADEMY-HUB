"use client";

import { useState, useEffect } from "react";
import { X, Network, Download } from "lucide-react";
import mermaid from "mermaid";
import type { SelectedDocument } from "@/app/page";

type ArchitectureModalProps = {
  document: SelectedDocument;
  onClose: () => void;
};

export function ArchitectureModal({ document, onClose }: ArchitectureModalProps) {
  const [svgContent, setSvgContent] = useState<string>("");
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile(); // Check on mount
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (!document || document.kind !== "paper") return;
    
    // Initialize mermaid
    mermaid.initialize({
      startOnLoad: false,
      theme: "dark",
      themeVariables: {
        fontFamily: "inherit",
        background: "transparent",
      },
      flowchart: {
        curve: "basis",
        padding: 20
      }
    });

    const code = generateMermaidCode(document.paper, isMobile);
    
    // Render
    const renderDiagram = async () => {
      try {
        const id = `architecture-diagram-svg-${Math.random().toString(36).substring(2, 9)}`;
        const { svg } = await mermaid.render(id, code);
        setSvgContent(svg);
      } catch (err) {
        console.error("Mermaid rendering failed", err);
      }
    };
    
    renderDiagram();
  }, [document, isMobile]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleDownload = () => {
    if (!svgContent) return;
    const blob = new Blob([svgContent], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement("a");
    a.href = url;
    const safeTitle = document.kind === "paper" ? document.paper.title.replace(/[^a-z0-9]/gi, '_').toLowerCase().substring(0, 30) : "diagram";
    a.download = `${safeTitle}_architecture.svg`;
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!document || document.kind !== "paper") return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-300 p-0 sm:p-8">
      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes pan {
          0% { background-position: 0% 0%; }
          100% { background-position: 100% 100%; }
        }
        .animate-blob {
          animation: blob 8s infinite ease-in-out;
        }
        .animate-pan {
          animation: pan 40s linear infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
      <div className="relative w-full max-w-5xl h-[100dvh] sm:h-full sm:max-h-[90vh] bg-white sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-8 duration-500">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-900 shrink-0">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <div className="hidden sm:flex w-12 h-12 rounded-xl bg-indigo-500/20 items-center justify-center text-indigo-400 shadow-sm border border-indigo-500/30 shrink-0">
              <Network className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-bold text-slate-100 tracking-tight truncate">Project Architecture</h2>
              <p className="text-xs sm:text-sm text-slate-400 truncate w-[150px] sm:w-auto max-w-xs md:max-w-md lg:max-w-xl" title={document.paper.title}>
                {document.paper.title}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-2">
            <button
              onClick={handleDownload}
              disabled={!svgContent}
              className="flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm sm:text-base font-medium shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Save SVG</span>
            </button>
            <div className="hidden sm:block w-px h-6 bg-slate-700" />
            <button
              onClick={onClose}
              className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors shrink-0"
            >
              <X className="w-5 h-5 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 sm:p-8 flex flex-col items-center justify-start sm:justify-center bg-slate-950 relative z-0">
          
          {/* Animated Background Orbs */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] rounded-full bg-indigo-500/20 blur-[100px] animate-blob"></div>
            <div className="absolute top-[20%] -right-[10%] w-[40%] h-[60%] rounded-full bg-fuchsia-500/20 blur-[100px] animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-[20%] left-[20%] w-[60%] h-[50%] rounded-full bg-cyan-500/20 blur-[100px] animate-blob animation-delay-4000"></div>
          </div>

          {/* Animated Background Grid */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff10_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none animate-pan z-0 opacity-70" />

          {svgContent ? (
            <div 
              className="w-full min-h-full flex items-start sm:items-center justify-center relative z-10 transition-all duration-700 opacity-100 scale-100 [&>svg]:max-w-full sm:[&>svg]:max-w-none [&>svg]:w-auto [&>svg]:h-auto"
              dangerouslySetInnerHTML={{ __html: svgContent }} 
            />
          ) : (
            <div className="animate-pulse text-slate-400 font-medium flex flex-col items-center justify-center gap-4 relative z-10">
              <div className="w-16 h-16 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
              Generating Logical Architecture Diagram...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function sanitize(text: string) {
  // Remove characters that break mermaid syntax
  return text.replace(/["{}()\[\]<>|]/g, '').trim();
}

function generateMermaidCode(paper: any, isMobile: boolean = false): string {
  const summary = paper.summary.toLowerCase();
  const text = summary + " " + paper.title.toLowerCase();

  let code = isMobile ? "graph TD\n" : "graph LR\n";
  
  // Define themes for dark mode
  code += `%% Styling\n`;
  code += `classDef data fill:#064e3b,stroke:#34d399,stroke-width:2px,color:#a7f3d0,rx:8,ry:8,font-family:inherit;\n`;
  code += `classDef model fill:#1e3a8a,stroke:#60a5fa,stroke-width:3px,color:#bfdbfe,rx:12,ry:12,font-weight:bold,font-family:inherit;\n`;
  code += `classDef process fill:#0f172a,stroke:#94a3b8,stroke-width:2px,color:#e2e8f0,rx:8,ry:8,stroke-dasharray: 5 5,font-family:inherit;\n`;
  code += `classDef output fill:#701a75,stroke:#e879f9,stroke-width:2px,color:#fbcfe8,rx:8,ry:8,font-family:inherit;\n`;
  code += `classDef eval fill:#78350f,stroke:#fbbf24,stroke-width:2px,color:#fde68a,rx:16,ry:16,font-family:inherit;\n`;

  let nodes = [];
  let edges = [];

  // --- Subgraph: Data Pipeline ---
  code += `\nsubgraph Data["Data Pipeline"]\n  direction TB\n`;
  let dataSource = "📊 Dataset";
  if (text.includes("image") || text.includes("vision") || text.includes("pixel") || text.includes("camera")) {
    dataSource = "🖼️ Image Data";
  } else if (text.includes("text") || text.includes("language") || text.includes("word")) {
    dataSource = "📝 Text Corpus";
  } else if (text.includes("audio") || text.includes("speech")) {
    dataSource = "🎵 Audio Signals";
  }
  code += `  A[${sanitize(dataSource)}]\n`;
  
  let preproc = "⚙️ Preprocessing";
  if (text.includes("embedding") || text.includes("encode")) {
    preproc = "🔢 Embedding Layer";
  } else if (text.includes("tokenize")) {
    preproc = "✂️ Tokenization";
  } else if (text.includes("augmentation")) {
    preproc = "🔄 Data Augmentation";
  }
  code += `  B[${sanitize(preproc)}]\n`;
  code += `end\n`;
  edges.push("A --> B");

  // --- Subgraph: Model Architecture ---
  code += `\nsubgraph Model["Core Architecture"]\n  direction TB\n`;
  let core = "🧠 Machine Learning Model";
  if (text.includes("transformer")) {
    core = "🤖 Transformer";
  } else if (text.includes("cnn") || text.includes("convolutional")) {
    core = "👁️ CNN Architecture";
  } else if (text.includes("rnn") || text.includes("lstm") || text.includes("recurrent")) {
    core = "🔁 RNN/LSTM";
  } else if (text.includes("diffusion")) {
    core = "🌫️ Diffusion Process";
  } else if (text.includes("llm") || text.includes("large language model")) {
    core = "💬 Large Language Model";
  } else if (text.includes("gan") || text.includes("adversarial")) {
    core = "🎭 GAN Model";
  } else if (text.includes("gnn") || text.includes("graph")) {
    core = "🕸️ Graph Neural Network";
  } else if (text.includes("reinforcement") || text.includes("rl ")) {
    core = "🕹️ RL Agent";
  }
  code += `  C{${sanitize(core)}}\n`;

  if (text.includes("decoder") || text.includes("generate") || text.includes("generative")) {
    code += `  D[✨ Generator / Decoder]\n`;
    edges.push("C --> D");
  }
  code += `end\n`;
  edges.push("B --> C");

  // --- Subgraph: Output & Evaluation ---
  code += `\nsubgraph Results["Outputs & Evaluation"]\n  direction TB\n`;
  let output = "🎯 Output Predictions";
  if (text.includes("classification") || text.includes("classify")) {
    output = "🏷️ Classification Labels";
  } else if (text.includes("segmentation")) {
    output = "🧩 Segmentation Map";
  } else if (text.includes("translation")) {
    output = "🌐 Translated Text";
  } else if (text.includes("detection") || text.includes("bbox")) {
    output = "📦 Object Detection Boxes";
  } else if (text.includes("generation")) {
    output = "✨ Generated Content";
  }
  code += `  E[${sanitize(output)}]\n`;

  if (text.includes("accuracy") || text.includes("bleu") || text.includes("f1") || text.includes("evaluate") || text.includes("benchmark")) {
    code += `  F([📈 Evaluation Metrics])\n`;
    edges.push("E --> F");
  }
  code += `end\n`;
  
  if (text.includes("decoder") || text.includes("generate") || text.includes("generative")) {
    edges.push("D --> E");
  } else {
    edges.push("C --> E");
  }

  // Combine edges
  code += `\n` + edges.join("\n") + `\n`;

  // Apply classes
  code += `\nclass A data;\nclass B process;\nclass C model;\nclass D model;\nclass E output;\nclass F eval;\n`;

  // Style subgraphs
  code += `\nstyle Data fill:#0f172a,stroke:#334155,stroke-width:2px,color:#f8fafc,stroke-dasharray: 5 5;\n`;
  code += `style Model fill:#0f172a,stroke:#334155,stroke-width:2px,color:#f8fafc,stroke-dasharray: 5 5;\n`;
  code += `style Results fill:#0f172a,stroke:#334155,stroke-width:2px,color:#f8fafc,stroke-dasharray: 5 5;\n`;

  return code;
}
