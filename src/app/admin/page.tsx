"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/app/lib/supabase";

interface Visit {
  visit_id: string; student_id: string; reason: string;
  visit_date: string; visit_time: string; time_out?: string; visit_status?: string;
  students: { name: string; college: string; employee_status: string; email: string; };
}
interface Student {
  student_id: string; name: string; email: string;
  college: string; employee_status: string;
}
interface LibraryStatus {
  is_open: boolean;
  opened_by: string | null; opened_at: string | null;
  closed_by: string | null; closed_at: string | null;
}

const REASONS  = ["Studying","Borrowing Books","Research","Group Work","Printing"];
const COLLEGES = [
  "College of Informatics and Computing Studies",
  "College of Engineering","College of Business",
  "College of Arts","College of Nursing","College of Education",
];
const REASON_COLORS: Record<string,{color:string;bg:string}> = {
  "Studying":        { color:"#93C5FD", bg:"rgba(147,197,253,.12)" },
  "Borrowing Books": { color:"#6EE7B7", bg:"rgba(110,231,183,.12)" },
  "Research":        { color:"#C4B5FD", bg:"rgba(196,181,253,.12)" },
  "Group Work":      { color:"#FCD34D", bg:"rgba(252,211,77,.12)"  },
  "Printing":        { color:"#F9A8D4", bg:"rgba(249,168,212,.12)" },
};
const STATUS_COLORS: Record<string,{color:string;bg:string}> = {
  "Student": { color:"#6EE7B7", bg:"rgba(110,231,183,.1)" },
  "Faculty": { color:"#93C5FD", bg:"rgba(147,197,253,.1)" },
  "Staff":   { color:"#FCD34D", bg:"rgba(252,211,77,.1)"  },
};

/* ══════════════════════════════════════
   LIBRARY STATUS TOGGLE (sidebar widget)
══════════════════════════════════════ */
function LibraryStatusToggle() {
  const [status,     setStatus]     = useState<LibraryStatus|null>(null);
  const [toggling,   setToggling]   = useState(false);
  const [adminEmail, setAdminEmail] = useState("jcesperanza@neu.edu.ph");

  useEffect(() => {
    fetchStatus();
    const cookie = document.cookie.split(";").find(c => c.trim().startsWith("user_email="));
    if (cookie) setAdminEmail(decodeURIComponent(cookie.split("=")[1].trim()));
  }, []);

  const fetchStatus = async () => {
    const { data } = await supabase.from("library_status").select("*").eq("id",1).single();
    if (data) setStatus(data as LibraryStatus);
  };

  const toggle = async () => {
    if (!status || toggling) return;
    setToggling(true);
    const nowISO  = new Date().toISOString();
    const opening = !status.is_open;

    await supabase.from("library_status").update(
      opening
        ? { is_open:true,  opened_by:adminEmail, opened_at:nowISO }
        : { is_open:false, closed_by:adminEmail, closed_at:nowISO }
    ).eq("id", 1);

    await supabase.from("library_schedule_log").insert({
      action:  opening ? "opened" : "closed",
      done_by: adminEmail,
      note:    opening ? "Library opened by admin" : "Library closed by admin",
    });

    await fetchStatus();
    setToggling(false);
  };

  const fmt = (iso: string|null) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleTimeString("en-PH",{hour:"2-digit",minute:"2-digit",hour12:true});
  };
  const fmtDate = (iso: string|null) => {
    if (!iso) return "";
    return new Date(iso).toLocaleDateString("en-PH",{month:"short",day:"numeric"});
  };

  if (!status) return (
    <div style={{ padding:"12px 14px", borderTop:"1px solid rgba(255,255,255,.06)" }}>
      <p style={{ fontSize:11, color:"rgba(255,255,255,.25)" }}>Loading status…</p>
    </div>
  );

  return (
    <div style={{ padding:"14px 14px", borderTop:"1px solid rgba(255,255,255,.06)", borderBottom:"1px solid rgba(255,255,255,.06)" }}>
      <p style={{ fontSize:10, fontWeight:700, letterSpacing:".18em", textTransform:"uppercase", color:"rgba(255,255,255,.25)", marginBottom:10 }}>
        Library Status
      </p>

      {/* status dot + label */}
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
        <span style={{ width:8, height:8, borderRadius:"50%", background:status.is_open?"#4ade80":"#f87171", display:"inline-block", flexShrink:0 }} />
        <p style={{ fontSize:15, fontWeight:800, color:status.is_open?"#4ade80":"#f87171", letterSpacing:".04em" }}>
          {status.is_open ? "OPEN" : "CLOSED"}
        </p>
      </div>

      {/* who opened/closed */}
      <div style={{ marginBottom:12, paddingLeft:2 }}>
        {status.is_open && status.opened_by && (
          <div>
            <p style={{ fontSize:10, color:"rgba(255,255,255,.28)" }}>Opened by</p>
            <p style={{ fontSize:11, fontWeight:600, color:"rgba(255,255,255,.6)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:170 }}>
              {status.opened_by.split("@")[0]}
            </p>
            <p style={{ fontSize:10, color:"rgba(255,255,255,.25)", marginTop:1 }}>
              {fmtDate(status.opened_at)} · {fmt(status.opened_at)}
            </p>
          </div>
        )}
        {!status.is_open && status.closed_by && (
          <div>
            <p style={{ fontSize:10, color:"rgba(255,255,255,.28)" }}>Closed by</p>
            <p style={{ fontSize:11, fontWeight:600, color:"rgba(255,255,255,.6)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:170 }}>
              {status.closed_by.split("@")[0]}
            </p>
            <p style={{ fontSize:10, color:"rgba(255,255,255,.25)", marginTop:1 }}>
              {fmtDate(status.closed_at)} · {fmt(status.closed_at)}
            </p>
          </div>
        )}
      </div>

      {/* toggle button */}
      <button onClick={toggle} disabled={toggling} style={{
        width:"100%", height:36,
        background: status.is_open ? "rgba(248,113,113,.1)" : "rgba(74,222,128,.1)",
        border: `1px solid ${status.is_open ? "rgba(248,113,113,.3)" : "rgba(74,222,128,.3)"}`,
        borderRadius:8, fontSize:12, fontWeight:700,
        fontFamily:"'DM Sans',sans-serif",
        color: status.is_open ? "#f87171" : "#4ade80",
        cursor: toggling ? "not-allowed" : "pointer",
        opacity: toggling ? .6 : 1,
        transition:"all .2s",
        display:"flex", alignItems:"center", justifyContent:"center", gap:6,
      }}>
        {toggling ? "Updating…" : status.is_open ? "🔒 Close Library" : "🔓 Open Library"}
      </button>
    </div>
  );
}

/* ══════════════════════════════════════
   MAIN ADMIN PAGE
══════════════════════════════════════ */
export default function AdminPage() {
  const router = useRouter();
  const [visits,     setVisits]     = useState<Visit[]>([]);
  const [students,   setStudents]   = useState<Student[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [activePage, setActivePage] = useState("dashboard");
  const [adminEmail, setAdminEmail] = useState("jcesperanza@neu.edu.ph");

  useEffect(() => {
    fetchAll();
    const cookie = document.cookie.split(";").find(c => c.trim().startsWith("user_email="));
    if (cookie) setAdminEmail(decodeURIComponent(cookie.split("=")[1].trim()));
  }, []);

  const fetchAll = async () => {
    const { data: v } = await supabase.from("library_visits")
      .select("*, students(name,college,employee_status,email)")
      .order("visit_date",{ascending:false}).order("visit_time",{ascending:false});
    if (v) setVisits(v as Visit[]);
    const { data: s } = await supabase.from("students").select("*").order("name");
    if (s) setStudents(s as Student[]);
    setLoading(false);
  };

  const today      = new Date().toISOString().split("T")[0];
  const weekAgo    = new Date(Date.now()-7*86400000).toISOString().split("T")[0];
  const monthStart = new Date(new Date().getFullYear(),new Date().getMonth(),1).toISOString().split("T")[0];
  const yearStart  = new Date(new Date().getFullYear(),0,1).toISOString().split("T")[0];

  const cntToday = visits.filter(v=>v.visit_date===today).length;
  const cntWeek  = visits.filter(v=>v.visit_date>=weekAgo).length;
  const cntMonth = visits.filter(v=>v.visit_date>=monthStart).length;
  const cntYear  = visits.filter(v=>v.visit_date>=yearStart).length;

  const NAV = [
    { id:"dashboard", icon:"▣", label:"Dashboard"       },
    { id:"logs",      icon:"≡", label:"Visitor Logs"    },
    { id:"users",     icon:"◎", label:"User Management" },
  ];

  const sidebarBtnBase: React.CSSProperties = {
    width:"100%", display:"flex", alignItems:"center", gap:12,
    padding:"11px 16px", borderRadius:8, border:"none", cursor:"pointer",
    fontSize:14, fontWeight:600, fontFamily:"'DM Sans',sans-serif",
    textAlign:"left", transition:"all .18s", position:"relative", marginBottom:2,
  };

  return (
    <div style={{ minHeight:"100vh", display:"flex", fontFamily:"'DM Sans',sans-serif", background:"#060d1a", color:"#fff" }}>

      {/* ── SIDEBAR ── */}
      <div style={{ width:230, flexShrink:0, background:"#0a1628", borderRight:"1px solid rgba(212,175,55,.1)", display:"flex", flexDirection:"column", position:"sticky", top:0, height:"100vh" }}>

        {/* logo */}
        <div style={{ padding:"20px 18px 16px", borderBottom:"1px solid rgba(255,255,255,.06)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:11 }}>
            <div style={{ width:38, height:38, borderRadius:"50%", border:"1px solid rgba(212,175,55,.3)", padding:4, flexShrink:0 }}>
              <Image src="/neu-library-logo.png" alt="NEU" width={38} height={38}
                style={{ width:"100%", height:"100%", objectFit:"contain", borderRadius:"50%" }} />
            </div>
            <div>
              <p style={{ fontSize:12, fontWeight:800, color:"#fff", lineHeight:1.2, letterSpacing:".04em" }}>NEW ERA UNIVERSITY</p>
              <p style={{ fontSize:10, color:"rgba(255,255,255,.35)", letterSpacing:".08em" }}>Library Management</p>
            </div>
          </div>
        </div>

        {/* nav */}
        <div style={{ padding:"16px 12px", flex:1 }}>
          <p style={{ fontSize:10, fontWeight:700, letterSpacing:".2em", textTransform:"uppercase", color:"rgba(255,255,255,.25)", marginBottom:10, paddingLeft:6 }}>
            Navigation
          </p>
          {NAV.map(item=>(
            <button key={item.id} onClick={()=>setActivePage(item.id)} style={{
              ...sidebarBtnBase,
              background: activePage===item.id ? "rgba(212,175,55,.08)" : "transparent",
              color:      activePage===item.id ? "#DAA520" : "rgba(255,255,255,.45)",
            }}>
              {activePage===item.id && (
                <div style={{ position:"absolute", left:0, top:6, bottom:6, width:3, background:"#DAA520", borderRadius:"0 2px 2px 0" }} />
              )}
              <span style={{ fontSize:15, paddingLeft:activePage===item.id?4:0 }}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        {/* library status toggle */}
        <LibraryStatusToggle />

        {/* admin info */}
        <div style={{ padding:"14px 16px", borderTop:"1px solid rgba(255,255,255,.06)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px", background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.07)", borderRadius:10, marginBottom:10 }}>
            <div style={{ width:32, height:32, borderRadius:"50%", background:"linear-gradient(135deg,#B8860B,#DAA520)", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:800, fontSize:13, flexShrink:0 }}>
              {adminEmail.charAt(0).toUpperCase()}
            </div>
            <div style={{ minWidth:0 }}>
              <p style={{ fontSize:12, fontWeight:700, color:"#fff", lineHeight:1.2 }}>Administrator</p>
              <p style={{ fontSize:10, color:"rgba(255,255,255,.35)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{adminEmail}</p>
              <span style={{ fontSize:9, fontWeight:800, color:"#DAA520", letterSpacing:".1em" }}>ADMIN</span>
            </div>
          </div>
          <button onClick={()=>{ document.cookie="user_email=; path=/; max-age=0"; document.cookie="active_role=; path=/; max-age=0"; router.push("/auth/admin"); }}
            style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:7, padding:"8px", background:"rgba(248,113,113,.07)", border:"1px solid rgba(248,113,113,.15)", borderRadius:8, color:"#f87171", fontSize:12, fontWeight:700, fontFamily:"'DM Sans',sans-serif", cursor:"pointer", transition:"all .18s" }}
            onMouseEnter={e=>(e.currentTarget as HTMLButtonElement).style.background="rgba(248,113,113,.13)"}
            onMouseLeave={e=>(e.currentTarget as HTMLButtonElement).style.background="rgba(248,113,113,.07)"}>
            ← Sign Out
          </button>
        </div>
      </div>

      {/* ── MAIN ── */}
      <div style={{ flex:1, overflow:"auto" }}>
        {activePage==="dashboard" && <DashboardPage visits={visits} loading={loading} today={today} weekAgo={weekAgo} monthStart={monthStart} yearStart={yearStart} cntToday={cntToday} cntWeek={cntWeek} cntMonth={cntMonth} cntYear={cntYear} />}
        {activePage==="logs"      && <VisitorLogsPage visits={visits} loading={loading} />}
        {activePage==="users"     && <UserManagementPage students={students} loading={loading} />}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   DASHBOARD PAGE
══════════════════════════════════════ */
function DashboardPage({ visits, loading, today, weekAgo, monthStart, yearStart, cntToday, cntWeek, cntMonth, cntYear }: {
  visits:Visit[]; loading:boolean;
  today:string; weekAgo:string; monthStart:string; yearStart:string;
  cntToday:number; cntWeek:number; cntMonth:number; cntYear:number;
}) {
  const [period, setPeriod] = useState("month");

  const filtered = visits.filter(v =>
    period==="today" ? v.visit_date===today :
    period==="week"  ? v.visit_date>=weekAgo :
    period==="month" ? v.visit_date>=monthStart :
    period==="year"  ? v.visit_date>=yearStart : true
  );

  const collegeMap: Record<string,number> = {};
  filtered.forEach(v=>{ const c=v.students?.college||"Unknown"; collegeMap[c]=(collegeMap[c]||0)+1; });
  const collegeData = Object.entries(collegeMap).sort((a,b)=>b[1]-a[1]);

  const reasonMap: Record<string,number> = {};
  filtered.forEach(v=>{ if(v.reason) reasonMap[v.reason]=(reasonMap[v.reason]||0)+1; });
  const reasonData = Object.entries(reasonMap).sort((a,b)=>b[1]-a[1]);

  const dailyMap: Record<string,number> = {};
  for(let i=13;i>=0;i--){
    const d=new Date(); d.setDate(d.getDate()-i);
    dailyMap[d.toISOString().split("T")[0]]=0;
  }
  visits.forEach(v=>{ if(dailyMap[v.visit_date]!==undefined) dailyMap[v.visit_date]++; });
  const dailyData = Object.entries(dailyMap).map(([date,count])=>({ date:date.slice(5), count }));
  const maxDaily  = Math.max(...dailyData.map(d=>d.count),1);

  const COLORS = ["#DAA520","#93C5FD","#6EE7B7","#C4B5FD","#F9A8D4","#FCD34D"];

  const exportCSV = () => {
    const headers = ["Visit ID","Student ID","Name","Email","College","Reason","Date","Time In","Time Out"];
    const rows = visits.map(v=>[v.visit_id,v.student_id,v.students?.name||"",v.students?.email||"",v.students?.college||"",v.reason||"",v.visit_date,v.visit_time,v.time_out||""]);
    const csv = [headers,...rows].map(r=>r.map(c=>`"${c}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv],{type:"text/csv"}));
    a.download = `NEU-Library-Visits-${today}.csv`;
    a.click();
  };

  const inside = visits.filter(v=>v.visit_status==="inside");

  return (
    <div style={{ padding:"28px 32px", minHeight:"100vh" }}>

      {/* header */}
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:28 }}>
        <div>
          <p style={{ fontSize:11, fontWeight:700, letterSpacing:".28em", textTransform:"uppercase", color:"rgba(212,175,55,.6)", marginBottom:6 }}>
            NEU Library Management System
          </p>
          <h1 style={{ fontSize:32, fontWeight:900, color:"#fff", fontFamily:"'Playfair Display',serif", lineHeight:1.1 }}>
            Visitor Dashboard
          </h1>
        </div>
        <button onClick={exportCSV}
          style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 20px", background:"transparent", border:"1px solid rgba(212,175,55,.35)", borderRadius:10, color:"#DAA520", fontSize:13, fontWeight:700, fontFamily:"'DM Sans',sans-serif", cursor:"pointer", transition:"all .18s", whiteSpace:"nowrap" }}
          onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.background="rgba(212,175,55,.08)";(e.currentTarget as HTMLButtonElement).style.borderColor="rgba(212,175,55,.6)";}}
          onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.background="transparent";(e.currentTarget as HTMLButtonElement).style.borderColor="rgba(212,175,55,.35)";}}>
          ↓ Export CSV
        </button>
      </div>

      {/* period filter */}
      <div style={{ display:"flex", gap:6, marginBottom:24 }}>
        {[["today","Today"],["week","This Week"],["month","This Month"],["year","This Year"]].map(([val,label])=>(
          <button key={val} onClick={()=>setPeriod(val)}
            style={{ padding:"8px 18px", borderRadius:8, border:"1px solid", fontSize:13, fontWeight:600, fontFamily:"'DM Sans',sans-serif", cursor:"pointer", transition:"all .18s",
              background: period===val?"rgba(212,175,55,.12)":"transparent",
              color:       period===val?"#DAA520":"rgba(255,255,255,.4)",
              borderColor: period===val?"rgba(212,175,55,.4)":"rgba(255,255,255,.1)",
            }}>
            {label}
          </button>
        ))}
      </div>

      {/* stat cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:14, marginBottom:24 }}>
        {[
          { label:"Today",            val:cntToday,       sub:today,                                                    highlight:false },
          { label:"This Week",        val:cntWeek,        sub:"Last 7 days",                                            highlight:false },
          { label:"This Month",       val:cntMonth,       sub:new Date().toLocaleString("default",{month:"long"}),      highlight:false },
          { label:"This Year",        val:cntYear,        sub:new Date().getFullYear().toString(),                      highlight:false },
          { label:"Currently Inside", val:inside.length,  sub:"Active now",                                             highlight:true  },
        ].map(c=>(
          <div key={c.label} style={{
            background: c.highlight?"linear-gradient(145deg,#0d1f3e,#162d55)":"#0d1f3e",
            border:    c.highlight?"1px solid rgba(212,175,55,.25)":"1px solid rgba(255,255,255,.07)",
            borderTop: `2px solid ${c.highlight?"#DAA520":"rgba(212,175,55,.25)"}`,
            borderRadius:12, padding:"20px 18px", transition:"transform .18s",
          }}
            onMouseEnter={e=>(e.currentTarget as HTMLDivElement).style.transform="translateY(-2px)"}
            onMouseLeave={e=>(e.currentTarget as HTMLDivElement).style.transform="translateY(0)"}>
            <p style={{ fontSize:40, fontWeight:900, color:c.highlight?"#DAA520":"#fff", fontFamily:"'Playfair Display',serif", lineHeight:1, marginBottom:8 }}>{c.val}</p>
            <p style={{ fontSize:13, fontWeight:700, color:c.highlight?"rgba(212,175,55,.8)":"rgba(255,255,255,.65)", marginBottom:3 }}>{c.label}</p>
            <p style={{ fontSize:11, color:"rgba(255,255,255,.28)" }}>{c.sub}</p>
          </div>
        ))}
      </div>

      {/* currently inside */}
      {inside.length > 0 && (
        <div style={{ background:"#0d1f3e", border:"1px solid rgba(74,222,128,.2)", borderTop:"2px solid #4ade80", borderRadius:12, padding:"18px 22px", marginBottom:18 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
            <span style={{ width:8, height:8, borderRadius:"50%", background:"#4ade80", display:"inline-block" }} />
            <h3 style={{ fontSize:16, fontWeight:800, color:"#fff" }}>Currently Inside</h3>
            <span style={{ background:"rgba(74,222,128,.12)", color:"#4ade80", fontSize:12, fontWeight:700, padding:"2px 10px", borderRadius:100 }}>{inside.length}</span>
          </div>
          <div style={{ display:"flex", flexWrap:"wrap" as const, gap:8 }}>
            {inside.map(v=>(
              <div key={v.visit_id} style={{ background:"rgba(255,255,255,.05)", border:"1px solid rgba(255,255,255,.08)", borderRadius:8, padding:"8px 13px", display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ width:28, height:28, borderRadius:"50%", background:"linear-gradient(135deg,#0f2040,#1E3A8A)", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:800, fontSize:11, flexShrink:0 }}>
                  {v.students?.name?.charAt(0)||"?"}
                </div>
                <div>
                  <p style={{ fontSize:13, fontWeight:700, color:"#fff" }}>{v.students?.name||"—"}</p>
                  <p style={{ fontSize:11, color:"rgba(255,255,255,.35)" }}>In at {v.visit_time?.slice(0,5)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* charts row */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:18, marginBottom:18 }}>

        {/* college donut */}
        <div style={{ background:"#0d1f3e", border:"1px solid rgba(255,255,255,.07)", borderRadius:12, padding:"22px 24px" }}>
          <p style={{ fontSize:11, fontWeight:700, letterSpacing:".2em", textTransform:"uppercase", color:"rgba(255,255,255,.28)", marginBottom:4 }}>Distribution</p>
          <h3 style={{ fontSize:18, fontWeight:800, color:"#fff", marginBottom:18 }}>Visitors by College</h3>
          {loading ? <div style={{ height:160, background:"rgba(255,255,255,.04)", borderRadius:8 }} /> : (
            <div style={{ display:"flex", alignItems:"center", gap:20 }}>
              <DonutChart data={collegeData} colors={COLORS} />
              <div style={{ flex:1, display:"flex", flexDirection:"column", gap:8 }}>
                {collegeData.map(([college,count],i)=>(
                  <div key={college} style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <div style={{ width:8, height:8, borderRadius:"50%", background:COLORS[i%COLORS.length], flexShrink:0 }} />
                    <p style={{ fontSize:11, color:"rgba(255,255,255,.55)", flex:1, lineHeight:1.3 }}>
                      {college.replace("College of Informatics and Computing Studies","CICS").replace("College of ","")}
                    </p>
                    <p style={{ fontSize:12, fontWeight:700, color:"#fff" }}>{count}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* reason bars */}
        <div style={{ background:"#0d1f3e", border:"1px solid rgba(255,255,255,.07)", borderRadius:12, padding:"22px 24px" }}>
          <p style={{ fontSize:11, fontWeight:700, letterSpacing:".2em", textTransform:"uppercase", color:"rgba(255,255,255,.28)", marginBottom:4 }}>Breakdown</p>
          <h3 style={{ fontSize:18, fontWeight:800, color:"#fff", marginBottom:18 }}>Visitors by Purpose</h3>
          {loading ? <div style={{ height:160, background:"rgba(255,255,255,.04)", borderRadius:8 }} /> : (
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {reasonData.map(([reason,count])=>{
                const pct = filtered.length ? Math.round((count/filtered.length)*100) : 0;
                const rc  = REASON_COLORS[reason]||{color:"#fff",bg:"rgba(255,255,255,.1)"};
                return (
                  <div key={reason}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                      <p style={{ fontSize:13, fontWeight:600, color:"rgba(255,255,255,.7)" }}>{reason}</p>
                      <p style={{ fontSize:12, fontWeight:700, color:rc.color }}>{count} <span style={{ color:"rgba(255,255,255,.3)", fontWeight:400 }}>({pct}%)</span></p>
                    </div>
                    <div style={{ height:5, background:"rgba(255,255,255,.06)", borderRadius:100, overflow:"hidden" }}>
                      <div style={{ height:"100%", width:`${pct}%`, background:rc.color, borderRadius:100, transition:"width .5s ease" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* daily bar chart */}
      <div style={{ background:"#0d1f3e", border:"1px solid rgba(255,255,255,.07)", borderRadius:12, padding:"22px 24px" }}>
        <p style={{ fontSize:11, fontWeight:700, letterSpacing:".2em", textTransform:"uppercase", color:"rgba(255,255,255,.28)", marginBottom:4 }}>Trend</p>
        <h3 style={{ fontSize:18, fontWeight:800, color:"#fff", marginBottom:20 }}>Daily Visits — Last 14 Days</h3>
        <div style={{ display:"flex", alignItems:"flex-end", gap:6, height:100 }}>
          {dailyData.map(d=>(
            <div key={d.date} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
              {d.count>0 && <p style={{ fontSize:10, color:"rgba(255,255,255,.45)", fontWeight:700 }}>{d.count}</p>}
              <div style={{ width:"100%", borderRadius:"3px 3px 0 0", transition:"height .4s ease",
                background: d.count>0?"linear-gradient(180deg,#DAA520,rgba(212,175,55,.4))":"rgba(255,255,255,.05)",
                height:`${Math.max((d.count/maxDaily)*80,d.count>0?6:3)}px`,
              }} />
              <p style={{ fontSize:9, color:"rgba(255,255,255,.25)", textAlign:"center" }}>{d.date}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   DONUT CHART
══════════════════════════════════════ */
function DonutChart({ data, colors }: { data:[string,number][]; colors:string[] }) {
  const total = data.reduce((s,[,v])=>s+v,0);
  if(!total) return <div style={{ width:110,height:110,borderRadius:"50%",background:"rgba(255,255,255,.04)" }} />;
  let cum = 0;
  const segs = data.map(([,v],i)=>{ const pct=(v/total)*100; const s=cum; cum+=pct; return {pct,s,color:colors[i%colors.length]}; });
  return (
    <div style={{ position:"relative",width:110,height:110,flexShrink:0 }}>
      <div style={{ width:110,height:110,borderRadius:"50%",background:`conic-gradient(${segs.map(s=>`${s.color} ${s.s}% ${s.s+s.pct}%`).join(",")})` }} />
      <div style={{ position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:58,height:58,borderRadius:"50%",background:"#0d1f3e",display:"flex",alignItems:"center",justifyContent:"center" }}>
        <p style={{ fontSize:16,fontWeight:900,color:"#fff",fontFamily:"'Playfair Display',serif" }}>{total}</p>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   VISITOR LOGS
══════════════════════════════════════ */
function VisitorLogsPage({ visits, loading }: { visits:Visit[]; loading:boolean }) {
  const [search,   setSearch]   = useState("");
  const [period,   setPeriod]   = useState("today");
  const [fReason,  setFReason]  = useState("");
  const [fCollege, setFCollege] = useState("");

  const today      = new Date().toISOString().split("T")[0];
  const weekAgo    = new Date(Date.now()-7*86400000).toISOString().split("T")[0];
  const monthStart = new Date(new Date().getFullYear(),new Date().getMonth(),1).toISOString().split("T")[0];
  const yearStart  = new Date(new Date().getFullYear(),0,1).toISOString().split("T")[0];

  const filtered = visits.filter(v=>{
    const q = search.toLowerCase();
    const matchSearch = !search ||
      v.students?.name?.toLowerCase().includes(q) ||
      v.students?.email?.toLowerCase().includes(q) ||
      v.student_id?.toLowerCase().includes(q) ||
      v.students?.college?.toLowerCase().includes(q);
    const matchPeriod =
      period==="today" ? v.visit_date===today :
      period==="week"  ? v.visit_date>=weekAgo :
      period==="month" ? v.visit_date>=monthStart :
      period==="year"  ? v.visit_date>=yearStart : true;
    const matchReason  = !fReason  || v.reason===fReason;
    const matchCollege = !fCollege || v.students?.college===fCollege;
    return matchSearch && matchPeriod && matchReason && matchCollege;
  });

  const exportCSV = () => {
    const headers = ["Visit ID","Student ID","Name","Email","College","Reason","Date","Time In","Time Out","Duration"];
    const rows = filtered.map(v=>{
      const tout = v.time_out;
      let dur = "";
      if(tout){
        const [h1,m1]=v.visit_time.split(":").map(Number);
        const [h2,m2]=tout.split(":").map(Number);
        const diff=(h2*60+m2)-(h1*60+m1);
        dur=`${Math.floor(diff/60)}h ${diff%60}m`;
      }
      return [v.visit_id,v.student_id,v.students?.name||"",v.students?.email||"",v.students?.college||"",v.reason||"",v.visit_date,v.visit_time,tout||"",dur];
    });
    const csv=[headers,...rows].map(r=>r.map(c=>`"${c}"`).join(",")).join("\n");
    const a=document.createElement("a");
    a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));
    a.download=`NEU-Library-Visits-${today}.csv`;
    a.click();
  };

  const selStyle: React.CSSProperties = {
    height:40, padding:"0 14px", background:"#0d1f3e",
    border:"1px solid rgba(255,255,255,.15)", borderRadius:8,
    color:"rgba(255,255,255,.8)", fontSize:13, fontWeight:600,
    fontFamily:"'DM Sans',sans-serif", outline:"none", cursor:"pointer",
    colorScheme:"dark",
  };

  return (
    <div style={{ padding:"28px 32px", minHeight:"100vh" }}>
      <div style={{ marginBottom:24 }}>
        <p style={{ fontSize:11, fontWeight:700, letterSpacing:".28em", textTransform:"uppercase", color:"rgba(212,175,55,.6)", marginBottom:6 }}>Records</p>
        <h1 style={{ fontSize:32, fontWeight:900, color:"#fff", fontFamily:"'Playfair Display',serif" }}>Visitor Logs</h1>
      </div>

      {/* filters */}
      <div style={{ background:"#0d1f3e", border:"1px solid rgba(255,255,255,.07)", borderRadius:12, padding:"18px 20px", marginBottom:18 }}>
        <div style={{ position:"relative", marginBottom:14 }}>
          <span style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", fontSize:15, color:"rgba(255,255,255,.3)" }}>⌕</span>
          <input type="text" placeholder="Search by name, email, student number, or college…"
            value={search} onChange={e=>setSearch(e.target.value)}
            style={{ width:"100%", height:44, paddingLeft:42, paddingRight:18, background:"rgba(255,255,255,.05)", border:"1px solid rgba(255,255,255,.1)", borderRadius:9, color:"#fff", fontSize:14, fontFamily:"'DM Sans',sans-serif", outline:"none", transition:"border-color .2s" }}
            onFocus={e=>e.target.style.borderColor="rgba(212,175,55,.45)"}
            onBlur={e=>e.target.style.borderColor="rgba(255,255,255,.1)"}
          />
        </div>
        <div style={{ display:"flex", gap:10, flexWrap:"wrap" as const, alignItems:"center" }}>
          <div style={{ display:"flex", gap:5 }}>
            {[["today","Today"],["week","Week"],["month","Month"],["year","Year"],["all","All"]].map(([val,label])=>(
              <button key={val} onClick={()=>setPeriod(val)}
                style={{ height:36, padding:"0 14px", borderRadius:7, border:"1px solid", fontSize:12, fontWeight:700, fontFamily:"'DM Sans',sans-serif", cursor:"pointer", transition:"all .18s",
                  background: period===val?"rgba(212,175,55,.12)":"transparent",
                  color:       period===val?"#DAA520":"rgba(255,255,255,.4)",
                  borderColor: period===val?"rgba(212,175,55,.4)":"rgba(255,255,255,.1)",
                }}>{label}</button>
            ))}
          </div>
          <select value={fReason}  onChange={e=>setFReason(e.target.value)}  style={selStyle}>
            <option value="">All Purposes</option>
            {REASONS.map(r=><option key={r} value={r}>{r}</option>)}
          </select>
          <select value={fCollege} onChange={e=>setFCollege(e.target.value)} style={selStyle}>
            <option value="">All Colleges</option>
            {COLLEGES.map(c=><option key={c} value={c}>{c.replace("College of ","")}</option>)}
          </select>
          <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ fontSize:12, color:"rgba(255,255,255,.35)", fontWeight:600 }}>{filtered.length} of {visits.length} records</span>
            <button onClick={exportCSV}
              style={{ height:36, padding:"0 16px", background:"transparent", border:"1px solid rgba(212,175,55,.35)", borderRadius:8, color:"#DAA520", fontSize:12, fontWeight:700, fontFamily:"'DM Sans',sans-serif", cursor:"pointer", transition:"all .18s" }}
              onMouseEnter={e=>(e.currentTarget as HTMLButtonElement).style.background="rgba(212,175,55,.08)"}
              onMouseLeave={e=>(e.currentTarget as HTMLButtonElement).style.background="transparent"}>
              ↓ Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* table */}
      <div style={{ background:"#0d1f3e", border:"1px solid rgba(255,255,255,.07)", borderRadius:12, overflow:"hidden" }}>
        {loading ? (
          <div style={{ textAlign:"center", padding:"60px 20px", color:"rgba(255,255,255,.35)" }}>Loading records…</div>
        ) : (
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
              <thead>
                <tr style={{ borderBottom:"1px solid rgba(255,255,255,.07)" }}>
                  {["Student","College","Purpose","Date","Time In","Time Out","Duration"].map(h=>(
                    <th key={h} style={{ padding:"13px 20px", textAlign:"left", fontSize:10, fontWeight:700, textTransform:"uppercase" as const, letterSpacing:".16em", color:"rgba(255,255,255,.28)", background:"rgba(255,255,255,.03)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length===0 ? (
                  <tr><td colSpan={7} style={{ textAlign:"center", padding:"60px 20px", color:"rgba(255,255,255,.28)", fontSize:14 }}>No records match your filters</td></tr>
                ) : filtered.map(v=>{
                  const rc = v.reason&&REASON_COLORS[v.reason]?REASON_COLORS[v.reason]:{color:"rgba(255,255,255,.45)",bg:"rgba(255,255,255,.05)"};
                  return (
                    <tr key={v.visit_id} className="trow" style={{ borderBottom:"1px solid rgba(255,255,255,.04)" }}>
                      <td style={{ padding:"13px 20px" }}>
                        <p style={{ fontWeight:700, color:"#fff", fontSize:14 }}>{v.students?.name||"—"}</p>
                        <p style={{ fontSize:11, color:"rgba(255,255,255,.35)", marginTop:2 }}>{v.students?.email||v.student_id}</p>
                      </td>
                      <td style={{ padding:"13px 20px", color:"rgba(255,255,255,.5)", fontSize:12 }}>
                        {(v.students?.college||"—").replace("College of Informatics and Computing Studies","CICS")}
                      </td>
                      <td style={{ padding:"13px 20px" }}>
                        {v.reason
                          ? <span style={{ background:rc.bg, color:rc.color, padding:"4px 10px", borderRadius:5, fontSize:12, fontWeight:700 }}>{v.reason}</span>
                          : <span style={{ color:"rgba(255,255,255,.2)", fontStyle:"italic" }}>—</span>
                        }
                      </td>
                      <td style={{ padding:"13px 20px", color:"rgba(255,255,255,.5)", fontSize:12, fontWeight:600 }}>{v.visit_date}</td>
                      <td style={{ padding:"13px 20px" }}>
                        <span style={{ background:"rgba(74,222,128,.08)", color:"#4ade80", padding:"4px 10px", borderRadius:5, fontSize:12, fontWeight:700 }}>
                          {v.visit_time?.slice(0,5)}
                        </span>
                      </td>
                      <td style={{ padding:"13px 20px" }}>
                        {v.time_out
                          ? <span style={{ background:"rgba(248,113,113,.08)", color:"#f87171", padding:"4px 10px", borderRadius:5, fontSize:12, fontWeight:700 }}>
                              {v.time_out?.slice(0,5)}
                            </span>
                          : <span style={{ color:"rgba(255,255,255,.2)", fontSize:12, fontStyle:"italic" }}>
                              {v.visit_status==="inside" ? "Inside" : "—"}
                            </span>
                        }
                      </td>
                      <td style={{ padding:"13px 20px" }}>
                        {(() => {
                          if(!v.time_out) return <span style={{ color:"rgba(255,255,255,.2)", fontSize:12 }}>—</span>;
                          const [h1,m1]=v.visit_time.split(":").map(Number);
                          const [h2,m2]=v.time_out.split(":").map(Number);
                          const diff=(h2*60+m2)-(h1*60+m1);
                          const hrs=Math.floor(diff/60); const mins=diff%60;
                          return <span style={{ fontSize:12, color:"rgba(255,255,255,.5)", fontWeight:600 }}>{hrs>0?`${hrs}h `:""}{mins}m</span>;
                        })()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   USER MANAGEMENT
══════════════════════════════════════ */
function UserManagementPage({ students, loading }: { students:Student[]; loading:boolean }) {
  const [search,   setSearch]   = useState("");
  const [fCollege, setFCollege] = useState("");
  const [fStatus,  setFStatus]  = useState("");
  const [sortBy,   setSortBy]   = useState("name");
  const [sortDir,  setSortDir]  = useState<"asc"|"desc">("asc");

  const toggleSort = (col: string) => {
    if(sortBy===col) setSortDir(d=>d==="asc"?"desc":"asc");
    else { setSortBy(col); setSortDir("asc"); }
  };

  const filtered = students
    .filter(s=>{
      const q = search.toLowerCase();
      const matchSearch = !search ||
        s.name?.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q) ||
        s.student_id?.toLowerCase().includes(q) ||
        s.college?.toLowerCase().includes(q);
      return matchSearch && (!fCollege||s.college===fCollege) && (!fStatus||s.employee_status===fStatus);
    })
    .sort((a,b)=>{
      const av = sortBy==="name"?a.name:sortBy==="student_id"?a.student_id:sortBy==="college"?a.college:a.employee_status;
      const bv = sortBy==="name"?b.name:sortBy==="student_id"?b.student_id:sortBy==="college"?b.college:b.employee_status;
      return sortDir==="asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    });

  const SortBtn = ({ col, label }: { col:string; label:string }) => (
    <button onClick={()=>toggleSort(col)} style={{ background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:4, fontSize:10, fontWeight:700, textTransform:"uppercase" as const, letterSpacing:".16em", color:sortBy===col?"#DAA520":"rgba(255,255,255,.28)", fontFamily:"'DM Sans',sans-serif", padding:0 }}>
      {label}
      <span style={{ fontSize:10, opacity:sortBy===col?1:.35 }}>{sortBy===col?(sortDir==="asc"?"↑":"↓"):"↕"}</span>
    </button>
  );

  const selStyle: React.CSSProperties = {
    height:40, padding:"0 14px", background:"#0d1f3e",
    border:"1px solid rgba(255,255,255,.15)", borderRadius:8,
    color:"rgba(255,255,255,.8)", fontSize:13, fontWeight:600,
    fontFamily:"'DM Sans',sans-serif", outline:"none", cursor:"pointer",
    colorScheme:"dark",
  };

  return (
    <div style={{ padding:"28px 32px", minHeight:"100vh" }}>
      <div style={{ marginBottom:24 }}>
        <p style={{ fontSize:11, fontWeight:700, letterSpacing:".28em", textTransform:"uppercase", color:"rgba(212,175,55,.6)", marginBottom:6 }}>Registry</p>
        <h1 style={{ fontSize:32, fontWeight:900, color:"#fff", fontFamily:"'Playfair Display',serif" }}>User Management</h1>
      </div>

      <div style={{ background:"#0d1f3e", border:"1px solid rgba(255,255,255,.07)", borderRadius:12, padding:"18px 20px", marginBottom:18 }}>
        <div style={{ position:"relative", marginBottom:14 }}>
          <span style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", fontSize:15, color:"rgba(255,255,255,.3)" }}>⌕</span>
          <input type="text" placeholder="Search by name, email, student number, or college…"
            value={search} onChange={e=>setSearch(e.target.value)}
            style={{ width:"100%", height:44, paddingLeft:42, paddingRight:18, background:"rgba(255,255,255,.05)", border:"1px solid rgba(255,255,255,.1)", borderRadius:9, color:"#fff", fontSize:14, fontFamily:"'DM Sans',sans-serif", outline:"none", transition:"border-color .2s" }}
            onFocus={e=>e.target.style.borderColor="rgba(212,175,55,.45)"}
            onBlur={e=>e.target.style.borderColor="rgba(255,255,255,.1)"}
          />
        </div>
        <div style={{ display:"flex", gap:10, alignItems:"center" }}>
          <select value={fCollege} onChange={e=>setFCollege(e.target.value)} style={selStyle}>
            <option value="">All Colleges</option>
            {COLLEGES.map(c=><option key={c} value={c}>{c.replace("College of ","")}</option>)}
          </select>
          <select value={fStatus} onChange={e=>setFStatus(e.target.value)} style={selStyle}>
            <option value="">All Types</option>
            {["Student","Faculty","Staff"].map(s=><option key={s} value={s}>{s}</option>)}
          </select>
          <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={selStyle}>
            <option value="name">Sort: Name</option>
            <option value="student_id">Sort: Student No.</option>
            <option value="college">Sort: College</option>
            <option value="employee_status">Sort: Type</option>
          </select>
          <button onClick={()=>setSortDir(d=>d==="asc"?"desc":"asc")}
            style={{ height:40, padding:"0 14px", background:"rgba(255,255,255,.05)", border:"1px solid rgba(255,255,255,.1)", borderRadius:8, color:"rgba(255,255,255,.6)", fontSize:13, fontWeight:700, fontFamily:"'DM Sans',sans-serif", cursor:"pointer" }}>
            {sortDir==="asc"?"↑ Asc":"↓ Desc"}
          </button>
          <span style={{ marginLeft:"auto", fontSize:12, color:"rgba(255,255,255,.35)", fontWeight:600 }}>{filtered.length} users</span>
        </div>
      </div>

      <div style={{ background:"#0d1f3e", border:"1px solid rgba(255,255,255,.07)", borderRadius:12, overflow:"hidden" }}>
        {loading ? (
          <div style={{ textAlign:"center", padding:"60px 20px", color:"rgba(255,255,255,.35)" }}>Loading users…</div>
        ) : (
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
              <thead>
                <tr style={{ borderBottom:"1px solid rgba(255,255,255,.07)", background:"rgba(255,255,255,.03)" }}>
                  <th style={{ padding:"13px 20px", textAlign:"left" }}><SortBtn col="name" label="Student" /></th>
                  <th style={{ padding:"13px 20px", textAlign:"left" }}><SortBtn col="student_id" label="Student No." /></th>
                  <th style={{ padding:"13px 20px", textAlign:"left" }}><SortBtn col="college" label="College" /></th>
                  <th style={{ padding:"13px 20px", textAlign:"left" }}><SortBtn col="employee_status" label="Type" /></th>
                  <th style={{ padding:"13px 20px", textAlign:"left", fontSize:10, fontWeight:700, textTransform:"uppercase" as const, letterSpacing:".16em", color:"rgba(255,255,255,.28)" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length===0 ? (
                  <tr><td colSpan={5} style={{ textAlign:"center", padding:"60px 20px", color:"rgba(255,255,255,.28)", fontSize:14 }}>No users match your filters</td></tr>
                ) : filtered.map(s=>{
                  const sc = STATUS_COLORS[s.employee_status]||STATUS_COLORS["Student"];
                  return (
                    <tr key={s.student_id} className="trow" style={{ borderBottom:"1px solid rgba(255,255,255,.04)" }}>
                      <td style={{ padding:"13px 20px" }}>
                        <p style={{ fontWeight:700, color:"#fff", fontSize:14 }}>{s.name}</p>
                        <p style={{ fontSize:11, color:"rgba(255,255,255,.35)", marginTop:2 }}>{s.email}</p>
                      </td>
                      <td style={{ padding:"13px 20px", color:"rgba(255,255,255,.5)", fontSize:12, fontWeight:600, fontFamily:"'Courier New',monospace" }}>{s.student_id}</td>
                      <td style={{ padding:"13px 20px", color:"rgba(255,255,255,.5)", fontSize:12 }}>
                        {s.college.replace("College of Informatics and Computing Studies","CICS")}
                      </td>
                      <td style={{ padding:"13px 20px" }}>
                        <span style={{ background:sc.bg, color:sc.color, padding:"4px 10px", borderRadius:5, fontSize:11, fontWeight:700 }}>{s.employee_status}</span>
                      </td>
                      <td style={{ padding:"13px 20px" }}>
                        <span style={{ display:"inline-flex", alignItems:"center", gap:5, background:"rgba(74,222,128,.08)", color:"#4ade80", padding:"4px 10px", borderRadius:5, fontSize:11, fontWeight:700 }}>
                          <span style={{ width:5, height:5, borderRadius:"50%", background:"#4ade80", display:"inline-block" }} />
                          Active
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
    </div>
  );
}