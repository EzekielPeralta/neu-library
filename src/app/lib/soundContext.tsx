"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type SoundType = "intro" | "checkin" | "checkout" | "error" | "success" | "click";

interface SoundContextType {
  isMuted: boolean;
  toggleMute: () => void;
  playSound: (type: SoundType) => void;
}

const SoundContext = createContext<SoundContextType | undefined>(undefined);

export function SoundProvider({ children }: { children: ReactNode }) {
  const [isMuted, setIsMuted] = useState(false);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);

  useEffect(() => {
    const savedMute = localStorage.getItem("neu_sound_muted");
    if (savedMute === "true") setIsMuted(true);
  }, []);

  // Initialize AudioContext on first user interaction
  const initAudioContext = async () => {
    if (!audioContext && typeof window !== "undefined") {
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        // Immediately resume for mobile
        if (ctx.state === "suspended") {
          await ctx.resume();
        }
        
        // Play silent sound to unlock audio on iOS
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        gain.gain.value = 0;
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.001);
        
        setAudioContext(ctx);
      } catch (error) {
        console.error("Failed to initialize audio:", error);
      }
    }
  };

  useEffect(() => {
    // Add multiple event listeners for mobile
    const handleInteraction = () => {
      initAudioContext();
    };
    
    const events = ["click", "touchstart", "touchend", "keydown"];
    events.forEach(event => {
      document.addEventListener(event, handleInteraction, { once: true });
    });
    
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleInteraction);
      });
      if (audioContext) {
        audioContext.close();
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
    
    // Initialize on first play attempt
    if (!audioContext) {
      await initAudioContext();
      // Retry after a short delay
      setTimeout(() => playSound(type), 100);
      return;
    }
    
    try {
      // Always resume for mobile
      if (audioContext.state === "suspended") {
        await audioContext.resume();
      }
      
      // Double check state
      if (audioContext.state !== "running") {
        console.warn("AudioContext not running:", audioContext.state);
        return;
      }
      
      if (type === "intro") {
        const notes = [
          { freq: 523.25, start: 0, duration: 0.5 },
          { freq: 659.25, start: 0.25, duration: 0.5 },
          { freq: 783.99, start: 0.5, duration: 0.7 }
        ];
        
        notes.forEach(note => {
          const osc = audioContext.createOscillator();
          const gain = audioContext.createGain();
          
          osc.connect(gain);
          gain.connect(audioContext.destination);
          
          osc.type = "sine";
          osc.frequency.setValueAtTime(note.freq, audioContext.currentTime + note.start);
          
          gain.gain.setValueAtTime(0, audioContext.currentTime + note.start);
          gain.gain.linearRampToValueAtTime(0.8, audioContext.currentTime + note.start + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + note.start + note.duration);
          
          osc.start(audioContext.currentTime + note.start);
          osc.stop(audioContext.currentTime + note.start + note.duration);
        });
        return;
      }
      
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      let frequency = 440;
      let duration = 0.2;
      let volume = 0.3;
      
      switch (type) {
        case "checkin":
          frequency = 659.25;
          duration = 0.2;
          volume = 0.6;
          break;
        case "checkout":
          frequency = 523.25;
          duration = 0.2;
          volume = 0.6;
          break;
        case "error":
          frequency = 329.63;
          duration = 0.35;
          volume = 0.5;
          break;
        case "success":
          frequency = 783.99;
          duration = 0.25;
          volume = 0.6;
          break;
        case "click":
          frequency = 800;
          duration = 0.08;
          volume = 0.45;
          break;
      }
      
      oscillator.type = type === "error" ? "square" : "sine";
      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
      
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.01);
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + duration);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration);
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
