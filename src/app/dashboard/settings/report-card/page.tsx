import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import ReportCardSettingsClient from '@/components/ReportCardSettingsClient';

export default async function ReportCardSettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('users').select('school_id').eq('id', user!.id).single();
  const schoolId = profile!.school_id;

  const [{ data: settings }, { data: affective }, { data: psychomotor }, { data: comments }] = await Promise.all([
    supabase.from('report_card_settings').select('*').eq('school_id', schoolId).maybeSingle(),
    supabase.from('affective_traits').select('*').eq('school_id', schoolId).order('sequence'),
    supabase.from('psychomotor_skills').select('*').eq('school_id', schoolId).order('sequence'),
    supabase.from('comment_presets').select('*').eq('school_id', schoolId).order('sequence'),
  ]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/dashboard" className="hover:text-indigo">Dashboard</Link>
          <span className="text-gray-300">/</span>
          <Link href="/dashboard/settings" className="hover:text-indigo">Settings</Link>
          <span className="text-gray-300">/</span>
          <span>Report Card</span>
        </div>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Report card configuration</h1>
        <p className="text-gray-500 mt-1 text-sm">Choose what appears on printed report cards</p>
      </div>

      <ReportCardSettingsClient
        schoolId={schoolId}
        initialSettings={settings}
        initialAffective={affective || []}
        initialPsychomotor={psychomotor || []}
        initialComments={comments || []}
      />
    </div>
  );
}
