import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import TermDashboardClient from '@/components/TermDashboardClient';

export default async function TermDashboardPage({ params }: { params: Promise<{ termId: string }> }) {
  const { termId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('users').select('school_id').eq('id', user!.id).single();
  const schoolId = profile!.school_id;

  const { data: term } = await supabase.from('terms').select('*, sessions(name, id)')
    .eq('id', termId).eq('school_id', schoolId).maybeSingle();
  if (!term) notFound();

  const sessionId = term.session_id;

  const [
    { data: sections },
    { data: classSubjects },
    { data: subjects },
    { data: scoreSessions },
    { data: enrollments },
    { data: behaviors },
    { data: settings },
  ] = await Promise.all([
    supabase.from('sections').select('*, classes(class_level_id, class_levels(id, name, sequence))').eq('school_id', schoolId),
    supabase.from('class_subjects').select('*').eq('school_id', schoolId),
    supabase.from('subjects').select('*').eq('school_id', schoolId).eq('is_active', true).order('sequence'),
    supabase.from('score_sessions').select('*, student_scores(id, total_score, is_absent, grade)')
      .eq('school_id', schoolId).eq('term_id', termId),
    supabase.from('enrollments').select('student_id, section_id, students(deleted_at)')
      .eq('school_id', schoolId).eq('session_id', sessionId).eq('status', 'active'),
    supabase.from('student_behavior').select('student_id').eq('school_id', schoolId).eq('term_id', termId),
    supabase.from('report_card_settings').select('*').eq('school_id', schoolId).maybeSingle(),
  ]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/dashboard" className="hover:text-indigo">Dashboard</Link>
          <span className="text-gray-300">/</span>
          <Link href="/dashboard/grades" className="hover:text-indigo">Grades</Link>
          <span className="text-gray-300">/</span>
          <span>{term.name}</span>
        </div>
      </div>

      <TermDashboardClient
        schoolId={schoolId}
        term={term}
        sections={sections || []}
        classSubjects={classSubjects || []}
        subjects={subjects || []}
        scoreSessions={scoreSessions || []}
        enrollments={enrollments || []}
        behaviors={behaviors || []}
        settings={settings}
      />
    </div>
  );
}