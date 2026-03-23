"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";
import Image from "next/image";
import { useTheme, getThemeColors } from "@/app/lib/themeContext";

const REASONS = [
  { label:"Studying",        desc:"Individual study or review sessions"  },
  { label:"Borrowing Books", desc:"Check out library materials"          },
  { label:"Research",        desc:"Academic or thesis research"          },
  { label:"Group Work",      desc:"Collaborative group study sessions"   },
  { label:"Printing",        desc:"Print documents or files"             },
];

const R_CLR: Record<string,{color:string;bg:string}> = {
  "Studying":        { color:"#93C5FD", bg:"rgba(147,197,253,.12)" },
  "Borrowing Books": { color:"#6EE7B7", bg:"rgba(110,231,183,.12)" },
  "Research":        { color:"#C4B5FD", bg:"rgba(196,181,253,.12)" },
  "Group Work":      { color:"#FCD34D", bg:"rgba(252,211,77,.12)"  },
  "Printing":        { color:"#F9A8D4", bg:"rgba(249,168,212,.12)" },
};

export default function ReasonPage() {
  const router  = useRouter();
  const { mode } = useTheme();
  const theme = getThemeColors(mode === "dark");
  const [selected, setSelected] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [student,  setStudent]  = useState<{name:string;student_id:string;college:string;photo_url?:string|null}|null>(null);
  const [clock,    setClock]    = useState("");

  useEffect(()=>{
    const s = sessionStorage.getItem("student");
    if(!s){ router.push("/kiosk"); return; }
    setStudent(JSON.parse(s));
    const tick=()=>setClock(new Date().toLocaleTimeString("en-PH",{hour:"2-digit",minute:"2-digit",hour12:true}));
    tick(); const id=setInterval(tick,1000); return()=>clearInterval(id);
  },[router]);

  const handleSubmit = async () => {
    if(!selected||!student) return;
    setLoading(true);
    
    // Create the visit record with reason
    const today = new Date().toISOString().split("T")[0];
    const nowTime = new Date().toTimeString().split(" ")[0];
    
    const { error: insertErr } = await supabase.from("library_visits").insert({
      student_id: student.student_id,
      visit_date: today,
      visit_time: nowTime,
      visit_status: "inside",
      reason: selected,
    });
    
    if (insertErr) {
      console.error("Failed to create visit:", insertErr);
      setLoading(false);
      return;
    }
    
    // Set flag to skip intro when returning to kiosk
    sessionStorage.setItem('skip_kiosk_intro', 'true');
    console.log('Reason page - set skip_kiosk_intro flag before redirect to welcome');
    
    router.push("/welcome");
  };

  const firstName = student?.name.split(" ")[0] ?? "";

  return (
    <div style={{
      height:"100vh", overflow:"auto",
      fontFamily:"'DM Sans',sans-serif",
      background: theme.isDark ? "linear-gradient(145deg,#060d1a 0%,#0d1f3e 40%,#162d55 70%,#0a1628 100%)" : theme.bgGradient,
      display:"flex", flexDirection:"column", position:"relative", color:theme.text,
    }}>

      {/* bg decorations */}
      <div style={{ position:"fixed", inset:0, backgroundImage:"radial-gradient(circle at 2px 2px,rgba(255,255,255,.022) 1px,transparent 0)", backgroundSize:"28px 28px", pointerEvents:"none", zIndex:0 }} />
      <div style={{ position:"fixed", top:"-15%", left:"-10%", width:500, height:500, borderRadius:"50%", background:"radial-gradient(circle,rgba(30,64,175,.18),transparent 68%)", filter:"blur(70px)", pointerEvents:"none", zIndex:0 }} />
      <div style={{ position:"fixed", bottom:"-15%", right:"-10%", width:440, height:440, borderRadius:"50%", background:"radial-gradient(circle,rgba(212,175,55,.08),transparent 68%)", filter:"blur(70px)", pointerEvents:"none", zIndex:0 }} />
      <div style={{ position:"fixed", top:0, left:0, right:0, height:2, background:"linear-gradient(90deg,transparent,rgba(212,175,55,.7),transparent)", pointerEvents:"none", zIndex:1 }} />

      {/* ── HEADER ── */}
      <header style={{
        height:58, flexShrink:0, position:"relative", zIndex:10,
        display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"0 28px",
        background:"rgba(6,13,26,.8)", backdropFilter:"blur(16px)",
        borderBottom:"1px solid rgba(212,175,55,.1)",
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:11 }}>
          <div style={{ width:34, height:34, borderRadius:"50%", border:"1px solid rgba(212,175,55,.3)", padding:4, flexShrink:0 }}>
            <Image src="/neu-library-logo.png" alt="NEU" width={34} height={34}
              style={{ width:"100%", height:"100%", objectFit:"contain", borderRadius:"50%" }} />
          </div>
          <div>
            <p style={{ fontSize:13, fontWeight:800, color:"#fff", lineHeight:1.2 }}>NEU Library</p>
            <p style={{ fontSize:10, color:"rgba(255,255,255,.35)", letterSpacing:".08em" }}>Visitor Log System</p>
          </div>
        </div>

        <div style={{ display:"flex", alignItems:"center", gap:14 }}>
          <p style={{
            fontSize:14, fontWeight:700,
            background:"linear-gradient(90deg,#DAA520,#FFD700,#DAA520)",
            backgroundSize:"200%", WebkitBackgroundClip:"text",
            WebkitTextFillColor:"transparent", backgroundClip:"text",
          }}>{clock}</p>
          {student && (
            <div style={{ display:"flex", alignItems:"center", gap:9, background:"rgba(255,255,255,.06)", border:"1px solid rgba(255,255,255,.1)", padding:"6px 13px", borderRadius:100 }}>
              <div style={{ width:26, height:26, borderRadius:"50%", background:"linear-gradient(135deg,#0f2040,#1E3A8A)", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:800, fontSize:11, flexShrink:0 }}>
                {firstName.charAt(0)}
              </div>
              <div>
                <p style={{ fontSize:12, fontWeight:700, color:"#fff", lineHeight:1.2 }}>{student.name}</p>
                <p style={{ fontSize:10, color:"rgba(255,255,255,.35)" }}>{student.student_id}</p>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* ── BODY ── */}
      <div style={{
        flex:1, overflow:"auto",
        display:"flex", alignItems:"center", justifyContent:"center",
        padding:"16px 24px", position:"relative", zIndex:2,
      }}>
        <div style={{ width:"100%", maxWidth:1020, height:"100%", maxHeight:560, display:"flex", gap:18, alignItems:"stretch" }}>

          {/* LEFT — identity card */}
          <div className="reason-left" style={{ display:"none", flex:"0 0 260px", flexDirection:"column", gap:12 }}>

            {/* greeting card */}
            <div style={{
              flex:1,
              background: theme.isDark ? "linear-gradient(145deg,#080f1e,#0f2040,#162d55)" : "linear-gradient(145deg,#ffffff,#f8fafc)",
              border: theme.isDark ? "1px solid rgba(212,175,55,.18)" : "1px solid rgba(15,23,42,.1)",
              borderRadius:16, padding:"20px 18px",
              display:"flex", flexDirection:"column", justifyContent:"space-between",
              position:"relative", overflow:"hidden",
              boxShadow: theme.isDark ? "0 14px 40px rgba(15,32,64,.4)" : "0 14px 40px rgba(15,23,42,.08)",
            }}>
              <div style={{ position:"absolute", top:-30, right:-30, width:110, height:110, borderRadius:"50%", background: theme.isDark ? "rgba(255,255,255,.03)" : "rgba(15,23,42,.02)" }} />

              <div style={{ position:"relative", zIndex:2 }}>
                {/* step badge */}
                <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:16 }}>
                  <span style={{ width:6, height:6, borderRadius:"50%", background:"#4ade80", display:"inline-block" }} />
                  <span style={{ fontSize:10, fontWeight:700, letterSpacing:".18em", textTransform:"uppercase", color: theme.textFaint }}>Step 2 of 3</span>
                </div>

                {/* Student photo - BIGGER */}
<div style={{width:180,height:180,borderRadius:"50%", overflow:"hidden", border: theme.isDark ? "3px solid rgba(212,175,55,.5)" : "3px solid rgba(15,23,42,.15)", marginBottom:16, background: theme.isDark ? "linear-gradient(135deg,#0f2040,#1E3A8A)" : "linear-gradient(135deg,#e0f2fe,#bae6fd)", display:"flex", alignItems:"center", justifyContent:"center", color: theme.isDark ? "#fff" : "#0c4a6e", fontWeight:800, fontSize:42, boxShadow: theme.isDark ? "0 0 32px rgba(212,175,55,.2)" : "0 0 32px rgba(15,23,42,.08)" }}>
  {student?.photo_url
    ? <Image src={student.photo_url} alt={firstName} width={180} height={180} style={{width:"100%",height:"100%",objectFit:"cover"}} referrerPolicy="no-referrer"/>
    : firstName.charAt(0)
  }
</div>

                <p style={{ fontSize:10, fontWeight:700, letterSpacing:".22em", textTransform:"uppercase", color: theme.textFaint, marginBottom:6 }}>Welcome back</p>
                <h2 style={{ fontSize:28, fontWeight:900, color: theme.text, fontFamily:"'Playfair Display',serif", lineHeight:1.15, marginBottom:4 }}>
                  Hello,<br/>
                  <span style={{
                    background:"linear-gradient(90deg,#B8860B,#DAA520,#FFD700,#DAA520,#B8860B)",
                    backgroundSize:"300% auto", WebkitBackgroundClip:"text",
                    WebkitTextFillColor:"transparent", backgroundClip:"text",
                  }}>{firstName}!</span>
                </h2>
                <p style={{ fontSize:12, color: theme.textMuted, lineHeight:1.6 }}>
                  Select your purpose of visit to complete check-in.
                </p>
              </div>

              <div style={{ position:"relative", zIndex:2 }}>
                <div style={{ height:1, background:"linear-gradient(90deg,rgba(212,175,55,.35),transparent)", marginBottom:10 }} />
                <p style={{ fontSize:11, color: theme.textFaint, fontWeight:600 }}>{student?.college}</p>
              </div>
            </div>

            {/* progress */}
            <div style={{ background: theme.cardAlt, border: theme.border, borderRadius:12, padding:"14px 16px" }}>
              <p style={{ fontSize:10, fontWeight:700, letterSpacing:".18em", textTransform:"uppercase", color: theme.textFaint, marginBottom:12 }}>Progress</p>
              <div style={{ display:"flex", alignItems:"center" }}>
                {[{n:1,t:"Sign In",done:true},{n:2,t:"Purpose",active:true},{n:3,t:"Welcome"}].map((s,i)=>(
                  <div key={s.n} style={{ display:"flex", alignItems:"center", flex:1 }}>
                    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
                      <div style={{
                        width:26, height:26, borderRadius:"50%",
                        display:"flex", alignItems:"center", justifyContent:"center",
                        fontSize:11, fontWeight:800,
                        background: s.done?"rgba(212,175,55,.2)":"transparent",
                        border: s.done?"1.5px solid #DAA520": "active" in s&&s.active?"1.5px solid rgba(255,255,255,.4)":"1.5px solid rgba(255,255,255,.15)",
                        color: s.done?"#DAA520": "active" in s&&s.active?"#fff":"rgba(255,255,255,.25)",
                      }}>
                        {s.done?"✓":s.n}
                      </div>
                      <p style={{ fontSize:10, fontWeight:700, color: s.done?"#DAA520": "active" in s&&s.active?"rgba(255,255,255,.7)":"rgba(255,255,255,.25)", whiteSpace:"nowrap" }}>{s.t}</p>
                    </div>
                    {i<2 && <div style={{ flex:1, height:1, background: s.done?"rgba(212,175,55,.4)":"rgba(255,255,255,.1)", margin:"0 4px", marginBottom:16 }} />}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT — reason selection */}
          <div style={{
            flex:1, minWidth:0,
            background:"rgba(255,255,255,.07)",
            backdropFilter:"blur(24px)",
            WebkitBackdropFilter:"blur(24px)",
            border:"1px solid rgba(255,255,255,.13)",
            borderRadius:20,
            padding:"22px 24px",
            boxShadow:"0 10px 40px rgba(0,0,0,.3), inset 0 1px 0 rgba(255,255,255,.1)",
            display:"flex", flexDirection:"column",
          }}>

            <div style={{ marginBottom:16, flexShrink:0 }}>
              <h3 style={{ fontSize:26, fontWeight:900, color:"#fff", fontFamily:"'Playfair Display',serif", letterSpacing:"-.01em", marginBottom:4 }}>
                Purpose of Visit
              </h3>
              <p style={{ fontSize:13, color:"rgba(255,255,255,.45)" }}>
                Why are you visiting the library today?
              </p>
            </div>

            {/* reason buttons */}
            <div style={{ display:"flex", flexDirection:"column", gap:8, flex:1, justifyContent:"center" }}>
              {REASONS.map(r=>{
                const active = selected===r.label;
                const rc = R_CLR[r.label];
                return (
                  <button key={r.label} onClick={()=>setSelected(r.label)}
                    style={{
                      display:"flex", alignItems:"center", gap:14,
                      padding:"13px 16px",
                      background: active ? rc.bg : "rgba(255,255,255,.04)",
                      border: `1px solid ${active ? rc.color+"50" : "rgba(255,255,255,.08)"}`,
                      borderLeft: `3px solid ${active ? rc.color : "transparent"}`,
                      borderRadius:12, cursor:"pointer", textAlign:"left",
                      width:"100%", fontFamily:"'DM Sans',sans-serif",
                      transition:"all .18s",
                    }}
                    onMouseEnter={e=>{ if(!active){ (e.currentTarget as HTMLButtonElement).style.background="rgba(255,255,255,.07)"; (e.currentTarget as HTMLButtonElement).style.borderLeftColor="rgba(212,175,55,.4)"; } }}
                    onMouseLeave={e=>{ if(!active){ (e.currentTarget as HTMLButtonElement).style.background="rgba(255,255,255,.04)"; (e.currentTarget as HTMLButtonElement).style.borderLeftColor="transparent"; } }}
                  >
                    {/* radio circle */}
                    <div style={{
                      width:18, height:18, borderRadius:"50%", flexShrink:0,
                      border:`2px solid ${active ? rc.color : "rgba(255,255,255,.2)"}`,
                      background: active ? rc.color : "transparent",
                      display:"flex", alignItems:"center", justifyContent:"center",
                      transition:"all .18s",
                    }}>
                      {active && <div style={{ width:6, height:6, borderRadius:"50%", background:"#060d1a" }} />}
                    </div>

                    <div style={{ flex:1 }}>
                      <p style={{ fontSize:15, fontWeight:700, color: active ? rc.color : "rgba(255,255,255,.85)", transition:"color .18s" }}>
                        {r.label}
                      </p>
                      <p style={{ fontSize:12, color:"rgba(255,255,255,.35)", marginTop:2 }}>{r.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* submit */}
            <div style={{ marginTop:14, flexShrink:0 }}>
              <button onClick={handleSubmit} disabled={!selected||loading}
                style={{
                  width:"100%", height:50,
                  background: selected
                    ? `linear-gradient(135deg,${R_CLR[selected]?.color}88,${R_CLR[selected]?.color})`
                    : "rgba(255,255,255,.06)",
                  border: `1px solid ${selected ? R_CLR[selected]?.color+"50" : "rgba(255,255,255,.1)"}`,
                  borderRadius:12, color: selected?"#fff":"rgba(255,255,255,.3)",
                  fontSize:15, fontWeight:700,
                  fontFamily:"'DM Sans',sans-serif",
                  cursor: !selected||loading ? "not-allowed":"pointer",
                  transition:"all .25s",
                  display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                }}>
                {loading
                  ? <><svg style={{ width:17,height:17,animation:"spin .8s linear infinite" }} viewBox="0 0 24 24" fill="none"><circle style={{ opacity:.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path style={{ opacity:.75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Recording…</>
                  : selected ? `Continue with "${selected}" →` : "Select a reason to continue"
                }
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media(min-width:1024px){ .reason-left{ display:flex !important; } }
      `}</style>
    </div>
  );
}