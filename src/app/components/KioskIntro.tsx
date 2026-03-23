"use client";
import { motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useSound } from "@/app/lib/soundContext";

interface KioskIntroProps {
  onComplete: () => void;
}

export default function KioskIntro({ onComplete }: KioskIntroProps) {
  const [step, setStep] = useState(0);
  const { playSound } = useSound();

  useEffect(() => {
    // Play intro sound
    playSound("intro");
    
    // Logo pulse animation
    const timer1 = setTimeout(() => setStep(1), 1000);
    // Text entrance
    const timer2 = setTimeout(() => setStep(2), 2500);
    // Fade out and complete
    const timer3 = setTimeout(() => setStep(3), 5000);
    const timer4 = setTimeout(() => {
      onComplete();
    }, 5600);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: step === 3 ? 0 : 1 }}
      transition={{ duration: 0.6 }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        background: "linear-gradient(145deg,#060d1a 0%,#0d1f3e 40%,#162d55 70%,#0a1628 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'DM Sans',sans-serif",
        overflow: "hidden",
      }}
    >
      {/* Animated background effects */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 2px 2px,rgba(255,255,255,.025) 1px,transparent 0)", backgroundSize: "32px 32px", pointerEvents: "none" }} />
      
      {/* Pulsing glow orbs */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.15, 0.25, 0.15],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{
          position: "absolute",
          top: "20%",
          left: "15%",
          width: 400,
          height: 400,
          borderRadius: "50%",
          background: "radial-gradient(circle,rgba(30,64,175,.3),transparent 68%)",
          filter: "blur(80px)",
          pointerEvents: "none",
        }}
      />
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.12, 0.22, 0.12],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.5,
        }}
        style={{
          position: "absolute",
          bottom: "20%",
          right: "15%",
          width: 350,
          height: 350,
          borderRadius: "50%",
          background: "radial-gradient(circle,rgba(212,175,55,.2),transparent 68%)",
          filter: "blur(80px)",
          pointerEvents: "none",
        }}
      />

      {/* Logo with pulsing animation */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{
          scale: step >= 1 ? 1 : 0.8,
          opacity: step >= 1 ? 1 : 0,
        }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        style={{ position: "relative", marginBottom: 40 }}
      >
        {/* Outer pulsing ring */}
        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{
            position: "absolute",
            inset: -30,
            borderRadius: "50%",
            background: "radial-gradient(circle,rgba(212,175,55,.4),transparent 70%)",
            filter: "blur(25px)",
          }}
        />

        {/* Middle ring */}
        <motion.div
          animate={{
            scale: [1, 1.08, 1],
            opacity: [0.4, 0.7, 0.4],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.3,
          }}
          style={{
            position: "absolute",
            inset: -20,
            borderRadius: "50%",
            background: "radial-gradient(circle,rgba(30,64,175,.3),transparent 70%)",
            filter: "blur(20px)",
          }}
        />

        {/* Logo container */}
        <motion.div
          animate={{
            boxShadow: [
              "0 0 40px rgba(212,175,55,.2), 0 0 80px rgba(30,64,175,.15)",
              "0 0 60px rgba(212,175,55,.4), 0 0 100px rgba(30,64,175,.25)",
              "0 0 40px rgba(212,175,55,.2), 0 0 80px rgba(30,64,175,.15)",
            ],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{
            width: 180,
            height: 180,
            borderRadius: "50%",
            background: "rgba(255,255,255,.08)",
            border: "3px solid rgba(212,175,55,.4)",
            padding: 20,
            position: "relative",
            backdropFilter: "blur(20px)",
          }}
          className="intro-logo"
        >
          <Image
            src="/neu-library-logo.png"
            alt="NEU"
            width={180}
            height={180}
            style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: "50%" }}
          />
        </motion.div>
      </motion.div>

      {/* Text entrance with elegant animation */}
      {step >= 2 && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          style={{ textAlign: "center", position: "relative", zIndex: 10 }}
        >
          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, letterSpacing: "0.1em" }}
            animate={{ opacity: 1, letterSpacing: "0.32em" }}
            transition={{ duration: 0.6, delay: 0.2 }}
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              color: "rgba(255,255,255,.5)",
              marginBottom: 16,
            }}
          >
            New Era University
          </motion.p>

          {/* Main title with gradient */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            style={{
              fontSize: 48,
              fontWeight: 900,
              fontFamily: "'Playfair Display',serif",
              lineHeight: 1.3,
              marginBottom: 20,
              background: "linear-gradient(135deg,#ffffff 0%,#DAA520 50%,#FFD700 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
            className="intro-title"
          >
            The NEU Library<br/>
            <span style={{ fontSize: 42 }} className="intro-subtitle">Log System</span>
          </motion.h1>

          {/* Loading indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            style={{
              marginTop: 32,
              display: "flex",
              gap: 6,
              justifyContent: "center",
            }}
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.3, 1, 0.3],
                }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: "easeInOut",
                }}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "rgba(212,175,55,.8)",
                }}
              />
            ))}
          </motion.div>
        </motion.div>
      )}

      {/* Scan line effect */}
      <motion.div
        animate={{
          top: ["0%", "100%"],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "linear",
        }}
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          height: 2,
          background: "linear-gradient(90deg,transparent,rgba(212,175,55,.6),transparent)",
          boxShadow: "0 0 20px rgba(212,175,55,.4)",
          pointerEvents: "none",
        }}
      />

      {/* Mobile responsive styles */}
      <style>{`
        @media (max-width: 768px) {
          .intro-logo {
            width: 120px !important;
            height: 120px !important;
            padding: 12px !important;
          }
          .intro-title {
            font-size: 32px !important;
            padding: 0 20px;
          }
          .intro-subtitle {
            font-size: 28px !important;
          }
        }
        @media (max-width: 480px) {
          .intro-logo {
            width: 100px !important;
            height: 100px !important;
            padding: 10px !important;
          }
          .intro-title {
            font-size: 28px !important;
          }
          .intro-subtitle {
            font-size: 24px !important;
          }
        }
      `}</style>
    </motion.div>
  );
}
