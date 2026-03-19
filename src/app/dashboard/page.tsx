"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";
import Image from "next/image";

interface Visit {
  visit_id: string; reason: string;
  visit_date: string; visit_time: string;
}
interface Stats { total:number; thisWeek:number; thisMonth:number; streak:number; }

const R_MAP:Record<string,{icon:string;color:string;bg:string}> = {
  "Studying":        { icon:"📚", color:"#93C5FD", bg:"rgba(147,197,253,.12)" },
  "Borrowing Books": { icon:"📖", color:"#6EE7B7", bg:"rgba(110,231,183,.12)" },
  "Research":        { icon:"🔬", color:"#C4B5FD", bg:"rgba(196,181,253,.12)" },
  "Group Work":      { icon:"👥", color:"#FCD34D", bg:"rgba(252,211,77,.12)"  },
  "Printing":        { icon:"🖨️", color:"#F9A8D4", bg:"rgba(249,168,212,.12)" },
};

export default function StudentDashboard() {
  const router = useRouter();
  const [student,  setStudent]  = useState<{name:string;student_id:string;college:string;employee_status:string}|null>(null);
  const [visits,   setVisits]   = useState<Visit[]>([]);
  const [stats,    setStats]    = useState<Stats>({ total:0, thisWeek:0, thisMonth:0, streak:0 });
  const [loading,  setLoading]  = useState(true);
  const [clock,    setClock]    = useState("");
  const [activeTab,setActiveTab]= useState<"overview"|"history">("overview");

  useEffect(() => {
    const s = sessionStorage.getItem("student");
    if (!s) { router.push("/auth/login"); return; }
    const st = JSON.parse(s);
    setStudent(st);
    fetchData(st.student_id);
    const tick = () => setClock(new Date().toLocaleTimeString("en-PH",{hour:"2-digit",minute:"2-digit",hour12:true}));
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id);
  }, [router]);

  const fetchData = async (id: string) => {
    const { data: allVisits } = await supabase.from("library_visits").select("*").eq("student_id", id).order("visit_date",{ascending:false}).order("visit_time",{ascending:false});
    if (allVisits) setVisits(allVisits);

    const now = new Date();
    const wa = new Date(now); wa.setDate(now.getDate()-7);
    const ms = new Date(now.getFullYear(),now.getMonth(),1).toISOString().split("T")[0];

    const { count:total }    = await supabase.from("library_visits").select("*",{count:"exact",head:true}).eq("student_id",id);
    const { count:thisWeek } = await supabase.from("library_visits").select("*",{count:"exact",head:true}).eq("student_id",id).gte("visit_date",wa.toISOString().split("T")[0]);
    const { count:thisMonth} = await supabase.from("library_visits").select("*",{count:"exact",head:true}).eq("student_id",id).gte("visit_date",ms);

    setStats({ total:total||0, thisWeek:thisWeek||0, thisMonth:thisMonth||0, streak:0 });
    setLoading(false);
  };

  const signOut = () => {
    document.cookie = "user_email=; path=/; max-age=0";
    document.cookie = "active_role=; path=/; max-age=0";
    sessionStorage.clear();
    router.push("/auth/login");
  };

  const firstName = student?.name.split(" ")[0] ?? "";
  const dateStr = new Date().toLocaleDateString("en-PH",{weekday:"long",month:"long",day:"numeric",year:"numeric"});

  // Reason distribution
  const reasonCounts: Record<string,number> = {};
  visits.forEach(v => { if(v.reason) reasonCounts[v.reason]=(reasonCounts[v.reason]||0)+1; });
  const topReason = Object.entries(reasonCounts).sort((a,b)=>b[1]-a[1])[0];

  return (
    <div
      style={{ minHeight:"100vh", fontFamily:"'DM Sans',sans-serif", position:"relative" }}
      className="kiosk-bg dashboard-root">

      <div style={{ position:"fixed", inset:0, backgroundImage:"radial-gradient(circle at 2px 2px,rgba(255,255,255,.02) 1px,transparent 0)", backgroundSize:"30px 30px", pointerEvents:"none", zIndex:0 }} />
      <div style={{ position:"fixed", top:0, left:0, right:0, height:2, background:"linear-gradient(90deg,transparent,rgba(212,175,55,.7),transparent)", pointerEvents:"none", zIndex:1 }} />

      {/* NAVBAR */}
      <nav
        className="dashboard-nav"
        style={{ background:"rgba(6,13,26,.85)", backdropFilter:"blur(20px)", borderBottom:"1px solid rgba(212,175,55,.12)", padding:"0 32px", height:64, display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:100 }}>
        <div style={{ display:"flex", alignItems:"center", gap:14 }}>
          <div style={{ width:38, height:38, borderRadius:10, background:"rgba(255,255,255,.07)", border:"1px solid rgba(212,175,55,.2)", padding:5 }}>
            <Image src="/neu-library-logo.png" alt="NEU" width={38} height={38} style={{ width:"100%", height:"100%", objectFit:"contain" }} />
          </div>
          <div>
            <p style={{ fontSize:15, fontWeight:800, color:"#fff", lineHeight:1.2 }}>NEU Library</p>
            <p style={{ fontSize:11, color:"rgba(255,255,255,.35)", fontWeight:600, letterSpacing:".1em" }}>STUDENT PORTAL</p>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <p style={{ fontSize:14, fontWeight:700, background:"linear-gradient(90deg,#DAA520,#FFD700)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>{clock}</p>
          <div style={{ display:"flex", alignItems:"center", gap:8, background:"rgba(255,255,255,.07)", border:"1px solid rgba(255,255,255,.1)", padding:"6px 14px", borderRadius:100 }}>
            <div style={{ width:28, height:28, borderRadius:"50%", background:"linear-gradient(135deg,#0f2040,#1E3A8A)", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:800, fontSize:12 }}>{firstName.charAt(0)}</div>
            <span style={{ fontSize:13, fontWeight:700, color:"rgba(255,255,255,.75)" }}>{student?.name}</span>
            <span className="role-badge-user">User</span>
          </div>
          <button onClick={signOut} style={{ background:"rgba(220,38,38,.12)", border:"1px solid rgba(220,38,38,.3)", color:"#fca5a5", fontSize:13, fontWeight:700, fontFamily:"'DM Sans',sans-serif", padding:"8px 16px", borderRadius:10, cursor:"pointer" }}>
            Sign Out
          </button>
        </div>
      </nav>

      <div style={{ maxWidth:1100, margin:"0 auto", padding:"32px 24px", position:"relative", zIndex:2 }}>

        {/* HERO */}
        <div className="au card-navy dashboard-hero" style={{ padding:"28px 32px", marginBottom:24, position:"relative", overflow:"auto", boxShadow:"0 16px 50px rgba(15,32,64,.4)" }}>
          <div style={{ position:"absolute", top:-40, right:-40, width:160, height:160, borderRadius:"50%", background:"rgba(255,255,255,.03)" }} />
          <div style={{ position:"absolute", bottom:-30, left:"40%", width:120, height:120, borderRadius:"50%", background:"radial-gradient(circle,rgba(212,175,55,.06),transparent 70%)" }} />
          <div style={{ position:"relative", zIndex:2, display:"flex", alignItems:"flex-start", justifyContent:"space-between" }}>
            <div>
              <p style={{ fontSize:13, fontWeight:700, letterSpacing:".2em", textTransform:"uppercase", color:"rgba(255,255,255,.38)", marginBottom:8 }}>Welcome back</p>
              <h1 style={{ fontSize:40, fontWeight:900, color:"#fff", fontFamily:"'Playfair Display',serif", lineHeight:1.1, marginBottom:8 }}>{student?.name}</h1>
              <p style={{ fontSize:15, color:"rgba(255,255,255,.45)" }}>{student?.college}</p>
              <p style={{ fontSize:13, color:"rgba(255,255,255,.28)", marginTop:3 }}>{student?.student_id} · {student?.employee_status}</p>
            </div>
            <div style={{ textAlign:"right" }}>
              <p style={{ fontSize:13, color:"rgba(255,255,255,.35)" }}>{dateStr}</p>
              <p className="gold-text" style={{ fontSize:24, fontWeight:700, fontFamily:"'Playfair Display',serif", marginTop:4 }}>{clock}</p>
            </div>
          </div>
        </div>

        {/* TABS */}
        <div style={{ display:"flex", gap:6, marginBottom:24 }} className="au1 dashboard-tabs">
          {[["overview","📊 Overview"],["history","📋 Visit History"]].map(([val,label])=>(
            <button key={val} onClick={()=>setActiveTab(val as "overview"|"history")} style={{
              padding:"11px 22px", borderRadius:12, border:"1px solid", fontSize:14, fontWeight:700,
              fontFamily:"'DM Sans',sans-serif", cursor:"pointer", transition:"all .18s",
              background: activeTab===val ? "rgba(255,255,255,.15)" : "rgba(255,255,255,.05)",
              color:      activeTab===val ? "#fff" : "rgba(255,255,255,.5)",
              borderColor: activeTab===val ? "rgba(255,255,255,.3)" : "rgba(255,255,255,.08)",
              backdropFilter:"blur(10px)",
            }}>{label}</button>
          ))}
          <div style={{ marginLeft:"auto", display:"flex", gap:8 }}>
            <button onClick={()=>router.push("/kiosk")} style={{ padding:"11px 18px", background:"rgba(212,175,55,.1)", border:"1px solid rgba(212,175,55,.25)", borderRadius:12, color:"#DAA520", fontSize:13, fontWeight:700, fontFamily:"'DM Sans',sans-serif", cursor:"pointer" }}>
              📷 Quick Check-in
            </button>
          </div>
        </div>

        {/* OVERVIEW */}
        {activeTab === "overview" && (
          <div>
            {/* stats */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))", gap:16, marginBottom:24 }} className="au2 dashboard-stats">
              {[
                { emoji:"🏆", val:stats.total,    label:"Total Visits",  sub:"All time",   color:"#93C5FD", bg:"rgba(147,197,253,.08)", border:"rgba(147,197,253,.2)"  },
                { emoji:"📅", val:stats.thisWeek,  label:"This Week",    sub:"Last 7 days", color:"#FCD34D", bg:"rgba(252,211,77,.08)",  border:"rgba(252,211,77,.2)"   },
                { emoji:"📊", val:stats.thisMonth, label:"This Month",   sub:new Date().toLocaleString("default",{month:"short"}), color:"#6EE7B7", bg:"rgba(110,231,183,.08)", border:"rgba(110,231,183,.2)" },
                { emoji:"⭐", val:topReason?topReason[1]:0, label:"Top Activity", sub:topReason?topReason[0]:"—", color:"#F9A8D4", bg:"rgba(249,168,212,.08)", border:"rgba(249,168,212,.2)" },
              ].map(s=>(
                <div key={s.label} className="stat-card" style={{ background:s.bg, border:`1px solid ${s.border}`, borderRadius:20, padding:"22px 20px", backdropFilter:"blur(10px)" }}>
                  <p style={{ fontSize:28, marginBottom:12 }}>{s.emoji}</p>
                  <p style={{ fontSize:44, fontWeight:900, color:s.color, lineHeight:1, fontFamily:"'Playfair Display',serif" }}>{s.val}</p>
                  <p style={{ fontSize:14, fontWeight:700, color:"rgba(255,255,255,.7)", marginTop:8 }}>{s.label}</p>
                  <p style={{ fontSize:12, color:"rgba(255,255,255,.35)", marginTop:3 }}>{s.sub}</p>
                </div>
              ))}
            </div>

            {/* recent visits */}
            <div className="au3" style={{ background:"rgba(255,255,255,.06)", border:"1px solid rgba(255,255,255,.1)", borderRadius:20, overflow:"auto", backdropFilter:"blur(10px)" }}>
              <div style={{ padding:"18px 24px", borderBottom:"1px solid rgba(255,255,255,.08)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <h3 style={{ fontSize:18, fontWeight:800, color:"#fff" }}>Recent Visits</h3>
                <button onClick={()=>setActiveTab("history")} style={{ fontSize:13, color:"rgba(255,255,255,.45)", background:"none", border:"none", cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>View all →</button>
              </div>
              {loading ? (
                <div style={{ textAlign:"center", padding:"40px", color:"rgba(255,255,255,.4)" }}>Loading…</div>
              ) : (
                <div>
                  {visits.slice(0,5).map(v => {
                    const rd = v.reason && R_MAP[v.reason] ? R_MAP[v.reason] : { icon:"📌", color:"#94A3B8", bg:"rgba(148,163,184,.1)" };
                    return (
                      <div key={v.visit_id} style={{ display:"flex", alignItems:"center", gap:16, padding:"14px 24px", borderBottom:"1px solid rgba(255,255,255,.05)" }}>
                        <div style={{ width:42, height:42, borderRadius:12, background:rd.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>{rd.icon}</div>
                        <div style={{ flex:1 }}>
                          <p style={{ fontSize:15, fontWeight:700, color:"#fff" }}>{v.reason || "Visit recorded"}</p>
                          <p style={{ fontSize:12, color:"rgba(255,255,255,.4)", marginTop:2 }}>{v.visit_date} · {v.visit_time?.slice(0,5)}</p>
                        </div>
                        <span style={{ background:rd.bg, color:rd.color, padding:"4px 12px", borderRadius:100, fontSize:12, fontWeight:700 }}>✓</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* HISTORY */}
        {activeTab === "history" && (
          <div className="au2" style={{ background:"rgba(255,255,255,.06)", border:"1px solid rgba(255,255,255,.1)", borderRadius:20, overflow:"auto", backdropFilter:"blur(10px)" }}>
            <div style={{ padding:"18px 24px", borderBottom:"1px solid rgba(255,255,255,.08)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <h3 style={{ fontSize:18, fontWeight:800, color:"#fff" }}>Complete Visit History</h3>
              <span style={{ background:"rgba(255,255,255,.08)", color:"rgba(255,255,255,.6)", fontSize:12, fontWeight:700, padding:"4px 12px", borderRadius:100 }}>{visits.length} visits</span>
            </div>
            {loading ? (
              <div style={{ textAlign:"center", padding:"40px", color:"rgba(255,255,255,.4)" }}>Loading…</div>
            ) : visits.length === 0 ? (
              <div style={{ textAlign:"center", padding:"60px 20px" }}>
                <p style={{ fontSize:36, marginBottom:10 }}>📚</p>
                <p style={{ fontSize:18, fontWeight:700, color:"rgba(255,255,255,.5)", fontFamily:"'Playfair Display',serif" }}>No visits yet</p>
                <p style={{ fontSize:14, color:"rgba(255,255,255,.3)", marginTop:5 }}>Your visit history will appear here</p>
              </div>
            ) : (
              <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:14 }}>
                  <thead>
                    <tr style={{ background:"rgba(255,255,255,.04)" }}>
                      {["#","Purpose","Date","Time"].map(h=>(
                        <th key={h} style={{ padding:"12px 20px", textAlign:"left", fontSize:11, fontWeight:800, textTransform:"uppercase" as const, letterSpacing:".12em", color:"rgba(255,255,255,.3)", borderBottom:"1px solid rgba(255,255,255,.07)" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {visits.map((v,i) => {
                      const rd = v.reason && R_MAP[v.reason] ? R_MAP[v.reason] : { icon:"📌", color:"#94A3B8", bg:"rgba(148,163,184,.1)" };
                      return (
                        <tr key={v.visit_id} className="trow" style={{ borderBottom:"1px solid rgba(255,255,255,.04)" }}>
                          <td style={{ padding:"12px 20px", color:"rgba(255,255,255,.3)", fontSize:13 }}>{visits.length - i}</td>
                          <td style={{ padding:"12px 20px" }}>
                            {v.reason ? (
                              <span style={{ background:rd.bg, color:rd.color, padding:"5px 12px", borderRadius:100, fontSize:13, fontWeight:700, display:"inline-flex", alignItems:"center", gap:6 }}>
                                {rd.icon} {v.reason}
                              </span>
                            ) : <span style={{ color:"rgba(255,255,255,.25)", fontStyle:"italic" }}>Not set</span>}
                          </td>
                          <td style={{ padding:"12px 20px", color:"rgba(255,255,255,.55)", fontWeight:600 }}>{v.visit_date}</td>
                          <td style={{ padding:"12px 20px" }}>
                            <span style={{ background:"rgba(74,222,128,.1)", color:"#4ade80", padding:"4px 10px", borderRadius:100, fontSize:12, fontWeight:700 }}>
                              ➤ {v.visit_time?.slice(0,5)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}