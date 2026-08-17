'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  User, Briefcase, Phone, MapPin, Loader2, AlertCircle, Save,
  AlertTriangle, Users as UsersIcon,
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
  schoolShortCode: string;
}

export default function AddStaffForm({ schoolId, schoolShortCode }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const year = new Date().getFullYear().toString().slice(-2);
  const defaultStaffNo = `${schoolShortCode}/STF/${year}/${String(Math.floor(Math.random() * 900) + 100)}`;

  const [form, setForm] = useState({
    staff_number: defaultStaffNo,
    title: '',
    first_name: '', middle_name: '', last_name: '',
    staff_type: 'teaching',
    designation: '',
    department: '',
    primary_phone: '', alternate_phone: '', email: '', whatsapp_number: '',
    gender: '', date_of_birth: '',
    nationality: 'Nigerian', state_of_origin: '', lga: '',
    religion: '', marital_status: '',
    home_address: '', city: '', state: '',
    employment_date: new Date().toISOString().slice(0, 10),
    employment_type: 'full_time',
    qualifications: '', specialization: '',
    years_of_experience: '',
    emergency_contact_name: '', emergency_contact_phone: '', emergency_contact_relationship: '',
    notes: '',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolId,
          staff: {
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
            religion: form.religion || null,
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
          },
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to add staff');
      router.push(`/dashboard/staff/${result.staffId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-24 lg:pb-8">
      {/* Basic */}
      <FormCard icon={User} iconColor="text-indigo" iconBg="bg-indigo-50" title="Basic information" desc="Names and staff number">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="label">Staff number *</label>
            <input type="text" required className="input font-mono text-sm"
              value={form.staff_number} onChange={(e) => setForm({ ...form, staff_number: e.target.value })} />
          </div>
          <div>
            <label className="label">Title</label>
            <select className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}>
              <option value="">Select</option>
              <option value="Mr">Mr</option>
              <option value="Mrs">Mrs</option>
              <option value="Miss">Miss</option>
              <option value="Ms">Ms</option>
              <option value="Dr">Dr</option>
              <option value="Prof">Prof</option>
              <option value="Rev">Rev</option>
              <option value="Pastor">Pastor</option>
              <option value="Alhaji">Alhaji</option>
              <option value="Alhaja">Alhaja</option>
              <option value="Chief">Chief</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div><label className="label">First name *</label><input type="text" required className="input" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} /></div>
          <div><label className="label">Middle name</label><input type="text" className="input" value={form.middle_name} onChange={(e) => setForm({ ...form, middle_name: e.target.value })} /></div>
          <div><label className="label">Last name *</label><input type="text" required className="input" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} /></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="label">Gender</label>
            <select className="input" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
              <option value="">Select</option><option value="male">Male</option><option value="female">Female</option>
            </select>
          </div>
          <div>
            <label className="label">Date of birth</label>
            <input type="date" className="input" value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} />
          </div>
          <div>
            <label className="label">Marital status</label>
            <select className="input" value={form.marital_status} onChange={(e) => setForm({ ...form, marital_status: e.target.value })}>
              <option value="">Select</option>
              <option value="single">Single</option>
              <option value="married">Married</option>
              <option value="divorced">Divorced</option>
              <option value="widowed">Widowed</option>
            </select>
          </div>
        </div>
      </FormCard>

      {/* Role & Employment */}
      <FormCard icon={Briefcase} iconColor="text-success" iconBg="bg-emerald-50" title="Role & employment" desc="What they do and when they joined">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="label">Staff type *</label>
            <select className="input" required value={form.staff_type} onChange={(e) => setForm({ ...form, staff_type: e.target.value })}>
              <option value="teaching">Teaching (teacher)</option>
              <option value="non_teaching">Non-teaching</option>
              <option value="admin">Admin</option>
              <option value="management">Management</option>
              <option value="support">Support (cleaner, security, driver)</option>
            </select>
          </div>
          <div>
            <label className="label">Employment type</label>
            <select className="input" value={form.employment_type} onChange={(e) => setForm({ ...form, employment_type: e.target.value })}>
              <option value="full_time">Full-time</option>
              <option value="part_time">Part-time</option>
              <option value="contract">Contract</option>
              <option value="nysc">NYSC</option>
              <option value="volunteer">Volunteer</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="label">Designation</label>
            <input type="text" className="input" placeholder="e.g. Head Teacher, Bursar"
              value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} />
          </div>
          <div>
            <label className="label">Department</label>
            <input type="text" className="input" placeholder="e.g. Sciences, Admin"
              value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="label">Employment date</label>
            <input type="date" className="input"
              value={form.employment_date} onChange={(e) => setForm({ ...form, employment_date: e.target.value })} />
          </div>
          <div>
            <label className="label">Years of experience</label>
            <input type="number" min="0" max="70" className="input"
              value={form.years_of_experience} onChange={(e) => setForm({ ...form, years_of_experience: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="label">Qualifications</label>
          <input type="text" className="input" placeholder="e.g. B.Ed English, PGDE"
            value={form.qualifications} onChange={(e) => setForm({ ...form, qualifications: e.target.value })} />
        </div>
        <div>
          <label className="label">Specialization / subjects</label>
          <input type="text" className="input" placeholder="e.g. English, Literature"
            value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} />
        </div>
      </FormCard>

      {/* Contact */}
      <FormCard icon={Phone} iconColor="text-sky-600" iconBg="bg-sky-50" title="Contact details" desc="Phone, email, WhatsApp">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="label">Primary phone *</label>
            <input type="tel" required className="input" placeholder="+234 800 000 0000"
              value={form.primary_phone} onChange={(e) => setForm({ ...form, primary_phone: e.target.value })} />
          </div>
          <div>
            <label className="label">WhatsApp number</label>
            <input type="tel" className="input"
              value={form.whatsapp_number} onChange={(e) => setForm({ ...form, whatsapp_number: e.target.value })} />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="label">Alternate phone</label>
            <input type="tel" className="input"
              value={form.alternate_phone} onChange={(e) => setForm({ ...form, alternate_phone: e.target.value })} />
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" className="input"
              value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
        </div>
      </FormCard>

      {/* Address */}
      <FormCard icon={MapPin} iconColor="text-warning" iconBg="bg-amber-50" title="Address & origin" desc="Where they live and originate from">
        <div><label className="label">Home address</label><input type="text" className="input" value={form.home_address} onChange={(e) => setForm({ ...form, home_address: e.target.value })} /></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="label">City</label>
            <input type="text" className="input" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </div>
          <div>
            <label className="label">State (residence)</label>
            <select className="input" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })}>
              <option value="">Select</option>
              {NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="label">State of origin</label>
            <select className="input" value={form.state_of_origin} onChange={(e) => setForm({ ...form, state_of_origin: e.target.value })}>
              <option value="">Select</option>
              {NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="label">LGA</label>
            <input type="text" className="input" value={form.lga} onChange={(e) => setForm({ ...form, lga: e.target.value })} />
          </div>
        </div>
      </FormCard>

      {/* Emergency contact */}
      <FormCard icon={AlertTriangle} iconColor="text-error" iconBg="bg-red-50" title="Emergency contact" desc="Who to call in case of emergency">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="label">Contact name</label>
            <input type="text" className="input" placeholder="e.g. Mrs. Adaeze Okonkwo"
              value={form.emergency_contact_name} onChange={(e) => setForm({ ...form, emergency_contact_name: e.target.value })} />
          </div>
          <div>
            <label className="label">Relationship</label>
            <input type="text" className="input" placeholder="e.g. Spouse, Sibling"
              value={form.emergency_contact_relationship} onChange={(e) => setForm({ ...form, emergency_contact_relationship: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="label">Emergency phone</label>
          <input type="tel" className="input"
            value={form.emergency_contact_phone} onChange={(e) => setForm({ ...form, emergency_contact_phone: e.target.value })} />
        </div>
      </FormCard>

      <FormCard icon={UsersIcon} iconColor="text-purple-600" iconBg="bg-purple-50" title="Notes" desc="Internal notes (not visible to staff)">
        <div>
          <textarea rows={2} className="input" placeholder="e.g. On probation, part-time only, etc."
            value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </div>
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
        <Link href="/dashboard/staff" className="btn-secondary text-sm">Cancel</Link>
        <button type="submit" disabled={saving} className="btn-primary text-sm">
          {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Adding...</> : <><Save className="w-4 h-4 mr-2" />Add staff</>}
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
