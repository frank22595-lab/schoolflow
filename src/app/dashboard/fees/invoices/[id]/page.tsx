import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import InvoiceDetailClient from '@/components/InvoiceDetailClient';

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('users').select('school_id, schools(*)').eq('id', user!.id).single();

  const { data: invoice } = await supabase.from('invoices').select('*').eq('id', id).eq('school_id', profile!.school_id).maybeSingle();
  if (!invoice) notFound();

  const [{ data: lines }, { data: payments }, { data: banks }] = await Promise.all([
    supabase.from('invoice_lines').select('*').eq('invoice_id', id).order('sort_order'),
    supabase.from('payments').select('*').eq('invoice_id', id).eq('is_voided', false).order('payment_date', { ascending: false }),
    supabase.from('bank_accounts').select('*').eq('school_id', profile!.school_id).eq('is_active', true).eq('display_on_invoices', true),
  ]);

  const school = (profile as any)?.schools;

  return (
    <InvoiceDetailClient
      invoice={invoice}
      lines={lines || []}
      payments={payments || []}
      banks={banks || []}
      school={school}
      schoolId={profile!.school_id}
    />
  );
}
