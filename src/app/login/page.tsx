"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";
import Image from "next/image";

type Tab = "qr" | "credentials";

export default function LoginPage() {
  const router = useRouter();
  const [tab,       setTab]       = useState<Tab>("qr");
  const [studentId, setStudentId] = useState("");
  const [password,  setPassword]  = useState("");
  const [error,     setError]     = useState("");
  const [loading,   setLoading]   = useState(false);
  const [showPass,  setShowPass]  = useState(false);
  const [qrStatus,  setQrStatus]  = useState("Point camera at a student QR code");
  const [qrActive,  setQrActive]  = useState(false);
  const scannerRef = useRef<unknown>(null);
  const qrStarted  = useRef(false);

  useEffect(() => {
    if (tab === "qr" && !qrStarted.current) { qrStarted.current = true; startQR(); }
    if (tab !== "qr") { stopQR(); qrStarted.current = false; }
    return () => { stopQR(); };
  }, [tab]);

  const startQR = async () => {
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const qr = new Html5Qrcode("qr-reader");
      scannerRef.current = qr;
      setQrActive(true);
      await qr.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 200, height: 200 } },
        async (text) => {
          await qr.stop(); setQrActive(false);
          setQrStatus("✅ QR detected! Looking up student…");
          await handleQRLogin(text);
        },
        () => {}
      );
    } catch { setQrStatus("Camera unavailable. Use manual login."); setQrActive(false); }
  };

  const stopQR = async () => {
    try {
      const qr = scannerRef.current as { stop: () => Promise<void>; clear: () => void } | null;
      if (qr) { await qr.stop(); qr.clear(); }
    } catch {}
    scannerRef.current = null;
  };

  const handleQRLogin = async (id: string) => {
    const { data: student, error: err } = await supabase
      .from("students").select("*").eq("student_id", id.trim()).single();
    if (err || !student) {
      setQrStatus("❌ Student not found. Try again.");
      setTimeout(() => { qrStarted.current = false; startQR(); }, 2000);
      return;
    }
    await supabase.from("library_visits").insert({
      student_id: student.student_id,
      visit_date: new Date().toISOString().split("T")[0],
      visit_time: new Date().toTimeString().split(" ")[0],
    });
    sessionStorage.setItem("student", JSON.stringify(student));
    router.push("/reason");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError("");

    const isEmail = studentId.includes("@");

    // ── Admin check ──
    if (isEmail) {
      const { data: roleData } = await supabase
        .from("user_roles").select("role").eq("email", studentId).single();
      if (roleData?.role === "admin" && password === "admin123") {
        router.push("/admin"); return;
      }
    }

    // ── Student login via email ──
    if (isEmail) {
      const { data: student, error: err } = await supabase
        .from("students").select("*")
        .eq("email", studentId).eq("password", password).single();
      if (err || !student) {
        setError("Invalid email or password."); setLoading(false); return;
      }
      await supabase.from("library_visits").insert({
        student_id: student.student_id,
        visit_date: new Date().toISOString().split("T")[0],
        visit_time: new Date().toTimeString().split(" ")[0],
      });
      sessionStorage.setItem("student", JSON.stringify(student));
      router.push("/reason"); return;
    }

    // ── Student login via student number ──
    const { data: student, error: err } = await supabase
      .from("students").select("*")
      .eq("student_id", studentId).eq("password", password).single();
    if (err || !student) {
      setError("Invalid student number or password."); setLoading(false); return;
    }
    await supabase.from("library_visits").insert({
      student_id: student.student_id,
      visit_date: new Date().toISOString().split("T")[0],
      visit_time: new Date().toTimeString().split(" ")[0],
    });
    sessionStorage.setItem("student", JSON.stringify(student));
    router.push("/reason");
  };

  const today = new Date().toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });

  return (
    <div style={{
      height: "100vh", overflow: "hidden",
      fontFamily: "'DM Sans',sans-serif",
      background: "linear-gradient(145deg,#060d1a 0%,#0d1f3e 40%,#162d55 70%,#0a1628 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      position: "relative",
    }}>

      {/* bg decorations */}
      <div style={{ position:"fixed", inset:0, backgroundImage:"radial-gradient(circle at 2px 2px,rgba(255,255,255,.025) 1px,transparent 0)", backgroundSize:"28px 28px", pointerEvents:"none", zIndex:0 }} />
      <div style={{ position:"fixed", top:"-15%", left:"-10%", width:560, height:560, borderRadius:"50%", background:"radial-gradient(circle,rgba(30,64,175,.2),transparent 68%)", filter:"blur(70px)", pointerEvents:"none", zIndex:0 }} />
      <div style={{ position:"fixed", bottom:"-15%", right:"-10%", width:500, height:500, borderRadius:"50%", background:"radial-gradient(circle,rgba(212,175,55,.09),transparent 68%)", filter:"blur(70px)", pointerEvents:"none", zIndex:0 }} />
      <div style={{ position:"fixed", top:"40%", right:"25%", width:350, height:350, borderRadius:"50%", background:"radial-gradient(circle,rgba(30,64,175,.1),transparent 68%)", filter:"blur(60px)", pointerEvents:"none", zIndex:0 }} />
      <div style={{ position:"fixed", top:0, left:0, right:0, height:2, background:"linear-gradient(90deg,transparent 0%,rgba(212,175,55,.7) 50%,transparent 100%)", pointerEvents:"none", zIndex:1 }} />
      <div style={{ position:"fixed", bottom:0, left:0, right:0, height:1, background:"linear-gradient(90deg,transparent 0%,rgba(212,175,55,.3) 50%,transparent 100%)", pointerEvents:"none", zIndex:1 }} />
      {[[12,8],[72,18],[18,78],[85,65]].map(([t,l],i)=>(
        <div key={i} className="pdot" style={{ position:"fixed", top:`${t}%`, left:`${l}%`, width:i%2===0?6:4, height:i%2===0?6:4, borderRadius:"50%", background:"#DAA520", opacity:.4, zIndex:0 }} />
      ))}

      {/* content wrapper */}
      <div style={{
        display:"flex", alignItems:"center", justifyContent:"center",
        gap:64, width:"100%", maxWidth:1080,
        padding:"0 40px", position:"relative", zIndex:2,
      }}>

        {/* ══ LEFT branding ══ */}
        <div className="left-brand" style={{ display:"none", flexDirection:"column", alignItems:"center", flex:"0 0 380px" }}>

          <div className="fl" style={{ position:"relative", marginBottom:24 }}>
            <div style={{ position:"absolute", inset:-24, borderRadius:"50%", background:"radial-gradient(circle,rgba(212,175,55,.18),transparent 68%)", filter:"blur(20px)" }} />
            <div style={{ width:156, height:156, borderRadius:"50%", background:"rgba(255,255,255,.07)", border:"2px solid rgba(212,175,55,.32)", padding:16, position:"relative", boxShadow:"0 0 55px rgba(212,175,55,.13), 0 28px 55px rgba(0,0,0,.5)" }}>
              <Image src="/neu-library-logo.png" alt="NEU" width={156} height={156}
                style={{ width:"100%", height:"100%", objectFit:"contain", borderRadius:"50%" }} />
            </div>
          </div>

          <p style={{ fontSize:11, fontWeight:700, letterSpacing:"0.38em", textTransform:"uppercase", color:"rgba(255,255,255,.35)", marginBottom:8, textAlign:"center" }}>
            New Era University
          </p>
          <h1 style={{ fontSize:54, fontWeight:900, color:"#fff", lineHeight:1, fontFamily:"'Playfair Display',serif", marginBottom:6, textAlign:"center" }}>
            Library
          </h1>
          <p style={{ fontSize:20, fontWeight:700, fontFamily:"'Playfair Display',serif", marginBottom:26, letterSpacing:"0.05em", textAlign:"center", background:"linear-gradient(90deg,#B8860B,#DAA520,#FFD700,#DAA520,#B8860B)", backgroundSize:"300% auto", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>
            Visitor Log System
          </p>
          <div style={{ width:72, height:1.5, background:"linear-gradient(90deg,transparent,#DAA520,transparent)", marginBottom:28 }} />

          {/* 2x2 square cards */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, width:"100%" }}>
            {[
              { icon:"📷", title:"QR Login",     desc:"Scan & go instantly"  },
              { icon:"📚", title:"Check-in",      desc:"Digital attendance"   },
              { icon:"📊", title:"Statistics",    desc:"Track your visits"    },
              { icon:"🎓", title:"NEU Community", desc:"All members welcome"  },
            ].map(f=>(
              <div key={f.title} style={{
                background:"rgba(255,255,255,.07)",
                backdropFilter:"blur(12px)",
                WebkitBackdropFilter:"blur(12px)",
                border:"1px solid rgba(255,255,255,.11)",
                borderRadius:16, padding:"16px 14px",
                display:"flex", flexDirection:"column", gap:8,
              }}>
                <span style={{ fontSize:24 }}>{f.icon}</span>
                <div>
                  <p style={{ fontSize:13, fontWeight:700, color:"#fff", lineHeight:1.2 }}>{f.title}</p>
                  <p style={{ fontSize:11, color:"rgba(255,255,255,.38)", marginTop:2 }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ══ RIGHT glass card ══ */}
        <div style={{ flex:"0 0 auto", width:"100%", maxWidth:420 }}>

          {/* mobile logo */}
          <div className="mobile-hdr" style={{ textAlign:"center", marginBottom:20 }}>
            <div style={{ width:76, height:76, borderRadius:"50%", background:"rgba(255,255,255,.08)", border:"2px solid rgba(212,175,55,.3)", padding:9, margin:"0 auto 10px", boxShadow:"0 0 28px rgba(212,175,55,.1)" }}>
              <Image src="/neu-library-logo.png" alt="NEU" width={76} height={76}
                style={{ width:"100%", height:"100%", objectFit:"contain", borderRadius:"50%" }} />
            </div>
            <h1 style={{ fontSize:22, fontWeight:900, color:"#fff", fontFamily:"'Playfair Display',serif" }}>NEU Library</h1>
            <p style={{ fontSize:12, color:"rgba(255,255,255,.45)", marginTop:2 }}>Visitor Log System</p>
          </div>

          {/* glass card */}
          <div style={{
            background:"rgba(255,255,255,.09)",
            backdropFilter:"blur(28px)",
            WebkitBackdropFilter:"blur(28px)",
            border:"1px solid rgba(255,255,255,.15)",
            borderRadius:26,
            padding:"32px 32px",
            boxShadow:"0 10px 50px rgba(0,0,0,.4), inset 0 1px 0 rgba(255,255,255,.12)",
          }}>

            {/* status row */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:18 }}>
              <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:"rgba(74,222,128,.1)", border:"1px solid rgba(74,222,128,.28)", color:"#4ade80", fontSize:11, fontWeight:700, padding:"4px 12px", borderRadius:100 }}>
                <span className="pdot" style={{ width:5, height:5, borderRadius:"50%", background:"#4ade80", display:"inline-block" }} />
                Library is Open
              </div>
              <p style={{ fontSize:11, color:"rgba(255,255,255,.35)" }}>{today}</p>
            </div>

            <h2 style={{ fontSize:30, fontWeight:900, color:"#fff", lineHeight:1.1, fontFamily:"'Playfair Display',serif", marginBottom:4 }}>
              Welcome Back
            </h2>
            <p style={{ fontSize:13, color:"rgba(255,255,255,.48)", marginBottom:22 }}>
              Sign in to record your library visit
            </p>

            {/* tabs */}
            <div style={{ display:"flex", background:"rgba(0,0,0,.3)", borderRadius:13, padding:4, marginBottom:22, gap:4 }}>
              {(["qr","credentials"] as Tab[]).map(t=>(
                <button key={t} onClick={()=>setTab(t)} style={{
                  flex:1, padding:"9px 10px", border:"none", borderRadius:10,
                  fontSize:12, fontWeight:700, fontFamily:"'DM Sans',sans-serif",
                  cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:5,
                  transition:"all .2s",
                  background: tab===t ? "rgba(255,255,255,.16)" : "transparent",
                  color:      tab===t ? "#fff" : "rgba(255,255,255,.38)",
                  boxShadow:  tab===t ? "0 2px 12px rgba(0,0,0,.25)" : "none",
                }}>
                  {t==="qr" ? "📷 QR Code" : "🔐 Credentials"}
                </button>
              ))}
            </div>

            {/* QR tab */}
            {tab==="qr" && (
              <div>
                <div style={{ background:"rgba(0,0,0,.25)", border:"1px solid rgba(255,255,255,.09)", borderRadius:16, padding:"14px", marginBottom:12, textAlign:"center" }}>
                  <div id="qr-reader" style={{ width:"100%", maxWidth:280, margin:"0 auto" }} />
                  {!qrActive && (
                    <div style={{ padding:"22px 16px" }}>
                      <p style={{ fontSize:28, marginBottom:6 }}>📷</p>
                      <p style={{ fontSize:13, fontWeight:600, color:"rgba(255,255,255,.45)" }}>Starting camera…</p>
                    </div>
                  )}
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:9, background:"rgba(147,197,253,.07)", border:"1px solid rgba(147,197,253,.16)", borderRadius:12, padding:"10px 13px" }}>
                  <span style={{ fontSize:14, flexShrink:0 }}>💡</span>
                  <p style={{ fontSize:12, color:"#93C5FD", fontWeight:500, lineHeight:1.45 }}>{qrStatus}</p>
                </div>
              </div>
            )}

            {/* credentials tab */}
            {tab==="credentials" && (
              <div>
                {error && (
                  <div style={{ background:"rgba(220,38,38,.12)", border:"1px solid rgba(220,38,38,.28)", borderLeft:"3px solid #ef4444", borderRadius:11, padding:"10px 13px", marginBottom:14, display:"flex", alignItems:"center", gap:9, fontSize:13, color:"#fca5a5" }}>
                    <span>⚠️</span><span style={{ fontWeight:600 }}>{error}</span>
                  </div>
                )}
                <form onSubmit={handleLogin} style={{ display:"flex", flexDirection:"column", gap:13 }}>

                  {/* student number or email */}
                  <div>
                    <label style={{ display:"block", fontSize:10, fontWeight:700, letterSpacing:"0.16em", textTransform:"uppercase", color:"rgba(255,255,255,.48)", marginBottom:6 }}>
                      Student Number or Email
                    </label>
                    <div style={{ position:"relative" }}>
                      <span style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)", fontSize:16, pointerEvents:"none" }}>🎓</span>
                      <input
                        type="text"
                        placeholder="2021-00001 or name@neu.edu.ph"
                        value={studentId}
                        onChange={e=>setStudentId(e.target.value)}
                        required
                        style={{ width:"100%", padding:"12px 14px 12px 44px", background:"rgba(255,255,255,.08)", border:"1.5px solid rgba(255,255,255,.13)", borderRadius:12, color:"#fff", fontSize:14, fontWeight:600, fontFamily:"'DM Sans',sans-serif", outline:"none", transition:"all .2s" }}
                        onFocus={e=>{ e.target.style.borderColor="rgba(147,197,253,.55)"; e.target.style.background="rgba(255,255,255,.12)"; }}
                        onBlur={e=> { e.target.style.borderColor="rgba(255,255,255,.13)"; e.target.style.background="rgba(255,255,255,.08)"; }}
                      />
                    </div>
                    {/* hint text */}
                    <p style={{ fontSize:10, color:"rgba(255,255,255,.25)", marginTop:5, paddingLeft:2 }}>
                      Admin must use email address only
                    </p>
                  </div>

                  {/* password */}
                  <div>
                    <label style={{ display:"block", fontSize:10, fontWeight:700, letterSpacing:"0.16em", textTransform:"uppercase", color:"rgba(255,255,255,.48)", marginBottom:6 }}>
                      Password
                    </label>
                    <div style={{ position:"relative" }}>
                      <span style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)", fontSize:16, pointerEvents:"none" }}>🔒</span>
                      <input
                        type={showPass?"text":"password"}
                        placeholder="Enter your password"
                        value={password}
                        onChange={e=>setPassword(e.target.value)}
                        required
                        style={{ width:"100%", padding:"12px 44px 12px 44px", background:"rgba(255,255,255,.08)", border:"1.5px solid rgba(255,255,255,.13)", borderRadius:12, color:"#fff", fontSize:14, fontWeight:600, fontFamily:"'DM Sans',sans-serif", outline:"none", transition:"all .2s" }}
                        onFocus={e=>{ e.target.style.borderColor="rgba(147,197,253,.55)"; e.target.style.background="rgba(255,255,255,.12)"; }}
                        onBlur={e=> { e.target.style.borderColor="rgba(255,255,255,.13)"; e.target.style.background="rgba(255,255,255,.08)"; }}
                      />
                      <button type="button" onClick={()=>setShowPass(!showPass)}
                        style={{ position:"absolute", right:13, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", fontSize:16, color:"rgba(255,255,255,.38)", padding:4 }}>
                        {showPass?"🙈":"👁️"}
                      </button>
                    </div>
                  </div>

                  {/* submit */}
                  <button
                    type="submit"
                    disabled={loading}
                    style={{ width:"100%", padding:"13px", background:"linear-gradient(135deg,#0f2040,#1E3A8A,#2563EB)", backgroundSize:"200%", border:"none", borderRadius:12, color:"#fff", fontSize:14, fontWeight:700, fontFamily:"'DM Sans',sans-serif", cursor:loading?"not-allowed":"pointer", transition:"transform .15s, box-shadow .2s", boxShadow:"0 6px 22px rgba(30,64,175,.4)", display:"flex", alignItems:"center", justifyContent:"center", gap:8, marginTop:4, opacity:loading?.65:1 }}
                    onMouseEnter={e=>{ if(!loading)(e.currentTarget as HTMLButtonElement).style.transform="translateY(-1px)"; }}
                    onMouseLeave={e=>{ (e.currentTarget as HTMLButtonElement).style.transform="translateY(0)"; }}>
                    {loading
                      ? <><svg className="sp" style={{ width:16,height:16 }} viewBox="0 0 24 24" fill="none"><circle style={{ opacity:.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path style={{ opacity:.75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Signing in…</>
                      : "Sign In & Check In →"
                    }
                  </button>
                </form>
              </div>
            )}

            {/* footer */}
            <div style={{ marginTop:20, paddingTop:16, borderTop:"1px solid rgba(255,255,255,.07)", textAlign:"center" }}>
              <div style={{ width:28, height:1, background:"linear-gradient(90deg,transparent,#DAA520,transparent)", margin:"0 auto 10px" }} />
              <p style={{ fontSize:11, color:"rgba(255,255,255,.26)" }}>New Era University · Library Management System</p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        input::placeholder { color: rgba(255,255,255,.28) !important; font-weight: 400; }
        @media(min-width:1024px){
          .left-brand { display:flex !important; }
          .mobile-hdr { display:none  !important; }
        }
      `}</style>
    </div>
  );
}