"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Admin Check
    if (studentId === "jcesperanza@neu.edu.ph") {
      const { data: roleData } = await supabase
        .from("user_roles").select("role").eq("email", studentId).single();
      
      if (roleData?.role === "admin" && password === "admin123") {
        router.push("/admin"); 
        return;
      }
      setError("Invalid admin credentials.");
      setLoading(false); 
      return;
    }

    // Student Check
    const { data: student, error: fetchError } = await supabase
      .from("students").select("*")
      .eq("student_id", studentId).eq("password", password).single();

    if (fetchError || !student) {
      setError("Invalid student number or password.");
      setLoading(false); 
      return;
    }

    // Insert Visit Record
    await supabase.from("library_visits").insert({
      student_id: student.student_id,
      visit_date: new Date().toISOString().split("T")[0],
      visit_time: new Date().toTimeString().split(" ")[0],
    });

    sessionStorage.setItem("student", JSON.stringify(student));
    router.push("/reason");
  };

  return (
    <div className="min-h-screen w-full flex bg-gray-50 overflow-hidden" style={{ fontFamily: 'var(--font-body)' }}>

      {/* ── LEFT: Branding Panel ── */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-red-950 via-red-900 to-red-800 relative overflow-hidden flex-col items-center justify-center">

        {/* Abstract Background Elements */}
        <div className="absolute top-[-120px] right-[-120px] w-[500px] h-[500px] rounded-full border border-white/5" />
        <div className="absolute bottom-[-150px] left-[-100px] w-[450px] h-[450px] rounded-full border border-white/5" />

        {/* Content */}
        <div className="relative z-10 px-16 w-full max-w-lg text-center flex flex-col items-center">
          
          {/* Floating Logo */}
          <div className="w-40 h-40 rounded-full bg-white p-3 shadow-2xl shadow-yellow-500/20 mb-8 animate-bounce" style={{ animationDuration: '3s' }}>
            <Image src="/neu-library-logo.png" alt="NEU Library" width={160} height={160} className="w-full h-full object-contain rounded-full" />
          </div>

          <div>
            <p className="text-yellow-400 text-xs font-bold tracking-[0.3em] uppercase mb-4">
              New Era University
            </p>
            <h1 className="text-5xl font-black text-white leading-tight mb-2 tracking-tight">
              Library Portal
            </h1>
            <h2 className="text-2xl font-medium text-white/80 mb-8">
              Visitor Check-in System
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent mx-auto rounded-full mb-12" />
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full text-left">
            {[
              { icon: "📚", title: "Smart Check-in", desc: "Instant digital records" },
              { icon: "📊", title: "Track Visits", desc: "View library history" },
              { icon: "🎓", title: "Exclusive", desc: "For NEU Students" },
              { icon: "⚡", title: "Fast Access", desc: "No paper logs needed" },
            ].map((item) => (
              <div key={item.title} className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-4 flex items-start gap-4 hover:bg-white/20 transition-colors">
                <span className="text-2xl mt-0.5">{item.icon}</span>
                <div>
                  <p className="text-white text-sm font-bold">{item.title}</p>
                  <p className="text-white/60 text-xs mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT: Login Form ── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative">
        <div className="w-full max-w-md relative z-10">

          {/* Mobile Logo Header */}
          <div className="lg:hidden text-center mb-10">
            <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-white p-2 shadow-xl shadow-red-900/10">
              <Image src="/neu-library-logo.png" alt="NEU" width={80} height={80} className="w-full h-full object-contain rounded-full" />
            </div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">NEU Library</h1>
            <p className="text-sm text-gray-500 font-medium">Visitor Check-in System</p>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-2xl shadow-red-900/10 border border-gray-100">
            
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 text-xs font-bold px-3 py-1.5 rounded-full mb-6 border border-green-100">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                Library is Open
              </div>
              <h2 className="text-3xl font-black text-gray-900 leading-tight">Welcome Back</h2>
              <p className="text-gray-500 text-sm mt-2">Enter your NEU credentials to check in.</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-6 flex items-start gap-3">
                <span className="text-red-500 mt-0.5">⚠️</span>
                <p className="text-red-700 text-sm font-medium">{error}</p>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              
              {/* Student ID / Email */}
              <div>
                <label className="block text-xs font-bold text-gray-500 tracking-widest uppercase mb-2">
                  Student Number / Email
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-red-600 transition-colors">
                    🎓
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. 2021-00001"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    required
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600 focus:bg-white transition-all placeholder:text-gray-400"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-gray-500 tracking-widest uppercase mb-2">
                  Password
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-red-600 transition-colors">
                    🔒
                  </div>
                  <input
                    type={showPass ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-12 pr-12 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600 focus:bg-white transition-all placeholder:text-gray-400"
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors text-sm">
                    {showPass ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-red-800 hover:bg-red-900 text-white font-bold py-3.5 rounded-xl text-sm transition-all shadow-lg shadow-red-900/20 hover:shadow-red-900/40 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                      </svg>
                      Checking in...
                    </>
                  ) : (
                    <>Sign In & Check In →</>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-100 text-center">
              <p className="text-xs font-semibold text-gray-400">
                New Era University LMS
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Admins: Use your NEU email to access the dashboard.
              </p>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}