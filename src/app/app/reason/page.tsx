"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";
import Image from "next/image";

const REASONS = [
  { label: "Studying", icon: "📚", desc: "Individual study or review", accent: "#3B82F6", bg: "#EFF6FF", border: "#BFDBFE" },
  { label: "Borrowing Books", icon: "📖", desc: "Check out library materials", accent: "#10B981", bg: "#ECFDF5", border: "#A7F3D0" },
  { label: "Research", icon: "🔬", desc: "Academic or thesis research", accent: "#8B5CF6", bg: "#F5F3FF", border: "#DDD6FE" },
  { label: "Group Work", icon: "👥", desc: "Collaborative group study", accent: "#F59E0B", bg: "#FFFBEB", border: "#FDE68A" },
  { label: "Printing", icon: "🖨️", desc: "Print documents or files", accent: "#EC4899", bg: "#FDF2F8", border: "#FBCFE8" },
];

export default function ReasonPage() {
  const router = useRouter();
  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(false);
  const [studentName, setStudentName] = useState("");
  const [studentId, setStudentId] = useState("");

  useEffect(() => {
    const stored = sessionStorage.getItem("student");
    if (!stored) { 
      router.push("/login"); 
      return; 
    }
    const student = JSON.parse(stored);
    setStudentName(student.name.split(" ")[0]);
    setStudentId(student.student_id);
  }, [router]);

  const handleSubmit = async () => {
    if (!selected) return;
    setLoading(true);
    
    const stored = sessionStorage.getItem("student");
    if (!stored) return;
    const student = JSON.parse(stored);
    
    // Fetch the most recent visit created during the login step
    const { data: visits } = await supabase
      .from("library_visits").select("visit_id")
      .eq("student_id", student.student_id)
      .order("visit_date", { ascending: false })
      .order("visit_time", { ascending: false })
      .limit(1);
      
    if (visits && visits.length > 0) {
      await supabase.from("library_visits")
        .update({ reason: selected })
        .eq("visit_id", visits[0].visit_id);
    }
    
    router.push("/welcome");
  };

  const selectedReason = REASONS.find(r => r.label === selected);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 relative overflow-hidden" style={{ fontFamily: 'var(--font-body)' }}>

      <div className="w-full max-w-md relative z-10">

        {/* Top bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white shadow-md shadow-red-900/5 p-2 border border-gray-100">
              <Image src="/neu-library-logo.png" alt="NEU" width={48} height={48} className="w-full h-full object-contain" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 tracking-widest uppercase">NEU Library</p>
              <p className="text-sm font-medium text-gray-400">{studentId}</p>
            </div>
          </div>
          <div className="bg-red-50 border border-red-100 px-3 py-1.5 rounded-full">
            <p className="text-xs font-bold text-red-700">Step 2/2</p>
          </div>
        </div>

        {/* Main card */}
        <div className="bg-white rounded-3xl shadow-2xl shadow-red-900/10 border border-gray-100 overflow-hidden">

          {/* Header */}
          <div className="bg-gradient-to-br from-red-950 via-red-900 to-red-800 relative px-8 pt-8 pb-7 overflow-hidden">
            {/* Abstract shapes */}
            <div className="absolute top-[-30px] right-[-30px] w-32 h-32 rounded-full bg-white/5" />
            <div className="absolute bottom-[-20px] left-[40%] w-24 h-24 rounded-full bg-white/5" />
            
            <div className="relative z-10">
              <p className="text-yellow-400 text-xs font-bold tracking-widest uppercase mb-2">
                Hello, welcome! 👋
              </p>
              <h1 className="text-3xl font-black text-white tracking-tight">
                {studentName}
              </h1>
              <p className="text-white/80 text-sm mt-1">
                What brings you to the library today?
              </p>
            </div>
          </div>

          <div className="p-8">
            {/* Reason grid */}
            <div className="space-y-3 mb-8">
              {REASONS.map((reason) => {
                const isSelected = selected === reason.label;
                return (
                  <button
                    key={reason.label}
                    onClick={() => setSelected(reason.label)}
                    className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl border-2 transition-all duration-200 text-left hover:scale-[1.02]"
                    style={{
                      backgroundColor: isSelected ? reason.bg : '#F9FAFB',
                      borderColor: isSelected ? reason.accent : '#F3F4F6',
                    }}
                  >
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 transition-all"
                      style={{ backgroundColor: isSelected ? reason.accent + '20' : '#F3F4F6' }}>
                      {reason.icon}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm"
                        style={{ color: isSelected ? reason.accent : '#374151' }}>
                        {reason.label}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{reason.desc}</p>
                    </div>
                    
                    <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all"
                      style={{
                        borderColor: isSelected ? reason.accent : '#D1D5DB',
                        backgroundColor: isSelected ? reason.accent : 'transparent',
                      }}>
                      {isSelected && (
                        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={!selected || loading}
              className="w-full text-white font-bold py-4 rounded-xl text-sm transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:shadow-none active:scale-[0.98] flex items-center justify-center gap-2"
              style={{
                backgroundColor: selectedReason ? selectedReason.accent : '#D1D5DB',
                boxShadow: selectedReason ? `0 8px 20px ${selectedReason.accent}40` : 'none',
              }}
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Recording visit...
                </>
              ) : selected ? (
                `Continue with ${selected} →`
              ) : (
                "Select a reason to continue"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}