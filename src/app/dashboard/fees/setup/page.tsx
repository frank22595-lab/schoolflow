import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import FeesSetupClient from '@/components/FeesSetupClient';

export default async function FeesSetupPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('users').select('school_id').eq('id', user!.id).single();
  const schoolId = profile!.school_id;

  const [
    { data: feeHeads },
    { data: structures },
    { data: discounts },
    { data: banks },
    { data: sessions },
    { data: terms },
    { data: classLevels },
  ] = await Promise.all([
    supabase.from('fee_heads').select('*').eq('school_id', schoolId).order('sort_order'),
    supabase.from('fee_structures').select('*').eq('school_id', schoolId),
    supabase.from('discounts').select('*').eq('school_id', schoolId).order('name'),
    supabase.from('bank_accounts').select('*').eq('school_id', schoolId).order('bank_name'),
    supabase.from('sessions').select('*').eq('school_id', schoolId).order('start_date', { ascending: false }),
    supabase.from('terms').select('*').eq('school_id', schoolId).order('sequence'),
    supabase.from('class_levels').select('*').eq('school_id', schoolId).order('sequence'),
  ]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      <div>
        <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/dashboard" className="hover:text-indigo">Dashboard</Link>
          <span className="text-gray-300">/</span>
          <Link href="/dashboard/fees" className="hover:text-indigo">Fees</Link>
          <span className="text-gray-300">/</span>
          <span>Setup</span>
        </div>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Fee setup</h1>
        <p className="text-gray-500 mt-1 text-sm">Configure fee heads, structures per class, discounts, and bank accounts</p>
      </div>

      <FeesSetupClient
        schoolId={schoolId}
        initialFeeHeads={feeHeads || []}
        initialStructures={structures || []}
        initialDiscounts={discounts || []}
        initialBanks={banks || []}
        sessions={sessions || []}
        terms={terms || []}
        classLevels={classLevels || []}
      />
    </div>
  );
}
