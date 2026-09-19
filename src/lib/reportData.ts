import type { SupabaseClient } from '@supabase/supabase-js';
import type { ReportTemplateProps } from '@/components/report-templates';

interface BuildArgs {
  schoolId: string;
  termId: string;
  sectionId: string;
  studentId: string;
}

// Assembles everything a report-card template needs for one student, one term.
// Used by the individual report page. Uses the admin client throughout (RLS bypass),
// consistent with the rest of the grades pipeline.
export async function buildReportCardProps(admin: SupabaseClient, { schoolId, termId, sectionId, studentId }: BuildArgs): Promise<ReportTemplateProps | null> {
  const [
    { data: schoolRow },
    { data: settings },
    { data: student },
    { data: section },
    { data: term },
    { data: scoreSessions },
    { data: behavior },
    { data: affectiveTraits },
    { data: psychomotorSkills },
    { data: gradeBands },
    { data: assessmentTypes },
  ] = await Promise.all([
    admin.from('schools').select('name, address, phone, email, logo_url, motto').eq('id', schoolId).single(),
    admin.from('report_card_settings').select('*').eq('school_id', schoolId).maybeSingle(),
    admin.from('students').select('first_name, middle_name, last_name, admission_number, photo_url, gender, date_of_birth, house_id, houses(name)').eq('id', studentId).maybeSingle(),
    admin.from('sections').select('name, full_name, section_teacher_id, classes(class_level_id, class_levels(id, name))').eq('id', sectionId).maybeSingle(),
    admin.from('terms').select('name, sequence, session_id, sessions(name)').eq('id', termId).maybeSingle(),
    admin.from('score_sessions').select('id, subject_id, subjects(name), student_scores(student_id, scores, total_score, grade, grade_remark, is_absent)')
      .eq('school_id', schoolId).eq('section_id', sectionId).eq('term_id', termId),
    admin.from('student_behavior').select('*').eq('student_id', studentId).eq('term_id', termId).maybeSingle(),
    admin.from('affective_traits').select('name, sequence').eq('school_id', schoolId).eq('is_active', true).order('sequence'),
    admin.from('psychomotor_skills').select('name, sequence').eq('school_id', schoolId).eq('is_active', true).order('sequence'),
    admin.from('grade_bands').select('*, grade_scales!inner(is_default, school_id)')
      .eq('grade_scales.is_default', true).eq('grade_scales.school_id', schoolId).order('sequence'),
    admin.from('assessment_types').select('short_code, is_exam, sequence').eq('school_id', schoolId).eq('is_active', true).order('sequence'),
  ]);

  if (!student || !section || !term) return null;

  const classLevelId: string | undefined = (section as any).classes?.class_level_id;
  const classLevelName: string = (section as any).classes?.class_levels?.name || section.name;

  const [
    { data: colorRow },
    { data: teacher },
    { data: allTermsInSession },
    { data: activeEnrollments },
  ] = await Promise.all([
    classLevelId
      ? admin.from('class_level_report_style').select('primary_color, accent_color').eq('school_id', schoolId).eq('class_level_id', classLevelId).maybeSingle()
      : Promise.resolve({ data: null }),
    (section as any).section_teacher_id
      ? admin.from('users').select('display_name, first_name, last_name').eq('id', (section as any).section_teacher_id).maybeSingle()
      : Promise.resolve({ data: null }),
    admin.from('terms').select('id, sequence').eq('session_id', (term as any).session_id).order('sequence'),
    admin.from('enrollments').select('student_id', { count: 'exact', head: true })
      .eq('section_id', sectionId).eq('session_id', (term as any).session_id).eq('status', 'active'),
  ]);

  // ---- Assessment short-codes: best-effort map onto ca1/ca2/exam ----
  const examCode = (assessmentTypes || []).find((a: any) => a.is_exam)?.short_code;
  const caCodes = (assessmentTypes || []).filter((a: any) => !a.is_exam).map((a: any) => a.short_code);

  // ---- Scores + positions/class-avg per subject (via RPCs) ----
  const scores = await Promise.all((scoreSessions || []).map(async (ss: any) => {
    const row = (ss.student_scores || []).find((r: any) => r.student_id === studentId);
    const [{ data: position }, { data: classAvg }] = await Promise.all([
      admin.rpc('calculate_subject_position', { score_session_id: ss.id, student_id: studentId }),
      admin.rpc('calculate_class_avg_for_subject', { score_session_id: ss.id }),
    ]);
    const rawScores = row?.scores || {};
    return {
      subject_name: ss.subjects?.name || 'Subject',
      ca1: caCodes[0] ? (rawScores[caCodes[0]] ?? null) : null,
      ca2: caCodes[1] ? (rawScores[caCodes[1]] ?? null) : null,
      exam: examCode ? (rawScores[examCode] ?? null) : null,
      total: row?.total_score || 0,
      grade: row?.grade || null,
      remark: row?.grade_remark || null,
      position_in_subject: position ?? null,
      class_avg: classAvg ?? null,
    };
  }));
  scores.sort((a, b) => a.subject_name.localeCompare(b.subject_name));

  // ---- Summary ----
  const scoredTotals = (scoreSessions || [])
    .map((ss: any) => (ss.student_scores || []).find((r: any) => r.student_id === studentId))
    .filter((r: any) => r && !r.is_absent && (r.total_score || 0) > 0);
  const totalMarks = scoredTotals.reduce((sum: number, r: any) => sum + Number(r.total_score), 0);
  const average = scoredTotals.length > 0 ? Math.round((totalMarks / scoredTotals.length) * 100) / 100 : 0;
  const overallGrade = (gradeBands || []).find((b: any) => average >= Number(b.min_score) && average <= Number(b.max_score));

  const { data: positionInClass } = await admin.rpc('calculate_class_position', {
    section_id: sectionId, term_id: termId, student_id: studentId,
  });

  // ---- Behavior ----
  const affectiveRatings = (behavior as any)?.affective || {};
  const psychomotorRatings = (behavior as any)?.psychomotor || {};

  // ---- Attendance (this term) ----
  const { data: attendanceRows } = await admin.from('attendance_records')
    .select('status, attendance_sessions!inner(term_id)')
    .eq('student_id', studentId)
    .eq('attendance_sessions.term_id', termId);
  const totalDays = (attendanceRows || []).length;
  const present = (attendanceRows || []).filter((r: any) => r.status === 'present').length;
  const late = (attendanceRows || []).filter((r: any) => r.status === 'late').length;
  const absent = (attendanceRows || []).filter((r: any) => r.status === 'absent').length;
  const rate = totalDays > 0 ? Math.round(((present + late) / totalDays) * 100) : 0;

  // ---- Cumulative (per-term average across the session, up to this term) ----
  const termIds = (allTermsInSession || []).map((t: any) => t.id);
  const { data: cumulativeRows } = termIds.length > 0
    ? await admin.from('student_scores')
        .select('total_score, is_absent, score_sessions!inner(term_id)')
        .eq('student_id', studentId)
        .in('score_sessions.term_id', termIds)
    : { data: [] as any[] };

  const avgByTermId: Record<string, number> = {};
  for (const t of allTermsInSession || []) {
    const rows = (cumulativeRows || []).filter((r: any) => r.score_sessions?.term_id === t.id && !r.is_absent && (r.total_score || 0) > 0);
    if (rows.length > 0) {
      avgByTermId[t.id] = Math.round((rows.reduce((s: number, r: any) => s + Number(r.total_score), 0) / rows.length) * 100) / 100;
    }
  }
  const orderedTerms = [...(allTermsInSession || [])].sort((a: any, b: any) => a.sequence - b.sequence);
  const currentSeq = (term as any).sequence;
  const avgsSoFar = orderedTerms.filter((t: any) => t.sequence <= currentSeq && avgByTermId[t.id] !== undefined).map((t: any) => avgByTermId[t.id]);
  const cumulativeAvg = avgsSoFar.length > 0 ? Math.round((avgsSoFar.reduce((a, b) => a + b, 0) / avgsSoFar.length) * 100) / 100 : null;

  const settingsRow = settings || {};
  const teacherName = (teacher as any)?.display_name || ((teacher as any) ? `${(teacher as any).first_name} ${(teacher as any).last_name}` : null);

  return {
    school: {
      name: (schoolRow as any)?.name || 'School',
      address: (schoolRow as any)?.address || null,
      phone: (schoolRow as any)?.phone || null,
      email: (schoolRow as any)?.email || null,
      logo_url: (settingsRow as any).logo_url || (schoolRow as any)?.logo_url || null,
      motto: (schoolRow as any)?.motto || null,
      principal_name: (settingsRow as any).principal_name || null,
      principal_signature_url: (settingsRow as any).principal_signature_url || null,
      stamp_url: (settingsRow as any).stamp_url || null,
    },
    student: {
      first_name: (student as any).first_name,
      middle_name: (student as any).middle_name || null,
      last_name: (student as any).last_name,
      admission_number: (student as any).admission_number,
      photo_url: (student as any).photo_url || null,
      gender: (student as any).gender || null,
      date_of_birth: (student as any).date_of_birth || null,
      house: (student as any).houses?.name || null,
    },
    section: {
      name: (section as any).name,
      full_name: (section as any).full_name || null,
      class_level_name: classLevelName,
      class_level_id: classLevelId || '',
    },
    term: {
      name: (term as any).name,
      session_name: (term as any).sessions?.name || '',
      next_term_begins: (settingsRow as any).next_term_begins || null,
    },
    scores,
    summary: {
      total_marks: totalMarks,
      average,
      overall_grade: overallGrade?.grade || null,
      position_in_class: positionInClass ?? null,
      students_in_class: (activeEnrollments as any)?.count ?? null,
    },
    behavior: {
      affective: (affectiveTraits || []).map((t: any) => ({ name: t.name, rating: affectiveRatings[t.name] ?? null })),
      psychomotor: (psychomotorSkills || []).map((s: any) => ({ name: s.name, rating: psychomotorRatings[s.name] ?? null })),
    },
    comments: {
      teacher_comment: (behavior as any)?.teacher_comment || null,
      teacher_name: teacherName,
      principal_comment: (behavior as any)?.principal_comment || null,
    },
    attendance: {
      present, absent, late, total_days: totalDays, rate_percent: rate,
    },
    cumulative: {
      term1_avg: orderedTerms[0] ? (avgByTermId[orderedTerms[0].id] ?? null) : null,
      term2_avg: orderedTerms[1] ? (avgByTermId[orderedTerms[1].id] ?? null) : null,
      term3_avg: orderedTerms[2] ? (avgByTermId[orderedTerms[2].id] ?? null) : null,
      cumulative_avg: cumulativeAvg,
    },
    grade_scale: (gradeBands || []).map((b: any) => ({
      grade: b.grade, min: Number(b.min_score), max: Number(b.max_score), remark: b.remark || null,
    })),
    settings: settingsRow,
    color: {
      primary: (colorRow as any)?.primary_color || '#4F46E5',
      accent: (colorRow as any)?.accent_color || null,
    },
  };
}
