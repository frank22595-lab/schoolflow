import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import DashboardShell from '@/components/DashboardShell';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('users')
    .select('*, schools(*)')
    .eq('id', user.id)
    .single();

  const schoolId = profile?.school_id;
  let counts = { students: 0, staff: 0, parents: 0, unpaidInvoices: 0 };

  if (schoolId) {
    const [s, st, p, inv] = await Promise.all([
      supabase.from('students').select('id', { count: 'exact', head: true }).eq('school_id', schoolId).is('deleted_at', null),
      supabase.from('staff').select('id', { count: 'exact', head: true }).eq('school_id', schoolId).is('deleted_at', null),
      supabase.from('parents').select('id', { count: 'exact', head: true }).eq('school_id', schoolId),
      supabase.from('invoices').select('id', { count: 'exact', head: true }).eq('school_id', schoolId).in('status', ['unpaid', 'partial', 'overdue']),
    ]);
    counts = {
      students: s.count || 0,
      staff: st.count || 0,
      parents: p.count || 0,
      unpaidInvoices: inv.count || 0,
    };
  }

  return (
    <DashboardShell user={profile} school={profile?.schools} counts={counts}>
      {children}
    </DashboardShell>
  );
}
