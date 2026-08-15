'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Building2, MapPin, Phone, Mail, Globe, Award, Calendar,
  Loader2, Check, AlertCircle, GraduationCap, ImageIcon, Upload,
} from 'lucide-react';

const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue',
  'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu',
  'FCT (Abuja)', 'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina',
  'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo',
  'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara',
];

const LEVELS = [
  { value: 'creche', label: 'Crèche', desc: 'Ages 0-2' },
  { value: 'nursery', label: 'Nursery', desc: 'Ages 3-5' },
  { value: 'primary', label: 'Primary', desc: 'Ages 6-11' },
  { value: 'junior_secondary', label: 'Junior Secondary', desc: 'JSS 1-3' },
  { value: 'senior_secondary', label: 'Senior Secondary', desc: 'SS 1-3' },
];

interface SchoolProfileFormProps {
  school: any;
}

export default function SchoolProfileForm({ school }: SchoolProfileFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: school?.name || '',
    motto: school?.motto || '',
    established_year: school?.established_year || '',
    address: school?.address || '',
    city: school?.city || '',
    state: school?.state || '',
    phone: school?.phone || '',
    email: school?.email || '',
    website: school?.website || '',
    levels_offered: school?.levels_offered || [],
    report_card_footer_text: school?.report_card_footer_text || '',
    receipt_footer_text: school?.receipt_footer_text || '',
  });

  const toggleLevel = (level: string) => {
    setForm(prev => ({
      ...prev,
      levels_offered: prev.levels_offered.includes(level)
        ? prev.levels_offered.filter((l: string) => l !== level)
        : [...prev.levels_offered, level],
    }));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const { error: updateError } = await supabase
        .from('schools')
        .update({
          name: form.name,
          motto: form.motto,
          established_year: form.established_year ? parseInt(form.established_year.toString()) : null,
          address: form.address,
          city: form.city,
          state: form.state,
          phone: form.phone,
          email: form.email,
          website: form.website,
          levels_offered: form.levels_offered,
          report_card_footer_text: form.report_card_footer_text,
          receipt_footer_text: form.receipt_footer_text,
        })
        .eq('id', school.id);

      if (updateError) throw updateError;

      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Logo upload card */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 lg:p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
            <ImageIcon className="w-4 h-4 text-indigo" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">School Logo</h3>
            <p className="text-xs text-gray-500">Displayed on reports, receipts, and login page</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start gap-4">
          {/* Current logo preview */}
          <div className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 flex-shrink-0">
            {school?.logo_url ? (
              <img src={school.logo_url} alt="School logo" className="w-full h-full object-contain rounded-xl" />
            ) : (
              <GraduationCap className="w-10 h-10 text-gray-300" />
            )}
          </div>

          <div className="flex-1">
            <button
              type="button"
              disabled
              className="btn-secondary text-sm cursor-not-allowed opacity-60"
              title="File upload coming next"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload logo (coming soon)
            </button>
            <p className="text-xs text-gray-500 mt-2 leading-relaxed">
              Recommended: 512×512 PNG or JPG. Max 2MB.<br />
              For now, you can update logo via the Supabase file storage manually.
            </p>
          </div>
        </div>
      </div>

      {/* Basic Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 lg:p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
            <Building2 className="w-4 h-4 text-indigo" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Basic Information</h3>
            <p className="text-xs text-gray-500">Core details about your school</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="label">School name <span className="text-error">*</span></label>
            <input
              type="text"
              required
              className="input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div>
            <label className="label">Motto</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. Knowledge is Power"
              value={form.motto}
              onChange={(e) => setForm({ ...form, motto: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Year established</label>
              <input
                type="number"
                min="1800"
                max="2100"
                className="input"
                placeholder="e.g. 1995"
                value={form.established_year}
                onChange={(e) => setForm({ ...form, established_year: e.target.value })}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Levels offered */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 lg:p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
            <GraduationCap className="w-4 h-4 text-success" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Levels Offered</h3>
            <p className="text-xs text-gray-500">Tick the levels your school runs</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {LEVELS.map((level) => {
            const isSelected = form.levels_offered.includes(level.value);
            return (
              <button
                type="button"
                key={level.value}
                onClick={() => toggleLevel(level.value)}
                className={`p-3 rounded-lg border-2 text-left transition-all ${
                  isSelected
                    ? 'border-indigo bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${
                    isSelected ? 'bg-indigo' : 'border-2 border-gray-300'
                  }`}>
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium ${isSelected ? 'text-indigo-dark' : 'text-gray-900'}`}>
                      {level.label}
                    </div>
                    <div className="text-xs text-gray-500">{level.desc}</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Contact & Address */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 lg:p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-sky-50 rounded-lg flex items-center justify-center">
            <MapPin className="w-4 h-4 text-info" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Contact & Address</h3>
            <p className="text-xs text-gray-500">How parents and staff can reach you</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="label">Street address</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. 12 Adeola Odeku Street"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">City</label>
              <input
                type="text"
                className="input"
                placeholder="e.g. Victoria Island"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
            </div>
            <div>
              <label className="label">State</label>
              <select
                className="input"
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
              >
                <option value="">Select state</option>
                {NIGERIAN_STATES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">
                <Phone className="w-3 h-3 inline mr-1" />
                Phone
              </label>
              <input
                type="tel"
                className="input"
                placeholder="+234 800 000 0000"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div>
              <label className="label">
                <Mail className="w-3 h-3 inline mr-1" />
                Email
              </label>
              <input
                type="email"
                className="input"
                placeholder="school@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="label">
              <Globe className="w-3 h-3 inline mr-1" />
              Website (optional)
            </label>
            <input
              type="url"
              className="input"
              placeholder="https://www.yourschool.com"
              value={form.website}
              onChange={(e) => setForm({ ...form, website: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Document customization */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 lg:p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
            <Award className="w-4 h-4 text-warning" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Document Footers</h3>
            <p className="text-xs text-gray-500">Custom text on your printed documents</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="label">Report card footer</label>
            <textarea
              className="input"
              rows={2}
              placeholder="e.g. Together we build tomorrow's leaders"
              value={form.report_card_footer_text}
              onChange={(e) => setForm({ ...form, report_card_footer_text: e.target.value })}
            />
            <p className="text-xs text-gray-500 mt-1">Printed at the bottom of every report card</p>
          </div>

          <div>
            <label className="label">Receipt footer</label>
            <textarea
              className="input"
              rows={2}
              placeholder="e.g. Thank you for choosing our school"
              value={form.receipt_footer_text}
              onChange={(e) => setForm({ ...form, receipt_footer_text: e.target.value })}
            />
            <p className="text-xs text-gray-500 mt-1">Printed at the bottom of every fee receipt</p>
          </div>
        </div>
      </div>

      {/* Save bar - sticky at bottom */}
      <div className="sticky bottom-0 lg:bottom-4 -mx-4 sm:-mx-6 lg:mx-0 p-4 lg:p-4 bg-white lg:bg-white/95 lg:backdrop-blur-md border-t lg:border border-gray-200 lg:rounded-xl lg:shadow-lg flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {error && (
            <>
              <AlertCircle className="w-4 h-4 text-error flex-shrink-0" />
              <span className="text-xs text-error truncate">{error}</span>
            </>
          )}
          {saved && !error && (
            <>
              <Check className="w-4 h-4 text-success flex-shrink-0" />
              <span className="text-xs text-success">Changes saved</span>
            </>
          )}
        </div>
        <button type="submit" disabled={saving} className="btn-primary text-sm whitespace-nowrap">
          {saving ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</>
          ) : (
            'Save changes'
          )}
        </button>
      </div>
    </form>
  );
}
