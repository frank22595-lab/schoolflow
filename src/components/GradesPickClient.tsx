'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Calendar, ClipboardCheck, ArrowRight, AlertCircle,
  BookOpen, Loader2, Clock, ChevronRight, Settings,
} from 'lucide-react';

interface Props {
  schoolId: string;
  currentSession: any;
  currentTerm: any;
  terms: any[];
  sections: any[];
  classSubjects: any[];
  subjects: any[];
  recentScoreSessions: any[];
}

export default function GradesPickClient({ schoolId, currentSession, currentTerm, terms, sections, classSubjects, subjects, recentScoreSessions }: Props) {
  const router = useRouter();
  const [termId, setTermId] = useState(currentTerm?.id || '');
  const [sectionId, setSectionId] = useState('');
  const [loading, setLoading] = useState(false);

  const selectedSection = sections.find(s => s.id === sectionId);
  const selectedClassLevelId = selectedSection?.classes?.class_level_id;

  const availableSubjects = useMemo(() => {
    if (!selectedClassLevelId) return [];
    const subjectIds = classSubjects
      .filter(cs => cs.class_level_id === selectedClassLevelId)
      .map(cs => cs.subject_id);
    return subjects.filter(s => subjectIds.includes(s.id));
  }, [selectedClassLevelId, classSubjects, subjects]);

  async function pickSubject(subjectId: string) {
    if (!termId || !sectionId) {
      alert('Pick term and class first');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/scores/pick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolId,
          sessionId: currentSession?.id || sections[0]?.classes?.session_id,
          termId,
          sectionId,
          subjectId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push(`/dashboard/grades/enter/${data.scoreSessionId}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed');
      setLoading(false);
    }
  }

  if (!currentSession || terms.length === 0) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-2">
        <AlertCircle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
        <div className="text-sm text-amber-800">
          Set a current session and term first. <Link href="/dashboard/settings/academic" className="font-semibold underline">Go to Academic Calendar</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Term + class picker */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 lg:p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
            <Calendar className="w-4 h-4 text-indigo" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Which term & class?</h3>
            <p className="text-xs text-gray-500">Then pick a subject to enter scores for</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="label">Term</label>
            <select className="input" value={termId} onChange={(e) => setTermId(e.target.value)}>
              <option value="">Select term</option>
              {terms.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name} {t.sessions?.name && `(${t.sessions.name})`}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Class</label>
            <select className="input" value={sectionId} onChange={(e) => setSectionId(e.target.value)}>
              <option value="">Select class</option>
              {sections.map(s => (
                <option key={s.id} value={s.id}>{s.full_name || s.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Subject picker */}
      {sectionId && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 lg:p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-success" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Pick a subject</h3>
              <p className="text-xs text-gray-500">
                {availableSubjects.length} subjects assigned to this class
              </p>
            </div>
          </div>

          {availableSubjects.length === 0 ? (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                No subjects assigned to this class yet. <Link href="/dashboard/settings/grading" className="font-semibold underline">Assign subjects</Link> first.
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {availableSubjects.map(subj => (
                <button key={subj.id} type="button" onClick={() => pickSubject(subj.id)} disabled={loading || !termId}
                  className="p-4 rounded-xl border-2 border-gray-200 hover:border-indigo hover:bg-indigo-50 hover:shadow-md text-left transition-all disabled:opacity-50 disabled:cursor-not-allowed group">
                  <div className="w-10 h-10 rounded-lg bg-indigo-50 group-hover:bg-white flex items-center justify-center mb-2">
                    <BookOpen className="w-5 h-5 text-indigo" />
                  </div>
                  <div className="font-semibold text-gray-900 text-sm">{subj.name}</div>
                  {subj.code && <div className="text-[10px] text-gray-500 font-mono mt-0.5">{subj.code}</div>}
                </button>
              ))}
            </div>
          )}
          {loading && (
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500 pt-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading student list...
            </div>
          )}
        </div>
      )}

      {/* Recent sessions */}
      {recentScoreSessions.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 lg:p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 bg-purple-50 rounded-md flex items-center justify-center">
              <Clock className="w-4 h-4 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Recent score entries</h3>
          </div>
          <div className="space-y-2">
            {recentScoreSessions.map((s: any) => {
              const className = s.sections?.classes?.class_levels?.name || s.sections?.name || 'Class';
              const subjName = s.subjects?.name || 'Subject';
              const termName = s.terms?.name || '';
              return (
                <Link key={s.id} href={`/dashboard/grades/enter/${s.id}`}
                  className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-indigo-50 rounded-lg transition-colors group">
                  <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center flex-shrink-0">
                    <ClipboardCheck className="w-5 h-5 text-indigo" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 text-sm truncate">{subjName} · {className}</div>
                    <div className="text-[11px] text-gray-500 flex items-center gap-2 mt-0.5">
                      <span>{termName}</span>
                      {s.is_finalized && <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded font-semibold text-[10px]">FINALIZED</span>}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-indigo group-hover:translate-x-0.5 transition-all" />
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Link to settings */}
      <div className="flex justify-center">
        <Link href="/dashboard/settings/report-card"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-indigo">
          <Settings className="w-4 h-4" />
          Configure report card
        </Link>
      </div>
    </div>
  );
}
