'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  User, Briefcase, Phone, MapPin, Loader2, AlertCircle, Save,
  AlertTriangle, Trash2,
} from 'lucide-react';

const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue',
  'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu',
  'FCT (Abuja)', 'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina',
  'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo',
  'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara',
];

export default function EditStaffForm({ staff }: { staff: any }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDelete, setShowDelete] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const [form, setForm] = useState({
    staff_number: staff.staff_number,
    title: staff.title || '',
    first_name: staff.first_name || '',
    middle_name: staff.middle_name || '',
    last_name: staff.last_name || '',
    staff_type: staff.staff_type || 'teaching',
    designation: staff.designation || '',
    department: staff.department || '',
    primary_phone: staff.primary_phone || '',
    alternate_phone: staff.alternate_phone || '',
    email: staff.email || '',
    whatsapp_number: staff.whatsapp_number || '',
    gender: staff.gender || '',
    date_of_birth: staff.date_of_birth || '',
    state_of_origin: staff.state_of_origin || '',
    lga: staff.lga || '',
    marital_status: staff.marital_status || '',
    home_address: staff.home_address || '',
    city: staff.city || '',
    state: staff.state || '',
    employment_date: staff.employment_date || '',
    employment_type: staff.employment_type || 'full_time',
    qualifications: staff.qualifications || '',
    specialization: staff.specialization || '',
    years_of_experience: staff.years_of_experience || '',
    emergency_contact_name: staff.emergency_contact_name || '',
    emergency_contact_phone: staff.emergency_contact_phone || '',
    emergency_contact_relationship: staff.emergency_contact_relationship || '',
    status: staff.status || 'active',
    notes: staff.notes || '',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload: any = {
        ...form,
        middle_name: form.middle_name || null,
        title: form.title || null,
        designation: form.designation || null,
        department: form.department || null,
        primary_phone: form.primary_phone || null,
        alternate_phone: form.alternate_phone || null,
        email: form.email || null,
        whatsapp_number: form.whatsapp_number || null,
        gender: form.gender || null,
        date_of_birth: form.date_of_birth || null,
        state_of_origin: form.state_of_origin || null,
        lga: form.lga || null,
        marital_status: form.marital_status || null,
        home_address: form.home_address || null,
        city: form.city || null,
        state: form.state || null,
        employment_date: form.employment_date || null,
        qualifications: form.qualifications || null,
        specialization: form.specialization || null,
        years_of_experience: form.years_of_experience === '' ? null : parseInt(form.years_of_experience.toString()),
        emergency_contact_name: form.emergency_contact_name || null,
        emergency_contact_phone: form.emergency_contact_phone || null,
        emergency_contact_relationship: form.emergency_contact_relationship || null,
        notes: form.notes || null,
      };
      const res = await fetch(`/api/staff/${staff.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staff: payload }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      router.push(`/dashboard/staff/${staff.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/staff/${staff.id}`, { method: 'DELETE' });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      router.push('/dashboard/staff');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
      setDeleting(false);
    }
  }

  const fullName = `${staff.first_name} ${staff.last_name}`;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-24 lg:pb-8">
      <FormCard icon={User} iconColor="text-indigo" iconBg="bg-indigo-50" title="Basic" desc="Names and status">
        <div><label className="label">Staff number *</label><input type="text" required className="input font-mono text-sm" value={form.staff_number} onChange={(e) => setForm({ ...form, staff_number: e.target.value })} /></div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div><label className="label">Title</label><select className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}><option value="">—</option>{['Mr','Mrs','Miss','Ms','Dr','Prof','Rev','Pastor','Alhaji','Alhaja','Chief'].map(t => <option key={t}>{t}</option>)}</select></div>
          <div><label className="label">First *</label><input type="text" required className="input" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} /></div>
          <div><label className="label">Middle</label><input type="text" className="input" value={form.middle_name} onChange={(e) => setForm({ ...form, middle_name: e.target.value })} /></div>
          <div><label className="label">Last *</label><input type="text" required className="input" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} /></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div><label className="label">Gender</label><select className="input" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}><option value="">—</option><option value="male">Male</option><option value="female">Female</option></select></div>
          <div><label className="label">Date of birth</label><input type="date" className="input" value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} /></div>
          <div><label className="label">Status</label><select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option value="active">Active</option><option value="on_leave">On leave</option><option value="terminated">Terminated</option><option value="resigned">Resigned</option><option value="retired">Retired</option></select></div>
        </div>
      </FormCard>

      <FormCard icon={Briefcase} iconColor="text-success" iconBg="bg-emerald-50" title="Role & employment" desc="What they do">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div><label className="label">Staff type *</label><select required className="input" value={form.staff_type} onChange={(e) => setForm({ ...form, staff_type: e.target.value })}><option value="teaching">Teaching</option><option value="non_teaching">Non-teaching</option><option value="admin">Admin</option><option value="management">Management</option><option value="support">Support</option></select></div>
          <div><label className="label">Employment type</label><select className="input" value={form.employment_type} onChange={(e) => setForm({ ...form, employment_type: e.target.value })}><option value="full_time">Full-time</option><option value="part_time">Part-time</option><option value="contract">Contract</option><option value="nysc">NYSC</option><option value="volunteer">Volunteer</option></select></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div><label className="label">Designation</label><input type="text" className="input" value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} /></div>
          <div><label className="label">Department</label><input type="text" className="input" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} /></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div><label className="label">Employment date</label><input type="date" className="input" value={form.employment_date} onChange={(e) => setForm({ ...form, employment_date: e.target.value })} /></div>
          <div><label className="label">Years of experience</label><input type="number" min="0" className="input" value={form.years_of_experience} onChange={(e) => setForm({ ...form, years_of_experience: e.target.value })} /></div>
        </div>
        <div><label className="label">Qualifications</label><input type="text" className="input" value={form.qualifications} onChange={(e) => setForm({ ...form, qualifications: e.target.value })} /></div>
        <div><label className="label">Specialization</label><input type="text" className="input" value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} /></div>
      </FormCard>

      <FormCard icon={Phone} iconColor="text-sky-600" iconBg="bg-sky-50" title="Contact" desc="Phone, WhatsApp, email">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div><label className="label">Primary phone *</label><input type="tel" required className="input" value={form.primary_phone} onChange={(e) => setForm({ ...form, primary_phone: e.target.value })} /></div>
          <div><label className="label">WhatsApp</label><input type="tel" className="input" value={form.whatsapp_number} onChange={(e) => setForm({ ...form, whatsapp_number: e.target.value })} /></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div><label className="label">Alternate phone</label><input type="tel" className="input" value={form.alternate_phone} onChange={(e) => setForm({ ...form, alternate_phone: e.target.value })} /></div>
          <div><label className="label">Email</label><input type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
        </div>
      </FormCard>

      <FormCard icon={MapPin} iconColor="text-warning" iconBg="bg-amber-50" title="Address & emergency" desc="Where they live">
        <div><label className="label">Home address</label><input type="text" className="input" value={form.home_address} onChange={(e) => setForm({ ...form, home_address: e.target.value })} /></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div><label className="label">City</label><input type="text" className="input" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
          <div><label className="label">State</label><select className="input" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })}><option value="">—</option>{NIGERIAN_STATES.map(s => <option key={s}>{s}</option>)}</select></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div><label className="label">State of origin</label><select className="input" value={form.state_of_origin} onChange={(e) => setForm({ ...form, state_of_origin: e.target.value })}><option value="">—</option>{NIGERIAN_STATES.map(s => <option key={s}>{s}</option>)}</select></div>
          <div><label className="label">LGA</label><input type="text" className="input" value={form.lga} onChange={(e) => setForm({ ...form, lga: e.target.value })} /></div>
        </div>

        <div className="pt-3 border-t border-gray-100 space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-error" />
            <span className="text-xs font-semibold text-gray-700 uppercase">Emergency contact</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><label className="label">Contact name</label><input type="text" className="input" value={form.emergency_contact_name} onChange={(e) => setForm({ ...form, emergency_contact_name: e.target.value })} /></div>
            <div><label className="label">Relationship</label><input type="text" className="input" value={form.emergency_contact_relationship} onChange={(e) => setForm({ ...form, emergency_contact_relationship: e.target.value })} /></div>
          </div>
          <div><label className="label">Emergency phone</label><input type="tel" className="input" value={form.emergency_contact_phone} onChange={(e) => setForm({ ...form, emergency_contact_phone: e.target.value })} /></div>
        </div>
      </FormCard>

      <div className="bg-red-50 border border-red-200 rounded-xl p-4 lg:p-6">
        <h3 className="font-semibold text-red-900 flex items-center gap-2"><AlertCircle className="w-4 h-4" />Danger zone</h3>
        <p className="text-xs text-red-700 mt-1 mb-3">Removes this staff member from lists.</p>
        {!showDelete ? (
          <button type="button" onClick={() => setShowDelete(true)} className="px-3 py-1.5 bg-white border border-red-300 text-error rounded-md text-sm font-medium hover:bg-red-100">
            <Trash2 className="w-3.5 h-3.5 inline mr-1.5" />Delete staff
          </button>
        ) : (
          <div className="bg-white border border-red-300 rounded-lg p-3 space-y-2">
            <label className="text-xs text-gray-700">Type <strong>{fullName}</strong> to confirm:</label>
            <input type="text" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} className="input text-sm" placeholder={fullName} />
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => { setShowDelete(false); setConfirmText(''); }} className="btn-secondary text-sm">Cancel</button>
              <button type="button" onClick={handleDelete} disabled={confirmText !== fullName || deleting}
                className="px-3 py-1.5 bg-error text-white rounded-md text-sm font-medium disabled:opacity-40 hover:bg-red-600">
                {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Delete permanently'}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-16 lg:bottom-4 left-0 right-0 lg:left-64 z-30 p-4 bg-white lg:bg-white/95 lg:backdrop-blur-md border-t lg:border lg:mx-6 lg:rounded-xl border-gray-200 lg:shadow-lg flex items-center justify-between gap-3 max-w-4xl mx-auto lg:right-6">
        <div className="flex-1 min-w-0">
          {error && <div className="flex items-center gap-2 text-xs text-error"><AlertCircle className="w-4 h-4" /><span className="truncate">{error}</span></div>}
        </div>
        <Link href={`/dashboard/staff/${staff.id}`} className="btn-secondary text-sm">Cancel</Link>
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
