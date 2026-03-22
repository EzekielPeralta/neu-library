"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";
import Image from "next/image";

export default function AdminLoginPage() {
  const router = useRouter();
  const [error,         setError]         = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);
  const [today,         setToday]         = useState("");

  useEffect(() => {
    setToday(new Date().toLocaleDateString("en-PH",{month:"short",day:"numeric",year:"numeric"}));
    checkGoogleReturn();
  }, []);

  const checkGoogleReturn = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    const email = session.user.email || "";
    if (!email.endsWith("@neu.edu.ph")) {
      await supabase.auth.signOut();
      setError("Only @neu.edu.ph accounts are allowed.");
      return;
    }
    const { data: roleData } = await supabase
      .from("user_roles").select("role")
      .eq("email", email).eq("role", "admin").single();
    if (!roleData) {
      await supabase.auth.signOut();
      setError("This account does not have admin privileges.");
      return;
    }
    document.cookie = `user_email=${email}; path=/; max-age=86400`;
    document.cookie = `active_role=admin; path=/; max-age=86400`;
    router.push("/admin");
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/admin`,
        queryParams: { hd: "neu.edu.ph" },
      }
    });
    if (error) {
      setError("Google sign in failed. Please try again.");
      setGoogleLoading(false);
    }
  };

  return (
    <div style={{
      height:"100vh", overflow:"hidden",
      fontFamily:"'DM Sans',sans-serif",
      background:"linear-gradient(145deg,#060d1a 0%,#0d1f3e 40%,#162d55 70%,#0a1628 100%)",
      display:"flex", position:"relative",
    }}>

      {/* bg decorations */}
      <div style={{ position:"fixed", inset:0, backgroundImage:"radial-gradient(circle at 2px 2px,rgba(255,255,255,.025) 1px,transparent 0)", backgroundSize:"28px 28px", pointerEvents:"none", zIndex:0 }} />
      <div style={{ position:"fixed", top:"-15%", left:"-10%", width:520, height:520, borderRadius:"50%", background:"radial-gradient(circle,rgba(30,64,175,.2),transparent 68%)", filter:"blur(70px)", pointerEvents:"none", zIndex:0 }} />
      <div style={{ position:"fixed", bottom:"-15%", right:"-10%", width:460, height:460, borderRadius:"50%", background:"radial-gradient(circle,rgba(212,175,55,.12),transparent 68%)", filter:"blur(70px)", pointerEvents:"none", zIndex:0 }} />
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
        <div style={{ position:"relative", marginBottom:26, display:"inline-block" }}>
          <div style={{ position:"absolute", inset:-20, borderRadius:"50%", background:"radial-gradient(circle,rgba(212,175,55,.2),transparent 68%)", filter:"blur(18px)" }} />
          <div style={{ width:148, height:148, borderRadius:"50%", background:"rgba(255,255,255,.06)", border:"2px solid rgba(212,175,55,.35)", padding:15, position:"relative", boxShadow:"0 0 50px rgba(212,175,55,.15), 0 24px 50px rgba(0,0,0,.5)" }}>
            <Image src="/neu-library-logo.png" alt="NEU" width={148} height={148}
              style={{ width:"100%", height:"100%", objectFit:"contain", borderRadius:"50%" }} />
          </div>
        </div>

        <p style={{ fontSize:11, fontWeight:700, letterSpacing:".36em", textTransform:"uppercase", color:"rgba(255,255,255,.35)", marginBottom:8, textAlign:"center" }}>New Era University</p>
        <h1 style={{ fontSize:52, fontWeight:900, color:"#fff", lineHeight:1, fontFamily:"'Playfair Display',serif", marginBottom:6, textAlign:"center" }}>Library</h1>
        <p style={{ fontSize:20, fontWeight:700, fontFamily:"'Playfair Display',serif", marginBottom:24, letterSpacing:".05em", textAlign:"center", background:"linear-gradient(90deg,#B8860B,#DAA520,#FFD700,#DAA520,#B8860B)", backgroundSize:"300% auto", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>
          Admin Portal
        </p>
        <div style={{ width:72, height:1.5, background:"linear-gradient(90deg,transparent,#DAA520,transparent)", marginBottom:28 }} />

        <div style={{ display:"flex", flexDirection:"column", gap:14, width:"100%", maxWidth:320 }}>
          {[
            { label:"Visitor Analytics",   desc:"Real-time stats and charts"        },
            { label:"Complete Visit Logs",  desc:"Search, filter and export records" },
            { label:"User Management",      desc:"View all registered library users" },
            { label:"Time In / Time Out",   desc:"Track every visit duration"        },
          ].map(f=>(
            <div key={f.label} style={{ display:"flex", alignItems:"flex-start", gap:12 }}>
              <span style={{ fontSize:8, color:"#DAA520", marginTop:5, flexShrink:0 }}>◆</span>
              <div>
                <p style={{ fontSize:14, fontWeight:700, color:"rgba(255,255,255,.85)", lineHeight:1.3 }}>{f.label}</p>
                <p style={{ fontSize:12, color:"rgba(255,255,255,.38)", marginTop:2 }}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop:28, padding:"12px 18px", background:"rgba(212,175,55,.06)", border:"1px solid rgba(212,175,55,.15)", borderRadius:12, width:"100%", maxWidth:320 }}>
          <p style={{ fontSize:12, color:"rgba(212,175,55,.7)", fontWeight:600, textAlign:"center", letterSpacing:".04em" }}>
            🔐 Restricted to authorised personnel only
          </p>
        </div>
      </div>

      {/* ══ RIGHT PANEL ══ */}
      <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:"28px 24px", position:"relative", zIndex:2 }}>
        <div style={{ width:"100%", maxWidth:440 }}>

          {/* mobile logo */}
          <div className="mobile-hdr" style={{ textAlign:"center", marginBottom:24 }}>
            <div style={{ width:76, height:76, borderRadius:"50%", background:"rgba(255,255,255,.08)", border:"2px solid rgba(212,175,55,.35)", padding:9, margin:"0 auto 12px" }}>
              <Image src="/neu-library-logo.png" alt="NEU" width={76} height={76}
                style={{ width:"100%", height:"100%", objectFit:"contain", borderRadius:"50%" }} />
            </div>
            <h1 style={{ fontSize:24, fontWeight:900, color:"#fff", fontFamily:"'Playfair Display',serif" }}>NEU Library</h1>
            <p style={{ fontSize:13, color:"rgba(255,255,255,.45)", marginTop:2 }}>Admin Portal</p>
          </div>

          {/* glass card */}
          <div style={{ background:"rgba(255,255,255,.09)", backdropFilter:"blur(28px)", WebkitBackdropFilter:"blur(28px)", border:"1px solid rgba(255,255,255,.15)", borderRadius:24, padding:"32px 30px", boxShadow:"0 10px 50px rgba(0,0,0,.4), inset 0 1px 0 rgba(255,255,255,.12)" }}>

            {/* status row */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
              <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:"rgba(212,175,55,.1)", border:"1px solid rgba(212,175,55,.25)", color:"#DAA520", fontSize:11, fontWeight:700, padding:"4px 12px", borderRadius:100 }}>
                <span style={{ width:5, height:5, borderRadius:"50%", background:"#DAA520", display:"inline-block" }} />
                Restricted Access
              </div>
              <p style={{ fontSize:11, color:"rgba(255,255,255,.32)" }}>{today}</p>
            </div>

            <h2 style={{ fontSize:28, fontWeight:900, color:"#fff", lineHeight:1.1, fontFamily:"'Playfair Display',serif", marginBottom:4 }}>
              Administrator Sign In
            </h2>
            <p style={{ fontSize:14, color:"rgba(255,255,255,.48)", marginBottom:24 }}>
              Sign in with your NEU Google account to access the dashboard.
            </p>

            {error && (
              <div style={{ background:"rgba(220,38,38,.12)", border:"1px solid rgba(220,38,38,.28)", borderLeft:"3px solid #ef4444", borderRadius:11, padding:"11px 14px", marginBottom:18, display:"flex", alignItems:"center", gap:10, fontSize:13, color:"#fca5a5" }}>
                <span>⚠️</span><span style={{ fontWeight:600 }}>{error}</span>
              </div>
            )}

            {/* Google Sign In */}
            <button onClick={handleGoogleSignIn} disabled={googleLoading}
              style={{ width:"100%", height:52, background:"#fff", border:"none", borderRadius:12, color:"#1f1f1f", fontSize:14, fontWeight:700, fontFamily:"'DM Sans',sans-serif", cursor:googleLoading?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:10, marginBottom:18, opacity:googleLoading?.7:1, transition:"opacity .2s, transform .15s", boxShadow:"0 4px 16px rgba(0,0,0,.25)" }}
              onMouseEnter={e=>{ if(!googleLoading)(e.currentTarget as HTMLButtonElement).style.transform="translateY(-1px)"; }}
              onMouseLeave={e=>{ (e.currentTarget as HTMLButtonElement).style.transform="translateY(0)"; }}>
              {googleLoading ? (
                <svg style={{ width:18,height:18,animation:"spin .8s linear infinite" }} viewBox="0 0 24 24" fill="none">
                  <circle style={{ opacity:.25 }} cx="12" cy="12" r="10" stroke="#1f1f1f" strokeWidth="4"/>
                  <path style={{ opacity:.75 }} fill="#1f1f1f" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </svg>
              )}
              {googleLoading ? "Signing in…" : "Sign in with Google (@neu.edu.ph)"}
            </button>

            {/* info note */}
            <div style={{ background:"rgba(147,197,253,.07)", border:"1px solid rgba(147,197,253,.15)", borderRadius:10, padding:"12px 14px", marginBottom:18, display:"flex", gap:10, alignItems:"flex-start" }}>
              <span style={{ fontSize:14, flexShrink:0 }}>ℹ️</span>
              <p style={{ fontSize:12, color:"rgba(255,255,255,.5)", lineHeight:1.6 }}>
                Only <strong style={{ color:"rgba(255,255,255,.7)" }}>@neu.edu.ph</strong> accounts with admin privileges can access this dashboard.
              </p>
            </div>

            <div style={{ paddingTop:14, borderTop:"1px solid rgba(255,255,255,.08)", textAlign:"center" }}>
              <div style={{ width:28, height:1, background:"linear-gradient(90deg,transparent,#DAA520,transparent)", margin:"0 auto 10px" }} />
              <button onClick={()=>router.push("/kiosk")}
                style={{ background:"none", border:"none", cursor:"pointer", fontSize:12, color:"rgba(255,255,255,.3)", fontFamily:"'DM Sans',sans-serif", padding:"4px" }}>
                ← Back to Kiosk
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to{transform:rotate(360deg)} }
        @media(min-width:1024px){
          .login-left { display:flex !important; }
          .mobile-hdr { display:none  !important; }
        }
      `}</style>
    </div>
  );
}