"use client";
// ============================================================
// NEU Library — Help Page (Kiosk-facing)
// app/help/page.tsx
// ============================================================

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import type { HelpContent } from "@/app/lib/types";

const BG_IMAGE = "/neu-library-bg.jpg";

const SECTION_META = {
  faq:            { label: "FAQs",            icon: "❓", color: "#93C5FD", bg: "rgba(147,197,253,.1)",  border: "rgba(147,197,253,.2)"  },
  contact:        { label: "Help Contacts",   icon: "📞", color: "#6EE7B7", bg: "rgba(110,231,183,.1)",  border: "rgba(110,231,183,.2)"  },
  troubleshooting:{ label: "Troubleshooting", icon: "🔧", color: "#FCD34D", bg: "rgba(252,211,77,.1)",   border: "rgba(252,211,77,.2)"   },
} as const;

type Section = keyof typeof SECTION_META;

const fadeUp = {
  hidden:  { opacity: 0, y: 20 },
  visible: (i: number) => ({ 
    opacity: 1, 
    y: 0, 
    transition: { 
      delay: i * 0.07, 
      duration: 0.45, 
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number]
    } 
  }),
};
export default function HelpPage() {
  const router = useRouter();
  const [items,       setItems]       = useState<HelpContent[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [activeSection, setActiveSection] = useState<Section>("faq");
  const [openItem,    setOpenItem]    = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("help_content")
      .select("*")
      .eq("is_active", true)
      .order("sort_order")
      .then(({ data }) => {
        if (data) setItems(data as HelpContent[]);
        setLoading(false);
      });
  }, []);

  const sectionItems = items.filter(i => i.section === activeSection);

  return (
    <div style={{ minHeight: "100vh", fontFamily: "'DM Sans',sans-serif", position: "relative", color: "#fff", display: "flex", flexDirection: "column" }}>

      {/* Background */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0 }}>
        <Image src={BG_IMAGE} alt="" fill style={{ objectFit: "cover" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(145deg,rgba(6,13,26,.97) 0%,rgba(13,31,62,.95) 50%,rgba(10,22,40,.97) 100%)" }} />
      </div>
      <div style={{ position: "fixed", inset: 0, backgroundImage: "radial-gradient(circle at 2px 2px,rgba(255,255,255,.02) 1px,transparent 0)", backgroundSize: "28px 28px", pointerEvents: "none", zIndex: 1 }} />
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg,transparent,rgba(212,175,55,.7),transparent)", pointerEvents: "none", zIndex: 2 }} />

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .5 }}
        style={{ position: "sticky", top: 0, zIndex: 100, height: 60, background: "rgba(6,13,26,.85)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(212,175,55,.12)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 28px" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", border: "1px solid rgba(212,175,55,.3)", padding: 4 }}>
            <Image src="/neu-library-logo.png" alt="NEU" width={36} height={36} style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: "50%" }} />
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 800, color: "#fff", lineHeight: 1.2 }}>NEU Library</p>
            <p style={{ fontSize: 10, color: "rgba(255,255,255,.35)", letterSpacing: ".1em", textTransform: "uppercase" }}>Help Center</p>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: .97 }}
          onClick={() => router.push("/kiosk")}
          style={{ height: 38, padding: "0 18px", background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.12)", borderRadius: 10, color: "rgba(255,255,255,.7)", fontSize: 13, fontWeight: 700, fontFamily: "'DM Sans',sans-serif", cursor: "pointer" }}>
          ← Back to Kiosk
        </motion.button>
      </motion.header>

      {/* Body */}
      <div style={{ flex: 1, maxWidth: 780, margin: "0 auto", width: "100%", padding: "36px 24px", position: "relative", zIndex: 2 }}>

        {/* Title */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .5, delay: .1 }} style={{ marginBottom: 32, textAlign: "center" }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".28em", textTransform: "uppercase", color: "rgba(212,175,55,.6)", marginBottom: 8 }}>Need assistance?</p>
          <h1 style={{ fontSize: 40, fontWeight: 900, color: "#fff", fontFamily: "'Playfair Display',serif", lineHeight: 1.1, marginBottom: 10 }}>Help Center</h1>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,.45)", maxWidth: 480, margin: "0 auto" }}>
            Find answers to common questions, contact information, and troubleshooting guides.
          </p>
        </motion.div>

        {/* Section tabs */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .2 }}
          style={{ display: "flex", gap: 10, marginBottom: 28, flexWrap: "wrap" }}>
          {(Object.entries(SECTION_META) as [Section, typeof SECTION_META[Section]][]).map(([key, meta]) => (
            <motion.button
              key={key}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: .97 }}
              onClick={() => { setActiveSection(key); setOpenItem(null); }}
              style={{
                flex: 1, minWidth: 120, height: 52, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                border: "1px solid",
                borderRadius: 12, fontSize: 14, fontWeight: 700, fontFamily: "'DM Sans',sans-serif", cursor: "pointer", transition: "all .18s",
                background: activeSection === key ? meta.bg : "rgba(255,255,255,.04)",
                borderColor: activeSection === key ? meta.border : "rgba(255,255,255,.08)",
                color: activeSection === key ? meta.color : "rgba(255,255,255,.45)",
              }}
            >
              <span>{meta.icon}</span>
              <span>{meta.label}</span>
            </motion.button>
          ))}
        </motion.div>

        {/* Content */}
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ height: 72, background: "rgba(255,255,255,.04)", borderRadius: 14, animation: "pulse 1.5s ease infinite" }} />
            ))}
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
              transition={{ duration: .3, ease: [0.22, 1, 0.36, 1] }}
              style={{ display: "flex", flexDirection: "column", gap: 10 }}
            >
              {sectionItems.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 20px" }}>
                  <p style={{ fontSize: 36, marginBottom: 12 }}>📭</p>
                  <p style={{ fontSize: 16, color: "rgba(255,255,255,.4)", fontWeight: 600 }}>No content available yet</p>
                </div>
              ) : sectionItems.map((item, i) => {
                const meta = SECTION_META[item.section as Section];
                const isOpen = openItem === item.id;
                return (
                  <motion.div
                    key={item.id}
                    custom={i} variants={fadeUp} initial="hidden" animate="visible"
                    style={{ background: isOpen ? "rgba(255,255,255,.07)" : "rgba(255,255,255,.04)", border: `1px solid ${isOpen ? meta.border : "rgba(255,255,255,.07)"}`, borderLeft: `3px solid ${isOpen ? meta.color : "transparent"}`, borderRadius: 14, overflow: "hidden", transition: "border-color .2s, background .2s" }}
                  >
                    <button
                      onClick={() => setOpenItem(isOpen ? null : item.id)}
                      style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, padding: "18px 20px", background: "none", border: "none", cursor: "pointer", fontFamily: "'DM Sans',sans-serif", textAlign: "left" }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: meta.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{meta.icon}</div>
                        <p style={{ fontSize: 15, fontWeight: 700, color: isOpen ? meta.color : "rgba(255,255,255,.85)" }}>{item.title}</p>
                      </div>
                      <motion.span
                        animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: .2 }}
                        style={{ fontSize: 14, color: "rgba(255,255,255,.35)", flexShrink: 0 }}
                      >▾</motion.span>
                    </button>

                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: .25, ease: [0.22, 1, 0.36, 1] }}
                          style={{ overflow: "hidden" }}
                        >
                          <div style={{ padding: "0 20px 18px 68px" }}>
                            <p style={{ fontSize: 14, color: "rgba(255,255,255,.6)", lineHeight: 1.7 }}>{item.content}</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        )}

        {/* Footer note */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .5 }}
          style={{ marginTop: 36, padding: "20px 24px", background: "rgba(212,175,55,.06)", border: "1px solid rgba(212,175,55,.15)", borderRadius: 14, textAlign: "center" }}>
          <p style={{ fontSize: 13, color: "rgba(212,175,55,.8)", fontWeight: 600, marginBottom: 4 }}>
            📍 NEU Library — In front of Faculty Parking Area
          </p>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,.4)" }}>
            M/T/W/F: 7:00 AM – 7:00 PM &nbsp;·&nbsp; Th/Sat: 7:00 AM – 6:00 PM
          </p>
        </motion.div>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:.4} 50%{opacity:.8} }
      `}</style>
    </div>
  );
}