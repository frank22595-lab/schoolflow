import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import EditStaffForm from '@/components/EditStaffForm';

export default async function EditStaffPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('users').select('school_id').eq('id', user!.id).single();

  const { data: staff } = await supabase.from('staff').select('*').eq('id', id).eq('school_id', profile!.school_id).maybeSingle();
  if (!staff) notFound();

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/dashboard" className="hover:text-indigo">Dashboard</Link>
          <span className="text-gray-300">/</span>
          <Link href="/dashboard/staff" className="hover:text-indigo">Staff</Link>
          <span className="text-gray-300">/</span>
          <Link href={`/dashboard/staff/${staff.id}`} className="hover:text-indigo">{staff.first_name} {staff.last_name}</Link>
          <span className="text-gray-300">/</span>
          <span>Edit</span>
        </div>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Edit staff</h1>
        <p className="text-gray-500 mt-1 text-sm">{staff.staff_number} · {staff.first_name} {staff.last_name}</p>
      </div>

      <EditStaffForm staff={staff} />
    </div>
  );
}
