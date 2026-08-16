import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import StudentsListClient from '@/components/StudentsListClient';

export default async function StudentsPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from('users').select('*, schools(*)').eq('id', user!.id).single();
  const schoolId = profile?.school_id;

  const [
    { data: students },
    { data: sections },
    { data: classes },
    { data: classLevels },
    { data: houses },
    { data: currentSession },
  ] = await Promise.all([
    supabase.from('students').select('*').eq('school_id', schoolId).is('deleted_at', null).order('created_at', { ascending: false }),
    supabase.from('sections').select('*').eq('school_id', schoolId),
    supabase.from('classes').select('*').eq('school_id', schoolId),
    supabase.from('class_levels').select('*').eq('school_id', schoolId).order('sequence'),
    supabase.from('houses').select('*').eq('school_id', schoolId),
    supabase.from('sessions').select('*').eq('school_id', schoolId).eq('is_current', true).maybeSingle(),
  ]);

  return (
    <StudentsListClient
      schoolId={schoolId}
      initialStudents={students || []}
      sections={sections || []}
      classes={classes || []}
      classLevels={classLevels || []}
      houses={houses || []}
      currentSession={currentSession}
    />
  );
}
