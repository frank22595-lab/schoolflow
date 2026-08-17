import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import AddParentForm from '@/components/AddParentForm';

export default async function NewParentPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('users').select('school_id').eq('id', user!.id).single();

  const { data: students } = await supabase
    .from('students').select('id, first_name, last_name, admission_number, current_section_id')
    .eq('school_id', profile!.school_id).is('deleted_at', null).order('last_name');

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/dashboard" className="hover:text-indigo">Dashboard</Link>
          <span className="text-gray-300">/</span>
          <Link href="/dashboard/parents" className="hover:text-indigo">Parents</Link>
          <span className="text-gray-300">/</span>
          <span>Add parent</span>
        </div>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Add parent / guardian</h1>
        <p className="text-gray-500 mt-1 text-sm">Add a parent and link them to one or more students</p>
      </div>

      <AddParentForm
        schoolId={profile!.school_id}
        students={students || []}
      />
    </div>
  );
}
