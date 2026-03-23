"use client";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import QRCode from "qrcode";

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  studentName: string;
}

export default function QRCodeModal({ isOpen, onClose, studentId, studentName }: QRCodeModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (isOpen && studentId) {
      QRCode.toDataURL(studentId, {
        width: 300,
        margin: 2,
        color: { dark: "#0a1628", light: "#ffffff" }
      }).then(setQrDataUrl);
    }
  }, [isOpen, studentId]);

  const handleDownload = () => {
    const link = document.createElement("a");
    link.download = `NEU-Library-QR-${studentId}.png`;
    link.href = qrDataUrl;
    link.click();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: "fixed", inset: 0, zIndex: 9999,
          background: "rgba(6,13,26,.85)", backdropFilter: "blur(20px)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: 24
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 24 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          onClick={e => e.stopPropagation()}
          style={{
            width: "100%", maxWidth: 440,
            background: "rgba(255,255,255,.09)", backdropFilter: "blur(28px)",
            border: "1px solid rgba(255,255,255,.15)", borderTop: "2px solid #DAA520",
            borderRadius: 20, padding: 28, boxShadow: "0 24px 80px rgba(0,0,0,.6)",
            fontFamily: "'DM Sans',sans-serif"
          }}
        >
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
            <h2 style={{ fontSize: 24, fontWeight: 900, color: "#fff", fontFamily: "'Playfair Display',serif", marginBottom: 6 }}>
              Registration Complete!
            </h2>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,.6)" }}>
              Your personal QR code is ready
            </p>
          </div>

          <div style={{
            background: "#fff", borderRadius: 16, padding: 20,
            display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 20
          }}>
            {qrDataUrl && (
              <img src={qrDataUrl} alt="QR Code" style={{ width: 240, height: 240, marginBottom: 12 }} />
            )}
            <p style={{ fontSize: 13, fontWeight: 700, color: "#0a1628", marginBottom: 2 }}>{studentName}</p>
            <p style={{ fontSize: 12, color: "rgba(10,22,40,.6)" }}>ID: {studentId}</p>
          </div>

          <div style={{
            background: "rgba(212,175,55,.1)", border: "1px solid rgba(212,175,55,.25)",
            borderRadius: 12, padding: 14, marginBottom: 20
          }}>
            <p style={{ fontSize: 12, color: "#DAA520", lineHeight: 1.6 }}>
              💡 <strong>Tip:</strong> Save this QR code to your phone for quick check-in at the library kiosk!
            </p>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={onClose}
              style={{
                flex: 1, height: 46, background: "rgba(255,255,255,.06)",
                border: "1px solid rgba(255,255,255,.12)", borderRadius: 10,
                color: "rgba(255,255,255,.6)", fontSize: 14, fontWeight: 700,
                fontFamily: "'DM Sans',sans-serif", cursor: "pointer"
              }}
            >
              Close
            </button>
            <button
              onClick={handleDownload}
              style={{
                flex: 2, height: 46,
                background: "linear-gradient(135deg,#7a5800,#B8860B,#DAA520)",
                border: "none", borderRadius: 10, color: "#fff", fontSize: 14,
                fontWeight: 700, fontFamily: "'DM Sans',sans-serif", cursor: "pointer"
              }}
            >
              📥 Download QR Code
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
