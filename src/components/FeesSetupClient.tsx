'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import {
  Wallet, ClipboardList, Percent, Landmark, Plus, Edit2, Trash2,
  Loader2, X, Wand2, Sparkles, AlertCircle, CheckCircle2, Star,
  Copy, ChevronDown, ChevronRight, Info,
} from 'lucide-react';

const NIGERIAN_BANKS = [
  'Access Bank', 'First Bank', 'GTBank', 'Zenith Bank', 'UBA', 'Fidelity Bank',
  'FCMB', 'Union Bank', 'Wema Bank', 'Stanbic IBTC', 'Sterling Bank', 'Ecobank',
  'Polaris Bank', 'Keystone Bank', 'Heritage Bank', 'Providus Bank', 'Jaiz Bank',
  'Kuda', 'Opay', 'PalmPay', 'Moniepoint', 'Other',
];

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  academic: { bg: 'bg-indigo-50', text: 'text-indigo' },
  boarding: { bg: 'bg-purple-50', text: 'text-purple-700' },
  transport: { bg: 'bg-sky-50', text: 'text-sky-700' },
  uniform: { bg: 'bg-emerald-50', text: 'text-emerald-700' },
  books: { bg: 'bg-amber-50', text: 'text-amber-700' },
  meals: { bg: 'bg-orange-50', text: 'text-orange-700' },
  exam: { bg: 'bg-red-50', text: 'text-red-700' },
  development: { bg: 'bg-teal-50', text: 'text-teal-700' },
  pta: { bg: 'bg-pink-50', text: 'text-pink-700' },
  other: { bg: 'bg-gray-100', text: 'text-gray-700' },
};

const fmt = (n: number) => '₦' + Number(n).toLocaleString('en-NG', { maximumFractionDigits: 0 });

interface Props {
  schoolId: string;
  initialFeeHeads: any[];
  initialStructures: any[];
  initialDiscounts: any[];
  initialBanks: any[];
  sessions: any[];
  terms: any[];
  classLevels: any[];
}

export default function FeesSetupClient({
  schoolId, initialFeeHeads, initialStructures, initialDiscounts, initialBanks,
  sessions, terms, classLevels,
}: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [tab, setTab] = useState<'heads' | 'structures' | 'discounts' | 'banks'>('heads');
  const [feeHeads, setFeeHeads] = useState(initialFeeHeads);
  const [structures, setStructures] = useState(initialStructures);
  const [discounts, setDiscounts] = useState(initialDiscounts);
  const [banks, setBanks] = useState(initialBanks);

  const [headModal, setHeadModal] = useState<{ open: boolean; head?: any }>({ open: false });
  const [structureModal, setStructureModal] = useState<{ open: boolean; structure?: any; sessionId?: string; termId?: string; classLevelId?: string }>({ open: false });
  const [discountModal, setDiscountModal] = useState<{ open: boolean; discount?: any }>({ open: false });
  const [bankModal, setBankModal] = useState<{ open: boolean; bank?: any }>({ open: false });
  const [deleteConfirm, setDeleteConfirm] = useState<{ table: string; id: string; name: string } | null>(null);

  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Structure builder state
  const [selectedSession, setSelectedSession] = useState(sessions.find(s => s.is_current)?.id || sessions[0]?.id || '');
  const [selectedTerm, setSelectedTerm] = useState(terms.find(t => t.is_current)?.id || '');
  const [expandedClass, setExpandedClass] = useState<string | null>(null);

  function showToast(type: 'success' | 'error', message: string) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  }

  async function refreshAll() {
    const [fh, str, dsc, bk] = await Promise.all([
      supabase.from('fee_heads').select('*').eq('school_id', schoolId).order('sort_order'),
      supabase.from('fee_structures').select('*').eq('school_id', schoolId),
      supabase.from('discounts').select('*').eq('school_id', schoolId).order('name'),
      supabase.from('bank_accounts').select('*').eq('school_id', schoolId).order('bank_name'),
    ]);
    setFeeHeads(fh.data || []);
    setStructures(str.data || []);
    setDiscounts(dsc.data || []);
    setBanks(bk.data || []);
    router.refresh();
  }

  async function autoSeedFeeHeads() {
    setSeeding(true);
    try {
      const { error } = await supabase.rpc('seed_common_fee_heads', { p_school_id: schoolId });
      if (error) throw error;
      await refreshAll();
      showToast('success', 'Nigerian standard fee heads added');
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Failed');
    } finally { setSeeding(false); }
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

  const termsForSession = terms.filter(t => t.session_id === selectedSession);

  // For structure lookup
  const getStructure = (classLevelId: string, feeHeadId: string) => {
    return structures.find(s =>
      s.class_level_id === classLevelId &&
      s.fee_head_id === feeHeadId &&
      s.session_id === selectedSession &&
      (s.term_id === selectedTerm || (!s.term_id && !selectedTerm))
    );
  };

  const totalForClass = (classLevelId: string) => {
    return feeHeads.reduce((sum, fh) => {
      const s = getStructure(classLevelId, fh.id);
      return sum + (s ? Number(s.amount) : 0);
    }, 0);
  };

  const tabs = [
    { id: 'heads' as const, label: 'Fee Heads', icon: ClipboardList, count: feeHeads.length },
    { id: 'structures' as const, label: 'Fee Structures', icon: Wallet, count: structures.length },
    { id: 'discounts' as const, label: 'Discounts', icon: Percent, count: discounts.length },
    { id: 'banks' as const, label: 'Bank Accounts', icon: Landmark, count: banks.length },
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

      {/* ============ FEE HEADS TAB ============ */}
      {tab === 'heads' && (
        <div className="space-y-4">
          {feeHeads.length === 0 ? (
            <div className="bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 rounded-xl p-4 lg:p-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-indigo rounded-lg flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">Set up your fee heads</h3>
                  <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                    Fee heads are the types of fees you charge (Tuition, PTA, Uniform, etc.). We can create common Nigerian school fee heads for you in one click.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={autoSeedFeeHeads} disabled={seeding} className="btn-primary text-sm">
                      {seeding ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Wand2 className="w-4 h-4 mr-2" />}
                      Auto-add Nigerian fee heads
                    </button>
                    <button onClick={() => setHeadModal({ open: true })} className="btn-secondary text-sm">
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
                  <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Fee Heads</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Types of fees your school charges</p>
                </div>
                <button onClick={() => setHeadModal({ open: true })} className="btn-primary text-sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add fee head
                </button>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="hidden sm:grid grid-cols-12 gap-3 px-4 py-3 bg-gray-50 border-b border-gray-200 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                  <div className="col-span-4">Name</div>
                  <div className="col-span-2">Category</div>
                  <div className="col-span-2">Recurrence</div>
                  <div className="col-span-2">Mandatory</div>
                  <div className="col-span-2 text-right">Actions</div>
                </div>
                <div className="divide-y divide-gray-100">
                  {feeHeads.map(fh => {
                    const colors = CATEGORY_COLORS[fh.category] || CATEGORY_COLORS.other;
                    return (
                      <div key={fh.id} className="p-3 lg:p-4 hover:bg-gray-50 sm:grid sm:grid-cols-12 sm:gap-3 sm:items-center">
                        <div className="col-span-4">
                          <div className="font-medium text-sm text-gray-900">{fh.name}</div>
                          {fh.short_name && <div className="text-[10px] text-gray-500 font-mono">{fh.short_name}</div>}
                        </div>
                        <div className="col-span-2 hidden sm:block">
                          <span className={`inline-flex px-2 py-0.5 ${colors.bg} ${colors.text} text-[10px] font-semibold rounded-full capitalize`}>
                            {fh.category.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="col-span-2 text-xs text-gray-600 hidden sm:block capitalize">{fh.recurrence.replace('_', ' ')}</div>
                        <div className="col-span-2 text-xs hidden sm:block">
                          {fh.is_mandatory ? <span className="text-emerald-700 font-medium">Yes</span> : <span className="text-gray-400">Optional</span>}
                        </div>
                        <div className="col-span-2 flex items-center gap-1 justify-end mt-2 sm:mt-0">
                          <button onClick={() => setHeadModal({ open: true, head: fh })} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded"><Edit2 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => setDeleteConfirm({ table: 'fee_heads', id: fh.id, name: fh.name })} className="p-1.5 text-gray-400 hover:text-error hover:bg-red-50 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ============ STRUCTURES TAB ============ */}
      {tab === 'structures' && (
        <div className="space-y-4">
          {feeHeads.length === 0 ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                  Add fee heads first before you can set amounts. <button onClick={() => setTab('heads')} className="font-semibold underline">Go to Fee Heads</button>
                </div>
              </div>
            </div>
          ) : classLevels.length === 0 ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                  Add class levels first. <Link href="/dashboard/settings/classes" className="font-semibold underline">Go to Classes</Link>
                </div>
              </div>
            </div>
          ) : sessions.length === 0 ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                  Set up an academic session first. <Link href="/dashboard/settings/academic" className="font-semibold underline">Go to Academic Calendar</Link>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Session and term picker */}
              <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="label">Session</label>
                    <select className="input" value={selectedSession} onChange={(e) => { setSelectedSession(e.target.value); setSelectedTerm(''); }}>
                      {sessions.map(s => <option key={s.id} value={s.id}>{s.name}{s.is_current ? ' (current)' : ''}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Term (optional)</label>
                    <select className="input" value={selectedTerm} onChange={(e) => setSelectedTerm(e.target.value)}>
                      <option value="">All terms (session-wide)</option>
                      {termsForSession.map(t => <option key={t.id} value={t.id}>{t.name}{t.is_current ? ' (current)' : ''}</option>)}
                    </select>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  <Info className="w-3 h-3 inline mr-1" />
                  Set amounts per class. Leave a field blank if that fee doesn't apply to that class.
                </p>
              </div>

              {/* Structure grid */}
              <div className="space-y-2">
                {classLevels.map(cl => {
                  const isExpanded = expandedClass === cl.id;
                  const total = totalForClass(cl.id);
                  const filledCount = feeHeads.filter(fh => getStructure(cl.id, fh.id)).length;
                  return (
                    <div key={cl.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                      <div onClick={() => setExpandedClass(isExpanded ? null : cl.id)}
                        className="p-4 cursor-pointer hover:bg-gray-50 transition-colors flex items-center gap-3">
                        <div className="w-9 h-9 rounded-md bg-indigo-50 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-indigo">{cl.short_name || cl.name.slice(0, 3)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900">{cl.name}</div>
                          <div className="text-xs text-gray-500">
                            {filledCount === 0 ? 'No fees set yet' : `${filledCount} fee${filledCount !== 1 ? 's' : ''} set`}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-500">Total per term</div>
                          <div className="font-bold text-lg text-gray-900">{fmt(total)}</div>
                        </div>
                        {isExpanded ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
                      </div>

                      {isExpanded && (
                        <div className="border-t border-gray-100 p-4 bg-gray-50/50 space-y-2">
                          {feeHeads.map(fh => {
                            const s = getStructure(cl.id, fh.id);
                            return (
                              <div key={fh.id} className="flex items-center gap-3 bg-white p-3 rounded-lg border border-gray-200">
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium text-gray-900">{fh.name}</div>
                                  <div className="text-[10px] text-gray-500 capitalize">{fh.category.replace('_', ' ')} · {fh.recurrence.replace('_', ' ')}</div>
                                </div>
                                {s ? (
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-gray-900">{fmt(s.amount)}</span>
                                    <button onClick={() => setStructureModal({ open: true, structure: s })}
                                      className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded">
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button onClick={() => setDeleteConfirm({ table: 'fee_structures', id: s.id, name: `${cl.name} - ${fh.name}` })}
                                      className="p-1.5 text-gray-400 hover:text-error hover:bg-red-50 rounded">
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ) : (
                                  <button onClick={() => setStructureModal({ open: true, sessionId: selectedSession, termId: selectedTerm, classLevelId: cl.id, structure: { fee_head_id: fh.id } })}
                                    className="text-xs text-indigo font-medium hover:underline">
                                    + Set amount
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* ============ DISCOUNTS TAB ============ */}
      {tab === 'discounts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Discounts</h2>
              <p className="text-xs text-gray-500 mt-0.5">Sibling, staff, scholarship, or general discounts</p>
            </div>
            <button onClick={() => setDiscountModal({ open: true })} className="btn-primary text-sm">
              <Plus className="w-4 h-4 mr-2" />
              Add discount
            </button>
          </div>

          {discounts.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
              <Percent className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-600">No discounts yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {discounts.map(d => (
                <div key={d.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-semibold text-gray-900">{d.name}</div>
                      <div className="text-xs text-gray-500 capitalize">{d.category}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-indigo">
                        {d.discount_type === 'percentage' ? `${d.value}%` : fmt(d.value)}
                      </div>
                      <div className="text-[10px] text-gray-500">off</div>
                    </div>
                  </div>
                  {d.description && <p className="text-xs text-gray-600 mt-2">{d.description}</p>}
                  <div className="flex justify-end gap-1 mt-3">
                    <button onClick={() => setDiscountModal({ open: true, discount: d })} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setDeleteConfirm({ table: 'discounts', id: d.id, name: d.name })} className="p-1.5 text-gray-400 hover:text-error hover:bg-red-50 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============ BANKS TAB ============ */}
      {tab === 'banks' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Bank Accounts</h2>
              <p className="text-xs text-gray-500 mt-0.5">Displayed on invoices and receipts</p>
            </div>
            <button onClick={() => setBankModal({ open: true })} className="btn-primary text-sm">
              <Plus className="w-4 h-4 mr-2" />
              Add account
            </button>
          </div>

          {banks.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
              <Landmark className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-1">No bank accounts yet</p>
              <p className="text-xs text-gray-500">Parents need to know where to pay</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {banks.map(b => (
                <div key={b.id} className={`bg-white rounded-xl border p-4 shadow-sm relative ${b.is_primary ? 'border-indigo ring-1 ring-indigo/20' : 'border-gray-200'}`}>
                  {b.is_primary && (
                    <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2 py-0.5 bg-indigo text-white text-[10px] font-semibold rounded-full uppercase">
                      <Star className="w-2.5 h-2.5" />
                      Primary
                    </span>
                  )}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
                      <Landmark className="w-5 h-5 text-indigo" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900">{b.bank_name}</div>
                      <div className="text-xs text-gray-500 truncate">{b.account_name}</div>
                    </div>
                  </div>
                  <div className="font-mono text-lg font-bold tracking-wider text-gray-900">{b.account_number}</div>
                  <div className="flex justify-end gap-1 mt-3">
                    <button onClick={() => setBankModal({ open: true, bank: b })} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setDeleteConfirm({ table: 'bank_accounts', id: b.id, name: b.bank_name })} className="p-1.5 text-gray-400 hover:text-error hover:bg-red-50 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {headModal.open && <HeadModal head={headModal.head} schoolId={schoolId} nextSort={feeHeads.length + 1}
        onClose={() => setHeadModal({ open: false })}
        onSaved={async () => { await refreshAll(); setHeadModal({ open: false }); showToast('success', 'Fee head saved'); }}
        onError={(m: string) => showToast('error', m)} />}
      {structureModal.open && <StructureModal
        structure={structureModal.structure}
        schoolId={schoolId}
        sessionId={structureModal.sessionId || selectedSession}
        termId={structureModal.termId ?? selectedTerm}
        classLevelId={structureModal.classLevelId}
        feeHeads={feeHeads}
        classLevels={classLevels}
        onClose={() => setStructureModal({ open: false })}
        onSaved={async () => { await refreshAll(); setStructureModal({ open: false }); showToast('success', 'Amount saved'); }}
        onError={(m: string) => showToast('error', m)} />}
      {discountModal.open && <DiscountModal discount={discountModal.discount} schoolId={schoolId} feeHeads={feeHeads}
        onClose={() => setDiscountModal({ open: false })}
        onSaved={async () => { await refreshAll(); setDiscountModal({ open: false }); showToast('success', 'Discount saved'); }}
        onError={(m: string) => showToast('error', m)} />}
      {bankModal.open && <BankModal bank={bankModal.bank} schoolId={schoolId}
        onClose={() => setBankModal({ open: false })}
        onSaved={async () => { await refreshAll(); setBankModal({ open: false }); showToast('success', 'Bank saved'); }}
        onError={(m: string) => showToast('error', m)} />}

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
        <div className={`fixed bottom-20 lg:bottom-6 right-4 left-4 sm:left-auto z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg ${
          toast.type === 'success' ? 'bg-success text-white' : 'bg-error text-white'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}
    </div>
  );
}

// ============= HEAD MODAL =============
function HeadModal({ head, schoolId, nextSort, onClose, onSaved, onError }: any) {
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: head?.name || '',
    short_name: head?.short_name || '',
    category: head?.category || 'academic',
    is_mandatory: head?.is_mandatory ?? true,
    recurrence: head?.recurrence || 'per_term',
    sort_order: head?.sort_order || nextSort,
    description: head?.description || '',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: any = { ...form, school_id: schoolId, short_name: form.short_name || null, description: form.description || null };
      const { error } = head
        ? await supabase.from('fee_heads').update(payload).eq('id', head.id)
        : await supabase.from('fee_heads').insert(payload);
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
          <h3 className="font-semibold text-gray-900">{head ? 'Edit fee head' : 'New fee head'}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5 text-gray-500" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="label">Name *</label>
            <input type="text" required className="input" placeholder="e.g. Tuition Fee"
              value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Short name</label>
              <input type="text" className="input" placeholder="TUI"
                value={form.short_name} onChange={(e) => setForm({ ...form, short_name: e.target.value })} />
            </div>
            <div>
              <label className="label">Order</label>
              <input type="number" min="1" className="input"
                value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Category *</label>
              <select required className="input"
                value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                <option value="academic">Academic</option>
                <option value="boarding">Boarding</option>
                <option value="transport">Transport</option>
                <option value="uniform">Uniform</option>
                <option value="books">Books</option>
                <option value="meals">Meals / Lunch</option>
                <option value="exam">Exam</option>
                <option value="development">Development</option>
                <option value="pta">PTA</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="label">Recurrence *</label>
              <select required className="input"
                value={form.recurrence} onChange={(e) => setForm({ ...form, recurrence: e.target.value })}>
                <option value="per_term">Per term</option>
                <option value="per_session">Per session</option>
                <option value="one_time">One time</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>
          <label className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer">
            <input type="checkbox" className="mt-0.5 accent-indigo"
              checked={form.is_mandatory} onChange={(e) => setForm({ ...form, is_mandatory: e.target.checked })} />
            <div>
              <div className="text-sm font-medium text-gray-900">Mandatory</div>
              <div className="text-xs text-gray-500">All students must pay this. Uncheck for optional fees like Bus, Lunch, Boarding.</div>
            </div>
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

// ============= STRUCTURE MODAL =============
function StructureModal({ structure, schoolId, sessionId, termId, classLevelId, feeHeads, classLevels, onClose, onSaved, onError }: any) {
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    class_level_id: structure?.class_level_id || classLevelId || '',
    fee_head_id: structure?.fee_head_id || '',
    amount: structure?.amount || '',
    is_optional: structure?.is_optional || false,
    boarding_only: structure?.boarding_only || false,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: any = {
        school_id: schoolId,
        session_id: sessionId,
        term_id: termId || null,
        class_level_id: form.class_level_id,
        fee_head_id: form.fee_head_id,
        amount: parseFloat(form.amount.toString()),
        is_optional: form.is_optional,
        boarding_only: form.boarding_only,
      };
      const { error } = structure?.id
        ? await supabase.from('fee_structures').update(payload).eq('id', structure.id)
        : await supabase.from('fee_structures').insert(payload);
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
          <h3 className="font-semibold text-gray-900">{structure?.id ? 'Edit fee amount' : 'Set fee amount'}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5 text-gray-500" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="label">Class *</label>
            <select required className="input" disabled={!!classLevelId}
              value={form.class_level_id} onChange={(e) => setForm({ ...form, class_level_id: e.target.value })}>
              <option value="">Select class</option>
              {classLevels.map((cl: any) => <option key={cl.id} value={cl.id}>{cl.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Fee head *</label>
            <select required className="input"
              value={form.fee_head_id} onChange={(e) => setForm({ ...form, fee_head_id: e.target.value })}>
              <option value="">Select fee head</option>
              {feeHeads.map((fh: any) => <option key={fh.id} value={fh.id}>{fh.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Amount (₦) *</label>
            <input type="number" required min="0" step="100" className="input font-mono text-lg"
              placeholder="0.00"
              value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-2 p-2 cursor-pointer">
              <input type="checkbox" className="accent-indigo"
                checked={form.is_optional} onChange={(e) => setForm({ ...form, is_optional: e.target.checked })} />
              <span className="text-sm text-gray-700">Optional (parent chooses)</span>
            </label>
            <label className="flex items-center gap-2 p-2 cursor-pointer">
              <input type="checkbox" className="accent-indigo"
                checked={form.boarding_only} onChange={(e) => setForm({ ...form, boarding_only: e.target.checked })} />
              <span className="text-sm text-gray-700">Boarders only</span>
            </label>
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

// ============= DISCOUNT MODAL =============
function DiscountModal({ discount, schoolId, feeHeads, onClose, onSaved, onError }: any) {
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: discount?.name || '',
    discount_type: discount?.discount_type || 'percentage',
    value: discount?.value || '',
    category: discount?.category || 'general',
    min_qualifying_children: discount?.min_qualifying_children || '',
    description: discount?.description || '',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: any = {
        ...form,
        school_id: schoolId,
        value: parseFloat(form.value.toString()),
        min_qualifying_children: form.min_qualifying_children === '' ? null : parseInt(form.min_qualifying_children.toString()),
        description: form.description || null,
      };
      const { error } = discount
        ? await supabase.from('discounts').update(payload).eq('id', discount.id)
        : await supabase.from('discounts').insert(payload);
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
          <h3 className="font-semibold text-gray-900">{discount ? 'Edit discount' : 'New discount'}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5 text-gray-500" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="label">Name *</label>
            <input type="text" required className="input" placeholder="e.g. Second child discount"
              value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Category</label>
            <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              <option value="sibling">Sibling</option>
              <option value="staff">Staff kids</option>
              <option value="scholarship">Scholarship</option>
              <option value="early_bird">Early bird</option>
              <option value="bursary">Bursary</option>
              <option value="general">General</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Type *</label>
              <select required className="input" value={form.discount_type} onChange={(e) => setForm({ ...form, discount_type: e.target.value })}>
                <option value="percentage">Percentage</option>
                <option value="fixed_amount">Fixed amount</option>
              </select>
            </div>
            <div>
              <label className="label">Value *</label>
              <input type="number" required min="0" step={form.discount_type === 'percentage' ? '1' : '100'} className="input"
                placeholder={form.discount_type === 'percentage' ? '10' : '5000'}
                value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
            </div>
          </div>
          {form.category === 'sibling' && (
            <div>
              <label className="label">Min qualifying children</label>
              <input type="number" min="2" className="input" placeholder="e.g. 2 (kicks in from 2nd child)"
                value={form.min_qualifying_children} onChange={(e) => setForm({ ...form, min_qualifying_children: e.target.value })} />
            </div>
          )}
          <div>
            <label className="label">Description</label>
            <textarea rows={2} className="input"
              value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
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

// ============= BANK MODAL =============
function BankModal({ bank, schoolId, onClose, onSaved, onError }: any) {
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    bank_name: bank?.bank_name || '',
    account_name: bank?.account_name || '',
    account_number: bank?.account_number || '',
    branch: bank?.branch || '',
    is_primary: bank?.is_primary || false,
    display_on_invoices: bank?.display_on_invoices ?? true,
    display_on_receipts: bank?.display_on_receipts ?? true,
    notes: bank?.notes || '',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: any = { ...form, school_id: schoolId, branch: form.branch || null, notes: form.notes || null };
      const { error } = bank
        ? await supabase.from('bank_accounts').update(payload).eq('id', bank.id)
        : await supabase.from('bank_accounts').insert(payload);
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
          <h3 className="font-semibold text-gray-900">{bank ? 'Edit bank account' : 'New bank account'}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5 text-gray-500" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="label">Bank *</label>
            <select required className="input" value={form.bank_name} onChange={(e) => setForm({ ...form, bank_name: e.target.value })}>
              <option value="">Select bank</option>
              {NIGERIAN_BANKS.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Account name *</label>
            <input type="text" required className="input" placeholder="e.g. Test Academy Ltd"
              value={form.account_name} onChange={(e) => setForm({ ...form, account_name: e.target.value })} />
          </div>
          <div>
            <label className="label">Account number *</label>
            <input type="text" required maxLength={12} className="input font-mono text-lg tracking-wider"
              placeholder="0123456789"
              value={form.account_number} onChange={(e) => setForm({ ...form, account_number: e.target.value.replace(/\D/g, '') })} />
          </div>
          <div>
            <label className="label">Branch (optional)</label>
            <input type="text" className="input" placeholder="e.g. Warri Main"
              value={form.branch} onChange={(e) => setForm({ ...form, branch: e.target.value })} />
          </div>
          <div className="space-y-1">
            <label className="flex items-center gap-2 p-2 cursor-pointer">
              <input type="checkbox" className="accent-indigo"
                checked={form.is_primary} onChange={(e) => setForm({ ...form, is_primary: e.target.checked })} />
              <span className="text-sm text-gray-700">Primary account</span>
            </label>
            <label className="flex items-center gap-2 p-2 cursor-pointer">
              <input type="checkbox" className="accent-indigo"
                checked={form.display_on_invoices} onChange={(e) => setForm({ ...form, display_on_invoices: e.target.checked })} />
              <span className="text-sm text-gray-700">Show on invoices</span>
            </label>
            <label className="flex items-center gap-2 p-2 cursor-pointer">
              <input type="checkbox" className="accent-indigo"
                checked={form.display_on_receipts} onChange={(e) => setForm({ ...form, display_on_receipts: e.target.checked })} />
              <span className="text-sm text-gray-700">Show on receipts</span>
            </label>
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
