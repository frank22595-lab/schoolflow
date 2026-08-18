'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  User, Heart, MapPin, Loader2, AlertCircle, Save,
  GraduationCap, ArrowRightLeft, Info, CheckCircle2, ArrowRight,
} from 'lucide-react';
import DeleteConfirm from './DeleteConfirm';

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
  sections: any[];
  classes: any[];
  classLevels: any[];
  currentSession: any;
  currentEnrollment: any;
}

export default function EditStudentForm({ student, houses, sections, classes, classLevels, currentSession, currentEnrollment }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Current class info
  const currentClassLevelId = currentEnrollment?.sections?.classes?.class_level_id || '';
  const currentClassName = currentEnrollment?.sections?.classes?.class_levels?.name || 'Not enrolled';
  const currentSectionName = currentEnrollment?.sections?.name || '';
  const currentSectionFullName = currentEnrollment?.sections?.full_name || currentClassName;

  // Transfer state
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferClassLevelId, setTransferClassLevelId] = useState(currentClassLevelId);
  const [transferSectionId, setTransferSectionId] = useState('');
  const [transferReason, setTransferReason] = useState('');
  const [transferring, setTransferring] = useState(false);

  const selectedTransferLevel = classLevels.find(l => l.id === transferClassLevelId);
  const availableTransferSections = useMemo(() => {
    const cls = classes.find(c => c.class_level_id === transferClassLevelId && c.session_id === currentSession?.id);
    if (!cls) return [];
    return sections.filter(s => s.class_id === cls.id);
  }, [transferClassLevelId, sections, classes, currentSession]);

  const [form, setForm] = useState({
    admission_number: student.admission_number,
    admission_date: student.admission_date || '',
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
    previous_school_name: student.previous_school_name || '',
    previous_school_class: student.previous_school_class || '',
    notes: student.notes || '',
  });

  function showToast(type: 'success' | 'error', message: string) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload: any = {
        ...form,
        middle_name: form.middle_name || null,
        admission_date: form.admission_date || null,
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
        previous_school_name: form.previous_school_name || null,
        previous_school_class: form.previous_school_class || null,
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

  async function handleTransfer() {
    if (!transferSectionId) {
      showToast('error', 'Please pick a section');
      return;
    }
    if (!currentSession) {
      showToast('error', 'No current session');
      return;
    }
    if (transferSectionId === currentEnrollment?.section_id) {
      showToast('error', 'Student is already in this section');
      return;
    }
    setTransferring(true);
    try {
      const res = await fetch(`/api/students/${student.id}/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newSectionId: transferSectionId,
          sessionId: currentSession.id,
          reason: transferReason || null,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      showToast('success', 'Student transferred successfully');
      setShowTransfer(false);
      router.refresh();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Transfer failed');
    } finally {
      setTransferring(false);
    }
  }

  async function handleDelete() {
    const res = await fetch(`/api/students/${student.id}`, { method: 'DELETE' });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error);
    router.push('/dashboard/students');
  }

  const fullName = `${student.first_name} ${student.last_name}`;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-24 lg:pb-8">
      {/* Basic */}
      <FormCard icon={User} iconColor="text-indigo" iconBg="bg-indigo-50" title="Basic information" desc="Names and admission">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="label">Admission number *</label>
            <input type="text" required className="input font-mono text-sm"
              value={form.admission_number} onChange={(e) => setForm({ ...form, admission_number: e.target.value })} />
          </div>
          <div>
            <label className="label">Admission date</label>
            <input type="date" className="input"
              value={form.admission_date} onChange={(e) => setForm({ ...form, admission_date: e.target.value })} />
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
            <label className="label">Place of birth</label>
            <input type="text" className="input" placeholder="e.g. Lagos"
              value={form.place_of_birth} onChange={(e) => setForm({ ...form, place_of_birth: e.target.value })} />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="label">Nationality</label>
            <input type="text" className="input" value={form.nationality} onChange={(e) => setForm({ ...form, nationality: e.target.value })} />
          </div>
          <div>
            <label className="label">Religion</label>
            <select className="input" value={form.religion} onChange={(e) => setForm({ ...form, religion: e.target.value })}>
              <option value="">Select</option>
              <option value="Christianity">Christianity</option>
              <option value="Islam">Islam</option>
              <option value="Traditional">Traditional</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
      </FormCard>

      {/* ==== CLASS & PLACEMENT ==== */}
      <FormCard icon={GraduationCap} iconColor="text-success" iconBg="bg-emerald-50" title="Class & placement" desc="Current class and how to transfer">
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="text-xs text-gray-500 uppercase font-semibold mb-1">Currently enrolled in</div>
          {currentEnrollment ? (
            <>
              <div className="font-semibold text-gray-900">{currentSectionFullName}</div>
              <div className="text-xs text-gray-500 mt-0.5">
                Since {new Date(currentEnrollment.enrolled_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
            </>
          ) : (
            <div className="text-sm text-amber-700">Not enrolled in any class this session</div>
          )}
        </div>

        {!showTransfer ? (
          <button type="button" onClick={() => setShowTransfer(true)}
            className="w-full py-2.5 border-2 border-dashed border-gray-200 rounded-lg text-sm text-gray-600 hover:border-indigo hover:text-indigo transition-colors flex items-center justify-center gap-2">
            <ArrowRightLeft className="w-4 h-4" />
            Change class / transfer
          </button>
        ) : (
          <div className="border border-indigo-200 bg-indigo-50/40 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-gray-900 text-sm">Transfer to new class</h4>
              <button type="button" onClick={() => setShowTransfer(false)} className="text-xs text-gray-500 hover:underline">Cancel</button>
            </div>

            <div className="p-2.5 bg-white border border-gray-200 rounded flex items-start gap-2">
              <Info className="w-3.5 h-3.5 text-info flex-shrink-0 mt-0.5" />
              <div className="text-xs text-gray-600">
                Ends current enrollment and creates a new one. Past attendance, invoices, and grades stay linked to {currentSectionFullName}.
              </div>
            </div>

            <div>
              <label className="label">New class *</label>
              <select className="input" value={transferClassLevelId}
                onChange={(e) => { setTransferClassLevelId(e.target.value); setTransferSectionId(''); }}>
                <option value="">Select class</option>
                {classLevels.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>

            {transferClassLevelId && (
              <div>
                <label className="label">Arm / Section</label>
                {availableTransferSections.length === 0 ? (
                  <div className="text-xs text-amber-700 p-2 bg-amber-50 rounded border border-amber-200">
                    No sections exist yet for this class in the current session. Add a student to it first, or set it up in Classes settings.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {availableTransferSections.map(s => (
                      <button key={s.id} type="button" onClick={() => setTransferSectionId(s.id)}
                        className={`p-2.5 rounded-lg border-2 text-sm font-medium transition-all ${
                          transferSectionId === s.id ? 'border-indigo bg-indigo text-white' : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700'
                        }`}>
                        {s.full_name || s.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="label">Reason (optional)</label>
              <input type="text" className="input text-sm" placeholder="e.g. Promoted, requested change"
                value={transferReason} onChange={(e) => setTransferReason(e.target.value)} />
            </div>

            <button type="button" onClick={handleTransfer} disabled={!transferSectionId || transferring}
              className="w-full btn-primary text-sm">
              {transferring ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Transferring...</> : <><ArrowRight className="w-4 h-4 mr-2" />Confirm transfer</>}
            </button>
          </div>
        )}

        {/* House, transport, boarder (non-enrollment class settings) */}
        <div className="pt-3 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="label">House</label>
            <select className="input" value={form.house_id} onChange={(e) => setForm({ ...form, house_id: e.target.value })}>
              <option value="">None</option>
              {houses.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Transport mode</label>
            <select className="input" value={form.transport_mode} onChange={(e) => setForm({ ...form, transport_mode: e.target.value })}>
              <option value="">Select</option>
              <option value="parent_drop">Parent drop</option>
              <option value="school_bus">School bus</option>
              <option value="public_transport">Public transport</option>
              <option value="walk">Walks</option>
              <option value="private_transport">Private</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
        <label className="flex items-center gap-2 p-3 cursor-pointer">
          <input type="checkbox" className="accent-indigo" checked={form.is_boarder} onChange={(e) => setForm({ ...form, is_boarder: e.target.checked })} />
          <span className="text-sm">Is a boarder</span>
        </label>
      </FormCard>

      {/* Origin & residence */}
      <FormCard icon={MapPin} iconColor="text-sky-600" iconBg="bg-sky-50" title="Origin & residence" desc="Address details">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="label">State of origin</label>
            <select className="input" value={form.state_of_origin} onChange={(e) => setForm({ ...form, state_of_origin: e.target.value })}>
              <option value="">Select</option>
              {NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div><label className="label">LGA</label><input type="text" className="input" value={form.lga} onChange={(e) => setForm({ ...form, lga: e.target.value })} /></div>
        </div>
        <div><label className="label">Home address</label><input type="text" className="input" value={form.home_address} onChange={(e) => setForm({ ...form, home_address: e.target.value })} /></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div><label className="label">City</label><input type="text" className="input" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
          <div>
            <label className="label">State (residence)</label>
            <select className="input" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })}>
              <option value="">Select</option>
              {NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </FormCard>

      {/* Health */}
      <FormCard icon={Heart} iconColor="text-error" iconBg="bg-red-50" title="Health" desc="Critical for emergencies">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div><label className="label">Blood group</label><select className="input font-mono" value={form.blood_group} onChange={(e) => setForm({ ...form, blood_group: e.target.value })}><option value="">Unknown</option>{['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(b => <option key={b} value={b}>{b}</option>)}</select></div>
          <div><label className="label">Genotype</label><select className="input font-mono" value={form.genotype} onChange={(e) => setForm({ ...form, genotype: e.target.value })}><option value="">Unknown</option><option value="AA">AA</option><option value="AS">AS</option><option value="SS">SS ⚠️</option><option value="AC">AC</option><option value="SC">SC</option></select></div>
        </div>
        <div><label className="label">Special needs</label><textarea rows={2} className="input" value={form.special_needs} onChange={(e) => setForm({ ...form, special_needs: e.target.value })} /></div>
        <label className="flex items-start gap-3 p-3 bg-red-50 rounded-lg cursor-pointer border border-red-100">
          <input type="checkbox" className="mt-0.5 accent-error" checked={form.medical_alert_flag} onChange={(e) => setForm({ ...form, medical_alert_flag: e.target.checked })} />
          <div><div className="text-sm font-medium text-red-900">Medical alert flag</div><div className="text-xs text-red-700 mt-0.5">Shows a warning icon to teachers</div></div>
        </label>
      </FormCard>

      {/* Previous school */}
      <FormCard icon={GraduationCap} iconColor="text-purple-600" iconBg="bg-purple-50" title="Previous school" desc="Transfer info + admin notes">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div><label className="label">Previous school name</label><input type="text" className="input" value={form.previous_school_name} onChange={(e) => setForm({ ...form, previous_school_name: e.target.value })} /></div>
          <div><label className="label">Class attended</label><input type="text" className="input" placeholder="e.g. Primary 5" value={form.previous_school_class} onChange={(e) => setForm({ ...form, previous_school_class: e.target.value })} /></div>
        </div>
        <div><label className="label">Admin notes (private)</label><textarea rows={2} className="input" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
      </FormCard>

      <DeleteConfirm
        entityLabel="student"
        entityName={fullName}
        description="Deleting removes this student from lists. Their records (invoices, payments, attendance) are kept but marked as archived."
        onDelete={handleDelete}
      />

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
        <Link href={`/dashboard/students/${student.id}`} className="btn-secondary text-sm">Cancel</Link>
        <button type="submit" disabled={saving} className="btn-primary text-sm">
          {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : <><Save className="w-4 h-4 mr-2" />Save changes</>}
        </button>
      </div>

      {toast && (
        <div className={`fixed bottom-20 lg:bottom-6 right-4 left-4 sm:left-auto z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg ${
          toast.type === 'success' ? 'bg-success text-white' : 'bg-error text-white'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}
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
