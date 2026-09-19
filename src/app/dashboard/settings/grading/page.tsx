import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import Link from 'next/link';
import GradingSetupClient from '@/components/GradingSetupClient';

const admin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export default async function GradingSetupPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('users').select('school_id').eq('id', user!.id).single();
  const schoolId = profile!.school_id;

  const [{ data: scales }, { data: bands }, { data: assessments }, { data: subjects }, { data: classSubjects }, { data: classLevels }] = await Promise.all([
    admin.from('grade_scales').select('*').eq('school_id', schoolId).order('created_at'),
    admin.from('grade_bands').select('*').order('sequence'),
    admin.from('assessment_types').select('*').eq('school_id', schoolId).order('sequence'),
    admin.from('subjects').select('*').eq('school_id', schoolId).eq('is_active', true).order('sequence'),
    admin.from('class_subjects').select('*').eq('school_id', schoolId),
    admin.from('class_levels').select('*').eq('school_id', schoolId).order('sequence'),
  ]);

  const isEmpty = (scales?.length || 0) === 0 && (subjects?.length || 0) === 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/dashboard" className="hover:text-indigo">Dashboard</Link>
          <span className="text-gray-300">/</span>
          <Link href="/dashboard/settings" className="hover:text-indigo">Settings</Link>
          <span className="text-gray-300">/</span>
          <span>Grading</span>
        </div>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Grading system</h1>
        <p className="text-gray-500 mt-1 text-sm">
          {isEmpty ? "Let's set up your grading system in one click." : 'Configure grade scale, assessments, and subjects.'}
        </p>
      </div>

      <GradingSetupClient
        schoolId={schoolId}
        scales={scales || []}
        bands={bands || []}
        assessments={assessments || []}
        subjects={subjects || []}
        classSubjects={classSubjects || []}
        classLevels={classLevels || []}
        isEmpty={isEmpty}
      />
    </div>
  );
}
