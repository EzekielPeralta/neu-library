"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";
import Image from "next/image";

interface Stats { total:number; thisWeek:number; thisMonth:number; }

const R_MAP:Record<string,{icon:string;color:string}> = {
  "Studying":        { icon:"📚", color:"#93C5FD" },
  "Borrowing Books": { icon:"📖", color:"#6EE7B7" },
  "Research":        { icon:"🔬", color:"#C4B5FD" },
  "Group Work":      { icon:"👥", color:"#FCD34D" },
  "Printing":        { icon:"🖨️", color:"#F9A8D4" },
};

export default function WelcomePage() {
  const router  = useRouter();
  const [student, setStudent] = useState<{name:string;student_id:string;college:string}|null>(null);
  const [stats,   setStats]   = useState<Stats>({total:0,thisWeek:0,thisMonth:0});
  const [loading, setLoading] = useState(true);
  const [reason,  setReason]  = useState("");
  const [clock,   setClock]   = useState("");

  useEffect(()=>{
    const s=sessionStorage.getItem("student");
    if(!s){router.push("/login");return;}
    const st=JSON.parse(s);setStudent(st);fetchStats(st.student_id);
    const tick=()=>setClock(new Date().toLocaleTimeString("en-PH",{hour:"2-digit",minute:"2-digit",hour12:true}));
    tick();const id=setInterval(tick,1000);return()=>clearInterval(id);
  },[router]);

  const fetchStats=async(id:string)=>{
    const now=new Date();
    const {count:total}=await supabase.from("library_visits").select("*",{count:"exact",head:true}).eq("student_id",id);
    const wa=new Date(now);wa.setDate(now.getDate()-7);
    const {count:thisWeek}=await supabase.from("library_visits").select("*",{count:"exact",head:true}).eq("student_id",id).gte("visit_date",wa.toISOString().split("T")[0]);
    const ms=new Date(now.getFullYear(),now.getMonth(),1).toISOString().split("T")[0];
    const {count:thisMonth}=await supabase.from("library_visits").select("*",{count:"exact",head:true}).eq("student_id",id).gte("visit_date",ms);
    const {data:latest}=await supabase.from("library_visits").select("reason").eq("student_id",id).order("visit_date",{ascending:false}).order("visit_time",{ascending:false}).limit(1).single();
    if(latest?.reason)setReason(latest.reason);
    setStats({total:total||0,thisWeek:thisWeek||0,thisMonth:thisMonth||0});
    setLoading(false);
  };

  const cr=reason?R_MAP[reason]:null;
  const dateStr=new Date().toLocaleDateString("en-PH",{weekday:"long",month:"long",day:"numeric",year:"numeric"});

  return (
    <div style={{
      height:"100vh", overflow:"hidden",
      fontFamily:"'DM Sans',sans-serif",
      background:"linear-gradient(135deg,#060d1a 0%,#0f2040 30%,#162d55 60%,#0a1628 100%)",
      display:"flex", flexDirection:"column", position:"relative",
    }}>

      {/* background decorations */}
      <div style={{ position:"fixed", top:"-10%", right:"-5%", width:400, height:400, borderRadius:"50%", background:"radial-gradient(circle,rgba(30,64,175,.25),transparent 68%)", filter:"blur(50px)", pointerEvents:"none" }} />
      <div style={{ position:"fixed", bottom:"-10%", left:"-5%", width:350, height:350, borderRadius:"50%", background:"radial-gradient(circle,rgba(212,175,55,.1),transparent 68%)", filter:"blur(50px)", pointerEvents:"none" }} />
      <div style={{ position:"fixed", top:"40%", left:"30%", width:300, height:300, borderRadius:"50%", background:"radial-gradient(circle,rgba(30,64,175,.1),transparent 68%)", filter:"blur(60px)", pointerEvents:"none" }} />
      {/* dot pattern */}
      <div style={{ position:"fixed", inset:0, backgroundImage:"radial-gradient(circle at 2px 2px,rgba(255,255,255,.035) 1px,transparent 0)", backgroundSize:"28px 28px", pointerEvents:"none" }} />
      {/* gold lines */}
      <div style={{ position:"fixed", top:0, left:0, right:0, height:"2px", background:"linear-gradient(90deg,transparent,rgba(212,175,55,.6),transparent)", pointerEvents:"none" }} />
      <div style={{ position:"fixed", bottom:0, left:0, right:0, height:"1px", background:"linear-gradient(90deg,transparent,rgba(212,175,55,.3),transparent)", pointerEvents:"none" }} />

      {/* HEADER */}
      <header style={{ flexShrink:0, padding:"0 28px", height:54, display:"flex", alignItems:"center", justifyContent:"space-between", borderBottom:"1px solid rgba(212,175,55,.15)", position:"relative", zIndex:10 }}>
        <div style={{ display:"flex", alignItems:"center", gap:11 }}>
          <div style={{ width:34, height:34, borderRadius:9, background:"rgba(255,255,255,.08)", border:"1px solid rgba(212,175,55,.25)", padding:5 }}>
            <Image src="/neu-library-logo.png" alt="NEU" width={34} height={34} style={{ width:"100%", height:"100%", objectFit:"contain", borderRadius:7 }} />
          </div>
          <div>
            <p style={{ fontSize:14, fontWeight:700, color:"#fff", fontFamily:"'Playfair Display',serif", lineHeight:1.2 }}>NEU Library</p>
            <p style={{ fontSize:10, color:"rgba(255,255,255,.38)" }}>Visitor Log System</p>
          </div>
        </div>
        <div style={{ textAlign:"right" }}>
          <p style={{ fontSize:11, color:"rgba(255,255,255,.35)" }}>{dateStr}</p>
          <p style={{ fontSize:15, fontWeight:700, fontFamily:"'Playfair Display',serif", background:"linear-gradient(90deg,#DAA520,#FFD700,#DAA520)", backgroundSize:"200% auto", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>{clock}</p>
        </div>
      </header>

      {/* BODY */}
      <div style={{ flex:1, overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center", padding:"14px 20px", position:"relative", zIndex:10 }}>
        <div style={{ width:"100%", maxWidth:1060, height:"100%", maxHeight:580, display:"flex", gap:18, alignItems:"stretch" }}>

          {/* LEFT — identity card */}
          <div style={{ flex:"0 0 270px", display:"flex", flexDirection:"column", gap:12 }} className="welcome-left">

            {/* hero */}
            <div style={{ flex:1, background:"rgba(255,255,255,.06)", border:"1px solid rgba(212,175,55,.2)", borderRadius:18, padding:"18px 16px", display:"flex", flexDirection:"column", justifyContent:"space-between", position:"relative", overflow:"hidden", backdropFilter:"blur(12px)" }}>
              <div style={{ position:"absolute", top:-30, right:-30, width:120, height:120, borderRadius:"50%", background:"rgba(212,175,55,.06)" }} />
              <div style={{ position:"absolute", bottom:-20, left:-20, width:90, height:90, borderRadius:"50%", background:"rgba(30,64,175,.1)" }} />

              <div style={{ position:"relative", zIndex:2 }}>
                {/* checked in badge */}
                <div style={{ display:"inline-flex", alignItems:"center", gap:7, background:"rgba(74,222,128,.12)", border:"1px solid rgba(74,222,128,.3)", padding:"4px 11px", borderRadius:100, marginBottom:14 }}>
                  <span className="pdot" style={{ width:6, height:6, borderRadius:"50%", background:"#4ade80", display:"inline-block" }} />
                  <span style={{ fontSize:10, fontWeight:700, color:"#4ade80", letterSpacing:"0.1em" }}>VISIT RECORDED ✓</span>
                </div>

                <p style={{ fontSize:10, fontWeight:700, letterSpacing:"0.22em", textTransform:"uppercase", color:"rgba(255,255,255,.3)", marginBottom:5 }}>Welcome to NEU Library!</p>
                <h2 style={{ fontSize:24, fontWeight:900, color:"#fff", fontFamily:"'Playfair Display',serif", lineHeight:1.15, marginBottom:4 }}>{student?.name}</h2>
                <p style={{ fontSize:11, color:"rgba(255,255,255,.42)" }}>{student?.college}</p>
                <p style={{ fontSize:10, color:"rgba(255,255,255,.25)", marginTop:1 }}>{student?.student_id}</p>

                {/* reason */}
                {reason&&cr&&(
                  <div style={{ background:"rgba(255,255,255,.07)", border:`1px solid ${cr.color}35`, borderRadius:11, padding:"9px 12px", display:"flex", alignItems:"center", gap:9, marginTop:12 }}>
                    <span style={{ fontSize:18 }}>{cr.icon}</span>
                    <div>
                      <p style={{ fontSize:9, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:"rgba(255,255,255,.32)" }}>Purpose</p>
                      <p style={{ fontSize:13, fontWeight:700, color:cr.color }}>{reason}</p>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ position:"relative", zIndex:2 }}>
                <div style={{ height:1, background:"linear-gradient(90deg,rgba(212,175,55,.35),transparent)", marginBottom:10 }} />
                <p style={{ fontSize:19, fontWeight:700, fontFamily:"'Playfair Display',serif", background:"linear-gradient(90deg,#DAA520,#FFD700,#DAA520)", backgroundSize:"200% auto", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>{clock}</p>
                <p style={{ fontSize:10, color:"rgba(255,255,255,.2)", marginTop:2 }}>{dateStr}</p>
              </div>
            </div>

            {/* proceed box */}
            <div style={{ background:"rgba(255,255,255,.06)", border:"1px solid rgba(212,175,55,.15)", borderRadius:14, padding:"13px 15px", textAlign:"center", backdropFilter:"blur(10px)" }}>
              <p style={{ fontSize:18, marginBottom:4 }}>🎓</p>
              <p style={{ fontSize:13, fontWeight:700, color:"#fff", fontFamily:"'Playfair Display',serif", marginBottom:2 }}>You may now enter.</p>
              <p style={{ fontSize:11, color:"rgba(255,255,255,.38)" }}>Have a productive visit!</p>
            </div>
          </div>

          {/* RIGHT — stats + signout */}
          <div style={{ flex:1, minWidth:0, display:"flex", flexDirection:"column", gap:12 }}>

            {/* mobile hero */}
            <div className="welcome-mobile" style={{ background:"rgba(255,255,255,.06)", border:"1px solid rgba(212,175,55,.2)", borderRadius:16, padding:"16px", display:"none", backdropFilter:"blur(12px)" }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
                <div>
                  <h2 style={{ fontSize:20, fontWeight:900, color:"#fff", fontFamily:"'Playfair Display',serif" }}>{student?.name}</h2>
                  <p style={{ fontSize:11, color:"rgba(255,255,255,.38)" }}>{student?.student_id}</p>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <span className="pdot" style={{ width:7, height:7, borderRadius:"50%", background:"#4ade80", display:"inline-block" }} />
                  <span style={{ fontSize:11, fontWeight:700, color:"#4ade80" }}>Checked In</span>
                </div>
              </div>
              {reason&&cr&&(
                <div style={{ background:"rgba(255,255,255,.07)", borderRadius:9, padding:"7px 11px", display:"flex", alignItems:"center", gap:8 }}>
                  <span>{cr.icon}</span><span style={{ fontSize:13, fontWeight:700, color:cr.color }}>{reason}</span>
                </div>
              )}
            </div>

            {/* stats card */}
            <div style={{ background:"rgba(255,255,255,.06)", border:"1px solid rgba(255,255,255,.1)", borderRadius:18, padding:"18px 20px", flex:1, display:"flex", flexDirection:"column", backdropFilter:"blur(12px)" }}>
              <div style={{ marginBottom:12, flexShrink:0 }}>
                <h3 style={{ fontSize:19, fontWeight:900, color:"#fff", fontFamily:"'Playfair Display',serif", marginBottom:2 }}>Visit Statistics</h3>
                <p style={{ fontSize:12, color:"rgba(255,255,255,.38)" }}>Your personal library attendance record</p>
              </div>

              {loading?(
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, flex:1 }}>
                  {[1,2,3].map(i=>(
                    <div key={i} style={{ borderRadius:14, background:"rgba(255,255,255,.05)" }} />
                  ))}
                </div>
              ):(
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, flex:1 }}>
                  {[
                    { emoji:"🏆", val:stats.total,    label:"Total Visits", sub:"All time",   color:"#93C5FD", border:"rgba(147,197,253,.3)", bg:"rgba(147,197,253,.08)" },
                    { emoji:"📅", val:stats.thisWeek,  label:"This Week",   sub:"Last 7 days", color:"#FCD34D", border:"rgba(252,211,77,.3)",  bg:"rgba(252,211,77,.08)"  },
                    { emoji:"📊", val:stats.thisMonth, label:"Month",       sub:new Date().toLocaleString("default",{month:"short",year:"numeric"}), color:"#6EE7B7", border:"rgba(110,231,183,.3)", bg:"rgba(110,231,183,.08)" },
                  ].map(s=>(
                    <div key={s.label} className="scard" style={{ background:s.bg, border:`1px solid ${s.border}`, borderRadius:14, padding:"14px 10px", textAlign:"center", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", backdropFilter:"blur(8px)" }}>
                      <p style={{ fontSize:20, marginBottom:6 }}>{s.emoji}</p>
                      <p style={{ fontSize:36, fontWeight:900, color:s.color, lineHeight:1, fontFamily:"'Playfair Display',serif" }}>{s.val}</p>
                      <p style={{ fontSize:12, fontWeight:700, color:"rgba(255,255,255,.7)", marginTop:6 }}>{s.label}</p>
                      <p style={{ fontSize:10, color:"rgba(255,255,255,.35)", marginTop:2 }}>{s.sub}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* sign out */}
            <div style={{ background:"rgba(255,255,255,.06)", border:"1px solid rgba(255,255,255,.1)", borderRadius:14, padding:"13px 18px", display:"flex", alignItems:"center", justifyContent:"space-between", backdropFilter:"blur(10px)", flexShrink:0 }}>
              <p style={{ fontSize:13, color:"rgba(255,255,255,.55)" }}>
                🎓 Proceed inside the library and have a productive visit!
              </p>
              <button
                onClick={()=>{sessionStorage.clear();router.push("/login");}}
                style={{ padding:"10px 20px", background:"transparent", border:"1.5px solid rgba(212,175,55,.5)", borderRadius:11, color:"#DAA520", fontSize:13, fontWeight:700, fontFamily:"'DM Sans',sans-serif", cursor:"pointer", transition:"all .2s", whiteSpace:"nowrap", marginLeft:14 }}
                onMouseEnter={e=>{(e.target as HTMLButtonElement).style.background="rgba(212,175,55,.12)";(e.target as HTMLButtonElement).style.borderColor="#DAA520";}}
                onMouseLeave={e=>{(e.target as HTMLButtonElement).style.background="transparent";(e.target as HTMLButtonElement).style.borderColor="rgba(212,175,55,.5)";}}
              >
                Sign Out →
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media(min-width:1024px){ .welcome-left{display:flex!important} .welcome-mobile{display:none!important} }
        @media(max-width:1023px){ .welcome-left{display:none!important} .welcome-mobile{display:block!important} }
        .scard { transition: transform .2s; }
        .scard:hover { transform: translateY(-3px); }
      `}</style>
    </div>
  );
}