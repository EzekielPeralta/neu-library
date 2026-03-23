"use client";
import { useTheme } from "@/app/lib/themeContext";
import { useSound } from "@/app/lib/soundContext";
import { motion } from "framer-motion";

export default function ThemeSoundToggle() {
  const { mode, toggleTheme } = useTheme();
  const { isMuted, toggleMute, playSound } = useSound();
  const isDark = mode === "dark";

  const handleThemeToggle = () => {
    playSound("click");
    toggleTheme();
  };

  const handleSoundToggle = () => {
    // Don't play sound when toggling mute (that would be confusing)
    toggleMute();
  };

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      {/* Sound Toggle */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleSoundToggle}
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          background: isDark ? "rgba(255,255,255,.08)" : "rgba(15,23,42,.06)",
          border: isDark ? "1px solid rgba(255,255,255,.12)" : "1px solid rgba(15,23,42,.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          transition: "all 0.2s",
          fontSize: 18,
        }}
        title={isMuted ? "Unmute sounds" : "Mute sounds"}
      >
        {isMuted ? "🔇" : "🔊"}
      </motion.button>

      {/* Theme Toggle */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleThemeToggle}
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          background: isDark ? "rgba(255,255,255,.08)" : "rgba(15,23,42,.06)",
          border: isDark ? "1px solid rgba(255,255,255,.12)" : "1px solid rgba(15,23,42,.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          transition: "all 0.2s",
          fontSize: 18,
        }}
        title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      >
        {isDark ? "☀️" : "🌙"}
      </motion.button>
    </div>
  );
}
