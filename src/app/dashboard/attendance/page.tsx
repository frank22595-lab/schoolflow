import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import AttendancePickerClient from '@/components/AttendancePickerClient';

export default async function AttendancePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('users').select('school_id').eq('id', user!.id).single();
  const schoolId = profile!.school_id;

  const [{ data: currentSession }, { data: currentTerm }, { data: sections }, { data: recentSessions }] = await Promise.all([
    supabase.from('sessions').select('*').eq('school_id', schoolId).eq('is_current', true).maybeSingle(),
    supabase.from('terms').select('*').eq('school_id', schoolId).eq('is_current', true).maybeSingle(),
    supabase.from('sections').select('*, classes(class_level_id, class_levels(*))').eq('school_id', schoolId).order('name'),
    supabase.from('attendance_sessions').select('*, sections(name, full_name, classes(class_levels(name)))').eq('school_id', schoolId).order('attendance_date', { ascending: false }).limit(10),
  ]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/dashboard" className="hover:text-indigo">Dashboard</Link>
          <span className="text-gray-300">/</span>
          <span>Attendance</span>
        </div>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Attendance</h1>
            <p className="text-gray-500 mt-1 text-sm">
              {currentTerm ? `${currentTerm.name}` : 'No current term'}
              {currentSession && ` · ${currentSession.name}`}
            </p>
          </div>
          <Link href="/dashboard/attendance/history" className="btn-secondary text-sm">
            History
          </Link>
        </div>
      </div>

      <AttendancePickerClient
        schoolId={schoolId}
        currentSession={currentSession}
        currentTerm={currentTerm}
        sections={sections || []}
        recentSessions={recentSessions || []}
      />
    </div>
  );
}
