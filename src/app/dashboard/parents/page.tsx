import { createClient } from '@/lib/supabase/server';
import ParentsListClient from '@/components/ParentsListClient';

export default async function ParentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('users').select('school_id').eq('id', user!.id).single();

  const [{ data: parents }, { data: links }] = await Promise.all([
    supabase.from('parents').select('*').eq('school_id', profile!.school_id).order('created_at', { ascending: false }),
    supabase.from('student_parents').select('parent_id, student_id, relationship, is_primary_contact, students(first_name, last_name, admission_number)').eq('school_id', profile!.school_id),
  ]);

  return (
    <ParentsListClient
      schoolId={profile!.school_id}
      initialParents={parents || []}
      links={links || []}
    />
  );
}
