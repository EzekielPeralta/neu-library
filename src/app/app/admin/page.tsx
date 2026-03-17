"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";
import Image from "next/image";

interface Visit {
  visit_id:string; student_id:string; reason:string;
  visit_date:string; visit_time:string;
  students:{ name:string; college:string; employee_status:string; };
}

const R_MAP:Record<string,{icon:string;color:string;bg:string}> = {
  "Studying":        { icon:"📚", color:"#2563EB", bg:"rgba(37,99,235,.15)"  },
  "Borrowing Books": { icon:"📖", color:"#059669", bg:"rgba(5,150,105,.15)"  },
  "Research":        { icon:"🔬", color:"#7c3aed", bg:"rgba(124,58,237,.15)" },
  "Group Work":      { icon:"👥", color:"#d97706", bg:"rgba(217,119,6,.15)"  },
  "Printing":        { icon:"🖨️", color:"#db2777", bg:"rgba(219,39,119,.15)" },
};

export default function AdminPage() {
  const router = useRouter();
  const [visits,   setVisits]   = useState<Visit[]>([]);
  const [filtered, setFiltered] = useState<Visit[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [pass,     setPass]     = useState("");
  const [authed,   setAuthed]   = useState(false);
  const [authErr,  setAuthErr]  = useState("");
  const [showP,    setShowP]    = useState(false);
  const [fReason,  setFReason]  = useState("");
  const [fCollege, setFCollege] = useState("");
  const [fStatus,  setFStatus]  = useState("");
  const [fFrom,    setFFrom]    = useState("");
  const [fTo,      setFTo]      = useState("");

  const today      = new Date().toISOString().split("T")[0];
  const weekAgo    = new Date(Date.now()-7*86400000).toISOString().split("T")[0];
  const monthStart = new Date(new Date().getFullYear(),new Date().getMonth(),1).toISOString().split("T")[0];
  const cntToday   = visits.filter(v=>v.visit_date===today).length;
  const cntWeek    = visits.filter(v=>v.visit_date>=weekAgo).length;
  const cntMonth   = visits.filter(v=>v.visit_date>=monthStart).length;

  const login = (e:React.FormEvent)=>{
    e.preventDefault();
    if(pass==="admin123"){ setAuthed(true); fetchVisits(); }
    else setAuthErr("Incorrect password. Please try again.");
  };

  const fetchVisits = async ()=>{
    const {data,error} = await supabase.from("library_visits")
      .select("*, students(name,college,employee_status)")
      .order("visit_date",{ascending:false}).order("visit_time",{ascending:false});
    if(!error&&data){ setVisits(data as Visit[]); setFiltered(data as Visit[]); }
    setLoading(false);
  };

  useEffect(()=>{
    let r=[...visits];
    if(fReason)  r=r.filter(v=>v.reason===fReason);
    if(fCollege) r=r.filter(v=>v.students?.college===fCollege);
    if(fStatus)  r=r.filter(v=>v.students?.employee_status===fStatus);
    if(fFrom)    r=r.filter(v=>v.visit_date>=fFrom);
    if(fTo)      r=r.filter(v=>v.visit_date<=fTo);
    setFiltered(r);
  },[fReason,fCollege,fStatus,fFrom,fTo,visits]);

  const colleges=[...new Set(visits.map(v=>v.students?.college).filter(Boolean))];
  const clearFilters=()=>{ setFReason(""); setFCollege(""); setFStatus(""); setFFrom(""); setFTo(""); };

  /* ── LOGIN SCREEN ── */
  if(!authed) return (
    <div style={{ minHeight:"100vh", display:"flex", fontFamily:"'DM Sans',sans-serif" }}>

      {/* left */}
      <div style={{ display:"none", width:"52%", background:"linear-gradient(145deg,#0a0000,#1c0000,#3b0000,#1c0000)", position:"relative", overflow:"hidden", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"60px 56px" }}
        className="desktop-left">
        {[500,360].map((s,i)=>(
          <div key={i} style={{ position:"absolute", borderRadius:"50%", border:"1px solid rgba(255,255,255,.045)", width:s, height:s, top:-s*.35, right:-s*.3 }} />
        ))}
        <div style={{ position:"absolute", bottom:-300, left:-100, width:500, height:500, borderRadius:"50%", border:"1px solid rgba(255,255,255,.04)" }} />
        <div style={{ position:"absolute", top:"28%", left:"18%", width:300, height:300, borderRadius:"50%", background:"radial-gradient(circle,rgba(139,0,0,.28),transparent 68%)", filter:"blur(38px)" }} />
        <div className="anim-up" style={{ position:"relative", zIndex:10, textAlign:"center", width:"100%", maxWidth:380 }}>
          <div className="float" style={{ display:"inline-block", position:"relative", marginBottom:38 }}>
            <div style={{ position:"absolute", inset:-22, borderRadius:"50%", background:"radial-gradient(circle,rgba(201,168,76,.2),transparent 68%)", filter:"blur(18px)" }} />
            <div style={{ width:156, height:156, borderRadius:"50%", background:"#0f0f0f", border:"3px solid rgba(201,168,76,.3)", padding:17, margin:"0 auto", position:"relative", boxShadow:"0 0 50px rgba(201,168,76,.14),0 25px 55px rgba(0,0,0,.55)" }}>
              <Image src="/neu-library-logo.png" alt="NEU" width={156} height={156} style={{ width:"100%", height:"100%", objectFit:"contain", borderRadius:"50%" }} />
            </div>
          </div>
          <p style={{ fontSize:11, fontWeight:700, letterSpacing:"0.3em", textTransform:"uppercase", color:"rgba(255,255,255,.35)", marginBottom:10 }}>New Era University</p>
          <h1 style={{ fontSize:50, fontWeight:900, color:"#fff", lineHeight:1.05, fontFamily:"'Playfair Display',serif", marginBottom:6 }}>Admin</h1>
          <p className="gold-text" style={{ fontSize:27, fontWeight:700, fontFamily:"'Playfair Display',serif", marginBottom:26 }}>Dashboard</p>
          <div style={{ width:76, height:1, background:"linear-gradient(90deg,transparent,#C9A84C,transparent)", margin:"0 auto 26px" }} />
          <div className="glass-card" style={{ padding:"16px 20px" }}>
            <p style={{ fontSize:10, fontWeight:700, letterSpacing:"0.2em", textTransform:"uppercase", color:"rgba(255,255,255,.3)", marginBottom:4 }}>Authorized Admin</p>
            <p style={{ fontSize:14, fontWeight:600, color:"rgba(255,255,255,.65)" }}>jcesperanza@neu.edu.ph</p>
          </div>
        </div>
      </div>

      {/* right */}
      <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", background:"#f4f4f5", padding:"32px 20px", position:"relative" }}>
        <div style={{ position:"absolute", inset:0, backgroundImage:"radial-gradient(circle at 2px 2px,rgba(0,0,0,.06) 1px,transparent 0)", backgroundSize:"26px 26px", pointerEvents:"none" }} />
        <div style={{ width:"100%", maxWidth:440, position:"relative", zIndex:10 }}>

          {/* mobile logo */}
          <div className="mobile-logo" style={{ textAlign:"center", marginBottom:28 }}>
            <div style={{ width:82, height:82, borderRadius:"50%", background:"#fff", border:"3px solid rgba(139,0,0,.16)", padding:9, margin:"0 auto 12px", boxShadow:"0 8px 28px rgba(139,0,0,.13)" }}>
              <Image src="/neu-library-logo.png" alt="NEU" width={82} height={82} style={{ width:"100%", height:"100%", objectFit:"contain", borderRadius:"50%" }} />
            </div>
            <h1 style={{ fontSize:22, fontWeight:900, color:"#111827", fontFamily:"'Playfair Display',serif" }}>Admin Dashboard</h1>
          </div>

          <div className="anim-up white-card" style={{ padding:"38px 34px", boxShadow:"0 24px 64px rgba(0,0,0,.10)" }}>
            <div style={{ display:"inline-flex", alignItems:"center", gap:7, background:"#fef2f2", border:"1px solid #fecaca", color:"#991b1b", fontSize:11, fontWeight:700, padding:"5px 13px", borderRadius:100, marginBottom:20 }}>
              🔐 Restricted Access
            </div>
            <h2 style={{ fontSize:32, fontWeight:900, color:"#111827", fontFamily:"'Playfair Display',serif", marginBottom:5 }}>Admin Login</h2>
            <p style={{ fontSize:13, color:"#6b7280", marginBottom:26, fontWeight:500 }}>jcesperanza@neu.edu.ph</p>

            {authErr && (
              <div style={{ background:"#fef2f2", border:"1px solid #fecaca", borderLeft:"3px solid #dc2626", borderRadius:14, padding:"13px 16px", marginBottom:18, display:"flex", alignItems:"center", gap:10, fontSize:13, color:"#991b1b" }}>
                <span>⚠️</span><span style={{ fontWeight:600 }}>{authErr}</span>
              </div>
            )}

            <form onSubmit={login} style={{ display:"flex", flexDirection:"column", gap:18 }}>
              <div>
                <label style={{ display:"block", fontSize:11, fontWeight:700, letterSpacing:"0.18em", textTransform:"uppercase", color:"#374151", marginBottom:8 }}>Password</label>
                <div style={{ position:"relative" }}>
                  <span style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", fontSize:17 }}>🔑</span>
                  <input type={showP?"text":"password"} placeholder="Admin password"
                    value={pass} onChange={e=>setPass(e.target.value)} required className="input-light" style={{ paddingRight:48 }} />
                  <button type="button" onClick={()=>setShowP(!showP)}
                    style={{ position:"absolute", right:14, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", fontSize:17, color:"#9ca3af", padding:4 }}>
                    {showP?"🙈":"👁️"}
                  </button>
                </div>
              </div>
              <button type="submit" className="btn-red">Access Dashboard →</button>
            </form>

            <button onClick={()=>router.push("/login")}
              style={{ width:"100%", marginTop:14, padding:11, background:"none", border:"none", color:"#9ca3af", fontSize:13, fontFamily:"'DM Sans',sans-serif", cursor:"pointer" }}>
              ← Back to Student Login
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @media(min-width:1024px){ .desktop-left{display:flex!important} .mobile-logo{display:none!important} }
      `}</style>
    </div>
  );

  /* ── DASHBOARD ── */
  return (
    <div style={{ minHeight:"100vh", background:"#0a0a0a", fontFamily:"'DM Sans',sans-serif", color:"#f0f0f0" }}>

      {/* navbar */}
      <nav style={{ background:"linear-gradient(135deg,#0d0000,#1f0000,#4a0000)", padding:"0 28px", height:64, display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:100, boxShadow:"0 4px 28px rgba(139,0,0,.38)", borderBottom:"1px solid rgba(139,0,0,.28)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:13 }}>
          <div style={{ width:40, height:40, borderRadius:12, background:"rgba(255,255,255,.1)", padding:6 }}>
            <Image src="/neu-library-logo.png" alt="NEU" width={40} height={40} style={{ width:"100%", height:"100%", objectFit:"contain", borderRadius:8 }} />
          </div>
          <div>
            <h1 style={{ fontSize:17, fontWeight:900, color:"#fff", fontFamily:"'Playfair Display',serif", lineHeight:1.2 }}>NEU Library</h1>
            <p style={{ fontSize:11, color:"rgba(255,255,255,.38)" }}>Admin Dashboard</p>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div className="nav-email glass-card" style={{ display:"flex", alignItems:"center", gap:7, padding:"6px 14px", borderRadius:100 }}>
            <span className="pulse-dot" style={{ width:6, height:6, borderRadius:"50%", background:"#4ade80", display:"inline-block" }} />
            <span style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,.6)" }}>jcesperanza@neu.edu.ph</span>
          </div>
          <button onClick={()=>router.push("/login")}
            style={{ background:"rgba(255,255,255,.1)", border:"1px solid rgba(255,255,255,.14)", color:"#fff", fontSize:12, fontWeight:700, fontFamily:"'DM Sans',sans-serif", padding:"8px 16px", borderRadius:12, cursor:"pointer", transition:"background .2s" }}>
            Log Out
          </button>
        </div>
      </nav>

      <div style={{ maxWidth:1280, margin:"0 auto", padding:"28px 24px", display:"flex", flexDirection:"column", gap:22 }}>

        {/* stats */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))", gap:16 }}>
          {[
            { label:"Visitors Today",      val:cntToday, icon:"👥", grad:"linear-gradient(135deg,#5a0000,#8B0000,#a00000)", glow:"rgba(139,0,0,.32)",   sub:today },
            { label:"Visitors This Week",  val:cntWeek,  icon:"📅", grad:"linear-gradient(135deg,#78350f,#d97706,#f59e0b)", glow:"rgba(217,119,6,.26)",  sub:"Last 7 days" },
            { label:"Visitors This Month", val:cntMonth, icon:"📊", grad:"linear-gradient(135deg,#064e3b,#059669,#10b981)", glow:"rgba(16,185,129,.26)", sub:new Date().toLocaleString("default",{month:"long",year:"numeric"}) },
          ].map((c,i)=>(
            <div key={c.label} className={`anim-up-${i+1}`} style={{ background:c.grad, borderRadius:24, padding:"24px 22px", position:"relative", overflow:"hidden", boxShadow:`0 18px 45px ${c.glow}`, transition:"transform .25s", cursor:"default" }}
              onMouseEnter={e=>(e.currentTarget as HTMLDivElement).style.transform="translateY(-3px)"}
              onMouseLeave={e=>(e.currentTarget as HTMLDivElement).style.transform="translateY(0)"}>
              <div style={{ position:"absolute", top:-28, right:-28, width:120, height:120, borderRadius:"50%", background:"rgba(255,255,255,.06)" }} />
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
                <span style={{ fontSize:34 }}>{c.icon}</span>
                <span style={{ background:"rgba(255,255,255,.13)", padding:"3px 10px", borderRadius:100, fontSize:11, fontWeight:700, color:"rgba(255,255,255,.7)" }}>{c.sub}</span>
              </div>
              <p style={{ fontSize:50, fontWeight:900, color:"#fff", lineHeight:1, fontFamily:"'Playfair Display',serif" }}>{c.val}</p>
              <p style={{ fontSize:13, fontWeight:600, color:"rgba(255,255,255,.65)", marginTop:6 }}>{c.label}</p>
            </div>
          ))}
        </div>

        {/* filters */}
        <div className="anim-up-2 dark-card" style={{ padding:"22px 24px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:18 }}>
            <div>
              <h2 style={{ fontSize:17, fontWeight:800, color:"#fff" }}>Filter Records</h2>
              <p style={{ fontSize:12, color:"rgba(255,255,255,.34)", marginTop:2 }}>Narrow down visitor data</p>
            </div>
            <button onClick={clearFilters} style={{ background:"rgba(139,0,0,.15)", border:"1px solid rgba(139,0,0,.3)", color:"#fca5a5", fontSize:12, fontWeight:700, fontFamily:"'DM Sans',sans-serif", padding:"7px 14px", borderRadius:12, cursor:"pointer" }}>
              Clear All ✕
            </button>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))", gap:10 }}>
            <select value={fReason}  onChange={e=>setFReason(e.target.value)}  className="sel-dark">
              <option value="">🔍 All Reasons</option>
              {["Studying","Borrowing Books","Research","Group Work","Printing"].map(r=><option key={r}>{r}</option>)}
            </select>
            <select value={fCollege} onChange={e=>setFCollege(e.target.value)} className="sel-dark">
              <option value="">🏛️ All Colleges</option>
              {colleges.map(c=><option key={c}>{c}</option>)}
            </select>
            <select value={fStatus}  onChange={e=>setFStatus(e.target.value)}  className="sel-dark">
              <option value="">👤 All Status</option>
              {["Student","Faculty","Staff"].map(s=><option key={s}>{s}</option>)}
            </select>
            <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
              <label style={{ fontSize:10, fontWeight:700, letterSpacing:"0.15em", textTransform:"uppercase", color:"rgba(255,255,255,.28)", marginLeft:4 }}>From</label>
              <input type="date" value={fFrom} onChange={e=>setFFrom(e.target.value)} className="date-dark" />
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
              <label style={{ fontSize:10, fontWeight:700, letterSpacing:"0.15em", textTransform:"uppercase", color:"rgba(255,255,255,.28)", marginLeft:4 }}>To</label>
              <input type="date" value={fTo} onChange={e=>setFTo(e.target.value)} className="date-dark" />
            </div>
          </div>
        </div>

        {/* table */}
        <div className="anim-up-3 dark-card" style={{ overflow:"hidden" }}>
          <div style={{ padding:"18px 24px", borderBottom:"1px solid rgba(255,255,255,.07)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <h2 style={{ fontSize:17, fontWeight:800, color:"#fff" }}>Visitor Records</h2>
              <p style={{ fontSize:12, color:"rgba(255,255,255,.34)", marginTop:2 }}>All library check-ins</p>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:7, background:"rgba(255,255,255,.05)", border:"1px solid rgba(255,255,255,.07)", padding:"5px 13px", borderRadius:100 }}>
              <span className="pulse-dot" style={{ width:6, height:6, borderRadius:"50%", background:"#4ade80", display:"inline-block" }} />
              <span style={{ fontSize:12, fontWeight:700, color:"rgba(255,255,255,.45)" }}>{filtered.length} / {visits.length} records</span>
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign:"center", padding:"80px 20px" }}>
              <p style={{ fontSize:38, marginBottom:10 }}>⏳</p>
              <p style={{ color:"rgba(255,255,255,.4)", fontWeight:600 }}>Loading records…</p>
            </div>
          ) : (
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                <thead>
                  <tr style={{ background:"rgba(255,255,255,.025)", borderBottom:"1px solid rgba(255,255,255,.07)" }}>
                    {["Student Name","College","Status","Reason","Date","Time"].map(h=>(
                      <th key={h} style={{ padding:"13px 20px", textAlign:"left", fontSize:10, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.15em", color:"rgba(255,255,255,.24)", whiteSpace:"nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length===0 ? (
                    <tr><td colSpan={6} style={{ textAlign:"center", padding:"80px 20px" }}>
                      <p style={{ fontSize:38, marginBottom:10 }}>🔍</p>
                      <p style={{ fontWeight:700, color:"rgba(255,255,255,.45)" }}>No records found</p>
                      <p style={{ fontSize:13, color:"rgba(255,255,255,.24)", marginTop:4 }}>Try adjusting your filters</p>
                    </td></tr>
                  ) : filtered.map(v=>{
                    const rd = v.reason&&R_MAP[v.reason]?R_MAP[v.reason]:null;
                    return (
                      <tr key={v.visit_id} style={{ borderBottom:"1px solid rgba(255,255,255,.04)", transition:"background .15s" }}
                        onMouseEnter={e=>(e.currentTarget as HTMLTableRowElement).style.background="rgba(139,0,0,.07)"}
                        onMouseLeave={e=>(e.currentTarget as HTMLTableRowElement).style.background="transparent"}>
                        <td style={{ padding:"13px 20px", fontWeight:700, color:"#f0f0f0" }}>{v.students?.name||"—"}</td>
                        <td style={{ padding:"13px 20px", color:"rgba(255,255,255,.4)", fontSize:12, maxWidth:170, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{v.students?.college||"—"}</td>
                        <td style={{ padding:"13px 20px" }}>
                          <span style={{ display:"inline-flex", alignItems:"center", padding:"3px 10px", borderRadius:100, fontSize:11, fontWeight:800,
                            background: v.students?.employee_status==="Faculty" ? "rgba(37,99,235,.16)" : v.students?.employee_status==="Staff" ? "rgba(124,58,237,.16)" : "rgba(5,150,105,.16)",
                            color:       v.students?.employee_status==="Faculty" ? "#93c5fd"              : v.students?.employee_status==="Staff" ? "#c4b5fd"              : "#6ee7b7" }}>
                            {v.students?.employee_status||"Student"}
                          </span>
                        </td>
                        <td style={{ padding:"13px 20px" }}>
                          {rd ? (
                            <span style={{ display:"inline-flex", alignItems:"center", gap:6, background:rd.bg, color:rd.color, padding:"4px 10px", borderRadius:100, fontSize:12, fontWeight:700 }}>
                              {rd.icon} {v.reason}
                            </span>
                          ) : <span style={{ color:"rgba(255,255,255,.2)", fontStyle:"italic", fontSize:12 }}>Not set</span>}
                        </td>
                        <td style={{ padding:"13px 20px", color:"rgba(255,255,255,.38)", fontSize:12, fontWeight:700, whiteSpace:"nowrap" }}>{v.visit_date}</td>
                        <td style={{ padding:"13px 20px", color:"rgba(255,255,255,.38)", fontSize:12, fontWeight:700, whiteSpace:"nowrap" }}>{v.visit_time}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media(max-width:768px){ .nav-email{display:none!important} }
      `}</style>
    </div>
  );
}