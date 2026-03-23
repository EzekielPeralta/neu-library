"use client";
import { motion } from "framer-motion";
import { useTheme } from "@/app/lib/themeContext";

export default function ThemeToggle({ style }: { style?: React.CSSProperties }) {
  const { mode, toggleTheme } = useTheme();
  const isDark = mode === "dark";

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={toggleTheme}
      style={{
        width: 44,
        height: 44,
        borderRadius: "50%",
        background: isDark ? "rgba(255,255,255,.07)" : "rgba(33,150,243,.15)",
        border: isDark ? "1px solid rgba(255,255,255,.12)" : "1px solid rgba(33,150,243,.3)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        fontSize: 18,
        transition: "all .2s",
        ...style,
      }}
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
    >
      {isDark ? "☀️" : "🌙"}
    </motion.button>
  );
}
