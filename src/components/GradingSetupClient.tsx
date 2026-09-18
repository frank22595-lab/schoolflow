'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Award, BookOpen, ClipboardList, Sparkles, Check, X,
  Loader2, Plus, Trash2, AlertCircle, CheckCircle2, Info,
  ChevronRight, GraduationCap, Palette,
} from 'lucide-react';

interface Props {
  schoolId: string;
  scales: any[];
  bands: any[];
  assessments: any[];
  subjects: any[];
  classSubjects: any[];
  classLevels: any[];
  isEmpty: boolean;
}

export default function GradingSetupClient({ schoolId, scales, bands, assessments, subjects, classSubjects, classLevels, isEmpty }: Props) {
  const router = useRouter();
  const [seeding, setSeeding] = useState(false);
  const [tab, setTab] = useState<'scale' | 'assessments' | 'subjects' | 'assign'>('scale');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  function showToast(type: 'success' | 'error', msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  }

  async function runSetupWizard() {
    if (!confirm('This will add the WAEC grading scale, standard assessments (CA1/CA2/Exam), and Nigerian standard subjects. Continue?')) return;
    setSeeding(true);
    try {
      const res = await fetch('/api/grading/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schoolId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast('success', `Setup complete! Added ${data.subjects_added} subjects and grade scale.`);
      router.refresh();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Setup failed');
    } finally {
      setSeeding(false);
    }
  }

  if (isEmpty) {
    return (
      <>
        <div className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 border-2 border-indigo-100 rounded-2xl p-6 lg:p-10 text-center">
          <div className="w-16 h-16 mx-auto bg-indigo rounded-2xl flex items-center justify-center mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">One-click setup</h2>
          <p className="text-sm text-gray-600 mt-2 max-w-md mx-auto">
            We'll set up the WAEC grading scale, standard CA1/CA2/Exam assessments, and 32 common Nigerian subjects. Everything is editable afterwards.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto mt-6 text-left">
            <div className="p-3 bg-white rounded-lg border border-gray-200">
              <Award className="w-5 h-5 text-warning mb-2" />
              <div className="font-semibold text-sm">Grade Scale</div>
              <div className="text-xs text-gray-500 mt-1">A1–F9 (WAEC standard)</div>
            </div>
            <div className="p-3 bg-white rounded-lg border border-gray-200">
              <ClipboardList className="w-5 h-5 text-success mb-2" />
              <div className="font-semibold text-sm">Assessments</div>
              <div className="text-xs text-gray-500 mt-1">CA1 (20) + CA2 (20) + Exam (60)</div>
            </div>
            <div className="p-3 bg-white rounded-lg border border-gray-200">
              <BookOpen className="w-5 h-5 text-indigo mb-2" />
              <div className="font-semibold text-sm">Subjects</div>
              <div className="text-xs text-gray-500 mt-1">32 Nigerian standard subjects</div>
            </div>
          </div>

          <button onClick={runSetupWizard} disabled={seeding}
            className="mt-6 px-6 py-3 bg-indigo hover:bg-indigo-dark text-white rounded-lg font-semibold shadow-lg shadow-indigo/30 disabled:opacity-50 inline-flex items-center gap-2">
            {seeding ? <><Loader2 className="w-5 h-5 animate-spin" />Setting up...</> : <><Sparkles className="w-5 h-5" />Run one-click setup</>}
          </button>

          <p className="text-[11px] text-gray-500 mt-4">
            You'll be able to edit everything, add/remove items, and assign subjects to each class level.
          </p>
        </div>
        {toast && <Toast toast={toast} />}
      </>
    );
  }

  const defaultScale = scales.find(s => s.is_default) || scales[0];
  const defaultBands = bands.filter(b => b.grade_scale_id === defaultScale?.id);

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-100 overflow-x-auto">
          {[
            { id: 'scale', label: 'Grade scale', icon: Award, count: defaultBands.length },
            { id: 'assessments', label: 'Assessments', icon: ClipboardList, count: assessments.length },
            { id: 'subjects', label: 'Subjects', icon: BookOpen, count: subjects.length },
            { id: 'assign', label: 'Assign to classes', icon: GraduationCap, count: classSubjects.length },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id as any)}
              className={`flex-1 min-w-[110px] px-3 py-3 flex flex-col items-center gap-1 text-xs font-medium transition-colors ${
                tab === t.id ? 'bg-indigo-50 text-indigo border-b-2 border-indigo' : 'text-gray-500 hover:bg-gray-50'
              }`}>
              <t.icon className="w-4 h-4" />
              <span>{t.label}</span>
              <span className="text-[10px] bg-gray-100 text-gray-600 rounded-full px-1.5">{t.count}</span>
            </button>
          ))}
        </div>
      </div>

      {tab === 'scale' && <ScaleTab scale={defaultScale} bands={defaultBands} schoolId={schoolId} onDone={() => { showToast('success', 'Saved'); router.refresh(); }} onErr={(m) => showToast('error', m)} />}
      {tab === 'assessments' && <AssessmentsTab assessments={assessments} schoolId={schoolId} onDone={() => { showToast('success', 'Saved'); router.refresh(); }} onErr={(m) => showToast('error', m)} />}
      {tab === 'subjects' && <SubjectsTab subjects={subjects} schoolId={schoolId} onDone={() => { showToast('success', 'Saved'); router.refresh(); }} onErr={(m) => showToast('error', m)} />}
      {tab === 'assign' && <AssignTab classLevels={classLevels} subjects={subjects} classSubjects={classSubjects} schoolId={schoolId} onDone={() => { showToast('success', 'Saved'); router.refresh(); }} onErr={(m) => showToast('error', m)} />}

      {toast && <Toast toast={toast} />}
    </div>
  );
}

// ============ SCALE TAB ============
function ScaleTab({ scale, bands, schoolId, onDone, onErr }: any) {
  const [rows, setRows] = useState(bands.map((b: any) => ({ ...b })));
  const [saving, setSaving] = useState(false);
  const colors = ['emerald', 'sky', 'indigo', 'amber', 'red', 'purple', 'gray'];

  function update(i: number, field: string, value: any) {
    setRows((r: any) => r.map((row: any, idx: number) => idx === i ? { ...row, [field]: value } : row));
  }

  function addRow() {
    setRows((r: any) => [...r, { grade: '', min_score: 0, max_score: 0, remark: '', color: 'gray', sequence: r.length + 1 }]);
  }

  function removeRow(i: number) {
    setRows((r: any) => r.filter((_: any, idx: number) => idx !== i));
  }

  async function save() {
    setSaving(true);
    try {
      const res = await fetch('/api/grading/scale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schoolId, scaleId: scale.id, bands: rows }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onDone();
    } catch (err) {
      onErr(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 lg:p-6 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-gray-900 flex items-center gap-2"><Award className="w-4 h-4 text-warning" />{scale?.name}</h3>
          <p className="text-xs text-gray-500 mt-0.5">Edit grade ranges, remarks, and colors</p>
        </div>
      </div>

      <div className="overflow-x-auto -mx-4 lg:-mx-6 px-4 lg:px-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[10px] text-gray-500 uppercase border-b border-gray-100">
              <th className="py-2 px-2 font-semibold">Grade</th>
              <th className="py-2 px-2 font-semibold">Min</th>
              <th className="py-2 px-2 font-semibold">Max</th>
              <th className="py-2 px-2 font-semibold">Remark</th>
              <th className="py-2 px-2 font-semibold">Color</th>
              <th className="py-2 px-2 w-8"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r: any, i: number) => (
              <tr key={i} className="border-b border-gray-50">
                <td className="py-1.5 px-2">
                  <input className="input font-mono font-bold text-sm w-16" value={r.grade} onChange={(e) => update(i, 'grade', e.target.value)} />
                </td>
                <td className="py-1.5 px-2">
                  <input type="number" step="0.01" className="input text-sm w-20" value={r.min_score} onChange={(e) => update(i, 'min_score', parseFloat(e.target.value))} />
                </td>
                <td className="py-1.5 px-2">
                  <input type="number" step="0.01" className="input text-sm w-20" value={r.max_score} onChange={(e) => update(i, 'max_score', parseFloat(e.target.value))} />
                </td>
                <td className="py-1.5 px-2">
                  <input className="input text-sm" value={r.remark || ''} onChange={(e) => update(i, 'remark', e.target.value)} />
                </td>
                <td className="py-1.5 px-2">
                  <select className="input text-sm w-24" value={r.color} onChange={(e) => update(i, 'color', e.target.value)}>
                    {colors.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </td>
                <td className="py-1.5 px-2">
                  <button onClick={() => removeRow(i)} className="p-1 text-gray-400 hover:text-error"><Trash2 className="w-3.5 h-3.5" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between gap-2 pt-2">
        <button onClick={addRow} className="btn-secondary text-sm"><Plus className="w-4 h-4 mr-1" />Add grade</button>
        <button onClick={save} disabled={saving} className="btn-primary text-sm">
          {saving ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" />Saving...</> : 'Save changes'}
        </button>
      </div>
    </div>
  );
}

// ============ ASSESSMENTS TAB ============
function AssessmentsTab({ assessments, schoolId, onDone, onErr }: any) {
  const [rows, setRows] = useState(assessments.map((a: any) => ({ ...a })));
  const [saving, setSaving] = useState(false);

  const total = rows.reduce((sum: number, r: any) => sum + (parseFloat(r.max_score) || 0), 0);

  function update(i: number, field: string, value: any) {
    setRows((r: any) => r.map((row: any, idx: number) => idx === i ? { ...row, [field]: value } : row));
  }
  function addRow() {
    setRows((r: any) => [...r, { name: '', short_code: '', max_score: 20, sequence: r.length + 1, is_exam: false, is_active: true }]);
  }
  function removeRow(i: number) {
    setRows((r: any) => r.filter((_: any, idx: number) => idx !== i));
  }

  async function save() {
    if (total !== 100) {
      if (!confirm(`Assessments total ${total} (not 100). Continue anyway?`)) return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/grading/scale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schoolId, assessments: rows }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onDone();
    } catch (err) {
      onErr(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 lg:p-6 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-gray-900 flex items-center gap-2"><ClipboardList className="w-4 h-4 text-success" />Assessment types</h3>
          <p className="text-xs text-gray-500 mt-0.5">Define what teachers score (CA1, CA2, Exam, etc.)</p>
        </div>
        <div className={`text-sm font-bold ${total === 100 ? 'text-success' : 'text-warning'}`}>
          Total: {total}/100
        </div>
      </div>

      <div className="overflow-x-auto -mx-4 lg:-mx-6 px-4 lg:px-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[10px] text-gray-500 uppercase border-b border-gray-100">
              <th className="py-2 px-2 font-semibold">Name</th>
              <th className="py-2 px-2 font-semibold">Code</th>
              <th className="py-2 px-2 font-semibold">Max Score</th>
              <th className="py-2 px-2 font-semibold">Exam?</th>
              <th className="py-2 px-2 w-8"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r: any, i: number) => (
              <tr key={i} className="border-b border-gray-50">
                <td className="py-1.5 px-2"><input className="input text-sm" value={r.name} onChange={(e) => update(i, 'name', e.target.value)} /></td>
                <td className="py-1.5 px-2"><input className="input font-mono text-sm w-20" value={r.short_code} onChange={(e) => update(i, 'short_code', e.target.value.toUpperCase())} /></td>
                <td className="py-1.5 px-2"><input type="number" step="0.01" className="input text-sm w-24" value={r.max_score} onChange={(e) => update(i, 'max_score', parseFloat(e.target.value))} /></td>
                <td className="py-1.5 px-2 text-center"><input type="checkbox" className="accent-indigo" checked={r.is_exam} onChange={(e) => update(i, 'is_exam', e.target.checked)} /></td>
                <td className="py-1.5 px-2"><button onClick={() => removeRow(i)} className="p-1 text-gray-400 hover:text-error"><Trash2 className="w-3.5 h-3.5" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between gap-2 pt-2">
        <button onClick={addRow} className="btn-secondary text-sm"><Plus className="w-4 h-4 mr-1" />Add assessment</button>
        <button onClick={save} disabled={saving} className="btn-primary text-sm">
          {saving ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" />Saving...</> : 'Save changes'}
        </button>
      </div>

      {total !== 100 && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2 text-xs text-amber-800">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          Assessment max scores should sum to 100 for standard grading. Currently: {total}.
        </div>
      )}
    </div>
  );
}

// ============ SUBJECTS TAB ============
function SubjectsTab({ subjects, schoolId, onDone, onErr }: any) {
  const [rows, setRows] = useState(subjects.map((s: any) => ({ ...s })));
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState('');

  const categories = ['core', 'elective', 'vocational', 'language', 'science', 'arts', 'commercial'];

  function update(i: number, field: string, value: any) {
    setRows((r: any) => r.map((row: any, idx: number) => idx === i ? { ...row, [field]: value } : row));
  }
  function addRow() {
    setRows((r: any) => [...r, { name: '', code: '', category: 'core', is_active: true, sequence: r.length + 1, _new: true }]);
  }
  function removeRow(i: number) {
    setRows((r: any) => r.filter((_: any, idx: number) => idx !== i));
  }

  const filtered = filter ? rows.filter((r: any) => r.name.toLowerCase().includes(filter.toLowerCase()) || r.code?.toLowerCase().includes(filter.toLowerCase())) : rows;

  async function save() {
    setSaving(true);
    try {
      const res = await fetch('/api/grading/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schoolId, subjects: rows }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onDone();
    } catch (err) {
      onErr(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 lg:p-6 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-gray-900 flex items-center gap-2"><BookOpen className="w-4 h-4 text-indigo" />Subjects ({rows.length})</h3>
          <p className="text-xs text-gray-500 mt-0.5">Master list of all subjects your school teaches</p>
        </div>
        <input placeholder="Filter..." className="input text-sm w-32 sm:w-48" value={filter} onChange={(e) => setFilter(e.target.value)} />
      </div>

      <div className="overflow-x-auto -mx-4 lg:-mx-6 px-4 lg:px-6 max-h-[500px] overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-white z-10">
            <tr className="text-left text-[10px] text-gray-500 uppercase border-b border-gray-100">
              <th className="py-2 px-2 font-semibold">Name</th>
              <th className="py-2 px-2 font-semibold">Code</th>
              <th className="py-2 px-2 font-semibold">Category</th>
              <th className="py-2 px-2 font-semibold">Active</th>
              <th className="py-2 px-2 w-8"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r: any, i: number) => {
              const origIdx = rows.indexOf(r);
              return (
                <tr key={r.id || `new-${i}`} className="border-b border-gray-50">
                  <td className="py-1.5 px-2"><input className="input text-sm" value={r.name} onChange={(e) => update(origIdx, 'name', e.target.value)} /></td>
                  <td className="py-1.5 px-2"><input className="input font-mono text-sm w-20" value={r.code || ''} onChange={(e) => update(origIdx, 'code', e.target.value.toUpperCase())} /></td>
                  <td className="py-1.5 px-2">
                    <select className="input text-sm" value={r.category} onChange={(e) => update(origIdx, 'category', e.target.value)}>
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </td>
                  <td className="py-1.5 px-2 text-center"><input type="checkbox" className="accent-indigo" checked={r.is_active} onChange={(e) => update(origIdx, 'is_active', e.target.checked)} /></td>
                  <td className="py-1.5 px-2"><button onClick={() => removeRow(origIdx)} className="p-1 text-gray-400 hover:text-error"><Trash2 className="w-3.5 h-3.5" /></button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between gap-2 pt-2">
        <button onClick={addRow} className="btn-secondary text-sm"><Plus className="w-4 h-4 mr-1" />Add subject</button>
        <button onClick={save} disabled={saving} className="btn-primary text-sm">
          {saving ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" />Saving...</> : 'Save changes'}
        </button>
      </div>
    </div>
  );
}

// ============ ASSIGN TAB — subjects per class level ============
function AssignTab({ classLevels, subjects, classSubjects, schoolId, onDone, onErr }: any) {
  const [assignments, setAssignments] = useState(() => {
    const map: Record<string, Set<string>> = {};
    classLevels.forEach((l: any) => { map[l.id] = new Set(); });
    classSubjects.forEach((cs: any) => {
      if (!map[cs.class_level_id]) map[cs.class_level_id] = new Set();
      map[cs.class_level_id].add(cs.subject_id);
    });
    return map;
  });
  const [saving, setSaving] = useState(false);
  const [activeLevel, setActiveLevel] = useState<string | null>(classLevels[0]?.id || null);

  function toggle(levelId: string, subjectId: string) {
    setAssignments((a: any) => {
      const next = { ...a };
      const set = new Set(next[levelId]);
      if (set.has(subjectId)) set.delete(subjectId);
      else set.add(subjectId);
      next[levelId] = set;
      return next;
    });
  }

  async function save() {
    setSaving(true);
    try {
      const payload = Object.entries(assignments).map(([levelId, subjectIds]: any) => ({
        classLevelId: levelId,
        subjectIds: Array.from(subjectIds),
      }));
      const res = await fetch('/api/grading/subjects', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schoolId, assignments: payload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onDone();
    } catch (err) {
      onErr(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  if (classLevels.length === 0) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 flex items-start gap-2">
        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
        No class levels found. Set them up in Classes settings first.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 lg:p-6 space-y-4">
      <div>
        <h3 className="font-semibold text-gray-900 flex items-center gap-2"><GraduationCap className="w-4 h-4 text-success" />Assign subjects to classes</h3>
        <p className="text-xs text-gray-500 mt-0.5">Pick which subjects each class level offers</p>
      </div>

      {/* Level pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 lg:-mx-6 px-4 lg:px-6">
        {classLevels.map((l: any) => {
          const count = assignments[l.id]?.size || 0;
          const active = activeLevel === l.id;
          return (
            <button key={l.id} onClick={() => setActiveLevel(l.id)}
              className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap flex items-center gap-2 border-2 transition-all ${
                active ? 'border-indigo bg-indigo text-white' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              }`}>
              {l.name}
              <span className={`text-[10px] px-1.5 rounded-full ${active ? 'bg-white/20' : 'bg-gray-100'}`}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Subject grid */}
      {activeLevel && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {subjects.map((s: any) => {
            const selected = assignments[activeLevel]?.has(s.id);
            return (
              <button key={s.id} onClick={() => toggle(activeLevel, s.id)}
                className={`p-3 rounded-lg border-2 text-left transition-all ${
                  selected ? 'border-indigo bg-indigo-50' : 'border-gray-200 bg-white hover:border-gray-300'
                }`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm text-gray-900 truncate">{s.name}</div>
                    <div className="text-[10px] text-gray-500 mt-0.5 uppercase">{s.category}</div>
                  </div>
                  <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${selected ? 'bg-indigo' : 'bg-gray-100'}`}>
                    {selected && <Check className="w-3 h-3 text-white" />}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
        <button onClick={save} disabled={saving} className="btn-primary text-sm">
          {saving ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" />Saving...</> : 'Save assignments'}
        </button>
      </div>
    </div>
  );
}

function Toast({ toast }: any) {
  return (
    <div className={`fixed bottom-20 lg:bottom-6 right-4 left-4 sm:left-auto z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg ${
      toast.type === 'success' ? 'bg-success text-white' : 'bg-error text-white'
    }`}>
      {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
      <span className="text-sm font-medium">{toast.msg}</span>
    </div>
  );
}
