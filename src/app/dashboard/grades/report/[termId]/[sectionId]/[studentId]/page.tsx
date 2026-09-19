import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Download } from 'lucide-react';
import PrintButton from '@/components/PrintButton';
import { buildReportCardProps } from '@/lib/reportData';
import { getReportTemplate } from '@/components/report-templates';

const admin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export default async function IndividualReportPage({ params }: { params: Promise<{ termId: string; sectionId: string; studentId: string }> }) {
  const { termId, sectionId, studentId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('users').select('school_id').eq('id', user!.id).single();
  const schoolId = profile!.school_id;

  const reportProps = await buildReportCardProps(admin, { schoolId, termId, sectionId, studentId });
  if (!reportProps) notFound();

  const Template = getReportTemplate(reportProps.settings?.template_key);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6 print:p-0 print:max-w-full">
      <div className="flex items-center justify-between gap-3 print:hidden">
        <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500">
          <Link href="/dashboard/grades" className="hover:text-indigo">Grades</Link>
          <span className="text-gray-300">/</span>
          <Link href={`/dashboard/grades/report/${termId}/${sectionId}`} className="hover:text-indigo">Broadsheet</Link>
          <span className="text-gray-300">/</span>
          <span>{reportProps.student.first_name} {reportProps.student.last_name}</span>
        </div>
        <Link href={`/dashboard/grades/report/${termId}/${sectionId}`} className="sm:hidden flex items-center gap-1 text-sm text-indigo">
          <ArrowLeft className="w-4 h-4" />Back
        </Link>
        <div className="flex items-center gap-2">
          <PrintButton label="Print" />
          <PrintButton label="Download PDF" className="btn-primary text-sm" />
        </div>
      </div>

      <Template {...reportProps} />
    </div>
  );
}
