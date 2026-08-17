import { createClient } from '@/lib/supabase/server';
import StaffListClient from '@/components/StaffListClient';

export default async function StaffPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('users').select('school_id').eq('id', user!.id).single();

  const { data: staff } = await supabase
    .from('staff').select('*').eq('school_id', profile!.school_id).is('deleted_at', null).order('created_at', { ascending: false });

  return (
    <StaffListClient
      schoolId={profile!.school_id}
      initialStaff={staff || []}
    />
  );
}
