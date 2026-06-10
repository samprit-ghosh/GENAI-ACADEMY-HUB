"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Loader2, Bot, User, Trash2, Copy, Check, Volume2, Square } from "lucide-react";
import type { ResearchPaper } from "@/lib/types";
import { useAudio } from "./audio-provider";

export function KnowledgeChatbot({ activePaper, papers = [] }: { activePaper: ResearchPaper | null, papers?: ResearchPaper[] }) {
  const { playTTS, stopTTS, isPlaying, currentTrack, trackType } = useAudio();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: "user" | "bot"; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Initial greeting
  useEffect(() => {
    if (isOpen && messages.length === 0 && activePaper) {
      setMessages([{ role: "bot", content: "Hi! I am your Knowledge Center assistant. I use a semantic RAG brain to search across your loaded PDFs. Ask me anything!" }]);
    }
  }, [isOpen, messages.length, activePaper]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (overrideInput?: string) => {
    if (!activePaper) return;
    const rawMsg = overrideInput !== undefined ? overrideInput : input;
    if (!rawMsg.trim()) return;

    // Filter out special characters and emojis
    const sanitizedMsg = rawMsg.replace(/[^a-zA-Z0-9\s?.,!-]/g, "").trim();
    if (!sanitizedMsg) {
      setMessages(prev => [...prev, { role: "bot", content: "Please use standard text characters for your questions." }]);
      setInput("");
      return;
    }
    
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: sanitizedMsg }]);
    setIsLoading(true);

    try {
      const allSummaries = papers.map(p => `${p.title}: ${p.summary}`).join("\n\n");

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          query: sanitizedMsg, 
          paperId: activePaper.id,
          allSummaries 
        })
      });
      const data = await res.json();
      
      setMessages(prev => [...prev, { role: "bot", content: data.reply || data.error || "Sorry, I couldn't process that." }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: "bot", content: "Error communicating with the Knowledge Center." }]);
    } finally {
      setIsLoading(false);
    }
  };
  const formatMessage = (text: string) => {
    return text.split("\n").map((line, i) => {
      let processedLine = line;
      let aiPrefix = null;
      if (i === 0 && processedLine.startsWith("Ai answer: ")) {
        aiPrefix = <span key="ai-prefix" className="font-bold text-emerald-500">AI answer: </span>;
        processedLine = processedLine.substring("Ai answer: ".length);
      }

      // Convert raw HTML strong/b tags to markdown ** format to catch AI inconsistencies
      processedLine = processedLine.replace(/<\/?strong>/gi, "**").replace(/<\/?b>/gi, "**");

      // Bold text formatting
      const parts = processedLine.split(/(\*\*.*?\*\*)/g);
      const formattedLine = parts.map((part, j) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={j} className="font-semibold text-indigo-300">{part.slice(2, -2)}</strong>;
        }
        return part;
      });

      // Handle lists (bullets or numbers)
      if (processedLine.trim().match(/^(\d+\.|-|\*)\s/)) {
        return (
          <div key={i} className="flex gap-2 my-1.5 ml-2">
             <span className="text-emerald-400 font-bold mt-0.5">→</span>
             <div>{aiPrefix}{formattedLine.map((p, k) => <span key={k}>{typeof p === 'string' ? p.replace(/^(\d+\.|-|\*)\s/, '') : p}</span>)}</div>
          </div>
        );
      }

      // Headers (### text)
      if (processedLine.trim().startsWith("#")) {
        return <div key={i} className="text-[15px] font-bold text-indigo-200 mt-4 mb-2 border-b border-indigo-500/20 pb-1">{aiPrefix}{processedLine.replace(/^#+\s/, "")}</div>;
      }

      return (
        <div key={i} className={processedLine.trim() === "" && !aiPrefix ? "h-2" : "my-1 leading-relaxed"}>
          {aiPrefix}
          {formattedLine}
        </div>
      );
    });
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-20 md:bottom-6 right-6 z-50 p-4 bg-indigo-600 text-white rounded-full shadow-xl hover:bg-indigo-700 transition-all hover:scale-105 ${isOpen ? "hidden" : "flex"}`}
      >
        <MessageSquare className="w-6 h-6" />
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-0 right-0 md:bottom-6 md:right-6 w-full md:w-[400px] h-[85dvh] md:h-[550px] max-h-[100dvh] md:max-h-[85vh] bg-slate-900 md:border border-t border-slate-700 rounded-t-2xl md:rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden animate-in slide-in-from-bottom-8 duration-300">
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-slate-800 border-b border-slate-700 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-slate-950 border border-yellow-400/50 rounded-xl flex items-center justify-center overflow-hidden p-1 shadow-md shadow-yellow-500/10">
                <img 
                  src="/logo-mark.png" 
                  alt="GenAI Academy & Hub Logo" 
                  className="w-full h-full object-contain" 
                />
              </div>
              <div>
                <h3 className="font-bold text-slate-100 text-sm">Knowledge Center</h3>
                <p className="text-xs text-slate-400 truncate max-w-[180px]" title={activePaper ? activePaper.title : "No PDF selected"}>
                  {activePaper ? activePaper.title : "No PDF selected"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button 
                disabled={!activePaper}
                onClick={() => setMessages([{ role: "bot", content: "Chat cleared! How can I help you today?" }])} 
                className="text-slate-400 hover:text-rose-400 transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-700 disabled:opacity-30 disabled:hover:text-slate-400 disabled:hover:bg-transparent"
                title="Clear Chat"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-200 transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col">
            {!activePaper ? (
              <div className="flex flex-col items-center justify-center flex-1 text-center p-6 space-y-3 my-auto animate-in fade-in duration-300">
                <div className="w-12 h-12 bg-slate-950 border border-yellow-400/50 rounded-2xl flex items-center justify-center overflow-hidden p-2 shadow-lg shadow-yellow-500/10 mb-2">
                  <img 
                    src="/logo-mark.png" 
                    alt="GenAI Academy & Hub Logo" 
                    className="w-full h-full object-contain animate-pulse" 
                  />
                </div>
                <h4 className="font-bold text-slate-200 text-sm">No PDF Selected</h4>
                <p className="text-xs text-slate-400 max-w-[240px]">
                  Please select a research paper from the library to load its content and activate the semantic RAG chatbot.
                </p>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                  <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center overflow-hidden ${msg.role === "user" ? "bg-slate-700 text-slate-300" : "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shadow-inner"}`}>
                    {msg.role === "user" ? <User className="w-4 h-4" /> : <img src="/logo-mark.png" alt="Bot" className="w-full h-full object-contain p-1 opacity-90" />}
                  </div>
                  <div className={`p-3 rounded-2xl text-sm leading-relaxed max-w-[80%] ${msg.role === "user" ? "bg-indigo-600 text-white rounded-tr-none" : "bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-none"}`}>
                    {formatMessage(msg.content)}
                    {msg.role === "bot" && (
                      <div className="mt-2 flex items-center gap-4">
                        <button 
                          onClick={() => handleCopy(msg.content, i)}
                          className="text-[10px] text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors"
                          title="Copy to clipboard"
                        >
                          {copiedIndex === i ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" /> 
                              <span className="text-emerald-400">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" /> Copy
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => {
                            if (isPlaying && trackType === "tts" && currentTrack === msg.content) {
                              stopTTS();
                            } else {
                              playTTS(msg.content, "AI Response");
                            }
                          }}
                          className="text-[10px] text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors"
                          title="Listen to response"
                        >
                          {isPlaying && trackType === "tts" && currentTrack === msg.content ? (
                            <>
                              <Square className="w-3 h-3 text-rose-400" /> <span className="text-rose-400">Stop</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-3 h-3 text-indigo-400" /> <span className="text-indigo-200">Listen</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex gap-3 flex-row">
                <div className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center overflow-hidden bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shadow-inner">
                  <img src="/logo-mark.png" alt="Bot" className="w-full h-full object-contain p-1 opacity-90" />
                </div>
                <div className="p-3 rounded-2xl rounded-tl-none bg-slate-800 text-slate-400 border border-slate-700 text-sm flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing document...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 bg-slate-800 border-t border-slate-700 shrink-0">
            <div className="relative">
              <input
                type="text"
                value={input}
                disabled={!activePaper || isLoading}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder={activePaper ? "Ask about anything in the library..." : "No PDF selected to query..."}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-4 pr-12 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-45 disabled:cursor-not-allowed transition-all"
              />
              <button
                disabled={!activePaper || !input.trim() || isLoading}
                onClick={() => handleSend()}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-3 text-[11px] font-medium text-slate-500 flex flex-wrap items-center gap-2">
              <span>Try asking:</span>
              <button 
                disabled={!activePaper}
                onClick={() => handleSend("summarise the topic")} 
                className="text-white bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 px-3 py-1.5 rounded-md border-none transition-all shadow-md hover:shadow-lg hover:scale-105 disabled:opacity-40 disabled:scale-100 disabled:cursor-not-allowed"
              >
                ✨ Summarise
              </button>
              <button 
                disabled={!activePaper}
                onClick={() => handleSend("give the brief one liner")} 
                className="text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 px-3 py-1.5 rounded-md border-none transition-all shadow-md hover:shadow-lg hover:scale-105 disabled:opacity-40 disabled:scale-100 disabled:cursor-not-allowed"
              >
                ⚡ One Liner
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
