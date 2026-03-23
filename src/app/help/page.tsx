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
import QRCodeModal from "@/app/components/QRCodeModal";
import ThemeSoundToggle from "@/app/components/ThemeSoundToggle";
import type { HelpContent } from "@/app/lib/types";
import { useTheme, getThemeColors } from "@/app/lib/themeContext";
import { useSound } from "@/app/lib/soundContext";

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
  const { mode } = useTheme();
  const theme = getThemeColors(mode === "dark");
  const { playSound } = useSound();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [items,       setItems]       = useState<HelpContent[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [activeSection, setActiveSection] = useState<Section>("faq");
  const [openItem,    setOpenItem]    = useState<string | null>(null);
  const [qrLoading,   setQrLoading]   = useState(false);
  const [qrError,     setQrError]     = useState("");
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrStudentId, setQrStudentId] = useState("");
  const [qrStudentName, setQrStudentName] = useState("");

  useEffect(() => {
    // Check if user is logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session?.user);
    });
    
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

  const handleGenerateQR = async () => {
    setQrLoading(true);
    setQrError("");
    
    // Check if already logged in
    const { data: { session } } = await supabase.auth.getSession();
    console.log("[QR Gen] Session check:", session?.user?.email);
    
    if (session?.user) {
      const email = session.user.email || "";
      console.log("[QR Gen] User email:", email);
      
      if (email.endsWith("@neu.edu.ph")) {
        const { data: student, error: studentError } = await supabase
          .from("students")
          .select("student_id, name")
          .eq("email", email)
          .single();
        
        console.log("[QR Gen] Student query result:", { student, studentError });
        
        if (student) {
          setQrStudentId(student.student_id);
          setQrStudentName(student.name);
          setShowQRModal(true);
          setQrLoading(false);
          console.log("[QR Gen] Showing modal - DONE");
          return;
        } else {
          setQrError("No account found. Please register first.");
          setQrLoading(false);
          console.log("[QR Gen] No student record found");
          return;
        }
      } else {
        setQrError("Please use your @neu.edu.ph email.");
        setQrLoading(false);
        console.log("[QR Gen] Email doesn't end with @neu.edu.ph");
        return;
      }
    }
    
    console.log("[QR Gen] Not logged in, triggering OAuth");
    // Not logged in, trigger OAuth
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/help?qr=generate`,
        queryParams: { hd: "neu.edu.ph" }
      }
    });
    if (error) {
      setQrError("Failed to sign in with Google");
      setQrLoading(false);
    }
  };

  useEffect(() => {
    const checkQRGeneration = async () => {
      const params = new URLSearchParams(window.location.search);
      if (params.get("qr") === "generate") {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const email = session.user.email || "";
          if (email.endsWith("@neu.edu.ph")) {
            const { data: student } = await supabase
              .from("students")
              .select("student_id, name")
              .eq("email", email)
              .single();
            if (student) {
              setQrStudentId(student.student_id);
              setQrStudentName(student.name);
              setShowQRModal(true);
              window.history.replaceState({}, "", "/help");
            } else {
              setQrError("No account found. Please register first.");
              window.history.replaceState({}, "", "/help");
            }
          }
        }
      }
    };
    checkQRGeneration();
  }, []);

  return (
    <div style={{ minHeight: "100vh", fontFamily: "'DM Sans',sans-serif", position: "relative", color: theme.text, display: "flex", flexDirection: "column", background: theme.bg }}>

      {/* Background */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0 }}>
        {theme.isDark ? (
          <>
            <Image src={BG_IMAGE} alt="" fill style={{ objectFit: "cover" }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(145deg,rgba(6,13,26,.97) 0%,rgba(13,31,62,.95) 50%,rgba(10,22,40,.97) 100%)" }} />
          </>
        ) : (
          <div style={{ position: "absolute", inset: 0, background: theme.bgGradient }} />
        )}
      </div>
      <div style={{ position: "fixed", inset: 0, backgroundImage: theme.isDark ? "radial-gradient(circle at 2px 2px,rgba(255,255,255,.02) 1px,transparent 0)" : "radial-gradient(circle at 2px 2px,rgba(33,150,243,.04) 1px,transparent 0)", backgroundSize: "28px 28px", pointerEvents: "none", zIndex: 1 }} />
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: 2, background: theme.isDark ? "linear-gradient(90deg,transparent,rgba(212,175,55,.7),transparent)" : "linear-gradient(90deg,transparent,rgba(33,150,243,.5),transparent)", pointerEvents: "none", zIndex: 2 }} />

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .5 }}
        style={{ position: "sticky", top: 0, zIndex: 100, height: 60, background: theme.isDark ? "rgba(6,13,26,.85)" : "rgba(227,242,253,.9)", backdropFilter: "blur(20px)", borderBottom: theme.isDark ? "1px solid rgba(212,175,55,.12)" : "1px solid rgba(33,150,243,.2)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 28px" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", border: theme.isDark ? "1px solid rgba(212,175,55,.3)" : "1px solid rgba(33,150,243,.3)", padding: 4 }}>
            <Image src="/neu-library-logo.png" alt="NEU" width={36} height={36} style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: "50%" }} />
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 800, color: theme.text, lineHeight: 1.2 }}>NEU Library</p>
            <p style={{ fontSize: 10, color: theme.textFaint, letterSpacing: ".1em", textTransform: "uppercase" }}>Help Center</p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <ThemeSoundToggle />
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: .97 }}
            onClick={() => router.push("/kiosk")}
            style={{ height: 38, padding: "0 18px", background: theme.glass.background, border: theme.glass.border, borderRadius: 10, color: theme.textMuted, fontSize: 13, fontWeight: 700, fontFamily: "'DM Sans',sans-serif", cursor: "pointer" }}>
            ← Back to Kiosk
          </motion.button>
        </div>
      </motion.header>

      {/* Body */}
      <div style={{ flex: 1, maxWidth: 780, margin: "0 auto", width: "100%", padding: "36px 24px", position: "relative", zIndex: 2 }}>

        {/* Title */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .5, delay: .1 }} style={{ marginBottom: 32, textAlign: "center" }}>
          <div style={{ position: "relative", display: "inline-block", marginBottom: 16 }}>
            <div style={{ position: "absolute", inset: -16, borderRadius: "50%", background: theme.isDark ? "radial-gradient(circle,rgba(212,175,55,.2),transparent 68%)" : "radial-gradient(circle,rgba(15,23,42,.12),transparent 68%)", filter: "blur(14px)", animation: "pulse 3s ease-in-out infinite" }} />
            <div style={{ width: 72, height: 72, borderRadius: "50%", background: theme.isDark ? "rgba(6,13,26,.5)" : "rgba(255,255,255,.9)", border: theme.isDark ? "2px solid rgba(212,175,55,.4)" : "2px solid rgba(15,23,42,.15)", padding: 9, backdropFilter: "blur(10px)", position: "relative" }}>
              <Image src="/neu-library-logo.png" alt="NEU" width={72} height={72} style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: "50%" }} />
            </div>
          </div>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".28em", textTransform: "uppercase", color: theme.isDark ? "rgba(212,175,55,.6)" : "rgba(33,150,243,.7)", marginBottom: 8 }}>Need assistance?</p>
          <h1 style={{ fontSize: 40, fontWeight: 900, color: theme.text, fontFamily: "'Playfair Display',serif", lineHeight: 1.1, marginBottom: 10 }}>Help Center</h1>
          <p style={{ fontSize: 15, color: theme.textMuted, maxWidth: 480, margin: "0 auto" }}>
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
                background: activeSection === key ? meta.bg : theme.cardAlt,
                borderColor: activeSection === key ? meta.border : theme.border,
                color: activeSection === key ? meta.color : theme.textMuted,
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
                  <p style={{ fontSize: 16, color: theme.textMuted, fontWeight: 600 }}>No content available yet</p>
                </div>
              ) : sectionItems.map((item, i) => {
                const meta = SECTION_META[item.section as Section];
                const isOpen = openItem === item.id;
                return (
                  <motion.div
                    key={item.id}
                    custom={i} variants={fadeUp} initial="hidden" animate="visible"
                    style={{ background: isOpen ? theme.glass.background : theme.cardAlt, borderTop: `1px solid ${isOpen ? meta.border : theme.border}`, borderRight: `1px solid ${isOpen ? meta.border : theme.border}`, borderBottom: `1px solid ${isOpen ? meta.border : theme.border}`, borderLeft: `3px solid ${isOpen ? meta.color : "transparent"}`, borderRadius: 14, overflow: "hidden", transition: "border-color .2s, background .2s" }}
                  >
                    <button
                      onClick={() => setOpenItem(isOpen ? null : item.id)}
                      style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, padding: "18px 20px", background: "none", border: "none", cursor: "pointer", fontFamily: "'DM Sans',sans-serif", textAlign: "left" }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: meta.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{meta.icon}</div>
                        <p style={{ fontSize: 15, fontWeight: 700, color: isOpen ? meta.color : theme.text }}>{item.title}</p>
                      </div>
                      <motion.span
                        animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: .2 }}
                        style={{ fontSize: 14, color: theme.textFaint, flexShrink: 0 }}
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
                            <p style={{ fontSize: 14, color: theme.textMuted, lineHeight: 1.7 }}>{item.content}</p>
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
          <p style={{ fontSize: 12, color: theme.textMuted }}>
            M/T/W/F: 7:00 AM – 7:00 PM &nbsp;·&nbsp; Th/Sat: 7:00 AM – 6:00 PM
          </p>
        </motion.div>

        {/* Sound Test Section */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .55 }}
          style={{ marginTop: 24, background: theme.cardAlt, border: theme.border, borderRadius: 14, padding: "24px", textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🔊</div>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: theme.text, marginBottom: 6 }}>Test Sound Effects</h3>
          <p style={{ fontSize: 14, color: theme.textMuted, marginBottom: 18, lineHeight: 1.6 }}>
            Click the buttons below to test different sound effects used in the system.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
            {[
              { type: "intro" as const, label: "Intro", emoji: "🎵" },
              { type: "checkin" as const, label: "Check-in", emoji: "✅" },
              { type: "checkout" as const, label: "Check-out", emoji: "👋" },
              { type: "error" as const, label: "Error", emoji: "❌" },
              { type: "success" as const, label: "Success", emoji: "🎯" },
              { type: "click" as const, label: "Click", emoji: "🖱️" },
            ].map((sound) => (
              <motion.button
                key={sound.type}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => playSound(sound.type)}
                style={{
                  padding: "12px 20px",
                  background: theme.glass.background,
                  border: theme.glass.border,
                  borderRadius: 10,
                  color: theme.text,
                  fontSize: 13,
                  fontWeight: 700,
                  fontFamily: "'DM Sans',sans-serif",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span>{sound.emoji}</span>
                <span>{sound.label}</span>
              </motion.button>
            ))}
          </div>
          <p style={{ fontSize: 11, color: theme.textFaint, marginTop: 14 }}>
            Make sure your device volume is on and the mute button (🔊) is not active
          </p>
        </motion.div>

        {/* QR Code Generation Section */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .6 }}
          style={{ marginTop: 24, background: theme.cardAlt, border: theme.border, borderRadius: 14, padding: "24px", textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📱</div>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: theme.text, marginBottom: 6 }}>Generate Your QR Code</h3>
          <p style={{ fontSize: 14, color: theme.textMuted, marginBottom: 18, lineHeight: 1.6 }}>
            Already have an account? Generate your personal QR code for quick library check-in.
          </p>
          {qrError && (
            <div style={{ background: "rgba(248,113,113,.1)", border: "1px solid rgba(248,113,113,.25)", borderRadius: 10, padding: "10px 14px", marginBottom: 14 }}>
              <p style={{ fontSize: 13, color: "#f87171", fontWeight: 600 }}>⚠️ {qrError}</p>
            </div>
          )}
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: .97 }}
            onClick={handleGenerateQR}
            disabled={qrLoading}
            style={{
              padding: "14px 28px", background: "linear-gradient(135deg,#7a5800,#B8860B,#DAA520)",
              border: "none", borderRadius: 12, color: "#fff", fontSize: 14, fontWeight: 700,
              fontFamily: "'DM Sans',sans-serif", cursor: qrLoading ? "not-allowed" : "pointer",
              opacity: qrLoading ? .65 : 1, display: "inline-flex", alignItems: "center", gap: 8
            }}>
            {qrLoading ? (
              <><svg style={{ width: 16, height: 16, animation: "spin .8s linear infinite" }} viewBox="0 0 24 24" fill="none"><circle style={{ opacity: .25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path style={{ opacity: .75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>Loading…</>
            ) : isLoggedIn ? (
              <>📱 Get My QR Code</>
            ) : (
              <>🔐 Sign in with Google to Generate</>
            )}
          </motion.button>
          <p style={{ fontSize: 11, color: theme.textFaint, marginTop: 12 }}>
            {isLoggedIn ? "Click to view and download your QR code" : "You'll be asked to sign in with your @neu.edu.ph account"}
          </p>
        </motion.div>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.7} }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <QRCodeModal
        isOpen={showQRModal}
        onClose={() => {
          setShowQRModal(false);
          setQrStudentId("");
          setQrStudentName("");
        }}
        studentId={qrStudentId}
        studentName={qrStudentName}
      />
    </div>
  );
}