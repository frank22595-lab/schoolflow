import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import MarkAttendanceClient from '@/components/MarkAttendanceClient';

export default async function MarkAttendancePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('users').select('school_id').eq('id', user!.id).single();

  const { data: session } = await supabase
    .from('attendance_sessions')
    .select('*, sections(*, classes(class_level_id, class_levels(name)))')
    .eq('id', id)
    .eq('school_id', profile!.school_id)
    .maybeSingle();

  if (!session) notFound();

  const { data: records } = await supabase
    .from('attendance_records')
    .select('*, students(id, first_name, middle_name, last_name, admission_number, photo_url, gender, medical_alert_flag)')
    .eq('attendance_session_id', id)
    .order('students(last_name)');

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/dashboard" className="hover:text-indigo">Dashboard</Link>
          <span className="text-gray-300">/</span>
          <Link href="/dashboard/attendance" className="hover:text-indigo">Attendance</Link>
          <span className="text-gray-300">/</span>
          <span>Mark</span>
        </div>
      </div>

      <MarkAttendanceClient
        session={session}
        initialRecords={records || []}
        schoolId={profile!.school_id}
      />
    </div>
  );
}
