import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import ClassesClient from '@/components/ClassesClient';

export default async function ClassesSettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from('users').select('*, schools(*)').eq('id', user!.id).single();

  const schoolId = profile?.school_id;
  const levelsOffered: string[] = profile?.schools?.levels_offered || [];

  const [{ data: classLevels }, { data: currentSession }, { data: classes }, { data: sections }, { data: houses }] = await Promise.all([
    supabase.from('class_levels').select('*').eq('school_id', schoolId).order('sequence', { ascending: true }),
    supabase.from('sessions').select('*').eq('school_id', schoolId).eq('is_current', true).maybeSingle(),
    supabase.from('classes').select('*').eq('school_id', schoolId),
    supabase.from('sections').select('*').eq('school_id', schoolId),
    supabase.from('houses').select('*').eq('school_id', schoolId).order('name'),
  ]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      <div>
        <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/dashboard" className="hover:text-indigo">Dashboard</Link>
          <span className="text-gray-300">/</span>
          <Link href="/dashboard/settings" className="hover:text-indigo">Settings</Link>
          <span className="text-gray-300">/</span>
          <span>Classes & Sections</span>
        </div>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Classes & Sections</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Set up class levels, arms, and houses. This structure powers enrollment, attendance, and grading.
        </p>
      </div>

      <ClassesClient
        schoolId={schoolId}
        levelsOffered={levelsOffered}
        initialClassLevels={classLevels || []}
        currentSession={currentSession}
        initialClasses={classes || []}
        initialSections={sections || []}
        initialHouses={houses || []}
      />
    </div>
  );
}
