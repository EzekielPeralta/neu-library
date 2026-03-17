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

const R_MAP:Record<string,{icon:string;color:string;bg:string;border:string}> = {
  "Studying":        { icon:"📚", color:"#1D4ED8", bg:"#EFF6FF", border:"#BFDBFE" },
  "Borrowing Books": { icon:"📖", color:"#047857", bg:"#ECFDF5", border:"#A7F3D0" },
  "Research":        { icon:"🔬", color:"#6D28D9", bg:"#F5F3FF", border:"#DDD6FE" },
  "Group Work":      { icon:"👥", color:"#B45309", bg:"#FFFBEB", border:"#FDE68A" },
  "Printing":        { icon:"🖨️", color:"#BE185D", bg:"#FDF2F8", border:"#FBCFE8" },
};

export default function AdminPage() {
  const router = useRouter();
  const [visits,   setVisits]   = useState<Visit[]>([]);
  const [filtered, setFiltered] = useState<Visit[]>([]);
  const [loading,  setLoading]  = useState(true);
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

  useEffect(()=>{ fetchVisits(); },[]);

  useEffect(()=>{
    let r=[...visits];
    if(fReason)  r=r.filter(v=>v.reason===fReason);
    if(fCollege) r=r.filter(v=>v.students?.college===fCollege);
    if(fStatus)  r=r.filter(v=>v.students?.employee_status===fStatus);
    if(fFrom)    r=r.filter(v=>v.visit_date>=fFrom);
    if(fTo)      r=r.filter(v=>v.visit_date<=fTo);
    setFiltered(r);
  },[fReason,fCollege,fStatus,fFrom,fTo,visits]);

  const fetchVisits=async()=>{
    const {data,error}=await supabase.from("library_visits").select("*, students(name,college,employee_status)").order("visit_date",{ascending:false}).order("visit_time",{ascending:false});
    if(!error&&data){setVisits(data as Visit[]);setFiltered(data as Visit[]);}
    setLoading(false);
  };

  const colleges=[...new Set(visits.map(v=>v.students?.college).filter(Boolean))];
  const clear=()=>{setFReason("");setFCollege("");setFStatus("");setFFrom("");setFTo("");};

  const sel:React.CSSProperties={padding:"9px 13px",background:"#F8FAFC",border:"1.5px solid #CBD5E1",borderRadius:11,color:"#0F172A",fontSize:13,fontWeight:600,fontFamily:"'DM Sans',sans-serif",outline:"none",cursor:"pointer",width:"100%",transition:"border-color .2s"};

  return (
    <div style={{ minHeight:"100vh", background:"#F0F4FF", fontFamily:"'DM Sans',sans-serif" }}>

      {/* NAVBAR */}
      <nav style={{ background:"linear-gradient(135deg,#060d1a,#0f2040,#162d55)", padding:"0 28px", height:64, display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:100, boxShadow:"0 4px 20px rgba(15,32,64,.4)", borderBottom:"1px solid rgba(212,175,55,.15)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:13 }}>
          <div style={{ width:42, height:42, borderRadius:12, background:"rgba(255,255,255,.08)", border:"1px solid rgba(212,175,55,.2)", padding:7 }}>
            <Image src="/neu-library-logo.png" alt="NEU" width={42} height={42} style={{ width:"100%", height:"100%", objectFit:"contain", borderRadius:8 }} />
          </div>
          <div>
            <h1 style={{ fontSize:18, fontWeight:900, color:"#fff", fontFamily:"'Playfair Display',serif", lineHeight:1.15 }}>NEU Library</h1>
            <p style={{ fontSize:11, color:"rgba(255,255,255,.38)", fontWeight:600, letterSpacing:"0.08em" }}>ADMIN DASHBOARD</p>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div className="nav-badge card-glass" style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 14px" }}>
            <span className="pdot" style={{ width:7, height:7, borderRadius:"50%", background:"#4ade80", display:"inline-block" }} />
            <span style={{ fontSize:12, fontWeight:700, color:"rgba(255,255,255,.65)" }}>jcesperanza@neu.edu.ph</span>
          </div>
          <button onClick={()=>router.push("/login")} style={{ background:"rgba(255,255,255,.1)", border:"1px solid rgba(255,255,255,.15)", color:"#fff", fontSize:13, fontWeight:700, fontFamily:"'DM Sans',sans-serif", padding:"8px 16px", borderRadius:11, cursor:"pointer", transition:"background .2s" }}>
            Log Out
          </button>
        </div>
      </nav>

      <div style={{ maxWidth:1320, margin:"0 auto", padding:"28px 24px", display:"flex", flexDirection:"column", gap:22 }}>

        {/* STATS */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))", gap:16 }}>
          {[
            { label:"Visitors Today",      val:cntToday,  icon:"👥", grad:"linear-gradient(145deg,#060d1a,#0f2040,#1E3A8A)", shadow:"rgba(15,32,64,.38)",   sub:today },
            { label:"Visitors This Week",  val:cntWeek,   icon:"📅", grad:"linear-gradient(145deg,#78350f,#b45309,#d97706)", shadow:"rgba(180,83,9,.28)",   sub:"Last 7 days" },
            { label:"Visitors This Month", val:cntMonth,  icon:"📊", grad:"linear-gradient(145deg,#064e3b,#047857,#059669)", shadow:"rgba(4,120,87,.28)",   sub:new Date().toLocaleString("default",{month:"long",year:"numeric"}) },
          ].map((c,i)=>(
            <div key={c.label} className={`scard au${i+1}`} style={{ background:c.grad, borderRadius:22, padding:"24px 22px", position:"relative", overflow:"hidden", boxShadow:`0 14px 40px ${c.shadow}` }}>
              <div style={{ position:"absolute", top:-28, right:-28, width:120, height:120, borderRadius:"50%", background:"rgba(255,255,255,.06)" }} />
              <div style={{ position:"absolute", bottom:-35, left:-15, width:90, height:90, borderRadius:"50%", background:"rgba(0,0,0,.08)" }} />
              <div style={{ position:"relative", zIndex:2 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 }}>
                  <span style={{ fontSize:34 }}>{c.icon}</span>
                  <span style={{ background:"rgba(255,255,255,.13)", padding:"3px 11px", borderRadius:100, fontSize:11, fontWeight:700, color:"rgba(255,255,255,.75)" }}>{c.sub}</span>
                </div>
                <p style={{ fontSize:52, fontWeight:900, color:"#fff", lineHeight:1, fontFamily:"'Playfair Display',serif" }}>{c.val}</p>
                <p style={{ fontSize:14, fontWeight:600, color:"rgba(255,255,255,.65)", marginTop:7 }}>{c.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* FILTERS */}
        <div className="card-white au2" style={{ padding:"22px 26px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:18 }}>
            <div>
              <h2 style={{ fontSize:20, fontWeight:900, color:"#0f2040", fontFamily:"'Playfair Display',serif" }}>Filter Records</h2>
              <p style={{ fontSize:13, color:"#94A3B8", marginTop:2 }}>Narrow down visitor data by category</p>
            </div>
            <button onClick={clear} style={{ background:"#EFF6FF", border:"1px solid #BFDBFE", color:"#1E3A8A", fontSize:12, fontWeight:700, fontFamily:"'DM Sans',sans-serif", padding:"7px 15px", borderRadius:10, cursor:"pointer" }}>
              Clear All ✕
            </button>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))", gap:12 }}>
            <select value={fReason}  onChange={e=>setFReason(e.target.value)}  style={sel}><option value="">🔍 All Reasons</option>{["Studying","Borrowing Books","Research","Group Work","Printing"].map(r=><option key={r}>{r}</option>)}</select>
            <select value={fCollege} onChange={e=>setFCollege(e.target.value)} style={sel}><option value="">🏛️ All Colleges</option>{colleges.map(c=><option key={c}>{c}</option>)}</select>
            <select value={fStatus}  onChange={e=>setFStatus(e.target.value)}  style={sel}><option value="">👤 All Status</option>{["Student","Faculty","Staff"].map(s=><option key={s}>{s}</option>)}</select>
            <div>
              <label style={{ display:"block", fontSize:10, fontWeight:700, letterSpacing:"0.14em", textTransform:"uppercase", color:"#94A3B8", marginBottom:5 }}>From</label>
              <input type="date" value={fFrom} onChange={e=>setFFrom(e.target.value)} style={{ ...sel, colorScheme:"light" } as React.CSSProperties} />
            </div>
            <div>
              <label style={{ display:"block", fontSize:10, fontWeight:700, letterSpacing:"0.14em", textTransform:"uppercase", color:"#94A3B8", marginBottom:5 }}>To</label>
              <input type="date" value={fTo} onChange={e=>setFTo(e.target.value)} style={{ ...sel, colorScheme:"light" } as React.CSSProperties} />
            </div>
          </div>
        </div>

        {/* TABLE */}
        <div className="card-white au3" style={{ overflow:"hidden" }}>
          <div style={{ padding:"18px 26px", borderBottom:"1px solid #E2E8F0", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <h2 style={{ fontSize:20, fontWeight:900, color:"#0f2040", fontFamily:"'Playfair Display',serif" }}>Visitor Records</h2>
              <p style={{ fontSize:13, color:"#94A3B8", marginTop:2 }}>All library check-ins and visit logs</p>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:7, background:"#EFF6FF", border:"1px solid #BFDBFE", padding:"6px 14px", borderRadius:100 }}>
              <span className="pdot" style={{ width:6, height:6, borderRadius:"50%", background:"#22C55E", display:"inline-block" }} />
              <span style={{ fontSize:12, fontWeight:700, color:"#1E3A8A" }}>{filtered.length} of {visits.length} records</span>
            </div>
          </div>

          {loading?(
            <div style={{ textAlign:"center", padding:"70px 20px" }}>
              <p style={{ fontSize:34, marginBottom:10 }}>⏳</p>
              <p style={{ fontSize:16, fontWeight:700, color:"#94A3B8", fontFamily:"'Playfair Display',serif" }}>Loading records…</p>
            </div>
          ):(
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                <thead>
                  <tr style={{ background:"#F8FAFF", borderBottom:"1px solid #E2E8F0" }}>
                    {["Student Name","College","Status","Reason","Date","Time"].map(h=>(
                      <th key={h} style={{ padding:"13px 20px", textAlign:"left", fontSize:10, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.15em", color:"#94A3B8", whiteSpace:"nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length===0?(
                    <tr><td colSpan={6} style={{ textAlign:"center", padding:"70px 20px" }}>
                      <p style={{ fontSize:34, marginBottom:10 }}>🔍</p>
                      <p style={{ fontSize:18, fontWeight:700, color:"#334155", fontFamily:"'Playfair Display',serif" }}>No records found</p>
                      <p style={{ fontSize:13, color:"#94A3B8", marginTop:5 }}>Try adjusting your filters</p>
                    </td></tr>
                  ):filtered.map(v=>{
                    const rd=v.reason&&R_MAP[v.reason]?R_MAP[v.reason]:null;
                    return (
                      <tr key={v.visit_id} className="trow" style={{ borderBottom:"1px solid #F1F5F9" }}>
                        <td style={{ padding:"13px 20px", fontWeight:700, color:"#0F172A" }}>{v.students?.name||"—"}</td>
                        <td style={{ padding:"13px 20px", color:"#64748B", fontSize:12, maxWidth:175, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{v.students?.college||"—"}</td>
                        <td style={{ padding:"13px 20px" }}>
                          <span style={{ display:"inline-flex", alignItems:"center", padding:"4px 10px", borderRadius:100, fontSize:11, fontWeight:800,
                            background: v.students?.employee_status==="Faculty"?"#EFF6FF":v.students?.employee_status==="Staff"?"#F5F3FF":"#ECFDF5",
                            color:       v.students?.employee_status==="Faculty"?"#1D4ED8":v.students?.employee_status==="Staff"?"#6D28D9":"#047857",
                            border:      `1px solid ${v.students?.employee_status==="Faculty"?"#BFDBFE":v.students?.employee_status==="Staff"?"#DDD6FE":"#A7F3D0"}` }}>
                            {v.students?.employee_status||"Student"}
                          </span>
                        </td>
                        <td style={{ padding:"13px 20px" }}>
                          {rd?(
                            <span style={{ display:"inline-flex", alignItems:"center", gap:6, background:rd.bg, color:rd.color, padding:"4px 11px", borderRadius:100, fontSize:12, fontWeight:700, border:`1px solid ${rd.border}` }}>
                              {rd.icon} {v.reason}
                            </span>
                          ):<span style={{ color:"#CBD5E1", fontStyle:"italic", fontSize:12 }}>Not set</span>}
                        </td>
                        <td style={{ padding:"13px 20px", color:"#64748B", fontSize:12, fontWeight:700, whiteSpace:"nowrap" }}>{v.visit_date}</td>
                        <td style={{ padding:"13px 20px", color:"#64748B", fontSize:12, fontWeight:700, whiteSpace:"nowrap" }}>{v.visit_time}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <style>{`@media(max-width:768px){.nav-badge{display:none!important}}`}</style>
    </div>
  );
}