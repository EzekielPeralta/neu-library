"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import type { LibrarySchedule, KioskStudent } from "@/app/lib/types";
import { useTheme, getThemeColors } from "@/app/lib/themeContext";
import { useSound } from "@/app/lib/soundContext";
import KioskIntro from "@/app/components/KioskIntro";

type Tab    = "qr" | "manual";
type Status = "idle" | "scanning" | "processing" | "error" | "success";
type Flow   = "timein" | "timeout";

const BG_IMAGE = "/neu-library-bg.jpg";
const EASE: [number,number,number,number] = [0.22,1,0.36,1];

const QUOTES = [
  { text: "Reading is to the mind what exercise is to the body.", author: "Joseph Addison" },
  { text: "The more that you read, the more things you will know.", author: "Dr. Seuss" },
  { text: "A room without books is like a body without a soul.", author: "Marcus Tullius Cicero" },
  { text: "Education is the most powerful weapon to change the world.", author: "Nelson Mandela" },
  { text: "The beautiful thing about learning is that no one can take it away from you.", author: "B.B. King" },
  { text: "Knowledge is power. Information is liberating.", author: "Kofi Annan" },
  { text: "Live as if you were to die tomorrow. Learn as if you were to live forever.", author: "Mahatma Gandhi" },
];

// ── iOS Liquid Glass style ──
const GLASS: React.CSSProperties = {
  background: "linear-gradient(135deg, rgba(255,255,255,.22) 0%, rgba(255,255,255,.10) 100%)",
  backdropFilter: "blur(80px) saturate(200%) brightness(1.08)",
  WebkitBackdropFilter: "blur(80px) saturate(200%) brightness(1.08)",
  border: "1px solid rgba(255,255,255,.35)",
  borderTop: "1px solid rgba(255,255,255,.55)",
  borderLeft: "1px solid rgba(255,255,255,.28)",
  borderBottom: "1px solid rgba(255,255,255,.08)",
  borderRight: "1px solid rgba(255,255,255,.12)",
  borderRadius: 26,
  padding: "28px 28px",
  boxShadow: [
    "inset 0 1px 0 rgba(255,255,255,.55)",
    "inset 0 -1px 0 rgba(0,0,0,.06)",
    "inset 1px 0 0 rgba(255,255,255,.25)",
    "0 20px 60px rgba(0,0,0,.28)",
    "0 0 0 0.5px rgba(255,255,255,.18)",
    "0 0 80px rgba(212,175,55,.06)",
  ].join(","),
};

function getTodaySchedule(schedules: LibrarySchedule[]): LibrarySchedule | null {
  const day = new Date().getDay();
  const id  = day === 0 ? 7 : day;
  return schedules.find(s => s.id === id) ?? null;
}

function LibraryBadge({ isOpen }: { isOpen: boolean | null }) {
  if (isOpen === null) return null;
  return (
    <div style={{ display:"flex", alignItems:"center", gap:6,
      background:isOpen?"rgba(74,222,128,.15)":"rgba(248,113,113,.15)",
      border:`1px solid ${isOpen?"rgba(74,222,128,.35)":"rgba(248,113,113,.35)"}`,
      padding:"5px 12px", borderRadius:100, backdropFilter:"blur(10px)" }}>
      <span style={{ width:6, height:6, borderRadius:"50%", background:isOpen?"#4ade80":"#f87171", display:"inline-block" }} />
      <span style={{ fontSize:11, fontWeight:700, color:isOpen?"#4ade80":"#f87171", letterSpacing:".06em" }}>
        {isOpen ? "OPEN" : "CLOSED"}
      </span>
    </div>
  );
}

function ClosedModal({ note, onAdmin }: { note: string | null; onAdmin: () => void }) {
  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      style={{ position:"fixed", inset:0, zIndex:200, display:"flex", alignItems:"center", justifyContent:"center",
               background:"rgba(6,13,26,.75)", backdropFilter:"blur(20px)", padding:24 }}>
      <motion.div initial={{opacity:0,scale:.9,y:24}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:.9,y:24}}
        transition={{duration:.4, ease:EASE}}
        style={{ width:"100%", maxWidth:460, ...GLASS, borderTop:"3px solid rgba(248,113,113,.6)", textAlign:"center" }}>
        <div style={{ width:72, height:72, borderRadius:"50%", background:"rgba(248,113,113,.1)", border:"2px solid rgba(248,113,113,.3)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px", fontSize:32 }}>😔</div>
        <p style={{ fontSize:11, fontWeight:700, letterSpacing:".28em", textTransform:"uppercase", color:"rgba(248,113,113,.8)", marginBottom:8 }}>Library is Closed</p>
        <h2 style={{ fontSize:28, fontWeight:900, color:"#fff", fontFamily:"'Playfair Display',serif", lineHeight:1.2, marginBottom:10 }}>Sorry, we&apos;re closed!</h2>
        <p style={{ fontSize:15, color:"rgba(255,255,255,.6)", marginBottom:24, lineHeight:1.6 }}>Please come back during operating hours.</p>
        <div style={{ background:"rgba(255,255,255,.08)", border:"1px solid rgba(255,255,255,.12)", borderRadius:14, padding:"16px 20px", marginBottom:16 }}>
          <p style={{ fontSize:11, fontWeight:700, letterSpacing:".18em", textTransform:"uppercase", color:"rgba(255,255,255,.4)", marginBottom:12 }}>Library Hours</p>
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            {[["Mon / Tue / Wed / Fri","7:00 AM – 7:00 PM"],["Thursday / Saturday","7:00 AM – 6:00 PM"],["Sunday","Closed"]].map(([day,hrs])=>(
              <div key={day} style={{ display:"flex", justifyContent:"space-between" }}>
                <span style={{ fontSize:13, color:"rgba(255,255,255,.65)" }}>{day}</span>
                <span style={{ fontSize:13, fontWeight:700, color:day==="Sunday"?"#f87171":"#DAA520" }}>{hrs}</span>
              </div>
            ))}
          </div>
        </div>
        {note && (
          <div style={{ background:"rgba(212,175,55,.1)", border:"1px solid rgba(212,175,55,.25)", borderRadius:10, padding:"10px 14px", marginBottom:16 }}>
            <p style={{ fontSize:13, color:"#DAA520", fontWeight:600 }}>📢 {note}</p>
          </div>
        )}
        <button onClick={onAdmin}
          style={{ width:"100%", height:48, background:"rgba(212,175,55,.15)", border:"1px solid rgba(212,175,55,.35)", borderRadius:12, color:"#FFD700", fontSize:14, fontWeight:700, fontFamily:"'DM Sans',sans-serif", cursor:"pointer" }}
          onMouseEnter={e=>(e.currentTarget.style.background="rgba(212,175,55,.25)")}
          onMouseLeave={e=>(e.currentTarget.style.background="rgba(212,175,55,.15)")}>
          Admin Access →
        </button>
      </motion.div>
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════
export default function KioskPage() {
  const router = useRouter();
  const { mode } = useTheme();
  const theme = getThemeColors(mode === "dark");
  const { playSound } = useSound();
  const [tab,             setTab]             = useState<Tab>("qr");
  const [status,          setStatus]          = useState<Status>("idle");
  const [message,         setMessage]         = useState("Scan QR or sign in with Google");
  const [clock,           setClock]           = useState("");
  const [date,            setDate]            = useState("");
  const [camReady,        setCamReady]        = useState(false);
  const [manualId,        setManualId]        = useState("");
  const [manualErr,       setManualErr]       = useState("");
  const [manualLoading,   setManualLoading]   = useState(false);
  const [googleLoading,   setGoogleLoading]   = useState(false);
  const [resultFlow,      setResultFlow]      = useState<Flow>("timein");
  const [resultStudent,   setResultStudent]   = useState<KioskStudent|null>(null);
  const [resultTime,      setResultTime]      = useState("");
  const [showResult,      setShowResult]      = useState(false);
  const [showAdminChoice, setShowAdminChoice] = useState(false);
  const [adminEmail,      setAdminEmail]      = useState("");
  const [adminStudent,    setAdminStudent]    = useState<KioskStudent|null>(null);
  const [libOpen,         setLibOpen]         = useState<boolean|null>(null);
  const [schedules,       setSchedules]       = useState<LibrarySchedule[]>([]);
  const [scheduleNote,    setScheduleNote]    = useState<string|null>(null);
  const [showClosed,      setShowClosed]      = useState(false);
  const [quoteIndex,      setQuoteIndex]      = useState(0);
  const [showIntro,       setShowIntro]       = useState(() => {
    // Check flag on initial state - only skip if flag exists AND is recent (within 1 minute)
    // Use ONLY sessionStorage so refresh clears it and shows intro
    if (typeof window !== 'undefined') {
      const skipIntro = sessionStorage.getItem('skip_kiosk_intro');
      const timestamp = sessionStorage.getItem('skip_intro_timestamp');
      
      if (skipIntro === 'true' && timestamp) {
        const age = Date.now() - parseInt(timestamp);
        const oneMinute = 60 * 1000;
        if (age < oneMinute) {
          return false; // Skip intro
        } else {
          sessionStorage.removeItem('skip_kiosk_intro');
          sessionStorage.removeItem('skip_intro_timestamp');
          return true; // Show intro
        }
      }
      
      return skipIntro !== 'true';
    }
    return true; // Default to showing intro
  });
  const scannerRef = useRef<unknown>(null);
  const qrStarted  = useRef(false);

  useEffect(()=>{
    // Flag check is now done in useState initializer
    // No need to clear flag here - it will be cleared when user starts new interaction
    
    const tick=()=>{
      setClock(new Date().toLocaleTimeString("en-PH",{hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:true}));
      setDate(new Date().toLocaleDateString("en-PH",{weekday:"long",month:"long",day:"numeric",year:"numeric"}));
    };
    tick(); const id=setInterval(tick,1000);
    loadLibraryStatus(); checkGoogleReturn();
    // Quote rotation
    const quoteInterval = setInterval(() => {
      setQuoteIndex(prev => (prev + 1) % QUOTES.length);
    }, 8000);
    return()=>{clearInterval(id);clearInterval(quoteInterval);stopQR();};
  },[]);

  useEffect(()=>{
    let cancelled=false;
    if(tab==="qr" && !showIntro){
      const el=document.getElementById("qr-reader-kiosk");
      if(el&&el.childElementCount>0)return;
      if(qrStarted.current)return;
      const run=async()=>{
        await new Promise(r=>setTimeout(r,200));
        if(cancelled||qrStarted.current)return;
        startQR();
      };
      run();
    } else {
      stopQR();setCamReady(false);qrStarted.current=false;setStatus("idle");
    }
    return()=>{ cancelled=true; if(tab!=="qr"){stopQR();} };
  },[tab, showIntro]);

  const loadLibraryStatus=async()=>{
    const{data:ls}=await supabase.from("library_status").select("*").eq("id",1).single();
    const{data:sc}=await supabase.from("library_schedule").select("*").order("id");
    if(ls){setLibOpen(ls.is_open);setScheduleNote(ls.schedule_note);if(!ls.is_open)setShowClosed(true);}
    if(sc)setSchedules(sc as LibrarySchedule[]);
  };

const buildKioskStudent=(s:Record<string,unknown>):KioskStudent=>({
  student_id:s.student_id as string, name:s.name as string,
  college:(s.college as string)??"",
  college_code:((s.college as string)??"").split(" — ")[0]??"",
  program_name:(s.programs as{name?:string}|null)?.name??"",
  year_level:s.year_level as number|null,
  employee_status:s.employee_status as string,
  photo_url:(s.photo_url as string|null)??null,
});

  const checkGoogleReturn=async()=>{
    const{data:{session}}=await supabase.auth.getSession();
    if(!session?.user)return;
    const email=session.user.email||"";
    if(!email.endsWith("@neu.edu.ph")){await supabase.auth.signOut();setStatus("error");setMessage("Only @neu.edu.ph accounts are allowed");return;}
    const{data:rd}=await supabase.from("user_roles").select("role").eq("email",email).eq("role","admin").single();
    if(rd){
      document.cookie=`user_email=${email}; path=/; max-age=86400`;
      document.cookie=`active_role=admin; path=/; max-age=86400`;
      const{data:st}=await supabase.from("students").select("*,photo_url,programs(name,colleges(code,name))").eq("email",email).single();
      setAdminEmail(email);
      if(st) setAdminStudent(buildKioskStudent(st as Record<string,unknown>));
      setShowAdminChoice(true);return;
    }
    const{data:st}=await supabase.from("students").select("*,photo_url,programs(name,colleges(code,name))").eq("email",email).single();
    if(!st){ router.push("/register"); return; }
    await processCheckIn(buildKioskStudent(st as Record<string,unknown>));
  };

  const handleGoogleSignIn=async()=>{
    setGoogleLoading(true);
    const{error}=await supabase.auth.signInWithOAuth({provider:"google",options:{redirectTo:`${window.location.origin}/kiosk`,queryParams:{hd:"neu.edu.ph"}}});
    if(error){setStatus("error");setMessage("Google sign in failed");setGoogleLoading(false);}
  };

  const processCheckIn=async(student:KioskStudent)=>{
    // Clear skip intro flag and timestamp since user is now actively using kiosk
    sessionStorage.removeItem('skip_kiosk_intro');
    sessionStorage.removeItem('skip_intro_timestamp');
    
    setStatus("processing");setMessage("Processing…");
    const{data:ls}=await supabase.from("library_status").select("is_open").eq("id",1).single();
    if(!ls?.is_open){setShowClosed(true);setStatus("idle");setMessage("Scan QR or sign in with Google");await supabase.auth.signOut();return;}
    const{data:sc}=await supabase.from("students").select("is_blocked").eq("student_id",student.student_id).single();
    if(sc?.is_blocked){
      playSound("error");
      setStatus("error");setMessage("Your access has been restricted. Please contact the library admin.");setTimeout(()=>{setStatus("idle");setMessage("Scan QR or sign in with Google");qrStarted.current=false;startQR();},5000);return;
    }
    const today=new Date().toISOString().split("T")[0];
    const nowTime=new Date().toTimeString().split(" ")[0];
    // Check for existing visit
    const{data:ex}=await supabase.from("library_visits").select("*").eq("student_id",student.student_id).eq("visit_date",today).is("time_out",null).maybeSingle();
    if(ex){
      // Time out existing visit
      await supabase.from("library_visits").update({time_out:nowTime,visit_status:"completed"}).eq("visit_id",ex.visit_id);
      playSound("checkout");
      
      // Set skip intro flag for check-out flow too
      sessionStorage.setItem('skip_kiosk_intro', 'true');
      sessionStorage.setItem('skip_intro_timestamp', Date.now().toString());
      
      setResultFlow("timeout");setResultStudent(student);
      setResultTime(new Date().toLocaleTimeString("en-PH",{hour:"2-digit",minute:"2-digit",hour12:true}));
      setStatus("success");setShowResult(true);await supabase.auth.signOut();
      setTimeout(()=>{setShowResult(false);setStatus("idle");setMessage("Scan QR or sign in with Google");qrStarted.current=false;startQR();},5000);
    }else{
      // New check-in - redirect to reason page
      playSound("checkin");
      sessionStorage.setItem("student",JSON.stringify(student));
      sessionStorage.setItem("kiosk_mode","true");
      setStatus("success");
      setMessage(`Welcome, ${student.name.split(" ")[0]}!`);
      router.push("/reason");
      setTimeout(()=>supabase.auth.signOut(), 1500);
    }
  };

  const handleQRSuccess=async(studentId:string)=>{
   const{data:st,error}=await supabase.from("students").select("*,photo_url, programs(name,colleges(code,name))").eq("student_id",studentId).single();
    if(error||!st){
      playSound("error");
      setStatus("error");setMessage("Student not found — please try again");setTimeout(()=>{setStatus("idle");setMessage("Scan QR or sign in with Google");qrStarted.current=false;startQR();},10000);return;
    }
    await processCheckIn(buildKioskStudent(st as Record<string,unknown>));
  };

  const handleManualSubmit=async(e:React.FormEvent)=>{
    e.preventDefault();if(!manualId.trim())return;
    setManualLoading(true);setManualErr("");
   const{data:st,error}=await supabase.from("students").select("*,photo_url, programs(name,colleges(code,name))").eq("student_id",manualId.trim()).single();
    if(error||!st){
      playSound("error");
      setManualErr("Student ID not found. Please check and try again.");setManualLoading(false);return;
    }
    await processCheckIn(buildKioskStudent(st as Record<string,unknown>));setManualLoading(false);
  };

  const startQR=async()=>{
    if(qrStarted.current) return;
    qrStarted.current=true;
    
    // Stop any existing scanner first
    if(scannerRef.current){
      try{
        const o=scannerRef.current as{stop:()=>Promise<void>;clear:()=>void;isScanning?:boolean};
        if(o.isScanning){await o.stop();}
        o.clear();
      }catch{}
      scannerRef.current=null;
    }
    
    // Clear DOM to prevent double camera
    const existing=document.getElementById("qr-reader-kiosk");
    if(existing)existing.innerHTML="";
    
    try{
      const{Html5Qrcode}=await import("html5-qrcode");
      const qr=new Html5Qrcode("qr-reader-kiosk");
      scannerRef.current=qr as unknown;
      
      await qr.start(
        {facingMode:"environment"},
        {fps:10,qrbox:{width:220,height:220}},
        async(text)=>{
          if(!scannerRef.current)return;
          const currentScanner=scannerRef.current as{stop:()=>Promise<void>;clear:()=>void};
          scannerRef.current=null;
          qrStarted.current=false;
          try{
            await currentScanner.stop();
            currentScanner.clear();
          }catch{}
          setCamReady(false);
          setStatus("processing");
          setMessage("Verifying student ID…");
          await handleQRSuccess(text.trim());
        },
        ()=>{}
      );
      setCamReady(true);
      setStatus("scanning");
    }catch(err){
      console.error('QR scanner error:', err);
      setStatus("error");
      setMessage("Camera unavailable — use manual entry or Google Sign In");
      setCamReady(false);
      qrStarted.current=false;
    }
  };

  const stopQR=async()=>{
    const qr=scannerRef.current as{stop:()=>Promise<void>;clear:()=>void}|null;scannerRef.current=null;
    if(!qr)return;try{await qr.stop();}catch{}try{qr.clear();}catch{}setCamReady(false);
  };

  const todaySchedule=getTodaySchedule(schedules);

  // ══ SHARED BACKGROUND ══
  const PageBg=()=>(
    <>
      <div style={{position:"fixed",inset:0,zIndex:0}}>
        <Image src={BG_IMAGE} alt="" fill style={{objectFit:"cover",objectPosition:"center"}} priority/>
        <div style={{position:"absolute",inset:0,background:"rgba(6,13,26,.78)"}}/>
      </div>
      <div style={{position:"fixed",inset:0,backgroundImage:"radial-gradient(circle at 2px 2px,rgba(255,255,255,.02) 1px,transparent 0)",backgroundSize:"28px 28px",pointerEvents:"none",zIndex:1}}/>
      <div style={{position:"fixed",bottom:0,left:0,right:0,height:1,background:"linear-gradient(90deg,transparent,rgba(212,175,55,.2),transparent)",pointerEvents:"none",zIndex:2}}/>
    </>
  );

  // ══ ADMIN CHOICE ══
  if(showAdminChoice){
    return(
      <div style={{height:"100vh",overflow:"auto",fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",position:"relative",color:"#fff"}}>
        <PageBg/>
        <motion.div initial={{opacity:0,y:24}} animate={{opacity:1,y:0}} transition={{duration:.5,ease:EASE}}
          style={{width:"100%",maxWidth:480,padding:"0 24px",position:"relative",zIndex:10}}>
          <div style={{textAlign:"center",marginBottom:28}}>
            <div style={{position:"relative",display:"inline-block",marginBottom:16}}>
              <div style={{position:"absolute",inset:-16,borderRadius:"50%",background:"radial-gradient(circle,rgba(212,175,55,.2),transparent 68%)",filter:"blur(14px)"}}/>
              <div style={{width:80,height:80,borderRadius:"50%",background:"rgba(6,13,26,.5)",border:"2px solid rgba(212,175,55,.4)",padding:9,backdropFilter:"blur(10px)"}}>
                <Image src="/neu-library-logo.png" alt="NEU" width={80} height={80} style={{width:"100%",height:"100%",objectFit:"contain",borderRadius:"50%"}}/>
              </div>
            </div>
            <p style={{fontSize:11,fontWeight:700,letterSpacing:".28em",textTransform:"uppercase",color:"rgba(255,255,255,.5)",marginBottom:6}}>Welcome back</p>
            <h1 style={{fontSize:28,fontWeight:900,color:"#fff",fontFamily:"'Playfair Display',serif",lineHeight:1.15,marginBottom:4}}>{adminStudent?.name||adminEmail.split("@")[0]}</h1>
            <p style={{fontSize:13,color:"rgba(255,255,255,.45)"}}>{adminEmail}</p>
            <div style={{display:"inline-flex",alignItems:"center",gap:6,background:"rgba(212,175,55,.15)",border:"1px solid rgba(212,175,55,.3)",color:"#DAA520",fontSize:11,fontWeight:700,padding:"4px 12px",borderRadius:100,marginTop:8}}>ADMIN</div>
          </div>
          <div style={{...GLASS}}>
            <p style={{fontSize:14,color:"rgba(255,255,255,.6)",textAlign:"center",marginBottom:22}}>You have admin access. What would you like to do?</p>
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              <motion.button whileHover={{scale:1.01}} whileTap={{scale:.98}}
                onClick={async()=>{setShowAdminChoice(false);if(adminStudent)await processCheckIn(adminStudent);}}
                style={{width:"100%",padding:"16px 20px",background:"rgba(255,255,255,.1)",border:"1px solid rgba(255,255,255,.2)",borderRadius:14,color:"#fff",cursor:"pointer",textAlign:"left",fontFamily:"'DM Sans',sans-serif",backdropFilter:"blur(10px)"}}>
                <div style={{display:"flex",alignItems:"center",gap:14}}>
                  <div style={{width:46,height:46,borderRadius:13,background:"rgba(74,222,128,.15)",border:"1px solid rgba(74,222,128,.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>📋</div>
                  <div style={{flex:1}}><p style={{fontSize:15,fontWeight:700,color:"#fff",marginBottom:2}}>Library Check-in / Check-out</p><p style={{fontSize:12,color:"rgba(255,255,255,.5)"}}>Record your visit to the library</p></div>
                  <span style={{fontSize:16,color:"rgba(255,255,255,.4)"}}>→</span>
                </div>
              </motion.button>
              <motion.button whileHover={{scale:1.01}} whileTap={{scale:.98}}
                onClick={async()=>{await supabase.auth.signOut();setShowAdminChoice(false);router.push("/admin");}}
                style={{width:"100%",padding:"16px 20px",background:"rgba(212,175,55,.12)",border:"1px solid rgba(212,175,55,.25)",borderRadius:14,color:"#fff",cursor:"pointer",textAlign:"left",fontFamily:"'DM Sans',sans-serif",backdropFilter:"blur(10px)"}}>
                <div style={{display:"flex",alignItems:"center",gap:14}}>
                  <div style={{width:46,height:46,borderRadius:13,background:"rgba(212,175,55,.15)",border:"1px solid rgba(212,175,55,.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>📊</div>
                  <div style={{flex:1}}><p style={{fontSize:15,fontWeight:700,color:"#DAA520",marginBottom:2}}>Admin Dashboard</p><p style={{fontSize:12,color:"rgba(255,255,255,.5)"}}>View analytics, logs and manage visitors</p></div>
                  <span style={{fontSize:16,color:"rgba(212,175,55,.5)"}}>→</span>
                </div>
              </motion.button>
            </div>
            <div style={{marginTop:20,paddingTop:16,borderTop:"1px solid rgba(255,255,255,.1)",textAlign:"center"}}>
              <button onClick={async()=>{await supabase.auth.signOut();setShowAdminChoice(false);}}
                style={{background:"none",border:"none",cursor:"pointer",fontSize:12,color:"rgba(255,255,255,.35)",fontFamily:"'DM Sans',sans-serif",padding:4}}>← Sign out of Google</button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // ══ TIMEOUT RESULT ══
  if(showResult&&resultFlow==="timeout"&&resultStudent){
    return(
      <div style={{height:"100vh",overflow:"auto",fontFamily:"'DM Sans',sans-serif",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",position:"relative",color:"#fff"}}>
        <PageBg/>
        <motion.div initial={{opacity:0,y:24}} animate={{opacity:1,y:0}} transition={{duration:.5,ease:EASE}}
          style={{textAlign:"center",position:"relative",zIndex:10,maxWidth:540,padding:"0 24px"}}>
          <motion.div initial={{scale:0}} animate={{scale:1}} transition={{delay:.2,type:"spring",stiffness:200}}
            style={{width:84,height:84,borderRadius:"50%",background:"rgba(74,222,128,.15)",border:"2px solid rgba(74,222,128,.4)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 24px",boxShadow:"0 0 40px rgba(74,222,128,.15)"}}>
            <svg width="38" height="38" viewBox="0 0 52 52" fill="none"><path d="M10 26l12 12 20-20" stroke="#4ade80" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </motion.div>
          <p style={{fontSize:11,fontWeight:700,letterSpacing:".32em",textTransform:"uppercase",color:"rgba(255,255,255,.45)",marginBottom:10}}>Check-out Recorded</p>
          <h1 style={{fontSize:48,fontWeight:900,fontFamily:"'Playfair Display',serif",color:"#fff",lineHeight:1.1,marginBottom:8}}>
            Safe travels,<br/>
            <span style={{background:"linear-gradient(90deg,#B8860B,#DAA520,#FFD700,#DAA520)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text"}}>{resultStudent.name.split(" ")[0]}!</span>
          </h1>
          <p style={{fontSize:16,color:"rgba(255,255,255,.5)",marginBottom:28}}>Thank you for visiting the NEU Library.</p>
          <div style={{...GLASS,display:"inline-flex",gap:36,alignItems:"center",marginBottom:28,padding:"20px 32px",borderRadius:18}}>
            <div style={{textAlign:"center"}}><p style={{fontSize:11,fontWeight:700,letterSpacing:".16em",textTransform:"uppercase",color:"rgba(255,255,255,.4)",marginBottom:5}}>Time Out</p><p style={{fontSize:28,fontWeight:900,fontFamily:"'Playfair Display',serif",color:"#4ade80"}}>{resultTime}</p></div>
            <div style={{width:1,height:40,background:"rgba(255,255,255,.15)"}}/>
            <div style={{textAlign:"center"}}><p style={{fontSize:11,fontWeight:700,letterSpacing:".16em",textTransform:"uppercase",color:"rgba(255,255,255,.4)",marginBottom:5}}>Date</p><p style={{fontSize:28,fontWeight:900,fontFamily:"'Playfair Display',serif",color:"#fff"}}>{new Date().toLocaleDateString("en-PH",{month:"short",day:"numeric"})}</p></div>
          </div>
          <p style={{fontSize:13,color:"rgba(255,255,255,.35)",marginBottom:20}}>Returning to kiosk automatically…</p>
          <motion.button onClick={()=>{setShowResult(false);setStatus("idle");setMessage("Scan QR or sign in with Google");qrStarted.current=false;startQR();}}
            whileHover={{scale:1.02}} whileTap={{scale:.97}}
            style={{padding:"12px 36px",...GLASS,borderRadius:12,color:"rgba(255,255,255,.8)",fontSize:14,fontWeight:700,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",border:"1px solid rgba(255,255,255,.25)"}}>
            Back to Kiosk
          </motion.button>
        </motion.div>
        <div style={{position:"fixed",bottom:0,left:0,right:0,height:3,background:"rgba(255,255,255,.07)",zIndex:99}}>
          <div style={{height:"100%",background:"linear-gradient(90deg,#DAA520,#FFD700)",animation:"countdown 5s linear forwards"}}/>
        </div>
        <style>{`@keyframes countdown{from{width:100%}to{width:0%}}`}</style>
      </div>
    );
  }

  // ══ MAIN KIOSK ══
  return (
    <>
      {/* Animated Intro */}
      {showIntro && <KioskIntro onComplete={() => {
        setShowIntro(false);
        // Clear flag and timestamp after natural intro completion (fresh start)
        sessionStorage.removeItem('skip_kiosk_intro');
        sessionStorage.removeItem('skip_intro_timestamp');
      }} />}
      
      <div className="kiosk-layout"
      style={{height:"100vh",overflow:"auto",fontFamily:"'DM Sans',sans-serif",display:"flex",position:"relative",background:theme.bg}}>

      {/* ── FULL BACKGROUND PHOTO ── */}
      <div style={{position:"fixed",inset:0,zIndex:0}}>
        <Image src={BG_IMAGE} alt="NEU Library" fill style={{objectFit:"cover",objectPosition:"center center"}} priority/>
        <div style={{position:"absolute",inset:0,background:"rgba(6,13,26,.72)"}}/>
      </div>
      <div style={{position:"fixed",inset:0,backgroundImage:"radial-gradient(circle at 2px 2px,rgba(255,255,255,.02) 1px,transparent 0)",backgroundSize:"28px 28px",pointerEvents:"none",zIndex:1}}/>
      <div style={{position:"fixed",bottom:0,left:0,right:0,height:1,background:"linear-gradient(90deg,transparent,rgba(212,175,55,.2),transparent)",pointerEvents:"none",zIndex:2}}/>

      <AnimatePresence>
        {showClosed&&<ClosedModal note={scheduleNote} onAdmin={()=>{setShowClosed(false);router.push("/auth/admin");}}/>}
      </AnimatePresence>

      {/* ══ LEFT PANEL ══ */}
      <motion.div initial={{opacity:0,x:-24}} animate={{opacity:1,x:0}} transition={{duration:.6,ease:EASE}}
        className="kiosk-left"
        style={{width:"42%",position:"relative",zIndex:2,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"32px 40px"}}>

        <motion.div initial={{opacity:0,y:-16}} animate={{opacity:1,y:0}} transition={{delay:.2,duration:.5}}
          style={{position:"relative",marginBottom:18,display:"inline-block"}}>
          <div style={{position:"absolute",inset:-18,borderRadius:"50%",background:"radial-gradient(circle,rgba(212,175,55,.22),transparent 68%)",filter:"blur(18px)",animation:"pulse 3s ease-in-out infinite"}}/>
          <div style={{width:110,height:110,borderRadius:"50%",background:"rgba(6,13,26,.5)",border:"2px solid rgba(212,175,55,.4)",padding:12,position:"relative",boxShadow:"0 0 50px rgba(212,175,55,.15),0 24px 50px rgba(0,0,0,.6)",backdropFilter:"blur(10px)"}}>
            <Image src="/neu-library-logo.png" alt="NEU" width={110} height={110} style={{width:"100%",height:"100%",objectFit:"contain",borderRadius:"50%"}}/>
          </div>
        </motion.div>

        <motion.p initial={{opacity:0}} animate={{opacity:1}} transition={{delay:.3}}
          style={{fontSize:10,fontWeight:700,letterSpacing:".32em",textTransform:"uppercase",color:"rgba(255,255,255,.7)",marginBottom:6,textAlign:"center"}}>New Era University</motion.p>
        <motion.h1 initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:.35}}
          style={{fontSize:42,fontWeight:900,color:"#fff",lineHeight:1,fontFamily:"'Playfair Display',serif",marginBottom:4,textAlign:"center"}}>Library</motion.h1>
        <motion.p initial={{opacity:0}} animate={{opacity:1}} transition={{delay:.4}}
          style={{fontSize:16,fontWeight:700,fontFamily:"'Playfair Display',serif",marginBottom:12,letterSpacing:".05em",textAlign:"center",background:"linear-gradient(90deg,#B8860B,#DAA520,#FFD700,#DAA520,#B8860B)",backgroundSize:"300% auto",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text"}}>
          Log System
        </motion.p>

        <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:.45}} style={{marginBottom:12,textAlign:"center"}}>
          <p style={{fontSize:32,fontWeight:900,fontFamily:"'Playfair Display',serif",color:"#fff",lineHeight:1}}>{clock}</p>
          <p style={{fontSize:12,color:"rgba(255,255,255,.6)",marginTop:3,letterSpacing:".06em"}}>{date}</p>
        </motion.div>

        {/* Quotes Slider - Under time */}
        <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:.5}}
          style={{marginBottom:14,width:"100%",maxWidth:320,minHeight:85,position:"relative",textAlign:"center"}}>
          <AnimatePresence mode="wait">
            <motion.div key={quoteIndex}
              initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}}
              transition={{duration:.6,ease:EASE}}>
              <p style={{fontSize:15,fontStyle:"italic",color:"rgba(255,255,255,.75)",lineHeight:1.65,marginBottom:8,fontFamily:"'Playfair Display',serif",fontWeight:500}}>
                "{QUOTES[quoteIndex].text}"
              </p>
              <p style={{fontSize:11,fontWeight:600,color:"rgba(212,175,55,.7)",letterSpacing:".12em",fontFamily:"'DM Sans',sans-serif"}}>— {QUOTES[quoteIndex].author}</p>
            </motion.div>
          </AnimatePresence>
          <div style={{display:"flex",gap:4,marginTop:10,justifyContent:"center"}}>
            {QUOTES.map((_,i)=>(
              <div key={i} style={{width:5,height:5,borderRadius:"50%",background:i===quoteIndex?"rgba(212,175,55,.9)":"rgba(255,255,255,.25)",transition:"all .4s"}}/>
            ))}
          </div>
        </motion.div>

        <div style={{width:72,height:1.5,background:"linear-gradient(90deg,transparent,rgba(212,175,55,.6),transparent)",marginBottom:14}}/>

        <motion.p initial={{opacity:0}} animate={{opacity:1}} transition={{delay:.55}}
          style={{fontSize:13,color:"rgba(255,255,255,.65)",textAlign:"center",lineHeight:1.6,marginBottom:18,maxWidth:280}}>
          Scan QR, enter student ID, or sign in with your NEU Google account to check in or out.
        </motion.p>

        <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:.6}}
          style={{display:"flex",gap:10,width:"100%",maxWidth:280,marginBottom:16}}>
          {[{icon:"→",label:"1st scan",desc:"Time In"},{icon:"←",label:"2nd scan",desc:"Time Out"}].map(b=>(
            <div key={b.label} style={{flex:1,background:"rgba(255,255,255,.1)",border:"1px solid rgba(255,255,255,.18)",borderTop:"1px solid rgba(255,255,255,.28)",borderRadius:12,padding:"8px 10px",textAlign:"center",backdropFilter:"blur(20px)"}}>
              <p style={{fontSize:16,marginBottom:2}}>{b.icon}</p>
              <p style={{fontSize:10,fontWeight:700,color:"rgba(255,255,255,.85)"}}>{b.label}</p>
              <p style={{fontSize:9,color:"rgba(255,255,255,.5)",marginTop:1}}>{b.desc}</p>
            </div>
          ))}
        </motion.div>

        <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:.65}} style={{display:"flex",gap:7,flexDirection:"column",width:"100%",maxWidth:280}}>
          <motion.button whileHover={{scale:1.02}} whileTap={{scale:.97}} onClick={()=>router.push("/auth/admin")}
            style={{height:38,padding:"0 18px",background:"rgba(212,175,55,.15)",border:"1px solid rgba(212,175,55,.3)",borderTop:"1px solid rgba(212,175,55,.45)",borderRadius:10,color:"#FFD700",fontSize:12,fontWeight:700,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",backdropFilter:"blur(20px)"}}>
            Admin Access →
          </motion.button>
          <motion.button whileHover={{scale:1.02}} whileTap={{scale:.97}} onClick={()=>router.push("/help")}
            style={{height:38,padding:"0 18px",background:"rgba(255,255,255,.1)",border:"1px solid rgba(255,255,255,.2)",borderTop:"1px solid rgba(255,255,255,.32)",borderRadius:10,color:"rgba(255,255,255,.85)",fontSize:12,fontWeight:700,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",backdropFilter:"blur(20px)"}}>
            ❓ Help & FAQs
          </motion.button>
        </motion.div>
      </motion.div>

      {/* ══ RIGHT PANEL ══ */}
      <motion.div initial={{opacity:0,x:24}} animate={{opacity:1,x:0}} transition={{duration:.6,ease:EASE}}
        className="kiosk-right"
        style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:"24px 36px",position:"relative",zIndex:2}}>
        <div style={{width:"100%",maxWidth:400}}>

          {/* ── iOS GLASS CARD ── */}
          <div style={{
            background:"linear-gradient(135deg, rgba(255,255,255,.22) 0%, rgba(255,255,255,.10) 100%)",
            backdropFilter:"blur(80px) saturate(200%) brightness(1.08)",
            WebkitBackdropFilter:"blur(80px) saturate(200%) brightness(1.08)",
            border:"1px solid rgba(255,255,255,.35)",
            borderTop:"1px solid rgba(255,255,255,.55)",
            borderLeft:"1px solid rgba(255,255,255,.28)",
            borderBottom:"1px solid rgba(255,255,255,.08)",
            borderRight:"1px solid rgba(255,255,255,.12)",
            borderRadius:24,
            padding:"24px 24px",
            boxShadow:[
              "inset 0 1px 0 rgba(255,255,255,.55)",
              "inset 0 -1px 0 rgba(0,0,0,.06)",
              "inset 1px 0 0 rgba(255,255,255,.25)",
              "0 20px 60px rgba(0,0,0,.28)",
              "0 0 0 0.5px rgba(255,255,255,.18)",
            ].join(","),
          }}>

            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
              <div>
                <h2 style={{fontSize:20,fontWeight:900,color:"#fff",fontFamily:"'Playfair Display',serif",marginBottom:2}}>Check-in / Out</h2>
                <p style={{fontSize:12,color:"rgba(255,255,255,.55)"}}>Scan QR, enter ID, or use Google</p>
              </div>
              <LibraryBadge isOpen={libOpen}/>
            </div>

            {/* Google button */}
            <motion.button onClick={handleGoogleSignIn} disabled={googleLoading||libOpen===false}
              whileHover={!googleLoading&&libOpen!==false?{y:-1}:{}} whileTap={!googleLoading&&libOpen!==false?{scale:.97}:{}}
              style={{width:"100%",height:46,background:"#fff",border:"none",borderRadius:12,color:"#1f1f1f",fontSize:13,fontWeight:700,fontFamily:"'DM Sans',sans-serif",cursor:googleLoading||libOpen===false?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:10,marginBottom:14,opacity:googleLoading||libOpen===false?.5:1,boxShadow:"0 4px 20px rgba(0,0,0,.2), inset 0 1px 0 rgba(255,255,255,.9)"}}>
              {googleLoading?(
                <svg style={{width:18,height:18,animation:"spin .8s linear infinite"}} viewBox="0 0 24 24" fill="none"><circle style={{opacity:.25}} cx="12" cy="12" r="10" stroke="#1f1f1f" strokeWidth="4"/><path style={{opacity:.75}} fill="#1f1f1f" d="M4 12a8 8 0 018-8v8z"/></svg>
              ):(
                <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
              )}
              {googleLoading?"Signing in…":"Continue with Google (@neu.edu.ph)"}
            </motion.button>

            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
              <div style={{flex:1,height:1,background:"rgba(255,255,255,.15)"}}/>
              <p style={{fontSize:11,color:"rgba(255,255,255,.45)",fontWeight:600}}>or</p>
              <div style={{flex:1,height:1,background:"rgba(255,255,255,.15)"}}/>
            </div>

            {/* Tabs */}
            <div style={{display:"flex",background:"rgba(0,0,0,.15)",borderRadius:12,padding:3,marginBottom:16,gap:3,backdropFilter:"blur(10px)"}}>
              {(["qr","manual"] as Tab[]).map(t=>(
                <button key={t} onClick={()=>setTab(t)}
                  style={{flex:1,padding:"8px 10px",border:"none",borderRadius:9,fontSize:13,fontWeight:700,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:5,transition:"all .2s",
                    background:tab===t?"rgba(255,255,255,.25)":"transparent",
                    color:tab===t?"#fff":"rgba(255,255,255,.5)",
                    boxShadow:tab===t?"0 2px 8px rgba(0,0,0,.15), inset 0 1px 0 rgba(255,255,255,.3)":"none"}}>
                  {t==="qr"?"📷 QR Code":"⌨️ Student ID"}
                </button>
              ))}
            </div>

            {/* QR tab */}
            {tab==="qr"&&(
              <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{duration:.2}}>
                <div style={{background:"rgba(0,0,0,.2)",border:"1px solid rgba(255,255,255,.12)",borderRadius:16,padding:12,marginBottom:10,position:"relative",overflow:"hidden",backdropFilter:"blur(10px)"}}>
                  {[{top:8,left:8,borderTop:"2px solid #DAA520",borderLeft:"2px solid #DAA520",borderRadius:"4px 0 0 0"},{top:8,right:8,borderTop:"2px solid #DAA520",borderRight:"2px solid #DAA520",borderRadius:"0 4px 0 0"},{bottom:8,left:8,borderBottom:"2px solid #DAA520",borderLeft:"2px solid #DAA520",borderRadius:"0 0 0 4px"},{bottom:8,right:8,borderBottom:"2px solid #DAA520",borderRight:"2px solid #DAA520",borderRadius:"0 0 4px 0"}].map((s,i)=><div key={i} style={{position:"absolute",width:18,height:18,...s}}/>)}
                  {camReady&&status==="scanning"&&(<div style={{position:"absolute",left:12,right:12,height:2,background:"linear-gradient(90deg,transparent,rgba(218,165,32,.9),transparent)",zIndex:10,pointerEvents:"none",animation:"scanBeam 2.2s ease-in-out infinite",boxShadow:"0 0 8px rgba(218,165,32,.6)"}}/>)}
                  <div id="qr-reader-kiosk" style={{width:"100%",maxWidth:280,margin:"0 auto"}}/>
                  {!camReady&&status!=="success"&&(
                    <div style={{padding:"24px 18px",textAlign:"center"}}>
                      <svg style={{width:26,height:26,margin:"0 auto 8px",display:"block",animation:"spin .8s linear infinite"}} viewBox="0 0 24 24" fill="none"><circle style={{opacity:.18}} cx="12" cy="12" r="10" stroke="#DAA520" strokeWidth="2.5"/><path d="M12 2a10 10 0 0110 10" stroke="#DAA520" strokeWidth="2.5" strokeLinecap="round"/></svg>
                      <p style={{fontSize:13,fontWeight:600,color:"rgba(255,255,255,.55)"}}>{status==="processing"?"Processing…":"Starting camera…"}</p>
                    </div>
                  )}
                  {status==="success"&&(
                    <motion.div initial={{opacity:0,scale:.8}} animate={{opacity:1,scale:1}} style={{padding:"24px 18px",textAlign:"center"}}>
                      <svg width="40" height="40" viewBox="0 0 52 52" fill="none" style={{margin:"0 auto 8px",display:"block"}}><circle cx="26" cy="26" r="25" stroke="#4ade80" strokeWidth="1.5"/><path d="M14 26l9 9 15-15" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      <p style={{fontSize:13,fontWeight:700,color:"#4ade80"}}>{message}</p>
                    </motion.div>
                  )}
                </div>
                <div style={{display:"flex",alignItems:"center",gap:9,background:"rgba(255,255,255,.08)",border:"1px solid rgba(255,255,255,.15)",borderRadius:12,padding:"9px 12px",backdropFilter:"blur(10px)"}}>
                  <span style={{fontSize:14,flexShrink:0}}>{status==="error"?"⚠️":status==="success"?"✅":"💡"}</span>
                  <p style={{fontSize:12,fontWeight:500,color:"rgba(255,255,255,.65)",lineHeight:1.4}}>{status==="scanning"?"Point camera at student QR code":message}</p>
                </div>
              </motion.div>
            )}

            {/* Manual tab */}
            {tab==="manual"&&(
              <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{duration:.2}}>
                {manualErr&&(
                  <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:"auto"}}
                    style={{background:"rgba(220,38,38,.15)",border:"1px solid rgba(220,38,38,.3)",borderLeft:"3px solid #ef4444",borderRadius:11,padding:"10px 12px",marginBottom:12,display:"flex",alignItems:"center",gap:9,fontSize:12,color:"#fca5a5"}}>
                    <span>⚠️</span><span style={{fontWeight:600}}>{manualErr}</span>
                  </motion.div>
                )}
                <form onSubmit={handleManualSubmit} style={{display:"flex",flexDirection:"column",gap:12}}>
                  <div>
                    <label style={{display:"block",fontSize:10,fontWeight:700,letterSpacing:".16em",textTransform:"uppercase",color:"rgba(255,255,255,.55)",marginBottom:6}}>Student ID Number</label>
                    <div style={{position:"relative"}}>
                      <span style={{position:"absolute",left:15,top:"50%",transform:"translateY(-50%)",fontSize:16,pointerEvents:"none"}}>🎓</span>
                      <input type="text" placeholder="e.g. 20-12345-678" value={manualId} onChange={e=>setManualId(e.target.value)} required autoFocus
                        style={{width:"100%",height:46,padding:"0 18px 0 46px",background:"rgba(255,255,255,.12)",border:"1px solid rgba(255,255,255,.25)",borderTop:"1px solid rgba(255,255,255,.35)",borderRadius:12,color:"#fff",fontSize:13,fontWeight:600,fontFamily:"'DM Sans',sans-serif",outline:"none",transition:"all .2s",backdropFilter:"blur(10px)"}}
                        onFocus={e=>{e.target.style.borderColor="rgba(212,175,55,.6)";e.target.style.background="rgba(255,255,255,.18)";}}
                        onBlur={e=>{e.target.style.borderColor="rgba(255,255,255,.25)";e.target.style.background="rgba(255,255,255,.12)";}}
                      />
                    </div>
                  </div>
                  <motion.button type="submit" disabled={manualLoading||!manualId.trim()}
                    whileHover={!manualLoading&&!!manualId.trim()?{y:-1}:{}} whileTap={!manualLoading&&!!manualId.trim()?{scale:.97}:{}}
                    style={{width:"100%",height:46,background:"linear-gradient(135deg,rgba(30,64,175,.8),rgba(37,99,235,.9))",border:"1px solid rgba(147,197,253,.3)",borderTop:"1px solid rgba(147,197,253,.5)",borderRadius:12,color:"#fff",fontSize:13,fontWeight:700,fontFamily:"'DM Sans',sans-serif",cursor:manualLoading||!manualId.trim()?"not-allowed":"pointer",opacity:manualLoading||!manualId.trim()?.5:1,display:"flex",alignItems:"center",justifyContent:"center",gap:8,boxShadow:"0 6px 22px rgba(30,64,175,.4),inset 0 1px 0 rgba(255,255,255,.2)"}}>
                    {manualLoading?<><svg style={{width:16,height:16,animation:"spin .8s linear infinite"}} viewBox="0 0 24 24" fill="none"><circle style={{opacity:.25}} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path style={{opacity:.75}} fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Processing…</>:"Check In / Out →"}
                  </motion.button>
                </form>
              </motion.div>
            )}

            <div style={{marginTop:14,paddingTop:10,borderTop:"1px solid rgba(255,255,255,.12)",textAlign:"center"}}>
              <div style={{width:28,height:1,background:"linear-gradient(90deg,transparent,rgba(212,175,55,.4),transparent)",margin:"0 auto 7px"}}/>
              <p style={{fontSize:10,color:"rgba(255,255,255,.35)"}}>New Era University · Library Management System</p>
            </div>
          </div>
        </div>
      </motion.div>

      <style>{`
        @keyframes scanBeam{0%{top:12px}50%{top:calc(100% - 12px)}100%{top:12px}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:.22}50%{opacity:.35}}
        input::placeholder{color:rgba(255,255,255,.35)!important;font-weight:400;}
        @media(max-width:900px){
          .kiosk-layout{flex-direction:column;}
          .kiosk-left{width:100%!important;padding:24px 20px!important;}
          .kiosk-right{padding:20px 16px!important;}
        }
      `}</style>
    </div>
    </>
  );
}