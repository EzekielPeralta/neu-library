"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  useEffect(() => {
    // Check if this is a QR generation flow
    const isQRFlow = sessionStorage.getItem('qr_generation_flow') === 'true';
    
    if (isQRFlow) {
      sessionStorage.removeItem('qr_generation_flow');
      router.replace("/help?qr=generate");
    } else {
      router.replace("/kiosk");
    }
  }, [router]);
  return (
    <div style={{ height:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#060d1a" }}>
      <p style={{ color:"rgba(255,255,255,.4)", fontSize:16 }}>Redirecting…</p>
    </div>
  );
}