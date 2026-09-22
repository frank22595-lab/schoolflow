import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import Link from 'next/link';
import ReportCardDesignerClient from '@/components/ReportCardDesignerClient';

const admin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export default async function ReportCardDesignerPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('users').select('school_id').eq('id', user!.id).single();
  const schoolId = profile!.school_id;

  const [{ data: settings }, { data: classLevels }, { data: school }] = await Promise.all([
    admin.from('report_card_settings').select('*').eq('school_id', schoolId).maybeSingle(),
    admin.from('class_levels').select('id, name, sequence').eq('school_id', schoolId).order('sequence'),
    admin.from('schools').select('name, address, phone, email, logo_url, motto').eq('id', schoolId).single(),
  ]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/dashboard" className="hover:text-indigo">Dashboard</Link>
          <span className="text-gray-300">/</span>
          <Link href="/dashboard/settings" className="hover:text-indigo">Settings</Link>
          <span className="text-gray-300">/</span>
          <span>Report Card Designer</span>
        </div>
      </div>

      <ReportCardDesignerClient
        schoolId={schoolId}
        initialSettings={settings}
        classLevels={classLevels || []}
        school={school}
      />
    </div>
  );
}
