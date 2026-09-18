'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import {
  ArrowLeft, Search, X, Save, AlertCircle, Loader2,
  Award, Users, TrendingUp, TrendingDown, CheckCircle2,
  Printer, Lock, Unlock, Calendar,
} from 'lucide-react';

const COLOR_CLASSES: Record<string, string> = {
  emerald: 'bg-emerald-500 text-white',
  sky: 'bg-sky-500 text-white',
  indigo: 'bg-indigo text-white',
  amber: 'bg-amber-500 text-white',
  red: 'bg-error text-white',
  purple: 'bg-purple-500 text-white',
  gray: 'bg-gray-400 text-white',
};

interface Props {
  scoreSession: any;
  assessments: any[];
  initialScores: any[];
  gradeBands: any[];
}

export default function ScoreEntryClient({ scoreSession, assessments, initialScores, gradeBands }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [scores, setScores] = useState(initialScores);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [savedFlash, setSavedFlash] = useState<string | null>(null);
  const [isFinalized, setIsFinalized] = useState(scoreSession.is_finalized);

  const maxTotal = assessments.reduce((sum, a) => sum + Number(a.max_score), 0);

  const filtered = useMemo(() => {
    if (!search) return scores;
    const q = search.toLowerCase();
    return scores.filter(r => {
      const s = r.students;
      if (!s) return false;
      return `${s.first_name} ${s.last_name}`.toLowerCase().includes(q) ||
        s.admission_number?.toLowerCase().includes(q);
    });
  }, [scores, search]);

  // Calculate class stats
  const stats = useMemo(() => {
    const totals = scores.filter(s => !s.is_absent && (s.total_score || 0) > 0).map(s => Number(s.total_score));
    if (totals.length === 0) return { avg: 0, highest: 0, lowest: 0, passCount: 0, entered: 0 };
    const sum = totals.reduce((a, b) => a + b, 0);
    return {
      avg: Math.round((sum / totals.length) * 100) / 100,
      highest: Math.max(...totals),
      lowest: Math.min(...totals),
      passCount: totals.filter(t => t >= 40).length,
      entered: totals.length,
    };
  }, [scores]);

  function getGradeFor(total: number) {
    return gradeBands.find(b => total >= Number(b.min_score) && total <= Number(b.max_score));
  }

  function calcTotal(scoresObj: Record<string, number>) {
    return Object.values(scoresObj).reduce((sum, v) => sum + (Number(v) || 0), 0);
  }

  async function updateScore(recordId: string, assessmentCode: string, value: string, isAbsent = false) {
    if (isFinalized) return;
    const numValue = value === '' ? null : Number(value);
    if (numValue !== null && (isNaN(numValue) || numValue < 0)) return;

    const record = scores.find(r => r.id === recordId);
    if (!record) return;

    const assessment = assessments.find(a => a.short_code === assessmentCode);
    if (assessment && numValue !== null && numValue > Number(assessment.max_score)) {
      alert(`Max score for ${assessmentCode} is ${assessment.max_score}`);
      return;
    }

    const newScores = { ...(record.scores || {}) };
    if (numValue === null) delete newScores[assessmentCode];
    else newScores[assessmentCode] = numValue;
    const newTotal = calcTotal(newScores);
    const gradeBand = getGradeFor(newTotal);

    // Optimistic update
    setScores(rs => rs.map(r => r.id === recordId ? {
      ...r,
      scores: newScores,
      total_score: newTotal,
      grade: gradeBand?.grade || null,
      grade_remark: gradeBand?.remark || null,
      is_absent: isAbsent,
    } : r));

    setSaving(s => ({ ...s, [recordId]: true }));
    try {
      const { error } = await supabase.from('student_scores').update({
        scores: newScores,
        total_score: newTotal,
        grade: gradeBand?.grade || null,
        grade_remark: gradeBand?.remark || null,
        is_absent: isAbsent,
        updated_at: new Date().toISOString(),
      }).eq('id', recordId);
      if (error) throw error;
      setSavedFlash(recordId);
      setTimeout(() => setSavedFlash(null), 800);
    } catch (err) {
      alert('Failed to save: ' + (err instanceof Error ? err.message : ''));
    } finally {
      setSaving(s => ({ ...s, [recordId]: false }));
    }
  }

  async function toggleAbsent(recordId: string) {
    if (isFinalized) return;
    const record = scores.find(r => r.id === recordId);
    if (!record) return;
    const newAbsent = !record.is_absent;

    setScores(rs => rs.map(r => r.id === recordId ? {
      ...r, is_absent: newAbsent, scores: newAbsent ? {} : r.scores, total_score: newAbsent ? 0 : r.total_score,
    } : r));

    setSaving(s => ({ ...s, [recordId]: true }));
    try {
      await supabase.from('student_scores').update({
        is_absent: newAbsent,
        scores: newAbsent ? {} : record.scores,
        total_score: newAbsent ? 0 : record.total_score,
      }).eq('id', recordId);
    } finally {
      setSaving(s => ({ ...s, [recordId]: false }));
    }
  }

  async function toggleFinalize() {
    const msg = isFinalized ? 'Unlock this scoresheet for editing?' : 'Finalize this scoresheet? Teachers won\'t be able to change scores after.';
    if (!confirm(msg)) return;
    try {
      const { error } = await supabase.from('score_sessions').update({
        is_finalized: !isFinalized,
        finalized_at: !isFinalized ? new Date().toISOString() : null,
      }).eq('id', scoreSession.id);
      if (error) throw error;
      setIsFinalized(!isFinalized);
    } catch (err) {
      alert('Failed: ' + (err instanceof Error ? err.message : ''));
    }
  }

  const className = scoreSession.sections?.full_name || scoreSession.sections?.name || 'Class';
  const subjectName = scoreSession.subjects?.name || 'Subject';
  const termName = scoreSession.terms?.name || '';

  return (
    <div className="space-y-4 pb-24 lg:pb-8">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 lg:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Link href="/dashboard/grades" className="p-1 -ml-1 text-gray-400 hover:text-indigo hover:bg-gray-100 rounded">
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <h1 className="text-lg lg:text-xl font-bold text-gray-900 truncate">
                {subjectName} · {className}
              </h1>
              {isFinalized && (
                <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded font-semibold text-[10px] uppercase">
                  Finalized
                </span>
              )}
            </div>
            <div className="text-xs text-gray-500 flex items-center gap-2 ml-6">
              <Calendar className="w-3 h-3" />
              {termName}
              <span>· max total: {maxTotal}</span>
            </div>
          </div>
          <button onClick={toggleFinalize}
            className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 ${
              isFinalized ? 'bg-amber-50 text-amber-700 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}>
            {isFinalized ? <><Unlock className="w-3.5 h-3.5" />Unlock</> : <><Lock className="w-3.5 h-3.5" />Finalize</>}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-5 gap-2 mt-4">
          <StatCard label="Entered" value={`${stats.entered}/${scores.length}`} color="text-indigo" />
          <StatCard label="Avg" value={stats.avg.toString()} color="text-gray-900" />
          <StatCard label="Highest" value={stats.highest.toString()} color="text-success" icon={TrendingUp} />
          <StatCard label="Lowest" value={stats.lowest.toString()} color="text-error" icon={TrendingDown} />
          <StatCard label="Passed" value={stats.passCount.toString()} color="text-success" />
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search student..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo focus:bg-white"
            value={search} onChange={(e) => setSearch(e.target.value)} />
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"><X className="w-3.5 h-3.5" /></button>}
        </div>
      </div>

      {/* Score table */}
      {scores.length === 0 ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
          <AlertCircle className="w-8 h-8 text-warning mx-auto mb-2" />
          <p className="text-sm font-medium text-amber-900">No students enrolled in this class</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left text-[10px] text-gray-500 uppercase border-b border-gray-200">
                  <th className="px-3 py-3 font-semibold sticky left-0 bg-gray-50 z-10">Student</th>
                  {assessments.map(a => (
                    <th key={a.id} className="px-2 py-3 font-semibold text-center">
                      {a.short_code}
                      <div className="text-[9px] text-gray-400 font-normal">max {a.max_score}</div>
                    </th>
                  ))}
                  <th className="px-2 py-3 font-semibold text-center">Total</th>
                  <th className="px-2 py-3 font-semibold text-center">Grade</th>
                  <th className="px-2 py-3 font-semibold text-center">Absent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((row) => {
                  const s = row.students;
                  if (!s) return null;
                  const initials = `${s.first_name[0]}${s.last_name[0]}`.toUpperCase();
                  const isSaving = saving[row.id];
                  const wasSaved = savedFlash === row.id;
                  const gradeBand = getGradeFor(row.total_score || 0);
                  const colorClass = gradeBand ? COLOR_CLASSES[gradeBand.color] || 'bg-gray-400 text-white' : 'bg-gray-100 text-gray-500';

                  return (
                    <tr key={row.id} className={`hover:bg-gray-50 transition-all ${wasSaved ? 'bg-emerald-50' : ''} ${row.is_absent ? 'opacity-50' : ''}`}>
                      <td className="px-3 py-2 sticky left-0 bg-white z-10">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-xs text-gray-900 truncate max-w-[140px]">
                              {s.first_name} {s.last_name}
                            </div>
                            <div className="text-[9px] text-gray-500 font-mono truncate">{s.admission_number}</div>
                          </div>
                          {isSaving && <Loader2 className="w-3 h-3 animate-spin text-indigo" />}
                        </div>
                      </td>

                      {assessments.map(a => (
                        <td key={a.id} className="px-1 py-2 text-center">
                          <input type="number" min="0" max={a.max_score} step="0.5"
                            value={row.scores?.[a.short_code] ?? ''}
                            disabled={row.is_absent || isFinalized}
                            onChange={(e) => updateScore(row.id, a.short_code, e.target.value)}
                            onFocus={(e) => e.target.select()}
                            className="w-14 px-1 py-1 text-center text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-indigo focus:border-indigo disabled:bg-gray-50 disabled:cursor-not-allowed font-mono"
                            placeholder="—"
                          />
                        </td>
                      ))}

                      <td className="px-2 py-2 text-center font-bold text-sm">
                        {row.is_absent ? '—' : (row.total_score || 0)}
                      </td>
                      <td className="px-2 py-2 text-center">
                        {row.is_absent ? (
                          <span className="text-xs text-gray-400">—</span>
                        ) : row.total_score > 0 && gradeBand ? (
                          <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${colorClass}`}>
                            {gradeBand.grade}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-2 py-2 text-center">
                        <input type="checkbox" checked={row.is_absent} disabled={isFinalized}
                          onChange={() => toggleAbsent(row.id)}
                          className="accent-error" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && search && (
            <div className="p-6 text-center text-sm text-gray-500">No matches for "{search}"</div>
          )}
        </div>
      )}

      {/* Bottom bar */}
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

function StatCard({ label, value, color, icon: Icon }: any) {
  return (
    <div className="p-2 rounded-lg bg-gray-50 text-center">
      <div className={`text-lg font-bold ${color} flex items-center justify-center gap-0.5`}>
        {Icon && <Icon className="w-3.5 h-3.5" />}
        {value}
      </div>
      <div className="text-[9px] text-gray-500 uppercase">{label}</div>
    </div>
  );
}
