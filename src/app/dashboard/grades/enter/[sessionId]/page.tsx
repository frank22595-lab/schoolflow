import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ScoreEntryClient from '@/components/ScoreEntryClient';

const admin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export default async function ScoreEntryPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('users').select('school_id').eq('id', user!.id).single();

  const { data: scoreSession } = await admin
    .from('score_sessions')
    .select('*, sections(name, full_name, classes(class_levels(name))), subjects(name, code), terms(name, sessions(name))')
    .eq('id', sessionId)
    .eq('school_id', profile!.school_id)
    .maybeSingle();

  if (!scoreSession) notFound();

  const [{ data: assessments }, { data: scores }, { data: bands }] = await Promise.all([
    admin.from('assessment_types').select('*').eq('school_id', profile!.school_id).eq('is_active', true).order('sequence'),
    admin.from('student_scores')
      .select('*, students(id, first_name, middle_name, last_name, admission_number, photo_url)')
      .eq('score_session_id', sessionId),
    admin.from('grade_bands')
      .select('*, grade_scales!inner(is_default, school_id)')
      .eq('grade_scales.is_default', true)
      .eq('grade_scales.school_id', profile!.school_id)
      .order('sequence'),
  ]);

  const sortedScores = (scores || []).sort((a: any, b: any) => {
    const nA = `${a.students?.last_name} ${a.students?.first_name}`.toLowerCase();
    const nB = `${b.students?.last_name} ${b.students?.first_name}`.toLowerCase();
    return nA.localeCompare(nB);
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      <div>
        <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/dashboard" className="hover:text-indigo">Dashboard</Link>
          <span className="text-gray-300">/</span>
          <Link href="/dashboard/grades" className="hover:text-indigo">Grades</Link>
          <span className="text-gray-300">/</span>
          <span>Enter scores</span>
        </div>
      </div>

      <ScoreEntryClient
        scoreSession={scoreSession}
        assessments={assessments || []}
        initialScores={sortedScores}
        gradeBands={bands || []}
      />
    </div>
  );
}