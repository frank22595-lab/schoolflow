import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { ArrowLeft, Calendar, ArrowRight } from 'lucide-react';

export default async function AttendanceHistoryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('users').select('school_id').eq('id', user!.id).single();
  const schoolId = profile!.school_id;

  const { data: sessions } = await supabase
    .from('attendance_sessions')
    .select('*, sections(name, full_name, classes(class_levels(name)))')
    .eq('school_id', schoolId)
    .order('attendance_date', { ascending: false })
    .limit(100);

  // Group by date
  const grouped: Record<string, any[]> = {};
  (sessions || []).forEach(s => {
    if (!grouped[s.attendance_date]) grouped[s.attendance_date] = [];
    grouped[s.attendance_date].push(s);
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/dashboard" className="hover:text-indigo">Dashboard</Link>
          <span className="text-gray-300">/</span>
          <Link href="/dashboard/attendance" className="hover:text-indigo">Attendance</Link>
          <span className="text-gray-300">/</span>
          <span>History</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Attendance history</h1>
            <p className="text-gray-500 mt-1 text-sm">{sessions?.length || 0} sessions logged</p>
          </div>
          <Link href="/dashboard/attendance" className="btn-primary text-sm">Mark new</Link>
        </div>
      </div>

      {Object.keys(grouped).length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
          <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-600">No attendance marked yet</p>
          <Link href="/dashboard/attendance" className="btn-primary text-sm mt-3 inline-flex">
            Start marking
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([date, sesList]) => (
            <div key={date}>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">
                {new Date(date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </h3>
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden divide-y divide-gray-100">
                {sesList.map((s: any) => {
                  const className = s.sections?.full_name || s.sections?.name || 'Class';
                  const total = s.total_students || 0;
                  const attendedRate = total > 0 ? Math.round(((s.present_count + s.late_count) / total) * 100) : 0;
                  return (
                    <Link key={s.id} href={`/dashboard/attendance/mark/${s.id}`}
                      className="flex items-center gap-3 p-3 lg:p-4 hover:bg-gray-50 transition-colors group">
                      <div className={`w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        attendedRate >= 90 ? 'bg-emerald-50' : attendedRate >= 75 ? 'bg-amber-50' : 'bg-red-50'
                      }`}>
                        <span className={`text-sm font-bold ${
                          attendedRate >= 90 ? 'text-emerald-700' : attendedRate >= 75 ? 'text-amber-700' : 'text-error'
                        }`}>
                          {attendedRate}%
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 text-sm truncate">{className}</div>
                        <div className="text-[11px] text-gray-500 flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="capitalize">{s.period.replace('_', ' ')}</span>
                          <span>·</span>
                          <span className="text-emerald-700">{s.present_count} present</span>
                          {s.absent_count > 0 && <><span>·</span><span className="text-error">{s.absent_count} absent</span></>}
                          {s.late_count > 0 && <><span>·</span><span className="text-amber-700">{s.late_count} late</span></>}
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-indigo group-hover:translate-x-0.5 transition-all" />
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
