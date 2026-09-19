import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, FileStack } from 'lucide-react';
import PrintButton from '@/components/PrintButton';

const admin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export default async function BroadsheetPage({ params }: { params: Promise<{ termId: string; sectionId: string }> }) {
  const { termId, sectionId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('users').select('school_id').eq('id', user!.id).single();
  const schoolId = profile!.school_id;

  const [{ data: term }, { data: section }] = await Promise.all([
    admin.from('terms').select('id, name, session_id, sessions(name)').eq('id', termId).eq('school_id', schoolId).maybeSingle(),
    admin.from('sections').select('id, name, full_name, classes(class_level_id, class_levels(id, name))').eq('id', sectionId).eq('school_id', schoolId).maybeSingle(),
  ]);
  if (!term || !section) notFound();

  const classLevelId = (section as any).classes?.class_level_id;
  const className = (section as any).classes?.class_levels?.name || section.name;
  const sectionLabel = section.full_name || `${className} ${section.name}`;

  const [{ data: classSubjects }, { data: scoreSessions }, { data: enrollments }, { data: gradeBands }] = await Promise.all([
    classLevelId
      ? admin.from('class_subjects').select('subject_id, subjects(id, name, sequence)').eq('school_id', schoolId).eq('class_level_id', classLevelId)
      : Promise.resolve({ data: [] }),
    admin.from('score_sessions').select('id, subject_id, subjects(name), student_scores(student_id, total_score, grade, is_absent)')
      .eq('school_id', schoolId).eq('section_id', sectionId).eq('term_id', termId),
    admin.from('enrollments').select('student_id, students!enrollments_student_id_fkey(id, first_name, last_name, admission_number, photo_url, deleted_at)')
      .eq('school_id', schoolId).eq('section_id', sectionId).eq('session_id', (term as any).session_id).eq('status', 'active'),
    admin.from('grade_bands').select('*, grade_scales!inner(is_default, school_id)')
      .eq('grade_scales.is_default', true).eq('grade_scales.school_id', schoolId).order('sequence'),
  ]);

  const subjects = ((classSubjects || []) as any[])
    .map(cs => cs.subjects)
    .filter(Boolean)
    .sort((a: any, b: any) => (a.sequence || 0) - (b.sequence || 0));

  const students = ((enrollments || []) as any[])
    .map(e => e.students)
    .filter((s: any) => s && !s.deleted_at)
    .sort((a: any, b: any) => `${a.last_name} ${a.first_name}`.localeCompare(`${b.last_name} ${b.first_name}`));

  // subject_id -> student_id -> { total, grade }
  const scoresBySubject: Record<string, Record<string, { total: number; grade: string | null; is_absent: boolean }>> = {};
  for (const ss of (scoreSessions || []) as any[]) {
    const map: Record<string, { total: number; grade: string | null; is_absent: boolean }> = {};
    for (const row of ss.student_scores || []) {
      map[row.student_id] = { total: Number(row.total_score) || 0, grade: row.grade, is_absent: row.is_absent };
    }
    scoresBySubject[ss.subject_id] = map;
  }

  const rows = students.map((s: any) => {
    let totalMarks = 0;
    let scoredCount = 0;
    for (const subj of subjects) {
      const cell = scoresBySubject[subj.id]?.[s.id];
      if (cell && !cell.is_absent && cell.total > 0) {
        totalMarks += cell.total;
        scoredCount += 1;
      }
    }
    const average = scoredCount > 0 ? Math.round((totalMarks / scoredCount) * 100) / 100 : 0;
    const overallGrade = (gradeBands || []).find((b: any) => average >= Number(b.min_score) && average <= Number(b.max_score));
    return { student: s, totalMarks, average, grade: overallGrade?.grade || '—' };
  });

  // Rank by average, descending, ties share rank (matches calculate_class_position)
  const ranked = [...rows].filter(r => r.average > 0).sort((a, b) => b.average - a.average);
  const positionByStudent: Record<string, number> = {};
  ranked.forEach((r, i) => {
    if (i > 0 && ranked[i - 1].average === r.average) {
      positionByStudent[r.student.id] = positionByStudent[ranked[i - 1].student.id];
    } else {
      positionByStudent[r.student.id] = i + 1;
    }
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6 print:p-0 print:max-w-full">
      <div className="print:hidden">
        <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/dashboard/grades" className="hover:text-indigo">Grades</Link>
          <span className="text-gray-300">/</span>
          <Link href={`/dashboard/grades/term/${termId}`} className="hover:text-indigo">{term.name}</Link>
          <span className="text-gray-300">/</span>
          <span>Broadsheet</span>
        </div>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">{sectionLabel} broadsheet</h1>
            <p className="text-gray-500 mt-1 text-sm">{term.name} · {(term as any).sessions?.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/dashboard/grades/term/${termId}`} className="btn-secondary text-sm">
              <ArrowLeft className="w-4 h-4 mr-1.5" />Back
            </Link>
            <PrintButton label="Print broadsheet" />
            <Link href={`/dashboard/grades/report/${termId}/${sectionId}/print-all`} className="btn-primary text-sm">
              <FileStack className="w-4 h-4 mr-1.5" />
              Print all report cards
            </Link>
          </div>
        </div>
      </div>

      <div className="hidden print:block text-center mb-4">
        <h1 className="text-lg font-bold">{sectionLabel} — {term.name} Broadsheet</h1>
        <p className="text-xs text-gray-600">{(term as any).sessions?.name}</p>
      </div>

      {students.length === 0 ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center text-sm text-amber-800">
          No students enrolled in this class.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto print:border-0 print:shadow-none print:rounded-none">
          <table className="w-full text-xs print:text-[9px] landscape-print">
            <thead className="bg-gray-50 print:bg-transparent">
              <tr className="text-left border-b border-gray-200">
                <th className="px-3 py-2 font-semibold sticky left-0 bg-gray-50 print:static print:bg-transparent">Student</th>
                {subjects.map((subj: any) => (
                  <th key={subj.id} className="px-2 py-2 font-semibold text-center whitespace-nowrap">{subj.name}</th>
                ))}
                <th className="px-2 py-2 font-semibold text-center">Total</th>
                <th className="px-2 py-2 font-semibold text-center">Avg</th>
                <th className="px-2 py-2 font-semibold text-center">Grade</th>
                <th className="px-2 py-2 font-semibold text-center">Position</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map(({ student, totalMarks, average, grade }) => (
                <tr key={student.id} className="hover:bg-gray-50 print:hover:bg-transparent">
                  <td className="px-3 py-2 sticky left-0 bg-white print:static">
                    <Link href={`/dashboard/grades/report/${termId}/${sectionId}/${student.id}`}
                      className="font-medium text-gray-900 hover:text-indigo print:text-black print:no-underline">
                      {student.first_name} {student.last_name}
                    </Link>
                    <div className="text-[10px] text-gray-500 font-mono">{student.admission_number}</div>
                  </td>
                  {subjects.map((subj: any) => {
                    const cell = scoresBySubject[subj.id]?.[student.id];
                    return (
                      <td key={subj.id} className="px-2 py-2 text-center">
                        {cell?.is_absent ? '—' : (cell ? cell.total : '—')}
                      </td>
                    );
                  })}
                  <td className="px-2 py-2 text-center font-semibold">{totalMarks || '—'}</td>
                  <td className="px-2 py-2 text-center font-semibold">{average || '—'}</td>
                  <td className="px-2 py-2 text-center">{grade}</td>
                  <td className="px-2 py-2 text-center">{positionByStudent[student.id] || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <style>{`
        @media print {
          @page { size: A4 landscape; margin: 12mm; }
        }
      `}</style>
    </div>
  );
}
