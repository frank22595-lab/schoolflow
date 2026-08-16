'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  User, Heart, MapPin, GraduationCap, Users as UsersIcon,
  Loader2, AlertCircle, Check, ArrowLeft, Save,
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
  schoolId, sections, classes, classLevels, houses, currentSession, schoolShortCode,
}: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const year = new Date().getFullYear().toString().slice(-2);
  const defaultAdmission = `${schoolShortCode}/${year}/${String(Math.floor(Math.random() * 9000) + 1000)}`;

  const [form, setForm] = useState({
    // Identity
    admission_number: defaultAdmission,
    admission_date: new Date().toISOString().slice(0, 10),
    first_name: '',
    middle_name: '',
    last_name: '',
    // Demographics
    gender: '',
    date_of_birth: '',
    place_of_birth: '',
    nationality: 'Nigerian',
    state_of_origin: '',
    lga: '',
    religion: '',
    // Health
    blood_group: '',
    genotype: '',
    medical_alert_flag: false,
    special_needs: '',
    // Address
    home_address: '',
    city: '',
    state: '',
    // Placement
    section_id: '',
    house_id: '',
    // Boarding
    is_boarder: false,
    transport_mode: '',
    // Previous
    previous_school_name: '',
    previous_school_class: '',
    // Notes
    notes: '',
  });

  // Group sections by class level for dropdown
  const sectionsByLevel = useMemo(() => {
    const groups: Record<string, any[]> = {};
    sections.forEach(s => {
      const cls = classes.find(c => c.id === s.class_id);
      const level = classLevels.find(l => l.id === cls?.class_level_id);
      const levelName = level?.name || 'Unknown';
      if (!groups[levelName]) groups[levelName] = [];
      groups[levelName].push({ ...s, levelName, fullLabel: `${levelName} ${s.name}` });
    });
    return groups;
  }, [sections, classes, classLevels]);

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

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-24 lg:pb-8">
      {!currentSession && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            No current session set. Student will be added but not enrolled in any section.{' '}
            <Link href="/dashboard/settings/academic" className="font-semibold underline">Set current session</Link>
          </div>
        </div>
      )}

      {/* Basic Info */}
      <FormCard icon={User} iconColor="text-indigo" iconBg="bg-indigo-50" title="Basic information" desc="Names and admission details">
        <div>
          <label className="label">Admission number *</label>
          <input type="text" required className="input font-mono text-sm"
            value={form.admission_number} onChange={(e) => setForm({ ...form, admission_number: e.target.value })} />
          <p className="text-xs text-gray-500 mt-1">Auto-generated. Change if you have a specific format.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="label">First name *</label>
            <input type="text" required className="input"
              value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
          </div>
          <div>
            <label className="label">Middle name</label>
            <input type="text" className="input"
              value={form.middle_name} onChange={(e) => setForm({ ...form, middle_name: e.target.value })} />
          </div>
          <div>
            <label className="label">Last name *</label>
            <input type="text" required className="input"
              value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="label">Gender</label>
            <select className="input"
              value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
              <option value="">Select</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
          <div>
            <label className="label">Date of birth</label>
            <input type="date" className="input"
              value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} />
          </div>
          <div>
            <label className="label">Admission date *</label>
            <input type="date" required className="input"
              value={form.admission_date} onChange={(e) => setForm({ ...form, admission_date: e.target.value })} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="label">Place of birth</label>
            <input type="text" className="input" placeholder="e.g. Lagos"
              value={form.place_of_birth} onChange={(e) => setForm({ ...form, place_of_birth: e.target.value })} />
          </div>
          <div>
            <label className="label">Religion</label>
            <select className="input"
              value={form.religion} onChange={(e) => setForm({ ...form, religion: e.target.value })}>
              <option value="">Select</option>
              <option value="Christianity">Christianity</option>
              <option value="Islam">Islam</option>
              <option value="Traditional">Traditional</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
      </FormCard>

      {/* Nigerian identity */}
      <FormCard icon={MapPin} iconColor="text-sky-600" iconBg="bg-sky-50" title="Origin & residence" desc="State of origin and current address">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="label">State of origin</label>
            <select className="input"
              value={form.state_of_origin} onChange={(e) => setForm({ ...form, state_of_origin: e.target.value })}>
              <option value="">Select state</option>
              {NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="label">LGA (Local Government Area)</label>
            <input type="text" className="input" placeholder="e.g. Ikeja"
              value={form.lga} onChange={(e) => setForm({ ...form, lga: e.target.value })} />
          </div>
        </div>

        <div>
          <label className="label">Home address</label>
          <input type="text" className="input" placeholder="e.g. 12 Adeola Odeku Street"
            value={form.home_address} onChange={(e) => setForm({ ...form, home_address: e.target.value })} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="label">City</label>
            <input type="text" className="input"
              value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </div>
          <div>
            <label className="label">State (residence)</label>
            <select className="input"
              value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })}>
              <option value="">Select</option>
              {NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </FormCard>

      {/* Health */}
      <FormCard icon={Heart} iconColor="text-error" iconBg="bg-red-50" title="Health information" desc="Critical for emergencies — teachers only see alerts, not full records">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="label">Blood group</label>
            <select className="input font-mono"
              value={form.blood_group} onChange={(e) => setForm({ ...form, blood_group: e.target.value })}>
              <option value="">Unknown</option>
              {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Genotype</label>
            <select className="input font-mono"
              value={form.genotype} onChange={(e) => setForm({ ...form, genotype: e.target.value })}>
              <option value="">Unknown</option>
              <option value="AA">AA</option>
              <option value="AS">AS</option>
              <option value="SS">SS ⚠️</option>
              <option value="AC">AC</option>
              <option value="SC">SC</option>
            </select>
          </div>
        </div>

        <div>
          <label className="label">Special needs / conditions</label>
          <textarea rows={2} className="input"
            placeholder="e.g. Asthma, wears glasses, hearing aid, etc."
            value={form.special_needs} onChange={(e) => setForm({ ...form, special_needs: e.target.value })} />
        </div>

        <label className="flex items-start gap-3 p-3 bg-red-50 rounded-lg cursor-pointer border border-red-100">
          <input type="checkbox" className="mt-0.5 accent-error"
            checked={form.medical_alert_flag} onChange={(e) => setForm({ ...form, medical_alert_flag: e.target.checked })} />
          <div className="flex-1">
            <div className="text-sm font-medium text-red-900">Medical alert flag</div>
            <div className="text-xs text-red-700 mt-0.5">
              Shows a warning icon to teachers so they know to check medical records
            </div>
          </div>
        </label>
      </FormCard>

      {/* Placement */}
      <FormCard icon={GraduationCap} iconColor="text-success" iconBg="bg-emerald-50" title="Class & placement" desc="Which section will this student join?">
        <div>
          <label className="label">Section {currentSession && '*'}</label>
          <select className="input" required={!!currentSession} disabled={!currentSession}
            value={form.section_id} onChange={(e) => setForm({ ...form, section_id: e.target.value })}>
            <option value="">{currentSession ? 'Select section' : 'Set current session first'}</option>
            {Object.entries(sectionsByLevel).map(([levelName, secs]) => (
              <optgroup key={levelName} label={levelName}>
                {secs.map((s: any) => (
                  <option key={s.id} value={s.id}>{s.fullLabel}{s.stream ? ` (${s.stream})` : ''}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        <div>
          <label className="label">House</label>
          <select className="input"
            value={form.house_id} onChange={(e) => setForm({ ...form, house_id: e.target.value })}>
            <option value="">None / assign later</option>
            {houses.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="label">Transport mode</label>
            <select className="input"
              value={form.transport_mode} onChange={(e) => setForm({ ...form, transport_mode: e.target.value })}>
              <option value="">Select</option>
              <option value="parent_drop">Parent drop</option>
              <option value="school_bus">School bus</option>
              <option value="public_transport">Public transport</option>
              <option value="walk">Walks to school</option>
              <option value="private_transport">Private transport</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 p-3 cursor-pointer">
              <input type="checkbox" className="accent-indigo"
                checked={form.is_boarder} onChange={(e) => setForm({ ...form, is_boarder: e.target.checked })} />
              <span className="text-sm">Is a boarder</span>
            </label>
          </div>
        </div>
      </FormCard>

      {/* Previous school */}
      <FormCard icon={UsersIcon} iconColor="text-purple-600" iconBg="bg-purple-50" title="Previous school" desc="Optional — for transfer students">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="label">Previous school name</label>
            <input type="text" className="input"
              value={form.previous_school_name} onChange={(e) => setForm({ ...form, previous_school_name: e.target.value })} />
          </div>
          <div>
            <label className="label">Class attended</label>
            <input type="text" className="input" placeholder="e.g. Primary 5"
              value={form.previous_school_class} onChange={(e) => setForm({ ...form, previous_school_class: e.target.value })} />
          </div>
        </div>

        <div>
          <label className="label">Admin notes (private)</label>
          <textarea rows={2} className="input"
            placeholder="Any notes for staff — not visible to parents"
            value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </div>
      </FormCard>

      {/* Sticky save bar */}
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
        <button type="submit" disabled={saving} className="btn-primary text-sm">
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
