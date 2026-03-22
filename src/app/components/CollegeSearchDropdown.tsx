"use client";
// ============================================================
// NEU Library — CollegeSearchDropdown
// app/components/CollegeSearchDropdown.tsx
// Searchable by college code AND full name
// Selecting a college loads its programs in a second dropdown
// ============================================================

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/app/lib/supabase";
import type { College, Program } from "@/app/lib/types";

interface Props {
  selectedCollegeId?: number | null;
  selectedProgramId?: number | null;
  onCollegeChange?: (college: College | null) => void;
  onProgramChange?: (program: Program | null) => void;
  showYearLevel?: boolean;
  selectedYearLevel?: number | null;
  onYearLevelChange?: (year: number | null) => void;
  employeeStatus?: string;
  disabled?: boolean;
  error?: string;
}

const YEAR_LEVELS = [
  { value: 1, label: "1st Year" },
  { value: 2, label: "2nd Year" },
  { value: 3, label: "3rd Year" },
  { value: 4, label: "4th Year" },
  { value: 5, label: "5th Year" },
];

const inputBase: React.CSSProperties = {
  width: "100%",
  height: 50,
  padding: "0 18px 0 48px",
  background: "rgba(255,255,255,.07)",
  border: "1.5px solid rgba(255,255,255,.13)",
  borderRadius: 12,
  color: "#fff",
  fontSize: 14,
  fontWeight: 500,
  fontFamily: "'DM Sans',sans-serif",
  outline: "none",
  transition: "all .2s",
};

const dropdownBase: React.CSSProperties = {
  position: "absolute",
  top: "calc(100% + 6px)",
  left: 0,
  right: 0,
  background: "#0d1f3e",
  border: "1px solid rgba(212,175,55,.25)",
  borderRadius: 12,
  zIndex: 999,
  maxHeight: 260,
  overflowY: "auto",
  boxShadow: "0 16px 48px rgba(0,0,0,.5)",
};

export default function CollegeSearchDropdown({
  selectedCollegeId,
  selectedProgramId,
  onCollegeChange,
  onProgramChange,
  showYearLevel = true,
  selectedYearLevel,
  onYearLevelChange,
  employeeStatus = "Student",
  disabled = false,
  error,
}: Props) {
  const [colleges,       setColleges]       = useState<College[]>([]);
  const [programs,       setPrograms]       = useState<Program[]>([]);
  const [collegeQuery,   setCollegeQuery]   = useState("");
  const [programQuery,   setProgramQuery]   = useState("");
  const [collegeOpen,    setCollegeOpen]    = useState(false);
  const [programOpen,    setProgramOpen]    = useState(false);
  const [selectedCollege, setSelectedCollege] = useState<College | null>(null);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [loading,        setLoading]        = useState(true);

  const collegeRef = useRef<HTMLDivElement>(null);
  const programRef = useRef<HTMLDivElement>(null);

  // Load colleges once
  useEffect(() => {
    supabase
      .from("colleges")
      .select("*")
      .order("name")
      .then(({ data }) => {
        if (data) setColleges(data as College[]);
        setLoading(false);
      });
  }, []);

  // Load programs when college changes
  useEffect(() => {
    if (!selectedCollege) { setPrograms([]); return; }
    supabase
      .from("programs")
      .select("*")
      .eq("college_id", selectedCollege.id)
      .order("name")
      .then(({ data }) => {
        if (data) setPrograms(data as Program[]);
      });
  }, [selectedCollege]);

  // Restore selections from IDs (edit mode)
  useEffect(() => {
    if (!selectedCollegeId || colleges.length === 0) return;
    const found = colleges.find(c => c.id === selectedCollegeId);
    if (found) {
      setSelectedCollege(found);
      setCollegeQuery(`${found.code} — ${found.name}`);
    }
  }, [selectedCollegeId, colleges]);

  useEffect(() => {
    if (!selectedProgramId || programs.length === 0) return;
    const found = programs.find(p => p.id === selectedProgramId);
    if (found) {
      setSelectedProgram(found);
      setProgramQuery(found.name);
    }
  }, [selectedProgramId, programs]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (collegeRef.current && !collegeRef.current.contains(e.target as Node)) setCollegeOpen(false);
      if (programRef.current && !programRef.current.contains(e.target as Node)) setProgramOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filteredColleges = colleges.filter(c => {
    const q = collegeQuery.toLowerCase();
    return (
      c.code.toLowerCase().includes(q) ||
      c.name.toLowerCase().includes(q)
    );
  });

  const filteredPrograms = programs.filter(p =>
    p.name.toLowerCase().includes(programQuery.toLowerCase())
  );

  const handleCollegeSelect = (college: College) => {
    setSelectedCollege(college);
    setCollegeQuery(`${college.code} — ${college.name}`);
    setCollegeOpen(false);
    setSelectedProgram(null);
    setProgramQuery("");
    onCollegeChange?.(college);
    onProgramChange?.(null);
  };

  const handleProgramSelect = (program: Program) => {
    setSelectedProgram(program);
    setProgramQuery(program.name);
    setProgramOpen(false);
    onProgramChange?.(program);
  };

  const handleCollegeInputChange = (val: string) => {
    setCollegeQuery(val);
    setCollegeOpen(true);
    if (!val) {
      setSelectedCollege(null);
      setSelectedProgram(null);
      setProgramQuery("");
      onCollegeChange?.(null);
      onProgramChange?.(null);
    }
  };

  const isStudent = employeeStatus === "Student";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      {/* ── College Dropdown ── */}
      <div>
        <label style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: ".16em", textTransform: "uppercase", color: "rgba(255,255,255,.48)", marginBottom: 7 }}>
          College
        </label>
        <div ref={collegeRef} style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 15, top: "50%", transform: "translateY(-50%)", fontSize: 16, pointerEvents: "none", zIndex: 1 }}>🏛️</span>
          <input
            type="text"
            placeholder={loading ? "Loading colleges…" : "Search college (e.g. CICS or Informatics)"}
            value={collegeQuery}
            disabled={disabled || loading}
            onChange={e => handleCollegeInputChange(e.target.value)}
            onFocus={() => setCollegeOpen(true)}
            style={{
              ...inputBase,
              borderColor: error ? "rgba(248,113,113,.5)" : selectedCollege ? "rgba(212,175,55,.55)" : "rgba(255,255,255,.13)",
              opacity: disabled ? .6 : 1,
            }}
          />
          <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "rgba(255,255,255,.3)", pointerEvents: "none" }}>
            {selectedCollege ? "✓" : "▾"}
          </span>

          {collegeOpen && filteredColleges.length > 0 && (
            <div style={dropdownBase}>
              {filteredColleges.map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleCollegeSelect(c)}
                  style={{
                    width: "100%", textAlign: "left", padding: "11px 16px",
                    background: selectedCollege?.id === c.id ? "rgba(212,175,55,.12)" : "transparent",
                    border: "none", cursor: "pointer", fontFamily: "'DM Sans',sans-serif",
                    borderBottom: "1px solid rgba(255,255,255,.05)",
                    transition: "background .15s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,.06)")}
                  onMouseLeave={e => (e.currentTarget.style.background = selectedCollege?.id === c.id ? "rgba(212,175,55,.12)" : "transparent")}
                >
                  <span style={{ fontSize: 11, fontWeight: 800, color: "#DAA520", marginRight: 8, letterSpacing: ".05em" }}>{c.code}</span>
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,.8)", fontWeight: 500 }}>{c.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Program Dropdown ── */}
      {selectedCollege && (
        <div>
          <label style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: ".16em", textTransform: "uppercase", color: "rgba(255,255,255,.48)", marginBottom: 7 }}>
            Program
          </label>
          <div ref={programRef} style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 15, top: "50%", transform: "translateY(-50%)", fontSize: 16, pointerEvents: "none", zIndex: 1 }}>📚</span>
            <input
              type="text"
              placeholder="Search program…"
              value={programQuery}
              disabled={disabled}
              onChange={e => { setProgramQuery(e.target.value); setProgramOpen(true); }}
              onFocus={() => setProgramOpen(true)}
              style={{
                ...inputBase,
                borderColor: selectedProgram ? "rgba(212,175,55,.55)" : "rgba(255,255,255,.13)",
              }}
            />
            <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "rgba(255,255,255,.3)", pointerEvents: "none" }}>
              {selectedProgram ? "✓" : "▾"}
            </span>

            {programOpen && filteredPrograms.length > 0 && (
              <div style={dropdownBase}>
                {filteredPrograms.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleProgramSelect(p)}
                    style={{
                      width: "100%", textAlign: "left", padding: "11px 16px",
                      background: selectedProgram?.id === p.id ? "rgba(212,175,55,.12)" : "transparent",
                      border: "none", cursor: "pointer", fontFamily: "'DM Sans',sans-serif",
                      borderBottom: "1px solid rgba(255,255,255,.05)",
                      transition: "background .15s",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,.06)")}
                    onMouseLeave={e => (e.currentTarget.style.background = selectedProgram?.id === p.id ? "rgba(212,175,55,.12)" : "transparent")}
                  >
                    <span style={{ fontSize: 13, color: "rgba(255,255,255,.8)", fontWeight: 500 }}>{p.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Year Level ── */}
      {showYearLevel && isStudent && selectedCollege && (
        <div>
          <label style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: ".16em", textTransform: "uppercase", color: "rgba(255,255,255,.48)", marginBottom: 7 }}>
            Year Level
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            {YEAR_LEVELS.map(y => (
              <button
                key={y.value}
                type="button"
                disabled={disabled}
                onClick={() => onYearLevelChange?.(y.value)}
                style={{
                  flex: 1, height: 44, borderRadius: 10, border: "1.5px solid",
                  fontSize: 13, fontWeight: 700, fontFamily: "'DM Sans',sans-serif",
                  cursor: "pointer", transition: "all .18s",
                  background: selectedYearLevel === y.value ? "rgba(212,175,55,.15)" : "rgba(255,255,255,.05)",
                  borderColor: selectedYearLevel === y.value ? "#DAA520" : "rgba(255,255,255,.13)",
                  color: selectedYearLevel === y.value ? "#DAA520" : "rgba(255,255,255,.45)",
                }}
              >
                {y.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}