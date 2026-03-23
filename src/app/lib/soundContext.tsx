"use client";
import { createContext, useContext, useState, useEffect, ReactNode, useRef } from "react";

type SoundType = "intro" | "checkin" | "checkout" | "error" | "success" | "click";

interface SoundContextType {
  isMuted: boolean;
  toggleMute: () => void;
  playSound: (type: SoundType) => void;
}

const SoundContext = createContext<SoundContextType | undefined>(undefined);

export function SoundProvider({ children }: { children: ReactNode }) {
  const [isMuted, setIsMuted] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const isUnlockedRef = useRef(false);

  useEffect(() => {
    const savedMute = localStorage.getItem("neu_sound_muted");
    if (savedMute === "true") setIsMuted(true);
  }, []);

  const unlockAudio = async () => {
    if (isUnlockedRef.current || typeof window === "undefined") return;
    
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = ctx;
      
      // Resume if suspended
      if (ctx.state === "suspended") {
        await ctx.resume();
      }
      
      // Play multiple silent sounds for iOS/Android unlock
      for (let i = 0; i < 3; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        gain.gain.value = 0.001;
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.01);
        await new Promise(r => setTimeout(r, 10));
      }
      
      isUnlockedRef.current = true;
    } catch (error) {
      console.error("Audio unlock failed:", error);
    }
  };

  useEffect(() => {
    const events = ["touchstart", "touchend", "click", "keydown"];
    const handler = () => {
      unlockAudio();
    };
    
    events.forEach(event => {
      document.addEventListener(event, handler, { once: true, passive: true });
    });
    
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handler);
      });
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    localStorage.setItem("neu_sound_muted", String(newMuted));
  };

  const playSound = async (type: SoundType) => {
    if (isMuted) return;
    
    if (!audioContextRef.current || !isUnlockedRef.current) {
      await unlockAudio();
      if (!audioContextRef.current) return;
    }
    
    const ctx = audioContextRef.current;
    
    try {
      if (ctx.state === "suspended") {
        await ctx.resume();
      }
      
      if (ctx.state !== "running") {
        return;
      }
      
      if (type === "intro") {
        const notes = [
          { freq: 523.25, start: 0, duration: 0.5 },
          { freq: 659.25, start: 0.25, duration: 0.5 },
          { freq: 783.99, start: 0.5, duration: 0.7 }
        ];
        
        notes.forEach(note => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          
          osc.connect(gain);
          gain.connect(ctx.destination);
          
          osc.type = "sine";
          osc.frequency.setValueAtTime(note.freq, ctx.currentTime + note.start);
          
          gain.gain.setValueAtTime(0, ctx.currentTime + note.start);
          gain.gain.linearRampToValueAtTime(0.8, ctx.currentTime + note.start + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + note.start + note.duration);
          
          osc.start(ctx.currentTime + note.start);
          osc.stop(ctx.currentTime + note.start + note.duration);
        });
        return;
      }
      
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      let frequency = 440;
      let duration = 0.2;
      let volume = 0.3;
      
      switch (type) {
        case "checkin":
          frequency = 659.25;
          duration = 0.2;
          volume = 0.8;
          break;
        case "checkout":
          frequency = 523.25;
          duration = 0.2;
          volume = 0.8;
          break;
        case "error":
          frequency = 329.63;
          duration = 0.35;
          volume = 0.5;
          break;
        case "success":
          frequency = 783.99;
          duration = 0.25;
          volume = 0.8;
          break;
        case "click":
          frequency = 800;
          duration = 0.08;
          volume = 0.7;
          break;
      }
      
      oscillator.type = type === "error" ? "square" : "sine";
      oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
      
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.01);
      gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration);
    } catch (error) {
      console.error("Sound playback failed:", error);
    }
  };

  return (
    <SoundContext.Provider value={{ isMuted, toggleMute, playSound }}>
      {children}
    </SoundContext.Provider>
  );
}

export function useSound() {
  const context = useContext(SoundContext);
  if (!context) {
    throw new Error("useSound must be used within SoundProvider");
  }
  return context;
}
