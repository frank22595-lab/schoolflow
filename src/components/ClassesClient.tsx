'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import {
  GraduationCap, Users, Home as HouseIcon, Plus, Edit2, Trash2,
  Loader2, X, Check, ChevronRight, ChevronDown, Sparkles,
  AlertCircle, CheckCircle2, Wand2, Calendar, ArrowRight,
  BookOpen, Palette, User,
} from 'lucide-react';

interface ClassLevel {
  id: string;
  name: string;
  short_name?: string;
  category: string;
  sequence: number;
  minimum_age?: number;
  maximum_age?: number;
  is_active: boolean;
}

interface Class {
  id: string;
  session_id: string;
  class_level_id: string;
  name: string;
  capacity?: number;
  class_teacher_id?: string;
}

interface Section {
  id: string;
  class_id: string;
  name: string;
  full_name?: string;
  capacity: number;
  stream?: string;
  room?: string;
}

interface House {
  id: string;
  name: string;
  color?: string;
  motto?: string;
}

interface Props {
  schoolId: string;
  levelsOffered: string[];
  initialClassLevels: ClassLevel[];
  currentSession: any;
  initialClasses: Class[];
  initialSections: Section[];
  initialHouses: House[];
}

const CATEGORY_LABELS: Record<string, string> = {
  creche: 'Crèche',
  nursery: 'Nursery',
  primary: 'Primary',
  junior_secondary: 'Junior Secondary',
  senior_secondary: 'Senior Secondary',
};

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  creche: { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200' },
  nursery: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  primary: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
  junior_secondary: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  senior_secondary: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
};

export default function ClassesClient({
  schoolId, levelsOffered, initialClassLevels, currentSession,
  initialClasses, initialSections, initialHouses,
}: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [tab, setTab] = useState<'levels' | 'sections' | 'houses'>('levels');
  const [classLevels, setClassLevels] = useState<ClassLevel[]>(initialClassLevels);
  const [classes, setClasses] = useState<Class[]>(initialClasses);
  const [sections, setSections] = useState<Section[]>(initialSections);
  const [houses, setHouses] = useState<House[]>(initialHouses);
  const [expandedLevel, setExpandedLevel] = useState<string | null>(null);

  const [levelModal, setLevelModal] = useState<{ open: boolean; level?: ClassLevel }>({ open: false });
  const [sectionModal, setSectionModal] = useState<{ open: boolean; section?: Section; classId?: string; classLevelId?: string }>({ open: false });
  const [houseModal, setHouseModal] = useState<{ open: boolean; house?: House }>({ open: false });
  const [deleteConfirm, setDeleteConfirm] = useState<{ table: string; id: string; name: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [seedingLevels, setSeedingLevels] = useState(false);
  const [seedingHouses, setSeedingHouses] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  function showToast(type: 'success' | 'error', message: string) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  }

  async function refreshAll() {
    const [lvls, cls, secs, hs] = await Promise.all([
      supabase.from('class_levels').select('*').eq('school_id', schoolId).order('sequence'),
      supabase.from('classes').select('*').eq('school_id', schoolId),
      supabase.from('sections').select('*').eq('school_id', schoolId),
      supabase.from('houses').select('*').eq('school_id', schoolId).order('name'),
    ]);
    setClassLevels(lvls.data || []);
    setClasses(cls.data || []);
    setSections(secs.data || []);
    setHouses(hs.data || []);
    router.refresh();
  }

  async function autoSeedLevels() {
    if (levelsOffered.length === 0) {
      showToast('error', 'Set levels offered in School Profile first');
      return;
    }
    setSeedingLevels(true);
    try {
      const { error } = await supabase.rpc('seed_common_class_levels', {
        p_school_id: schoolId,
        p_categories: levelsOffered,
      });
      if (error) throw error;
      await refreshAll();
      showToast('success', 'Standard Nigerian class levels created');
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Auto-seed failed');
    } finally { setSeedingLevels(false); }
  }

  async function autoSeedHouses() {
    setSeedingHouses(true);
    try {
      const { error } = await supabase.rpc('seed_common_houses', { p_school_id: schoolId });
      if (error) throw error;
      await refreshAll();
      showToast('success', 'Standard 4 houses created');
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Auto-seed failed');
    } finally { setSeedingHouses(false); }
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

  // Ensure a class row exists for a level in the current session; return its id
  async function ensureClassForLevel(classLevelId: string, className: string): Promise<string | null> {
    if (!currentSession) return null;
    const existing = classes.find(c => c.class_level_id === classLevelId && c.session_id === currentSession.id);
    if (existing) return existing.id;
    const { data, error } = await supabase.from('classes').insert({
      school_id: schoolId,
      session_id: currentSession.id,
      class_level_id: classLevelId,
      name: className,
    }).select().single();
    if (error) return null;
    setClasses([...classes, data]);
    return data.id;
  }

  const levelsByCategory = classLevels.reduce((acc, l) => {
    if (!acc[l.category]) acc[l.category] = [];
    acc[l.category].push(l);
    return acc;
  }, {} as Record<string, ClassLevel[]>);

  const classForLevel = (levelId: string) =>
    currentSession ? classes.find(c => c.class_level_id === levelId && c.session_id === currentSession.id) : null;

  const sectionsForClass = (classId: string) => sections.filter(s => s.class_id === classId);

  const tabs = [
    { id: 'levels' as const, label: 'Class Levels', icon: GraduationCap, count: classLevels.length },
    { id: 'sections' as const, label: 'Sections', icon: Users, count: sections.length },
    { id: 'houses' as const, label: 'Houses', icon: HouseIcon, count: houses.length },
  ];

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-1 overflow-x-auto -mb-px">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                tab === t.id
                  ? 'border-indigo text-indigo-dark'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
              <span className={`text-xs px-1.5 py-0.5 rounded ${
                tab === t.id ? 'bg-indigo-50 text-indigo' : 'bg-gray-100 text-gray-500'
              }`}>{t.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ============ LEVELS TAB ============ */}
      {tab === 'levels' && (
        <div className="space-y-4">
          {classLevels.length === 0 ? (
            <div className="bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 rounded-xl p-4 lg:p-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-indigo rounded-lg flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">Set up your class ladder</h3>
                  <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                    Based on your school profile, you offer: <strong>{levelsOffered.map(l => CATEGORY_LABELS[l]).join(', ') || 'no levels yet'}</strong>.
                    We can create standard Nigerian class levels for you in one click, or you can add them manually.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={autoSeedLevels}
                      disabled={seedingLevels || levelsOffered.length === 0}
                      className="btn-primary text-sm"
                    >
                      {seedingLevels ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Wand2 className="w-4 h-4 mr-2" />}
                      Auto-create standard levels
                    </button>
                    <button onClick={() => setLevelModal({ open: true })} className="btn-secondary text-sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Add manually
                    </button>
                  </div>
                  {levelsOffered.length === 0 && (
                    <Link href="/dashboard/settings/school" className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-indigo hover:underline">
                      Set levels in School Profile first
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Class Ladder</h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Click a level to add or manage its sections
                    {currentSession && <> for <strong>{currentSession.name}</strong></>}
                    {!currentSession && <span className="text-warning"> · Set a current session first</span>}
                  </p>
                </div>
                <button onClick={() => setLevelModal({ open: true })} className="btn-primary text-sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add level
                </button>
              </div>

              {Object.entries(levelsByCategory).map(([category, levels]) => {
                const colors = CATEGORY_COLORS[category];
                return (
                  <div key={category}>
                    <div className={`inline-flex items-center gap-2 px-3 py-1 ${colors.bg} ${colors.text} text-xs font-semibold rounded-full uppercase mb-2`}>
                      {CATEGORY_LABELS[category]}
                    </div>
                    <div className="space-y-2">
                      {levels.map(level => {
                        const cls = classForLevel(level.id);
                        const levelSections = cls ? sectionsForClass(cls.id) : [];
                        const isExpanded = expandedLevel === level.id;

                        return (
                          <div key={level.id} className={`bg-white rounded-lg border ${colors.border} shadow-sm overflow-hidden`}>
                            <div
                              onClick={() => setExpandedLevel(isExpanded ? null : level.id)}
                              className="p-3 lg:p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-9 h-9 ${colors.bg} rounded-md flex items-center justify-center flex-shrink-0`}>
                                  <span className={`text-xs font-bold ${colors.text}`}>{level.short_name || level.sequence}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className="font-semibold text-gray-900 text-sm">{level.name}</h4>
                                    {level.minimum_age !== null && level.maximum_age !== null && (
                                      <span className="text-[10px] text-gray-500">Ages {level.minimum_age}-{level.maximum_age}</span>
                                    )}
                                  </div>
                                  <div className="text-xs text-gray-500 mt-0.5">
                                    {levelSections.length === 0 ? 'No sections yet' : `${levelSections.length} section${levelSections.length !== 1 ? 's' : ''}`}
                                    {levelSections.length > 0 && ' · ' + levelSections.map(s => s.name).join(', ')}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setLevelModal({ open: true, level }); }}
                                    className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                                  ><Edit2 className="w-3.5 h-3.5" /></button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setDeleteConfirm({ table: 'class_levels', id: level.id, name: level.name }); }}
                                    className="p-1.5 text-gray-400 hover:text-error hover:bg-red-50 rounded transition-colors"
                                  ><Trash2 className="w-3.5 h-3.5" /></button>
                                  {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                                </div>
                              </div>
                            </div>

                            {isExpanded && (
                              <div className="border-t border-gray-100 bg-gray-50/50 p-3 lg:p-4">
                                {!currentSession ? (
                                  <div className="text-center py-4">
                                    <p className="text-xs text-warning mb-2">Set a current session to add sections</p>
                                    <Link href="/dashboard/settings/academic" className="text-xs text-indigo hover:underline">Set current session →</Link>
                                  </div>
                                ) : levelSections.length === 0 ? (
                                  <div className="text-center py-4">
                                    <p className="text-xs text-gray-600 mb-2">No sections for this level yet</p>
                                    <button
                                      onClick={async () => {
                                        const classId = await ensureClassForLevel(level.id, level.name);
                                        if (classId) setSectionModal({ open: true, classId, classLevelId: level.id });
                                      }}
                                      className="btn-primary text-xs"
                                    >
                                      <Plus className="w-3.5 h-3.5 mr-1.5" />
                                      Add first section (e.g. {level.short_name || level.name}A)
                                    </button>
                                  </div>
                                ) : (
                                  <div className="space-y-2">
                                    {levelSections.map(section => (
                                      <div key={section.id} className="bg-white rounded-md border border-gray-200 p-2.5 flex items-center gap-3">
                                        <div className="w-8 h-8 bg-indigo-50 rounded-md flex items-center justify-center flex-shrink-0">
                                          <Users className="w-4 h-4 text-indigo" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2">
                                            <span className="font-medium text-sm text-gray-900">
                                              {level.name} {section.name}
                                            </span>
                                            {section.stream && (
                                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-50 text-amber-700 text-[9px] font-semibold rounded uppercase">
                                                {section.stream}
                                              </span>
                                            )}
                                          </div>
                                          <div className="text-[10px] text-gray-500 mt-0.5">
                                            Capacity: {section.capacity}{section.room && ` · Room: ${section.room}`}
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-1 flex-shrink-0">
                                          <button
                                            onClick={() => setSectionModal({ open: true, section, classId: cls!.id, classLevelId: level.id })}
                                            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                                          ><Edit2 className="w-3.5 h-3.5" /></button>
                                          <button
                                            onClick={() => setDeleteConfirm({ table: 'sections', id: section.id, name: `${level.name} ${section.name}` })}
                                            className="p-1.5 text-gray-400 hover:text-error hover:bg-red-50 rounded transition-colors"
                                          ><Trash2 className="w-3.5 h-3.5" /></button>
                                        </div>
                                      </div>
                                    ))}
                                    <button
                                      onClick={async () => {
                                        const classId = await ensureClassForLevel(level.id, level.name);
                                        if (classId) setSectionModal({ open: true, classId, classLevelId: level.id });
                                      }}
                                      className="w-full py-2 border-2 border-dashed border-gray-300 rounded-md text-xs text-gray-500 hover:border-indigo hover:text-indigo transition-colors flex items-center justify-center gap-1"
                                    >
                                      <Plus className="w-3.5 h-3.5" />
                                      Add another section
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}

      {/* ============ SECTIONS TAB (flat list) ============ */}
      {tab === 'sections' && (
        <div className="space-y-4">
          {sections.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-900 mb-1">No sections yet</p>
              <p className="text-xs text-gray-500 mb-4">Add sections from the Class Levels tab, or click below</p>
              <button onClick={() => setTab('levels')} className="btn-primary text-sm">
                Go to Class Levels
              </button>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="hidden sm:grid grid-cols-12 gap-3 px-4 py-3 bg-gray-50 border-b border-gray-200 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                <div className="col-span-4">Section</div>
                <div className="col-span-2">Stream</div>
                <div className="col-span-2">Capacity</div>
                <div className="col-span-2">Room</div>
                <div className="col-span-2 text-right">Actions</div>
              </div>
              <div className="divide-y divide-gray-100">
                {sections.map(section => {
                  const cls = classes.find(c => c.id === section.class_id);
                  const level = classLevels.find(l => l.id === cls?.class_level_id);
                  return (
                    <div key={section.id} className="p-3 lg:p-4 hover:bg-gray-50 transition-colors sm:grid sm:grid-cols-12 sm:gap-3 sm:items-center">
                      <div className="col-span-4 flex items-center gap-3">
                        <div className="w-9 h-9 bg-indigo-50 rounded-md flex items-center justify-center flex-shrink-0">
                          <Users className="w-4 h-4 text-indigo" />
                        </div>
                        <div>
                          <div className="font-medium text-sm text-gray-900">{level?.name} {section.name}</div>
                          <div className="text-[10px] text-gray-500 sm:hidden">
                            {section.stream && <span className="uppercase mr-2">{section.stream}</span>}
                            Cap: {section.capacity}{section.room && ` · Room ${section.room}`}
                          </div>
                        </div>
                      </div>
                      <div className="col-span-2 hidden sm:block text-xs text-gray-600">{section.stream ? section.stream.charAt(0).toUpperCase() + section.stream.slice(1) : '—'}</div>
                      <div className="col-span-2 hidden sm:block text-xs text-gray-600">{section.capacity}</div>
                      <div className="col-span-2 hidden sm:block text-xs text-gray-600">{section.room || '—'}</div>
                      <div className="col-span-2 flex items-center gap-1 justify-end mt-2 sm:mt-0">
                        <button
                          onClick={() => setSectionModal({ open: true, section, classId: section.class_id, classLevelId: level?.id })}
                          className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded"
                        ><Edit2 className="w-3.5 h-3.5" /></button>
                        <button
                          onClick={() => setDeleteConfirm({ table: 'sections', id: section.id, name: `${level?.name} ${section.name}` })}
                          className="p-1.5 text-gray-400 hover:text-error hover:bg-red-50 rounded"
                        ><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============ HOUSES TAB ============ */}
      {tab === 'houses' && (
        <div className="space-y-4">
          {houses.length === 0 ? (
            <div className="bg-gradient-to-br from-purple-50 to-white border border-purple-100 rounded-xl p-4 lg:p-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <HouseIcon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">Set up school houses</h3>
                  <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                    Nigerian schools traditionally have 4 houses (Red, Blue, Green, Yellow) for inter-house competitions and sports.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={autoSeedHouses} disabled={seedingHouses} className="btn-primary text-sm">
                      {seedingHouses ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Wand2 className="w-4 h-4 mr-2" />}
                      Create 4 standard houses
                    </button>
                    <button onClick={() => setHouseModal({ open: true })} className="btn-secondary text-sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Add manually
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Houses</h2>
                <button onClick={() => setHouseModal({ open: true })} className="btn-primary text-sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add house
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {houses.map(house => (
                  <div key={house.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: house.color || '#94a3b8' }} />
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: house.color ? `${house.color}20` : '#f3f4f6' }}>
                        <HouseIcon className="w-5 h-5" style={{ color: house.color || '#64748b' }} />
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => setHouseModal({ open: true, house })}
                          className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded"
                        ><Edit2 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => setDeleteConfirm({ table: 'houses', id: house.id, name: house.name })}
                          className="p-1 text-gray-400 hover:text-error hover:bg-red-50 rounded"
                        ><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                    <div className="font-semibold text-gray-900 text-sm">{house.name}</div>
                    {house.motto && <div className="text-xs text-gray-500 mt-1 italic">"{house.motto}"</div>}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Modals */}
      {levelModal.open && (
        <LevelModal level={levelModal.level} schoolId={schoolId}
          nextSequence={classLevels.length + 1}
          onClose={() => setLevelModal({ open: false })}
          onSaved={async () => { await refreshAll(); setLevelModal({ open: false }); showToast('success', 'Level saved'); }}
          onError={(m: string) => showToast('error', m)} />
      )}
      {sectionModal.open && sectionModal.classId && sectionModal.classLevelId && (
        <SectionModal
          section={sectionModal.section}
          classId={sectionModal.classId}
          classLevel={classLevels.find(l => l.id === sectionModal.classLevelId)!}
          existingSections={sections.filter(s => s.class_id === sectionModal.classId)}
          schoolId={schoolId}
          onClose={() => setSectionModal({ open: false })}
          onSaved={async () => { await refreshAll(); setSectionModal({ open: false }); showToast('success', 'Section saved'); }}
          onError={(m: string) => showToast('error', m)} />
      )}
      {houseModal.open && (
        <HouseModal house={houseModal.house} schoolId={schoolId}
          onClose={() => setHouseModal({ open: false })}
          onSaved={async () => { await refreshAll(); setHouseModal({ open: false }); showToast('success', 'House saved'); }}
          onError={(m: string) => showToast('error', m)} />
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
                <h3 className="font-semibold text-gray-900">Delete this?</h3>
                <p className="text-sm text-gray-500 mt-1"><strong>{deleteConfirm.name}</strong> will be permanently removed.</p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setDeleteConfirm(null)} className="btn-secondary text-sm">Cancel</button>
              <button onClick={handleDelete} disabled={loading}
                className="px-4 py-2 bg-error text-white rounded-md text-sm font-medium hover:bg-red-600 transition-colors">
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

// ============= LEVEL MODAL =============
function LevelModal({ level, schoolId, nextSequence, onClose, onSaved, onError }: any) {
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: level?.name || '',
    short_name: level?.short_name || '',
    category: level?.category || 'primary',
    sequence: level?.sequence || nextSequence,
    minimum_age: level?.minimum_age || '',
    maximum_age: level?.maximum_age || '',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: any = {
        ...form,
        school_id: schoolId,
        minimum_age: form.minimum_age === '' ? null : parseInt(form.minimum_age.toString()),
        maximum_age: form.maximum_age === '' ? null : parseInt(form.maximum_age.toString()),
        short_name: form.short_name || null,
      };
      const { error } = level
        ? await supabase.from('class_levels').update(payload).eq('id', level.id)
        : await supabase.from('class_levels').insert(payload);
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
          <h3 className="font-semibold text-gray-900">{level ? 'Edit class level' : 'New class level'}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5 text-gray-500" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="label">Name *</label>
            <input type="text" required className="input" placeholder="e.g. JSS 1"
              value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Short name</label>
              <input type="text" className="input" placeholder="JSS1"
                value={form.short_name} onChange={(e) => setForm({ ...form, short_name: e.target.value })} />
            </div>
            <div>
              <label className="label">Order *</label>
              <input type="number" required min="1" className="input"
                value={form.sequence} onChange={(e) => setForm({ ...form, sequence: parseInt(e.target.value) })} />
            </div>
          </div>
          <div>
            <label className="label">Category *</label>
            <select required className="input"
              value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {Object.entries(CATEGORY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Min age</label>
              <input type="number" min="0" max="25" className="input"
                value={form.minimum_age} onChange={(e) => setForm({ ...form, minimum_age: e.target.value })} />
            </div>
            <div>
              <label className="label">Max age</label>
              <input type="number" min="0" max="25" className="input"
                value={form.maximum_age} onChange={(e) => setForm({ ...form, maximum_age: e.target.value })} />
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

// ============= SECTION MODAL =============
function SectionModal({ section, classId, classLevel, existingSections, schoolId, onClose, onSaved, onError }: any) {
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const nextName = section?.name || String.fromCharCode(65 + existingSections.length); // A, B, C...
  const showStream = classLevel.category === 'senior_secondary';

  const [form, setForm] = useState({
    name: nextName,
    capacity: section?.capacity || 40,
    stream: section?.stream || '',
    room: section?.room || '',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: any = {
        school_id: schoolId,
        class_id: classId,
        name: form.name,
        full_name: `${classLevel.name} ${form.name}`,
        capacity: form.capacity,
        stream: form.stream || null,
        room: form.room || null,
      };
      const { error } = section
        ? await supabase.from('sections').update(payload).eq('id', section.id)
        : await supabase.from('sections').insert(payload);
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
          <div>
            <h3 className="font-semibold text-gray-900">{section ? 'Edit section' : 'New section'}</h3>
            <p className="text-xs text-gray-500 mt-0.5">For {classLevel.name}</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5 text-gray-500" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="label">Section name *</label>
            <input type="text" required className="input" placeholder="A"
              value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <p className="text-xs text-gray-500 mt-1">Full name: <strong>{classLevel.name} {form.name || '?'}</strong></p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Capacity *</label>
              <input type="number" required min="1" className="input"
                value={form.capacity} onChange={(e) => setForm({ ...form, capacity: parseInt(e.target.value) })} />
            </div>
            <div>
              <label className="label">Room</label>
              <input type="text" className="input" placeholder="e.g. Room 12"
                value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} />
            </div>
          </div>
          {showStream && (
            <div>
              <label className="label">Stream (senior secondary)</label>
              <select className="input"
                value={form.stream} onChange={(e) => setForm({ ...form, stream: e.target.value })}>
                <option value="">None</option>
                <option value="science">Science</option>
                <option value="arts">Arts</option>
                <option value="commercial">Commercial</option>
                <option value="technical">Technical</option>
              </select>
            </div>
          )}
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

// ============= HOUSE MODAL =============
function HouseModal({ house, schoolId, onClose, onSaved, onError }: any) {
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: house?.name || '',
    color: house?.color || '#3B4CCA',
    motto: house?.motto || '',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, school_id: schoolId, motto: form.motto || null };
      const { error } = house
        ? await supabase.from('houses').update(payload).eq('id', house.id)
        : await supabase.from('houses').insert(payload);
      if (error) throw error;
      onSaved();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Save failed');
    } finally { setSaving(false); }
  }

  const colorPresets = ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="bg-white sm:rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white">
          <h3 className="font-semibold text-gray-900">{house ? 'Edit house' : 'New house'}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5 text-gray-500" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="label">Name *</label>
            <input type="text" required className="input" placeholder="e.g. Red House"
              value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Color</label>
            <div className="flex items-center gap-2 mb-2">
              <input type="color" className="w-12 h-10 rounded cursor-pointer border border-gray-200"
                value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
              <input type="text" className="input flex-1" value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })} />
            </div>
            <div className="flex gap-1 flex-wrap">
              {colorPresets.map(c => (
                <button type="button" key={c} onClick={() => setForm({ ...form, color: c })}
                  className={`w-8 h-8 rounded-md border-2 ${form.color === c ? 'border-gray-900' : 'border-gray-200'}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
          <div>
            <label className="label">Motto (optional)</label>
            <input type="text" className="input" placeholder="e.g. Strength in Unity"
              value={form.motto} onChange={(e) => setForm({ ...form, motto: e.target.value })} />
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
