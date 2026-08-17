'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Calendar, Plus, Edit2, Trash2, Check, Loader2, X,
  Info, ChevronRight, ChevronDown, Star, Lock, Unlock,
  AlertCircle, CheckCircle2, CalendarDays,
} from 'lucide-react';

interface Session {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  is_closed: boolean;
  notes?: string;
}

interface Term {
  id: string;
  session_id: string;
  name: string;
  short_name?: string;
  sequence: number;
  start_date: string;
  end_date: string;
  resumption_date?: string;
  vacation_date?: string;
  is_current: boolean;
  is_closed: boolean;
  mid_term_break_start?: string;
  mid_term_break_end?: string;
}

interface Props {
  schoolId: string;
  initialSessions: Session[];
  initialTerms: Term[];
  academicCalendarType: string;
}

export default function AcademicCalendarClient({
  schoolId, initialSessions, initialTerms, academicCalendarType,
}: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [sessions, setSessions] = useState<Session[]>(initialSessions);
  const [terms, setTerms] = useState<Term[]>(initialTerms);
  const [expandedSession, setExpandedSession] = useState<string | null>(
    initialSessions.find(s => s.is_current)?.id || initialSessions[0]?.id || null
  );

  const [sessionModal, setSessionModal] = useState<{ open: boolean; session?: Session }>({ open: false });
  const [termModal, setTermModal] = useState<{ open: boolean; term?: Term; sessionId?: string }>({ open: false });
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'session' | 'term'; id: string; name: string } | null>(null);

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  function showToast(type: 'success' | 'error', message: string) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  }

  async function refreshData() {
    const { data: s } = await supabase.from('sessions').select('*').eq('school_id', schoolId).order('start_date', { ascending: false });
    const { data: t } = await supabase.from('terms').select('*').eq('school_id', schoolId).order('sequence', { ascending: true });
    setSessions(s || []);
    setTerms(t || []);
    router.refresh();
  }

  async function toggleCurrentSession(id: string) {
    setLoading(true);
    try {
      const { error } = await supabase.from('sessions').update({ is_current: true }).eq('id', id);
      if (error) throw error;
      await refreshData();
      showToast('success', 'Current session updated');
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Failed');
    } finally { setLoading(false); }
  }

  async function toggleCurrentTerm(id: string) {
    setLoading(true);
    try {
      const { error } = await supabase.from('terms').update({ is_current: true }).eq('id', id);
      if (error) throw error;
      await refreshData();
      showToast('success', 'Current term updated');
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Failed');
    } finally { setLoading(false); }
  }

  async function handleDelete() {
    if (!deleteConfirm) return;
    setLoading(true);
    try {
      const { error } = await supabase.from(deleteConfirm.type === 'session' ? 'sessions' : 'terms')
        .delete().eq('id', deleteConfirm.id);
      if (error) throw error;
      await refreshData();
      showToast('success', `${deleteConfirm.type === 'session' ? 'Session' : 'Term'} deleted`);
      setDeleteConfirm(null);
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Delete failed');
    } finally { setLoading(false); }
  }

  const termsBySession = terms.reduce((acc, t) => {
    if (!acc[t.session_id]) acc[t.session_id] = [];
    acc[t.session_id].push(t);
    return acc;
  }, {} as Record<string, Term[]>);

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const daysUntil = (d: string) => {
    const days = Math.ceil((new Date(d).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (days < 0) return `${Math.abs(days)} days ago`;
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    return `In ${days} days`;
  };

  return (
    <div className="space-y-6">
      {/* Info banner */}
      {sessions.length === 0 && (
        <div className="bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 rounded-xl p-4 lg:p-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-indigo rounded-lg flex items-center justify-center flex-shrink-0">
              <Info className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">Let's set up your first session</h3>
              <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                A session is an academic year (e.g., <strong>2025/2026</strong>). Every school starts with one active session.
                You'll add {academicCalendarType === '2-semester' ? '2 semesters' : '3 terms'} inside it.
              </p>
              <button
                onClick={() => setSessionModal({ open: true })}
                className="btn-primary text-sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create your first session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header row with add button */}
      {sessions.length > 0 && (
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Sessions</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {sessions.length} session{sessions.length !== 1 ? 's' : ''} · {terms.length} term{terms.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button onClick={() => setSessionModal({ open: true })} className="btn-primary text-sm">
            <Plus className="w-4 h-4 mr-2" />
            New session
          </button>
        </div>
      )}

      {/* Sessions list */}
      <div className="space-y-3">
        {sessions.map((session) => {
          const sessionTerms = termsBySession[session.id] || [];
          const isExpanded = expandedSession === session.id;

          return (
            <div key={session.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              {/* Session header */}
              <div
                onClick={() => setExpandedSession(isExpanded ? null : session.id)}
                className={`p-4 lg:p-5 cursor-pointer hover:bg-gray-50 transition-colors ${
                  session.is_current ? 'bg-gradient-to-r from-indigo-50 to-white border-l-4 border-indigo' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    session.is_current ? 'bg-indigo text-white' : 'bg-gray-100 text-gray-500'
                  }`}>
                    <Calendar className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-900 text-base">{session.name}</h3>
                      {session.is_current && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo text-white text-[10px] font-semibold rounded-full uppercase">
                          <Star className="w-2.5 h-2.5" />
                          Current
                        </span>
                      )}
                      {session.is_closed && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-200 text-gray-700 text-[10px] font-semibold rounded-full uppercase">
                          <Lock className="w-2.5 h-2.5" />
                          Closed
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {formatDate(session.start_date)} → {formatDate(session.end_date)} · {sessionTerms.length} term{sessionTerms.length !== 1 ? 's' : ''}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    {!session.is_current && !session.is_closed && (
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleCurrentSession(session.id); }}
                        disabled={loading}
                        className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-indigo hover:bg-indigo-50 rounded-md transition-colors"
                        title="Make current"
                      >
                        <Star className="w-3.5 h-3.5" />
                        Set current
                      </button>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); setSessionModal({ open: true, session }); }}
                      className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {!session.is_current && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteConfirm({ type: 'session', id: session.id, name: session.name }); }}
                        className="p-2 text-gray-400 hover:text-error hover:bg-red-50 rounded-md transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    {isExpanded ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
                  </div>
                </div>
              </div>

              {/* Terms (expanded) */}
              {isExpanded && (
                <div className="border-t border-gray-100 bg-gray-50/50 p-4 lg:p-5">
                  {sessionTerms.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 border border-gray-200">
                        <CalendarDays className="w-6 h-6 text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-600 mb-3">No terms yet in this session</p>
                      <button
                        onClick={() => setTermModal({ open: true, sessionId: session.id })}
                        className="btn-primary text-sm"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add first term
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Terms</h4>
                        <button
                          onClick={() => setTermModal({ open: true, sessionId: session.id })}
                          className="text-xs font-medium text-indigo hover:underline flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add term
                        </button>
                      </div>
                      <div className="space-y-2">
                        {sessionTerms.map((term) => (
                          <div
                            key={term.id}
                            className={`bg-white rounded-lg border p-3 lg:p-4 flex items-center gap-3 ${
                              term.is_current ? 'border-indigo shadow-sm' : 'border-gray-200'
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                              term.is_current ? 'bg-indigo text-white' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {term.sequence}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h5 className="font-medium text-gray-900 text-sm">{term.name}</h5>
                                {term.is_current && (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-indigo/10 text-indigo text-[9px] font-semibold rounded uppercase">
                                    Current
                                  </span>
                                )}
                                {term.is_closed && (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-gray-200 text-gray-700 text-[9px] font-semibold rounded uppercase">
                                    Closed
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-gray-500 mt-0.5">
                                {formatDate(term.start_date)} → {formatDate(term.end_date)}
                                {term.resumption_date && ` · Resumes ${daysUntil(term.resumption_date)}`}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {!term.is_current && !term.is_closed && (
                                <button
                                  onClick={() => toggleCurrentTerm(term.id)}
                                  disabled={loading}
                                  className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-indigo hover:bg-indigo-50 rounded transition-colors"
                                >
                                  <Star className="w-3 h-3" />
                                  Set current
                                </button>
                              )}
                              <button
                                onClick={() => setTermModal({ open: true, term, sessionId: session.id })}
                                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              {!term.is_current && (
                                <button
                                  onClick={() => setDeleteConfirm({ type: 'term', id: term.id, name: term.name })}
                                  className="p-1.5 text-gray-400 hover:text-error hover:bg-red-50 rounded transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Session modal */}
      {sessionModal.open && (
        <SessionModal
          session={sessionModal.session}
          schoolId={schoolId}
          onClose={() => setSessionModal({ open: false })}
          onSaved={async () => { await refreshData(); setSessionModal({ open: false }); showToast('success', 'Session saved'); }}
          onError={(msg: string) => showToast('error', msg)}
        />
      )}

      {/* Term modal */}
      {termModal.open && termModal.sessionId && (
        <TermModal
          term={termModal.term}
          sessionId={termModal.sessionId}
          schoolId={schoolId}
          existingTermsInSession={termsBySession[termModal.sessionId] || []}
          onClose={() => setTermModal({ open: false })}
          onSaved={async () => { await refreshData(); setTermModal({ open: false }); showToast('success', 'Term saved'); }}
          onError={(msg: string) => showToast('error', msg)}
        />
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-error" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Delet {deleteConfirm.type}?</h3>
                <p className="text-sm text-gray-500 mt-1">
                  <strong>{deleteConfirm.name}</strong> will be permanently removed.
                  {deleteConfirm.type === 'session' && ' All terms and related data will also be deleted.'}
                </p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setDeleteConfirm(null)} className="btn-secondary text-sm">Cancel</button>
              <button onClick={handleDelete} disabled={loading} className="px-4 py-2 bg-error text-white rounded-md text-sm font-medium hover:bg-red-600 transition-colors">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-20 lg:bottom-6 right-4 left-4 sm:left-auto z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg animate-slide-in-top ${
          toast.type === 'success' ? 'bg-success text-white' : 'bg-error text-white'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}
    </div>
  );
}

// ============= SESSION MODAL =============
function SessionModal({ session, schoolId, onClose, onSaved, onError }: any) {
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: session?.name || '',
    start_date: session?.start_date || '',
    end_date: session?.end_date || '',
    is_current: session?.is_current || false,
    notes: session?.notes || '',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, school_id: schoolId };
      const { error } = session
        ? await supabase.from('sessions').update(payload).eq('id', session.id)
        : await supabase.from('sessions').insert(payload);
      if (error) throw error;
      onSaved();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Save failed');
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="bg-white sm:rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white">
          <h3 className="font-semibold text-gray-900">{session ? 'Edit session' : 'New session'}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-md">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="label">Session name *</label>
            <input
              type="text"
              required
              placeholder="e.g. 2025/2026"
              className="input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <p className="text-xs text-gray-500 mt-1">Nigerian convention: "2025/2026" for a session spanning two calendar years</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Start date *</label>
              <input
                type="date"
                required
                className="input"
                value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
              />
            </div>
            <div>
              <label className="label">End date *</label>
              <input
                type="date"
                required
                className="input"
                value={form.end_date}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="label">Notes (optional)</label>
            <textarea
              rows={2}
              className="input"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>

          <label className="flex items-start gap-3 p-3 bg-indigo-50 rounded-lg cursor-pointer border border-indigo-100">
            <input
              type="checkbox"
              className="mt-0.5 accent-indigo"
              checked={form.is_current}
              onChange={(e) => setForm({ ...form, is_current: e.target.checked })}
            />
            <div className="flex-1">
              <div className="text-sm font-medium text-indigo-dark">Make this the current session</div>
              <div className="text-xs text-gray-600 mt-0.5">
                Attendance, fees, grades will default to this session. Only one session can be current.
              </div>
            </div>
          </label>

          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={onClose} className="btn-secondary text-sm">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary text-sm">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : (session ? 'Save changes' : 'Create session')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============= TERM MODAL =============
function TermModal({ term, sessionId, schoolId, existingTermsInSession, onClose, onSaved, onError }: any) {
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const nextSequence = term?.sequence || (existingTermsInSession.length + 1);

  const [form, setForm] = useState({
    name: term?.name || `${nextSequence === 1 ? 'First' : nextSequence === 2 ? 'Second' : 'Third'} Term`,
    short_name: term?.short_name || '',
    sequence: term?.sequence || nextSequence,
    start_date: term?.start_date || '',
    end_date: term?.end_date || '',
    resumption_date: term?.resumption_date || '',
    vacation_date: term?.vacation_date || '',
    mid_term_break_start: term?.mid_term_break_start || '',
    mid_term_break_end: term?.mid_term_break_end || '',
    is_current: term?.is_current || false,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: any = {
        ...form,
        school_id: schoolId,
        session_id: sessionId,
        resumption_date: form.resumption_date || null,
        vacation_date: form.vacation_date || null,
        mid_term_break_start: form.mid_term_break_start || null,
        mid_term_break_end: form.mid_term_break_end || null,
        short_name: form.short_name || null,
      };
      const { error } = term
        ? await supabase.from('terms').update(payload).eq('id', term.id)
        : await supabase.from('terms').insert(payload);
      if (error) throw error;
      onSaved();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Save failed');
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="bg-white sm:rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white">
          <h3 className="font-semibold text-gray-900">{term ? 'Edit term' : 'New term'}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-md">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="label">Term name *</label>
              <input
                type="text"
                required
                className="input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Order *</label>
              <input
                type="number"
                required
                min="1"
                max="4"
                className="input"
                value={form.sequence}
                onChange={(e) => setForm({ ...form, sequence: parseInt(e.target.value) })}
              />
            </div>
          </div>

          <div>
            <label className="label">Short name (optional)</label>
            <input
              type="text"
              placeholder="e.g. T1"
              className="input"
              value={form.short_name}
              onChange={(e) => setForm({ ...form, short_name: e.target.value })}
            />
          </div>

          <div className="pt-2 border-t border-gray-100">
            <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">Term dates</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label">Start date *</label>
                <input type="date" required className="input"
                  value={form.start_date}
                  onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
              </div>
              <div>
                <label className="label">End date *</label>
                <input type="date" required className="input"
                  value={form.end_date}
                  onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
              </div>
              <div>
                <label className="label">Resumption date</label>
                <input type="date" className="input"
                  value={form.resumption_date}
                  onChange={(e) => setForm({ ...form, resumption_date: e.target.value })} />
                <p className="text-[10px] text-gray-500 mt-0.5">First day students report</p>
              </div>
              <div>
                <label className="label">Vacation date</label>
                <input type="date" className="input"
                  value={form.vacation_date}
                  onChange={(e) => setForm({ ...form, vacation_date: e.target.value })} />
                <p className="text-[10px] text-gray-500 mt-0.5">Last day of school</p>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-gray-100">
            <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">Mid-term break (optional)</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label">Break starts</label>
                <input type="date" className="input"
                  value={form.mid_term_break_start}
                  onChange={(e) => setForm({ ...form, mid_term_break_start: e.target.value })} />
              </div>
              <div>
                <label className="label">Break ends</label>
                <input type="date" className="input"
                  value={form.mid_term_break_end}
                  onChange={(e) => setForm({ ...form, mid_term_break_end: e.target.value })} />
              </div>
            </div>
          </div>

          <label className="flex items-start gap-3 p-3 bg-indigo-50 rounded-lg cursor-pointer border border-indigo-100">
            <input type="checkbox" className="mt-0.5 accent-indigo"
              checked={form.is_current}
              onChange={(e) => setForm({ ...form, is_current: e.target.checked })} />
            <div className="flex-1">
              <div className="text-sm font-medium text-indigo-dark">Make this the current term</div>
              <div className="text-xs text-gray-600 mt-0.5">Only one term can be current at a time.</div>
            </div>
          </label>

          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={onClose} className="btn-secondary text-sm">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary text-sm">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : (term ? 'Save changes' : 'Create term')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
