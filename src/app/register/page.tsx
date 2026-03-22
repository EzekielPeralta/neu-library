"use client";
// ============================================================
// NEU Library — Register Page
// app/register/page.tsx
// ============================================================

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import CollegeSearchDropdown from "@/app/components/CollegeSearchDropdown";
import type { College, Program } from "@/app/lib/types";
import { STUDENT_ID_REGEX } from "@/app/lib/types";

const BG_IMAGE = "/neu-library-bg.jpg";

const fadeUp = {
  hidden:  { opacity: 0, y: 24 },
  visible: (i: number) => ({ 
    opacity: 1, 
    y: 0, 
    transition: { 
      delay: i * 0.08, 
      duration: 0.5, 
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number]
    } 
  }),
};

export default function RegisterPage() {
  const router = useRouter();
  const [name,           setName]           = useState("");
  const [studentId,      setStudentId]      = useState("");
  const [idError,        setIdError]        = useState("");
  const [selectedCollege, setSelectedCollege] = useState<College | null>(null);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [yearLevel,      setYearLevel]      = useState<number | null>(null);
  const [empStatus,      setEmpStatus]      = useState<"Student" | "Faculty" | "Staff">("Student");
  const [email,          setEmail]          = useState("");
  const [loading,        setLoading]        = useState(false);
  const [error,          setError]          = useState("");
  const [checkingSession, setCheckingSession] = useState(true);
  const [photoFile,    setPhotoFile]    = useState<File|null>(null);
  const [photoPreview, setPhotoPreview] = useState<string|null>(null);

  useEffect(() => { checkSession(); }, []);

  const checkSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { router.push("/kiosk"); return; }
    const em = session.user.email || "";
    if (!em.endsWith("@neu.edu.ph")) { await supabase.auth.signOut(); router.push("/kiosk"); return; }
    const { data: existing } = await supabase.from("students").select("student_id").eq("email", em).single();
    if (existing) { router.push("/kiosk"); return; }
    setEmail(em);
    const googleName = session.user.user_metadata?.full_name || "";
    if (googleName) setName(googleName);
    setCheckingSession(false);
  };

  const validateId = (val: string) => {
    if (!val.trim()) { setIdError("Student ID is required."); return false; }
    if (!STUDENT_ID_REGEX.test(val.trim())) {
      setIdError("Format must be xx-xxxxx-xxx (e.g. 24-11136-791) or 10 digits.");
      return false;
    }
    setIdError("");
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError("Please enter your full name."); return; }
    if (!validateId(studentId)) return;
    if (!selectedCollege) { setError("Please select your college."); return; }
    if (!selectedProgram && empStatus === "Student") { setError("Please select your program."); return; }
    if (empStatus === "Student" && !yearLevel) { setError("Please select your year level."); return; }

    setLoading(true); setError("");

    const { data: existing } = await supabase.from("students").select("student_id").eq("student_id", studentId.trim()).single();
    if (existing) { setError("Student ID already exists. Please use a different ID."); setLoading(false); return; }

    const collegeDisplay = `${selectedCollege.code} — ${selectedCollege.name}`;

    // Upload photo if provided
    let photoUrl: string | null = null;
    if (photoFile) {
      const ext = photoFile.name.split(".").pop();
      const fileName = `${studentId.trim()}-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("student-photos")
        .upload(fileName, photoFile, { upsert: true });
      if (!uploadError) {
        const { data: urlData } = supabase.storage
          .from("student-photos")
          .getPublicUrl(fileName);
        photoUrl = urlData.publicUrl;
      }
    }

    const { error: insertError } = await supabase.from("students").insert({
      student_id:      studentId.trim(),
      name:            name.trim(),
      email,
      college:         collegeDisplay,
      password:        "google_auth",
      employee_status: empStatus,
      program_id:      selectedProgram?.id ?? null,
      year_level:      empStatus === "Student" ? yearLevel : null,
      is_blocked:      false,
      photo_url:       photoUrl,
    });

    if (insertError) { setError("Registration failed. Please try again."); setLoading(false); return; }

    try {
      await supabase.from("user_roles").insert({ email, role: "user" });
    } catch {}

    document.cookie = `user_email=${email}; path=/; max-age=86400`;
    document.cookie = `active_role=user; path=/; max-age=86400`;
    router.push("/kiosk");
  };

  if (checkingSession) {
    return (
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(145deg,#060d1a,#0d1f3e,#162d55)", fontFamily: "'DM Sans',sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <svg style={{ width: 32, height: 32, margin: "0 auto 12px", display: "block", animation: "spin .8s linear infinite" }} viewBox="0 0 24 24" fill="none">
            <circle style={{ opacity: .18 }} cx="12" cy="12" r="10" stroke="#DAA520" strokeWidth="2.5" />
            <path d="M12 2a10 10 0 0110 10" stroke="#DAA520" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
          <p style={{ color: "rgba(255,255,255,.45)", fontSize: 14 }}>Checking session…</p>
        </div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh", fontFamily: "'DM Sans',sans-serif",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "24px", position: "relative", overflow: "hidden",
    }}>
      {/* Background image */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0 }}>
        <Image src={BG_IMAGE} alt="" fill style={{ objectFit: "cover", objectPosition: "center" }} priority />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(145deg,rgba(6,13,26,.96) 0%,rgba(13,31,62,.94) 40%,rgba(22,45,85,.92) 70%,rgba(10,22,40,.96) 100%)" }} />
      </div>

      {/* Decorations */}
      <div style={{ position: "fixed", inset: 0, backgroundImage: "radial-gradient(circle at 2px 2px,rgba(255,255,255,.025) 1px,transparent 0)", backgroundSize: "28px 28px", pointerEvents: "none", zIndex: 1 }} />
      <div style={{ position: "fixed", top: "-15%", left: "-10%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle,rgba(30,64,175,.2),transparent 68%)", filter: "blur(70px)", pointerEvents: "none", zIndex: 1 }} />
      <div style={{ position: "fixed", bottom: "-15%", right: "-10%", width: 440, height: 440, borderRadius: "50%", background: "radial-gradient(circle,rgba(212,175,55,.1),transparent 68%)", filter: "blur(70px)", pointerEvents: "none", zIndex: 1 }} />
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg,transparent,rgba(212,175,55,.7),transparent)", pointerEvents: "none", zIndex: 2 }} />

      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{ width: "100%", maxWidth: 540, position: "relative", zIndex: 10 }}
      >
        {/* Logo */}
        <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible" style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ position: "relative", display: "inline-block", marginBottom: 16 }}>
            <div style={{ position: "absolute", inset: -18, borderRadius: "50%", background: "radial-gradient(circle,rgba(212,175,55,.18),transparent 68%)", filter: "blur(16px)" }} />
            <div style={{ width: 84, height: 84, borderRadius: "50%", background: "rgba(255,255,255,.07)", border: "2px solid rgba(212,175,55,.32)", padding: 10, position: "relative", boxShadow: "0 0 40px rgba(212,175,55,.12)" }}>
              <Image src="/neu-library-logo.png" alt="NEU" width={84} height={84} style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: "50%" }} />
            </div>
          </div>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".32em", textTransform: "uppercase", color: "rgba(255,255,255,.35)", marginBottom: 6 }}>New Era University</p>
          <h1 style={{ fontSize: 30, fontWeight: 900, color: "#fff", fontFamily: "'Playfair Display',serif", lineHeight: 1.15, marginBottom: 4 }}>Library Registration</h1>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,.45)" }}>Complete your profile to access the library</p>
        </motion.div>

        {/* Glass card */}
        <motion.div
          custom={1} variants={fadeUp} initial="hidden" animate="visible"
          style={{ background: "rgba(255,255,255,.09)", backdropFilter: "blur(28px)", WebkitBackdropFilter: "blur(28px)", border: "1px solid rgba(255,255,255,.15)", borderRadius: 24, padding: "32px 30px", boxShadow: "0 10px 50px rgba(0,0,0,.4), inset 0 1px 0 rgba(255,255,255,.12)" }}
        >
          {/* Verified email */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(74,222,128,.08)", border: "1px solid rgba(74,222,128,.2)", borderRadius: 12, padding: "12px 16px", marginBottom: 22 }}>
            <span style={{ fontSize: 18 }}>✅</span>
            <div>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,.45)", marginBottom: 1 }}>Verified Google Account</p>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#4ade80" }}>{email}</p>
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                style={{ background: "rgba(220,38,38,.12)", border: "1px solid rgba(220,38,38,.28)", borderLeft: "3px solid #ef4444", borderRadius: 11, padding: "11px 14px", marginBottom: 18, display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "#fca5a5", overflow: "hidden" }}
              >
                <span>⚠️</span><span style={{ fontWeight: 600 }}>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Full name */}
            <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible">
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: ".16em", textTransform: "uppercase", color: "rgba(255,255,255,.48)", marginBottom: 7 }}>Full Name</label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 15, top: "50%", transform: "translateY(-50%)", fontSize: 16, pointerEvents: "none" }}>👤</span>
                <input type="text" placeholder="e.g. Juan dela Cruz" value={name} onChange={e => setName(e.target.value)} required
                  style={{ width: "100%", height: 50, paddingLeft: 48, paddingRight: 18, background: "rgba(255,255,255,.07)", border: "1.5px solid rgba(255,255,255,.13)", borderRadius: 12, color: "#fff", fontSize: 14, fontFamily: "'DM Sans',sans-serif", outline: "none", transition: "all .2s" }}
                  onFocus={e => { e.target.style.borderColor = "rgba(212,175,55,.55)"; e.target.style.background = "rgba(255,255,255,.11)"; }}
                  onBlur={e =>  { e.target.style.borderColor = "rgba(255,255,255,.13)"; e.target.style.background = "rgba(255,255,255,.07)"; }}
                />
              </div>
            </motion.div>

            {/* Student ID */}
            <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible">
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: ".16em", textTransform: "uppercase", color: "rgba(255,255,255,.48)", marginBottom: 7 }}>Student / Employee ID</label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 15, top: "50%", transform: "translateY(-50%)", fontSize: 16, pointerEvents: "none" }}>🎓</span>
                <input type="text" placeholder="e.g. 24-11136-791" value={studentId}
                  onChange={e => { setStudentId(e.target.value); if (idError) validateId(e.target.value); }}
                  onBlur={e => validateId(e.target.value)}
                  required
                  style={{ width: "100%", height: 50, paddingLeft: 48, paddingRight: 18, background: "rgba(255,255,255,.07)", border: `1.5px solid ${idError ? "rgba(248,113,113,.5)" : "rgba(255,255,255,.13)"}`, borderRadius: 12, color: "#fff", fontSize: 14, fontFamily: "'DM Sans',sans-serif", outline: "none", transition: "all .2s" }}
                  onFocus={e => { e.target.style.borderColor = idError ? "rgba(248,113,113,.7)" : "rgba(212,175,55,.55)"; e.target.style.background = "rgba(255,255,255,.11)"; }}
                />
              </div>
              {idError && <p style={{ fontSize: 11, color: "#f87171", marginTop: 5, fontWeight: 600 }}>⚠️ {idError}</p>}
              <p style={{ fontSize: 11, color: "rgba(255,255,255,.28)", marginTop: 5 }}>Format: xx-xxxxx-xxx (e.g. 24-11136-791) or 10-digit number</p>
            </motion.div>

            {/* Employee type */}
            <motion.div custom={4} variants={fadeUp} initial="hidden" animate="visible">
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: ".16em", textTransform: "uppercase", color: "rgba(255,255,255,.48)", marginBottom: 10 }}>I am a…</label>
              <div style={{ display: "flex", gap: 10 }}>
                {(["Student", "Faculty", "Staff"] as const).map(type => (
                  <button key={type} type="button" onClick={() => { setEmpStatus(type); setYearLevel(null); }}
                    style={{ flex: 1, height: 46, borderRadius: 12, border: "1.5px solid", fontSize: 14, fontWeight: 700, fontFamily: "'DM Sans',sans-serif", cursor: "pointer", transition: "all .2s",
                      background: empStatus === type ? "rgba(212,175,55,.15)" : "rgba(255,255,255,.05)",
                      borderColor: empStatus === type ? "#DAA520" : "rgba(255,255,255,.13)",
                      color: empStatus === type ? "#DAA520" : "rgba(255,255,255,.5)",
                    }}>
                    {type}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* College + Program + Year Level */}
            <motion.div custom={5} variants={fadeUp} initial="hidden" animate="visible">
              <CollegeSearchDropdown
                onCollegeChange={setSelectedCollege}
                onProgramChange={setSelectedProgram}
                showYearLevel={true}
                selectedYearLevel={yearLevel}
                onYearLevelChange={setYearLevel}
                employeeStatus={empStatus}
              />
            </motion.div>

           {/* Photo upload */}
            <motion.div custom={6} variants={fadeUp} initial="hidden" animate="visible">
              <label style={{ display:"block", fontSize:11, fontWeight:700, letterSpacing:".16em", textTransform:"uppercase", color:"rgba(255,255,255,.48)", marginBottom:10 }}>
                Profile Photo <span style={{ color:"rgba(255,255,255,.25)", fontWeight:400, textTransform:"none", letterSpacing:0 }}>(optional)</span>
              </label>
              <div style={{ display:"flex", alignItems:"center", gap:16 }}>
                {/* Preview */}
                <div style={{ width:72, height:72, borderRadius:"50%", overflow:"hidden", border:"2px solid rgba(212,175,55,.35)", background:"linear-gradient(135deg,#0f2040,#1E3A8A)", display:"flex", alignItems:"center", justifyContent:"center", color:"rgba(255,255,255,.4)", fontSize:11, fontWeight:700, flexShrink:0, textAlign:"center" }}>
                  {photoPreview
                    ? <Image src={photoPreview} alt="Preview" width={72} height={72} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                    : <span style={{fontSize:24}}>👤</span>
                  }
                </div>
                {/* Buttons */}
                <div style={{ display:"flex", flexDirection:"column", gap:8, flex:1 }}>
                  <label style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 16px", background:"rgba(255,255,255,.07)", border:"1.5px solid rgba(255,255,255,.13)", borderRadius:10, cursor:"pointer", fontSize:13, fontWeight:600, color:"rgba(255,255,255,.7)", transition:"all .2s" }}
                    onMouseEnter={e=>(e.currentTarget.style.background="rgba(255,255,255,.11)")}
                    onMouseLeave={e=>(e.currentTarget.style.background="rgba(255,255,255,.07)")}>
                    <span>📷</span> Upload Photo
                    <input type="file" accept="image/jpeg,image/png,image/webp" style={{ display:"none" }}
                      onChange={e=>{
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 5*1024*1024) { setError("Photo must be under 5MB."); return; }
                        setPhotoFile(file);
                        setPhotoPreview(URL.createObjectURL(file));
                      }}/>
                  </label>
                  {photoPreview && (
                    <button type="button" onClick={()=>{ setPhotoFile(null); setPhotoPreview(null); }}
                      style={{ padding:"8px 16px", background:"rgba(248,113,113,.08)", border:"1px solid rgba(248,113,113,.2)", borderRadius:10, color:"#f87171", fontSize:12, fontWeight:700, fontFamily:"'DM Sans',sans-serif", cursor:"pointer" }}>
                      ✕ Remove Photo
                    </button>
                  )}
                  <p style={{ fontSize:10, color:"rgba(255,255,255,.25)", lineHeight:1.5 }}>JPG, PNG or WebP · Max 5MB</p>
                </div>
              </div>
            </motion.div>

            {/* Submit */}
            <motion.button
              type="submit" disabled={loading}
              whileHover={!loading ? { y: -2, boxShadow: "0 12px 32px rgba(184,134,11,.5)" } : {}}
              whileTap={!loading ? { scale: .97 } : {}}
              style={{ width: "100%", height: 52, background: "linear-gradient(135deg,#7a5800,#B8860B,#DAA520,#B8860B)", backgroundSize: "200%", border: "none", borderRadius: 12, color: "#fff", fontSize: 15, fontWeight: 700, fontFamily: "'DM Sans',sans-serif", cursor: loading ? "not-allowed" : "pointer", boxShadow: "0 6px 22px rgba(184,134,11,.35)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: loading ? .65 : 1, marginTop: 4 }}
            >
              {loading
                ? <><svg style={{ width: 17, height: 17, animation: "spin .8s linear infinite" }} viewBox="0 0 24 24" fill="none"><circle style={{ opacity: .25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path style={{ opacity: .75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>Registering…</>
                : "Complete Registration →"
              }
            </motion.button>
          </form>

          <div style={{ marginTop: 18, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,.08)", textAlign: "center" }}>
            <div style={{ width: 28, height: 1, background: "linear-gradient(90deg,transparent,#DAA520,transparent)", margin: "0 auto 10px" }} />
            <p style={{ fontSize: 11, color: "rgba(255,255,255,.25)" }}>Your information will be used solely for library access.</p>
            <button onClick={async () => { await supabase.auth.signOut(); router.push("/kiosk"); }}
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "rgba(255,255,255,.28)", fontFamily: "'DM Sans',sans-serif", marginTop: 8, padding: 4 }}>
              ← Cancel and sign out
            </button>
          </div>
        </motion.div>
      </motion.div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder { color: rgba(255,255,255,.28) !important; font-weight: 400; }
        option { background: #0d1f3e; color: #fff; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #060d1a; }
        ::-webkit-scrollbar-thumb { background: rgba(212,175,55,.3); border-radius: 2px; }
      `}</style>
    </div>
  );
}