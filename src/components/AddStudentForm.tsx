'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import {
  User, Heart, MapPin, GraduationCap, Users as UsersIcon,
  Loader2, AlertCircle, Save, Plus, Info,
} from 'lucide-react';

const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue',
  'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu',
  'FCT (Abuja)', 'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina',
  'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo',
  'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara',
];

interface Props {
  schoolId: string;
  sections: any[];
  classes: any[];
  classLevels: any[];
  houses: any[];
  currentSession: any;
  schoolShortCode: string;
}

export default function AddStudentForm({
  schoolId, sections: initialSections, classes: initialClasses, classLevels, houses, currentSession, schoolShortCode,
}: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [sections, setSections] = useState(initialSections);
  const [classes, setClasses] = useState(initialClasses);

  // 'none' = student added to class without any arm; '' = nothing selected yet
  const [armChoice, setArmChoice] = useState<'none' | string>('');

  const year = new Date().getFullYear().toString().slice(-2);
  const defaultAdmission = `${schoolShortCode}/${year}/${String(Math.floor(Math.random() * 9000) + 1000)}`;

  const [form, setForm] = useState({
    admission_number: defaultAdmission,
    admission_date: new Date().toISOString().slice(0, 10),
    first_name: '', middle_name: '', last_name: '',
    gender: '', date_of_birth: '', place_of_birth: '',
    nationality: 'Nigerian', state_of_origin: '', lga: '', religion: '',
    blood_group: '', genotype: '', medical_alert_flag: false, special_needs: '',
    home_address: '', city: '', state: '',
    class_level_id: '',
    section_id: '',
    stream: '',
    house_id: '',
    is_boarder: false, transport_mode: '',
    previous_school_name: '', previous_school_class: '',
    notes: '',
  });

  const selectedLevel = useMemo(
    () => classLevels.find(l => l.id === form.class_level_id),
    [classLevels, form.class_level_id]
  );

  const isSeniorSecondary = selectedLevel?.category === 'senior_secondary';

  const availableSections = useMemo(() => {
    if (!form.class_level_id) return [];
    const cls = classes.find(c => c.class_level_id === form.class_level_id && c.session_id === currentSession?.id);
    if (!cls) return [];
    return sections.filter(s => s.class_id === cls.id);
  }, [form.class_level_id, sections, classes, currentSession]);

  // Reset when class changes
  useEffect(() => {
    setForm(f => ({ ...f, section_id: '', stream: '' }));
    setArmChoice('');
    setError(null);
  }, [form.class_level_id]);

  async function ensureClassAndSetNoneArm() {
    // Called when user picks "None" for arms
    // Creates a class row (if needed) and a section named exactly like the class
    if (!currentSession || !form.class_level_id || !selectedLevel) return;
    setCreating(true);
    setError(null);
    try {
      let cls = classes.find(c => c.class_level_id === form.class_level_id && c.session_id === currentSession.id);
      if (!cls) {
        const { data: newCls, error: cErr } = await supabase.from('classes').insert({
          school_id: schoolId,
          session_id: currentSession.id,
          class_level_id: form.class_level_id,
          name: selectedLevel.name,
        }).select().single();
        if (cErr) throw cErr;
        cls = newCls;
        setClasses(prev => [...prev, cls]);
      }

      // Check if a "none arm" section already exists (named exactly like the class)
      let noneSec = sections.find(s => s.class_id === cls!.id && s.name === selectedLevel.name);
      if (!noneSec) {
        const { data: newSec, error: sErr } = await supabase.from('sections').insert({
          school_id: schoolId,
          class_id: cls.id,
          name: selectedLevel.name, // section name = class name (no arm suffix)
          full_name: selectedLevel.name,
          capacity: 40,
        }).select().single();
        if (sErr) throw sErr;
        noneSec = newSec;
        setSections(prev => [...prev, noneSec!]);
      }

      setForm(f => ({ ...f, section_id: noneSec!.id }));
      setArmChoice('none');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not set up class');
      setArmChoice('');
    } finally {
      setCreating(false);
    }
  }

  async function createNewArm(armName: string) {
    if (!currentSession || !form.class_level_id || !selectedLevel) return;
    setCreating(true);
    setError(null);
    try {
      let cls = classes.find(c => c.class_level_id === form.class_level_id && c.session_id === currentSession.id);
      if (!cls) {
        const { data: newCls, error: cErr } = await supabase.from('classes').insert({
          school_id: schoolId,
          session_id: currentSession.id,
          class_level_id: form.class_level_id,
          name: selectedLevel.name,
        }).select().single();
        if (cErr) throw cErr;
        cls = newCls;
        setClasses(prev => [...prev, cls]);
      }

      const payload: any = {
        school_id: schoolId,
        class_id: cls.id,
        name: armName,
        full_name: `${selectedLevel.name} ${armName}`,
        capacity: 40,
      };
      if (isSeniorSecondary && form.stream) payload.stream = form.stream;

      const { data: newSec, error: sErr } = await supabase.from('sections').insert(payload).select().single();
      if (sErr) throw sErr;

      setSections(prev => [...prev, newSec]);
      setForm(f => ({ ...f, section_id: newSec.id }));
      setArmChoice(newSec.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create arm');
    } finally {
      setCreating(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolId,
          sessionId: currentSession?.id,
          student: {
            admission_number: form.admission_number,
            admission_date: form.admission_date,
            first_name: form.first_name,
            middle_name: form.middle_name || null,
            last_name: form.last_name,
            gender: form.gender || null,
            date_of_birth: form.date_of_birth || null,
            place_of_birth: form.place_of_birth || null,
            nationality: form.nationality,
            state_of_origin: form.state_of_origin || null,
            lga: form.lga || null,
            religion: form.religion || null,
            blood_group: form.blood_group || null,
            genotype: form.genotype || null,
            medical_alert_flag: form.medical_alert_flag,
            special_needs: form.special_needs || null,
            home_address: form.home_address || null,
            city: form.city || null,
            state: form.state || null,
            house_id: form.house_id || null,
            is_boarder: form.is_boarder,
            transport_mode: form.transport_mode || null,
            previous_school_name: form.previous_school_name || null,
            previous_school_class: form.previous_school_class || null,
            notes: form.notes || null,
          },
          sectionId: form.section_id || null,
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to add student');
      router.push(`/dashboard/students/${result.studentId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
      setSaving(false);
    }
  }

  const sectionDisplayName = (s: any) => {
    if (s.name === selectedLevel?.name) return selectedLevel.name;
    return `${selectedLevel?.name} ${s.name}`;
  };

  // Arms UI: only shown when a class is picked
  // Options: existing sections (excluding the "none arm" one), "None" button, "+ New arm" button
  const armSections = availableSections.filter(s => s.name !== selectedLevel?.name);

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-24 lg:pb-8">
      {!currentSession && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            No current session set. Student will be added but not enrolled.{' '}
            <Link href="/dashboard/settings/academic" className="font-semibold underline">Set current session</Link>
          </div>
        </div>
      )}

      <FormCard icon={User} iconColor="text-indigo" iconBg="bg-indigo-50" title="Basic information" desc="Names and admission details">
        <div>
          <label className="label">Admission number *</label>
          <input type="text" required className="input font-mono text-sm"
            value={form.admission_number} onChange={(e) => setForm({ ...form, admission_number: e.target.value })} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div><label className="label">First name *</label><input type="text" required className="input" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} /></div>
          <div><label className="label">Middle name</label><input type="text" className="input" value={form.middle_name} onChange={(e) => setForm({ ...form, middle_name: e.target.value })} /></div>
          <div><label className="label">Last name *</label><input type="text" required className="input" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} /></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div><label className="label">Gender</label><select className="input" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}><option value="">Select</option><option value="male">Male</option><option value="female">Female</option></select></div>
          <div><label className="label">Date of birth</label><input type="date" className="input" value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} /></div>
          <div><label className="label">Admission date *</label><input type="date" required className="input" value={form.admission_date} onChange={(e) => setForm({ ...form, admission_date: e.target.value })} /></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div><label className="label">Place of birth</label><input type="text" className="input" placeholder="e.g. Lagos" value={form.place_of_birth} onChange={(e) => setForm({ ...form, place_of_birth: e.target.value })} /></div>
          <div><label className="label">Religion</label><select className="input" value={form.religion} onChange={(e) => setForm({ ...form, religion: e.target.value })}><option value="">Select</option><option value="Christianity">Christianity</option><option value="Islam">Islam</option><option value="Traditional">Traditional</option><option value="Other">Other</option></select></div>
        </div>
      </FormCard>

      <FormCard icon={MapPin} iconColor="text-sky-600" iconBg="bg-sky-50" title="Origin & residence" desc="State of origin and address">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div><label className="label">State of origin</label><select className="input" value={form.state_of_origin} onChange={(e) => setForm({ ...form, state_of_origin: e.target.value })}><option value="">Select state</option>{NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
          <div><label className="label">LGA</label><input type="text" className="input" placeholder="e.g. Ikeja" value={form.lga} onChange={(e) => setForm({ ...form, lga: e.target.value })} /></div>
        </div>
        <div><label className="label">Home address</label><input type="text" className="input" placeholder="e.g. 12 Adeola Odeku Street" value={form.home_address} onChange={(e) => setForm({ ...form, home_address: e.target.value })} /></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div><label className="label">City</label><input type="text" className="input" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
          <div><label className="label">State (residence)</label><select className="input" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })}><option value="">Select</option>{NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
        </div>
      </FormCard>

      <FormCard icon={Heart} iconColor="text-error" iconBg="bg-red-50" title="Health information" desc="Critical for emergencies">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div><label className="label">Blood group</label><select className="input font-mono" value={form.blood_group} onChange={(e) => setForm({ ...form, blood_group: e.target.value })}><option value="">Unknown</option>{['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(b => <option key={b} value={b}>{b}</option>)}</select></div>
          <div><label className="label">Genotype</label><select className="input font-mono" value={form.genotype} onChange={(e) => setForm({ ...form, genotype: e.target.value })}><option value="">Unknown</option><option value="AA">AA</option><option value="AS">AS</option><option value="SS">SS ⚠️</option><option value="AC">AC</option><option value="SC">SC</option></select></div>
        </div>
        <div><label className="label">Special needs / conditions</label><textarea rows={2} className="input" placeholder="e.g. Asthma, wears glasses, etc." value={form.special_needs} onChange={(e) => setForm({ ...form, special_needs: e.target.value })} /></div>
        <label className="flex items-start gap-3 p-3 bg-red-50 rounded-lg cursor-pointer border border-red-100">
          <input type="checkbox" className="mt-0.5 accent-error" checked={form.medical_alert_flag} onChange={(e) => setForm({ ...form, medical_alert_flag: e.target.checked })} />
          <div className="flex-1"><div className="text-sm font-medium text-red-900">Medical alert flag</div><div className="text-xs text-red-700 mt-0.5">Shows a warning icon to teachers</div></div>
        </label>
      </FormCard>

      <FormCard icon={GraduationCap} iconColor="text-success" iconBg="bg-emerald-50" title="Class & placement" desc="Pick a class, then an arm if you have arms">
        <div>
          <label className="label">Class {currentSession && '*'}</label>
          <select className="input" required={!!currentSession} disabled={!currentSession}
            value={form.class_level_id} onChange={(e) => setForm({ ...form, class_level_id: e.target.value })}>
            <option value="">
              {!currentSession ? 'Set current session first' :
                classLevels.length === 0 ? 'No class levels — set up in Classes' :
                'Select a class'}
            </option>
            {classLevels.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
          {classLevels.length === 0 && currentSession && (
            <p className="text-xs text-amber-700 mt-1"><Link href="/dashboard/settings/classes" className="font-semibold underline">Set up class levels first →</Link></p>
          )}
        </div>

        {/* Stream for SS */}
        {isSeniorSecondary && form.class_level_id && (
          <div>
            <label className="label">Stream *</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {['science', 'arts', 'commercial', 'technical'].map(s => (
                <button key={s} type="button" onClick={() => setForm({ ...form, stream: s })}
                  className={`p-2.5 rounded-lg border-2 text-sm capitalize font-medium transition-all ${
                    form.stream === s ? 'border-indigo bg-indigo-50 text-indigo-dark' : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700'
                  }`}>{s}</button>
              ))}
            </div>
          </div>
        )}

        {/* Arms picker — appears once class picked (and stream picked for SS) */}
        {form.class_level_id && (!isSeniorSecondary || form.stream) && (
          <div>
            <label className="label">Arm / Section</label>
            {creating ? (
              <div className="flex items-center gap-2 text-sm text-gray-600 p-3 bg-gray-50 rounded-lg">
                <Loader2 className="w-4 h-4 animate-spin text-indigo" />
                Setting up...
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {/* NONE option */}
                  <button
                    type="button"
                    onClick={ensureClassAndSetNoneArm}
                    className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                      armChoice === 'none' ? 'border-indigo bg-indigo-50 text-indigo-dark' : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700'
                    }`}
                  >
                    <div>None</div>
                    <div className="text-[10px] text-gray-500 mt-0.5">no arm</div>
                  </button>

                  {/* Existing arms */}
                  {armSections
                    .filter(s => !isSeniorSecondary || !form.stream || s.stream === form.stream || !s.stream)
                    .map(s => (
                      <button key={s.id} type="button" onClick={() => { setForm({ ...form, section_id: s.id }); setArmChoice(s.id); }}
                        className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                          armChoice === s.id ? 'border-indigo bg-indigo-50 text-indigo-dark' : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700'
                        }`}>
                        <div>{sectionDisplayName(s)}</div>
                        {s.stream && <div className="text-[10px] text-gray-500 uppercase mt-0.5">{s.stream}</div>}
                      </button>
                  ))}

                  {/* + New arm */}
                  <button type="button"
                    onClick={() => {
                      const nextLetter = String.fromCharCode(65 + armSections.length);
                      createNewArm(nextLetter);
                    }}
                    className="p-3 rounded-lg border-2 border-dashed border-gray-300 text-sm text-gray-500 hover:border-indigo hover:text-indigo transition-colors">
                    <Plus className="w-4 h-4 mx-auto mb-1" />
                    New arm
                  </button>
                </div>

                {armChoice === 'none' && (
                  <div className="mt-2 flex items-start gap-2 p-3 bg-emerald-50 border border-emerald-100 rounded-lg">
                    <Info className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-emerald-800">
                      Student will be enrolled in <strong>{selectedLevel?.name}</strong> without an arm. You can move them to an arm later.
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-gray-100">
          <div><label className="label">House</label><select className="input" value={form.house_id} onChange={(e) => setForm({ ...form, house_id: e.target.value })}><option value="">None / assign later</option>{houses.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}</select></div>
          <div><label className="label">Transport mode</label><select className="input" value={form.transport_mode} onChange={(e) => setForm({ ...form, transport_mode: e.target.value })}><option value="">Select</option><option value="parent_drop">Parent drop</option><option value="school_bus">School bus</option><option value="public_transport">Public transport</option><option value="walk">Walks to school</option><option value="private_transport">Private transport</option><option value="other">Other</option></select></div>
        </div>

        <label className="flex items-center gap-2 p-3 cursor-pointer">
          <input type="checkbox" className="accent-indigo" checked={form.is_boarder} onChange={(e) => setForm({ ...form, is_boarder: e.target.checked })} />
          <span className="text-sm">Is a boarder</span>
        </label>
      </FormCard>

      <FormCard icon={UsersIcon} iconColor="text-purple-600" iconBg="bg-purple-50" title="Previous school" desc="Optional — for transfer students">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div><label className="label">Previous school name</label><input type="text" className="input" value={form.previous_school_name} onChange={(e) => setForm({ ...form, previous_school_name: e.target.value })} /></div>
          <div><label className="label">Class attended</label><input type="text" className="input" placeholder="e.g. Primary 5" value={form.previous_school_class} onChange={(e) => setForm({ ...form, previous_school_class: e.target.value })} /></div>
        </div>
        <div><label className="label">Admin notes (private)</label><textarea rows={2} className="input" placeholder="Notes for staff only" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
      </FormCard>

      <div className="fixed bottom-16 lg:bottom-4 left-0 right-0 lg:left-64 z-30 p-4 bg-white lg:bg-white/95 lg:backdrop-blur-md border-t lg:border lg:mx-6 lg:rounded-xl border-gray-200 lg:shadow-lg flex items-center justify-between gap-3 max-w-4xl mx-auto lg:right-6">
        <div className="flex-1 min-w-0">
          {error && (
            <div className="flex items-center gap-2 text-xs text-error">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{error}</span>
            </div>
          )}
        </div>
        <Link href="/dashboard/students" className="btn-secondary text-sm">Cancel</Link>
        <button type="submit" disabled={saving || creating} className="btn-primary text-sm">
          {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Adding...</> : <><Save className="w-4 h-4 mr-2" />Add student</>}
        </button>
      </div>
    </form>
  );
}

function FormCard({ icon: Icon, iconColor, iconBg, title, desc, children }: any) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 lg:p-6 shadow-sm space-y-4">
      <div className="flex items-center gap-2">
        <div className={`w-8 h-8 ${iconBg} rounded-lg flex items-center justify-center`}>
          <Icon className={`w-4 h-4 ${iconColor}`} />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <p className="text-xs text-gray-500">{desc}</p>
        </div>
      </div>
      {children}
    </div>
  );
}