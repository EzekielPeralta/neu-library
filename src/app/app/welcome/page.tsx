"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";
import Image from "next/image";

interface Stats { total: number; thisWeek: number; thisMonth: number; }

export default function WelcomePage() {
  const router = useRouter();
  const [studentName, setStudentName] = useState("");
  const [college, setCollege] = useState("");
  const [studentId, setStudentId] = useState("");
  const [stats, setStats] = useState<Stats>({ total: 0, thisWeek: 0, thisMonth: 0 });
  const [loading, setLoading] = useState(true);
  const [visitReason, setVisitReason] = useState("");

  useEffect(() => {
    const stored = sessionStorage.getItem("student");
    if (!stored) { 
      router.push("/login"); 
      return; 
    }
    const student = JSON.parse(stored);
    setStudentName(student.name);
    setCollege(student.college);
    setStudentId(student.student_id);
    fetchStats(student.student_id);
  }, [router]);

  const fetchStats = async (id: string) => {
    const now = new Date();
    
    // Total
    const { count: total } = await supabase.from("library_visits")
      .select("*", { count: "exact", head: true }).eq("student_id", id);
      
    // This Week
    const weekAgo = new Date(now); 
    weekAgo.setDate(now.getDate() - 7);
    const { count: thisWeek } = await supabase.from("library_visits")
      .select("*", { count: "exact", head: true }).eq("student_id", id)
      .gte("visit_date", weekAgo.toISOString().split("T")[0]);
      
    // This Month
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
    const { count: thisMonth } = await supabase.from("library_visits")
      .select("*", { count: "exact", head: true }).eq("student_id", id)
      .gte("visit_date", monthStart);
      
    // Latest Reason
    const { data: latest } = await supabase.from("library_visits")
      .select("reason").eq("student_id", id)
      .order("visit_date", { ascending: false })
      .order("visit_time", { ascending: false }).limit(1).single();
      
    if (latest?.reason) setVisitReason(latest.reason);
    setStats({ total: total || 0, thisWeek: thisWeek || 0, thisMonth: thisMonth || 0 });
    setLoading(false);
  };

  const now = new Date();
  const timeString = now.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", hour12: true });
  const dateString = now.toLocaleDateString("en-PH", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  const reasonData: Record<string, { icon: string; color: string; bg: string }> = {
    Studying: { icon: "📚", color: "#3B82F6", bg: "#EFF6FF" },
    "Borrowing Books": { icon: "📖", color: "#10B981", bg: "#ECFDF5" },
    Research: { icon: "🔬", color: "#8B5CF6", bg: "#F5F3FF" },
    "Group Work": { icon: "👥", color: "#F59E0B", bg: "#FFFBEB" },
    Printing: { icon: "🖨️", color: "#EC4899", bg: "#FDF2F8" },
  };

  const currentReason = visitReason ? reasonData[visitReason] : null;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 relative overflow-hidden" style={{ fontFamily: 'var(--font-body)' }}>

      <div className="w-full max-w-md relative z-10 space-y-4">

        {/* Hero Card */}
        <div className="bg-gradient-to-br from-red-950 via-red-900 to-red-800 rounded-3xl overflow-hidden relative shadow-2xl shadow-red-900/20">
          <div className="absolute top-[-60px] right-[-60px] w-48 h-48 rounded-full bg-white/5" />
          <div className="absolute bottom-[-40px] left-[-40px] w-36 h-36 rounded-full bg-white/5" />

          <div className="relative z-10 p-8">
            <div className="flex items-start justify-between mb-8">
              <div className="w-16 h-16 rounded-2xl bg-white p-2 shadow-xl shadow-black/10">
                <Image src="/neu-library-logo.png" alt="NEU" width={64} height={64} className="w-full h-full object-contain rounded-xl" />
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-white text-xs font-bold tracking-wide">Visit Recorded</span>
              </div>
            </div>

            <p className="text-yellow-400 text-xs font-bold tracking-widest uppercase mb-2">
              Welcome back!
            </p>
            <h1 className="text-3xl font-black text-white leading-tight mb-1 tracking-tight">
              {studentName}
            </h1>
            <p className="text-white/80 text-sm font-medium">{college}</p>
            <p className="text-white/50 text-xs mt-1">{studentId}</p>

            <div className="mt-8 pt-6 border-t border-white/10 flex justify-between items-center">
              <p className="text-white/60 text-xs font-medium">{dateString}</p>
              <p className="text-yellow-400 font-bold text-base tracking-wide">{timeString}</p>
            </div>
          </div>
        </div>

        {/* Reason Badge */}
        {visitReason && currentReason && (
          <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4 shadow-lg shadow-gray-200/50 hover:scale-[1.02] transition-transform">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
              style={{ backgroundColor: currentReason.bg }}>
              {currentReason.icon}
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-0.5">Purpose of Visit</p>
              <p className="font-bold text-sm" style={{ color: currentReason.color }}>{visitReason}</p>
            </div>
            <div className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ backgroundColor: currentReason.bg }}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke={currentReason.color} strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-lg shadow-gray-200/50">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
            Your Visit Statistics
          </p>
          {loading ? (
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-gray-50 rounded-2xl animate-pulse border border-gray-100" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Total", sub: "All time", value: stats.total, color: "#8B0000", bg: "#FFF1F1", emoji: "🏆" },
                { label: "Week", sub: "7 days", value: stats.thisWeek, color: "#D97706", bg: "#FFFBEB", emoji: "📅" },
                { label: "Month", sub: new Date().toLocaleString("default", { month: "short" }), value: stats.thisMonth, color: "#059669", bg: "#ECFDF5", emoji: "📊" },
              ].map((stat) => (
                <div key={stat.label} className="rounded-2xl p-4 text-center hover:scale-105 transition-transform cursor-default"
                  style={{ backgroundColor: stat.bg }}>
                  <p className="text-xl mb-2">{stat.emoji}</p>
                  <p className="text-3xl font-black" style={{ color: stat.color }}>
                    {stat.value}
                  </p>
                  <p className="text-xs font-bold text-gray-700 mt-2">{stat.label}</p>
                  <p className="text-[10px] font-medium text-gray-500 mt-0.5 uppercase tracking-wider">{stat.sub}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-white rounded-3xl border border-gray-100 p-6 text-center shadow-lg shadow-gray-200/50">
          <div className="text-4xl mb-3">🎓</div>
          <p className="text-gray-900 font-black text-lg">You may now enter the library.</p>
          <p className="text-gray-500 text-sm mt-1 mb-6 font-medium">Have a productive and fulfilling visit!</p>
          <button
            onClick={() => { sessionStorage.clear(); router.push("/login"); }}
            className="w-full border-2 border-red-800 text-red-800 hover:bg-red-800 hover:text-white font-bold py-4 rounded-xl transition-all duration-300 text-sm group active:scale-[0.98]"
          >
            <span className="flex items-center justify-center gap-2">
              Done — Sign Out
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}