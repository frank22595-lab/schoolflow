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
  scores: Array<{
    subject_name: string;
    ca1?: number | null;
    ca2?: number | null;
    exam?: number | null;
    total?: number | null;
    grade?: string;
    remark?: string;
    position_in_subject?: number | null;
    class_avg?: number | null;
  }>;
  summary: {
    total_marks: number;
    average: number;
    overall_grade?: string;
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
  color: {
    primary: string;
    accent?: string;
  };
}
