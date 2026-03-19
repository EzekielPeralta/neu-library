"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";
import Image from "next/image";

type Tab    = "qr" | "manual";
type Status = "idle" | "scanning" | "processing" | "error" | "success";
type Flow   = "timein" | "timeout";

function LibraryBadge() {
  const [isOpen, setIsOpen] = useState<boolean|null>(null);
  useEffect(()=>{
    supabase.from("library_status").select("is_open").eq("id",1).single()
      .then(({data})=>{ if(data) setIsOpen(data.is_open); });
  },[]);
  if(isOpen===null) return null;
  return (
    <div style={{ display:"flex", alignItems:"center", gap:6, background:isOpen?"rgba(74,222,128,.1)":"rgba(248,113,113,.1)", border:`1px solid ${isOpen?"rgba(74,222,128,.28)":"rgba(248,113,113,.28)"}`, padding:"5px 12px", borderRadius:100 }}>
      <span style={{ width:6, height:6, borderRadius:"50%", background:isOpen?"#4ade80":"#f87171", display:"inline-block" }} />
      <span style={{ fontSize:11, fontWeight:700, color:isOpen?"#4ade80":"#f87171", letterSpacing:".06em" }}>
        {isOpen ? "OPEN" : "CLOSED"}
      </span>
    </div>
  );
}

export default function KioskPage() {
  const router = useRouter();
  const [tab,           setTab]           = useState<Tab>("qr");
  const [status,        setStatus]        = useState<Status>("idle");
  const [message,       setMessage]       = useState("Scan QR or sign in with Google");
  const [clock,         setClock]         = useState("");
  const [date,          setDate]          = useState("");
  const [camReady,      setCamReady]      = useState(false);
  const [manualId,      setManualId]      = useState("");
  const [manualErr,     setManualErr]     = useState("");
  const [manualLoading, setManualLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [resultFlow,    setResultFlow]    = useState<Flow>("timein");
  const [resultStudent, setResultStudent] = useState<{name:string;college:string;student_id:string}|null>(null);
  const [resultTime,    setResultTime]    = useState("");
  const [showResult,    setShowResult]    = useState(false);
  const [showAdminChoice, setShowAdminChoice] = useState(false);
  const [adminEmail,      setAdminEmail]      = useState("");
  const [adminStudent,    setAdminStudent]     = useState<{name:string;college:string;student_id:string}|null>(null);
  const scannerRef = useRef<unknown>(null);
  const qrStarted  = useRef(false);

  useEffect(() => {
    const tick = () => {
      setClock(new Date().toLocaleTimeString("en-PH",{hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:true}));
      setDate(new Date().toLocaleDateString("en-PH",{weekday:"long",month:"long",day:"numeric",year:"numeric"}));
    };
    tick();
    const id = setInterval(tick, 1000);
    checkGoogleReturn();
    if (!qrStarted.current) { qrStarted.current = true; startQR(); }
    return () => { clearInterval(id); stopQR(); };
  }, []);

  useEffect(() => {
    if (tab === "qr") {
      if (!qrStarted.current) { qrStarted.current = true; startQR(); }
    } else {
      stopQR(); setCamReady(false); qrStarted.current = false; setStatus("idle");
    }
  }, [tab]);

  // ── Google Return Handler ──
  const checkGoogleReturn = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    const email = session.user.email || "";
    if (!email.endsWith("@neu.edu.ph")) {
      await supabase.auth.signOut();
      setStatus("error");
      setMessage("Only @neu.edu.ph accounts are allowed");
      return;
    }
    const { data: roleData } = await supabase
      .from("user_roles").select("role")
      .eq("email", email).eq("role", "admin").single();
    if (roleData) {
      document.cookie = `user_email=${email}; path=/; max-age=86400`;
      document.cookie = `active_role=admin; path=/; max-age=86400`;
      const { data: student } = await supabase
        .from("students").select("*").eq("email", email).single();
      setAdminEmail(email);
      if (student) setAdminStudent(student);
      setShowAdminChoice(true);
      return;
    }
    // Regular student
    const { data: student } = await supabase
      .from("students").select("*").eq("email", email).single();

    if (!student) {
      // Not registered — send to registration page
      router.push("/register");
      return;
    }

    await processCheckIn(student);
  };

  // ── Google Sign In ──
  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/kiosk`,
        queryParams: { hd: "neu.edu.ph" },
      }
    });
    if (error) { setStatus("error"); setMessage("Google sign in failed"); setGoogleLoading(false); }
  };

  // ── Core Check-in / Check-out Logic ──
  const processCheckIn = async (student: {student_id:string;name:string;college:string}) => {
    setStatus("processing");
    setMessage("Processing…");

    // ── Check if library is open ──
    const { data: libStatus } = await supabase
      .from("library_status").select("is_open").eq("id", 1).single();

    if (!libStatus?.is_open) {
      setStatus("error");
      setMessage("The library is currently closed. Please return during operating hours.");
      setTimeout(() => {
        setStatus("idle");
        setMessage("Scan QR or sign in with Google");
        qrStarted.current = false;
        startQR();
      }, 10000);
      return;
    }

    // Check if student is blocked
    const { data: studentCheck } = await supabase
      .from("students").select("is_blocked").eq("student_id", student.student_id).single();

    if (studentCheck?.is_blocked) {
      setStatus("error");
      setMessage("Your access has been restricted. Please contact the library admin.");
      setTimeout(() => {
        setStatus("idle");
        setMessage("Scan QR or sign in with Google");
        qrStarted.current = false;
        startQR();
      }, 5000);
      return;
    }

    const today   = new Date().toISOString().split("T")[0];
    const nowTime = new Date().toTimeString().split(" ")[0];

    const { data: existing } = await supabase
      .from("library_visits").select("*")
      .eq("student_id", student.student_id)
      .eq("visit_date", today)
      .eq("visit_status", "inside")
      .order("visit_time", {ascending:false})
      .limit(1);

    if (existing && existing.length > 0) {
      // TIME OUT
      await supabase.from("library_visits")
        .update({ time_out: nowTime, visit_status: "completed" })
        .eq("visit_id", existing[0].visit_id);

setResultFlow("timeout");
      setResultStudent(student);
      setResultTime(new Date().toLocaleTimeString("en-PH",{hour:"2-digit",minute:"2-digit",hour12:true}));
      setStatus("success");
      setShowResult(true);
      // Sign out Google session so kiosk doesn't auto-login next visitor
      await supabase.auth.signOut();

      setTimeout(() => {
        setShowResult(false);
        setStatus("idle");
        setMessage("Scan QR or sign in with Google");
        qrStarted.current = false;
        startQR();
      }, 5000);

    } else {
      // TIME IN
      await supabase.from("library_visits").insert({
        student_id:   student.student_id,
        visit_date:   today,
        visit_time:   nowTime,
        visit_status: "inside",
      });

      sessionStorage.setItem("student", JSON.stringify(student));
      sessionStorage.setItem("kiosk_mode", "true");
      setStatus("success");
      setMessage(`Welcome, ${student.name.split(" ")[0]}!`);
      // Sign out Google session so kiosk doesn't auto-login next visitor
      await supabase.auth.signOut();
      setTimeout(() => router.push("/reason"), 900);
    }
  };

  // ── QR Success ──
  const handleQRSuccess = async (studentId: string) => {
    const { data: student, error } = await supabase
      .from("students").select("*").eq("student_id", studentId).single();
    if (error || !student) {
      setStatus("error");
      setMessage("Student not found — please try again");
      setTimeout(() => {
        setStatus("idle");
        setMessage("Scan QR or sign in with Google");
        qrStarted.current = false;
        startQR();
      }, 10000);
      return;
    }
    await processCheckIn(student);
  };

  // ── Manual Submit ──
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualId.trim()) return;
    setManualLoading(true); setManualErr("");
    const { data: student, error } = await supabase
      .from("students").select("*").eq("student_id", manualId.trim()).single();
    if (error || !student) {
      setManualErr("Student ID not found. Please check and try again.");
      setManualLoading(false);
      return;
    }
    await processCheckIn(student);
    setManualLoading(false);
  };

  // ── QR Scanner ──
  const startQR = async () => {
    await new Promise(r => setTimeout(r, 350));
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      if (scannerRef.current) {
        try { const o = scannerRef.current as {stop:()=>Promise<void>;clear:()=>void}; await o.stop(); o.clear(); } catch {}
        scannerRef.current = null;
      }
      try { const s = new Html5Qrcode("qr-reader-kiosk"); await s.stop(); s.clear(); } catch {}
      const qr = new Html5Qrcode("qr-reader-kiosk");
      scannerRef.current = qr;
      await qr.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        async (text) => {
          if (!scannerRef.current) return;
          scannerRef.current = null;
          try { await qr.stop(); qr.clear(); } catch {}
          setCamReady(false);
          setStatus("processing");
          setMessage("Verifying student ID…");
          await handleQRSuccess(text.trim());
        },
        () => {}
      );
      setCamReady(true);
      setStatus("scanning");
    } catch (err) {
      console.warn("QR error:", err);
      setStatus("error");
      setMessage("Camera unavailable — use manual entry or Google Sign In");
      setCamReady(false);
    }
  };

  const stopQR = async () => {
    const qr = scannerRef.current as {stop:()=>Promise<void>;clear:()=>void}|null;
    scannerRef.current = null;
    if (!qr) return;
    try { await qr.stop(); } catch {}
    try { qr.clear(); } catch {}
    setCamReady(false);
  };

  const statusColor = {
    idle:"rgba(255,255,255,.45)", scanning:"#4ade80",
    processing:"#DAA520", error:"#f87171", success:"#4ade80",
  }[status];

  // ══ ADMIN CHOICE SCREEN ══
  if (showAdminChoice) {
    return (
      <div style={{ height:"100vh", overflow:"auto", fontFamily:"'DM Sans',sans-serif", background:"linear-gradient(145deg,#060d1a 0%,#0d1f3e 40%,#162d55 70%,#0a1628 100%)", display:"flex", alignItems:"center", justifyContent:"center", position:"relative", color:"#fff" }}>
        <div style={{ position:"fixed", inset:0, backgroundImage:"radial-gradient(circle at 2px 2px,rgba(255,255,255,.025) 1px,transparent 0)", backgroundSize:"28px 28px", pointerEvents:"none" }} />
        <div style={{ position:"fixed", top:"-15%", left:"-10%", width:500, height:500, borderRadius:"50%", background:"radial-gradient(circle,rgba(30,64,175,.2),transparent 68%)", filter:"blur(70px)", pointerEvents:"none" }} />
        <div style={{ position:"fixed", bottom:"-15%", right:"-10%", width:440, height:440, borderRadius:"50%", background:"radial-gradient(circle,rgba(212,175,55,.1),transparent 68%)", filter:"blur(70px)", pointerEvents:"none" }} />
        <div style={{ position:"fixed", top:0, left:0, right:0, height:2, background:"linear-gradient(90deg,transparent,rgba(212,175,55,.7),transparent)", pointerEvents:"none" }} />

        <div style={{ width:"100%", maxWidth:480, padding:"0 24px", position:"relative", zIndex:10 }}>
          <div style={{ textAlign:"center", marginBottom:28 }}>
            <div style={{ position:"relative", display:"inline-block", marginBottom:16 }}>
              <div style={{ position:"absolute", inset:-16, borderRadius:"50%", background:"radial-gradient(circle,rgba(212,175,55,.18),transparent 68%)", filter:"blur(14px)" }} />
              <div style={{ width:80, height:80, borderRadius:"50%", background:"rgba(255,255,255,.07)", border:"2px solid rgba(212,175,55,.32)", padding:9, position:"relative", boxShadow:"0 0 40px rgba(212,175,55,.12)" }}>
                <Image src="/neu-library-logo.png" alt="NEU" width={80} height={80}
                  style={{ width:"100%", height:"100%", objectFit:"contain", borderRadius:"50%" }} />
              </div>
            </div>
            <p style={{ fontSize:11, fontWeight:700, letterSpacing:".28em", textTransform:"uppercase", color:"rgba(255,255,255,.35)", marginBottom:6 }}>Welcome back</p>
            <h1 style={{ fontSize:30, fontWeight:900, color:"#fff", fontFamily:"'Playfair Display',serif", lineHeight:1.15, marginBottom:4 }}>
              {adminStudent?.name || adminEmail.split("@")[0]}
            </h1>
            <p style={{ fontSize:13, color:"rgba(255,255,255,.38)" }}>{adminEmail}</p>
            <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:"rgba(212,175,55,.1)", border:"1px solid rgba(212,175,55,.25)", color:"#DAA520", fontSize:11, fontWeight:700, padding:"4px 12px", borderRadius:100, marginTop:8, letterSpacing:".06em" }}>
              ADMIN
            </div>
          </div>

          <div style={{ background:"rgba(255,255,255,.09)", backdropFilter:"blur(28px)", WebkitBackdropFilter:"blur(28px)", border:"1px solid rgba(255,255,255,.15)", borderRadius:24, padding:"28px 26px", boxShadow:"0 10px 50px rgba(0,0,0,.4), inset 0 1px 0 rgba(255,255,255,.12)" }}>
            <p style={{ fontSize:14, color:"rgba(255,255,255,.48)", textAlign:"center", marginBottom:22, lineHeight:1.6 }}>
              You have admin access. What would you like to do?
            </p>
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              <button
                onClick={async () => {
                  setShowAdminChoice(false);
                  if (adminStudent) { await processCheckIn(adminStudent); }
                  else { setStatus("error"); setMessage("No student record found for this admin account"); }
                }}
                style={{ width:"100%", padding:"16px 20px", background:"rgba(255,255,255,.06)", border:"1px solid rgba(255,255,255,.12)", borderRadius:14, color:"#fff", cursor:"pointer", textAlign:"left" as const, fontFamily:"'DM Sans',sans-serif", transition:"all .2s" }}
                onMouseEnter={e=>(e.currentTarget as HTMLButtonElement).style.background="rgba(255,255,255,.12)"}
                onMouseLeave={e=>(e.currentTarget as HTMLButtonElement).style.background="rgba(255,255,255,.06)"}>
                <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                  <div style={{ width:46, height:46, borderRadius:13, background:"rgba(74,222,128,.1)", border:"1px solid rgba(74,222,128,.22)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>📋</div>
                  <div style={{ flex:1 }}>
                    <p style={{ fontSize:15, fontWeight:700, color:"#fff", marginBottom:2 }}>Library Check-in / Check-out</p>
                    <p style={{ fontSize:12, color:"rgba(255,255,255,.4)" }}>{adminStudent?"Record your visit to the library":"No student record linked to this account"}</p>
                  </div>
                  <span style={{ fontSize:16, color:"rgba(255,255,255,.3)" }}>→</span>
                </div>
              </button>

              <button
                onClick={async () => { await supabase.auth.signOut(); setShowAdminChoice(false); router.push("/admin"); }}
                style={{ width:"100%", padding:"16px 20px", background:"rgba(212,175,55,.07)", border:"1px solid rgba(212,175,55,.2)", borderRadius:14, color:"#fff", cursor:"pointer", textAlign:"left" as const, fontFamily:"'DM Sans',sans-serif", transition:"all .2s" }}
                onMouseEnter={e=>(e.currentTarget as HTMLButtonElement).style.background="rgba(212,175,55,.14)"}
                onMouseLeave={e=>(e.currentTarget as HTMLButtonElement).style.background="rgba(212,175,55,.07)"}>
                <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                  <div style={{ width:46, height:46, borderRadius:13, background:"rgba(212,175,55,.12)", border:"1px solid rgba(212,175,55,.28)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>📊</div>
                  <div style={{ flex:1 }}>
                    <p style={{ fontSize:15, fontWeight:700, color:"#DAA520", marginBottom:2 }}>Admin Dashboard</p>
                    <p style={{ fontSize:12, color:"rgba(255,255,255,.4)" }}>View analytics, logs and manage visitors</p>
                  </div>
                  <span style={{ fontSize:16, color:"rgba(212,175,55,.5)" }}>→</span>
                </div>
              </button>
            </div>

            <div style={{ marginTop:20, paddingTop:16, borderTop:"1px solid rgba(255,255,255,.07)", textAlign:"center" }}>
              <div style={{ width:28, height:1, background:"linear-gradient(90deg,transparent,#DAA520,transparent)", margin:"0 auto 12px" }} />
              <button
                onClick={async()=>{ await supabase.auth.signOut(); setShowAdminChoice(false); }}
                style={{ background:"none", border:"none", cursor:"pointer", fontSize:12, color:"rgba(255,255,255,.28)", fontFamily:"'DM Sans',sans-serif", padding:4 }}>
                ← Sign out of Google
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ══ TIMEOUT RESULT SCREEN ══
  if (showResult && resultFlow === "timeout" && resultStudent) {
    return (
      <div style={{ height:"100vh", overflow:"auto", fontFamily:"'DM Sans',sans-serif", background:"linear-gradient(145deg,#060d1a 0%,#0d1f3e 40%,#162d55 70%,#0a1628 100%)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", position:"relative", color:"#fff" }}>
        <div style={{ position:"fixed", inset:0, backgroundImage:"radial-gradient(circle at 2px 2px,rgba(255,255,255,.025) 1px,transparent 0)", backgroundSize:"28px 28px", pointerEvents:"none" }} />
        <div style={{ position:"fixed", top:0, left:0, right:0, height:2, background:"linear-gradient(90deg,transparent,rgba(212,175,55,.7),transparent)", pointerEvents:"none" }} />
        <div style={{ position:"fixed", top:"-15%", left:"-10%", width:500, height:500, borderRadius:"50%", background:"radial-gradient(circle,rgba(30,64,175,.18),transparent 68%)", filter:"blur(70px)", pointerEvents:"none" }} />
        <div style={{ position:"fixed", bottom:"-15%", right:"-10%", width:440, height:440, borderRadius:"50%", background:"radial-gradient(circle,rgba(212,175,55,.08),transparent 68%)", filter:"blur(70px)", pointerEvents:"none" }} />

        <div style={{ textAlign:"center", position:"relative", zIndex:10, maxWidth:540, padding:"0 24px" }}>
          <div style={{ width:84, height:84, borderRadius:"50%", background:"rgba(74,222,128,.1)", border:"2px solid rgba(74,222,128,.3)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 24px", boxShadow:"0 0 50px rgba(74,222,128,.1)" }}>
            <svg width="38" height="38" viewBox="0 0 52 52" fill="none">
              <path d="M10 26l12 12 20-20" stroke="#4ade80" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          <p style={{ fontSize:11, fontWeight:700, letterSpacing:".32em", textTransform:"uppercase", color:"rgba(255,255,255,.35)", marginBottom:10 }}>Check-out Recorded</p>
          <h1 style={{ fontSize:48, fontWeight:900, fontFamily:"'Playfair Display',serif", color:"#fff", lineHeight:1.1, marginBottom:8 }}>
            Safe travels,<br/>
            <span style={{ background:"linear-gradient(90deg,#B8860B,#DAA520,#FFD700,#DAA520)", backgroundSize:"200%", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>
              {resultStudent.name.split(" ")[0]}!
            </span>
          </h1>
          <p style={{ fontSize:16, color:"rgba(255,255,255,.45)", marginBottom:28 }}>Thank you for visiting the NEU Library.</p>

          <div style={{ background:"rgba(255,255,255,.06)", border:"1px solid rgba(255,255,255,.1)", borderRadius:18, padding:"20px 32px", marginBottom:28, display:"inline-flex", gap:36, alignItems:"center" }}>
            <div style={{ textAlign:"center" }}>
              <p style={{ fontSize:11, fontWeight:700, letterSpacing:".16em", textTransform:"uppercase", color:"rgba(255,255,255,.32)", marginBottom:5 }}>Time Out</p>
              <p style={{ fontSize:28, fontWeight:900, fontFamily:"'Playfair Display',serif", color:"#4ade80" }}>{resultTime}</p>
            </div>
            <div style={{ width:1, height:40, background:"rgba(255,255,255,.1)" }} />
            <div style={{ textAlign:"center" }}>
              <p style={{ fontSize:11, fontWeight:700, letterSpacing:".16em", textTransform:"uppercase", color:"rgba(255,255,255,.32)", marginBottom:5 }}>Date</p>
              <p style={{ fontSize:28, fontWeight:900, fontFamily:"'Playfair Display',serif", color:"#fff" }}>
                {new Date().toLocaleDateString("en-PH",{month:"short",day:"numeric"})}
              </p>
            </div>
          </div>

          <p style={{ fontSize:13, color:"rgba(255,255,255,.28)", marginBottom:20 }}>Returning to kiosk automatically…</p>

          <button
            onClick={()=>{ setShowResult(false); setStatus("idle"); setMessage("Scan QR or sign in with Google"); qrStarted.current=false; startQR(); }}
            style={{ padding:"12px 36px", background:"rgba(255,255,255,.08)", border:"1px solid rgba(255,255,255,.15)", borderRadius:12, color:"rgba(255,255,255,.7)", fontSize:14, fontWeight:700, fontFamily:"'DM Sans',sans-serif", cursor:"pointer", transition:"all .18s" }}
            onMouseEnter={e=>(e.currentTarget as HTMLButtonElement).style.background="rgba(255,255,255,.14)"}
            onMouseLeave={e=>(e.currentTarget as HTMLButtonElement).style.background="rgba(255,255,255,.08)"}>
            Back to Kiosk
          </button>
        </div>

        <div style={{ position:"fixed", bottom:0, left:0, right:0, height:3, background:"rgba(255,255,255,.07)", zIndex:99 }}>
          <div style={{ height:"100%", background:"linear-gradient(90deg,#DAA520,#FFD700)", animation:"countdown 10s linear forwards" }} />
        </div>
        <style>{`@keyframes countdown { from{width:100%} to{width:0%} }`}</style>
      </div>
    );
  }

  // ══ MAIN KIOSK SCREEN ══
  return (
    <div style={{ height:"100vh", overflow:"auto", fontFamily:"'DM Sans',sans-serif", background:"linear-gradient(145deg,#060d1a 0%,#0d1f3e 40%,#162d55 70%,#0a1628 100%)", display:"flex", position:"relative" }}>

      <div style={{ position:"fixed", inset:0, backgroundImage:"radial-gradient(circle at 2px 2px,rgba(255,255,255,.025) 1px,transparent 0)", backgroundSize:"28px 28px", pointerEvents:"none", zIndex:0 }} />
      <div style={{ position:"fixed", top:"-15%", left:"-10%", width:520, height:520, borderRadius:"50%", background:"radial-gradient(circle,rgba(30,64,175,.2),transparent 68%)", filter:"blur(70px)", pointerEvents:"none", zIndex:0 }} />
      <div style={{ position:"fixed", bottom:"-15%", right:"-10%", width:460, height:460, borderRadius:"50%", background:"radial-gradient(circle,rgba(212,175,55,.09),transparent 68%)", filter:"blur(70px)", pointerEvents:"none", zIndex:0 }} />
      <div style={{ position:"fixed", top:0, left:0, right:0, height:2, background:"linear-gradient(90deg,transparent,rgba(212,175,55,.7),transparent)", pointerEvents:"none", zIndex:1 }} />
      <div style={{ position:"fixed", bottom:0, left:0, right:0, height:1, background:"linear-gradient(90deg,transparent,rgba(212,175,55,.3),transparent)", pointerEvents:"none", zIndex:1 }} />

      {/* ══ LEFT PANEL ══ */}
      <div style={{ width:"46%", position:"relative", zIndex:2, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"40px 52px", borderRight:"1px solid rgba(212,175,55,.08)" }}>
        <div style={{ position:"relative", marginBottom:22, display:"inline-block" }}>
          <div style={{ position:"absolute", inset:-20, borderRadius:"50%", background:"radial-gradient(circle,rgba(212,175,55,.18),transparent 68%)", filter:"blur(18px)" }} />
          <div style={{ width:140, height:140, borderRadius:"50%", background:"rgba(255,255,255,.06)", border:"2px solid rgba(212,175,55,.3)", padding:14, position:"relative", boxShadow:"0 0 50px rgba(212,175,55,.12), 0 24px 50px rgba(0,0,0,.5)" }}>
            <Image src="/neu-library-logo.png" alt="NEU" width={140} height={140}
              style={{ width:"100%", height:"100%", objectFit:"contain", borderRadius:"50%" }} />
          </div>
        </div>

        <p style={{ fontSize:11, fontWeight:700, letterSpacing:".36em", textTransform:"uppercase", color:"rgba(255,255,255,.35)", marginBottom:7, textAlign:"center" }}>New Era University</p>
        <h1 style={{ fontSize:48, fontWeight:900, color:"#fff", lineHeight:1, fontFamily:"'Playfair Display',serif", marginBottom:5, textAlign:"center" }}>Library</h1>
        <p style={{ fontSize:18, fontWeight:700, fontFamily:"'Playfair Display',serif", marginBottom:16, letterSpacing:".05em", textAlign:"center", background:"linear-gradient(90deg,#B8860B,#DAA520,#FFD700,#DAA520,#B8860B)", backgroundSize:"300% auto", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>
          Visitor Check-in
        </p>

        <div style={{ marginBottom:16, textAlign:"center" }}>
          <p style={{ fontSize:32, fontWeight:900, fontFamily:"'Playfair Display',serif", color:"#fff", lineHeight:1 }}>{clock}</p>
          <p style={{ fontSize:12, color:"rgba(255,255,255,.38)", marginTop:3, letterSpacing:".06em" }}>{date}</p>
        </div>

        <div style={{ width:72, height:1.5, background:"linear-gradient(90deg,transparent,#DAA520,transparent)", marginBottom:16 }} />

        <p style={{ fontSize:14, color:"rgba(255,255,255,.48)", textAlign:"center", lineHeight:1.75, marginBottom:22, maxWidth:300, fontWeight:400 }}>
          Scan QR, enter student ID, or sign in with your NEU Google account to check in or out.
        </p>

        <div style={{ display:"flex", gap:10, width:"100%", maxWidth:300, marginBottom:20 }}>
          {[
            { icon:"→", label:"1st scan", desc:"Time In"  },
            { icon:"←", label:"2nd scan", desc:"Time Out" },
          ].map(b=>(
            <div key={b.label} style={{ flex:1, background:"rgba(255,255,255,.05)", border:"1px solid rgba(255,255,255,.08)", borderRadius:10, padding:"10px 12px", textAlign:"center" }}>
              <p style={{ fontSize:18, marginBottom:3 }}>{b.icon}</p>
              <p style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,.65)" }}>{b.label}</p>
              <p style={{ fontSize:10, color:"rgba(255,255,255,.35)", marginTop:1 }}>{b.desc}</p>
            </div>
          ))}
        </div>

        <button onClick={()=>router.push("/auth/admin")}
          style={{ height:38, padding:"0 20px", background:"rgba(212,175,55,.08)", border:"1px solid rgba(212,175,55,.22)", borderRadius:10, color:"rgba(212,175,55,.8)", fontSize:13, fontWeight:700, fontFamily:"'DM Sans',sans-serif", cursor:"pointer", transition:"all .18s" }}
          onMouseEnter={e=>(e.currentTarget as HTMLButtonElement).style.background="rgba(212,175,55,.15)"}
          onMouseLeave={e=>(e.currentTarget as HTMLButtonElement).style.background="rgba(212,175,55,.08)"}>
          Admin Access →
        </button>
      </div>

      {/* ══ RIGHT PANEL ══ */}
      <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:"28px 44px", position:"relative", zIndex:2 }}>
        <div style={{ width:"100%", maxWidth:420 }}>
          <div style={{ background:"rgba(255,255,255,.09)", backdropFilter:"blur(28px)", WebkitBackdropFilter:"blur(28px)", border:"1px solid rgba(255,255,255,.15)", borderRadius:26, padding:"28px 28px", boxShadow:"0 10px 50px rgba(0,0,0,.4), inset 0 1px 0 rgba(255,255,255,.12)" }}>

            {/* header with dynamic badge */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:18 }}>
              <div>
                <h2 style={{ fontSize:22, fontWeight:900, color:"#fff", fontFamily:"'Playfair Display',serif", marginBottom:2 }}>Check-in / Out</h2>
                <p style={{ fontSize:13, color:"rgba(255,255,255,.42)" }}>Scan QR, enter ID, or use Google</p>
              </div>
              <LibraryBadge />
            </div>

            {/* Google button */}
            <button onClick={handleGoogleSignIn} disabled={googleLoading}
              style={{ width:"100%", height:48, background:"#fff", border:"none", borderRadius:12, color:"#1f1f1f", fontSize:14, fontWeight:700, fontFamily:"'DM Sans',sans-serif", cursor:googleLoading?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:10, marginBottom:16, opacity:googleLoading?.7:1, transition:"opacity .2s, transform .15s", boxShadow:"0 4px 16px rgba(0,0,0,.25)" }}
              onMouseEnter={e=>{ if(!googleLoading)(e.currentTarget as HTMLButtonElement).style.transform="translateY(-1px)"; }}
              onMouseLeave={e=>{ (e.currentTarget as HTMLButtonElement).style.transform="translateY(0)"; }}>
              {googleLoading ? (
                <svg style={{ width:18,height:18,animation:"spin .8s linear infinite" }} viewBox="0 0 24 24" fill="none">
                  <circle style={{ opacity:.25 }} cx="12" cy="12" r="10" stroke="#1f1f1f" strokeWidth="4"/>
                  <path style={{ opacity:.75 }} fill="#1f1f1f" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </svg>
              )}
              {googleLoading ? "Signing in…" : "Continue with Google (@neu.edu.ph)"}
            </button>

            {/* divider */}
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
              <div style={{ flex:1, height:1, background:"rgba(255,255,255,.1)" }} />
              <p style={{ fontSize:12, color:"rgba(255,255,255,.3)", fontWeight:600 }}>or</p>
              <div style={{ flex:1, height:1, background:"rgba(255,255,255,.1)" }} />
            </div>

            {/* tabs */}
            <div style={{ display:"flex", background:"rgba(0,0,0,.28)", borderRadius:12, padding:3, marginBottom:18, gap:3 }}>
              {(["qr","manual"] as Tab[]).map(t=>(
                <button key={t} onClick={()=>setTab(t)} style={{ flex:1, padding:"8px 10px", border:"none", borderRadius:9, fontSize:13, fontWeight:700, fontFamily:"'DM Sans',sans-serif", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:5, transition:"all .2s", background:tab===t?"rgba(255,255,255,.16)":"transparent", color:tab===t?"#fff":"rgba(255,255,255,.4)", boxShadow:tab===t?"0 2px 10px rgba(0,0,0,.25)":"none" }}>
                  {t==="qr"?"📷 QR Code":"⌨️ Student ID"}
                </button>
              ))}
            </div>

            {/* QR tab */}
            {tab==="qr" && (
              <div>
                <div style={{ background:"rgba(0,0,0,.3)", border:"1px solid rgba(255,255,255,.1)", borderRadius:16, padding:14, marginBottom:12, position:"relative", overflow:"auto" }}>
                  {[
                    {top:8,left:8,   borderTop:"2px solid #DAA520",borderLeft:"2px solid #DAA520",  borderRadius:"4px 0 0 0"},
                    {top:8,right:8,  borderTop:"2px solid #DAA520",borderRight:"2px solid #DAA520", borderRadius:"0 4px 0 0"},
                    {bottom:8,left:8,  borderBottom:"2px solid #DAA520",borderLeft:"2px solid #DAA520",  borderRadius:"0 0 0 4px"},
                    {bottom:8,right:8, borderBottom:"2px solid #DAA520",borderRight:"2px solid #DAA520", borderRadius:"0 0 4px 0"},
                  ].map((s,i)=><div key={i} style={{ position:"absolute", width:20, height:20, ...s }} />)}

                  {camReady && status==="scanning" && (
                    <div style={{ position:"absolute", left:14, right:14, height:2, background:"linear-gradient(90deg,transparent,rgba(218,165,32,.8),transparent)", zIndex:10, pointerEvents:"none", animation:"scanBeam 2.2s ease-in-out infinite", boxShadow:"0 0 6px rgba(218,165,32,.5)" }} />
                  )}

                  <div id="qr-reader-kiosk" style={{ width:"100%", maxWidth:300, margin:"0 auto" }} />

                  {!camReady && status!=="success" && (
                    <div style={{ padding:"28px 20px", textAlign:"center" }}>
                      <svg style={{ width:26,height:26,margin:"0 auto 8px",display:"block",animation:"spin .8s linear infinite" }} viewBox="0 0 24 24" fill="none">
                        <circle style={{ opacity:.18 }} cx="12" cy="12" r="10" stroke="#DAA520" strokeWidth="2.5"/>
                        <path d="M12 2a10 10 0 0110 10" stroke="#DAA520" strokeWidth="2.5" strokeLinecap="round"/>
                      </svg>
                      <p style={{ fontSize:13, fontWeight:600, color:"rgba(255,255,255,.45)" }}>
                        {status==="processing"?"Processing…":"Starting camera…"}
                      </p>
                    </div>
                  )}

                  {status==="success" && (
                    <div style={{ padding:"28px 20px", textAlign:"center" }}>
                      <svg width="44" height="44" viewBox="0 0 52 52" fill="none" style={{ margin:"0 auto 8px", display:"block" }}>
                        <circle cx="26" cy="26" r="25" stroke="#4ade80" strokeWidth="1.5"/>
                        <path d="M14 26l9 9 15-15" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <p style={{ fontSize:14, fontWeight:700, color:"#4ade80" }}>{message}</p>
                    </div>
                  )}
                </div>

                <div style={{ display:"flex", alignItems:"center", gap:9, background:"rgba(147,197,253,.07)", border:"1px solid rgba(147,197,253,.15)", borderRadius:12, padding:"10px 14px" }}>
                  <span style={{ fontSize:14, flexShrink:0 }}>{status==="error"?"⚠️":status==="success"?"✅":"💡"}</span>
                  <p style={{ fontSize:13, fontWeight:500, color:"rgba(255,255,255,.6)", lineHeight:1.4 }}>
                    {status==="scanning"?"Point camera at student QR code":message}
                  </p>
                </div>
              </div>
            )}

            {/* Manual tab */}
            {tab==="manual" && (
              <div>
                {manualErr && (
                  <div style={{ background:"rgba(220,38,38,.12)", border:"1px solid rgba(220,38,38,.28)", borderLeft:"3px solid #ef4444", borderRadius:11, padding:"11px 14px", marginBottom:14, display:"flex", alignItems:"center", gap:9, fontSize:13, color:"#fca5a5" }}>
                    <span>⚠️</span><span style={{ fontWeight:600 }}>{manualErr}</span>
                  </div>
                )}
                <form onSubmit={handleManualSubmit} style={{ display:"flex", flexDirection:"column", gap:13 }}>
                  <div>
                    <label style={{ display:"block", fontSize:11, fontWeight:700, letterSpacing:".16em", textTransform:"uppercase", color:"rgba(255,255,255,.48)", marginBottom:7 }}>
                      Student ID Number
                    </label>
                    <div style={{ position:"relative" }}>
                      <span style={{ position:"absolute", left:15, top:"50%", transform:"translateY(-50%)", fontSize:17, pointerEvents:"none" }}>🎓</span>
                      <input type="text" placeholder="e.g. 2021-00001"
                        value={manualId} onChange={e=>setManualId(e.target.value)} required autoFocus
                        style={{ width:"100%", height:50, padding:"0 18px 0 48px", background:"rgba(255,255,255,.08)", border:"1.5px solid rgba(255,255,255,.13)", borderRadius:12, color:"#fff", fontSize:14, fontWeight:600, fontFamily:"'DM Sans',sans-serif", outline:"none", transition:"all .2s" }}
                        onFocus={e=>{ e.target.style.borderColor="rgba(212,175,55,.55)"; e.target.style.background="rgba(255,255,255,.12)"; }}
                        onBlur={e=> { e.target.style.borderColor="rgba(255,255,255,.13)"; e.target.style.background="rgba(255,255,255,.08)"; }}
                      />
                    </div>
                  </div>
                  <button type="submit" disabled={manualLoading||!manualId.trim()}
                    style={{ width:"100%", height:50, background:"linear-gradient(135deg,#0a1628,#1E3A8A,#2563EB)", backgroundSize:"200%", border:"none", borderRadius:12, color:"#fff", fontSize:14, fontWeight:700, fontFamily:"'DM Sans',sans-serif", cursor:manualLoading||!manualId.trim()?"not-allowed":"pointer", opacity:manualLoading||!manualId.trim()?.5:1, display:"flex", alignItems:"center", justifyContent:"center", gap:8, boxShadow:"0 6px 22px rgba(30,64,175,.38)" }}>
                    {manualLoading
                      ? <><svg style={{ width:16,height:16,animation:"spin .8s linear infinite" }} viewBox="0 0 24 24" fill="none"><circle style={{ opacity:.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path style={{ opacity:.75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Processing…</>
                      : "Check In / Out →"
                    }
                  </button>
                </form>
              </div>
            )}

            {/* footer */}
            <div style={{ marginTop:16, paddingTop:12, borderTop:"1px solid rgba(255,255,255,.07)", textAlign:"center" }}>
              <div style={{ width:28, height:1, background:"linear-gradient(90deg,transparent,#DAA520,transparent)", margin:"0 auto 8px" }} />
              <p style={{ fontSize:11, color:"rgba(255,255,255,.22)" }}>New Era University · Library Management System</p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scanBeam { 0%{top:14px} 50%{top:calc(100% - 14px)} 100%{top:14px} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes pulse { 0%,100%{opacity:.4;transform:scale(1)} 50%{opacity:.9;transform:scale(1.6)} }
        input::placeholder { color:rgba(255,255,255,.28) !important; font-weight:400; }
      `}</style>
    </div>
  );
}