"use client";

import { useAudio } from "@/components/audio-provider";
import { Play, Pause, Square, Volume2, Settings2 } from "lucide-react";

export function AudioDeck() {
  const { currentTrack, trackTitle, trackType, isPlaying, pauseTrack, resumeTrack, stopTTS, playTTS, progress, playbackRate, setPlaybackRate, voiceType, setVoiceType } = useAudio();

  if (!currentTrack) {
    return (
      <div className="p-5 border-b border-border/50 bg-gradient-to-br from-card to-muted/20 flex flex-col items-center justify-center text-center relative overflow-hidden group min-h-[120px]">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 via-fuchsia-500/5 to-pink-500/5 opacity-50" />
        <div className="relative z-10 flex flex-col items-center gap-2 text-muted-foreground/40 group-hover:text-muted-foreground/60 transition-colors">
          <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-1">
            <Volume2 className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-medium tracking-wide uppercase">No Audio Playing</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative p-5 border-b border-border/50 bg-card overflow-hidden">
      {/* Dynamic Background */}
      <div className={`absolute inset-0 transition-opacity duration-1000 ${isPlaying ? 'opacity-100' : 'opacity-30'}`}>
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600/10 via-fuchsia-600/10 to-orange-500/10" />
        {isPlaying && (
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-fuchsia-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
        )}
      </div>

      <div className="relative z-10">
        {/* Track info + controls in one row */}
        <div className="flex items-center gap-4 mb-4">
          <button 
            onClick={isPlaying ? pauseTrack : resumeTrack}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shrink-0 relative ${
              isPlaying 
                ? 'bg-gradient-to-br from-fuchsia-500 to-pink-500 text-white shadow-[0_0_20px_rgba(217,70,239,0.4)] hover:scale-105' 
                : 'bg-gradient-to-br from-violet-500 to-indigo-500 text-white shadow-[0_0_15px_rgba(139,92,246,0.3)] hover:scale-105'
            }`}
          >
            {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 ml-1 fill-current" />}
            
            {/* Ripple effect when playing */}
            {isPlaying && (
              <span className="absolute inset-0 rounded-full border border-fuchsia-400 animate-ping opacity-20" style={{ animationDuration: '2s' }} />
            )}
          </button>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold truncate bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent mb-0.5">
              {trackTitle || "Playing"}
            </h3>
            <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/70 flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${isPlaying ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground/30'}`} />
              {trackType === "tts" ? "Text-to-Speech" : "Audio Track"}
            </p>
          </div>

          <button
            onClick={stopTTS}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-muted/50 text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-colors"
            title="Stop Playback"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
          </button>
        </div>

        {/* Custom Progress Bar */}
        <div className="relative w-full h-1.5 bg-muted/50 rounded-full overflow-hidden mb-4 group cursor-pointer">
          <div 
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-orange-500 transition-all duration-100 ease-linear rounded-full"
            style={{ width: `${progress}%` }}
          />
          {/* Animated glow on progress head */}
          {isPlaying && (
            <div 
              className="absolute top-0 w-8 h-full bg-gradient-to-r from-transparent to-white/50 blur-[2px]"
              style={{ left: `calc(${progress}% - 32px)` }}
            />
          )}
        </div>

        {/* Controls row */}
        <div className="flex flex-wrap items-center gap-2 p-2 rounded-xl bg-card/50 border border-border/50 backdrop-blur-sm">
          <div className="flex items-center justify-center w-6 h-6 rounded-md bg-muted/50 shrink-0">
            <Settings2 className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          
          {trackType === "tts" && (
            <div className="flex-1 min-w-[120px] relative group">
              <select
                value={voiceType}
                onChange={(e) => {
                  const newVoice = e.target.value as any;
                  setVoiceType(newVoice);
                  if (isPlaying && trackType === "tts" && currentTrack) {
                    playTTS(currentTrack, trackTitle || undefined, newVoice);
                  }
                }}
                className="w-full appearance-none bg-transparent text-[11px] font-medium text-foreground px-2 py-1 focus:outline-none cursor-pointer"
              >
                <option value="default" className="bg-zinc-900 text-white">Default Voice</option>
                <option value="female" className="bg-zinc-900 text-white">Female Voice</option>
                <option value="male" className="bg-zinc-900 text-white">Male Voice</option>
                <option value="hi-IN" className="bg-zinc-900 text-white">Hindi Voice (हिंदी)</option>
                <option value="en-IN-female" className="bg-zinc-900 text-white">Indian Female (Eng)</option>
              </select>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground/50 group-hover:text-muted-foreground">
                ▼
              </div>
            </div>
          )}
          
          <div className="w-px h-4 bg-border/50 mx-1" />
          
          <div className="relative group shrink-0">
            <select 
              value={playbackRate}
              onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
              className="appearance-none bg-transparent text-[11px] font-bold text-primary px-3 py-1 focus:outline-none cursor-pointer"
            >
              <option value={0.75} className="bg-zinc-900 text-white">0.75x</option>
              <option value={1} className="bg-zinc-900 text-white">1.0x</option>
              <option value={1.25} className="bg-zinc-900 text-white">1.25x</option>
              <option value={1.5} className="bg-zinc-900 text-white">1.5x</option>
              <option value={2} className="bg-zinc-900 text-white">2.0x</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}


