'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  BookOpen, ClipboardList, Award, Plus, Edit2, Trash2, Loader2, X,
  Wand2, Sparkles, AlertCircle, CheckCircle2, Star, Percent,
} from 'lucide-react';

interface Subject {
  id: string;
  name: string;
  short_name?: string;
  code?: string;
  category: string;
  department?: string;
  is_active: boolean;
}

interface GradingScale {
  id: string;
  name: string;
  scale_type: string;
  is_default: boolean;
  max_score: number;
  min_pass_score: number;
  description?: string;
  is_active: boolean;
}

interface GradeBoundary {
  id: string;
  scale_id: string;
  grade_label: string;
  min_score: number;
  max_score: number;
  grade_point?: number;
  remark?: string;
  is_pass: boolean;
  color?: string;
  sort_order: number;
}

interface AssessmentComponent {
  id: string;
  name: string;
  short_code?: string;
  category: string;
  default_max_score: number;
  default_weight: number;
  sort_order: number;
  is_active: boolean;
}

interface Props {
  schoolId: string;
  levelsOffered: string[];
  initialSubjects: Subject[];
  initialScales: GradingScale[];
  initialBoundaries: GradeBoundary[];
  initialComponents: AssessmentComponent[];
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  core: { bg: 'bg-indigo-50', text: 'text-indigo' },
  elective: { bg: 'bg-purple-50', text: 'text-purple-700' },
  vocational: { bg: 'bg-amber-50', text: 'text-amber-700' },
  extra_curricular: { bg: 'bg-sky-50', text: 'text-sky-700' },
};

const DEPARTMENT_COLORS: Record<string, string> = {
  Science: 'bg-emerald-100 text-emerald-700',
  Arts: 'bg-purple-100 text-purple-700',
  Commercial: 'bg-amber-100 text-amber-700',
  Language: 'bg-sky-100 text-sky-700',
  Religion: 'bg-pink-100 text-pink-700',
  Vocational: 'bg-orange-100 text-orange-700',
  Sports: 'bg-red-100 text-red-700',
};

export default function SubjectsClient({
  schoolId, levelsOffered, initialSubjects, initialScales, initialBoundaries, initialComponents,
}: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [tab, setTab] = useState<'subjects' | 'scales' | 'components'>('subjects');
  const [subjects, setSubjects] = useState<Subject[]>(initialSubjects);
  const [scales, setScales] = useState<GradingScale[]>(initialScales);
  const [boundaries, setBoundaries] = useState<GradeBoundary[]>(initialBoundaries);
  const [components, setComponents] = useState<AssessmentComponent[]>(initialComponents);

  const [subjectModal, setSubjectModal] = useState<{ open: boolean; subject?: Subject }>({ open: false });
  const [scaleModal, setScaleModal] = useState<{ open: boolean; scale?: GradingScale }>({ open: false });
  const [componentModal, setComponentModal] = useState<{ open: boolean; component?: AssessmentComponent }>({ open: false });
  const [deleteConfirm, setDeleteConfirm] = useState<{ table: string; id: string; name: string } | null>(null);

  const [loading, setLoading] = useState(false);
  const [seedingSubjects, setSeedingSubjects] = useState(false);
  const [seedingWaec, setSeedingWaec] = useState(false);
  const [seedingComponents, setSeedingComponents] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  function showToast(type: 'success' | 'error', message: string) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  }

  async function refreshAll() {
    const [sub, sc, bd, cp] = await Promise.all([
      supabase.from('subjects').select('*').eq('school_id', schoolId).order('name'),
      supabase.from('grading_scales').select('*').eq('school_id', schoolId).order('name'),
      supabase.from('grade_boundaries').select('*').eq('school_id', schoolId).order('sort_order'),
      supabase.from('assessment_components').select('*').eq('school_id', schoolId).order('sort_order'),
    ]);
    setSubjects(sub.data || []);
    setScales(sc.data || []);
    setBoundaries(bd.data || []);
    setComponents(cp.data || []);
    router.refresh();
  }

  async function autoSeedSubjects() {
    if (levelsOffered.length === 0) {
      showToast('error', 'Set levels offered in School Profile first');
      return;
    }
    setSeedingSubjects(true);
    try {
      const { error } = await supabase.rpc('seed_common_subjects', {
        p_school_id: schoolId, p_categories: levelsOffered,
      });
      if (error) throw error;
      await refreshAll();
      showToast('success', 'Nigerian standard subjects added');
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Auto-seed failed');
    } finally { setSeedingSubjects(false); }
  }

  async function autoSeedWaecScale() {
    setSeedingWaec(true);
    try {
      const { error } = await supabase.rpc('seed_waec_grading_scale', { p_school_id: schoolId });
      if (error) throw error;
      await refreshAll();
      showToast('success', 'WAEC A1-F9 scale created and set as default');
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Failed');
    } finally { setSeedingWaec(false); }
  }

  async function autoSeedPercentageScale() {
    setSeedingWaec(true);
    try {
      const { error } = await supabase.rpc('seed_percentage_grading_scale', { p_school_id: schoolId });
      if (error) throw error;
      await refreshAll();
      showToast('success', 'Percentage A-F scale added');
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Failed');
    } finally { setSeedingWaec(false); }
  }

  async function autoSeedComponents() {
    setSeedingComponents(true);
    try {
      const { error } = await supabase.rpc('seed_common_assessment_components', { p_school_id: schoolId });
      if (error) throw error;
      await refreshAll();
      showToast('success', 'Standard components created (CA1, CA2, Assignment, Project, Exam)');
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Failed');
    } finally { setSeedingComponents(false); }
  }

  async function toggleDefaultScale(id: string) {
    setLoading(true);
    try {
      const { error } = await supabase.from('grading_scales').update({ is_default: true }).eq('id', id);
      if (error) throw error;
      await refreshAll();
      showToast('success', 'Default scale updated');
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Failed');
    } finally { setLoading(false); }
  }

  async function handleDelete() {
    if (!deleteConfirm) return;
    setLoading(true);
    try {
      const { error } = await supabase.from(deleteConfirm.table).delete().eq('id', deleteConfirm.id);
      if (error) throw error;
      await refreshAll();
      showToast('success', 'Deleted');
      setDeleteConfirm(null);
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Delete failed');
    } finally { setLoading(false); }
  }

  const subjectsByDept = subjects.reduce((acc, s) => {
    const dept = s.department || 'Other';
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(s);
    return acc;
  }, {} as Record<string, Subject[]>);

  const totalWeight = components.reduce((sum, c) => sum + Number(c.default_weight), 0);

  const tabs = [
    { id: 'subjects' as const, label: 'Subjects', icon: BookOpen, count: subjects.length },
    { id: 'scales' as const, label: 'Grading Scales', icon: Award, count: scales.length },
    { id: 'components' as const, label: 'Assessment Components', icon: ClipboardList, count: components.length },
  ];

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-1 overflow-x-auto -mb-px">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                tab === t.id ? 'border-indigo text-indigo-dark' : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}>
              <t.icon className="w-4 h-4" />
              {t.label}
              <span className={`text-xs px-1.5 py-0.5 rounded ${
                tab === t.id ? 'bg-indigo-50 text-indigo' : 'bg-gray-100 text-gray-500'
              }`}>{t.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ============ SUBJECTS TAB ============ */}
      {tab === 'subjects' && (
        <div className="space-y-4">
          {subjects.length === 0 ? (
            <div className="bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 rounded-xl p-4 lg:p-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-indigo rounded-lg flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">Add your subjects</h3>
                  <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                    Based on the levels you offer, we can add all the common Nigerian K-12 subjects in one click.
                    You can edit or delete any of them afterwards.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={autoSeedSubjects} disabled={seedingSubjects || levelsOffered.length === 0}
                      className="btn-primary text-sm">
                      {seedingSubjects ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Wand2 className="w-4 h-4 mr-2" />}
                      Auto-add Nigerian subjects
                    </button>
                    <button onClick={() => setSubjectModal({ open: true })} className="btn-secondary text-sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Add manually
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Subjects by Department</h2>
                  <p className="text-xs text-gray-500 mt-0.5">{subjects.length} subject{subjects.length !== 1 ? 's' : ''} total</p>
                </div>
                <button onClick={() => setSubjectModal({ open: true })} className="btn-primary text-sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add subject
                </button>
              </div>

              {Object.entries(subjectsByDept).map(([dept, deptSubjects]) => (
                <div key={dept}>
                  <div className={`inline-flex items-center gap-2 px-3 py-1 ${DEPARTMENT_COLORS[dept] || 'bg-gray-100 text-gray-700'} text-xs font-semibold rounded-full mb-2`}>
                    {dept} · {deptSubjects.length}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {deptSubjects.map(s => {
                      const colors = CATEGORY_COLORS[s.category];
                      return (
                        <div key={s.id} className="bg-white rounded-lg border border-gray-200 p-3 hover:shadow-md transition-shadow group">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-[10px] font-bold ${colors?.text || 'text-gray-500'} px-1.5 py-0.5 ${colors?.bg || 'bg-gray-100'} rounded uppercase`}>
                                  {s.short_name || s.name.slice(0, 3).toUpperCase()}
                                </span>
                                {!s.is_active && (
                                  <span className="text-[9px] font-semibold text-gray-400 uppercase">Inactive</span>
                                )}
                              </div>
                              <div className="font-medium text-sm text-gray-900 mt-1 truncate">{s.name}</div>
                              <div className="text-[10px] text-gray-500 mt-0.5 capitalize">{s.category.replace('_', ' ')}</div>
                            </div>
                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                              <button onClick={() => setSubjectModal({ open: true, subject: s })}
                                className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded">
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => setDeleteConfirm({ table: 'subjects', id: s.id, name: s.name })}
                                className="p-1 text-gray-400 hover:text-error hover:bg-red-50 rounded">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* ============ GRADING SCALES TAB ============ */}
      {tab === 'scales' && (
        <div className="space-y-4">
          {scales.length === 0 ? (
            <div className="bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 rounded-xl p-4 lg:p-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-success rounded-lg flex items-center justify-center flex-shrink-0">
                  <Award className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">Set up your grading scale</h3>
                  <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                    A grading scale converts scores (e.g. 75%) into grades (e.g. A1). Nigerian schools typically use WAEC's A1-F9 or a simple A-F scale.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={autoSeedWaecScale} disabled={seedingWaec} className="btn-primary text-sm">
                      {seedingWaec ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Wand2 className="w-4 h-4 mr-2" />}
                      Add WAEC (A1-F9)
                    </button>
                    <button onClick={autoSeedPercentageScale} disabled={seedingWaec} className="btn-secondary text-sm">
                      <Percent className="w-4 h-4 mr-2" />
                      Add Percentage (A-F)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Grading Scales</h2>
                  <p className="text-xs text-gray-500 mt-0.5">The default scale is used unless subjects override it</p>
                </div>
              </div>

              {scales.map(scale => {
                const scaleBounds = boundaries.filter(b => b.scale_id === scale.id);
                return (
                  <div key={scale.id} className={`bg-white rounded-xl border shadow-sm overflow-hidden ${
                    scale.is_default ? 'border-indigo ring-1 ring-indigo/20' : 'border-gray-200'
                  }`}>
                    <div className="p-4 lg:p-5 border-b border-gray-100">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            scale.is_default ? 'bg-indigo text-white' : 'bg-gray-100 text-gray-500'
                          }`}>
                            <Award className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold text-gray-900">{scale.name}</h3>
                              {scale.is_default && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo text-white text-[10px] font-semibold rounded-full uppercase">
                                  <Star className="w-2.5 h-2.5" />
                                  Default
                                </span>
                              )}
                            </div>
                            {scale.description && <p className="text-xs text-gray-500 mt-0.5">{scale.description}</p>}
                            <p className="text-[11px] text-gray-500 mt-0.5">
                              Max: {scale.max_score} · Pass: {scale.min_pass_score} · {scaleBounds.length} grade{scaleBounds.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {!scale.is_default && (
                            <button onClick={() => toggleDefaultScale(scale.id)} disabled={loading}
                              className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-indigo hover:bg-indigo-50 rounded transition-colors">
                              <Star className="w-3.5 h-3.5" />
                              Set default
                            </button>
                          )}
                          <button onClick={() => setDeleteConfirm({ table: 'grading_scales', id: scale.id, name: scale.name })}
                            className="p-2 text-gray-400 hover:text-error hover:bg-red-50 rounded transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Grade boundaries */}
                    <div className="p-3 lg:p-4 bg-gray-50/50">
                      <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2">
                        {scaleBounds.map(b => (
                          <div key={b.id} className="bg-white rounded-md border border-gray-200 p-2 text-center">
                            <div className="w-8 h-8 rounded mx-auto flex items-center justify-center text-white text-xs font-bold mb-1"
                              style={{ backgroundColor: b.color || '#94a3b8' }}>
                              {b.grade_label}
                            </div>
                            <div className="text-[10px] font-medium text-gray-900">{b.min_score}-{b.max_score}</div>
                            <div className="text-[9px] text-gray-500 truncate">{b.remark}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}

              <div className="flex gap-2 flex-wrap">
                {!scales.find(s => s.name.includes('WAEC')) && (
                  <button onClick={autoSeedWaecScale} disabled={seedingWaec} className="btn-secondary text-sm">
                    {seedingWaec ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                    Add WAEC scale
                  </button>
                )}
                {!scales.find(s => s.name.includes('Percentage')) && (
                  <button onClick={autoSeedPercentageScale} disabled={seedingWaec} className="btn-secondary text-sm">
                    {seedingWaec ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                    Add Percentage scale
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ============ ASSESSMENT COMPONENTS TAB ============ */}
      {tab === 'components' && (
        <div className="space-y-4">
          {components.length === 0 ? (
            <div className="bg-gradient-to-br from-amber-50 to-white border border-amber-100 rounded-xl p-4 lg:p-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-warning rounded-lg flex items-center justify-center flex-shrink-0">
                  <ClipboardList className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">Set up assessment components</h3>
                  <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                    These are the parts of a student's total grade (CA1, CA2, Assignment, End of Term Exam, etc.).
                    Standard Nigerian schools use: 2 CAs (10 marks each), Assignment (10), Project (10), Exam (60) = 100 total.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={autoSeedComponents} disabled={seedingComponents} className="btn-primary text-sm">
                      {seedingComponents ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Wand2 className="w-4 h-4 mr-2" />}
                      Add standard components
                    </button>
                    <button onClick={() => setComponentModal({ open: true })} className="btn-secondary text-sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Add manually
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Assessment Components</h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Total weight: <span className={`font-semibold ${totalWeight === 100 ? 'text-success' : 'text-warning'}`}>{totalWeight}%</span>
                    {totalWeight !== 100 && ' — should add to 100%'}
                  </p>
                </div>
                <button onClick={() => setComponentModal({ open: true })} className="btn-primary text-sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add component
                </button>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="hidden sm:grid grid-cols-12 gap-3 px-4 py-3 bg-gray-50 border-b border-gray-200 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                  <div className="col-span-4">Component</div>
                  <div className="col-span-3">Category</div>
                  <div className="col-span-2 text-right">Max score</div>
                  <div className="col-span-2 text-right">Weight</div>
                  <div className="col-span-1"></div>
                </div>
                <div className="divide-y divide-gray-100">
                  {components.map(c => (
                    <div key={c.id} className="p-3 lg:p-4 hover:bg-gray-50 sm:grid sm:grid-cols-12 sm:gap-3 sm:items-center">
                      <div className="col-span-4 flex items-center gap-3">
                        <div className="w-9 h-9 bg-amber-50 rounded-md flex items-center justify-center flex-shrink-0">
                          <ClipboardList className="w-4 h-4 text-warning" />
                        </div>
                        <div>
                          <div className="font-medium text-sm text-gray-900">{c.name}</div>
                          {c.short_code && <div className="text-[10px] text-gray-500">{c.short_code}</div>}
                        </div>
                      </div>
                      <div className="col-span-3 text-xs text-gray-600 capitalize hidden sm:block">
                        {c.category.replace('_', ' ')}
                      </div>
                      <div className="col-span-2 text-xs text-gray-900 text-right hidden sm:block font-medium">
                        {c.default_max_score}
                      </div>
                      <div className="col-span-2 text-xs text-gray-900 text-right hidden sm:block font-medium">
                        {c.default_weight}%
                      </div>
                      <div className="col-span-1 flex items-center gap-1 justify-end mt-2 sm:mt-0">
                        <button onClick={() => setComponentModal({ open: true, component: c })}
                          className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setDeleteConfirm({ table: 'assessment_components', id: c.id, name: c.name })}
                          className="p-1.5 text-gray-400 hover:text-error hover:bg-red-50 rounded">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="sm:hidden text-[10px] text-gray-500 mt-2">
                        {c.category.replace('_', ' ')} · Max {c.default_max_score} · Weight {c.default_weight}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Modals */}
      {subjectModal.open && (
        <SubjectModal subject={subjectModal.subject} schoolId={schoolId}
          onClose={() => setSubjectModal({ open: false })}
          onSaved={async () => { await refreshAll(); setSubjectModal({ open: false }); showToast('success', 'Subject saved'); }}
          onError={(m: string) => showToast('error', m)} />
      )}
      {componentModal.open && (
        <ComponentModal component={componentModal.component} schoolId={schoolId}
          nextSort={components.length + 1}
          onClose={() => setComponentModal({ open: false })}
          onSaved={async () => { await refreshAll(); setComponentModal({ open: false }); showToast('success', 'Component saved'); }}
          onError={(m: string) => showToast('error', m)} />
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-error" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Delete this?</h3>
                <p className="text-sm text-gray-500 mt-1"><strong>{deleteConfirm.name}</strong> will be permanently removed.</p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setDeleteConfirm(null)} className="btn-secondary text-sm">Cancel</button>
              <button onClick={handleDelete} disabled={loading}
                className="px-4 py-2 bg-error text-white rounded-md text-sm font-medium hover:bg-red-600">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

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

// ============= SUBJECT MODAL =============
function SubjectModal({ subject, schoolId, onClose, onSaved, onError }: any) {
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: subject?.name || '',
    short_name: subject?.short_name || '',
    code: subject?.code || '',
    category: subject?.category || 'core',
    department: subject?.department || 'Science',
    is_active: subject?.is_active !== false,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: any = { ...form, school_id: schoolId,
        short_name: form.short_name || null, code: form.code || null };
      const { error } = subject
        ? await supabase.from('subjects').update(payload).eq('id', subject.id)
        : await supabase.from('subjects').insert(payload);
      if (error) throw error;
      onSaved();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Save failed');
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="bg-white sm:rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white">
          <h3 className="font-semibold text-gray-900">{subject ? 'Edit subject' : 'New subject'}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5 text-gray-500" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="label">Name *</label>
            <input type="text" required className="input" placeholder="e.g. Mathematics"
              value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Short name</label>
              <input type="text" className="input" placeholder="MTH"
                value={form.short_name} onChange={(e) => setForm({ ...form, short_name: e.target.value })} />
            </div>
            <div>
              <label className="label">Subject code</label>
              <input type="text" className="input" placeholder="e.g. MATH101"
                value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Category *</label>
              <select required className="input"
                value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                <option value="core">Core</option>
                <option value="elective">Elective</option>
                <option value="vocational">Vocational</option>
                <option value="extra_curricular">Extra-curricular</option>
              </select>
            </div>
            <div>
              <label className="label">Department</label>
              <select className="input"
                value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}>
                <option value="Science">Science</option>
                <option value="Arts">Arts</option>
                <option value="Commercial">Commercial</option>
                <option value="Language">Language</option>
                <option value="Religion">Religion</option>
                <option value="Vocational">Vocational</option>
                <option value="Sports">Sports</option>
              </select>
            </div>
          </div>
          <label className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer">
            <input type="checkbox" className="mt-0.5 accent-indigo"
              checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
            <div className="text-sm text-gray-900">Active (available for grading)</div>
          </label>
          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={onClose} className="btn-secondary text-sm">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary text-sm">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============= COMPONENT MODAL =============
function ComponentModal({ component, schoolId, nextSort, onClose, onSaved, onError }: any) {
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: component?.name || '',
    short_code: component?.short_code || '',
    category: component?.category || 'continuous_assessment',
    default_max_score: component?.default_max_score || 10,
    default_weight: component?.default_weight || 10,
    sort_order: component?.sort_order || nextSort,
    is_active: component?.is_active !== false,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: any = { ...form, school_id: schoolId, short_code: form.short_code || null };
      const { error } = component
        ? await supabase.from('assessment_components').update(payload).eq('id', component.id)
        : await supabase.from('assessment_components').insert(payload);
      if (error) throw error;
      onSaved();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Save failed');
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="bg-white sm:rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white">
          <h3 className="font-semibold text-gray-900">{component ? 'Edit component' : 'New assessment component'}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5 text-gray-500" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="label">Name *</label>
            <input type="text" required className="input" placeholder="e.g. First CA"
              value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Short code</label>
              <input type="text" className="input" placeholder="CA1"
                value={form.short_code} onChange={(e) => setForm({ ...form, short_code: e.target.value })} />
            </div>
            <div>
              <label className="label">Category *</label>
              <select required className="input"
                value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                <option value="continuous_assessment">Continuous Assessment</option>
                <option value="assignment">Assignment</option>
                <option value="project">Project</option>
                <option value="mid_term_exam">Mid-term Exam</option>
                <option value="final_exam">Final Exam</option>
                <option value="practical">Practical</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Max score *</label>
              <input type="number" required min="1" step="0.5" className="input"
                value={form.default_max_score}
                onChange={(e) => setForm({ ...form, default_max_score: parseFloat(e.target.value) })} />
            </div>
            <div>
              <label className="label">Weight % *</label>
              <input type="number" required min="0" max="100" step="0.5" className="input"
                value={form.default_weight}
                onChange={(e) => setForm({ ...form, default_weight: parseFloat(e.target.value) })} />
            </div>
            <div>
              <label className="label">Order</label>
              <input type="number" min="1" className="input"
                value={form.sort_order}
                onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) })} />
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={onClose} className="btn-secondary text-sm">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary text-sm">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
