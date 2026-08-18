'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import {
  ArrowLeft, Search, X, CheckCircle2, XCircle, Clock, AlertCircle,
  Users, Loader2, Save, Calendar, ChevronRight, Sparkles,
  Heart, MoreVertical, MessageSquare,
} from 'lucide-react';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; ring: string; border: string; icon: any }> = {
  present: { label: 'Present', color: 'text-emerald-700', bg: 'bg-emerald-500', ring: 'ring-emerald-500', border: 'border-emerald-500', icon: CheckCircle2 },
  absent: { label: 'Absent', color: 'text-red-700', bg: 'bg-red-500', ring: 'ring-red-500', border: 'border-red-500', icon: XCircle },
  late: { label: 'Late', color: 'text-amber-700', bg: 'bg-amber-500', ring: 'ring-amber-500', border: 'border-amber-500', icon: Clock },
  excused: { label: 'Excused', color: 'text-sky-700', bg: 'bg-sky-500', ring: 'ring-sky-500', border: 'border-sky-500', icon: Heart },
  sick: { label: 'Sick', color: 'text-purple-700', bg: 'bg-purple-500', ring: 'ring-purple-500', border: 'border-purple-500', icon: Heart },
};

interface Props {
  session: any;
  initialRecords: any[];
  schoolId: string;
}

export default function MarkAttendanceClient({ session, initialRecords, schoolId }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [records, setRecords] = useState(initialRecords);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [savedFlash, setSavedFlash] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!search) return records;
    const q = search.toLowerCase();
    return records.filter(r => {
      const s = r.students;
      if (!s) return false;
      return `${s.first_name} ${s.last_name}`.toLowerCase().includes(q) ||
        s.admission_number.toLowerCase().includes(q);
    });
  }, [records, search]);

  const stats = useMemo(() => {
    const counts = { present: 0, absent: 0, late: 0, excused: 0, sick: 0 };
    records.forEach(r => { counts[r.status as keyof typeof counts] = (counts[r.status as keyof typeof counts] || 0) + 1; });
    return counts;
  }, [records]);

  const total = records.length;
  const attendedPct = total > 0 ? Math.round(((stats.present + stats.late) / total) * 100) : 0;

  async function updateStatus(recordId: string, newStatus: string) {
    setSaving(s => ({ ...s, [recordId]: true }));
    try {
      // Optimistic update
      setRecords(rs => rs.map(r => r.id === recordId ? { ...r, status: newStatus } : r));

      const { error } = await supabase
        .from('attendance_records')
        .update({ status: newStatus, marked_at: new Date().toISOString() })
        .eq('id', recordId);

      if (error) throw error;

      setSavedFlash(recordId);
      setTimeout(() => setSavedFlash(null), 800);
      router.refresh();
    } catch (err) {
      // Revert on error
      setRecords(rs => rs.map(r => r.id === recordId ? initialRecords.find(ir => ir.id === recordId)! : r));
      alert('Failed to update: ' + (err instanceof Error ? err.message : ''));
    } finally {
      setSaving(s => ({ ...s, [recordId]: false }));
    }
  }

  async function markAll(status: string) {
    if (!confirm(`Mark ALL ${filtered.length} students as ${status}?`)) return;
    for (const r of filtered) {
      if (r.status !== status) {
        await updateStatus(r.id, status);
      }
    }
  }

  const className = session.sections?.full_name || session.sections?.name || 'Class';
  const dateStr = new Date(session.attendance_date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="space-y-4 pb-24 lg:pb-8">
      {/* Header bar */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 lg:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Link href="/dashboard/attendance" className="p-1 -ml-1 text-gray-400 hover:text-indigo hover:bg-gray-100 rounded">
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <h1 className="text-lg lg:text-xl font-bold text-gray-900 truncate">{className}</h1>
            </div>
            <div className="text-xs text-gray-500 flex items-center gap-2 ml-6">
              <Calendar className="w-3 h-3" />
              {dateStr}
              <span className="capitalize">· {session.period}</span>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className={`text-2xl font-bold ${attendedPct >= 90 ? 'text-emerald-700' : attendedPct >= 75 ? 'text-amber-700' : 'text-error'}`}>
              {attendedPct}%
            </div>
            <div className="text-[10px] text-gray-500 uppercase">Attendance</div>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-5 gap-1.5 mt-4">
          {Object.entries(STATUS_CONFIG).map(([status, cfg]) => (
            <div key={status} className={`p-2 rounded-lg bg-gray-50 text-center`}>
              <div className={`text-lg font-bold ${cfg.color}`}>{stats[status as keyof typeof stats]}</div>
              <div className="text-[9px] text-gray-500 uppercase">{cfg.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Search + quick actions */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3 space-y-3">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search student..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo focus:bg-white"
              value={search} onChange={(e) => setSearch(e.target.value)} />
            {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"><X className="w-3.5 h-3.5" /></button>}
          </div>
        </div>
        <div className="flex flex-wrap gap-1 text-xs">
          <span className="text-[10px] text-gray-500 uppercase font-semibold self-center mr-1">Mark all:</span>
          <button onClick={() => markAll('present')} className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded text-xs font-medium hover:bg-emerald-100">
            <CheckCircle2 className="w-3 h-3 inline mr-1" />Present
          </button>
          <button onClick={() => markAll('absent')} className="px-2 py-1 bg-red-50 text-red-700 rounded text-xs font-medium hover:bg-red-100">
            <XCircle className="w-3 h-3 inline mr-1" />Absent
          </button>
        </div>
      </div>

      {/* Students list */}
      {records.length === 0 ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
          <AlertCircle className="w-8 h-8 text-warning mx-auto mb-2" />
          <p className="text-sm font-medium text-amber-900">No students enrolled in this class yet</p>
          <p className="text-xs text-amber-700 mt-1">Add students to this class first, then come back to mark attendance.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-100">
            {filtered.map(r => {
              const s = r.students;
              if (!s) return null;
              const initials = `${s.first_name[0]}${s.last_name[0]}`.toUpperCase();
              const isSaving = saving[r.id];
              const wasSaved = savedFlash === r.id;
              return (
                <div key={r.id} className={`p-3 lg:p-4 hover:bg-gray-50 transition-all ${wasSaved ? 'bg-emerald-50' : ''}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0 relative">
                      {s.photo_url ? <img src={s.photo_url} className="w-full h-full rounded-full object-cover" alt="" /> : initials}
                      {s.medical_alert_flag && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-error rounded-full flex items-center justify-center border-2 border-white">
                          <AlertCircle className="w-2.5 h-2.5 text-white" />
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-gray-900 truncate">
                        {s.first_name} {s.middle_name && s.middle_name[0] + '.'} {s.last_name}
                      </div>
                      <div className="text-[10px] text-gray-500 truncate">{s.admission_number}</div>
                    </div>
                    {isSaving && <Loader2 className="w-4 h-4 animate-spin text-indigo flex-shrink-0" />}
                  </div>

                  {/* Status buttons */}
                  <div className="grid grid-cols-5 gap-1 mt-3">
                    {Object.entries(STATUS_CONFIG).map(([status, cfg]) => {
                      const active = r.status === status;
                      return (
                        <button key={status} type="button"
                          onClick={() => updateStatus(r.id, status)}
                          disabled={isSaving}
                          className={`p-1.5 rounded-lg text-[10px] font-semibold transition-all flex flex-col items-center gap-0.5 ${
                            active ? `${cfg.bg} text-white shadow-sm` : `bg-gray-50 text-gray-600 hover:bg-gray-100`
                          }`}>
                          <cfg.icon className="w-3.5 h-3.5" />
                          <span>{cfg.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && search && (
              <div className="p-6 text-center text-sm text-gray-500">No matches for "{search}"</div>
            )}
          </div>
        </div>
      )}

      {/* Bottom saved indicator */}
      <div className="fixed bottom-20 lg:bottom-6 right-4 pointer-events-none z-30">
        {Object.values(saving).some(Boolean) && (
          <div className="bg-white rounded-full shadow-lg border border-gray-200 px-3 py-2 flex items-center gap-2">
            <Loader2 className="w-3 h-3 animate-spin text-indigo" />
            <span className="text-xs text-gray-700 font-medium">Saving...</span>
          </div>
        )}
      </div>
    </div>
  );
}
