'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import {
  ArrowLeft, Heart, Award, Save, Loader2, CheckCircle2, AlertCircle,
} from 'lucide-react';

const RATING_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: 'Poor', color: 'bg-red-500 text-white border-red-500' },
  2: { label: 'Fair', color: 'bg-orange-500 text-white border-orange-500' },
  3: { label: 'Good', color: 'bg-amber-500 text-white border-amber-500' },
  4: { label: 'Very Good', color: 'bg-sky-500 text-white border-sky-500' },
  5: { label: 'Excellent', color: 'bg-emerald-500 text-white border-emerald-500' },
};

interface Props {
  schoolId: string;
  student: any;
  term: any;
  termId: string;
  sectionId: string;
  affective: any[];
  psychomotor: any[];
  initial: any;
  settings: any;
}

export default function BehaviorEntryClient({ schoolId, student, term, termId, sectionId, affective, psychomotor, initial, settings }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [affectiveRatings, setAffectiveRatings] = useState<Record<string, number>>(initial?.affective || {});
  const [psychomotorRatings, setPsychomotorRatings] = useState<Record<string, number>>(initial?.psychomotor || {});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  function showToast(type: 'success' | 'error', msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 2500);
  }

  async function autoSave(field: 'affective' | 'psychomotor', name: string, value: number) {
    // Optimistic update
    if (field === 'affective') setAffectiveRatings(r => ({ ...r, [name]: value }));
    else setPsychomotorRatings(r => ({ ...r, [name]: value }));

    const newAffective = field === 'affective' ? { ...affectiveRatings, [name]: value } : affectiveRatings;
    const newPsycho = field === 'psychomotor' ? { ...psychomotorRatings, [name]: value } : psychomotorRatings;

    try {
      const { error } = await supabase.from('student_behavior').upsert({
        school_id: schoolId,
        student_id: student.id,
        term_id: termId,
        affective: newAffective,
        psychomotor: newPsycho,
      }, { onConflict: 'student_id,term_id' });
      if (error) throw error;
    } catch (err) {
      showToast('error', 'Save failed');
    }
  }

  const showAffective = settings?.show_affective !== false;
  const showPsychomotor = settings?.show_psychomotor !== false;

  const affectiveDone = Object.keys(affectiveRatings).length;
  const psychomotorDone = Object.keys(psychomotorRatings).length;

  return (
    <div className="space-y-4 pb-16">
      {/* Student header */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="flex items-center gap-3">
          <Link href={`/dashboard/grades/term/${termId}`} className="p-1 -ml-1 text-gray-400 hover:text-indigo hover:bg-gray-100 rounded">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
            {student.first_name[0]}{student.last_name[0]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-gray-900">{student.first_name} {student.middle_name && student.middle_name[0] + '.'} {student.last_name}</div>
            <div className="text-xs text-gray-500 font-mono">{student.admission_number} · {term.name}</div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-gray-50 rounded-lg p-3">
        <div className="text-[10px] font-semibold text-gray-500 uppercase mb-2">Rating scale</div>
        <div className="flex justify-between gap-1">
          {[1, 2, 3, 4, 5].map(n => (
            <div key={n} className="text-center flex-1">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center mx-auto ${RATING_LABELS[n].color}`}>
                <span className="text-sm font-bold">{n}</span>
              </div>
              <div className="text-[9px] text-gray-600 mt-1 font-medium">{RATING_LABELS[n].label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Affective */}
      {showAffective && affective.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-error" />
              <h3 className="font-semibold text-gray-900 text-sm">Affective (Behavior)</h3>
            </div>
            <div className="text-xs text-gray-500">{affectiveDone}/{affective.length}</div>
          </div>
          <div className="space-y-3">
            {affective.map(trait => (
              <RatingRow key={trait.id} name={trait.name}
                value={affectiveRatings[trait.name]}
                onChange={(v: number) => autoSave('affective', trait.name, v)} />
            ))}
          </div>
        </div>
      )}

      {/* Psychomotor */}
      {showPsychomotor && psychomotor.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-warning" />
              <h3 className="font-semibold text-gray-900 text-sm">Psychomotor (Skills)</h3>
            </div>
            <div className="text-xs text-gray-500">{psychomotorDone}/{psychomotor.length}</div>
          </div>
          <div className="space-y-3">
            {psychomotor.map(skill => (
              <RatingRow key={skill.id} name={skill.name}
                value={psychomotorRatings[skill.name]}
                onChange={(v: number) => autoSave('psychomotor', skill.name, v)} />
            ))}
          </div>
        </div>
      )}

      {(!showAffective || affective.length === 0) && (!showPsychomotor || psychomotor.length === 0) && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            No behavior traits or skills configured. <Link href="/dashboard/settings/report-card" className="font-semibold underline">Configure in Report Card settings</Link>.
          </div>
        </div>
      )}

      <div className="flex justify-between gap-2">
        <Link href={`/dashboard/grades/term/${termId}`} className="btn-secondary text-sm">← Back to term</Link>
      </div>

      {toast && (
        <div className={`fixed bottom-20 lg:bottom-6 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg ${
          toast.type === 'success' ? 'bg-success text-white' : 'bg-error text-white'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span className="text-sm font-medium">{toast.msg}</span>
        </div>
      )}
    </div>
  );
}

function RatingRow({ name, value, onChange }: any) {
  return (
    <div className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
      <div className="text-sm font-medium text-gray-900 mb-2">{name}</div>
      <div className="grid grid-cols-5 gap-1.5">
        {[1, 2, 3, 4, 5].map(n => {
          const active = value === n;
          return (
            <button key={n} onClick={() => onChange(n)}
              className={`h-11 rounded-lg border-2 font-bold text-sm transition-all ${
                active ? RATING_LABELS[n].color + ' shadow-md scale-105' : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300'
              }`}>
              {n}
            </button>
          );
        })}
      </div>
    </div>
  );
}
