'use client';

import { useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import {
  ArrowLeft, MessageSquare, Sparkles, Save, Loader2, User, Shield,
  CheckCircle2, AlertCircle, ChevronDown,
} from 'lucide-react';

interface Props {
  schoolId: string;
  student: any;
  term: any;
  termId: string;
  initial: any;
  presets: any[];
  studentAvg: number;
  settings: any;
}

export default function CommentsEntryClient({ schoolId, student, term, termId, initial, presets, studentAvg, settings }: Props) {
  const supabase = createClient();
  const [teacherComment, setTeacherComment] = useState(initial?.teacher_comment || '');
  const [principalComment, setPrincipalComment] = useState(initial?.principal_comment || '');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [showTPresets, setShowTPresets] = useState(false);
  const [showPPresets, setShowPPresets] = useState(false);

  // Smart preset filtering by score range
  const suggestedTeacher = useMemo(() => {
    return presets.filter(p => p.comment_type === 'teacher' &&
      (!p.score_min || studentAvg >= p.score_min) &&
      (!p.score_max || studentAvg <= p.score_max));
  }, [presets, studentAvg]);

  const suggestedPrincipal = useMemo(() => {
    return presets.filter(p => p.comment_type === 'principal' &&
      (!p.score_min || studentAvg >= p.score_min) &&
      (!p.score_max || studentAvg <= p.score_max));
  }, [presets, studentAvg]);

  const allTeacher = presets.filter(p => p.comment_type === 'teacher');
  const allPrincipal = presets.filter(p => p.comment_type === 'principal');

  function showToast(type: 'success' | 'error', msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 2500);
  }

  async function save() {
    setSaving(true);
    try {
      const { error } = await supabase.from('student_behavior').upsert({
        school_id: schoolId,
        student_id: student.id,
        term_id: termId,
        teacher_comment: teacherComment || null,
        principal_comment: principalComment || null,
      }, { onConflict: 'student_id,term_id' });
      if (error) throw error;
      showToast('success', 'Comments saved');
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  const showTeacher = settings?.show_teacher_comment !== false;
  const showPrincipal = settings?.show_principal_comment !== false;

  return (
    <div className="space-y-4 pb-24">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="flex items-center gap-3">
          <Link href={`/dashboard/grades/term/${termId}`} className="p-1 -ml-1 text-gray-400 hover:text-indigo hover:bg-gray-100 rounded">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
            {student.first_name[0]}{student.last_name[0]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-gray-900">{student.first_name} {student.last_name}</div>
            <div className="text-xs text-gray-500 font-mono">{student.admission_number} · {term.name}</div>
          </div>
          {studentAvg > 0 && (
            <div className="text-right">
              <div className="text-lg font-bold text-gray-900">{studentAvg}</div>
              <div className="text-[10px] text-gray-500">avg</div>
            </div>
          )}
        </div>
      </div>

      {/* Teacher comment */}
      {showTeacher && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-50 rounded-md flex items-center justify-center">
                <User className="w-4 h-4 text-indigo" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">Teacher's comment</h3>
                <p className="text-[11px] text-gray-500">Class teacher's remark on the student</p>
              </div>
            </div>
          </div>

          {suggestedTeacher.length > 0 && (
            <div>
              <div className="text-[10px] font-semibold text-emerald-700 uppercase mb-2 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />Suggested (based on {studentAvg} avg)
              </div>
              <div className="space-y-1">
                {suggestedTeacher.map(p => (
                  <button key={p.id} onClick={() => setTeacherComment(p.text)}
                    className="w-full text-left p-2 rounded-md bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 text-sm text-gray-800 transition-colors">
                    {p.text}
                  </button>
                ))}
              </div>
            </div>
          )}

          {allTeacher.length > suggestedTeacher.length && (
            <button onClick={() => setShowTPresets(!showTPresets)}
              className="text-xs text-indigo hover:underline flex items-center gap-1">
              <ChevronDown className={`w-3 h-3 transition-transform ${showTPresets ? 'rotate-180' : ''}`} />
              {showTPresets ? 'Hide' : 'Show'} all {allTeacher.length} teacher presets
            </button>
          )}
          {showTPresets && (
            <div className="space-y-1">
              {allTeacher.map(p => (
                <button key={p.id} onClick={() => setTeacherComment(p.text)}
                  className="w-full text-left p-2 rounded-md bg-gray-50 hover:bg-gray-100 text-sm text-gray-700">
                  {p.text}
                  {(p.score_min || p.score_max) && (
                    <span className="ml-2 text-[10px] text-gray-400">({p.score_min || 0}-{p.score_max || 100})</span>
                  )}
                </button>
              ))}
            </div>
          )}

          <textarea rows={3} className="input text-sm" placeholder="Or type your own comment..."
            value={teacherComment} onChange={(e) => setTeacherComment(e.target.value)} />
        </div>
      )}

      {/* Principal comment */}
      {showPrincipal && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-purple-50 rounded-md flex items-center justify-center">
              <Shield className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">Principal's comment</h3>
              <p className="text-[11px] text-gray-500">Head teacher / Principal's remark</p>
            </div>
          </div>

          {suggestedPrincipal.length > 0 && (
            <div>
              <div className="text-[10px] font-semibold text-emerald-700 uppercase mb-2 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />Suggested
              </div>
              <div className="space-y-1">
                {suggestedPrincipal.map(p => (
                  <button key={p.id} onClick={() => setPrincipalComment(p.text)}
                    className="w-full text-left p-2 rounded-md bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 text-sm text-gray-800">
                    {p.text}
                  </button>
                ))}
              </div>
            </div>
          )}

          {allPrincipal.length > suggestedPrincipal.length && (
            <button onClick={() => setShowPPresets(!showPPresets)}
              className="text-xs text-indigo hover:underline flex items-center gap-1">
              <ChevronDown className={`w-3 h-3 transition-transform ${showPPresets ? 'rotate-180' : ''}`} />
              {showPPresets ? 'Hide' : 'Show'} all {allPrincipal.length} principal presets
            </button>
          )}
          {showPPresets && (
            <div className="space-y-1">
              {allPrincipal.map(p => (
                <button key={p.id} onClick={() => setPrincipalComment(p.text)}
                  className="w-full text-left p-2 rounded-md bg-gray-50 hover:bg-gray-100 text-sm text-gray-700">
                  {p.text}
                </button>
              ))}
            </div>
          )}

          <textarea rows={3} className="input text-sm" placeholder="Or type your own..."
            value={principalComment} onChange={(e) => setPrincipalComment(e.target.value)} />
        </div>
      )}

      {(!showTeacher && !showPrincipal) && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            Comments are disabled. <Link href="/dashboard/settings/report-card" className="font-semibold underline">Enable in Report Card settings</Link>.
          </div>
        </div>
      )}

      {/* Save bar */}
      <div className="fixed bottom-16 lg:bottom-4 left-0 right-0 lg:left-64 z-30 p-3 bg-white/95 backdrop-blur border-t lg:border lg:mx-6 lg:rounded-xl border-gray-200 lg:shadow-lg flex justify-end gap-2 max-w-3xl mx-auto lg:right-6">
        <Link href={`/dashboard/grades/term/${termId}`} className="btn-secondary text-sm">Back</Link>
        <button onClick={save} disabled={saving} className="btn-primary text-sm">
          {saving ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" />Saving...</> : <><Save className="w-4 h-4 mr-1" />Save comments</>}
        </button>
      </div>

      {toast && (
        <div className={`fixed bottom-32 lg:bottom-24 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg ${
          toast.type === 'success' ? 'bg-success text-white' : 'bg-error text-white'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span className="text-sm font-medium">{toast.msg}</span>
        </div>
      )}
    </div>
  );
}
