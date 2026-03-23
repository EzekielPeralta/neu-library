"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type ThemeMode = "dark" | "light";

interface ThemeContextType {
  mode: ThemeMode;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("neu_library_theme") as ThemeMode | null;
    if (saved) setMode(saved);
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const newMode = mode === "dark" ? "light" : "dark";
    setMode(newMode);
    localStorage.setItem("neu_library_theme", newMode);
  };

  const setTheme = (newMode: ThemeMode) => {
    setMode(newMode);
    localStorage.setItem("neu_library_theme", newMode);
  };

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
}

// Global theme colors
export function getThemeColors(isDark: boolean) {
  return {
    // Backgrounds
    bg: isDark ? "#060d1a" : "#ffffff",
    bgGradient: isDark 
      ? "linear-gradient(145deg,#060d1a 0%,#0d1f3e 40%,#162d55 70%,#0a1628 100%)"
      : "linear-gradient(145deg,#ffffff 0%,#fafbfc 50%,#f5f7fa 100%)",
    card: isDark ? "#0d1f3e" : "#ffffff",
    cardAlt: isDark ? "rgba(255,255,255,.05)" : "rgba(15,23,42,.02)",
    sidebar: isDark ? "#0a1628" : "#ffffff",
    
    // Borders
    border: isDark ? "rgba(255,255,255,.07)" : "rgba(15,23,42,.06)",
    sidebarBorder: isDark ? "rgba(212,175,55,.1)" : "rgba(15,23,42,.05)",
    inputBorder: isDark ? "rgba(255,255,255,.13)" : "rgba(15,23,42,.12)",
    
    // Text
    text: isDark ? "#ffffff" : "#0f172a",
    textMuted: isDark ? "rgba(255,255,255,.55)" : "#64748b",
    textFaint: isDark ? "rgba(255,255,255,.28)" : "#94a3b8",
    
    // Inputs
    inputBg: isDark ? "rgba(255,255,255,.06)" : "#f8fafc",
    
    // Tables
    tableRow: isDark ? "rgba(255,255,255,.04)" : "rgba(15,23,42,.015)",
    tableHeader: isDark ? "rgba(255,255,255,.03)" : "rgba(15,23,42,.03)",
    
    // Glass effect
    glass: isDark
      ? {
          background: "rgba(255,255,255,.07)",
          backdropFilter: "blur(24px)",
          border: "1px solid rgba(255,255,255,.13)",
        }
      : {
          background: "rgba(255,255,255,.98)",
          backdropFilter: "blur(24px)",
          border: "1px solid rgba(15,23,42,.08)",
        },
    
    isDark,
  };
}
