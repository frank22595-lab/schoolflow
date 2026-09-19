'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Award, Heart, MessageSquare, Loader2, Plus, Trash2,
  CheckCircle2, AlertCircle, Sparkles, Save, Palette, ArrowRight,
} from 'lucide-react';

interface Props {
  schoolId: string;
  initialAffective: any[];
  initialPsychomotor: any[];
  initialComments: any[];
}

export default function ReportCardSettingsClient({ schoolId, initialAffective, initialPsychomotor, initialComments }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<'affective' | 'psychomotor' | 'comments'>('affective');
  const [affective, setAffective] = useState(initialAffective);
  const [psychomotor, setPsychomotor] = useState(initialPsychomotor);
  const [comments, setComments] = useState(initialComments);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  function showToast(type: 'success' | 'error', msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  }

  async function saveAll() {
    setSaving(true);
    try {
      const res = await fetch('/api/report-card-settings', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schoolId, affective, psychomotor, comments }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast('success', 'Saved');
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function seedDefaults() {
    if (!confirm('Add Nigerian standard affective traits, psychomotor skills, and default comment presets?')) return;
    setSeeding(true);
    try {
      const res = await fetch('/api/report-card-settings', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schoolId, seed: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAffective(data.affective || []);
      setPsychomotor(data.psychomotor || []);
      setComments(data.comments || []);
      router.refresh();
      showToast('success', 'Defaults added');
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Seed failed');
    } finally {
      setSeeding(false);
    }
  }

  const noDataYet = affective.length === 0 && psychomotor.length === 0 && comments.length === 0;

  return (
    <div className="space-y-4">
      {noDataYet && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-4 flex items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-indigo flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">Start with defaults</h3>
              <p className="text-xs text-gray-600 mt-0.5">Add 10 Nigerian affective traits, 8 psychomotor skills, and preset comments</p>
            </div>
          </div>
          <button onClick={seedDefaults} disabled={seeding} className="btn-primary text-sm flex-shrink-0">
            {seeding ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" />Adding...</> : 'Add defaults'}
          </button>
        </div>
      )}

      {/* Link to the full Report Card Designer */}
      <Link href="/dashboard/settings/report-cards"
        className="flex items-center justify-between gap-3 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-4 hover:shadow-md transition-shadow group">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 bg-indigo rounded-lg flex items-center justify-center flex-shrink-0">
            <Palette className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">Report Card Designer</h3>
            <p className="text-xs text-gray-600 mt-0.5">Template, branding, class colors, and what appears on printed reports</p>
          </div>
        </div>
        <ArrowRight className="w-4 h-4 text-indigo group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
      </Link>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-100 overflow-x-auto">
          {[
            { id: 'affective', label: 'Behavior traits', icon: Heart, count: affective.length },
            { id: 'psychomotor', label: 'Skills', icon: Award, count: psychomotor.length },
            { id: 'comments', label: 'Comment presets', icon: MessageSquare, count: comments.length },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id as any)}
              className={`flex-1 min-w-[110px] px-3 py-3 flex flex-col items-center gap-1 text-xs font-medium transition-colors ${
                tab === t.id ? 'bg-indigo-50 text-indigo border-b-2 border-indigo' : 'text-gray-500 hover:bg-gray-50'
              }`}>
              <t.icon className="w-4 h-4" />
              <span>{t.label}</span>
              {t.count !== undefined && <span className="text-[10px] bg-gray-100 text-gray-600 rounded-full px-1.5">{t.count}</span>}
            </button>
          ))}
        </div>
      </div>

      {tab === 'affective' && (
        <ListEditor title="Behavior traits (Affective domain)"
          items={affective} setItems={setAffective}
          desc="Rated 1-5. Common: Punctuality, Neatness, Honesty..." />
      )}
      {tab === 'psychomotor' && (
        <ListEditor title="Psychomotor skills"
          items={psychomotor} setItems={setPsychomotor}
          desc="Rated 1-5. Common: Handwriting, Games, Music..." />
      )}
      {tab === 'comments' && (
        <CommentsEditor comments={comments} setComments={setComments} />
      )}

      {/* Sticky save */}
      <div className="fixed bottom-16 lg:bottom-4 left-0 right-0 lg:left-64 z-30 p-3 bg-white/95 backdrop-blur border-t lg:border lg:mx-6 lg:rounded-xl border-gray-200 lg:shadow-lg flex justify-end gap-2 max-w-5xl mx-auto lg:right-6">
        <button onClick={saveAll} disabled={saving} className="btn-primary text-sm">
          {saving ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" />Saving...</> : <><Save className="w-4 h-4 mr-1" />Save all</>}
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

function ListEditor({ title, items, setItems, desc }: any) {
  const [newItem, setNewItem] = useState('');

  function add() {
    if (!newItem.trim()) return;
    setItems([...items, { name: newItem.trim(), sequence: items.length + 1, is_active: true, _new: true }]);
    setNewItem('');
  }
  function remove(i: number) { setItems(items.filter((_: any, idx: number) => idx !== i)); }
  function update(i: number, field: string, value: any) {
    setItems(items.map((it: any, idx: number) => idx === i ? { ...it, [field]: value } : it));
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 lg:p-6 space-y-4">
      <div>
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
      </div>

      <div className="flex gap-2">
        <input className="input flex-1 text-sm" placeholder="Add new..."
          value={newItem} onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), add())} />
        <button onClick={add} className="btn-primary text-sm"><Plus className="w-4 h-4" /></button>
      </div>

      <div className="space-y-1">
        {items.map((item: any, i: number) => (
          <div key={item.id || i} className="flex items-center gap-2 p-2 border border-gray-100 rounded-lg">
            <input type="checkbox" className="accent-indigo" checked={item.is_active}
              onChange={(e) => update(i, 'is_active', e.target.checked)} />
            <input className="input text-sm flex-1" value={item.name}
              onChange={(e) => update(i, 'name', e.target.value)} />
            <button onClick={() => remove(i)} className="p-1 text-gray-400 hover:text-error"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        ))}
        {items.length === 0 && (
          <div className="text-sm text-gray-500 text-center py-4">No items yet. Add some or use the "Add defaults" button above.</div>
        )}
      </div>
    </div>
  );
}

function CommentsEditor({ comments, setComments }: any) {
  const [type, setType] = useState<'teacher' | 'principal' | 'grade'>('teacher');
  const [newText, setNewText] = useState('');
  const [minS, setMinS] = useState('');
  const [maxS, setMaxS] = useState('');

  const filtered = comments.filter((c: any) => c.comment_type === type);

  function add() {
    if (!newText.trim()) return;
    setComments([...comments, {
      comment_type: type,
      text: newText.trim(),
      score_min: minS ? Number(minS) : null,
      score_max: maxS ? Number(maxS) : null,
      sequence: comments.length + 1,
      is_active: true,
      _new: true,
    }]);
    setNewText(''); setMinS(''); setMaxS('');
  }
  function remove(id: any, i: number) {
    setComments(comments.filter((c: any, idx: number) =>
      c.id ? c.id !== id : idx !== comments.indexOf(comments[i])
    ));
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 lg:p-6 space-y-4">
      <div>
        <h3 className="font-semibold text-gray-900">Comment presets</h3>
        <p className="text-xs text-gray-500 mt-0.5">Preset comments teachers/principals can pick from. Score range auto-suggests based on total.</p>
      </div>

      <div className="flex gap-1">
        {(['teacher', 'principal', 'grade'] as const).map(t => (
          <button key={t} onClick={() => setType(t)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize ${
              type === t ? 'bg-indigo text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>
            {t} comments
          </button>
        ))}
      </div>

      <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-2 gap-2">
          <input type="number" placeholder="Min score" className="input text-sm" value={minS} onChange={(e) => setMinS(e.target.value)} />
          <input type="number" placeholder="Max score" className="input text-sm" value={maxS} onChange={(e) => setMaxS(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <input className="input flex-1 text-sm" placeholder="Comment text..."
            value={newText} onChange={(e) => setNewText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), add())} />
          <button onClick={add} className="btn-primary text-sm"><Plus className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="space-y-1">
        {filtered.map((c: any, i: number) => (
          <div key={c.id || `new-${i}`} className="flex items-start gap-2 p-2 border border-gray-100 rounded-lg">
            <div className="flex-1 min-w-0">
              <div className="text-sm text-gray-900">{c.text}</div>
              {(c.score_min || c.score_max) && (
                <div className="text-[10px] text-gray-500 mt-0.5">
                  Range: {c.score_min || 0}–{c.score_max || 100}
                </div>
              )}
            </div>
            <button onClick={() => remove(c.id, comments.indexOf(c))} className="p-1 text-gray-400 hover:text-error"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-sm text-gray-500 text-center py-4">No {type} comments yet</div>
        )}
      </div>
    </div>
  );
}
