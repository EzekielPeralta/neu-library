"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";
import Image from "next/image";

const REASONS = [
  { label:"Studying",        icon:"📚", desc:"Individual study or review",  color:"#1D4ED8", light:"#EFF6FF", border:"#BFDBFE" },
  { label:"Borrowing Books", icon:"📖", desc:"Check out library materials", color:"#047857", light:"#ECFDF5", border:"#A7F3D0" },
  { label:"Research",        icon:"🔬", desc:"Academic or thesis research", color:"#6D28D9", light:"#F5F3FF", border:"#DDD6FE" },
  { label:"Group Work",      icon:"👥", desc:"Collaborative group study",   color:"#B45309", light:"#FFFBEB", border:"#FDE68A" },
  { label:"Printing",        icon:"🖨️", desc:"Print documents or files",    color:"#BE185D", light:"#FDF2F8", border:"#FBCFE8" },
];

export default function ReasonPage() {
  const router = useRouter();
  const [selected, setSelected] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [student,  setStudent]  = useState<{name:string;student_id:string;college:string}|null>(null);
  const [clock,    setClock]    = useState("");

  useEffect(()=>{
    const s = sessionStorage.getItem("student");
    if (!s){ router.push("/login"); return; }
    setStudent(JSON.parse(s));
    const tick=()=>setClock(new Date().toLocaleTimeString("en-PH",{hour:"2-digit",minute:"2-digit",hour12:true}));
    tick(); const id=setInterval(tick,1000); return ()=>clearInterval(id);
  },[router]);

  const handleSubmit = async () => {
    if (!selected||!student) return;
    setLoading(true);
    const { data: visits } = await supabase.from("library_visits").select("visit_id")
      .eq("student_id", student.student_id)
      .order("visit_date",{ascending:false}).order("visit_time",{ascending:false}).limit(1);
    if (visits?.length) await supabase.from("library_visits").update({reason:selected}).eq("visit_id",visits[0].visit_id);
    router.push("/welcome");
  };

  const sel = REASONS.find(r=>r.label===selected);
  const firstName = student?.name.split(" ")[0]??"";

  return (
    <div style={{ height:"100vh", overflow:"hidden", background:"#F0F4FF", fontFamily:"'DM Sans',sans-serif", display:"flex", flexDirection:"column" }}>

      {/* HEADER */}
      <header style={{ background:"#fff", borderBottom:"1px solid #E2E8F0", padding:"0 24px", height:54, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"space-between", boxShadow:"0 1px 8px rgba(15,40,80,.07)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:11 }}>
          <div style={{ width:34, height:34, borderRadius:9, border:"1px solid rgba(30,64,175,.18)", padding:5, background:"#F0F4FF" }}>
            <Image src="/neu-library-logo.png" alt="NEU" width={34} height={34} style={{ width:"100%", height:"100%", objectFit:"contain" }} />
          </div>
          <div>
            <p style={{ fontSize:14, fontWeight:700, color:"#0f2040", fontFamily:"'Playfair Display',serif", lineHeight:1.2 }}>NEU Library</p>
            <p style={{ fontSize:10, color:"#94A3B8" }}>Visitor Log System</p>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:14 }}>
          <p style={{ fontSize:13, color:"#64748B", fontWeight:600 }}>🕐 {clock}</p>
          {student && (
            <div style={{ display:"flex", alignItems:"center", gap:9 }}>
              <div style={{ textAlign:"right" }}>
                <p style={{ fontSize:12, fontWeight:700, color:"#0f2040" }}>{student.name}</p>
                <p style={{ fontSize:10, color:"#94A3B8" }}>{student.student_id}</p>
              </div>
              <div style={{ width:30, height:30, borderRadius:"50%", background:"linear-gradient(135deg,#0f2040,#1E3A8A)", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:700, fontSize:12 }}>
                {firstName.charAt(0)}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* BODY */}
      <div style={{ flex:1, overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center", padding:"14px 20px" }}>
        <div style={{ width:"100%", maxWidth:1060, height:"100%", maxHeight:600, display:"flex", gap:20, alignItems:"stretch" }}>

          {/* LEFT INFO (desktop) */}
          <div className="reason-left" style={{ display:"none", flex:"0 0 280px", flexDirection:"column", gap:14 }}>

            {/* greeting */}
            <div style={{ background:"linear-gradient(145deg,#080f1e,#0f2040,#162d55)", border:"1px solid rgba(212,175,55,.18)", borderRadius:18, padding:"22px 20px", flex:1, display:"flex", flexDirection:"column", justifyContent:"space-between", position:"relative", overflow:"hidden", boxShadow:"0 14px 40px rgba(15,32,64,.35)" }}>
              <div style={{ position:"absolute", top:-35, right:-35, width:140, height:140, borderRadius:"50%", background:"rgba(255,255,255,.03)" }} />
              <div style={{ position:"absolute", bottom:-25, left:-25, width:110, height:110, borderRadius:"50%", background:"radial-gradient(circle,rgba(212,175,55,.07),transparent 70%)" }} />
              <div style={{ position:"relative", zIndex:2 }}>
                <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:16 }}>
                  <span className="pdot" style={{ width:7, height:7, borderRadius:"50%", background:"#4ade80", display:"inline-block" }} />
                  <span style={{ fontSize:10, fontWeight:700, letterSpacing:"0.14em", textTransform:"uppercase", color:"rgba(255,255,255,.5)" }}>Step 2 of 3</span>
                </div>
                <p style={{ fontSize:10, fontWeight:700, letterSpacing:"0.24em", textTransform:"uppercase", color:"rgba(255,255,255,.32)", marginBottom:7 }}>Welcome back</p>
                <h2 style={{ fontSize:30, fontWeight:900, color:"#fff", fontFamily:"'Playfair Display',serif", lineHeight:1.1, marginBottom:6 }}>
                  Hello,<br/><span className="gold-text">{firstName}!</span>
                </h2>
                <p style={{ fontSize:12, color:"rgba(255,255,255,.42)", lineHeight:1.6 }}>Select your purpose of visit.</p>
              </div>
              <div>
                <div style={{ height:1, background:"linear-gradient(90deg,rgba(212,175,55,.4),transparent)", marginBottom:12 }} />
                <p style={{ fontSize:11, color:"rgba(255,255,255,.28)", fontWeight:600 }}>{student?.college}</p>
              </div>
            </div>

            {/* progress */}
            <div className="card-white" style={{ padding:"15px 18px" }}>
              <p style={{ fontSize:10, fontWeight:700, letterSpacing:"0.18em", textTransform:"uppercase", color:"#94A3B8", marginBottom:12 }}>Progress</p>
              <div style={{ display:"flex", alignItems:"center" }}>
                {[{n:1,t:"Sign In",done:true},{n:2,t:"Purpose",act:true},{n:3,t:"Welcome"}].map((s,i)=>(
                  <div key={s.n} style={{ display:"flex", alignItems:"center", flex:1 }}>
                    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
                      <div style={{ width:26, height:26, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:800,
                        background: s.done?"#1E3A8A":"transparent",
                        border: s.done?"2px solid #1E3A8A": "act" in s&&s.act?"2px solid #1E3A8A":"2px solid #CBD5E1",
                        color: s.done?"#fff": "act" in s&&s.act?"#1E3A8A":"#CBD5E1" }}>
                        {s.done?"✓":s.n}
                      </div>
                      <p style={{ fontSize:10, fontWeight:700, color: s.done?"#1E3A8A": "act" in s&&s.act?"#1E3A8A":"#CBD5E1", whiteSpace:"nowrap" }}>{s.t}</p>
                    </div>
                    {i<2&&<div style={{ flex:1, height:1.5, background: s.done?"#1E3A8A":"#E2E8F0", margin:"0 4px", marginBottom:16 }} />}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* REASON CARD */}
          <div style={{ flex:1, minWidth:0, background:"#fff", border:"1px solid #E2E8F0", borderRadius:18, padding:"20px 22px", boxShadow:"0 6px 28px rgba(15,40,80,.08)", display:"flex", flexDirection:"column" }}>

            <div style={{ marginBottom:14, flexShrink:0 }}>
              <h3 style={{ fontSize:24, fontWeight:900, color:"#0F172A", fontFamily:"'Playfair Display',serif", letterSpacing:"-0.01em", marginBottom:3 }}>Purpose of Visit</h3>
              <p style={{ fontSize:13, color:"#64748B" }}>Why are you visiting the library today?</p>
            </div>

            {/* reasons list */}
            <div style={{ display:"flex", flexDirection:"column", gap:7, flex:1, justifyContent:"center" }}>
              {REASONS.map(r=>{
                const active=selected===r.label;
                return (
                  <button key={r.label} onClick={()=>setSelected(r.label)} className="rbtn" style={{
                    display:"flex", alignItems:"center", gap:13,
                    padding:"11px 15px",
                    background: active?r.light:"#FAFBFF",
                    border:`1.5px solid ${active?r.border:"#E2E8F0"}`,
                    borderRadius:13, cursor:"pointer", textAlign:"left", width:"100%",
                    fontFamily:"'DM Sans',sans-serif",
                    boxShadow: active?`0 3px 14px ${r.color}15`:"none",
                    transform: active?"translateX(4px)":"translateX(0)",
                  }}>
                    <div style={{ width:40, height:40, borderRadius:11, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:19,
                      background: active?"#fff":"#EEF2FF",
                      border: active?`1.5px solid ${r.border}`:"1.5px solid transparent",
                      transition:"all .18s" }}>
                      {r.icon}
                    </div>
                    <div style={{ flex:1 }}>
                      <p style={{ fontSize:14, fontWeight:700, color:active?r.color:"#0F172A" }}>{r.label}</p>
                      <p style={{ fontSize:11, color:"#94A3B8", marginTop:1 }}>{r.desc}</p>
                    </div>
                    <div style={{ width:20, height:20, borderRadius:"50%", flexShrink:0,
                      border:`2px solid ${active?r.color:"#CBD5E1"}`,
                      background: active?r.color:"transparent",
                      display:"flex", alignItems:"center", justifyContent:"center",
                      transition:"all .18s", fontSize:11, color:"#fff", fontWeight:900 }}>
                      {active&&"✓"}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* submit */}
            <div style={{ marginTop:12, flexShrink:0 }}>
              <button onClick={handleSubmit} disabled={!selected||loading} className="btn-primary"
                style={{
                  background: sel?`linear-gradient(135deg,${sel.color}dd,${sel.color})`:undefined,
                  boxShadow: sel?`0 8px 22px ${sel.color}30`:undefined,
                  animation: sel?"none":undefined,
                  opacity: !selected||loading?.45:1,
                  cursor: !selected||loading?"not-allowed":"pointer",
                  padding:"13px",
                }}>
                {loading?"Recording…":selected?`Continue with "${selected}" →`:"Select a reason to continue"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`@media(min-width:1024px){.reason-left{display:flex!important}}`}</style>
    </div>
  );
}