import { createClient as createAdminClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

const admin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export default async function TestEnrollmentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('users').select('school_id').eq('id', user!.id).single();
  const schoolId = profile!.school_id;

  const { data: currentSession } = await supabase.from('sessions').select('*').eq('school_id', schoolId).eq('is_current', true).maybeSingle();

  const { data: enrollmentsAdmin } = await admin.from('enrollments').select('*')
    .eq('school_id', schoolId).eq('status', 'active');

  const { data: enrollmentsUser } = await supabase.from('enrollments').select('*')
    .eq('school_id', schoolId).eq('status', 'active');

  return (
    <div style={{ padding: 20, fontFamily: 'monospace', fontSize: 12 }}>
      <h1>Enrollments Debug</h1>
      <p><strong>School ID:</strong> {schoolId}</p>
      <p><strong>Current Session:</strong> {currentSession?.name} ({currentSession?.id})</p>
      <hr />
      <h2>Admin client fetch: {enrollmentsAdmin?.length || 0} rows</h2>
      <pre style={{ background: '#eee', padding: 10 }}>
        {JSON.stringify(enrollmentsAdmin, null, 2)}
      </pre>
      <hr />
      <h2>User client fetch: {enrollmentsUser?.length || 0} rows</h2>
      <pre style={{ background: '#eee', padding: 10 }}>
        {JSON.stringify(enrollmentsUser, null, 2)}
      </pre>
    </div>
  );
}