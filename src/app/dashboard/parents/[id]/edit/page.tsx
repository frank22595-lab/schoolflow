import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import EditParentForm from '@/components/EditParentForm';

export default async function EditParentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('users').select('school_id').eq('id', user!.id).single();

  const { data: parent } = await supabase.from('parents').select('*').eq('id', id).eq('school_id', profile!.school_id).maybeSingle();
  if (!parent) notFound();

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/dashboard" className="hover:text-indigo">Dashboard</Link>
          <span className="text-gray-300">/</span>
          <Link href="/dashboard/parents" className="hover:text-indigo">Parents</Link>
          <span className="text-gray-300">/</span>
          <Link href={`/dashboard/parents/${parent.id}`} className="hover:text-indigo">{parent.first_name} {parent.last_name}</Link>
          <span className="text-gray-300">/</span>
          <span>Edit</span>
        </div>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Edit parent</h1>
        <p className="text-gray-500 mt-1 text-sm">{parent.first_name} {parent.last_name}</p>
      </div>

      <EditParentForm parent={parent} />
    </div>
  );
}
