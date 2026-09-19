// Placeholder for the "Modern Minimal" report card template (Drop 13B).
// The 5 real templates (classic-nigerian, modern-minimal, executive, compact-grid,
// warm-academic) will be dropped in later, each implementing ReportTemplateProps.
// Until then, every template slot in the app renders this component so the data
// pipeline, uploads, and settings can be built and tested end-to-end.

export interface ReportTemplateProps {
  school: {
    name: string;
    address: string | null;
    phone: string | null;
    email: string | null;
    logo_url: string | null;
    motto: string | null;
    principal_name: string | null;
    principal_signature_url: string | null;
    stamp_url: string | null;
  };
  student: {
    first_name: string;
    middle_name: string | null;
    last_name: string;
    admission_number: string;
    photo_url: string | null;
    gender: string | null;
    date_of_birth: string | null;
    house: string | null;
  };
  section: {
    name: string;
    full_name: string | null;
    class_level_name: string;
    class_level_id: string;
  };
  term: {
    name: string;
    session_name: string;
    next_term_begins: string | null;
  };
  scores: Array<{
    subject_name: string;
    ca1: number | null;
    ca2: number | null;
    exam: number | null;
    total: number;
    grade: string | null;
    remark: string | null;
    position_in_subject: number | null;
    class_avg: number | null;
  }>;
  summary: {
    total_marks: number;
    average: number;
    overall_grade: string | null;
    position_in_class: number | null;
    students_in_class: number | null;
  };
  behavior: {
    affective: Array<{ name: string; rating: number | null }>;
    psychomotor: Array<{ name: string; rating: number | null }>;
  };
  comments: {
    teacher_comment: string | null;
    teacher_name: string | null;
    principal_comment: string | null;
  };
  attendance: {
    present: number;
    absent: number;
    late: number;
    total_days: number;
    rate_percent: number;
  };
  cumulative: {
    term1_avg: number | null;
    term2_avg: number | null;
    term3_avg: number | null;
    cumulative_avg: number | null;
  };
  grade_scale: Array<{
    grade: string;
    min: number;
    max: number;
    remark: string | null;
  }>;
  // Full report_card_settings row — all 17 show_* toggles plus branding/template fields
  settings: Record<string, any>;
  color: {
    primary: string;
    accent: string | null;
  };
}

export default function ModernMinimalTemplate(props: ReportTemplateProps) {
  return (
    <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-6 lg:p-8 space-y-4 print:border-solid">
      <div className="text-center space-y-1">
        <p className="font-semibold text-gray-700">Template will be provided separately</p>
        <p className="text-xs text-gray-500">
          This is the "Modern Minimal" placeholder — the real templates (classic-nigerian, modern-minimal,
          executive, compact-grid, warm-academic) will replace this and receive exactly the props below.
        </p>
      </div>
      <pre className="text-left text-[10px] leading-relaxed bg-gray-50 border border-gray-200 rounded-lg p-4 overflow-auto max-h-[70vh] whitespace-pre-wrap break-words">
        {JSON.stringify(props, null, 2)}
      </pre>
    </div>
  );
}
