import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import GenerateInvoicesClient from '@/components/GenerateInvoicesClient';

export default async function GenerateInvoicesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('users').select('school_id').eq('id', user!.id).single();
  const schoolId = profile!.school_id;

  const [{ data: sessions }, { data: terms }, { data: classLevels }, { data: structuresCount }] = await Promise.all([
    supabase.from('sessions').select('*').eq('school_id', schoolId).order('start_date', { ascending: false }),
    supabase.from('terms').select('*').eq('school_id', schoolId),
    supabase.from('class_levels').select('*').eq('school_id', schoolId).order('sequence'),
    supabase.from('fee_structures').select('id', { count: 'exact' }).eq('school_id', schoolId),
  ]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/dashboard" className="hover:text-indigo">Dashboard</Link>
          <span className="text-gray-300">/</span>
          <Link href="/dashboard/fees" className="hover:text-indigo">Fees</Link>
          <span className="text-gray-300">/</span>
          <span>Generate invoices</span>
        </div>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Generate invoices</h1>
        <p className="text-gray-500 mt-1 text-sm">Create term invoices for all students at once</p>
      </div>

      <GenerateInvoicesClient
        schoolId={schoolId}
        sessions={sessions || []}
        terms={terms || []}
        classLevels={classLevels || []}
        structuresCount={structuresCount?.length || 0}
      />
    </div>
  );
}
