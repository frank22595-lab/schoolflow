import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import PrintButton from '@/components/PrintButton';
import { buildReportCardProps } from '@/lib/reportData';
import { getReportTemplate } from '@/components/report-templates';

const admin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export default async function PrintAllReportsPage({ params }: { params: Promise<{ termId: string; sectionId: string }> }) {
  const { termId, sectionId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('users').select('school_id').eq('id', user!.id).single();
  const schoolId = profile!.school_id;

  const { data: term } = await admin.from('terms').select('id, session_id').eq('id', termId).eq('school_id', schoolId).maybeSingle();
  if (!term) notFound();

  const { data: enrollments } = await admin.from('enrollments')
    .select('student_id, students!enrollments_student_id_fkey(id, first_name, last_name, deleted_at)')
    .eq('school_id', schoolId).eq('section_id', sectionId).eq('session_id', term.session_id).eq('status', 'active');

  const students = ((enrollments || []) as any[])
    .map(e => e.students)
    .filter((s: any) => s && !s.deleted_at)
    .sort((a: any, b: any) => `${a.last_name} ${a.first_name}`.localeCompare(`${b.last_name} ${b.first_name}`));

  const reports = (await Promise.all(
    students.map((s: any) => buildReportCardProps(admin, { schoolId, termId, sectionId, studentId: s.id }))
  )).filter(Boolean) as NonNullable<Awaited<ReturnType<typeof buildReportCardProps>>>[];

  return (
    <div className="print:p-0">
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto flex items-center justify-between gap-3 print:hidden">
        <Link href={`/dashboard/grades/report/${termId}/${sectionId}`} className="flex items-center gap-1 text-sm text-indigo">
          <ArrowLeft className="w-4 h-4" />Back to broadsheet
        </Link>
        <PrintButton label={`Print all ${reports.length} report cards`} className="btn-primary text-sm" />
      </div>

      {reports.length === 0 ? (
        <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center text-sm text-amber-800">
            No students enrolled in this class.
          </div>
        </div>
      ) : (
        reports.map((report, i) => {
          const Template = getReportTemplate(report.settings?.template_key);
          return (
            <div key={i} className={`p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto ${i > 0 ? 'report-page-break' : ''}`}>
              <Template {...report} />
            </div>
          );
        })
      )}

      <style>{`
        @media print {
          .report-page-break { break-before: page; page-break-before: always; }
        }
      `}</style>
    </div>
  );
}
