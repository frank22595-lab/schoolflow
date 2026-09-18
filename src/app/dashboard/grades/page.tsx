import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import GradesPickClient from '@/components/GradesPickClient';

export default async function GradesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('users').select('school_id').eq('id', user!.id).single();
  const schoolId = profile!.school_id;

  const [
    { data: currentSession },
    { data: currentTerm },
    { data: terms },
    { data: sections },
    { data: classSubjects },
    { data: subjects },
    { data: recentScoreSessions },
  ] = await Promise.all([
    supabase.from('sessions').select('*').eq('school_id', schoolId).eq('is_current', true).maybeSingle(),
    supabase.from('terms').select('*').eq('school_id', schoolId).eq('is_current', true).maybeSingle(),
    supabase.from('terms').select('*, sessions(name)').eq('school_id', schoolId).order('start_date', { ascending: false }).limit(20),
    supabase.from('sections').select('*, classes(class_level_id, class_levels(id, name))').eq('school_id', schoolId).order('name'),
    supabase.from('class_subjects').select('*').eq('school_id', schoolId),
    supabase.from('subjects').select('*').eq('school_id', schoolId).eq('is_active', true).order('sequence'),
    supabase.from('score_sessions')
      .select('*, sections(name, classes(class_levels(name))), subjects(name), terms(name)')
      .eq('school_id', schoolId).order('updated_at', { ascending: false }).limit(8),
  ]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/dashboard" className="hover:text-indigo">Dashboard</Link>
          <span className="text-gray-300">/</span>
          <span>Grades & Results</span>
        </div>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Grades & Results</h1>
        <p className="text-gray-500 mt-1 text-sm">
          {currentTerm ? currentTerm.name : 'No current term set'}
          {currentSession && ` · ${currentSession.name}`}
        </p>
      </div>

      <GradesPickClient
        schoolId={schoolId}
        currentSession={currentSession}
        currentTerm={currentTerm}
        terms={terms || []}
        sections={sections || []}
        classSubjects={classSubjects || []}
        subjects={subjects || []}
        recentScoreSessions={recentScoreSessions || []}
      />
    </div>
  );
}
