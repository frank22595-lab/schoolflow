import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import AddStaffForm from '@/components/AddStaffForm';

export default async function NewStaffPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from('users').select('*, schools(short_code)').eq('id', user!.id).single();

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/dashboard" className="hover:text-indigo">Dashboard</Link>
          <span className="text-gray-300">/</span>
          <Link href="/dashboard/staff" className="hover:text-indigo">Staff</Link>
          <span className="text-gray-300">/</span>
          <span>Add staff</span>
        </div>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Add staff</h1>
        <p className="text-gray-500 mt-1 text-sm">Add a teacher, admin, or support staff member</p>
      </div>

      <AddStaffForm
        schoolId={profile!.school_id}
        schoolShortCode={profile?.schools?.short_code || 'SCH'}
      />
    </div>
  );
}
