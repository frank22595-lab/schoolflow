'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Calendar, ClipboardCheck, ArrowRight, AlertCircle,
  Users, Loader2, CheckCircle2, Clock, XCircle,
} from 'lucide-react';

interface Props {
  schoolId: string;
  currentSession: any;
  currentTerm: any;
  sections: any[];
  recentSessions: any[];
}

export default function AttendancePickerClient({ schoolId, currentSession, currentTerm, sections, recentSessions }: Props) {
  const router = useRouter();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [period, setPeriod] = useState('morning');
  const [loading, setLoading] = useState(false);

  async function pickSection(sectionId: string) {
    setLoading(true);
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolId,
          sessionId: currentSession?.id,
          termId: currentTerm?.id,
          sectionId,
          date,
          period,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push(`/dashboard/attendance/mark/${data.sessionId}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed');
      setLoading(false);
    }
  }

  if (!currentSession) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-2">
        <AlertCircle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
        <div className="text-sm text-amber-800">
          Set a current session first. <Link href="/dashboard/settings/academic" className="font-semibold underline">Go to Academic Calendar</Link>
        </div>
      </div>
    );
  }

  if (sections.length === 0) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-2">
        <AlertCircle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
        <div className="text-sm text-amber-800">
          No classes yet. <Link href="/dashboard/settings/classes" className="font-semibold underline">Set up classes and sections</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date & period picker */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 lg:p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
            <Calendar className="w-4 h-4 text-indigo" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">When?</h3>
            <p className="text-xs text-gray-500">Pick date and period</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="label">Date</label>
            <input type="date" className="input" max={new Date().toISOString().slice(0, 10)}
              value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <label className="label">Period</label>
            <select className="input" value={period} onChange={(e) => setPeriod(e.target.value)}>
              <option value="morning">Morning</option>
              <option value="afternoon">Afternoon</option>
              <option value="full_day">Full day</option>
            </select>
          </div>
        </div>
      </div>

      {/* Class picker */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 lg:p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
            <Users className="w-4 h-4 text-success" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Which class?</h3>
            <p className="text-xs text-gray-500">Tap a class to mark or edit attendance</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {sections.map(s => (
            <button key={s.id} type="button" onClick={() => pickSection(s.id)} disabled={loading}
              className="p-4 rounded-xl border-2 border-gray-200 hover:border-indigo hover:bg-indigo-50 hover:shadow-md text-left transition-all disabled:opacity-50 disabled:cursor-not-allowed group">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 group-hover:bg-white flex items-center justify-center mb-2">
                <ClipboardCheck className="w-5 h-5 text-indigo" />
              </div>
              <div className="font-semibold text-gray-900 text-sm">{s.full_name || s.name}</div>
              {s.stream && <div className="text-[10px] text-gray-500 uppercase mt-0.5">{s.stream}</div>}
            </button>
          ))}
        </div>
        {loading && (
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500 pt-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading class list...
          </div>
        )}
      </div>

      {/* Recent sessions */}
      {recentSessions.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 lg:p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 bg-purple-50 rounded-md flex items-center justify-center">
              <Clock className="w-4 h-4 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Recent attendance</h3>
          </div>
          <div className="space-y-2">
            {recentSessions.slice(0, 6).map((s: any) => {
              const className = s.sections?.full_name || s.sections?.name || 'Class';
              const total = s.total_students || 0;
              const attendedRate = total > 0 ? Math.round(((s.present_count + s.late_count) / total) * 100) : 0;
              return (
                <Link key={s.id} href={`/dashboard/attendance/mark/${s.id}`}
                  className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-indigo-50 rounded-lg transition-colors group">
                  <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center flex-shrink-0">
                    <span className={`text-sm font-bold ${attendedRate >= 90 ? 'text-emerald-700' : attendedRate >= 75 ? 'text-amber-700' : 'text-error'}`}>
                      {attendedRate}%
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 text-sm truncate">{className}</div>
                    <div className="text-[11px] text-gray-500 flex items-center gap-2 mt-0.5">
                      <span>{new Date(s.attendance_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                      <span className="capitalize">· {s.period}</span>
                      <span>· {s.present_count}/{total} present</span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-indigo group-hover:translate-x-0.5 transition-all" />
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
