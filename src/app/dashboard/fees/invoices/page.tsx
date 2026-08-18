import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import InvoicesListClient from '@/components/InvoicesListClient';

export default async function InvoicesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('users').select('school_id').eq('id', user!.id).single();
  const schoolId = profile!.school_id;

  const [{ data: invoices }, { data: sessions }, { data: terms }] = await Promise.all([
    supabase.from('invoices').select('*').eq('school_id', schoolId).order('invoice_date', { ascending: false }).limit(500),
    supabase.from('sessions').select('*').eq('school_id', schoolId).order('start_date', { ascending: false }),
    supabase.from('terms').select('*').eq('school_id', schoolId),
  ]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/dashboard" className="hover:text-indigo">Dashboard</Link>
          <span className="text-gray-300">/</span>
          <Link href="/dashboard/fees" className="hover:text-indigo">Fees</Link>
          <span className="text-gray-300">/</span>
          <span>Invoices</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Invoices</h1>
            <p className="text-gray-500 mt-1 text-sm">{invoices?.length || 0} invoice{invoices?.length !== 1 ? 's' : ''} total</p>
          </div>
          <Link href="/dashboard/fees/generate" className="btn-primary text-sm">
            Generate invoices
          </Link>
        </div>
      </div>

      <InvoicesListClient invoices={invoices || []} sessions={sessions || []} terms={terms || []} />
    </div>
  );
}
