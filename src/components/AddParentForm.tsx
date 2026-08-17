'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  User, Phone, Briefcase, Users as UsersIcon, MessageCircle,
  Loader2, AlertCircle, Save, Plus, X, Search, Check,
} from 'lucide-react';

const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue',
  'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu',
  'FCT (Abuja)', 'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina',
  'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo',
  'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara',
];

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  admission_number: string;
}

interface Props {
  schoolId: string;
  students: Student[];
}

interface StudentLink {
  studentId: string;
  relationship: string;
  isPrimaryContact: boolean;
}

export default function AddParentForm({ schoolId, students }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [studentSearch, setStudentSearch] = useState('');
  const [showStudentPicker, setShowStudentPicker] = useState(false);

  const [form, setForm] = useState({
    title: '',
    first_name: '', middle_name: '', last_name: '',
    primary_phone: '', alternate_phone: '', whatsapp_number: '', email: '',
    home_address: '', city: '', state: '',
    occupation: '', employer: '', work_address: '', work_phone: '',
    preferred_language: 'en',
    communication_channels: ['whatsapp', 'sms'] as string[],
    notes: '',
  });

  const [studentLinks, setStudentLinks] = useState<StudentLink[]>([]);

  const filteredStudents = students.filter(s => {
    if (studentLinks.find(sl => sl.studentId === s.id)) return false;
    if (!studentSearch) return true;
    const q = studentSearch.toLowerCase();
    return `${s.first_name} ${s.last_name}`.toLowerCase().includes(q) ||
      s.admission_number.toLowerCase().includes(q);
  });

  function addStudent(studentId: string) {
    setStudentLinks([...studentLinks, {
      studentId,
      relationship: 'father',
      isPrimaryContact: studentLinks.length === 0, // first one is primary by default
    }]);
    setStudentSearch('');
    setShowStudentPicker(false);
  }

  function removeStudent(index: number) {
    setStudentLinks(studentLinks.filter((_, i) => i !== index));
  }

  function updateLink(index: number, field: keyof StudentLink, value: any) {
    const updated = [...studentLinks];
    updated[index] = { ...updated[index], [field]: value };
    // If setting one as primary, unset others
    if (field === 'isPrimaryContact' && value === true) {
      updated.forEach((l, i) => { if (i !== index) l.isPrimaryContact = false; });
    }
    setStudentLinks(updated);
  }

  function toggleChannel(channel: string) {
    setForm(f => ({
      ...f,
      communication_channels: f.communication_channels.includes(channel)
        ? f.communication_channels.filter(c => c !== channel)
        : [...f.communication_channels, channel],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/parents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolId,
          parent: {
            ...form,
            title: form.title || null,
            middle_name: form.middle_name || null,
            alternate_phone: form.alternate_phone || null,
            whatsapp_number: form.whatsapp_number || form.primary_phone || null,
            email: form.email || null,
            home_address: form.home_address || null,
            city: form.city || null,
            state: form.state || null,
            occupation: form.occupation || null,
            employer: form.employer || null,
            work_address: form.work_address || null,
            work_phone: form.work_phone || null,
            notes: form.notes || null,
          },
          studentLinks,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to add parent');
      router.push(`/dashboard/parents/${result.parentId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-24 lg:pb-8">
      <FormCard icon={User} iconColor="text-indigo" iconBg="bg-indigo-50" title="Parent information" desc="Names and contact person">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="label">Title</label>
            <select className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}>
              <option value="">—</option>
              <option value="Mr">Mr</option>
              <option value="Mrs">Mrs</option>
              <option value="Miss">Miss</option>
              <option value="Ms">Ms</option>
              <option value="Dr">Dr</option>
              <option value="Alhaji">Alhaji</option>
              <option value="Alhaja">Alhaja</option>
              <option value="Chief">Chief</option>
              <option value="Pastor">Pastor</option>
              <option value="Rev">Rev</option>
            </select>
          </div>
          <div><label className="label">First name *</label><input type="text" required className="input" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} /></div>
          <div><label className="label">Middle name</label><input type="text" className="input" value={form.middle_name} onChange={(e) => setForm({ ...form, middle_name: e.target.value })} /></div>
          <div><label className="label">Last name *</label><input type="text" required className="input" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} /></div>
        </div>
      </FormCard>

      <FormCard icon={Phone} iconColor="text-sky-600" iconBg="bg-sky-50" title="Contact details" desc="Phone, WhatsApp, email">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="label">Primary phone *</label>
            <input type="tel" required className="input" placeholder="+234 800 000 0000"
              value={form.primary_phone} onChange={(e) => setForm({ ...form, primary_phone: e.target.value })} />
          </div>
          <div>
            <label className="label">WhatsApp number</label>
            <input type="tel" className="input" placeholder="Same as primary if empty"
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

        <div className="pt-3 border-t border-gray-100">
          <label className="label">Preferred communication channels</label>
          <div className="flex gap-2 flex-wrap">
            {['whatsapp', 'sms', 'email', 'phone_call'].map(ch => {
              const selected = form.communication_channels.includes(ch);
              return (
                <button key={ch} type="button" onClick={() => toggleChannel(ch)}
                  className={`px-3 py-1.5 rounded-full border text-xs font-medium capitalize transition-all ${
                    selected ? 'bg-indigo-50 border-indigo text-indigo-dark' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}>
                  {selected && <Check className="w-3 h-3 inline mr-1" />}
                  {ch.replace('_', ' ')}
                </button>
              );
            })}
          </div>
        </div>
      </FormCard>

      <FormCard icon={Briefcase} iconColor="text-success" iconBg="bg-emerald-50" title="Work & address" desc="Optional but useful for records">
        <div><label className="label">Home address</label><input type="text" className="input" value={form.home_address} onChange={(e) => setForm({ ...form, home_address: e.target.value })} /></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="label">City</label>
            <input type="text" className="input" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </div>
          <div>
            <label className="label">State</label>
            <select className="input" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })}>
              <option value="">Select</option>
              {NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="label">Occupation</label>
            <input type="text" className="input" placeholder="e.g. Engineer, Teacher"
              value={form.occupation} onChange={(e) => setForm({ ...form, occupation: e.target.value })} />
          </div>
          <div>
            <label className="label">Employer</label>
            <input type="text" className="input" placeholder="e.g. Chevron, Self-employed"
              value={form.employer} onChange={(e) => setForm({ ...form, employer: e.target.value })} />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="label">Work address</label>
            <input type="text" className="input"
              value={form.work_address} onChange={(e) => setForm({ ...form, work_address: e.target.value })} />
          </div>
          <div>
            <label className="label">Work phone</label>
            <input type="tel" className="input"
              value={form.work_phone} onChange={(e) => setForm({ ...form, work_phone: e.target.value })} />
          </div>
        </div>
      </FormCard>

      {/* Link students */}
      <FormCard icon={UsersIcon} iconColor="text-purple-600" iconBg="bg-purple-50" title="Link students" desc="Which students is this parent responsible for?">
        {studentLinks.length === 0 && !showStudentPicker && (
          <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-lg">
            <UsersIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-600 mb-3">No students linked yet</p>
            {students.length === 0 ? (
              <p className="text-xs text-gray-500">Add students first from the Students module</p>
            ) : (
              <button type="button" onClick={() => setShowStudentPicker(true)} className="btn-primary text-sm">
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Link a student
              </button>
            )}
          </div>
        )}

        {studentLinks.length > 0 && (
          <div className="space-y-2">
            {studentLinks.map((link, idx) => {
              const student = students.find(s => s.id === link.studentId);
              if (!student) return null;
              return (
                <div key={idx} className="bg-gray-50 rounded-lg p-3 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                    {student.first_name[0]}{student.last_name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-gray-900 truncate">{student.first_name} {student.last_name}</div>
                    <div className="text-[11px] text-gray-500 mb-2">{student.admission_number}</div>
                    <div className="flex flex-wrap gap-2 items-center">
                      <select className="text-xs px-2 py-1 rounded border border-gray-200 bg-white"
                        value={link.relationship}
                        onChange={(e) => updateLink(idx, 'relationship', e.target.value)}>
                        <option value="father">Father</option>
                        <option value="mother">Mother</option>
                        <option value="guardian">Guardian</option>
                        <option value="grandparent">Grandparent</option>
                        <option value="uncle">Uncle</option>
                        <option value="aunt">Aunt</option>
                        <option value="sponsor">Sponsor</option>
                        <option value="other">Other</option>
                      </select>
                      <label className="flex items-center gap-1 text-xs text-gray-700 cursor-pointer">
                        <input type="checkbox" className="accent-indigo"
                          checked={link.isPrimaryContact}
                          onChange={(e) => updateLink(idx, 'isPrimaryContact', e.target.checked)} />
                        Primary contact
                      </label>
                    </div>
                  </div>
                  <button type="button" onClick={() => removeStudent(idx)}
                    className="p-1 text-gray-400 hover:text-error hover:bg-red-50 rounded">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
            {!showStudentPicker && (
              <button type="button" onClick={() => setShowStudentPicker(true)}
                className="w-full py-2 border-2 border-dashed border-gray-200 rounded-lg text-xs text-gray-500 hover:border-indigo hover:text-indigo transition-colors flex items-center justify-center gap-1">
                <Plus className="w-3.5 h-3.5" />
                Link another student
              </button>
            )}
          </div>
        )}

        {showStudentPicker && (
          <div className="bg-white border border-gray-200 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-700 uppercase">Pick a student</span>
              <button type="button" onClick={() => setShowStudentPicker(false)} className="text-gray-400 hover:text-gray-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="relative mb-2">
              <Search className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Search students..." autoFocus
                className="w-full pl-8 pr-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded"
                value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)} />
            </div>
            <div className="max-h-60 overflow-y-auto space-y-1">
              {filteredStudents.slice(0, 30).map(s => (
                <button key={s.id} type="button" onClick={() => addStudent(s.id)}
                  className="w-full text-left p-2 hover:bg-gray-50 rounded flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white text-[10px] font-semibold flex-shrink-0">
                    {s.first_name[0]}{s.last_name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{s.first_name} {s.last_name}</div>
                    <div className="text-[10px] text-gray-500 truncate">{s.admission_number}</div>
                  </div>
                </button>
              ))}
              {filteredStudents.length === 0 && (
                <p className="text-xs text-gray-500 text-center py-4">
                  {studentSearch ? 'No matches' : 'All students already linked'}
                </p>
              )}
            </div>
          </div>
        )}
      </FormCard>

      <FormCard icon={MessageCircle} iconColor="text-warning" iconBg="bg-amber-50" title="Notes" desc="Internal notes about this parent">
        <textarea rows={2} className="input" placeholder="Any notes for staff..."
          value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
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
        <Link href="/dashboard/parents" className="btn-secondary text-sm">Cancel</Link>
        <button type="submit" disabled={saving} className="btn-primary text-sm">
          {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Adding...</> : <><Save className="w-4 h-4 mr-2" />Add parent</>}
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
