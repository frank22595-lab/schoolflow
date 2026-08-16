import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import SubjectsClient from '@/components/SubjectsClient';

export default async function SubjectsSettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from('users').select('*, schools(*)').eq('id', user!.id).single();

  const schoolId = profile?.school_id;
  const levelsOffered: string[] = profile?.schools?.levels_offered || [];

  const [{ data: subjects }, { data: scales }, { data: boundaries }, { data: components }] = await Promise.all([
    supabase.from('subjects').select('*').eq('school_id', schoolId).order('name'),
    supabase.from('grading_scales').select('*').eq('school_id', schoolId).order('name'),
    supabase.from('grade_boundaries').select('*').eq('school_id', schoolId).order('sort_order'),
    supabase.from('assessment_components').select('*').eq('school_id', schoolId).order('sort_order'),
  ]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      <div>
        <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/dashboard" className="hover:text-indigo">Dashboard</Link>
          <span className="text-gray-300">/</span>
          <Link href="/dashboard/settings" className="hover:text-indigo">Settings</Link>
          <span className="text-gray-300">/</span>
          <span>Subjects & Grading</span>
        </div>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Subjects & Grading</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Define the subjects you teach, how you grade them, and what components make up each grade.
        </p>
      </div>

      <SubjectsClient
        schoolId={schoolId}
        levelsOffered={levelsOffered}
        initialSubjects={subjects || []}
        initialScales={scales || []}
        initialBoundaries={boundaries || []}
        initialComponents={components || []}
      />
    </div>
  );
}
