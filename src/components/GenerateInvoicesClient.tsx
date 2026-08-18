'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Sparkles, Wand2, Loader2, CheckCircle2, AlertCircle, Users,
  Calendar, ArrowRight, Info,
} from 'lucide-react';

interface Props {
  schoolId: string;
  sessions: any[];
  terms: any[];
  classLevels: any[];
  structuresCount: number;
}

export default function GenerateInvoicesClient({ schoolId, sessions, terms, classLevels, structuresCount }: Props) {
  const router = useRouter();
  const [sessionId, setSessionId] = useState(sessions.find(s => s.is_current)?.id || sessions[0]?.id || '');
  const [termId, setTermId] = useState(terms.find(t => t.is_current)?.id || '');
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<{ created: number; skipped: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const termsForSession = terms.filter(t => t.session_id === sessionId);

  function toggleClass(id: string) {
    setSelectedClasses(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  function selectAll() { setSelectedClasses(classLevels.map(c => c.id)); }
  function clearAll() { setSelectedClasses([]); }

  async function generate() {
    setGenerating(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/fees/invoices/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolId, sessionId, termId,
          classLevelIds: selectedClasses.length > 0 ? selectedClasses : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult({ created: data.created, skipped: data.skipped });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    } finally { setGenerating(false); }
  }

  if (structuresCount === 0) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 lg:p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-amber-900">Fee structures not set up</h3>
            <p className="text-sm text-amber-800 mt-1 mb-3">You need to define what each class pays before generating invoices.</p>
            <Link href="/dashboard/fees/setup" className="btn-primary text-sm">
              Set up fee structures
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (result) {
    return (
      <div className="bg-white rounded-xl border border-emerald-200 p-6 lg:p-8 text-center">
        <div className="w-16 h-16 bg-success rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Invoices generated!</h2>
        <p className="text-sm text-gray-600 mb-6">
          <strong className="text-emerald-700">{result.created}</strong> invoices created
          {result.skipped > 0 && ` · ${result.skipped} skipped (already existed)`}
        </p>
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <button onClick={() => { setResult(null); setSelectedClasses([]); }} className="btn-secondary text-sm">
            Generate more
          </button>
          <Link href="/dashboard/fees/invoices" className="btn-primary text-sm">
            View invoices
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 p-4 lg:p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
            <Calendar className="w-4 h-4 text-indigo" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Which term?</h3>
            <p className="text-xs text-gray-500">Pick the session and term to invoice</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="label">Session *</label>
            <select className="input" value={sessionId} onChange={(e) => { setSessionId(e.target.value); setTermId(''); }}>
              {sessions.map(s => <option key={s.id} value={s.id}>{s.name}{s.is_current ? ' (current)' : ''}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Term *</label>
            <select className="input" required value={termId} onChange={(e) => setTermId(e.target.value)}>
              <option value="">Pick a term</option>
              {termsForSession.map(t => <option key={t.id} value={t.id}>{t.name}{t.is_current ? ' (current)' : ''}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 lg:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
              <Users className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Which classes?</h3>
              <p className="text-xs text-gray-500">Select classes, or leave all unchecked to bill all classes</p>
            </div>
          </div>
          <div className="flex gap-1">
            <button type="button" onClick={selectAll} className="text-xs text-indigo hover:underline">All</button>
            <span className="text-xs text-gray-300">·</span>
            <button type="button" onClick={clearAll} className="text-xs text-gray-500 hover:underline">Clear</button>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {classLevels.map(cl => {
            const selected = selectedClasses.includes(cl.id);
            return (
              <button key={cl.id} type="button" onClick={() => toggleClass(cl.id)}
                className={`p-2.5 rounded-lg border-2 text-sm font-medium transition-all text-left ${
                  selected ? 'border-indigo bg-indigo-50 text-indigo-dark' : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700'
                }`}>
                <div>{cl.name}</div>
              </button>
            );
          })}
        </div>
        {selectedClasses.length === 0 && (
          <div className="text-xs text-gray-500 flex items-start gap-1.5">
            <Info className="w-3 h-3 flex-shrink-0 mt-0.5" />
            No classes selected — all classes will be billed
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-error flex-shrink-0 mt-0.5" />
          <span className="text-sm text-red-800">{error}</span>
        </div>
      )}

      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-indigo flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm text-indigo-dark font-medium">What happens next</p>
          <ul className="text-xs text-gray-700 mt-1 space-y-0.5 list-disc list-inside">
            <li>Each active student in the selected classes gets one invoice</li>
            <li>Fees are based on your fee structures for this term</li>
            <li>Optional and boarding-only fees are handled automatically</li>
            <li>Students who already have an invoice for this term are skipped</li>
          </ul>
        </div>
      </div>

      <div className="flex gap-2 justify-end">
        <Link href="/dashboard/fees" className="btn-secondary text-sm">Cancel</Link>
        <button onClick={generate} disabled={!termId || generating} className="btn-primary text-sm">
          {generating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating...</> : <><Wand2 className="w-4 h-4 mr-2" />Generate invoices</>}
        </button>
      </div>
    </div>
  );
}
