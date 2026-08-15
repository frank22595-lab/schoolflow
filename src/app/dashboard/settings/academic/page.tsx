import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import AcademicCalendarClient from '@/components/AcademicCalendarClient';

export default async function AcademicCalendarPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from('users').select('*, schools(*)').eq('id', user!.id).single();

  const schoolId = profile?.school_id;

  // Fetch sessions
  const { data: sessions } = await supabase
    .from('sessions')
    .select('*')
    .eq('school_id', schoolId)
    .order('start_date', { ascending: false });

  // Fetch terms
  const { data: terms } = await supabase
    .from('terms')
    .select('*')
    .eq('school_id', schoolId)
    .order('sequence', { ascending: true });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* Breadcrumb + Header */}
      <div>
        <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/dashboard" className="hover:text-indigo">Dashboard</Link>
          <span className="text-gray-300">/</span>
          <Link href="/dashboard/settings" className="hover:text-indigo">Settings</Link>
          <span className="text-gray-300">/</span>
          <span>Academic Calendar</span>
        </div>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Academic Calendar</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Configure your academic sessions and terms. Everything else in the system runs on this calendar.
        </p>
      </div>

      <AcademicCalendarClient
        schoolId={schoolId}
        initialSessions={sessions || []}
        initialTerms={terms || []}
        academicCalendarType={profile?.schools?.academic_calendar_type || '3-term'}
      />
    </div>
  );
}
