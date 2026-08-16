import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import AddStudentForm from '@/components/AddStudentForm';

export default async function NewStudentPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from('users').select('*, schools(*)').eq('id', user!.id).single();

  const schoolId = profile?.school_id;

  const [{ data: sections }, { data: classes }, { data: classLevels }, { data: houses }, { data: currentSession }] = await Promise.all([
    supabase.from('sections').select('*').eq('school_id', schoolId),
    supabase.from('classes').select('*').eq('school_id', schoolId),
    supabase.from('class_levels').select('*').eq('school_id', schoolId).order('sequence'),
    supabase.from('houses').select('*').eq('school_id', schoolId).order('name'),
    supabase.from('sessions').select('*').eq('school_id', schoolId).eq('is_current', true).maybeSingle(),
  ]);

  const { data: shortCodeRow } = await supabase.from('schools').select('short_code').eq('id', schoolId).single();

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/dashboard" className="hover:text-indigo">Dashboard</Link>
          <span className="text-gray-300">/</span>
          <Link href="/dashboard/students" className="hover:text-indigo">Students</Link>
          <span className="text-gray-300">/</span>
          <span>Add student</span>
        </div>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Add student</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Enter the student's details. You can add parents and health info now or edit later.
        </p>
      </div>

      <AddStudentForm
        schoolId={schoolId}
        sections={sections || []}
        classes={classes || []}
        classLevels={classLevels || []}
        houses={houses || []}
        currentSession={currentSession}
        schoolShortCode={shortCodeRow?.short_code || 'SCH'}
      />
    </div>
  );
}
