"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";
import Image from "next/image";

export default function StudentLoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password,   setPassword]   = useState("");
  const [error,      setError]      = useState("");
  const [loading,    setLoading]    = useState(false);
  const [showPass,   setShowPass]   = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError("");
    const isEmail = identifier.includes("@");
    let student = null;
    if (isEmail) {
      const { data } = await supabase.from("students").select("*").eq("email", identifier).eq("password", password).single();
      student = data;
    } else {
      const { data } = await supabase.from("students").select("*").eq("student_id", identifier).eq("password", password).single();
      student = data;
    }
    if (!student) { setError("Invalid credentials. Please try again."); setLoading(false); return; }
    document.cookie = `user_email=${student.email}; path=/; max-age=86400`;
    document.cookie = `active_role=user; path=/; max-age=86400`;
    sessionStorage.setItem("student", JSON.stringify(student));
    router.push("/dashboard");
  };

  const today = new Date().toLocaleDateString("en-PH",{month:"short",day:"numeric",year:"numeric"});

  return (
    <div style={{
      height:"100vh", overflow:"hidden",
      fontFamily:"'DM Sans',sans-serif",
      background:"linear-gradient(145deg,#060d1a 0%,#0d1f3e 40%,#162d55 70%,#0a1628 100%)",
      display:"flex", position:"relative",
    }}>

      {/* bg */}
      <div style={{ position:"fixed", inset:0, backgroundImage:"radial-gradient(circle at 2px 2px,rgba(255,255,255,.025) 1px,transparent 0)", backgroundSize:"28px 28px", pointerEvents:"none", zIndex:0 }} />
      <div style={{ position:"fixed", top:"-15%", left:"-10%", width:520, height:520, borderRadius:"50%", background:"radial-gradient(circle,rgba(30,64,175,.2),transparent 68%)", filter:"blur(70px)", pointerEvents:"none", zIndex:0 }} />
      <div style={{ position:"fixed", bottom:"-15%", right:"-10%", width:460, height:460, borderRadius:"50%", background:"radial-gradient(circle,rgba(212,175,55,.09),transparent 68%)", filter:"blur(70px)", pointerEvents:"none", zIndex:0 }} />
      <div style={{ position:"fixed", top:0, left:0, right:0, height:2, background:"linear-gradient(90deg,transparent,rgba(212,175,55,.7),transparent)", pointerEvents:"none", zIndex:1 }} />
      <div style={{ position:"fixed", bottom:0, left:0, right:0, height:1, background:"linear-gradient(90deg,transparent,rgba(212,175,55,.3),transparent)", pointerEvents:"none", zIndex:1 }} />
      {[[14,17,7],[64,70,4],[28,54,3]].map(([t,l,sz],i)=>(
        <div key={i} style={{ position:"fixed", top:`${t}%`, left:`${l}%`, width:sz, height:sz, borderRadius:"50%", background:"#DAA520", opacity:.4, zIndex:0 }} />
      ))}

      {/* ══ LEFT PANEL ══ */}
      <div className="login-left" style={{
        display:"none", width:"50%", position:"relative", zIndex:2,
        flexDirection:"column", alignItems:"center", justifyContent:"center",
        padding:"48px 56px",
      }}>

        {/* logo */}
        <div style={{ position:"relative", marginBottom:26, display:"inline-block" }}>
          <div style={{ position:"absolute", inset:-20, borderRadius:"50%", background:"radial-gradient(circle,rgba(212,175,55,.18),transparent 68%)", filter:"blur(18px)" }} />
          <div style={{ width:148, height:148, borderRadius:"50%", background:"rgba(255,255,255,.06)", border:"2px solid rgba(212,175,55,.3)", padding:15, position:"relative", boxShadow:"0 0 50px rgba(212,175,55,.12), 0 24px 50px rgba(0,0,0,.5)" }}>
            <Image src="/neu-library-logo.png" alt="NEU" width={148} height={148}
              style={{ width:"100%", height:"100%", objectFit:"contain", borderRadius:"50%" }} />
          </div>
        </div>

        {/* title block */}
        <p style={{ fontSize:11, fontWeight:700, letterSpacing:".36em", textTransform:"uppercase", color:"rgba(255,255,255,.35)", marginBottom:8, textAlign:"center" }}>
          New Era University
        </p>
        <h1 style={{ fontSize:52, fontWeight:900, color:"#fff", lineHeight:1, fontFamily:"'Playfair Display',serif", marginBottom:6, textAlign:"center" }}>
          Library
        </h1>
        <p style={{
          fontSize:20, fontWeight:700, fontFamily:"'Playfair Display',serif",
          marginBottom:24, letterSpacing:".05em", textAlign:"center",
          background:"linear-gradient(90deg,#B8860B,#DAA520,#FFD700,#DAA520,#B8860B)",
          backgroundSize:"300% auto", WebkitBackgroundClip:"text",
          WebkitTextFillColor:"transparent", backgroundClip:"text",
        }}>
          Student Portal
        </p>
        <div style={{ width:72, height:1.5, background:"linear-gradient(90deg,transparent,#DAA520,transparent)", marginBottom:28 }} />

        {/* compact feature list — no cards, just text */}
        <div style={{ display:"flex", flexDirection:"column", gap:14, width:"100%", maxWidth:320 }}>
          {[
            { icon:"◆", label:"Personal Dashboard",  desc:"Your visit stats at a glance" },
            { icon:"◆", label:"Complete Visit History", desc:"Every check-in, organised" },
            { icon:"◆", label:"Monthly Analytics",   desc:"Weekly and monthly breakdown" },
          ].map(f=>(
            <div key={f.label} style={{ display:"flex", alignItems:"flex-start", gap:12 }}>
              <span style={{ fontSize:8, color:"#DAA520", marginTop:5, flexShrink:0 }}>{f.icon}</span>
              <div>
                <p style={{ fontSize:14, fontWeight:700, color:"rgba(255,255,255,.85)", lineHeight:1.3 }}>{f.label}</p>
                <p style={{ fontSize:12, color:"rgba(255,255,255,.38)", marginTop:2 }}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ══ RIGHT PANEL ══ */}
      <div style={{
        flex:1, display:"flex", alignItems:"center", justifyContent:"center",
        padding:"28px 24px", position:"relative", zIndex:2,
      }}>
        <div style={{ width:"100%", maxWidth:440 }}>

          {/* mobile logo */}
          <div className="mobile-hdr" style={{ textAlign:"center", marginBottom:24 }}>
            <div style={{ width:76, height:76, borderRadius:"50%", background:"rgba(255,255,255,.08)", border:"2px solid rgba(212,175,55,.3)", padding:9, margin:"0 auto 12px" }}>
              <Image src="/neu-library-logo.png" alt="NEU" width={76} height={76}
                style={{ width:"100%", height:"100%", objectFit:"contain", borderRadius:"50%" }} />
            </div>
            <h1 style={{ fontSize:24, fontWeight:900, color:"#fff", fontFamily:"'Playfair Display',serif" }}>NEU Library</h1>
            <p style={{ fontSize:13, color:"rgba(255,255,255,.45)", marginTop:2 }}>Student Portal</p>
          </div>

          {/* glass card */}
          <div style={{
            background:"rgba(255,255,255,.09)",
            backdropFilter:"blur(28px)",
            WebkitBackdropFilter:"blur(28px)",
            border:"1px solid rgba(255,255,255,.15)",
            borderRadius:24,
            padding:"32px 30px",
            boxShadow:"0 10px 50px rgba(0,0,0,.4), inset 0 1px 0 rgba(255,255,255,.12)",
          }}>

            {/* status row */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
              <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:"rgba(74,222,128,.1)", border:"1px solid rgba(74,222,128,.25)", color:"#4ade80", fontSize:11, fontWeight:700, padding:"4px 12px", borderRadius:100 }}>
                <span style={{ width:5, height:5, borderRadius:"50%", background:"#4ade80", display:"inline-block" }} />
                Library Open
              </div>
              <p style={{ fontSize:11, color:"rgba(255,255,255,.32)" }}>{today}</p>
            </div>

            <h2 style={{ fontSize:28, fontWeight:900, color:"#fff", lineHeight:1.1, fontFamily:"'Playfair Display',serif", marginBottom:4 }}>
              Student Sign In
            </h2>
            <p style={{ fontSize:14, color:"rgba(255,255,255,.48)", marginBottom:24 }}>
              Sign in to access your library dashboard
            </p>

            {error && (
              <div style={{ background:"rgba(220,38,38,.12)", border:"1px solid rgba(220,38,38,.28)", borderLeft:"3px solid #ef4444", borderRadius:11, padding:"11px 14px", marginBottom:18, display:"flex", alignItems:"center", gap:10, fontSize:13, color:"#fca5a5" }}>
                <span>⚠️</span><span style={{ fontWeight:600 }}>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} style={{ display:"flex", flexDirection:"column", gap:15 }}>
              <div>
                <label style={{ display:"block", fontSize:11, fontWeight:700, letterSpacing:".16em", textTransform:"uppercase", color:"rgba(255,255,255,.48)", marginBottom:7 }}>
                  Student Number or Email
                </label>
                <div style={{ position:"relative" }}>
                  <span style={{ position:"absolute", left:15, top:"50%", transform:"translateY(-50%)", fontSize:16, pointerEvents:"none" }}>🎓</span>
                  <input type="text" placeholder="2021-00001 or name@neu.edu.ph"
                    value={identifier} onChange={e=>setIdentifier(e.target.value)} required
                    style={{ width:"100%", height:50, paddingLeft:48, paddingRight:18, background:"rgba(255,255,255,.07)", border:"1.5px solid rgba(255,255,255,.13)", borderRadius:12, color:"#fff", fontSize:14, fontWeight:500, fontFamily:"'DM Sans',sans-serif", outline:"none", transition:"all .2s" }}
                    onFocus={e=>{e.target.style.borderColor="rgba(212,175,55,.55)";e.target.style.background="rgba(255,255,255,.1)";}}
                    onBlur={e=>{e.target.style.borderColor="rgba(255,255,255,.13)";e.target.style.background="rgba(255,255,255,.07)";}}
                  />
                </div>
              </div>

              <div>
                <label style={{ display:"block", fontSize:11, fontWeight:700, letterSpacing:".16em", textTransform:"uppercase", color:"rgba(255,255,255,.48)", marginBottom:7 }}>
                  Password
                </label>
                <div style={{ position:"relative" }}>
                  <span style={{ position:"absolute", left:15, top:"50%", transform:"translateY(-50%)", fontSize:16, pointerEvents:"none" }}>🔒</span>
                  <input type={showPass?"text":"password"} placeholder="Enter your password"
                    value={password} onChange={e=>setPassword(e.target.value)} required
                    style={{ width:"100%", height:50, paddingLeft:48, paddingRight:48, background:"rgba(255,255,255,.07)", border:"1.5px solid rgba(255,255,255,.13)", borderRadius:12, color:"#fff", fontSize:14, fontWeight:500, fontFamily:"'DM Sans',sans-serif", outline:"none", transition:"all .2s" }}
                    onFocus={e=>{e.target.style.borderColor="rgba(212,175,55,.55)";e.target.style.background="rgba(255,255,255,.1)";}}
                    onBlur={e=>{e.target.style.borderColor="rgba(255,255,255,.13)";e.target.style.background="rgba(255,255,255,.07)";}}
                  />
                  <button type="button" onClick={()=>setShowPass(!showPass)}
                    style={{ position:"absolute", right:15, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", fontSize:16, color:"rgba(255,255,255,.38)", padding:4 }}>
                    {showPass?"🙈":"👁️"}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading}
                style={{ width:"100%", height:50, background:"linear-gradient(135deg,#0f2040,#1E3A8A,#2563EB)", backgroundSize:"200%", border:"none", borderRadius:12, color:"#fff", fontSize:15, fontWeight:700, fontFamily:"'DM Sans',sans-serif", cursor:loading?"not-allowed":"pointer", transition:"transform .15s, box-shadow .2s", boxShadow:"0 6px 22px rgba(30,64,175,.4)", display:"flex", alignItems:"center", justifyContent:"center", gap:8, opacity:loading?.65:1, marginTop:4 }}
                onMouseEnter={e=>{if(!loading)(e.currentTarget as HTMLButtonElement).style.transform="translateY(-1px)";}}
                onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.transform="translateY(0)";}}>
                {loading
                  ? <><svg style={{ width:17,height:17,animation:"spin .8s linear infinite" }} viewBox="0 0 24 24" fill="none"><circle style={{ opacity:.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path style={{ opacity:.75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Signing in…</>
                  : "Sign In to Dashboard →"
                }
              </button>
            </form>

            <div style={{ marginTop:20, paddingTop:16, borderTop:"1px solid rgba(255,255,255,.08)", display:"flex", flexDirection:"column", gap:8 }}>
              <button onClick={()=>router.push("/kiosk")}
                style={{ width:"100%", height:44, background:"rgba(255,255,255,.05)", border:"1px solid rgba(255,255,255,.12)", borderRadius:11, color:"rgba(255,255,255,.6)", fontSize:13, fontWeight:600, fontFamily:"'DM Sans',sans-serif", cursor:"pointer", transition:"all .18s", display:"flex", alignItems:"center", justifyContent:"center", gap:7 }}
                onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.background="rgba(255,255,255,.1)";}}
                onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.background="rgba(255,255,255,.05)";}}>
                📷 Quick QR Check-in (Kiosk)
              </button>
              <button onClick={()=>router.push("/auth/admin")}
                style={{ background:"none", border:"none", cursor:"pointer", fontSize:12, color:"rgba(255,255,255,.28)", fontFamily:"'DM Sans',sans-serif", padding:"6px", textAlign:"center" as const }}>
                Admin? Sign in here →
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        input::placeholder { color: rgba(255,255,255,.28) !important; font-weight: 400; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media(min-width:1024px){
          .login-left { display:flex !important; }
          .mobile-hdr { display:none  !important; }
        }
      `}</style>
    </div>
  );
}