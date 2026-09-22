// Shared types for all report card templates.
// Supports fully-flexible assessment columns and preset color styles per template.

export interface ScoreBreakdown {
  name: string;   // e.g. "CA1", "Assignment", "Homework"
  max: number;    // e.g. 20
  score: number | null;
}

export interface ReportScore {
  subject_name: string;
  breakdowns: ScoreBreakdown[];  // dynamic columns for CA/Exam/Assignment etc
  total: number | null;          // usually sum of breakdowns, out of 100
  grade?: string;                // e.g. "A1"
  remark?: string;               // "Excellent", "V. Good", etc
  position_in_subject?: number | null;
  class_avg?: number | null;
}

export interface ColorStyle {
  key: string;         // e.g. "modern-minimal-ocean"
  label: string;       // e.g. "Ocean"
  bg: string;          // page background
  primary: string;     // main color (headers, borders)
  accent: string;      // secondary color (highlights, badges)
  ink: string;         // main text color
  soft: string;        // subtle surface (row stripe, panel bg)
}

export interface ReportTemplateProps {
  school: {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    logo_url?: string | null;
    motto?: string;
    principal_name?: string;
    principal_signature_url?: string | null;
    stamp_url?: string | null;
  };
  student: {
    first_name: string;
    middle_name?: string;
    last_name: string;
    admission_number: string;
    photo_url?: string | null;
    gender?: string;
    date_of_birth?: string;
    house?: string;
  };
  section: {
    name: string;
    full_name?: string;
    class_level_name: string;
    class_level_id: string;
  };
  term: {
    name: string;
    session_name: string;
    next_term_begins?: string | null;
  };
  scores: ReportScore[];
  summary: {
    total_marks: number;
    average: number;
    overall_grade?: string;
    overall_remark?: string;
    position_in_class?: number | null;
    students_in_class: number;
  };
  behavior: {
    affective: Array<{ name: string; rating: number }>;
    psychomotor: Array<{ name: string; rating: number }>;
  };
  comments: {
    teacher_comment?: string;
    teacher_name?: string;
    principal_comment?: string;
  };
  attendance: {
    present?: number;
    absent?: number;
    late?: number;
    total_days?: number;
    rate_percent?: number;
  };
  cumulative: {
    term1_avg?: number | null;
    term2_avg?: number | null;
    term3_avg?: number | null;
    cumulative_avg?: number | null;
  };
  grade_scale: Array<{
    grade: string;
    min: number;
    max: number;
    remark?: string;
  }>;
  settings: {
    show_photo?: boolean;
    show_house?: boolean;
    show_position?: boolean;
    show_subject_position?: boolean;
    show_class_avg?: boolean;
    show_attendance?: boolean;
    show_cumulative?: boolean;
    show_affective?: boolean;
    show_psychomotor?: boolean;
    show_teacher_comment?: boolean;
    show_principal_comment?: boolean;
    show_grade_scale?: boolean;
    [key: string]: any;
  };
  /** The chosen color style for this render */
  style: ColorStyle;
}

/** Helper: format ordinal — 1 → "1st", 2 → "2nd", 3 → "3rd", 4 → "4th" */
export function ordinal(n: number | null | undefined): string {
  if (!n) return '';
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/** Helper: render a 5-star rating */
export function stars(n: number): string {
  const full = Math.max(0, Math.min(5, Math.round(n || 0)));
  return '★'.repeat(full) + '☆'.repeat(5 - full);
}

/** Helper: grade → color pair for badges */
export function gradeChip(grade: string | undefined): { bg: string; fg: string } {
  const g = (grade || '').toUpperCase();
  if (g.startsWith('A')) return { bg: '#d1fae5', fg: '#065f46' };
  if (g === 'B2') return { bg: '#dbeafe', fg: '#1e40af' };
  if (g === 'B3') return { bg: '#e0e7ff', fg: '#3730a3' };
  if (g.startsWith('C')) return { bg: '#fef3c7', fg: '#92400e' };
  if (g === 'D7' || g === 'E8') return { bg: '#fed7aa', fg: '#9a3412' };
  if (g === 'F9') return { bg: '#fecaca', fg: '#991b1b' };
  return { bg: '#f3f4f6', fg: '#6b7280' };
}
