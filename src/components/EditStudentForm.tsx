'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  User, Heart, MapPin, Loader2, AlertCircle, Save,
  GraduationCap, Trash2,
} from 'lucide-react';

const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue',
  'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu',
  'FCT (Abuja)', 'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina',
  'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo',
  'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara',
];

interface Props {
  student: any;
  houses: any[];
}

export default function EditStudentForm({ student, houses }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDelete, setShowDelete] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const [form, setForm] = useState({
    admission_number: student.admission_number,
    first_name: student.first_name || '',
    middle_name: student.middle_name || '',
    last_name: student.last_name || '',
    gender: student.gender || '',
    date_of_birth: student.date_of_birth || '',
    place_of_birth: student.place_of_birth || '',
    nationality: student.nationality || 'Nigerian',
    state_of_origin: student.state_of_origin || '',
    lga: student.lga || '',
    religion: student.religion || '',
    blood_group: student.blood_group || '',
    genotype: student.genotype || '',
    medical_alert_flag: student.medical_alert_flag || false,
    special_needs: student.special_needs || '',
    home_address: student.home_address || '',
    city: student.city || '',
    state: student.state || '',
    house_id: student.house_id || '',
    is_boarder: student.is_boarder || false,
    transport_mode: student.transport_mode || '',
    notes: student.notes || '',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload: any = {
        ...form,
        middle_name: form.middle_name || null,
        gender: form.gender || null,
        date_of_birth: form.date_of_birth || null,
        place_of_birth: form.place_of_birth || null,
        state_of_origin: form.state_of_origin || null,
        lga: form.lga || null,
        religion: form.religion || null,
        blood_group: form.blood_group || null,
        genotype: form.genotype || null,
        special_needs: form.special_needs || null,
        home_address: form.home_address || null,
        city: form.city || null,
        state: form.state || null,
        house_id: form.house_id || null,
        transport_mode: form.transport_mode || null,
        notes: form.notes || null,
      };
      const res = await fetch(`/api/students/${student.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student: payload }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      router.push(`/dashboard/students/${student.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/students/${student.id}`, { method: 'DELETE' });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      router.push('/dashboard/students');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
      setDeleting(false);
    }
  }

  const fullName = `${student.first_name} ${student.last_name}`;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-24 lg:pb-8">
      <FormCard icon={User} iconColor="text-indigo" iconBg="bg-indigo-50" title="Basic information" desc="Names and admission">
        <div>
          <label className="label">Admission number *</label>
          <input type="text" required className="input font-mono text-sm" value={form.admission_number} onChange={(e) => setForm({ ...form, admission_number: e.target.value })} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div><label className="label">First name *</label><input type="text" required className="input" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} /></div>
          <div><label className="label">Middle name</label><input type="text" className="input" value={form.middle_name} onChange={(e) => setForm({ ...form, middle_name: e.target.value })} /></div>
          <div><label className="label">Last name *</label><input type="text" required className="input" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} /></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div><label className="label">Gender</label><select className="input" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}><option value="">Select</option><option value="male">Male</option><option value="female">Female</option></select></div>
          <div><label className="label">Date of birth</label><input type="date" className="input" value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} /></div>
          <div><label className="label">Religion</label><select className="input" value={form.religion} onChange={(e) => setForm({ ...form, religion: e.target.value })}><option value="">Select</option><option value="Christianity">Christianity</option><option value="Islam">Islam</option><option value="Traditional">Traditional</option><option value="Other">Other</option></select></div>
        </div>
      </FormCard>

      <FormCard icon={MapPin} iconColor="text-sky-600" iconBg="bg-sky-50" title="Origin & residence" desc="Address details">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div><label className="label">State of origin</label><select className="input" value={form.state_of_origin} onChange={(e) => setForm({ ...form, state_of_origin: e.target.value })}><option value="">Select</option>{NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
          <div><label className="label">LGA</label><input type="text" className="input" value={form.lga} onChange={(e) => setForm({ ...form, lga: e.target.value })} /></div>
        </div>
        <div><label className="label">Home address</label><input type="text" className="input" value={form.home_address} onChange={(e) => setForm({ ...form, home_address: e.target.value })} /></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div><label className="label">City</label><input type="text" className="input" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
          <div><label className="label">State (residence)</label><select className="input" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })}><option value="">Select</option>{NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
        </div>
      </FormCard>

      <FormCard icon={Heart} iconColor="text-error" iconBg="bg-red-50" title="Health" desc="Critical for emergencies">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div><label className="label">Blood group</label><select className="input font-mono" value={form.blood_group} onChange={(e) => setForm({ ...form, blood_group: e.target.value })}><option value="">Unknown</option>{['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(b => <option key={b} value={b}>{b}</option>)}</select></div>
          <div><label className="label">Genotype</label><select className="input font-mono" value={form.genotype} onChange={(e) => setForm({ ...form, genotype: e.target.value })}><option value="">Unknown</option><option value="AA">AA</option><option value="AS">AS</option><option value="SS">SS ⚠️</option><option value="AC">AC</option><option value="SC">SC</option></select></div>
        </div>
        <div><label className="label">Special needs</label><textarea rows={2} className="input" value={form.special_needs} onChange={(e) => setForm({ ...form, special_needs: e.target.value })} /></div>
        <label className="flex items-start gap-3 p-3 bg-red-50 rounded-lg cursor-pointer border border-red-100">
          <input type="checkbox" className="mt-0.5 accent-error" checked={form.medical_alert_flag} onChange={(e) => setForm({ ...form, medical_alert_flag: e.target.checked })} />
          <div><div className="text-sm font-medium text-red-900">Medical alert flag</div></div>
        </label>
      </FormCard>

      <FormCard icon={GraduationCap} iconColor="text-success" iconBg="bg-emerald-50" title="Other" desc="House, transport, notes">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div><label className="label">House</label><select className="input" value={form.house_id} onChange={(e) => setForm({ ...form, house_id: e.target.value })}><option value="">None</option>{houses.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}</select></div>
          <div><label className="label">Transport mode</label><select className="input" value={form.transport_mode} onChange={(e) => setForm({ ...form, transport_mode: e.target.value })}><option value="">Select</option><option value="parent_drop">Parent drop</option><option value="school_bus">School bus</option><option value="public_transport">Public transport</option><option value="walk">Walks</option><option value="private_transport">Private</option><option value="other">Other</option></select></div>
        </div>
        <label className="flex items-center gap-2 p-3 cursor-pointer">
          <input type="checkbox" className="accent-indigo" checked={form.is_boarder} onChange={(e) => setForm({ ...form, is_boarder: e.target.checked })} />
          <span className="text-sm">Is a boarder</span>
        </label>
        <div><label className="label">Admin notes</label><textarea rows={2} className="input" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
      </FormCard>

      {/* Danger zone */}
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 lg:p-6">
        <h3 className="font-semibold text-red-900 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />Danger zone
        </h3>
        <p className="text-xs text-red-700 mt-1 mb-3">
          Deleting removes this student from lists. Their records (invoices, payments) are kept but marked as archived.
        </p>
        {!showDelete ? (
          <button type="button" onClick={() => setShowDelete(true)}
            className="px-3 py-1.5 bg-white border border-red-300 text-error rounded-md text-sm font-medium hover:bg-red-100">
            <Trash2 className="w-3.5 h-3.5 inline mr-1.5" />
            Delete student
          </button>
        ) : (
          <div className="bg-white border border-red-300 rounded-lg p-3 space-y-2">
            <label className="text-xs text-gray-700">Type <strong>{fullName}</strong> to confirm:</label>
            <input type="text" value={confirmText} onChange={(e) => setConfirmText(e.target.value)}
              className="input text-sm" placeholder={fullName} />
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => { setShowDelete(false); setConfirmText(''); }} className="btn-secondary text-sm">Cancel</button>
              <button type="button" onClick={handleDelete}
                disabled={confirmText !== fullName || deleting}
                className="px-3 py-1.5 bg-error text-white rounded-md text-sm font-medium disabled:opacity-40 hover:bg-red-600">
                {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Delete permanently'}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-16 lg:bottom-4 left-0 right-0 lg:left-64 z-30 p-4 bg-white lg:bg-white/95 lg:backdrop-blur-md border-t lg:border lg:mx-6 lg:rounded-xl border-gray-200 lg:shadow-lg flex items-center justify-between gap-3 max-w-4xl mx-auto lg:right-6">
        <div className="flex-1 min-w-0">
          {error && (
            <div className="flex items-center gap-2 text-xs text-error">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{error}</span>
            </div>
          )}
        </div>
        <Link href={`/dashboard/students/${student.id}`} className="btn-secondary text-sm">Cancel</Link>
        <button type="submit" disabled={saving} className="btn-primary text-sm">
          {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : <><Save className="w-4 h-4 mr-2" />Save changes</>}
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
