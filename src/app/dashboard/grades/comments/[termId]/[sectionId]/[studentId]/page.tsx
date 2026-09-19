import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import CommentsEntryClient from '@/components/CommentsEntryClient';

const admin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export default async function CommentsPage({ params }: { params: Promise<{ termId: string; sectionId: string; studentId: string }> }) {
  const { termId, sectionId, studentId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('users').select('school_id').eq('id', user!.id).single();
  const schoolId = profile!.school_id;

  const [{ data: student }, { data: term }, { data: existing }, { data: presets }, { data: scores }, { data: settings }] = await Promise.all([
    admin.from('students').select('*').eq('id', studentId).eq('school_id', schoolId).maybeSingle(),
    admin.from('terms').select('*, sessions(name)').eq('id', termId).maybeSingle(),
    admin.from('student_behavior').select('*').eq('student_id', studentId).eq('term_id', termId).maybeSingle(),
    admin.from('comment_presets').select('*').eq('school_id', schoolId).eq('is_active', true).order('sequence'),
    admin.from('score_sessions').select('id, student_scores!inner(total_score, is_absent)')
      .eq('school_id', schoolId).eq('term_id', termId),
    admin.from('report_card_settings').select('*').eq('school_id', schoolId).maybeSingle(),
  ]);

  if (!student || !term) notFound();

  // Calculate student's average across all subjects this term
  let studentAvg = 0;
  const totals: number[] = [];
  (scores || []).forEach((ss: any) => {
    (ss.student_scores || []).forEach((sc: any) => {
      if (!sc.is_absent && sc.total_score > 0) totals.push(sc.total_score);
    });
  });
  if (totals.length > 0) studentAvg = Math.round((totals.reduce((a, b) => a + b, 0) / totals.length) * 10) / 10;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
      <div>
        <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/dashboard/grades" className="hover:text-indigo">Grades</Link>
          <span className="text-gray-300">/</span>
          <Link href={`/dashboard/grades/term/${termId}`} className="hover:text-indigo">{term.name}</Link>
          <span className="text-gray-300">/</span>
          <span>Comments</span>
        </div>
      </div>

      <CommentsEntryClient
        schoolId={schoolId}
        student={student}
        term={term}
        termId={termId}
        initial={existing}
        presets={presets || []}
        studentAvg={studentAvg}
        settings={settings}
      />
    </div>
  );
}
