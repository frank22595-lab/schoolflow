import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import BehaviorEntryClient from '@/components/BehaviorEntryClient';

const admin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export default async function BehaviorPage({ params }: { params: Promise<{ termId: string; sectionId: string; studentId: string }> }) {
  const { termId, sectionId, studentId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('users').select('school_id').eq('id', user!.id).single();
  const schoolId = profile!.school_id;

  const [{ data: student }, { data: term }, { data: affective }, { data: psychomotor }, { data: existing }, { data: settings }] = await Promise.all([
    admin.from('students').select('*').eq('id', studentId).eq('school_id', schoolId).maybeSingle(),
    admin.from('terms').select('*, sessions(name)').eq('id', termId).maybeSingle(),
    admin.from('affective_traits').select('*').eq('school_id', schoolId).eq('is_active', true).order('sequence'),
    admin.from('psychomotor_skills').select('*').eq('school_id', schoolId).eq('is_active', true).order('sequence'),
    admin.from('student_behavior').select('*').eq('student_id', studentId).eq('term_id', termId).maybeSingle(),
    admin.from('report_card_settings').select('*').eq('school_id', schoolId).maybeSingle(),
  ]);

  if (!student || !term) notFound();

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
      <div>
        <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/dashboard/grades" className="hover:text-indigo">Grades</Link>
          <span className="text-gray-300">/</span>
          <Link href={`/dashboard/grades/term/${termId}`} className="hover:text-indigo">{term.name}</Link>
          <span className="text-gray-300">/</span>
          <span>Behavior & Skills</span>
        </div>
      </div>

      <BehaviorEntryClient
        schoolId={schoolId}
        student={student}
        term={term}
        termId={termId}
        sectionId={sectionId}
        affective={affective || []}
        psychomotor={psychomotor || []}
        initial={existing}
        settings={settings}
      />
    </div>
  );
}
