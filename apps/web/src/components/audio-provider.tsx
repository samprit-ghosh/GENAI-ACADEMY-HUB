"use client";

import { createContext, useContext, useState, useRef, useEffect } from "react";

type AudioContextType = {
  currentTrack: string | null;
  trackTitle: string | null;
  trackType: "audio" | "tts" | null;
  isPlaying: boolean;
  playTrack: (url: string, title?: string) => void;
  playTTS: (text: string, title?: string, overrideVoiceType?: string) => void;
  stopTTS: () => void;
  pauseTrack: () => void;
  resumeTrack: () => void;
  playbackRate: number;
  setPlaybackRate: (rate: number) => void;
  progress: number;
  voiceType: "default" | "female" | "male" | "hi-IN" | "en-IN-female";
  setVoiceType: (type: "default" | "female" | "male" | "hi-IN" | "en-IN-female") => void;
  availableVoices: SpeechSynthesisVoice[];
};

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<string | null>(null);
  const [trackTitle, setTrackTitle] = useState<string | null>(null);
  const [trackType, setTrackType] = useState<"audio" | "tts" | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [progress, setProgress] = useState(0);
  const [voiceType, setVoiceType] = useState<"default" | "female" | "male" | "hi-IN" | "en-IN-female">("default");
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ttsUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Load voices — they load asynchronously in Chrome/Edge
  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        setAvailableVoices(voices);
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
      window.speechSynthesis.cancel();
    };
  }, []);

  const getVoiceForType = (type: "default" | "female" | "male" | "hi-IN" | "en-IN-female"): SpeechSynthesisVoice | null => {
    if (type === "default" || availableVoices.length === 0) return null;

    if (type === "hi-IN") {
      // Find exact language match (e.g. hi-IN or hi)
      const found = availableVoices.find(v => v.lang.startsWith(type) || v.lang.startsWith(type.split('-')[0]));
      if (found) return found;
      // Fallback: Use Indian English if the exact local language is not installed on their OS
      return availableVoices.find(v => v.lang === "en-IN") || null;
    }

    if (type === "en-IN-female") {
      const femalePatterns = ["female", "woman", "heera", "veena", "aditi", "raveena", "zira"];
      const maleNames = ["male", "ravi", "amit", "david"];
      
      const indianVoices = availableVoices.filter(v => 
        v.lang === "en-IN" || v.lang.startsWith("en-IN") ||
        v.lang === "hi-IN" || v.lang.startsWith("hi-IN")
      );
      
      const foundFemale = indianVoices.find(v => {
        const name = v.name.toLowerCase();
        return femalePatterns.some(p => name.includes(p));
      });
      if (foundFemale) return foundFemale;

      const notMale = indianVoices.find(v => {
        const name = v.name.toLowerCase();
        return !maleNames.some(m => name.includes(m));
      });
      if (notMale) return notMale;

      if (indianVoices.length > 0) return indianVoices[0];
      
      return getVoiceForType("female");
    }

    if (type === "female") {
      // Try common female voice names across platforms
      const femalePatterns = [
        "zira", "samantha", "victoria", "karen", "tessa", "fiona",
        "google us english", "google uk english female",
        "female", "woman",
        // Many default English voices are female — try any with "en" locale
      ];
      const found = availableVoices.find(v => {
        const name = v.name.toLowerCase();
        return femalePatterns.some(p => name.includes(p));
      });
      if (found) return found;

      // Fallback: pick any English voice that isn't a known male name
      const maleNames = ["david", "mark", "daniel", "james", "george", "male"];
      const notMale = availableVoices.find(v => {
        const name = v.name.toLowerCase();
        return v.lang.startsWith("en") && !maleNames.some(m => name.includes(m));
      });
      return notMale || null;
    }

    if (type === "male") {
      const malePatterns = ["david", "mark", "daniel", "james", "george", "male", "google uk english male"];
      const found = availableVoices.find(v => {
        const name = v.name.toLowerCase();
        return malePatterns.some(p => name.includes(p));
      });
      return found || null;
    }

    return null;
  };

  const playTrack = (url: string, title?: string) => {
    if (trackType === "tts" && typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    
    setCurrentTrack(url);
    setTrackTitle(title || "Audio Track");
    setTrackType("audio");
    setIsPlaying(true);
    setProgress(0);
    
    if (audioRef.current) {
      audioRef.current.src = url;
      audioRef.current.playbackRate = playbackRate;
      audioRef.current.play();
    }
  };

  const playTTS = async (text: string, title?: string, overrideVoiceType?: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      console.warn("Text to speech not supported in this browser");
      return;
    }
    
    if (trackType === "audio" && audioRef.current) {
      audioRef.current.pause();
    }
    
    window.speechSynthesis.cancel();
    
    setCurrentTrack(text);
    setTrackTitle(title || "Text-to-Speech");
    setTrackType("tts");
    setIsPlaying(true);
    setProgress(0);
    
    let textToSpeak = text;
    let targetLang = "en";
    let skipTranslation = false;
    const activeVoiceType = overrideVoiceType || voiceType;

    if (activeVoiceType === "hi-IN") {
      targetLang = "hi";
    }
    if (activeVoiceType === "en-IN-female") {
      // Use the Hindi voice model to read English text, which enforces a strong Indian accent in Google TTS
      targetLang = "hi";
      skipTranslation = true;
    }

    if (targetLang !== "en") {
      try {
        if (!skipTranslation) {
          const res = await fetch("/api/translate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text, targetLang }),
          });
          const data = await res.json();
          if (data.translatedText) {
            textToSpeak = data.translatedText;
          }
        }

        // Fetch stitched MP3 chunks from our backend TTS proxy
        const ttsRes = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: textToSpeak, lang: targetLang }),
        });

        if (ttsRes.ok && audioRef.current) {
          const blob = await ttsRes.blob();
          const audioUrl = URL.createObjectURL(blob);
          
          audioRef.current.src = audioUrl;
          audioRef.current.playbackRate = playbackRate;
          audioRef.current.play();

          const updateProgress = () => {
            if (audioRef.current && audioRef.current.duration) {
              setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100);
            }
          };
          audioRef.current.addEventListener("timeupdate", updateProgress);
          audioRef.current.addEventListener("ended", () => {
            setIsPlaying(false);
            setProgress(100);
            audioRef.current?.removeEventListener("timeupdate", updateProgress);
          }, { once: true });

          return; // Successfully playing via Cloud TTS, skip SpeechSynthesis!
        }
      } catch (err) {
        console.error("Cloud TTS failed, falling back to OS SpeechSynthesis", err);
      }
    }

    // Double check that user hasn't stopped playback while we were translating
    if (!window.speechSynthesis) return;

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = playbackRate;
    // Setting lang forces the browser to try and use an appropriate cloud/OS voice if an exact voice isn't matched
    if (targetLang !== "en") {
      utterance.lang = activeVoiceType === "en-IN-female" ? "en-IN" : (activeVoiceType as string);
    } else {
      utterance.lang = "en-US";
    }
    
    // Apply voice selection
    const selectedVoice = getVoiceForType(activeVoiceType as any);
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    
    utterance.onboundary = (event) => {
      if (event.name === "word") {
        const p = (event.charIndex / text.length) * 100;
        setProgress(isNaN(p) ? 0 : p);
      }
    };
    
    utterance.onend = () => {
      setIsPlaying(false);
      setProgress(100);
    };

    utterance.onerror = (e) => {
      // "interrupted" and "canceled" errors are expected when stopping/restarting TTS
      if (e.error === "interrupted" || e.error === "canceled") return;
      setIsPlaying(false);
    };
    
    ttsUtteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const stopTTS = () => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
    setIsPlaying(false);
    setProgress(0);
    setCurrentTrack(null);
    setTrackTitle(null);
    setTrackType(null);
  };

  const pauseTrack = () => {
    setIsPlaying(false);
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
    }
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.pause();
    }
  };

  const resumeTrack = () => {
    if (!currentTrack) return;
    
    setIsPlaying(true);
    if (audioRef.current && audioRef.current.src && audioRef.current.paused) {
      audioRef.current.play();
    }
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.resume();
    }
  };

  const handleTimeUpdate = () => {
    if (trackType === "audio" && audioRef.current) {
      const p = (audioRef.current.currentTime / audioRef.current.duration) * 100;
      setProgress(isNaN(p) ? 0 : p);
    }
  };

  const handleRateChange = (rate: number) => {
    setPlaybackRate(rate);
    if (trackType === "audio" && audioRef.current) {
      audioRef.current.playbackRate = rate;
    } else if (trackType === "tts" && ttsUtteranceRef.current) {
      ttsUtteranceRef.current.rate = rate;
    }
  };

  return (
    <AudioContext.Provider
      value={{
        currentTrack,
        trackTitle,
        trackType,
        isPlaying,
        playTrack,
        playTTS,
        stopTTS,
        pauseTrack,
        resumeTrack,
        playbackRate,
        setPlaybackRate: handleRateChange,
        progress,
        voiceType,
        setVoiceType,
        availableVoices,
      }}
    >
      {children}
      {trackType === "audio" && currentTrack && (
        <audio
          ref={audioRef}
          onTimeUpdate={handleTimeUpdate}
          onEnded={() => setIsPlaying(false)}
          className="hidden"
        />
      )}
    </AudioContext.Provider>
  );
}

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error("useAudio must be used within an AudioProvider");
  }
  return context;
};
