"use client";
// ============================================================
// NEU Library — Admin Dashboard
// src/app/admin/page.tsx
// ============================================================

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/app/lib/supabase";
import CollegeSearchDropdown from "@/app/components/CollegeSearchDropdown";
import { useTheme, getThemeColors } from "@/app/lib/themeContext";
import type { College, Program, HelpContent, LibrarySchedule } from "@/app/lib/types";

// ── Types ──
interface Visit {
  visit_id: string; student_id: string; reason: string | null;
  visit_date: string; visit_time: string; time_out: string | null;
  visit_status: string | null;
  students: {
    name: string; college: string; employee_status: string;
    email: string; year_level: number | null; program_id: number | null;
    photo_url?: string | null;
  };
}
interface Student {
  student_id: string; name: string; email: string; college: string;
  employee_status: string; is_blocked: boolean;
  program_id: number | null; year_level: number | null;
  photo_url?: string | null;
  programs?: { name: string; colleges: { code: string; name: string } };
}
interface LibraryStatus {
  is_open: boolean; opened_by: string | null; opened_at: string | null;
  closed_by: string | null; closed_at: string | null; schedule_note: string | null;
}
interface Theme {
  bg: string; sidebar: string; card: string; cardAlt: string;
  border: string; text: string; textMuted: string; textFaint: string;
  sidebarBorder: string; inputBg: string; inputBorder: string;
  tableRow: string; tableHeader: string; isDark: boolean;
  bgGradient?: string;
  glass?: { background: string; backdropFilter: string; border: string };
}

const REASONS = ["Studying","Borrowing Books","Research","Group Work","Printing"];
const REASON_COLORS: Record<string,{color:string;bg:string}> = {
  "Studying":        { color:"#93C5FD", bg:"rgba(147,197,253,.12)" },
  "Borrowing Books": { color:"#6EE7B7", bg:"rgba(110,231,183,.12)" },
  "Research":        { color:"#C4B5FD", bg:"rgba(196,181,253,.12)" },
  "Group Work":      { color:"#FCD34D", bg:"rgba(252,211,77,.12)"  },
  "Printing":        { color:"#F9A8D4", bg:"rgba(249,168,212,.12)" },
};
const YEAR_LABELS: Record<number,string> = {1:"1st Year",2:"2nd Year",3:"3rd Year",4:"4th Year",5:"5th Year"};
const EASE: [number,number,number,number] = [0.22,1,0.36,1];

const NAV_ITEMS = [
  { id:"dashboard", icon:"▣", label:"Dashboard"       },
  { id:"logs",      icon:"≡", label:"Visitor Logs"    },
  { id:"users",     icon:"◎", label:"User Management" },
  { id:"schedule",  icon:"◷", label:"Schedule"        },
  { id:"help",      icon:"◈", label:"Help Content"    },
  { id:"settings",  icon:"◉", label:"Settings"        },
];

const fmt12 = (iso: string | null) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-PH",{hour:"2-digit",minute:"2-digit",hour12:true});
};
const fmtDate = (iso: string | null) => {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-PH",{month:"short",day:"numeric"});
};
const shortCollege = (college: string) => {
  if (!college) return "—";
  const parts = college.split(" — ");
  return parts.length > 1 ? `${parts[0]} — ${parts[1].replace("College of ","").replace("School of ","")}` : college;
};

// ── Library Status Toggle ──
function LibraryStatusToggle({ adminEmail, theme }: { adminEmail: string; theme: Theme }) {
  const [status,   setStatus]   = useState<LibraryStatus|null>(null);
  const [toggling, setToggling] = useState(false);

  const fetchStatus = useCallback(async () => {
    const { data } = await supabase.from("library_status").select("*").eq("id",1).single();
    if (data) setStatus(data as LibraryStatus);
  }, []);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  const toggle = async () => {
    if (!status || toggling) return;
    setToggling(true);
    const nowISO = new Date().toISOString();
    const opening = !status.is_open;
    await supabase.from("library_status").update(
      opening ? { is_open:true, opened_by:adminEmail, opened_at:nowISO }
              : { is_open:false, closed_by:adminEmail, closed_at:nowISO }
    ).eq("id",1);
    await supabase.from("library_schedule_log").insert({
      action: opening ? "opened" : "closed",
      done_by: adminEmail,
      note: opening ? "Library opened by admin" : "Library closed by admin",
    });
    await fetchStatus();
    setToggling(false);
  };

  if (!status) return <div style={{padding:"12px 14px"}}><p style={{fontSize:11,color:theme.textFaint}}>Loading…</p></div>;

  return (
    <div style={{padding:"14px",borderTop:`1px solid ${theme.border}`,borderBottom:`1px solid ${theme.border}`}}>
      <p style={{fontSize:10,fontWeight:700,letterSpacing:".18em",textTransform:"uppercase",color:theme.textFaint,marginBottom:10}}>Library Status</p>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
        <span style={{width:8,height:8,borderRadius:"50%",background:status.is_open?"#4ade80":"#f87171",display:"inline-block",flexShrink:0}}/>
        <p style={{fontSize:15,fontWeight:800,color:status.is_open?"#4ade80":"#f87171"}}>{status.is_open?"OPEN":"CLOSED"}</p>
      </div>
      <div style={{marginBottom:12,paddingLeft:2}}>
        {status.is_open && status.opened_by && (
          <div>
            <p style={{fontSize:10,color:theme.textFaint}}>Opened by</p>
            <p style={{fontSize:11,fontWeight:600,color:theme.textMuted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:170}}>{status.opened_by.split("@")[0]}</p>
            <p style={{fontSize:10,color:theme.textFaint,marginTop:1}}>{fmtDate(status.opened_at)} · {fmt12(status.opened_at)}</p>
          </div>
        )}
        {!status.is_open && status.closed_by && (
          <div>
            <p style={{fontSize:10,color:theme.textFaint}}>Closed by</p>
            <p style={{fontSize:11,fontWeight:600,color:theme.textMuted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:170}}>{status.closed_by.split("@")[0]}</p>
            <p style={{fontSize:10,color:theme.textFaint,marginTop:1}}>{fmtDate(status.closed_at)} · {fmt12(status.closed_at)}</p>
          </div>
        )}
      </div>
      <button onClick={toggle} disabled={toggling} style={{
        width:"100%",height:36,
        background:status.is_open?"rgba(248,113,113,.1)":"rgba(74,222,128,.1)",
        border:`1px solid ${status.is_open?"rgba(248,113,113,.3)":"rgba(74,222,128,.3)"}`,
        borderRadius:8,fontSize:12,fontWeight:700,fontFamily:"'DM Sans',sans-serif",
        color:status.is_open?"#f87171":"#4ade80",
        cursor:toggling?"not-allowed":"pointer",opacity:toggling?.6:1,
        display:"flex",alignItems:"center",justifyContent:"center",gap:6,
      }}>
        {toggling?"Updating…":status.is_open?"✕ Close Library":"✓ Open Library"}
      </button>
    </div>
  );
}

// ── Inside Card ──
function InsideCard({ visit, onTerminate, theme }: { visit:Visit; onTerminate:()=>void; theme:Theme }) {
  const [terminating, setTerminating] = useState(false);
  const [confirm,     setConfirm]     = useState(false);
  const handleTerminate = async () => {
    setTerminating(true); await onTerminate(); setTerminating(false); setConfirm(false);
  };
  return (
    <div style={{background:theme.cardAlt,border:`1px solid ${theme.border}`,borderRadius:12,padding:"12px 14px",display:"flex",alignItems:"center",gap:12,minWidth:220}}>
      <div style={{width:32,height:32,borderRadius:"50%",background:"linear-gradient(135deg,#0f2040,#1E3A8A)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:800,fontSize:12,flexShrink:0,overflow:"hidden"}}>
        {visit.students?.photo_url
          ? <Image src={visit.students.photo_url} alt={visit.students?.name||""} width={32} height={32} style={{width:"100%",height:"100%",objectFit:"cover"}} referrerPolicy="no-referrer"/>
          : visit.students?.name?.charAt(0)||"?"
        }
      </div>
      <div style={{flex:1,minWidth:0}}>
        <p style={{fontSize:13,fontWeight:700,color:theme.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{visit.students?.name||"—"}</p>
        <p style={{fontSize:11,color:theme.textMuted,marginTop:1}}>In at {visit.visit_time?.slice(0,5)}</p>
      </div>
      {confirm ? (
        <div style={{display:"flex",gap:5,flexShrink:0}}>
          <button onClick={handleTerminate} disabled={terminating}
            style={{padding:"5px 10px",background:"rgba(248,113,113,.15)",border:"1px solid rgba(248,113,113,.4)",borderRadius:7,color:"#f87171",fontSize:11,fontWeight:700,fontFamily:"'DM Sans',sans-serif",cursor:terminating?"not-allowed":"pointer",opacity:terminating?.6:1}}>
            {terminating?"…":"Yes"}
          </button>
          <button onClick={()=>setConfirm(false)}
            style={{padding:"5px 10px",background:theme.inputBg,border:`1px solid ${theme.border}`,borderRadius:7,color:theme.textMuted,fontSize:11,fontWeight:700,fontFamily:"'DM Sans',sans-serif",cursor:"pointer"}}>No</button>
        </div>
      ) : (
        <button onClick={()=>setConfirm(true)}
          style={{padding:"5px 12px",background:"rgba(248,113,113,.08)",border:"1px solid rgba(248,113,113,.2)",borderRadius:7,color:"#f87171",fontSize:11,fontWeight:700,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",flexShrink:0,whiteSpace:"nowrap"}}
          onMouseEnter={e=>(e.currentTarget.style.background="rgba(248,113,113,.18)")}
          onMouseLeave={e=>(e.currentTarget.style.background="rgba(248,113,113,.08)")}>
          End Session
        </button>
      )}
    </div>
  );
}

// ── Donut Chart ──
function DonutChart({ data, colors, theme }: { data:[string,number][]; colors:string[]; theme:Theme }) {
  const total = data.reduce((s,[,v])=>s+v,0);
  if (!total) return <div style={{width:110,height:110,borderRadius:"50%",background:theme.inputBg}}/>;
  let cum = 0;
  const segs = data.map(([,v],i)=>{ const pct=(v/total)*100; const s=cum; cum+=pct; return {pct,s,color:colors[i%colors.length]}; });
  return (
    <div style={{position:"relative",width:110,height:110,flexShrink:0}}>
      <div style={{width:110,height:110,borderRadius:"50%",background:`conic-gradient(${segs.map(s=>`${s.color} ${s.s}% ${s.s+s.pct}%`).join(",")})`}}/>
      <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:58,height:58,borderRadius:"50%",background:theme.card,display:"flex",alignItems:"center",justifyContent:"center"}}>
        <p style={{fontSize:16,fontWeight:900,color:theme.text,fontFamily:"'Playfair Display',serif"}}>{total}</p>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// MAIN ADMIN PAGE
// ══════════════════════════════════════════════════════════
export default function AdminPage() {
  const router = useRouter();
  const { mode, setTheme } = useTheme();
  const [visits,      setVisits]      = useState<Visit[]>([]);
  const [students,    setStudents]    = useState<Student[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [activePage,  setActivePage]  = useState("dashboard");
  const [adminEmail,  setAdminEmail]  = useState("admin@neu.edu.ph");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [textSize,   setTextSize]   = useState<"small"|"medium"|"large">("medium");

  useEffect(() => {
    fetchAll();
    const cookie = document.cookie.split(";").find(c=>c.trim().startsWith("user_email="));
    if (cookie) setAdminEmail(decodeURIComponent(cookie.split("=")[1].trim()));
    const savedSize = localStorage.getItem("admin_text_size");
    if (savedSize) setTextSize(savedSize as "small"|"medium"|"large");
  }, []);

  const fetchAll = async () => {
    const { data: v } = await supabase.from("library_visits")
      .select("*, students(name,college,employee_status,email,year_level,program_id,photo_url)")
      .order("visit_date",{ascending:false}).order("visit_time",{ascending:false});
    if (v) setVisits(v as Visit[]);
    const { data: s } = await supabase.from("students")
      .select("*, programs(name,colleges(code,name))").order("name");
    if (s) setStudents(s as Student[]);
    setLoading(false);
  };

  const today      = new Date().toISOString().split("T")[0];
  const weekAgo    = new Date(Date.now()-7*86400000).toISOString().split("T")[0];
  const monthStart = new Date(new Date().getFullYear(),new Date().getMonth(),1).toISOString().split("T")[0];
  const yearStart  = new Date(new Date().getFullYear(),0,1).toISOString().split("T")[0];
  const cntToday   = visits.filter(v=>v.visit_date===today).length;
  const cntWeek    = visits.filter(v=>v.visit_date>=weekAgo).length;
  const cntMonth   = visits.filter(v=>v.visit_date>=monthStart).length;
  const cntYear    = visits.filter(v=>v.visit_date>=yearStart).length;

  const THEME: Theme = getThemeColors(mode === "dark");

  const sidebarBtnBase: React.CSSProperties = {
    width:"100%",display:"flex",alignItems:"center",gap:12,padding:"11px 16px",
    borderRadius:8,border:"none",cursor:"pointer",fontSize:14,fontWeight:600,
    fontFamily:"'DM Sans',sans-serif",textAlign:"left",transition:"all .18s",
    position:"relative",marginBottom:2,
  };

  const signOut = () => {
    document.cookie="user_email=; path=/; max-age=0";
    document.cookie="active_role=; path=/; max-age=0";
    router.push("/kiosk");
  };

  // Find admin photo from students list
  const adminPhoto = students.find(s=>s.email===adminEmail)?.photo_url;

  return (
    <div style={{minHeight:"100vh",display:"flex",fontFamily:"'DM Sans',sans-serif",background:THEME.bg,color:THEME.text,transition:"background .4s ease, color .3s ease"}} className={`admin-text-${textSize}`}>

      {/* ── SIDEBAR (desktop) ── */}
      <div className="admin-sidebar" style={{width:230,flexShrink:0,background:THEME.sidebar,borderRight:`1px solid ${THEME.sidebarBorder}`,display:"flex",flexDirection:"column",position:"sticky",top:0,height:"100vh",boxShadow:THEME.isDark?"none":"2px 0 12px rgba(0,0,0,.06)",transition:"background .4s ease, border-color .4s ease"}}>
        {/* Logo */}
        <div style={{padding:"20px 18px 16px",borderBottom:`1px solid ${THEME.border}`}}>
          <div style={{display:"flex",alignItems:"center",gap:11}}>
            <div style={{width:38,height:38,borderRadius:"50%",border:"1px solid rgba(212,175,55,.3)",padding:4,flexShrink:0}}>
              <Image src="/neu-library-logo.png" alt="NEU" width={38} height={38} style={{width:"100%",height:"100%",objectFit:"contain",borderRadius:"50%"}}/>
            </div>
            <div>
              <p style={{fontSize:12,fontWeight:800,color:THEME.text,lineHeight:1.2,letterSpacing:".04em"}}>NEW ERA UNIVERSITY</p>
              <p style={{fontSize:10,color:THEME.textFaint,letterSpacing:".08em"}}>Library Management</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <div style={{padding:"16px 12px",flex:1,overflowY:"auto"}}>
          <p style={{fontSize:10,fontWeight:700,letterSpacing:".2em",textTransform:"uppercase",color:THEME.textFaint,marginBottom:10,paddingLeft:6}}>Navigation</p>
          {NAV_ITEMS.map(item=>(
            <button key={item.id} onClick={()=>setActivePage(item.id)} style={{
              ...sidebarBtnBase,
              background:activePage===item.id?"rgba(212,175,55,.08)":"transparent",
              color:activePage===item.id?"#DAA520":THEME.textMuted,
            }}>
              {activePage===item.id&&<div style={{position:"absolute",left:0,top:6,bottom:6,width:3,background:"#DAA520",borderRadius:"0 2px 2px 0"}}/>}
              <span style={{fontSize:15,paddingLeft:activePage===item.id?4:0}}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        <LibraryStatusToggle adminEmail={adminEmail} theme={THEME}/>

        {/* Admin info */}
        <div style={{padding:"14px 16px",borderTop:`1px solid ${THEME.border}`}}>
          <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:THEME.cardAlt,border:`1px solid ${THEME.border}`,borderRadius:10,marginBottom:10}}>
            {/* ── Admin photo — shows Google photo if available ── */}
            <div style={{width:32,height:32,borderRadius:"50%",background:"linear-gradient(135deg,#B8860B,#DAA520)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:800,fontSize:13,flexShrink:0,overflow:"hidden"}}>
              {adminPhoto
                ? <Image src={adminPhoto} alt="Admin" width={32} height={32} style={{width:"100%",height:"100%",objectFit:"cover"}} referrerPolicy="no-referrer"/>
                : adminEmail.charAt(0).toUpperCase()
              }
            </div>
            <div style={{minWidth:0}}>
              <p style={{fontSize:12,fontWeight:700,color:THEME.text,lineHeight:1.2}}>Administrator</p>
              <p style={{fontSize:10,color:THEME.textFaint,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{adminEmail}</p>
              <span style={{fontSize:9,fontWeight:800,color:"#DAA520",letterSpacing:".1em"}}>ADMIN</span>
            </div>
          </div>
          <button onClick={signOut}
            style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:7,padding:"8px",background:"rgba(248,113,113,.07)",border:"1px solid rgba(248,113,113,.15)",borderRadius:8,color:"#f87171",fontSize:12,fontWeight:700,fontFamily:"'DM Sans',sans-serif",cursor:"pointer"}}
            onMouseEnter={e=>(e.currentTarget.style.background="rgba(248,113,113,.13)")}
            onMouseLeave={e=>(e.currentTarget.style.background="rgba(248,113,113,.07)")}>
            ← Sign Out
          </button>
        </div>
      </div>

      {/* ── MOBILE HEADER ── */}
      <div className="admin-mobile-header" style={{display:"none",position:"fixed",top:0,left:0,right:0,height:56,background:THEME.sidebar,borderBottom:`1px solid ${THEME.sidebarBorder}`,zIndex:100,alignItems:"center",justifyContent:"space-between",padding:"0 16px"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:32,height:32,borderRadius:"50%",border:"1px solid rgba(212,175,55,.3)",padding:3}}>
            <Image src="/neu-library-logo.png" alt="NEU" width={32} height={32} style={{width:"100%",height:"100%",objectFit:"contain",borderRadius:"50%"}}/>
          </div>
          <p style={{fontSize:14,fontWeight:800,color:THEME.text}}>{NAV_ITEMS.find(n=>n.id===activePage)?.label||"Dashboard"}</p>
        </div>
        <button onClick={()=>setMobileNavOpen(!mobileNavOpen)}
          style={{background:THEME.cardAlt,border:`1px solid ${THEME.border}`,borderRadius:8,padding:"8px 12px",color:THEME.text,fontSize:16,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>
          ☰
        </button>
      </div>

      {/* Mobile Nav Drawer */}
      <AnimatePresence>
        {mobileNavOpen && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            onClick={()=>setMobileNavOpen(false)}
            style={{position:"fixed",inset:0,background:"rgba(0,0,0,.6)",zIndex:200,display:"none"}}
            className="mobile-overlay">
            <motion.div initial={{x:-280}} animate={{x:0}} exit={{x:-280}} transition={{ease:EASE}}
              onClick={e=>e.stopPropagation()}
              style={{width:280,height:"100%",background:THEME.sidebar,padding:"24px 16px",display:"flex",flexDirection:"column",gap:4}}>
              <p style={{fontSize:10,fontWeight:700,letterSpacing:".2em",textTransform:"uppercase",color:THEME.textFaint,marginBottom:10,paddingLeft:6}}>Navigation</p>
              {NAV_ITEMS.map(item=>(
                <button key={item.id} onClick={()=>{setActivePage(item.id);setMobileNavOpen(false);}}
                  style={{...sidebarBtnBase,background:activePage===item.id?"rgba(212,175,55,.08)":"transparent",color:activePage===item.id?"#DAA520":THEME.textMuted}}>
                  <span style={{fontSize:15}}>{item.icon}</span><span>{item.label}</span>
                </button>
              ))}
              <div style={{marginTop:"auto"}}>
                <LibraryStatusToggle adminEmail={adminEmail} theme={THEME}/>
                {/* Mobile admin info with photo */}
                <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:THEME.cardAlt,border:`1px solid ${THEME.border}`,borderRadius:10,margin:"8px 0"}}>
                  <div style={{width:32,height:32,borderRadius:"50%",background:"linear-gradient(135deg,#B8860B,#DAA520)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:800,fontSize:13,flexShrink:0,overflow:"hidden"}}>
                    {adminPhoto
                      ? <Image src={adminPhoto} alt="Admin" width={32} height={32} style={{width:"100%",height:"100%",objectFit:"cover"}} referrerPolicy="no-referrer"/>
                      : adminEmail.charAt(0).toUpperCase()
                    }
                  </div>
                  <div style={{minWidth:0}}>
                    <p style={{fontSize:12,fontWeight:700,color:THEME.text,lineHeight:1.2}}>Administrator</p>
                    <p style={{fontSize:10,color:THEME.textFaint,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{adminEmail}</p>
                  </div>
                </div>
                <button onClick={signOut}
                  style={{width:"100%",padding:"10px",background:"rgba(248,113,113,.07)",border:"1px solid rgba(248,113,113,.15)",borderRadius:8,color:"#f87171",fontSize:13,fontWeight:700,fontFamily:"'DM Sans',sans-serif",cursor:"pointer"}}>
                  ← Sign Out
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MAIN CONTENT ── */}
      <div className="admin-main" style={{flex:1,overflow:"auto"}}>
        {activePage==="dashboard" && <DashboardPage visits={visits} loading={loading} today={today} weekAgo={weekAgo} monthStart={monthStart} yearStart={yearStart} cntToday={cntToday} cntWeek={cntWeek} cntMonth={cntMonth} cntYear={cntYear} onRefresh={fetchAll} theme={THEME}/>}
        {activePage==="logs"      && <VisitorLogsPage visits={visits} loading={loading} theme={THEME}/>}
        {activePage==="users"     && <UserManagementPage students={students} loading={loading} onRefresh={fetchAll} theme={THEME}/>}
        {activePage==="schedule"  && <SchedulePage theme={THEME}/>}
        {activePage==="help"      && <HelpManagementPage theme={THEME}/>}
        {activePage==="settings"  && <SettingsPage darkMode={mode==="dark"} textSize={textSize} theme={THEME} onDarkMode={(v)=>{setTheme(v?"dark":"light");}} onTextSize={(v)=>{setTextSize(v);localStorage.setItem("admin_text_size",v);}}/>}
      </div>

     <style>{`
        @media(max-width:900px){
          .admin-sidebar { display: none !important; }
          .admin-mobile-header { display: flex !important; }
          .mobile-overlay { display: block !important; }
          .admin-main { padding-top: 56px; }
          .admin-page-wrap { padding: 16px !important; }
          .stat-grid-1 { grid-template-columns: repeat(2,1fr) !important; }
          .stat-grid-2 { grid-template-columns: repeat(2,1fr) !important; }
        }
        @media(max-width:480px){
          .stat-grid-1 { grid-template-columns: 1fr 1fr !important; }
          .stat-grid-2 { grid-template-columns: 1fr 1fr !important; }
        }
        .trow:hover { background: rgba(212,175,55,.04) !important; }
        .admin-text-small * { font-size: 92% !important; }
        .admin-text-large * { font-size: 104% !important; }
        .admin-main > div { transition: background 0.4s ease, color 0.3s ease; }
        .admin-main * { transition: background 0.4s ease, border-color 0.4s ease, color 0.3s ease; }
      `}</style>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// DASHBOARD PAGE
// ══════════════════════════════════════════════════════════
function DashboardPage({ visits, loading, today, weekAgo, monthStart, yearStart, cntToday, cntWeek, cntMonth, cntYear, onRefresh, theme }: {
  visits:Visit[]; loading:boolean; today:string; weekAgo:string; monthStart:string; yearStart:string;
  cntToday:number; cntWeek:number; cntMonth:number; cntYear:number; onRefresh:()=>void; theme:Theme;
}) {
  const [period, setPeriod] = useState("month");
  const [drillDown, setDrillDown] = useState<{title:string;items:{name:string;detail:string;time:string}[];color:string}|null>(null);

  const filtered = visits.filter(v =>
    period==="today"?v.visit_date===today:period==="week"?v.visit_date>=weekAgo:period==="month"?v.visit_date>=monthStart:period==="year"?v.visit_date>=yearStart:true
  );
  const collegeMap: Record<string,number> = {};
  filtered.forEach(v=>{ const c=v.students?.college||"Unknown"; collegeMap[c]=(collegeMap[c]||0)+1; });
  const collegeData = Object.entries(collegeMap).sort((a,b)=>b[1]-a[1]);
  const reasonMap: Record<string,number> = {};
  filtered.forEach(v=>{ if(v.reason) reasonMap[v.reason]=(reasonMap[v.reason]||0)+1; });
  const reasonData = Object.entries(reasonMap).sort((a,b)=>b[1]-a[1]);
  const dailyMap: Record<string,number> = {};
  for(let i=13;i>=0;i--){ const d=new Date(); d.setDate(d.getDate()-i); dailyMap[d.toISOString().split("T")[0]]=0; }
  visits.forEach(v=>{ if(dailyMap[v.visit_date]!==undefined) dailyMap[v.visit_date]++; });
  const dailyData = Object.entries(dailyMap).map(([date,count])=>({date:date.slice(5),count}));
  const maxDaily  = Math.max(...dailyData.map(d=>d.count),1);
  const COLORS    = ["#DAA520","#93C5FD","#6EE7B7","#C4B5FD","#F9A8D4","#FCD34D"];
  const inside    = visits.filter(v=>v.visit_status==="inside"&&v.visit_date===today);

  const exportCSV = () => {
    const headers = ["Visit ID","Student ID","Name","Email","College","Reason","Visit Date","Time In","Time Out"];
    const rows = visits.map(v=>[v.visit_id,v.student_id,v.students?.name||"",v.students?.email||"",v.students?.college||"",v.reason||"",v.visit_date,v.visit_time,v.time_out||""]);
    const csv = [headers,...rows].map(r=>r.map(c=>`"${c}"`).join(",")).join("\n");
    const a = document.createElement("a"); a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"})); a.download=`NEU-Library-Visits-${today}.csv`; a.click();
  };

  return (
    <div style={{padding:"28px 32px",minHeight:"100vh",background:theme.bg,color:theme.text}}>
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:28,flexWrap:"wrap",gap:12}}>
        <div>
          <p style={{fontSize:11,fontWeight:700,letterSpacing:".28em",textTransform:"uppercase",color:"rgba(212,175,55,.6)",marginBottom:6}}>NEU Library Management System</p>
          <h1 style={{fontSize:32,fontWeight:900,color:theme.text,fontFamily:"'Playfair Display',serif",lineHeight:1.1}}>Visitor Dashboard</h1>
        </div>
        <button onClick={exportCSV}
          style={{display:"flex",alignItems:"center",gap:8,padding:"10px 20px",background:"transparent",border:"1px solid rgba(212,175,55,.35)",borderRadius:10,color:"#DAA520",fontSize:13,fontWeight:700,fontFamily:"'DM Sans',sans-serif",cursor:"pointer"}}
          onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.background="rgba(212,175,55,.08)";}}
          onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.background="transparent";}}>
          ↓ Export CSV
        </button>
      </div>

      {/* Period filter */}
      <div style={{display:"flex",gap:6,marginBottom:24,flexWrap:"wrap"}}>
        {[["today","Today"],["week","This Week"],["month","This Month"],["year","This Year"]].map(([val,label])=>(
          <button key={val} onClick={()=>setPeriod(val)}
            style={{padding:"8px 18px",borderRadius:8,border:"1px solid",fontSize:13,fontWeight:600,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",transition:"all .18s",
              background:period===val?"rgba(212,175,55,.12)":"transparent",
              color:period===val?"#DAA520":theme.textMuted,
              borderColor:period===val?"rgba(212,175,55,.4)":theme.border}}>
            {label}
          </button>
        ))}
      </div>

      {/* Stat cards row 1 */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10,marginBottom:24}} className="stat-grid-1">
        {[
          {label:"Today",val:cntToday,sub:today,hi:false},
          {label:"This Week",val:cntWeek,sub:"Last 7 days",hi:false},
          {label:"This Month",val:cntMonth,sub:new Date().toLocaleString("default",{month:"long"}),hi:false},
          {label:"This Year",val:cntYear,sub:new Date().getFullYear().toString(),hi:false},
          {label:"Currently Inside",val:inside.length,sub:"Active now",hi:true},
        ].map(c=>(
          <motion.div key={c.label} whileHover={{y:-2}} transition={{duration:.18}}
            style={{background:c.hi?theme.isDark?"linear-gradient(145deg,#0d1f3e,#162d55)":theme.card:theme.card,borderStyle:"solid",borderWidth:"2px 1px 1px 1px",borderColor:c.hi?`#DAA520 rgba(212,175,55,.25) rgba(212,175,55,.25) rgba(212,175,55,.25)`:`rgba(212,175,55,.25) ${theme.border} ${theme.border} ${theme.border}`,borderRadius:12,padding:"20px 18px",boxShadow:theme.isDark?"none":"0 2px 8px rgba(0,0,0,.06)"}}>
            <p style={{fontSize:40,fontWeight:900,color:c.hi?"#DAA520":theme.text,fontFamily:"'Playfair Display',serif",lineHeight:1,marginBottom:8}}>{c.val}</p>
            <p style={{fontSize:13,fontWeight:700,color:c.hi?"rgba(212,175,55,.8)":theme.textMuted,marginBottom:3}}>{c.label}</p>
            <p style={{fontSize:10,color:theme.textFaint,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Stat cards row 2 (drill-down) */}
      {(()=>{
        const uniqueToday = [...new Set(visits.filter(v=>v.visit_date===today).map(v=>v.student_id))].length;
        const uniqueMonth = [...new Set(visits.filter(v=>v.visit_date>=monthStart).map(v=>v.student_id))].length;
        const totalUnique = [...new Set(visits.map(v=>v.student_id))].length;
        const done = visits.filter(v=>v.time_out&&v.visit_time);
        const positiveDurations = done.map(v=>{
          const [h1,m1,s1]=(v.visit_time||"00:00:00").split(":").map(Number);
          const [h2,m2,s2]=(v.time_out||"00:00:00").split(":").map(Number);
          return (h2*3600+m2*60+(s2||0)) - (h1*3600+m1*60+(s1||0));
        }).filter(d=>d>0);
        const avgSecs = positiveDurations.length ? Math.round(positiveDurations.reduce((a,b)=>a+b,0)/positiveDurations.length) : 0;
        const avgHrs=Math.floor(avgSecs/3600); const avgMins=Math.floor((avgSecs%3600)/60);
        const avgStr = avgSecs>0?(avgHrs>0?`${avgHrs}h ${avgMins}m`:`${avgMins}m`):"—";
        const reasonMap2:Record<string,number>={};
        visits.forEach(v=>{if(v.reason)reasonMap2[v.reason]=(reasonMap2[v.reason]||0)+1;});
        const topPurpose = Object.entries(reasonMap2).sort((a,b)=>b[1]-a[1])[0]?.[0]||"—";
        const completionRate = visits.length?Math.round((visits.filter(v=>v.time_out).length/visits.length)*100):0;

        const row2Cards = [
          {label:"Unique Today",val:uniqueToday,sub:"Distinct students",color:"#93C5FD",drillTitle:"Unique Visitors Today",
            drill:visits.filter(v=>v.visit_date===today).filter((v,i,arr)=>arr.findIndex(x=>x.student_id===v.student_id)===i).map(v=>({name:v.students?.name||"—",detail:v.students?.college||"—",time:v.visit_time?.slice(0,5)}))},
          {label:"Unique This Month",val:uniqueMonth,sub:"Distinct students",color:"#6EE7B7",drillTitle:"Unique Visitors This Month",
            drill:visits.filter(v=>v.visit_date>=monthStart).filter((v,i,arr)=>arr.findIndex(x=>x.student_id===v.student_id)===i).map(v=>({name:v.students?.name||"—",detail:v.students?.college||"—",time:v.visit_date}))},
          {label:"Total Unique Users",val:totalUnique,sub:"All time visitors",color:"#C4B5FD",drillTitle:"All Time Unique Visitors",
            drill:visits.filter((v,i,arr)=>arr.findIndex(x=>x.student_id===v.student_id)===i).map(v=>({name:v.students?.name||"—",detail:v.students?.college||"—",time:`${visits.filter(x=>x.student_id===v.student_id).length} visits`}))},
          {label:"Avg Visit Duration",val:avgStr,sub:`From ${positiveDurations.length} completed visits`,color:"#FCD34D",drillTitle:"Completed Visit Durations",
            drill:done.filter((_,i)=>positiveDurations[i]>0).slice(0,20).map(v=>{
              const[h1,m1,s1]=(v.visit_time||"00:00:00").split(":").map(Number);
              const[h2,m2,s2]=(v.time_out||"00:00:00").split(":").map(Number);
              const secs=(h2*3600+m2*60+(s2||0))-(h1*3600+m1*60+(s1||0));
              const hrs=Math.floor(secs/3600); const mins=Math.floor((secs%3600)/60);
              return({name:v.students?.name||"—",detail:v.visit_date,time:hrs>0?`${hrs}h ${mins}m`:`${mins}m`});
            })},
          {label:"Top Purpose",val:topPurpose,sub:`${reasonMap2[topPurpose]||0} visits`,color:"#F9A8D4",drillTitle:`Visitors — ${topPurpose}`,
            drill:visits.filter(v=>v.reason===topPurpose).slice(0,20).map(v=>({name:v.students?.name||"—",detail:v.reason||"—",time:v.visit_date}))},
          {label:"Completion Rate",val:`${completionRate}%`,sub:"Checked out properly",color:"#4ade80",drillTitle:"Completed Check-outs",
            drill:visits.filter(v=>v.time_out).slice(0,20).map(v=>({name:v.students?.name||"—",detail:v.visit_date,time:`${v.visit_time?.slice(0,5)} → ${v.time_out?.slice(0,5)}`}))},
        ];

        return (
          <>
            <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:10,marginBottom:24}} className="stat-grid-2">
              {row2Cards.map(c=>(
                <motion.div key={c.label}
                  whileHover={{y:-3,boxShadow:`0 8px 32px ${c.color}20`}} whileTap={{scale:.97}} transition={{duration:.18}}
                  onClick={()=>setDrillDown({title:c.drillTitle,items:c.drill,color:c.color})}
                  style={{background:theme.card,borderStyle:"solid",borderWidth:"2px 1px 1px 1px",borderColor:`${c.color} ${theme.border} ${theme.border} ${theme.border}`,borderRadius:12,padding:"18px 16px",cursor:"pointer",position:"relative",overflow:"hidden",boxShadow:theme.isDark?"none":"0 2px 8px rgba(0,0,0,.06)"}}>
                  <div style={{position:"absolute",top:-20,right:-20,width:60,height:60,borderRadius:"50%",background:c.color,opacity:.06,filter:"blur(20px)",pointerEvents:"none"}}/>
                  <p style={{fontSize:typeof c.val==="string"&&c.val.length>5?18:30,fontWeight:900,color:c.color,fontFamily:"'Playfair Display',serif",lineHeight:1,marginBottom:8}}>{c.val}</p>
                  <p style={{fontSize:12,fontWeight:700,color:theme.textMuted,marginBottom:3}}>{c.label}</p>
                  <p style={{fontSize:10,color:theme.textFaint}}>{c.sub}</p>
                  <p style={{position:"absolute",bottom:10,right:12,fontSize:9,color:`${c.color}60`,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase"}}>View →</p>
                </motion.div>
              ))}
            </div>

            <AnimatePresence>
              {drillDown && (
                <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
                  onClick={()=>setDrillDown(null)}
                  style={{position:"fixed",inset:0,zIndex:300,background:"rgba(6,13,26,.85)",backdropFilter:"blur(12px)",display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
                  <motion.div initial={{opacity:0,scale:.92,y:24}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:.92,y:24}}
                    transition={{duration:.35,ease:[0.22,1,0.36,1]}} onClick={e=>e.stopPropagation()}
                    style={{width:"100%",maxWidth:560,background:theme.card,border:`1px solid ${drillDown.color}30`,borderTop:`2px solid ${drillDown.color}`,borderRadius:20,padding:"24px",boxShadow:"0 24px 80px rgba(0,0,0,.6)",maxHeight:"75vh",display:"flex",flexDirection:"column"}}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}>
                      <h3 style={{fontSize:18,fontWeight:900,color:theme.text,fontFamily:"'Playfair Display',serif"}}>{drillDown.title}</h3>
                      <button onClick={()=>setDrillDown(null)}
                        style={{background:theme.inputBg,border:`1px solid ${theme.border}`,borderRadius:8,color:theme.textMuted,fontSize:16,cursor:"pointer",width:34,height:34,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'DM Sans',sans-serif"}}>✕</button>
                    </div>
                    <div style={{overflowY:"auto",display:"flex",flexDirection:"column",gap:8}}>
                      {drillDown.items.length===0?(
                        <p style={{textAlign:"center",color:theme.textFaint,padding:"40px 0",fontSize:14}}>No data available</p>
                      ):drillDown.items.map((item,i)=>(
                        <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",background:theme.inputBg,border:`1px solid ${theme.border}`,borderRadius:10}}>
                          <div style={{width:32,height:32,borderRadius:"50%",background:`${drillDown.color}20`,border:`1px solid ${drillDown.color}40`,display:"flex",alignItems:"center",justifyContent:"center",color:drillDown.color,fontWeight:800,fontSize:12,flexShrink:0}}>
                            {item.name.charAt(0)}
                          </div>
                          <div style={{flex:1,minWidth:0}}>
                            <p style={{fontSize:13,fontWeight:700,color:theme.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.name}</p>
                            <p style={{fontSize:11,color:theme.textMuted,marginTop:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.detail}</p>
                          </div>
                          <span style={{fontSize:11,fontWeight:700,color:drillDown.color,flexShrink:0}}>{item.time}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        );
      })()}

      {/* Currently inside */}
      {inside.length>0 && (
        <div style={{background:theme.card,border:"1px solid rgba(74,222,128,.2)",borderTop:"2px solid #4ade80",borderRadius:12,padding:"18px 22px",marginBottom:18,boxShadow:theme.isDark?"none":"0 2px 8px rgba(0,0,0,.06)"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
            <span style={{width:8,height:8,borderRadius:"50%",background:"#4ade80",display:"inline-block"}}/>
            <h3 style={{fontSize:16,fontWeight:800,color:theme.text}}>Currently Inside</h3>
            <span style={{background:"rgba(74,222,128,.12)",color:"#4ade80",fontSize:12,fontWeight:700,padding:"2px 10px",borderRadius:100}}>{inside.length}</span>
          </div>
          <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
            {inside.map(v=>(
              <InsideCard key={v.visit_id} visit={v} theme={theme} onTerminate={async()=>{
                const nowTime=new Date().toTimeString().split(" ")[0];
                await supabase.from("library_visits").update({time_out:nowTime,visit_status:"completed"}).eq("visit_id",v.visit_id);
                onRefresh();
              }}/>
            ))}
          </div>
        </div>
      )}

      {/* Charts */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:18,marginBottom:18}}>
        <div style={{background:theme.card,border:`1px solid ${theme.border}`,borderRadius:12,padding:"22px 24px",boxShadow:theme.isDark?"none":"0 2px 8px rgba(0,0,0,.06)"}}>
          <p style={{fontSize:11,fontWeight:700,letterSpacing:".2em",textTransform:"uppercase",color:theme.textFaint,marginBottom:4}}>Distribution</p>
          <h3 style={{fontSize:18,fontWeight:800,color:theme.text,marginBottom:18}}>Visitors by College</h3>
          {loading?<div style={{height:160,background:theme.inputBg,borderRadius:8}}/>:(
            <div style={{display:"flex",alignItems:"center",gap:20}}>
              <DonutChart data={collegeData} colors={COLORS} theme={theme}/>
              <div style={{flex:1,display:"flex",flexDirection:"column",gap:7}}>
                {collegeData.slice(0,6).map(([college,count],i)=>(
                  <div key={college} style={{display:"flex",alignItems:"center",gap:8}}>
                    <div style={{width:8,height:8,borderRadius:"50%",background:COLORS[i%COLORS.length],flexShrink:0}}/>
                    <p style={{fontSize:11,color:theme.textMuted,flex:1,lineHeight:1.3}}>{shortCollege(college)}</p>
                    <p style={{fontSize:12,fontWeight:700,color:theme.text}}>{count}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={{background:theme.card,border:`1px solid ${theme.border}`,borderRadius:12,padding:"22px 24px",boxShadow:theme.isDark?"none":"0 2px 8px rgba(0,0,0,.06)"}}>
          <p style={{fontSize:11,fontWeight:700,letterSpacing:".2em",textTransform:"uppercase",color:theme.textFaint,marginBottom:4}}>Breakdown</p>
          <h3 style={{fontSize:18,fontWeight:800,color:theme.text,marginBottom:18}}>Visitors by Purpose</h3>
          {loading?<div style={{height:160,background:theme.inputBg,borderRadius:8}}/>:(
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              {reasonData.map(([reason,count])=>{
                const pct=filtered.length?Math.round((count/filtered.length)*100):0;
                const rc=REASON_COLORS[reason]||{color:"#fff",bg:"rgba(255,255,255,.1)"};
                return (
                  <div key={reason}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                      <p style={{fontSize:13,fontWeight:600,color:theme.textMuted}}>{reason}</p>
                      <p style={{fontSize:12,fontWeight:700,color:rc.color}}>{count} <span style={{color:theme.textFaint,fontWeight:400}}>({pct}%)</span></p>
                    </div>
                    <div style={{height:5,background:theme.inputBg,borderRadius:100,overflow:"hidden"}}>
                      <motion.div initial={{width:0}} animate={{width:`${pct}%`}} transition={{duration:.5,ease:EASE}}
                        style={{height:"100%",background:rc.color,borderRadius:100}}/>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Daily bar chart */}
      <div style={{background:theme.card,border:`1px solid ${theme.border}`,borderRadius:12,padding:"22px 24px",boxShadow:theme.isDark?"none":"0 2px 8px rgba(0,0,0,.06)"}}>
        <p style={{fontSize:11,fontWeight:700,letterSpacing:".2em",textTransform:"uppercase",color:theme.textFaint,marginBottom:4}}>Trend</p>
        <h3 style={{fontSize:18,fontWeight:800,color:theme.text,marginBottom:20}}>Daily Visits — Last 14 Days</h3>
        <div style={{display:"flex",alignItems:"flex-end",gap:6,height:100}}>
          {dailyData.map(d=>(
            <div key={d.date} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
              {d.count>0&&<p style={{fontSize:10,color:theme.textMuted,fontWeight:700}}>{d.count}</p>}
              <motion.div initial={{height:0}} animate={{height:`${Math.max((d.count/maxDaily)*80,d.count>0?6:3)}px`}} transition={{duration:.4,ease:EASE}}
                style={{width:"100%",borderRadius:"3px 3px 0 0",background:d.count>0?"linear-gradient(180deg,#DAA520,rgba(212,175,55,.4))":theme.inputBg}}/>
              <p style={{fontSize:9,color:theme.textFaint,textAlign:"center"}}>{d.date}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// VISITOR LOGS PAGE
// ══════════════════════════════════════════════════════════
function VisitorLogsPage({ visits, loading, theme }: { visits:Visit[]; loading:boolean; theme:Theme }) {
  const [search,   setSearch]   = useState("");
  const [period,   setPeriod]   = useState("today");
  const [fReason,  setFReason]  = useState("");
  const [fCollege, setFCollege] = useState("");
  const [fStatus,  setFStatus]  = useState(""); // inside / completed / all
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo,   setDateTo]   = useState("");
  const [sortBy,   setSortBy]   = useState("date_desc"); // sorting

  const today      = new Date().toISOString().split("T")[0];
  const weekAgo    = new Date(Date.now()-7*86400000).toISOString().split("T")[0];
  const monthStart = new Date(new Date().getFullYear(),new Date().getMonth(),1).toISOString().split("T")[0];
  const yearStart  = new Date(new Date().getFullYear(),0,1).toISOString().split("T")[0];

  const filtered = visits.filter(v=>{
    const q=search.toLowerCase().trim();
    // ── Enhanced search: name, email, student_id, college, program, reason, employee_status, year_level ──
    const matchSearch=!q||[
      v.students?.name,
      v.students?.email,
      v.student_id,
      v.students?.college,
      v.reason,
      v.students?.employee_status,
      v.visit_date,
      v.visit_time,
      String(v.students?.year_level??""),
    ].some(f=>(f||"").toLowerCase().includes(q));
    let matchPeriod=true;
    if(dateFrom||dateTo){if(dateFrom)matchPeriod=matchPeriod&&v.visit_date>=dateFrom;if(dateTo)matchPeriod=matchPeriod&&v.visit_date<=dateTo;}
    else{matchPeriod=period==="today"?v.visit_date===today:period==="week"?v.visit_date>=weekAgo:period==="month"?v.visit_date>=monthStart:period==="year"?v.visit_date>=yearStart:true;}
    const matchReason=!fReason||v.reason===fReason;
    const matchCollege=!fCollege||(v.students?.college||"").includes(fCollege);
    const matchStatus=!fStatus||(fStatus==="inside"?v.visit_status==="inside":fStatus==="completed"?!!v.time_out:fStatus==="no_checkout"?!v.time_out&&v.visit_status!=="inside":true);
    return matchSearch&&matchPeriod&&matchReason&&matchCollege&&matchStatus;
  }).sort((a,b)=>{
    switch(sortBy){
      case "date_asc":  return a.visit_date===b.visit_date?a.visit_time.localeCompare(b.visit_time):a.visit_date.localeCompare(b.visit_date);
      case "date_desc": return a.visit_date===b.visit_date?b.visit_time.localeCompare(a.visit_time):b.visit_date.localeCompare(a.visit_date);
      case "name_asc":  return (a.students?.name||"").localeCompare(b.students?.name||"");
      case "name_desc": return (b.students?.name||"").localeCompare(a.students?.name||"");
      case "timein_asc":  return a.visit_time.localeCompare(b.visit_time);
      case "timein_desc": return b.visit_time.localeCompare(a.visit_time);
      case "duration_desc":{
        const dur=(v:Visit)=>{if(!v.time_out)return-1;const[h1,m1]=v.visit_time.split(":").map(Number);const[h2,m2]=v.time_out.split(":").map(Number);return(h2*60+m2)-(h1*60+m1);};
        return dur(b)-dur(a);
      }
      case "college_asc": return (a.students?.college||"").localeCompare(b.students?.college||"");
      default: return 0;
    }
  });

  const clearFilters=()=>{setSearch("");setFReason("");setFCollege("");setFStatus("");setDateFrom("");setDateTo("");setPeriod("today");setSortBy("date_desc");};

  const exportCSV=()=>{
    const headers=["Visit ID","Student ID","Name","Email","College","Reason","Visit Date","Time In","Time Out","Duration","Status"];
    const rows=filtered.map(v=>{
      let dur="";
      if(v.time_out){const[h1,m1]=v.visit_time.split(":").map(Number);const[h2,m2]=v.time_out.split(":").map(Number);const diff=(h2*60+m2)-(h1*60+m1);dur=`${Math.floor(diff/60)}h ${diff%60}m`;}
      return[v.visit_id,v.student_id,v.students?.name||"",v.students?.email||"",v.students?.college||"",v.reason||"",v.visit_date,v.visit_time,v.time_out||"",dur,v.visit_status||""];
    });
    const csv=[headers,...rows].map(r=>r.map(c=>`"${c}"`).join(",")).join("\n");
    const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));a.download=`NEU-Library-Logs-${today}.csv`;a.click();
  };

  const selStyle:React.CSSProperties={height:40,padding:"0 14px",background:theme.card,border:`1px solid ${theme.inputBorder}`,borderRadius:8,color:theme.text,fontSize:13,fontWeight:600,fontFamily:"'DM Sans',sans-serif",outline:"none",cursor:"pointer",colorScheme:theme.isDark?"dark":"light"};
  const dateStyle:React.CSSProperties={height:40,padding:"0 14px",background:theme.card,border:`1px solid ${theme.inputBorder}`,borderRadius:8,color:theme.text,fontSize:13,fontFamily:"'DM Sans',sans-serif",outline:"none",cursor:"pointer",colorScheme:theme.isDark?"dark":"light"};

  return (
    <div style={{padding:"28px 32px",minHeight:"100vh",background:theme.bg,color:theme.text}} className="admin-page-wrap">
      <div style={{marginBottom:24}}>
        <p style={{fontSize:11,fontWeight:700,letterSpacing:".28em",textTransform:"uppercase",color:"rgba(212,175,55,.6)",marginBottom:6}}>Records</p>
        <h1 style={{fontSize:32,fontWeight:900,color:theme.text,fontFamily:"'Playfair Display',serif"}}>Visitor Logs</h1>
      </div>

      <div style={{background:theme.card,border:`1px solid ${theme.border}`,borderRadius:12,padding:"18px 20px",marginBottom:18,boxShadow:theme.isDark?"none":"0 2px 8px rgba(0,0,0,.06)"}}>
        <div style={{position:"relative",marginBottom:14}}>
          <span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",fontSize:15,color:theme.textFaint,pointerEvents:"none"}}>⌕</span>
          <input type="text" placeholder="Search by name, email, student no., college, purpose, date, status…" value={search} onChange={e=>setSearch(e.target.value)}
            style={{width:"100%",height:44,paddingLeft:42,paddingRight:search?40:18,background:theme.inputBg,border:`1px solid ${theme.border}`,borderRadius:9,color:theme.text,fontSize:14,fontFamily:"'DM Sans',sans-serif",outline:"none"}}
            onFocus={e=>e.target.style.borderColor="rgba(212,175,55,.45)"} onBlur={e=>e.target.style.borderColor=theme.border}/>
          {search&&<button onClick={()=>setSearch("")} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:theme.textFaint,fontSize:16,fontFamily:"'DM Sans',sans-serif",padding:4}}>✕</button>}
        </div>
        <div style={{display:"flex",gap:5,marginBottom:12,flexWrap:"wrap"}}>
          {[["today","Today"],["week","Week"],["month","Month"],["year","Year"],["all","All"]].map(([val,label])=>(
            <button key={val} onClick={()=>{setPeriod(val);setDateFrom("");setDateTo("");}}
              style={{height:34,padding:"0 14px",borderRadius:7,border:"1px solid",fontSize:12,fontWeight:700,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",
                background:period===val&&!dateFrom&&!dateTo?"rgba(212,175,55,.12)":"transparent",
                color:period===val&&!dateFrom&&!dateTo?"#DAA520":theme.textMuted,
                borderColor:period===val&&!dateFrom&&!dateTo?"rgba(212,175,55,.4)":theme.border}}>
              {label}
            </button>
          ))}
        </div>
        <div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"center"}}>
          {/* Purpose filter */}
          <select value={fReason} onChange={e=>setFReason(e.target.value)} style={selStyle}>
            <option value="">All Purposes</option>
            {REASONS.map(r=><option key={r} value={r}>{r}</option>)}
          </select>
          {/* Status filter */}
          <select value={fStatus} onChange={e=>setFStatus(e.target.value)} style={selStyle}>
            <option value="">All Statuses</option>
            <option value="inside">Currently Inside</option>
            <option value="completed">Checked Out</option>
            <option value="no_checkout">No Checkout</option>
          </select>
          {/* Sort */}
          <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={selStyle}>
            <option value="date_desc">Date: Newest First</option>
            <option value="date_asc">Date: Oldest First</option>
            <option value="name_asc">Name: A → Z</option>
            <option value="name_desc">Name: Z → A</option>
            <option value="timein_desc">Time In: Latest</option>
            <option value="timein_asc">Time In: Earliest</option>
            <option value="duration_desc">Duration: Longest</option>
            <option value="college_asc">College: A → Z</option>
          </select>
          {/* Date range */}
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <div><p style={{fontSize:10,fontWeight:700,color:theme.textFaint,letterSpacing:".1em",textTransform:"uppercase",marginBottom:3}}>From</p><input type="date" value={dateFrom} onChange={e=>{setDateFrom(e.target.value);setPeriod("");}} style={dateStyle}/></div>
            <div style={{marginTop:16,color:theme.textFaint,fontSize:14}}>→</div>
            <div><p style={{fontSize:10,fontWeight:700,color:theme.textFaint,letterSpacing:".1em",textTransform:"uppercase",marginBottom:3}}>To</p><input type="date" value={dateTo} onChange={e=>{setDateTo(e.target.value);setPeriod("");}} style={dateStyle}/></div>
          </div>
          {(search||fReason||fCollege||fStatus||dateFrom||dateTo||period!=="today"||sortBy!=="date_desc")&&(
            <button onClick={clearFilters} style={{height:40,padding:"0 14px",background:theme.inputBg,border:`1px solid ${theme.border}`,borderRadius:8,color:theme.textMuted,fontSize:12,fontWeight:700,fontFamily:"'DM Sans',sans-serif",cursor:"pointer"}}>Clear ✕</button>
          )}
          <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:12,color:theme.textFaint,fontWeight:600}}>{filtered.length} of {visits.length} records</span>
            <button onClick={exportCSV} style={{height:36,padding:"0 16px",background:"transparent",border:"1px solid rgba(212,175,55,.35)",borderRadius:8,color:"#DAA520",fontSize:12,fontWeight:700,fontFamily:"'DM Sans',sans-serif",cursor:"pointer"}}
              onMouseEnter={e=>(e.currentTarget.style.background="rgba(212,175,55,.08)")}
              onMouseLeave={e=>(e.currentTarget.style.background="transparent")}>↓ Export CSV</button>
          </div>
        </div>
      </div>

      {/* Mobile: card view */}
      <div className="logs-mobile" style={{display:"none",flexDirection:"column",gap:10}}>
        {filtered.slice(0,50).map(v=>{
          const rc=v.reason&&REASON_COLORS[v.reason]?REASON_COLORS[v.reason]:{color:theme.textMuted,bg:theme.inputBg};
          return(
            <div key={v.visit_id} style={{background:theme.card,border:`1px solid ${theme.border}`,borderRadius:12,padding:"14px 16px",boxShadow:theme.isDark?"none":"0 2px 8px rgba(0,0,0,.06)"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                <div><p style={{fontWeight:700,color:theme.text,fontSize:14}}>{v.students?.name||"—"}</p><p style={{fontSize:11,color:theme.textMuted,marginTop:2}}>{v.students?.email||v.student_id}</p></div>
                {v.reason&&<span style={{background:rc.bg,color:rc.color,padding:"4px 10px",borderRadius:5,fontSize:11,fontWeight:700,flexShrink:0,marginLeft:8}}>{v.reason}</span>}
              </div>
              <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
                <div><p style={{fontSize:10,color:theme.textFaint,marginBottom:2}}>Date</p><p style={{fontSize:12,fontWeight:600,color:theme.textMuted}}>{v.visit_date}</p></div>
                <div><p style={{fontSize:10,color:theme.textFaint,marginBottom:2}}>Time In</p><span style={{background:"rgba(74,222,128,.08)",color:"#4ade80",padding:"3px 8px",borderRadius:4,fontSize:12,fontWeight:700}}>{v.visit_time?.slice(0,5)}</span></div>
                {v.time_out&&<div><p style={{fontSize:10,color:theme.textFaint,marginBottom:2}}>Time Out</p><span style={{background:"rgba(248,113,113,.08)",color:"#f87171",padding:"3px 8px",borderRadius:4,fontSize:12,fontWeight:700}}>{v.time_out?.slice(0,5)}</span></div>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop: table view */}
      <div className="logs-desktop" style={{background:theme.card,border:`1px solid ${theme.border}`,borderRadius:12,overflow:"hidden",boxShadow:theme.isDark?"none":"0 2px 8px rgba(0,0,0,.06)"}}>
        {loading?<div style={{textAlign:"center",padding:"60px 20px",color:theme.textFaint}}>Loading records…</div>:(
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
              <thead>
                <tr style={{borderBottom:`1px solid ${theme.border}`}}>
                  {["Student","College","Purpose","Date","Time In","Time Out","Duration"].map(h=>(
                    <th key={h} style={{padding:"13px 20px",textAlign:"left",fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:".16em",color:theme.textFaint,background:theme.tableHeader}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length===0?(
                  <tr><td colSpan={7} style={{textAlign:"center",padding:"60px 20px"}}>
                    <p style={{fontSize:28,marginBottom:10}}>⌕</p>
                    <p style={{color:theme.textFaint,fontSize:14,fontWeight:600}}>No records match your filters</p>
                    <button onClick={clearFilters} style={{marginTop:14,padding:"8px 20px",background:"rgba(212,175,55,.1)",border:"1px solid rgba(212,175,55,.3)",borderRadius:8,color:"#DAA520",fontSize:13,fontWeight:700,fontFamily:"'DM Sans',sans-serif",cursor:"pointer"}}>Clear filters</button>
                  </td></tr>
                ):filtered.map(v=>{
                  const rc=v.reason&&REASON_COLORS[v.reason]?REASON_COLORS[v.reason]:{color:theme.textMuted,bg:theme.inputBg};
                  return(
                    <tr key={v.visit_id} className="trow" style={{borderBottom:`1px solid ${theme.border}`}}>
                      <td style={{padding:"13px 20px"}}><p style={{fontWeight:700,color:theme.text,fontSize:14}}>{v.students?.name||"—"}</p><p style={{fontSize:11,color:theme.textFaint,marginTop:2}}>{v.students?.email||v.student_id}</p></td>
                      <td style={{padding:"13px 20px",color:theme.textMuted,fontSize:12}}>{shortCollege(v.students?.college||"—")}</td>
                      <td style={{padding:"13px 20px"}}>{v.reason?<span style={{background:rc.bg,color:rc.color,padding:"4px 10px",borderRadius:5,fontSize:12,fontWeight:700}}>{v.reason}</span>:<span style={{color:theme.textFaint,fontStyle:"italic"}}>—</span>}</td>
                      <td style={{padding:"13px 20px",color:theme.textMuted,fontSize:12,fontWeight:600}}>{v.visit_date}</td>
                      <td style={{padding:"13px 20px"}}><span style={{background:"rgba(74,222,128,.08)",color:"#4ade80",padding:"4px 10px",borderRadius:5,fontSize:12,fontWeight:700}}>{v.visit_time?.slice(0,5)}</span></td>
                      <td style={{padding:"13px 20px"}}>{v.time_out?<span style={{background:"rgba(248,113,113,.08)",color:"#f87171",padding:"4px 10px",borderRadius:5,fontSize:12,fontWeight:700}}>{v.time_out?.slice(0,5)}</span>:<span style={{color:v.visit_status==="inside"?"#FCD34D":theme.textFaint,fontSize:12,fontStyle:v.visit_status==="inside"?"normal":"italic",fontWeight:v.visit_status==="inside"?700:400}}>{v.visit_status==="inside"?"● Inside":"—"}</span>}</td>
                      <td style={{padding:"13px 20px"}}>{(()=>{if(!v.time_out)return<span style={{color:theme.textFaint,fontSize:12}}>—</span>;const[h1,m1]=v.visit_time.split(":").map(Number);const[h2,m2]=v.time_out.split(":").map(Number);const diff=(h2*60+m2)-(h1*60+m1);const hrs=Math.floor(diff/60);const mins=diff%60;return<span style={{fontSize:12,color:theme.textMuted,fontWeight:600}}>{hrs>0?`${hrs}h `:""}{mins}m</span>;})()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{`
        @media(max-width:900px){
          .logs-mobile{display:flex!important;}
          .logs-desktop{display:none!important;}
        }
      `}</style>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// USER MANAGEMENT PAGE
// ══════════════════════════════════════════════════════════
function UserManagementPage({ students, loading, onRefresh, theme }: { students:Student[]; loading:boolean; onRefresh:()=>void; theme:Theme }) {
  const [search,        setSearch]        = useState("");
  const [fStatus,       setFStatus]       = useState("");
  const [sortBy,        setSortBy]        = useState("name");
  const [sortDir,       setSortDir]       = useState<"asc"|"desc">("asc");
  const [blocking,      setBlocking]      = useState<string|null>(null);
  const [editStudent,   setEditStudent]   = useState<Student|null>(null);
  const [localStudents, setLocalStudents] = useState<Student[]>([]);

  useEffect(()=>{ setLocalStudents(students); },[students]);

  const handleBlock = async (student: Student) => {
    setBlocking(student.student_id);
    const newVal = !student.is_blocked;
    await supabase.from("students").update({is_blocked:newVal}).eq("student_id",student.student_id);
    setLocalStudents(prev=>prev.map(s=>s.student_id===student.student_id?{...s,is_blocked:newVal}:s));
    setBlocking(null);
  };

  const filtered = localStudents
    .filter(s=>{
      const q=search.toLowerCase();
      // ── Enhanced search: name, email, student_id, college, program name, year level, employee_status, blocked status ──
      return(!search||[
        s.name,
        s.email,
        s.student_id,
        s.college,
        s.programs?.name,
        s.employee_status,
        s.year_level?YEAR_LABELS[s.year_level]:"",
        s.is_blocked?"blocked":"active",
      ].some(f=>(f||"").toLowerCase().includes(q)))&&(!fStatus||s.employee_status===fStatus);
    })
    .sort((a,b)=>{
      switch(sortBy){
        case "name":         return sortDir==="asc"?a.name.localeCompare(b.name):b.name.localeCompare(a.name);
        case "student_id":   return sortDir==="asc"?a.student_id.localeCompare(b.student_id):b.student_id.localeCompare(a.student_id);
        case "college":      return sortDir==="asc"?(a.college||"").localeCompare(b.college||""):(b.college||"").localeCompare(a.college||"");
        case "employee_status": return sortDir==="asc"?a.employee_status.localeCompare(b.employee_status):b.employee_status.localeCompare(a.employee_status);
        case "year_level":   return sortDir==="asc"?((a.year_level||0)-(b.year_level||0)):((b.year_level||0)-(a.year_level||0));
        case "program":      return sortDir==="asc"?(a.programs?.name||"").localeCompare(b.programs?.name||""):(b.programs?.name||"").localeCompare(a.programs?.name||"");
        case "status":       return sortDir==="asc"?(Number(a.is_blocked)-Number(b.is_blocked)):(Number(b.is_blocked)-Number(a.is_blocked));
        default:             return a.name.localeCompare(b.name);
      }
    });

  const blockedCount = localStudents.filter(s=>s.is_blocked).length;
  const selStyle:React.CSSProperties={height:40,padding:"0 14px",background:theme.card,border:`1px solid ${theme.inputBorder}`,borderRadius:8,color:theme.text,fontSize:13,fontWeight:600,fontFamily:"'DM Sans',sans-serif",outline:"none",cursor:"pointer",colorScheme:theme.isDark?"dark":"light"};

  const exportCSV=()=>{
    const headers=["Student ID","Name","Email","College","Program","Year Level","Type","Blocked"];
    const rows=filtered.map(s=>[s.student_id,s.name,s.email,s.college,s.programs?.name||"",s.year_level?YEAR_LABELS[s.year_level]||"":"",s.employee_status,s.is_blocked?"Yes":"No"]);
    const csv=[headers,...rows].map(r=>r.map(c=>`"${c}"`).join(",")).join("\n");
    const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));a.download=`NEU-Library-Users-${new Date().toISOString().slice(0,10)}.csv`;a.click();
  };

  return (
    <div style={{padding:"28px 32px",minHeight:"100vh",background:theme.bg,color:theme.text}}>
      <AnimatePresence>
        {editStudent && (
          <EditStudentModal student={editStudent} onClose={()=>setEditStudent(null)} onSaved={()=>{setEditStudent(null);onRefresh();}}/>
        )}
      </AnimatePresence>

      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:24,flexWrap:"wrap",gap:12}}>
        <div>
          <p style={{fontSize:11,fontWeight:700,letterSpacing:".28em",textTransform:"uppercase",color:"rgba(212,175,55,.6)",marginBottom:6}}>Registry</p>
          <h1 style={{fontSize:32,fontWeight:900,color:theme.text,fontFamily:"'Playfair Display',serif"}}>User Management</h1>
        </div>
        <div style={{display:"flex",gap:12,alignItems:"center",flexWrap:"wrap"}}>
          <div style={{background:theme.card,border:`1px solid ${theme.border}`,borderRadius:10,padding:"10px 16px",textAlign:"center",boxShadow:theme.isDark?"none":"0 2px 8px rgba(0,0,0,.06)"}}>
            <p style={{fontSize:22,fontWeight:900,color:theme.text,fontFamily:"'Playfair Display',serif",lineHeight:1}}>{localStudents.length}</p>
            <p style={{fontSize:11,color:theme.textFaint,marginTop:2}}>Total Users</p>
          </div>
          {blockedCount>0&&(
            <div style={{background:"rgba(248,113,113,.08)",border:"1px solid rgba(248,113,113,.2)",borderRadius:10,padding:"10px 16px",textAlign:"center"}}>
              <p style={{fontSize:22,fontWeight:900,color:"#f87171",fontFamily:"'Playfair Display',serif",lineHeight:1}}>{blockedCount}</p>
              <p style={{fontSize:11,color:"rgba(248,113,113,.6)",marginTop:2}}>Blocked</p>
            </div>
          )}
        </div>
      </div>

      <div style={{background:theme.card,border:`1px solid ${theme.border}`,borderRadius:12,padding:"18px 20px",marginBottom:18,boxShadow:theme.isDark?"none":"0 2px 8px rgba(0,0,0,.06)"}}>
        <div style={{position:"relative",marginBottom:14}}>
          <span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",fontSize:15,color:theme.textFaint}}>⌕</span>
          <input type="text" placeholder="Search by name, email, student no., college, program, year, type, status…" value={search} onChange={e=>setSearch(e.target.value)}
            style={{width:"100%",height:44,paddingLeft:42,background:theme.inputBg,border:`1px solid ${theme.border}`,borderRadius:9,color:theme.text,fontSize:14,fontFamily:"'DM Sans',sans-serif",outline:"none"}}
            onFocus={e=>e.target.style.borderColor="rgba(212,175,55,.45)"} onBlur={e=>e.target.style.borderColor=theme.border}/>
        </div>
        <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
          <select value={fStatus} onChange={e=>setFStatus(e.target.value)} style={selStyle}>
            <option value="">All Types</option>
            {["Student","Faculty","Staff"].map(s=><option key={s} value={s}>{s}</option>)}
          </select>
          <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={selStyle}>
            <option value="name">Sort: Name</option>
            <option value="student_id">Sort: Student No.</option>
            <option value="college">Sort: College</option>
            <option value="program">Sort: Program</option>
            <option value="year_level">Sort: Year Level</option>
            <option value="employee_status">Sort: Type</option>
            <option value="status">Sort: Status (Blocked)</option>
          </select>
          <button onClick={()=>setSortDir(d=>d==="asc"?"desc":"asc")}
            style={{height:40,padding:"0 14px",background:theme.inputBg,border:`1px solid ${theme.border}`,borderRadius:8,color:theme.textMuted,fontSize:13,fontWeight:700,fontFamily:"'DM Sans',sans-serif",cursor:"pointer"}}>
            {sortDir==="asc"?"↑ Asc":"↓ Desc"}
          </button>
          <span style={{fontSize:12,color:theme.textFaint,fontWeight:600}}>{filtered.length} users</span>
          <button onClick={exportCSV}
            style={{marginLeft:"auto",padding:"9px 16px",background:"transparent",border:"1px solid rgba(212,175,55,.35)",borderRadius:10,color:"#DAA520",fontSize:12,fontWeight:700,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",whiteSpace:"nowrap"}}
            onMouseEnter={e=>(e.currentTarget.style.background="rgba(212,175,55,.08)")}
            onMouseLeave={e=>(e.currentTarget.style.background="transparent")}>↓ Export CSV</button>
        </div>
      </div>

      {/* Mobile: card view */}
      <div className="users-mobile" style={{display:"none",flexDirection:"column",gap:10}}>
        {filtered.map(s=>(
          <div key={s.student_id} style={{background:theme.card,border:`1px solid ${theme.border}`,borderRadius:12,padding:"14px 16px",opacity:s.is_blocked?.7:1,boxShadow:theme.isDark?"none":"0 2px 8px rgba(0,0,0,.06)"}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
              <div style={{width:36,height:36,borderRadius:"50%",background:s.is_blocked?"rgba(248,113,113,.2)":"linear-gradient(135deg,#0f2040,#1E3A8A)",display:"flex",alignItems:"center",justifyContent:"center",color:s.is_blocked?"#f87171":"#fff",fontWeight:800,fontSize:14,flexShrink:0,overflow:"hidden"}}>
                {s.photo_url?<Image src={s.photo_url} alt={s.name} width={36} height={36} style={{width:"100%",height:"100%",objectFit:"cover"}} referrerPolicy="no-referrer"/>:s.name?.charAt(0)||"?"}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <p style={{fontWeight:700,color:s.is_blocked?theme.textMuted:theme.text,fontSize:14,textDecoration:s.is_blocked?"line-through":"none",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.name}</p>
                <p style={{fontSize:11,color:theme.textFaint,marginTop:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.email}</p>
              </div>
              <span style={{background:s.is_blocked?"rgba(248,113,113,.1)":"rgba(74,222,128,.08)",color:s.is_blocked?"#f87171":"#4ade80",padding:"3px 8px",borderRadius:5,fontSize:11,fontWeight:700,flexShrink:0}}>{s.is_blocked?"Blocked":"Active"}</span>
            </div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:10}}>
              <span style={{fontSize:11,color:theme.textMuted,background:theme.inputBg,padding:"3px 8px",borderRadius:5}}>{s.student_id}</span>
              <span style={{fontSize:11,color:theme.textMuted,background:theme.inputBg,padding:"3px 8px",borderRadius:5}}>{s.employee_status}</span>
              {s.year_level&&<span style={{fontSize:11,color:"#DAA520",background:"rgba(212,175,55,.1)",padding:"3px 8px",borderRadius:5}}>{YEAR_LABELS[s.year_level]}</span>}
            </div>
            <p style={{fontSize:11,color:theme.textMuted,marginBottom:10}}>{shortCollege(s.college)}</p>
            {s.programs&&<p style={{fontSize:11,color:theme.textFaint,marginBottom:10}}>{s.programs.name}</p>}
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>setEditStudent(s)} style={{flex:1,padding:"8px",background:"rgba(212,175,55,.1)",border:"1px solid rgba(212,175,55,.25)",borderRadius:8,color:"#DAA520",fontSize:12,fontWeight:700,fontFamily:"'DM Sans',sans-serif",cursor:"pointer"}}>✏ Edit</button>
              <button onClick={()=>handleBlock(s)} disabled={blocking===s.student_id}
                style={{flex:1,padding:"8px",background:s.is_blocked?"rgba(74,222,128,.08)":"rgba(248,113,113,.08)",border:`1px solid ${s.is_blocked?"rgba(74,222,128,.3)":"rgba(248,113,113,.3)"}`,borderRadius:8,color:s.is_blocked?"#4ade80":"#f87171",fontSize:12,fontWeight:700,fontFamily:"'DM Sans',sans-serif",cursor:"pointer"}}>
                {blocking===s.student_id?"…":s.is_blocked?"Unblock":"Block"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: table view */}
      <div className="users-desktop" style={{background:theme.card,border:`1px solid ${theme.border}`,borderRadius:12,overflow:"hidden",boxShadow:theme.isDark?"none":"0 2px 8px rgba(0,0,0,.06)"}}>
        {loading?<div style={{textAlign:"center",padding:"60px 20px",color:theme.textFaint}}>Loading users…</div>:(
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
              <thead>
                <tr style={{borderBottom:`1px solid ${theme.border}`,background:theme.tableHeader}}>
                  {["Student","Student No.","College / Program","Type","Year","Status","Actions"].map(h=>(
                    <th key={h} style={{padding:"13px 20px",textAlign:"left",fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:".16em",color:theme.textFaint}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length===0?(
                  <tr><td colSpan={7} style={{textAlign:"center",padding:"60px 20px",color:theme.textFaint,fontSize:14}}>No users match your filters</td></tr>
                ):filtered.map(s=>{
                  const isBlocked=s.is_blocked;
                  return(
                    <tr key={s.student_id} className="trow" style={{borderBottom:`1px solid ${theme.border}`,opacity:isBlocked?.7:1}}>
                      <td style={{padding:"13px 20px"}}>
                        <div style={{display:"flex",alignItems:"center",gap:10}}>
                          <div style={{width:32,height:32,borderRadius:"50%",background:isBlocked?"rgba(248,113,113,.2)":"linear-gradient(135deg,#0f2040,#1E3A8A)",display:"flex",alignItems:"center",justifyContent:"center",color:isBlocked?"#f87171":"#fff",fontWeight:800,fontSize:12,flexShrink:0,overflow:"hidden"}}>
                            {s.photo_url?<Image src={s.photo_url} alt={s.name} width={32} height={32} style={{width:"100%",height:"100%",objectFit:"cover"}} referrerPolicy="no-referrer"/>:s.name?.charAt(0)||"?"}
                          </div>
                          <div>
                            <p style={{fontWeight:700,color:isBlocked?theme.textMuted:theme.text,fontSize:14,textDecoration:isBlocked?"line-through":"none"}}>{s.name}</p>
                            <p style={{fontSize:11,color:theme.textFaint,marginTop:2}}>{s.email}</p>
                          </div>
                        </div>
                      </td>
                      <td style={{padding:"13px 20px",color:theme.textMuted,fontSize:12,fontWeight:600,fontFamily:"'Courier New',monospace"}}>{s.student_id}</td>
                      <td style={{padding:"13px 20px"}}>
                        <p style={{fontSize:12,color:theme.textMuted}}>{shortCollege(s.college)}</p>
                        {s.programs&&<p style={{fontSize:11,color:theme.textFaint,marginTop:2}}>{s.programs.name}</p>}
                      </td>
                      <td style={{padding:"13px 20px"}}>
                        <span style={{background:s.employee_status==="Student"?"rgba(110,231,183,.1)":s.employee_status==="Faculty"?"rgba(147,197,253,.1)":"rgba(252,211,77,.1)",color:s.employee_status==="Student"?"#6EE7B7":s.employee_status==="Faculty"?"#93C5FD":"#FCD34D",padding:"4px 10px",borderRadius:5,fontSize:11,fontWeight:700}}>{s.employee_status}</span>
                      </td>
                      <td style={{padding:"13px 20px"}}>
                        {s.year_level?<span style={{color:"#DAA520",fontSize:12,fontWeight:600}}>{YEAR_LABELS[s.year_level]}</span>:<span style={{color:theme.textFaint,fontSize:12}}>—</span>}
                      </td>
                      <td style={{padding:"13px 20px"}}>
                        {isBlocked?<span style={{display:"inline-flex",alignItems:"center",gap:5,background:"rgba(248,113,113,.1)",color:"#f87171",padding:"4px 10px",borderRadius:5,fontSize:11,fontWeight:700}}><span style={{width:5,height:5,borderRadius:"50%",background:"#f87171",display:"inline-block"}}/>Blocked</span>
                          :<span style={{display:"inline-flex",alignItems:"center",gap:5,background:"rgba(74,222,128,.08)",color:"#4ade80",padding:"4px 10px",borderRadius:5,fontSize:11,fontWeight:700}}><span style={{width:5,height:5,borderRadius:"50%",background:"#4ade80",display:"inline-block"}}/>Active</span>}
                      </td>
                      <td style={{padding:"13px 20px"}}>
                        <div style={{display:"flex",gap:8}}>
                          <button onClick={()=>setEditStudent(s)}
                            style={{padding:"6px 12px",borderRadius:7,border:"1px solid rgba(212,175,55,.3)",fontSize:12,fontWeight:700,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",background:"rgba(212,175,55,.08)",color:"#DAA520"}}
                            onMouseEnter={e=>(e.currentTarget.style.background="rgba(212,175,55,.18)")}
                            onMouseLeave={e=>(e.currentTarget.style.background="rgba(212,175,55,.08)")}>✏ Edit</button>
                          <button onClick={()=>handleBlock(s)} disabled={blocking===s.student_id}
                            style={{padding:"6px 14px",borderRadius:7,border:"1px solid",fontSize:12,fontWeight:700,fontFamily:"'DM Sans',sans-serif",cursor:blocking===s.student_id?"not-allowed":"pointer",opacity:blocking===s.student_id?.5:1,background:isBlocked?"rgba(74,222,128,.08)":"rgba(248,113,113,.08)",borderColor:isBlocked?"rgba(74,222,128,.3)":"rgba(248,113,113,.3)",color:isBlocked?"#4ade80":"#f87171"}}
                            onMouseEnter={e=>(e.currentTarget.style.opacity=".75")} onMouseLeave={e=>(e.currentTarget.style.opacity="1")}>
                            {blocking===s.student_id?"…":isBlocked?"Unblock":"Block"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{`
        @media(max-width:900px){
          .users-mobile{display:flex!important;}
          .users-desktop{display:none!important;}
        }
      `}</style>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// EDIT STUDENT MODAL
// ══════════════════════════════════════════════════════════
function EditStudentModal({ student, onClose, onSaved }: { student:Student; onClose:()=>void; onSaved:()=>void }) {
  const [name,          setName]          = useState(student.name);
  const [studentId,     setStudentId]     = useState(student.student_id);
  const [empStatus,     setEmpStatus]     = useState<"Student"|"Faculty"|"Staff">(student.employee_status as "Student"|"Faculty"|"Staff");
  const [yearLevel,     setYearLevel]     = useState<number|null>(student.year_level);
  const [selectedCollege, setSelectedCollege] = useState<College|null>(null);
  const [selectedProgram, setSelectedProgram] = useState<Program|null>(null);
  const [saving,        setSaving]        = useState(false);
  const [error,         setError]         = useState("");
  const [photoFile,     setPhotoFile]     = useState<File|null>(null);
  const [photoPreview,  setPhotoPreview]  = useState<string|null>(student.photo_url||null);
  const [removingPhoto, setRemovingPhoto] = useState(false);
  const [expandPhoto,   setExpandPhoto]   = useState(false); // ── NEW: expand photo state

  const handleSave = async () => {
    if (!name.trim()) { setError("Name is required."); return; }
    setSaving(true); setError("");
    const collegeDisplay = selectedCollege ? `${selectedCollege.code} — ${selectedCollege.name}` : student.college;
    let newPhotoUrl = student.photo_url ?? null;
    if (photoFile) {
      const ext = photoFile.name.split(".").pop();
      const fileName = `${studentId.trim()}-${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from("student-photos").upload(fileName, photoFile, {upsert:true});
      if (!uploadErr) {
        const { data: urlData } = supabase.storage.from("student-photos").getPublicUrl(fileName);
        newPhotoUrl = urlData.publicUrl;
      }
    }
    if (removingPhoto) newPhotoUrl = null;
    const { error: err } = await supabase.from("students").update({
      name: name.trim(), student_id: studentId.trim(), employee_status: empStatus,
      college: collegeDisplay, program_id: selectedProgram?.id ?? student.program_id,
      year_level: empStatus==="Student" ? yearLevel : null, photo_url: newPhotoUrl,
    }).eq("student_id", student.student_id);
    if (err) { setError("Failed to save. Please try again."); setSaving(false); return; }
    onSaved();
  };

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      style={{position:"fixed",inset:0,zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(6,13,26,.85)",backdropFilter:"blur(12px)",padding:24}}>
      <motion.div initial={{opacity:0,scale:.92,y:24}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:.92,y:24}}
        transition={{duration:.4,ease:EASE}}
        style={{width:"100%",maxWidth:560,background:"#0d1f3e",border:"1px solid rgba(212,175,55,.2)",borderTop:"2px solid #DAA520",borderRadius:20,padding:"28px",boxShadow:"0 24px 80px rgba(0,0,0,.6)",maxHeight:"90vh",overflowY:"auto"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:24}}>
          <div>
            <h2 style={{fontSize:22,fontWeight:900,color:"#fff",fontFamily:"'Playfair Display',serif",marginBottom:2}}>Edit User</h2>
            <p style={{fontSize:13,color:"rgba(255,255,255,.45)"}}>{student.email}</p>
          </div>
          <button onClick={onClose} style={{background:"rgba(255,255,255,.07)",border:"1px solid rgba(255,255,255,.1)",borderRadius:8,color:"rgba(255,255,255,.6)",fontSize:16,cursor:"pointer",width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'DM Sans',sans-serif"}}>✕</button>
        </div>
        {error&&<div style={{background:"rgba(220,38,38,.12)",border:"1px solid rgba(220,38,38,.28)",borderLeft:"3px solid #ef4444",borderRadius:11,padding:"10px 14px",marginBottom:16,fontSize:13,color:"#fca5a5"}}>⚠ {error}</div>}

        {/* ── Photo section with expand support ── */}
        <div style={{marginBottom:16}}>
          <label style={{display:"block",fontSize:11,fontWeight:700,letterSpacing:".16em",textTransform:"uppercase",color:"rgba(255,255,255,.48)",marginBottom:10}}>Profile Photo</label>
          <div style={{display:"flex",alignItems:"center",gap:16}}>

            {/* Clickable avatar — click to expand */}
            <div onClick={()=>photoPreview&&!removingPhoto&&setExpandPhoto(true)}
              style={{width:64,height:64,borderRadius:"50%",overflow:"hidden",border:"2px solid rgba(212,175,55,.35)",background:"linear-gradient(135deg,#0f2040,#1E3A8A)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:800,fontSize:22,flexShrink:0,cursor:photoPreview&&!removingPhoto?"zoom-in":"default",position:"relative"}}>
              {photoPreview&&!removingPhoto
                ? <Image src={photoPreview} alt={name} width={64} height={64} style={{width:"100%",height:"100%",objectFit:"cover"}} referrerPolicy="no-referrer"/>
                : name.charAt(0)||"?"
              }
              {/* Hover zoom hint */}
              {photoPreview&&!removingPhoto&&(
                <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,color:"#fff",opacity:0,transition:"all .2s"}}
                  onMouseEnter={e=>{e.currentTarget.style.background="rgba(0,0,0,.45)";e.currentTarget.style.opacity="1";}}
                  onMouseLeave={e=>{e.currentTarget.style.background="rgba(0,0,0,0)";e.currentTarget.style.opacity="0";}}>
                  ⊕
                </div>
              )}
            </div>

            {/* ── Full-screen photo expand overlay ── */}
            {expandPhoto&&photoPreview&&(
              <div onClick={()=>setExpandPhoto(false)}
                style={{position:"fixed",inset:0,zIndex:500,background:"rgba(0,0,0,.88)",backdropFilter:"blur(24px)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",cursor:"zoom-out"}}>
                <motion.div initial={{scale:.7,opacity:0}} animate={{scale:1,opacity:1}} transition={{duration:.3,ease:EASE}}
                  style={{position:"relative",width:300,height:300,borderRadius:"50%",overflow:"hidden",border:"3px solid rgba(212,175,55,.5)",boxShadow:"0 0 80px rgba(212,175,55,.25)"}}>
                  <Image src={photoPreview} alt={name} fill style={{objectFit:"cover"}} referrerPolicy="no-referrer"/>
                </motion.div>
                <p style={{marginTop:24,color:"rgba(255,255,255,.5)",fontSize:13,fontFamily:"'DM Sans',sans-serif"}}>Click anywhere to close</p>
              </div>
            )}

            <div style={{display:"flex",flexDirection:"column",gap:8,flex:1}}>
              <label style={{display:"flex",alignItems:"center",gap:8,padding:"9px 14px",background:"rgba(255,255,255,.07)",border:"1.5px solid rgba(255,255,255,.13)",borderRadius:10,cursor:"pointer",fontSize:13,fontWeight:600,color:"rgba(255,255,255,.7)"}}>
                ◈ Upload New Photo
                <input type="file" accept="image/jpeg,image/png,image/webp" style={{display:"none"}}
                  onChange={e=>{const file=e.target.files?.[0];if(!file)return;if(file.size>5*1024*1024){setError("Photo must be under 5MB.");return;}setPhotoFile(file);setPhotoPreview(URL.createObjectURL(file));setRemovingPhoto(false);}}/>
              </label>
              {(photoPreview&&!removingPhoto)&&(
                <button type="button" onClick={()=>{setPhotoFile(null);setPhotoPreview(null);setRemovingPhoto(true);}}
                  style={{padding:"8px 14px",background:"rgba(248,113,113,.08)",border:"1px solid rgba(248,113,113,.2)",borderRadius:10,color:"#f87171",fontSize:12,fontWeight:700,fontFamily:"'DM Sans',sans-serif",cursor:"pointer"}}>
                  ✕ Remove Photo
                </button>
              )}
            </div>
          </div>
        </div>

        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          <div>
            <label style={{display:"block",fontSize:11,fontWeight:700,letterSpacing:".16em",textTransform:"uppercase",color:"rgba(255,255,255,.48)",marginBottom:7}}>Full Name</label>
            <input type="text" value={name} onChange={e=>setName(e.target.value)}
              style={{width:"100%",height:48,padding:"0 16px",background:"rgba(255,255,255,.07)",border:"1.5px solid rgba(255,255,255,.13)",borderRadius:10,color:"#fff",fontSize:14,fontFamily:"'DM Sans',sans-serif",outline:"none"}}
              onFocus={e=>e.target.style.borderColor="rgba(212,175,55,.55)"} onBlur={e=>e.target.style.borderColor="rgba(255,255,255,.13)"}/>
          </div>
          <div>
            <label style={{display:"block",fontSize:11,fontWeight:700,letterSpacing:".16em",textTransform:"uppercase",color:"rgba(255,255,255,.48)",marginBottom:7}}>Student / Employee ID</label>
            <input type="text" value={studentId} onChange={e=>setStudentId(e.target.value)}
              style={{width:"100%",height:48,padding:"0 16px",background:"rgba(255,255,255,.07)",border:"1.5px solid rgba(255,255,255,.13)",borderRadius:10,color:"#fff",fontSize:14,fontFamily:"'DM Sans',sans-serif",outline:"none"}}
              onFocus={e=>e.target.style.borderColor="rgba(212,175,55,.55)"} onBlur={e=>e.target.style.borderColor="rgba(255,255,255,.13)"}/>
            <p style={{fontSize:11,color:"rgba(255,255,255,.28)",marginTop:5}}>Format: xx-xxxxx-xxx or 10 digits</p>
          </div>
          <div>
            <label style={{display:"block",fontSize:11,fontWeight:700,letterSpacing:".16em",textTransform:"uppercase",color:"rgba(255,255,255,.48)",marginBottom:10}}>User Type</label>
            <div style={{display:"flex",gap:10}}>
              {(["Student","Faculty","Staff"] as const).map(type=>(
                <button key={type} type="button" onClick={()=>{setEmpStatus(type);if(type!=="Student")setYearLevel(null);}}
                  style={{flex:1,height:44,borderRadius:10,border:"1.5px solid",fontSize:14,fontWeight:700,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",
                    background:empStatus===type?"rgba(212,175,55,.15)":"rgba(255,255,255,.05)",
                    borderColor:empStatus===type?"#DAA520":"rgba(255,255,255,.13)",
                    color:empStatus===type?"#DAA520":"rgba(255,255,255,.5)"}}>
                  {type}
                </button>
              ))}
            </div>
          </div>
          <CollegeSearchDropdown
            selectedCollegeId={student.programs?.colleges ? undefined : undefined}
            selectedProgramId={student.program_id ?? undefined}
            onCollegeChange={setSelectedCollege}
            onProgramChange={setSelectedProgram}
            showYearLevel={false}
            employeeStatus={empStatus}
          />
          {empStatus === "Student" && (
            <div>
              <label style={{display:"block",fontSize:11,fontWeight:700,letterSpacing:".16em",textTransform:"uppercase",color:"rgba(255,255,255,.48)",marginBottom:10}}>Year Level</label>
              <div style={{display:"flex",gap:8}}>
                {[{value:1,label:"1st"},{value:2,label:"2nd"},{value:3,label:"3rd"},{value:4,label:"4th"},{value:5,label:"5th"}].map(y=>(
                  <button key={y.value} type="button" onClick={()=>setYearLevel(y.value)}
                    style={{flex:1,height:44,borderRadius:10,border:"1.5px solid",fontSize:13,fontWeight:700,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",transition:"all .18s",
                      background:yearLevel===y.value?"rgba(212,175,55,.15)":"rgba(255,255,255,.05)",
                      borderColor:yearLevel===y.value?"#DAA520":"rgba(255,255,255,.13)",
                      color:yearLevel===y.value?"#DAA520":"rgba(255,255,255,.45)"}}>
                    {y.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={{display:"flex",gap:10,marginTop:24}}>
          <button onClick={onClose} style={{flex:1,height:48,background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.12)",borderRadius:10,color:"rgba(255,255,255,.6)",fontSize:14,fontWeight:700,fontFamily:"'DM Sans',sans-serif",cursor:"pointer"}}>Cancel</button>
          <button onClick={handleSave} disabled={saving}
            style={{flex:2,height:48,background:"linear-gradient(135deg,#7a5800,#B8860B,#DAA520)",border:"none",borderRadius:10,color:"#fff",fontSize:14,fontWeight:700,fontFamily:"'DM Sans',sans-serif",cursor:saving?"not-allowed":"pointer",opacity:saving?.65:1,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
            {saving?<><svg style={{width:16,height:16,animation:"spin .8s linear infinite"}} viewBox="0 0 24 24" fill="none"><circle style={{opacity:.25}} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path style={{opacity:.75}} fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Saving…</>:"Save Changes"}
          </button>
        </div>
      </motion.div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════
// SCHEDULE PAGE
// ══════════════════════════════════════════════════════════
function SchedulePage({ theme }: { theme:Theme }) {
  const [schedules,    setSchedules]    = useState<LibrarySchedule[]>([]);
  const [scheduleNote, setScheduleNote] = useState("");
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [savingNote,   setSavingNote]   = useState(false);
  const [toast,        setToast]        = useState("");

  useEffect(()=>{ fetchData(); },[]);

  const fetchData = async () => {
    const { data: sc } = await supabase.from("library_schedule").select("*").order("id");
    const { data: ls } = await supabase.from("library_status").select("schedule_note").eq("id",1).single();
    if (sc) setSchedules(sc as LibrarySchedule[]);
    if (ls) setScheduleNote(ls.schedule_note||"");
    setLoading(false);
  };

  const showToast = (msg: string) => { setToast(msg); setTimeout(()=>setToast(""),3000); };

  const updateSchedule = async (id: number, field: string, value: unknown) => {
    setSaving(true);
    await supabase.from("library_schedule").update({[field]:value}).eq("id",id);
    await fetchData();
    setSaving(false);
    showToast("Schedule updated!");
  };

  const saveNote = async () => {
    setSavingNote(true);
    await supabase.from("library_status").update({schedule_note:scheduleNote||null}).eq("id",1);
    setSavingNote(false);
    showToast("Special note saved!");
  };

  const DAY_NAMES = ["","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

  return (
    <div style={{padding:"28px 32px",minHeight:"100vh",background:theme.bg,color:theme.text}}>
      <AnimatePresence>
        {toast&&<motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-20}}
          style={{position:"fixed",top:20,right:20,zIndex:999,background:"rgba(74,222,128,.15)",border:"1px solid rgba(74,222,128,.3)",borderRadius:10,padding:"12px 20px",color:"#4ade80",fontSize:13,fontWeight:700,fontFamily:"'DM Sans',sans-serif"}}>
          ✓ {toast}
        </motion.div>}
      </AnimatePresence>

      <div style={{marginBottom:28}}>
        <p style={{fontSize:11,fontWeight:700,letterSpacing:".28em",textTransform:"uppercase",color:"rgba(212,175,55,.6)",marginBottom:6}}>Settings</p>
        <h1 style={{fontSize:32,fontWeight:900,color:theme.text,fontFamily:"'Playfair Display',serif"}}>Library Schedule</h1>
      </div>

      {loading?<div style={{textAlign:"center",padding:"60px",color:theme.textFaint}}>Loading…</div>:(
        <>
          <div style={{background:theme.card,border:`1px solid ${theme.border}`,borderRadius:12,overflow:"hidden",marginBottom:18,boxShadow:theme.isDark?"none":"0 2px 8px rgba(0,0,0,.06)"}}>
            <div style={{padding:"18px 22px",borderBottom:`1px solid ${theme.border}`}}>
              <h3 style={{fontSize:16,fontWeight:800,color:theme.text}}>Weekly Operating Hours</h3>
              <p style={{fontSize:13,color:theme.textMuted,marginTop:4}}>Set the opening and closing times for each day of the week.</p>
            </div>
            <div style={{padding:"8px 0"}}>
              {schedules.map(sc=>(
                <div key={sc.id} style={{display:"flex",alignItems:"center",gap:16,padding:"14px 22px",borderBottom:`1px solid ${theme.border}`,flexWrap:"wrap"}}>
                  <div style={{width:110,flexShrink:0}}>
                    <p style={{fontSize:14,fontWeight:700,color:theme.text}}>{DAY_NAMES[sc.id]}</p>
                  </div>
                  <button onClick={()=>updateSchedule(sc.id,"is_open",!sc.is_open)} disabled={saving}
                    style={{padding:"6px 14px",borderRadius:8,border:"1px solid",fontSize:12,fontWeight:700,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",
                      background:sc.is_open?"rgba(74,222,128,.1)":"rgba(248,113,113,.1)",
                      borderColor:sc.is_open?"rgba(74,222,128,.3)":"rgba(248,113,113,.3)",
                      color:sc.is_open?"#4ade80":"#f87171"}}>
                    {sc.is_open?"Open":"Closed"}
                  </button>
                  {sc.is_open&&(
                    <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
                      <div>
                        <p style={{fontSize:10,fontWeight:700,color:theme.textFaint,textTransform:"uppercase",letterSpacing:".1em",marginBottom:4}}>Opens</p>
                        <input type="time" defaultValue={sc.opening_time?.slice(0,5)} onBlur={e=>updateSchedule(sc.id,"opening_time",e.target.value+":00")}
                          style={{height:38,padding:"0 12px",background:theme.inputBg,border:`1px solid ${theme.inputBorder}`,borderRadius:8,color:theme.text,fontSize:13,fontFamily:"'DM Sans',sans-serif",outline:"none",colorScheme:theme.isDark?"dark":"light"}}/>
                      </div>
                      <span style={{color:theme.textFaint,marginTop:16}}>→</span>
                      <div>
                        <p style={{fontSize:10,fontWeight:700,color:theme.textFaint,textTransform:"uppercase",letterSpacing:".1em",marginBottom:4}}>Closes</p>
                        <input type="time" defaultValue={sc.closing_time?.slice(0,5)} onBlur={e=>updateSchedule(sc.id,"closing_time",e.target.value+":00")}
                          style={{height:38,padding:"0 12px",background:theme.inputBg,border:`1px solid ${theme.inputBorder}`,borderRadius:8,color:theme.text,fontSize:13,fontFamily:"'DM Sans',sans-serif",outline:"none",colorScheme:theme.isDark?"dark":"light"}}/>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div style={{background:theme.card,border:`1px solid ${theme.border}`,borderRadius:12,padding:"22px 24px",boxShadow:theme.isDark?"none":"0 2px 8px rgba(0,0,0,.06)"}}>
            <h3 style={{fontSize:16,fontWeight:800,color:theme.text,marginBottom:4}}>Special Note</h3>
            <p style={{fontSize:13,color:theme.textMuted,marginBottom:16}}>This note appears on the closed modal.</p>
            <textarea value={scheduleNote} onChange={e=>setScheduleNote(e.target.value)} placeholder="Leave empty for no special note…" rows={3}
              style={{width:"100%",padding:"12px 16px",background:theme.inputBg,border:`1.5px solid ${theme.inputBorder}`,borderRadius:10,color:theme.text,fontSize:14,fontFamily:"'DM Sans',sans-serif",outline:"none",resize:"vertical",marginBottom:12}}
              onFocus={e=>e.target.style.borderColor="rgba(212,175,55,.55)"} onBlur={e=>e.target.style.borderColor=theme.inputBorder}/>
            <button onClick={saveNote} disabled={savingNote}
              style={{padding:"10px 24px",background:"linear-gradient(135deg,#7a5800,#B8860B,#DAA520)",border:"none",borderRadius:10,color:"#fff",fontSize:14,fontWeight:700,fontFamily:"'DM Sans',sans-serif",cursor:savingNote?"not-allowed":"pointer",opacity:savingNote?.65:1}}>
              {savingNote?"Saving…":"Save Note"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// HELP CONTENT MANAGEMENT PAGE
// ══════════════════════════════════════════════════════════
function HelpManagementPage({ theme }: { theme:Theme }) {
  const [items,     setItems]     = useState<HelpContent[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [editItem,  setEditItem]  = useState<HelpContent|null>(null);
  const [showNew,   setShowNew]   = useState(false);
  const [activeTab, setActiveTab] = useState<"faq"|"contact"|"troubleshooting">("faq");
  const [toast,     setToast]     = useState("");

  useEffect(()=>{ fetchItems(); },[]);

  const fetchItems = async () => {
    const { data } = await supabase.from("help_content").select("*").order("section").order("sort_order");
    if (data) setItems(data as HelpContent[]);
    setLoading(false);
  };

  const showToast = (msg: string) => { setToast(msg); setTimeout(()=>setToast(""),3000); };

  const toggleActive = async (item: HelpContent) => {
    await supabase.from("help_content").update({is_active:!item.is_active}).eq("id",item.id);
    fetchItems();
    showToast(item.is_active?"Item hidden from kiosk":"Item shown on kiosk");
  };

  const deleteItem = async (id: string) => {
    if (!confirm("Delete this help item?")) return;
    await supabase.from("help_content").delete().eq("id",id);
    fetchItems();
    showToast("Item deleted");
  };

  const sectionItems = items.filter(i=>i.section===activeTab);
  const SECTION_LABELS = { faq:"FAQs", contact:"Help Contacts", troubleshooting:"Troubleshooting" };
  const SECTION_COLORS = { faq:{color:"#93C5FD",bg:"rgba(147,197,253,.1)"}, contact:{color:"#6EE7B7",bg:"rgba(110,231,183,.1)"}, troubleshooting:{color:"#FCD34D",bg:"rgba(252,211,77,.1)"} };

  return (
    <div style={{padding:"28px 32px",minHeight:"100vh",background:theme.bg,color:theme.text}}>
      <AnimatePresence>
        {toast&&<motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-20}}
          style={{position:"fixed",top:20,right:20,zIndex:999,background:"rgba(74,222,128,.15)",border:"1px solid rgba(74,222,128,.3)",borderRadius:10,padding:"12px 20px",color:"#4ade80",fontSize:13,fontWeight:700,fontFamily:"'DM Sans',sans-serif"}}>
          ✓ {toast}
        </motion.div>}
      </AnimatePresence>

      {(editItem||showNew)&&(
        <HelpItemModal item={editItem} defaultSection={activeTab}
          onClose={()=>{setEditItem(null);setShowNew(false);}}
          onSaved={()=>{setEditItem(null);setShowNew(false);fetchItems();showToast("Help item saved!");}}/>
      )}

      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:24,flexWrap:"wrap",gap:12}}>
        <div>
          <p style={{fontSize:11,fontWeight:700,letterSpacing:".28em",textTransform:"uppercase",color:"rgba(212,175,55,.6)",marginBottom:6}}>Kiosk Content</p>
          <h1 style={{fontSize:32,fontWeight:900,color:theme.text,fontFamily:"'Playfair Display',serif"}}>Help Content</h1>
        </div>
        <button onClick={()=>setShowNew(true)}
          style={{padding:"10px 20px",background:"linear-gradient(135deg,#7a5800,#B8860B,#DAA520)",border:"none",borderRadius:10,color:"#fff",fontSize:13,fontWeight:700,fontFamily:"'DM Sans',sans-serif",cursor:"pointer"}}>
          + Add New Item
        </button>
      </div>

      <div style={{display:"flex",gap:10,marginBottom:20,flexWrap:"wrap"}}>
        {(["faq","contact","troubleshooting"] as const).map(sec=>{
          const meta=SECTION_COLORS[sec];
          return(
            <button key={sec} onClick={()=>setActiveTab(sec)}
              style={{padding:"10px 20px",borderRadius:10,border:"1px solid",fontSize:13,fontWeight:700,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",
                background:activeTab===sec?meta.bg:"transparent",
                borderColor:activeTab===sec?meta.color:theme.border,
                color:activeTab===sec?meta.color:theme.textMuted}}>
              {SECTION_LABELS[sec]} <span style={{fontSize:11,opacity:.7}}>({items.filter(i=>i.section===sec).length})</span>
            </button>
          );
        })}
      </div>

      {loading?<div style={{textAlign:"center",padding:"60px",color:theme.textFaint}}>Loading…</div>:(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {sectionItems.length===0?(
            <div style={{textAlign:"center",padding:"60px 20px",background:theme.card,border:`1px solid ${theme.border}`,borderRadius:12}}>
              <p style={{fontSize:28,marginBottom:10}}>◈</p>
              <p style={{color:theme.textFaint,fontSize:14}}>No items in this section yet.</p>
              <button onClick={()=>setShowNew(true)} style={{marginTop:14,padding:"8px 20px",background:"rgba(212,175,55,.1)",border:"1px solid rgba(212,175,55,.3)",borderRadius:8,color:"#DAA520",fontSize:13,fontWeight:700,fontFamily:"'DM Sans',sans-serif",cursor:"pointer"}}>+ Add First Item</button>
            </div>
          ):sectionItems.map(item=>(
            <motion.div key={item.id} layout
              style={{background:theme.card,border:`1px solid ${theme.border}`,borderRadius:12,padding:"16px 20px",opacity:item.is_active?1:.55,display:"flex",alignItems:"flex-start",gap:14,boxShadow:theme.isDark?"none":"0 2px 8px rgba(0,0,0,.06)"}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                  <p style={{fontSize:14,fontWeight:700,color:theme.text}}>{item.title}</p>
                  {!item.is_active&&<span style={{fontSize:10,fontWeight:700,color:theme.textFaint,background:theme.inputBg,padding:"2px 8px",borderRadius:4}}>HIDDEN</span>}
                </div>
                <p style={{fontSize:13,color:theme.textMuted,lineHeight:1.6}}>{item.content}</p>
                <p style={{fontSize:11,color:theme.textFaint,marginTop:6}}>Sort order: {item.sort_order}</p>
              </div>
              <div style={{display:"flex",gap:6,flexShrink:0}}>
                <button onClick={()=>toggleActive(item)}
                  style={{padding:"6px 12px",borderRadius:7,border:"1px solid",fontSize:11,fontWeight:700,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",background:item.is_active?"rgba(248,113,113,.08)":"rgba(74,222,128,.08)",borderColor:item.is_active?"rgba(248,113,113,.3)":"rgba(74,222,128,.3)",color:item.is_active?"#f87171":"#4ade80"}}>
                  {item.is_active?"Hide":"Show"}
                </button>
                <button onClick={()=>setEditItem(item)}
                  style={{padding:"6px 12px",borderRadius:7,border:"1px solid rgba(212,175,55,.3)",fontSize:11,fontWeight:700,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",background:"rgba(212,175,55,.08)",color:"#DAA520"}}>
                  Edit
                </button>
                <button onClick={()=>deleteItem(item.id)}
                  style={{padding:"6px 12px",borderRadius:7,border:`1px solid ${theme.border}`,fontSize:11,fontWeight:700,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",background:theme.inputBg,color:theme.textMuted}}>
                  Delete
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Help Item Modal ──
function HelpItemModal({ item, defaultSection, onClose, onSaved }: {
  item: HelpContent|null; defaultSection: string; onClose:()=>void; onSaved:()=>void;
}) {
  const [section,   setSection]   = useState<"faq"|"contact"|"troubleshooting">(item?.section||defaultSection as "faq"|"contact"|"troubleshooting");
  const [title,     setTitle]     = useState(item?.title||"");
  const [content,   setContent]   = useState(item?.content||"");
  const [sortOrder, setSortOrder] = useState(item?.sort_order||0);
  const [saving,    setSaving]    = useState(false);

  const handleSave = async () => {
    if (!title.trim()||!content.trim()) return;
    setSaving(true);
    if (item) {
      await supabase.from("help_content").update({section,title:title.trim(),content:content.trim(),sort_order:sortOrder}).eq("id",item.id);
    } else {
      await supabase.from("help_content").insert({section,title:title.trim(),content:content.trim(),sort_order:sortOrder,is_active:true});
    }
    setSaving(false); onSaved();
  };

  const inputStyle:React.CSSProperties={width:"100%",padding:"12px 16px",background:"rgba(255,255,255,.07)",border:"1.5px solid rgba(255,255,255,.13)",borderRadius:10,color:"#fff",fontSize:14,fontFamily:"'DM Sans',sans-serif",outline:"none"};

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      style={{position:"fixed",inset:0,zIndex:400,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(6,13,26,.85)",backdropFilter:"blur(12px)",padding:24}}>
      <motion.div initial={{opacity:0,scale:.92,y:24}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:.92,y:24}}
        transition={{duration:.4,ease:EASE}}
        style={{width:"100%",maxWidth:520,background:"#0d1f3e",border:"1px solid rgba(212,175,55,.2)",borderTop:"2px solid #DAA520",borderRadius:20,padding:"28px",boxShadow:"0 24px 80px rgba(0,0,0,.6)"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:22}}>
          <h2 style={{fontSize:20,fontWeight:900,color:"#fff",fontFamily:"'Playfair Display',serif"}}>{item?"Edit Help Item":"New Help Item"}</h2>
          <button onClick={onClose} style={{background:"rgba(255,255,255,.07)",border:"1px solid rgba(255,255,255,.1)",borderRadius:8,color:"rgba(255,255,255,.6)",fontSize:16,cursor:"pointer",width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'DM Sans',sans-serif"}}>✕</button>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div>
            <label style={{display:"block",fontSize:11,fontWeight:700,letterSpacing:".16em",textTransform:"uppercase",color:"rgba(255,255,255,.48)",marginBottom:7}}>Section</label>
            <select value={section} onChange={e=>setSection(e.target.value as "faq"|"contact"|"troubleshooting")}
              style={{width:"100%",height:46,padding:"0 14px",background:"#0d1f3e",border:"1.5px solid rgba(255,255,255,.13)",borderRadius:10,color:"#fff",fontSize:14,fontFamily:"'DM Sans',sans-serif",outline:"none",colorScheme:"dark"}}>
              <option value="faq">FAQs</option>
              <option value="contact">Help Contacts</option>
              <option value="troubleshooting">Troubleshooting</option>
            </select>
          </div>
          <div>
            <label style={{display:"block",fontSize:11,fontWeight:700,letterSpacing:".16em",textTransform:"uppercase",color:"rgba(255,255,255,.48)",marginBottom:7}}>Title</label>
            <input type="text" value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. How do I check in?" style={inputStyle} onFocus={e=>e.target.style.borderColor="rgba(212,175,55,.55)"} onBlur={e=>e.target.style.borderColor="rgba(255,255,255,.13)"}/>
          </div>
          <div>
            <label style={{display:"block",fontSize:11,fontWeight:700,letterSpacing:".16em",textTransform:"uppercase",color:"rgba(255,255,255,.48)",marginBottom:7}}>Content</label>
            <textarea value={content} onChange={e=>setContent(e.target.value)} placeholder="Write the answer or information here…" rows={4}
              style={{...inputStyle,resize:"vertical"}} onFocus={e=>e.target.style.borderColor="rgba(212,175,55,.55)"} onBlur={e=>e.target.style.borderColor="rgba(255,255,255,.13)"}/>
          </div>
          <div>
            <label style={{display:"block",fontSize:11,fontWeight:700,letterSpacing:".16em",textTransform:"uppercase",color:"rgba(255,255,255,.48)",marginBottom:7}}>Sort Order</label>
            <input type="number" value={sortOrder} onChange={e=>setSortOrder(Number(e.target.value))} style={{...inputStyle,width:"120px"}} onFocus={e=>e.target.style.borderColor="rgba(212,175,55,.55)"} onBlur={e=>e.target.style.borderColor="rgba(255,255,255,.13)"}/>
            <p style={{fontSize:11,color:"rgba(255,255,255,.28)",marginTop:5}}>Lower number = appears first</p>
          </div>
        </div>
        <div style={{display:"flex",gap:10,marginTop:22}}>
          <button onClick={onClose} style={{flex:1,height:46,background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.12)",borderRadius:10,color:"rgba(255,255,255,.6)",fontSize:14,fontWeight:700,fontFamily:"'DM Sans',sans-serif",cursor:"pointer"}}>Cancel</button>
          <button onClick={handleSave} disabled={saving||!title.trim()||!content.trim()}
            style={{flex:2,height:46,background:"linear-gradient(135deg,#7a5800,#B8860B,#DAA520)",border:"none",borderRadius:10,color:"#fff",fontSize:14,fontWeight:700,fontFamily:"'DM Sans',sans-serif",cursor:saving?"not-allowed":"pointer",opacity:saving?.65:1}}>
            {saving?"Saving…":item?"Save Changes":"Create Item"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════
// SETTINGS PAGE
// ══════════════════════════════════════════════════════════
function SettingsPage({ darkMode, textSize, onDarkMode, onTextSize, theme }: {
  darkMode: boolean;
  textSize: "small"|"medium"|"large";
  onDarkMode: (v: boolean) => void;
  onTextSize: (v: "small"|"medium"|"large") => void;
  theme: Theme;
}) {
  return (
    <div style={{padding:"28px 32px",minHeight:"100vh",background:theme.bg,color:theme.text}}>
      <div style={{marginBottom:28}}>
        <p style={{fontSize:11,fontWeight:700,letterSpacing:".28em",textTransform:"uppercase",color:"rgba(212,175,55,.6)",marginBottom:6}}>Preferences</p>
        <h1 style={{fontSize:32,fontWeight:900,color:theme.text,fontFamily:"'Playfair Display',serif"}}>Settings</h1>
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:16,maxWidth:580}}>

        {/* Theme */}
        <div style={{background:theme.card,border:`1px solid ${theme.border}`,borderRadius:12,padding:"22px 24px",boxShadow:theme.isDark?"none":"0 2px 8px rgba(0,0,0,.06)"}}>
          <h3 style={{fontSize:16,fontWeight:800,color:theme.text,marginBottom:4}}>Appearance</h3>
          <p style={{fontSize:13,color:theme.textMuted,marginBottom:20}}>Choose how the admin dashboard looks.</p>
          <div style={{display:"flex",gap:12}}>
            {[
              {val:true,  label:"Dark Mode",  icon:"◑", desc:"Dark navy theme"},
              {val:false, label:"Light Mode", icon:"◐", desc:"Clean blue theme"},
            ].map(t=>(
              <button key={String(t.val)} type="button" onClick={()=>onDarkMode(t.val)}
                style={{flex:1,padding:"16px",borderRadius:12,border:"1.5px solid",cursor:"pointer",textAlign:"left",fontFamily:"'DM Sans',sans-serif",transition:"all .18s",
                  background:darkMode===t.val?"rgba(212,175,55,.1)":theme.inputBg,
                  borderColor:darkMode===t.val?"#DAA520":theme.border,
                }}>
                <p style={{fontSize:28,marginBottom:8,color:darkMode===t.val?"#DAA520":theme.textMuted}}>{t.icon}</p>
                <p style={{fontSize:14,fontWeight:700,color:darkMode===t.val?"#DAA520":theme.text,marginBottom:3}}>{t.label}</p>
                <p style={{fontSize:12,color:theme.textFaint}}>{t.desc}</p>
                {darkMode===t.val&&<div style={{marginTop:10,display:"inline-flex",alignItems:"center",gap:5,background:"rgba(212,175,55,.15)",padding:"3px 10px",borderRadius:100,fontSize:10,fontWeight:700,color:"#DAA520"}}>✓ Active</div>}
              </button>
            ))}
          </div>
        </div>

        {/* Text Size */}
        <div style={{background:theme.card,border:`1px solid ${theme.border}`,borderRadius:12,padding:"22px 24px",boxShadow:theme.isDark?"none":"0 2px 8px rgba(0,0,0,.06)"}}>
          <h3 style={{fontSize:16,fontWeight:800,color:theme.text,marginBottom:4}}>Text Size</h3>
          <p style={{fontSize:13,color:theme.textMuted,marginBottom:20}}>Adjust the size of text across the dashboard.</p>
          <div style={{display:"flex",gap:10}}>
            {([
              {val:"small",  label:"Small",  size:13},
              {val:"medium", label:"Medium", size:15},
              {val:"large",  label:"Large",  size:16},
            ] as const).map(t=>(
              <button key={t.val} type="button" onClick={()=>onTextSize(t.val)}
                style={{flex:1,padding:"16px 12px",borderRadius:12,border:"1.5px solid",cursor:"pointer",textAlign:"center",fontFamily:"'DM Sans',sans-serif",transition:"all .18s",
                  background:textSize===t.val?"rgba(147,197,253,.1)":theme.inputBg,
                  borderColor:textSize===t.val?"#93C5FD":theme.border,
                }}>
                <p style={{fontSize:t.size,fontWeight:700,color:textSize===t.val?"#93C5FD":theme.text,marginBottom:4}}>Aa</p>
                <p style={{fontSize:12,fontWeight:700,color:textSize===t.val?"#93C5FD":theme.textMuted}}>{t.label}</p>
                {textSize===t.val&&<div style={{marginTop:8,display:"inline-flex",alignItems:"center",gap:5,background:"rgba(147,197,253,.12)",padding:"3px 10px",borderRadius:100,fontSize:10,fontWeight:700,color:"#93C5FD"}}>✓ Active</div>}
              </button>
            ))}
          </div>
        </div>

        {/* Info */}
        <div style={{background:theme.isDark?"rgba(212,175,55,.06)":"rgba(212,175,55,.05)",border:"1px solid rgba(212,175,55,.15)",borderRadius:12,padding:"16px 20px",display:"flex",gap:12,alignItems:"flex-start"}}>
          <span style={{fontSize:16,flexShrink:0,color:"#DAA520"}}>◈</span>
          <p style={{fontSize:13,color:theme.textMuted,lineHeight:1.6}}>
            Settings are saved automatically to your browser and will persist across sessions on this device.
          </p>
        </div>
      </div>
    </div>
  );
}