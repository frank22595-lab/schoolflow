'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  User, Phone, Briefcase, Loader2, AlertCircle, Save, Check, Trash2,
} from 'lucide-react';

const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue',
  'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu',
  'FCT (Abuja)', 'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina',
  'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo',
  'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara',
];

export default function EditParentForm({ parent }: { parent: any }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDelete, setShowDelete] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const [form, setForm] = useState({
    title: parent.title || '',
    first_name: parent.first_name || '',
    middle_name: parent.middle_name || '',
    last_name: parent.last_name || '',
    primary_phone: parent.primary_phone || '',
    alternate_phone: parent.alternate_phone || '',
    whatsapp_number: parent.whatsapp_number || '',
    email: parent.email || '',
    home_address: parent.home_address || '',
    city: parent.city || '',
    state: parent.state || '',
    occupation: parent.occupation || '',
    employer: parent.employer || '',
    work_address: parent.work_address || '',
    work_phone: parent.work_phone || '',
    communication_channels: parent.communication_channels || ['whatsapp', 'sms'],
    notes: parent.notes || '',
  });

  function toggleChannel(ch: string) {
    setForm(f => ({
      ...f,
      communication_channels: f.communication_channels.includes(ch)
        ? f.communication_channels.filter((c: string) => c !== ch)
        : [...f.communication_channels, ch],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload: any = {
        ...form,
        title: form.title || null,
        middle_name: form.middle_name || null,
        alternate_phone: form.alternate_phone || null,
        whatsapp_number: form.whatsapp_number || form.primary_phone,
        email: form.email || null,
        home_address: form.home_address || null,
        city: form.city || null,
        state: form.state || null,
        occupation: form.occupation || null,
        employer: form.employer || null,
        work_address: form.work_address || null,
        work_phone: form.work_phone || null,
        notes: form.notes || null,
      };
      const res = await fetch(`/api/parents/${parent.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parent: payload }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      router.push(`/dashboard/parents/${parent.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/parents/${parent.id}`, { method: 'DELETE' });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      router.push('/dashboard/parents');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
      setDeleting(false);
    }
  }

  const fullName = `${parent.first_name} ${parent.last_name}`;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-24 lg:pb-8">
      <FormCard icon={User} iconColor="text-indigo" iconBg="bg-indigo-50" title="Basic" desc="Names">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div><label className="label">Title</label><select className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}><option value="">—</option>{['Mr','Mrs','Miss','Ms','Dr','Alhaji','Alhaja','Chief','Pastor','Rev'].map(t => <option key={t}>{t}</option>)}</select></div>
          <div><label className="label">First *</label><input type="text" required className="input" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} /></div>
          <div><label className="label">Middle</label><input type="text" className="input" value={form.middle_name} onChange={(e) => setForm({ ...form, middle_name: e.target.value })} /></div>
          <div><label className="label">Last *</label><input type="text" required className="input" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} /></div>
        </div>
      </FormCard>

      <FormCard icon={Phone} iconColor="text-sky-600" iconBg="bg-sky-50" title="Contact" desc="Phone, WhatsApp, email">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div><label className="label">Primary phone *</label><input type="tel" required className="input" value={form.primary_phone} onChange={(e) => setForm({ ...form, primary_phone: e.target.value })} /></div>
          <div><label className="label">WhatsApp</label><input type="tel" className="input" value={form.whatsapp_number} onChange={(e) => setForm({ ...form, whatsapp_number: e.target.value })} /></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div><label className="label">Alternate</label><input type="tel" className="input" value={form.alternate_phone} onChange={(e) => setForm({ ...form, alternate_phone: e.target.value })} /></div>
          <div><label className="label">Email</label><input type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
        </div>
        <div className="pt-3 border-t border-gray-100">
          <label className="label">Preferred channels</label>
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

      <FormCard icon={Briefcase} iconColor="text-success" iconBg="bg-emerald-50" title="Work & address" desc="Occupation and location">
        <div><label className="label">Home address</label><input type="text" className="input" value={form.home_address} onChange={(e) => setForm({ ...form, home_address: e.target.value })} /></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div><label className="label">City</label><input type="text" className="input" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
          <div><label className="label">State</label><select className="input" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })}><option value="">—</option>{NIGERIAN_STATES.map(s => <option key={s}>{s}</option>)}</select></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div><label className="label">Occupation</label><input type="text" className="input" value={form.occupation} onChange={(e) => setForm({ ...form, occupation: e.target.value })} /></div>
          <div><label className="label">Employer</label><input type="text" className="input" value={form.employer} onChange={(e) => setForm({ ...form, employer: e.target.value })} /></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div><label className="label">Work address</label><input type="text" className="input" value={form.work_address} onChange={(e) => setForm({ ...form, work_address: e.target.value })} /></div>
          <div><label className="label">Work phone</label><input type="tel" className="input" value={form.work_phone} onChange={(e) => setForm({ ...form, work_phone: e.target.value })} /></div>
        </div>
        <div><label className="label">Notes</label><textarea rows={2} className="input" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
      </FormCard>

      <div className="bg-red-50 border border-red-200 rounded-xl p-4 lg:p-6">
        <h3 className="font-semibold text-red-900 flex items-center gap-2"><AlertCircle className="w-4 h-4" />Danger zone</h3>
        <p className="text-xs text-red-700 mt-1 mb-3">
          Deleting this parent will unlink them from all students. This cannot be undone.
        </p>
        {!showDelete ? (
          <button type="button" onClick={() => setShowDelete(true)} className="px-3 py-1.5 bg-white border border-red-300 text-error rounded-md text-sm font-medium hover:bg-red-100">
            <Trash2 className="w-3.5 h-3.5 inline mr-1.5" />Delete parent
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
        <Link href={`/dashboard/parents/${parent.id}`} className="btn-secondary text-sm">Cancel</Link>
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
