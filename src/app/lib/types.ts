// ============================================================
// NEU Library — Shared Types
// app/lib/types.ts
// ============================================================

export interface College {
  id: number;
  code: string;  // e.g. "CICS"
  name: string;  // e.g. "College of Informatics and Computing Studies"
}

export interface Program {
  id: number;
  college_id: number;
  name: string;
  college?: College;
}

export interface Student {
  student_id: string;
  name: string;
  email: string;
  college: string;          // legacy plain text — kept for backward compat
  password: string;
  employee_status: "Student" | "Faculty" | "Staff";
  qr_code: string | null;
  google_id: string | null;
  is_blocked: boolean;
  program_id: number | null;
  year_level: number | null; // 1–5, null for Faculty/Staff
  // Joined fields (from query)
  program?: Program;
  college_name?: string;    // from programs.colleges.name
  college_code?: string;    // from programs.colleges.code
  program_name?: string;    // from programs.name
}

export interface Visit {
  visit_id: string;
  student_id: string;
  reason: string | null;
  visit_date: string;
  visit_time: string;
  time_out: string | null;
  visit_status: "inside" | "completed" | null;
  students: {
    name: string;
    college: string;
    college_code?: string;
    program_name?: string;
    employee_status: string;
    email: string;
    year_level?: number | null;
  };
}

export interface LibraryStatus {
  id: number;
  is_open: boolean;
  opened_by: string | null;
  opened_at: string | null;
  closed_by: string | null;
  closed_at: string | null;
  note: string | null;
  schedule_note: string | null;
}

export interface LibrarySchedule {
  id: number;       // 1=Mon … 7=Sun
  day_name: string;
  is_open: boolean;
  opening_time: string; // "07:00:00"
  closing_time: string; // "19:00:00"
}

export interface HelpContent {
  id: string;
  section: "faq" | "contact" | "troubleshooting";
  title: string;
  content: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Kiosk student — minimal shape passed through sessionStorage
export interface KioskStudent {
  student_id: string;
  name: string;
  college: string;
  college_code: string;
  program_name: string;
  year_level: number | null;
  employee_status: string;
  photo_url?: string | null;
}

// ID format validation
// Accepts: xx-xxxxx-xxx | xxxxxxxxxx (10 digits) | xxxx-xxxxx (legacy protected)
export const STUDENT_ID_REGEX =
  /^(\d{2}-\d{5}-\d{3}|\d{10}|\d{4}-\d{5}|\d{2}-\d{5})$/;

export const YEAR_LEVELS = [
  { value: 1, label: "1st Year" },
  { value: 2, label: "2nd Year" },
  { value: 3, label: "3rd Year" },
  { value: 4, label: "4th Year" },
  { value: 5, label: "5th Year" },
];

export const EMPLOYEE_STATUSES = ["Student", "Faculty", "Staff"] as const;

export const VISIT_REASONS = [
  "Studying",
  "Borrowing Books",
  "Research",
  "Group Work",
  "Printing",
] as const;