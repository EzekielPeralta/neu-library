"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";
import Image from "next/image";

const R_MAP:Record<string,{icon:string;color:string}> = {
  "Studying":        { icon:"📚", color:"#93C5FD" },
  "Borrowing Books": { icon:"📖", color:"#6EE7B7" },
  "Research":        { icon:"🔬", color:"#C4B5FD" },
  "Group Work":      { icon:"👥", color:"#FCD34D" },
  "Printing":        { icon:"🖨️", color:"#F9A8D4" },
};

export default function WelcomePage() {
  const router  = useRouter();
  const [student,   setStudent]   = useState<{name:string;student_id:string;college:string}|null>(null);
  const [reason,    setReason]    = useState("");
  const [clock,     setClock]     = useState("");
  const [isKiosk,   setIsKiosk]   = useState(false);
  const [countdown, setCountdown] = useState(10);

  useEffect(()=>{
    const s = sessionStorage.getItem("student");
    const kiosk = sessionStorage.getItem("kiosk_mode") === "true";
    if (!s){ router.push("/kiosk"); return; }

    const st = JSON.parse(s);
    setStudent(st);
    setIsKiosk(kiosk);

    // Get latest visit reason
    const fetchReason = async () => {
      const { data } = await supabase.from("library_visits")
        .select("reason").eq("student_id", st.student_id)
        .order("visit_date",{ascending:false})
        .order("visit_time",{ascending:false})
        .limit(1).single();
      if (data?.reason) setReason(data.reason);
    };
    fetchReason();

    // Clock
    const tick = () => setClock(new Date().toLocaleTimeString("en-PH",{hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:true}));
    tick();
    const clockId = setInterval(tick, 1000);

    // Auto-redirect for kiosk mode
    if (kiosk) {
      let count = 10;
      const countId = setInterval(() => {
        count--;
        setCountdown(count);
        if (count <= 0) {
          clearInterval(countId);
          sessionStorage.clear();
          router.push("/kiosk");
        }
      }, 1000);
      return () => { clearInterval(clockId); clearInterval(countId); };
    }

    return () => clearInterval(clockId);
  },[router]);

  const dateStr = new Date().toLocaleDateString("en-PH",{weekday:"long",month:"long",day:"numeric",year:"numeric"});
  const cr = reason ? R_MAP[reason] : null;
  const firstName = student?.name.split(" ")[0] ?? "";

  const handleDone = () => {
    sessionStorage.clear();
    router.push(isKiosk ? "/kiosk" : "/dashboard");
  };

  /* ─────────────────────────────────────────────────────────
     KIOSK WELCOME — simple, no stats, auto-returns to kiosk
  ───────────────────────────────────────────────────────── */
  if (isKiosk) {
    return (
      <div style={{
        height:"100vh", overflow:"auto",
        fontFamily:"'DM Sans',sans-serif",
        position:"relative",
        display:"flex", flexDirection:"column",
      }} className="kiosk-bg">

        {/* bg effects */}
        <div style={{ position:"fixed", inset:0, backgroundImage:"radial-gradient(circle at 2px 2px,rgba(255,255,255,.025) 1px,transparent 0)", backgroundSize:"30px 30px", pointerEvents:"none" }} />
        <div style={{ position:"fixed", top:0, left:0, right:0, height:3, background:"linear-gradient(90deg,transparent,rgba(212,175,55,.8),transparent)", pointerEvents:"none" }} />
        <div style={{ position:"fixed", bottom:0, left:0, right:0, height:1, background:"linear-gradient(90deg,transparent,rgba(212,175,55,.4),transparent)", pointerEvents:"none" }} />
        <div style={{ position:"fixed", top:"15%", left:"10%", width:400, height:400, borderRadius:"50%", background:"radial-gradient(circle,rgba(30,64,175,.12),transparent 68%)", filter:"blur(60px)", pointerEvents:"none" }} />
        <div style={{ position:"fixed", bottom:"15%", right:"10%", width:350, height:350, borderRadius:"50%", background:"radial-gradient(circle,rgba(212,175,55,.08),transparent 68%)", filter:"blur(60px)", pointerEvents:"none" }} />

        {/* TOP BAR */}
        <div style={{ padding:"16px 36px", display:"flex", alignItems:"center", justifyContent:"space-between", borderBottom:"1px solid rgba(212,175,55,.12)", flexShrink:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:14 }}>
            <div style={{ width:46, height:46, borderRadius:"50%", background:"rgba(255,255,255,.07)", border:"2px solid rgba(212,175,55,.3)", padding:6 }}>
              <Image src="/neu-library-logo.png" alt="NEU" width={46} height={46} style={{ width:"100%", height:"100%", objectFit:"contain", borderRadius:"50%" }} />
            </div>
            <div>
              <p style={{ fontSize:16, fontWeight:800, color:"#fff" }}>NEW ERA UNIVERSITY</p>
              <p style={{ fontSize:12, color:"rgba(255,255,255,.4)", letterSpacing:".1em", textTransform:"uppercase" }}>Library Department</p>
            </div>
          </div>
          <div style={{ textAlign:"right" }}>
            <p style={{ fontSize:28, fontWeight:900, fontFamily:"'Playfair Display',serif", background:"linear-gradient(90deg,#DAA520,#FFD700,#DAA520)", backgroundSize:"200%", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>{clock}</p>
            <p style={{ fontSize:12, color:"rgba(255,255,255,.4)" }}>{dateStr}</p>
          </div>
        </div>

        {/* MAIN */}
        <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:"24px", position:"relative", zIndex:10 }}>
          <div style={{ width:"100%", maxWidth:700, display:"flex", flexDirection:"column", gap:20, alignItems:"center" }}>

            {/* success icon */}
            <div className="au" style={{ width:90, height:90, borderRadius:"50%", background:"rgba(74,222,128,.12)", border:"2px solid rgba(74,222,128,.35)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:44, boxShadow:"0 0 40px rgba(74,222,128,.15)" }}>
              ✅
            </div>

            {/* welcome text */}
            <div className="au1" style={{ textAlign:"center" }}>
              <p style={{ fontSize:15, fontWeight:700, letterSpacing:".22em", textTransform:"uppercase", color:"rgba(255,255,255,.4)", marginBottom:10 }}>
                Check-in Successful
              </p>
              <h1 style={{ fontSize:54, fontWeight:900, color:"#fff", fontFamily:"'Playfair Display',serif", lineHeight:1.1, marginBottom:8 }}>
                Welcome to<br/>NEU Library!
              </h1>
              <p style={{ fontSize:24, fontWeight:700, background:"linear-gradient(90deg,#DAA520,#FFD700,#DAA520)", backgroundSize:"200%", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text", fontFamily:"'Playfair Display',serif" }}>
                {student?.name}
              </p>
              <p style={{ fontSize:16, color:"rgba(255,255,255,.45)", marginTop:6 }}>
                {student?.college} · {student?.student_id}
              </p>
            </div>

            {/* purpose badge */}
            {reason && cr && (
              <div className="au2" style={{ display:"flex", alignItems:"center", gap:14, background:"rgba(255,255,255,.07)", border:`1px solid ${cr.color}30`, borderRadius:18, padding:"16px 28px", backdropFilter:"blur(10px)" }}>
                <span style={{ fontSize:28 }}>{cr.icon}</span>
                <div>
                  <p style={{ fontSize:13, fontWeight:700, letterSpacing:".12em", textTransform:"uppercase", color:"rgba(255,255,255,.38)" }}>Purpose of Visit</p>
                  <p style={{ fontSize:20, fontWeight:800, color:cr.color, marginTop:2 }}>{reason}</p>
                </div>
              </div>
            )}

            {/* main message */}
            <div className="au3" style={{ textAlign:"center", background:"rgba(255,255,255,.06)", border:"1px solid rgba(255,255,255,.1)", borderRadius:20, padding:"24px 40px", backdropFilter:"blur(10px)", width:"100%" }}>
              <p style={{ fontSize:22, fontWeight:700, color:"#fff", marginBottom:6 }}>
                🎓 You may now enter the library.
              </p>
              <p style={{ fontSize:16, color:"rgba(255,255,255,.45)" }}>
                Have a productive and fulfilling visit!
              </p>
            </div>

            {/* countdown + button */}
            <div className="au4" style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:14, width:"100%" }}>
              {/* countdown ring */}
              <div style={{ display:"flex", alignItems:"center", gap:10, background:"rgba(212,175,55,.08)", border:"1px solid rgba(212,175,55,.2)", borderRadius:100, padding:"8px 20px" }}>
                <span style={{ fontSize:20, fontWeight:900, color:"#DAA520", fontFamily:"'Playfair Display',serif", minWidth:24, textAlign:"center" }}>{countdown}</span>
                <p style={{ fontSize:13, color:"rgba(255,255,255,.45)", fontWeight:600 }}>Returning to kiosk automatically…</p>
              </div>

              <button onClick={handleDone} style={{
                padding:"14px 48px",
                background:"rgba(255,255,255,.1)",
                border:"1.5px solid rgba(255,255,255,.2)",
                borderRadius:14, color:"rgba(255,255,255,.8)",
                fontSize:16, fontWeight:700,
                fontFamily:"'DM Sans',sans-serif",
                cursor:"pointer", transition:"all .2s",
              }}
                onMouseEnter={e=>(e.currentTarget as HTMLButtonElement).style.background="rgba(255,255,255,.18)"}
                onMouseLeave={e=>(e.currentTarget as HTMLButtonElement).style.background="rgba(255,255,255,.1)"}
              >
                Done — Return to Kiosk
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ─────────────────────────────────────────────────────────
     STUDENT WELCOME — after credential login, goes to dashboard
  ───────────────────────────────────────────────────────── */
  return (
    <div style={{ height:"100vh", overflow:"auto", background:"#F0F4FF", fontFamily:"'DM Sans',sans-serif", display:"flex", flexDirection:"column" }}>

      {/* HEADER */}
      <header style={{ background:"#fff", borderBottom:"1px solid #E2E8F0", padding:"0 24px", height:58, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"space-between", boxShadow:"0 1px 8px rgba(15,40,80,.07)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:11 }}>
          <div style={{ width:36, height:36, borderRadius:10, border:"1px solid rgba(30,64,175,.18)", padding:5, background:"#F0F4FF" }}>
            <Image src="/neu-library-logo.png" alt="NEU" width={36} height={36} style={{ width:"100%", height:"100%", objectFit:"contain" }} />
          </div>
          <div>
            <p style={{ fontSize:14, fontWeight:700, color:"#0f2040", fontFamily:"'Playfair Display',serif" }}>NEU Library</p>
            <p style={{ fontSize:10, color:"#94A3B8" }}>Visitor Log System</p>
          </div>
        </div>
        <div style={{ textAlign:"right" }}>
          <p style={{ fontSize:11, color:"#94A3B8" }}>{dateStr}</p>
          <p style={{ fontSize:15, fontWeight:700, color:"#1E3A8A", fontFamily:"'Playfair Display',serif" }}>{clock}</p>
        </div>
      </header>

      {/* BODY */}
      <div style={{ flex:1, overflow:"auto", display:"flex", alignItems:"center", justifyContent:"center", padding:"14px 20px" }}>
        <div style={{ width:"100%", maxWidth:1060, height:"100%", maxHeight:600, display:"flex", gap:20, alignItems:"stretch" }}>

          {/* LEFT */}
          <div style={{ flex:"0 0 280px", display:"flex", flexDirection:"column", gap:14 }} className="welcome-left">
            <div style={{ background:"linear-gradient(145deg,#080f1e,#0f2040,#162d55)", border:"1px solid rgba(212,175,55,.18)", borderRadius:18, padding:"20px 18px", flex:1, display:"flex", flexDirection:"column", justifyContent:"space-between", position:"relative", overflow:"auto", boxShadow:"0 14px 40px rgba(15,32,64,.35)" }}>
              <div style={{ position:"absolute", top:-35, right:-35, width:130, height:130, borderRadius:"50%", background:"rgba(255,255,255,.03)" }} />
              <div style={{ position:"relative", zIndex:2 }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                    <span className="pdot" style={{ width:7, height:7, borderRadius:"50%", background:"#4ade80", display:"inline-block" }} />
                    <span style={{ fontSize:10, fontWeight:700, letterSpacing:".12em", textTransform:"uppercase", color:"rgba(255,255,255,.5)" }}>Checked In ✓</span>
                  </div>
                  <div style={{ width:32, height:32, borderRadius:9, background:"rgba(255,255,255,.08)", border:"1px solid rgba(212,175,55,.2)", padding:5 }}>
                    <Image src="/neu-library-logo.png" alt="NEU" width={32} height={32} style={{ width:"100%", height:"100%", objectFit:"contain" }} />
                  </div>
                </div>
                <p style={{ fontSize:10, fontWeight:700, letterSpacing:".22em", textTransform:"uppercase", color:"rgba(255,255,255,.3)", marginBottom:6 }}>Welcome!</p>
                <h2 style={{ fontSize:26, fontWeight:900, color:"#fff", fontFamily:"'Playfair Display',serif", lineHeight:1.15, marginBottom:4 }}>{student?.name}</h2>
                <p style={{ fontSize:11, color:"rgba(255,255,255,.42)" }}>{student?.college}</p>
                <p style={{ fontSize:10, color:"rgba(255,255,255,.25)", marginTop:2 }}>{student?.student_id}</p>
                {reason&&cr&&(
                  <div style={{ background:"rgba(255,255,255,.07)", border:`1px solid ${cr.color}35`, borderRadius:11, padding:"9px 12px", display:"flex", alignItems:"center", gap:9, marginTop:12 }}>
                    <span style={{ fontSize:16 }}>{cr.icon}</span>
                    <div>
                      <p style={{ fontSize:9, fontWeight:700, letterSpacing:".1em", textTransform:"uppercase", color:"rgba(255,255,255,.32)" }}>Purpose</p>
                      <p style={{ fontSize:12, fontWeight:700, color:cr.color }}>{reason}</p>
                    </div>
                  </div>
                )}
              </div>
              <div>
                <div style={{ height:1, background:"linear-gradient(90deg,rgba(212,175,55,.35),transparent)", marginBottom:10 }} />
                <p style={{ fontSize:19, fontWeight:700, fontFamily:"'Playfair Display',serif", background:"linear-gradient(90deg,#DAA520,#FFD700,#DAA520)", backgroundSize:"200%", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>{clock}</p>
                <p style={{ fontSize:10, color:"rgba(255,255,255,.22)", marginTop:2 }}>{dateStr}</p>
              </div>
            </div>
            <div className="card-white" style={{ padding:"14px 16px", textAlign:"center" }}>
              <p style={{ fontSize:20, marginBottom:5 }}>🎓</p>
              <p style={{ fontSize:13, fontWeight:700, color:"#0f2040", fontFamily:"'Playfair Display',serif", marginBottom:3 }}>You may now enter.</p>
              <p style={{ fontSize:11, color:"#94A3B8" }}>Have a productive visit!</p>
            </div>
          </div>

          {/* RIGHT */}
          <div style={{ flex:1, minWidth:0, display:"flex", flexDirection:"column", gap:14 }}>

            {/* mobile hero */}
            <div className="welcome-mobile" style={{ background:"linear-gradient(145deg,#080f1e,#0f2040,#162d55)", border:"1px solid rgba(212,175,55,.18)", borderRadius:18, padding:"18px", display:"none", boxShadow:"0 12px 32px rgba(15,32,64,.3)" }}>
              <h2 style={{ fontSize:20, fontWeight:900, color:"#fff", fontFamily:"'Playfair Display',serif" }}>{student?.name}</h2>
              <p style={{ fontSize:11, color:"rgba(255,255,255,.38)", marginTop:2 }}>{student?.student_id}</p>
            </div>

            {/* visit recorded card */}
            <div className="card-white" style={{ padding:"18px 20px", display:"flex", alignItems:"center", gap:14, flexShrink:0 }}>
              <div style={{ width:46, height:46, borderRadius:14, background:"#ECFDF5", border:"1px solid #A7F3D0", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>✅</div>
              <div>
                <p style={{ fontSize:15, fontWeight:800, color:"#0f2040" }}>Visit Recorded Successfully</p>
                <p style={{ fontSize:12, color:"#94A3B8", marginTop:2 }}>Your attendance has been logged in the system</p>
              </div>
              <div style={{ marginLeft:"auto", textAlign:"right" }}>
                <p style={{ fontSize:12, color:"#94A3B8" }}>{dateStr}</p>
                <p style={{ fontSize:15, fontWeight:700, color:"#1E3A8A" }}>{clock}</p>
              </div>
            </div>

            {/* message */}
            <div className="card-white" style={{ padding:"22px 24px", textAlign:"center", flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
              <p style={{ fontSize:40, marginBottom:12 }}>🎓</p>
              <h3 style={{ fontSize:26, fontWeight:900, color:"#0f2040", fontFamily:"'Playfair Display',serif", marginBottom:6 }}>
                Welcome to NEU Library!
              </h3>
              <p style={{ fontSize:16, color:"#64748B", marginBottom:6 }}>
                You may now proceed inside the library.
              </p>
              <p style={{ fontSize:14, color:"#94A3B8" }}>
                Have a productive and fulfilling visit, <strong style={{ color:"#1E3A8A" }}>{firstName}</strong>!
              </p>
            </div>

            {/* sign out */}
            <div className="card-white" style={{ padding:"14px 18px", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
              <p style={{ fontSize:13, color:"#64748B" }}>Finished your session? Click sign out to return.</p>
              <button onClick={handleDone}
                style={{ padding:"11px 24px", background:"transparent", border:"1.5px solid rgba(30,64,175,.35)", borderRadius:12, color:"#1E3A8A", fontSize:14, fontWeight:700, fontFamily:"'DM Sans',sans-serif", cursor:"pointer", transition:"all .2s", whiteSpace:"nowrap", marginLeft:16 }}
                onMouseEnter={e=>(e.currentTarget as HTMLButtonElement).style.background="rgba(30,64,175,.06)"}
                onMouseLeave={e=>(e.currentTarget as HTMLButtonElement).style.background="transparent"}
              >
                Go to Dashboard →
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media(min-width:1024px){ .welcome-left{display:flex!important} .welcome-mobile{display:none!important} }
        @media(max-width:1023px){ .welcome-left{display:none!important} .welcome-mobile{display:block!important} }
      `}</style>
    </div>
  );
}