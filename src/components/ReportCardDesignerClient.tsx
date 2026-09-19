'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Save, Loader2, CheckCircle2, AlertCircle, Upload, X, Image as ImageIcon,
  Stamp, PenTool, User, Palette, Calendar, Settings as SettingsIcon,
} from 'lucide-react';
import { compressImageToDataUrl } from '@/lib/compressImage';
import { getReportTemplate } from '@/components/report-templates';

const SWATCHES: Array<{ name: string; hex: string }> = [
  { name: 'Indigo', hex: '#4F46E5' },
  { name: 'Teal', hex: '#0D9488' },
  { name: 'Rose', hex: '#E11D48' },
  { name: 'Blue', hex: '#2563EB' },
  { name: 'Green', hex: '#16A34A' },
  { name: 'Maroon', hex: '#7F1D1D' },
  { name: 'Purple', hex: '#7C3AED' },
  { name: 'Orange', hex: '#EA580C' },
  { name: 'Gold', hex: '#CA8A04' },
  { name: 'Slate', hex: '#475569' },
];

const TEMPLATES = [
  { key: 'classic-nigerian', label: 'Classic Nigerian', desc: 'Traditional WAEC-style bordered tables' },
  { key: 'modern-minimal', label: 'Modern Minimal', desc: 'Clean, generous whitespace, subtle accents' },
  { key: 'executive', label: 'Executive', desc: 'Formal and dense, suits secondary schools' },
  { key: 'compact-grid', label: 'Compact Grid', desc: 'Fits everything on one page' },
  { key: 'warm-academic', label: 'Warm Academic', desc: 'Softer tones for primary/nursery' },
];

const TOGGLE_GROUPS: Array<{ title: string; keys: Array<{ key: string; label: string }> }> = [
  {
    title: 'Header & Identity',
    keys: [
      { key: 'show_logo', label: 'School logo' },
      { key: 'show_motto', label: 'School motto' },
    ],
  },
  {
    title: 'Academic',
    keys: [
      { key: 'show_class_position', label: 'Class position' },
      { key: 'show_subject_position', label: 'Subject position' },
      { key: 'show_cumulative_average', label: 'Cumulative average' },
      { key: 'show_class_average', label: 'Class average per subject' },
      { key: 'show_highest_lowest', label: 'Highest & lowest per subject' },
      { key: 'show_gpa', label: 'GPA' },
      { key: 'show_attendance', label: 'Attendance summary' },
    ],
  },
  {
    title: 'Behavior',
    keys: [
      { key: 'show_affective', label: 'Affective domain (traits)' },
      { key: 'show_psychomotor', label: 'Psychomotor skills' },
    ],
  },
  {
    title: 'Comments',
    keys: [
      { key: 'show_teacher_comment', label: "Teacher's comment" },
      { key: 'show_principal_comment', label: "Principal's comment" },
    ],
  },
  {
    title: 'Footer',
    keys: [
      { key: 'show_next_term_dates', label: 'Next term dates' },
      { key: 'show_fees_notice', label: 'Fees notice' },
      { key: 'show_signatures', label: 'Signature lines' },
      { key: 'show_stamp_area', label: 'School stamp area' },
    ],
  },
];

const DEFAULT_TOGGLES: Record<string, boolean> = {
  show_class_position: true, show_subject_position: true, show_cumulative_average: true,
  show_class_average: true, show_highest_lowest: true, show_gpa: false, show_attendance: true,
  show_affective: true, show_psychomotor: true, show_teacher_comment: true, show_principal_comment: true,
  show_next_term_dates: true, show_fees_notice: false, show_signatures: true, show_stamp_area: true,
  show_logo: true, show_motto: true,
};

interface ClassLevel { id: string; name: string; sequence: number; }
interface ColorRow { class_level_id: string; primary_color: string; accent_color: string | null; }

interface Props {
  schoolId: string;
  initialSettings: any;
  classLevels: ClassLevel[];
  initialColors: ColorRow[];
  school: any;
}

export default function ReportCardDesignerClient({ schoolId, initialSettings, classLevels, initialColors, school }: Props) {
  const router = useRouter();
  const s = initialSettings || {};

  const [templateKey, setTemplateKey] = useState<string>(s.template_key || 'modern-minimal');
  const [logoUrl, setLogoUrl] = useState<string | null>(s.logo_url || null);
  const [stampUrl, setStampUrl] = useState<string | null>(s.stamp_url || null);
  const [principalSignatureUrl, setPrincipalSignatureUrl] = useState<string | null>(s.principal_signature_url || null);
  const [teacherSignatureUrl, setTeacherSignatureUrl] = useState<string | null>(s.teacher_signature_url || null);
  const [principalName, setPrincipalName] = useState(s.principal_name || '');
  const [nextTermBegins, setNextTermBegins] = useState(s.next_term_begins || '');
  const [headerMotto, setHeaderMotto] = useState(s.header_motto || '');
  const [footerNote, setFooterNote] = useState(s.footer_note || '');
  const [nextTermFees, setNextTermFees] = useState(s.next_term_fees || '');

  const [colors, setColors] = useState<Record<string, { primary: string; accent: string | null }>>(() => {
    const map: Record<string, { primary: string; accent: string | null }> = {};
    classLevels.forEach(l => { map[l.id] = { primary: '#4F46E5', accent: null }; });
    initialColors.forEach(c => { map[c.class_level_id] = { primary: c.primary_color, accent: c.accent_color }; });
    return map;
  });

  const [toggles, setToggles] = useState<Record<string, boolean>>(() => {
    const t: Record<string, boolean> = { ...DEFAULT_TOGGLES };
    for (const key of Object.keys(DEFAULT_TOGGLES)) {
      if (s[key] !== undefined && s[key] !== null) t[key] = s[key];
    }
    return t;
  });

  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  function showToast(type: 'success' | 'error', msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  }

  async function uploadAsset(kind: 'logo' | 'stamp' | 'principal_signature' | 'teacher_signature', file: File) {
    setUploading(u => ({ ...u, [kind]: true }));
    try {
      const dataUrl = await compressImageToDataUrl(file, 600, 300);
      const res = await fetch('/api/reports/upload-asset', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schoolId, kind, dataUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (kind === 'logo') setLogoUrl(data.url);
      if (kind === 'stamp') setStampUrl(data.url);
      if (kind === 'principal_signature') setPrincipalSignatureUrl(data.url);
      if (kind === 'teacher_signature') setTeacherSignatureUrl(data.url);
      showToast('success', 'Uploaded');
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(u => ({ ...u, [kind]: false }));
    }
  }

  function setColor(classLevelId: string, field: 'primary' | 'accent', value: string | null) {
    setColors(c => ({ ...c, [classLevelId]: { ...c[classLevelId], [field]: value } }));
  }

  async function save() {
    setSaving(true);
    try {
      const res = await fetch('/api/reports/settings', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolId, templateKey, principalName, nextTermBegins,
          headerMotto, footerNote, nextTermFees,
          toggles,
          colors: classLevels.map(l => ({
            classLevelId: l.id,
            primaryColor: colors[l.id]?.primary || '#4F46E5',
            accentColor: colors[l.id]?.accent || null,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast('success', 'Report card settings saved');
      router.refresh();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  // ---- Live preview ----
  const previewClassLevel = classLevels[0];
  const previewColor = previewClassLevel ? colors[previewClassLevel.id] : { primary: '#4F46E5', accent: null };
  const PreviewTemplate = getReportTemplate(templateKey);

  const previewProps = useMemo(() => ({
    school: {
      name: school?.name || 'Sample School',
      address: school?.address || '12 Sample Street, Lagos',
      phone: school?.phone || '+234 800 000 0000',
      email: school?.email || 'info@sampleschool.com',
      logo_url: logoUrl || school?.logo_url || null,
      motto: headerMotto || school?.motto || 'Knowledge is Power',
      principal_name: principalName || undefined,
      principal_signature_url: principalSignatureUrl,
      stamp_url: stampUrl,
    },
    student: {
      first_name: 'Ada', last_name: 'Okafor',
      admission_number: 'SCH/25/0001', photo_url: null, gender: 'female',
      date_of_birth: '2012-05-14', house: 'Red House',
    },
    section: {
      name: 'A', full_name: previewClassLevel ? `${previewClassLevel.name} A` : 'JSS 1 A',
      class_level_name: previewClassLevel?.name || 'JSS 1', class_level_id: previewClassLevel?.id || '',
    },
    term: { name: 'First Term', session_name: '2025/2026', next_term_begins: nextTermBegins || null },
    scores: [
      { subject_name: 'Mathematics', ca1: 18, ca2: 17, exam: 52, total: 87, grade: 'A1', remark: 'Excellent', position_in_subject: 1, class_avg: 68.4 },
      { subject_name: 'English Language', ca1: 15, ca2: 16, exam: 45, total: 76, grade: 'B2', remark: 'Very Good', position_in_subject: 3, class_avg: 65.2 },
    ],
    summary: { total_marks: 163, average: 81.5, overall_grade: 'A1', position_in_class: 2, students_in_class: 28 },
    behavior: {
      affective: [{ name: 'Punctuality', rating: 5 }, { name: 'Neatness', rating: 4 }],
      psychomotor: [{ name: 'Handwriting', rating: 4 }, { name: 'Sports/Games', rating: 5 }],
    },
    comments: { teacher_comment: footerNote || 'A diligent and focused student this term.', teacher_name: 'Mrs. Adaeze Bello', principal_comment: 'Keep up the excellent work.' },
    attendance: { present: 58, absent: 2, late: 1, total_days: 61, rate_percent: 97 },
    cumulative: { term1_avg: 81.5, term2_avg: null, term3_avg: null, cumulative_avg: 81.5 },
    grade_scale: [
      { grade: 'A1', min: 75, max: 100, remark: 'Excellent' },
      { grade: 'B2', min: 70, max: 74.99, remark: 'Very Good' },
      { grade: 'F9', min: 0, max: 39.99, remark: 'Fail' },
    ],
    settings: { ...toggles, template_key: templateKey, next_term_fees: nextTermFees || null },
    color: { primary: previewColor?.primary || '#4F46E5', accent: previewColor?.accent || undefined },
  }), [school, logoUrl, stampUrl, principalSignatureUrl, principalName, headerMotto, footerNote, nextTermBegins, nextTermFees, toggles, templateKey, previewClassLevel, previewColor]);

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Report Card Designer</h1>
          <p className="text-gray-500 mt-1 text-sm">Template, branding, colors, and what appears on printed reports</p>
        </div>
        <button onClick={save} disabled={saving} className="btn-primary text-sm flex-shrink-0">
          {saving ? <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" />Saving...</> : <><Save className="w-4 h-4 mr-1.5" />Save Changes</>}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT: settings */}
        <div className="space-y-6">
          {/* Section 1: Template picker */}
          <Card icon={ImageIcon} iconColor="text-indigo" iconBg="bg-indigo-50" title="Template" desc="Pick a layout — you can change it anytime">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {TEMPLATES.map(t => (
                <button key={t.key} type="button" onClick={() => setTemplateKey(t.key)}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    templateKey === t.key ? 'border-indigo bg-indigo-50' : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}>
                  <div className="font-medium text-sm text-gray-900">{t.label}</div>
                  <div className="text-[11px] text-gray-500 mt-0.5">{t.desc}</div>
                </button>
              ))}
            </div>
          </Card>

          {/* Section 2: Branding */}
          <Card icon={Stamp} iconColor="text-purple-600" iconBg="bg-purple-50" title="Branding" desc="Logo, stamp, and signatures used on the printed report">
            <div className="grid grid-cols-2 gap-3">
              <AssetUpload label="School logo" url={logoUrl} uploading={!!uploading.logo} onFile={(f) => uploadAsset('logo', f)} onClear={() => setLogoUrl(null)} />
              <AssetUpload label="Principal stamp" url={stampUrl} uploading={!!uploading.stamp} onFile={(f) => uploadAsset('stamp', f)} onClear={() => setStampUrl(null)} />
              <AssetUpload label="Principal signature" url={principalSignatureUrl} uploading={!!uploading.principal_signature} onFile={(f) => uploadAsset('principal_signature', f)} onClear={() => setPrincipalSignatureUrl(null)} />
              <AssetUpload label="Teacher signature" url={teacherSignatureUrl} uploading={!!uploading.teacher_signature} onFile={(f) => uploadAsset('teacher_signature', f)} onClear={() => setTeacherSignatureUrl(null)} />
            </div>
            <div>
              <label className="label">Principal's name</label>
              <input type="text" className="input" placeholder="e.g. Mrs. Chioma Eze"
                value={principalName} onChange={(e) => setPrincipalName(e.target.value)} />
            </div>
            <div>
              <label className="label">School motto (header)</label>
              <input type="text" className="input" placeholder="e.g. Knowledge is Power"
                value={headerMotto} onChange={(e) => setHeaderMotto(e.target.value)} />
            </div>
          </Card>

          {/* Section 3: Class-level colors */}
          <Card icon={Palette} iconColor="text-emerald-600" iconBg="bg-emerald-50" title="Class-level colors" desc="Each class level gets its own accent color on report cards">
            {classLevels.length === 0 ? (
              <div className="text-sm text-gray-500 py-4 text-center">No class levels set up yet.</div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {classLevels.map(l => (
                  <div key={l.id} className="flex items-center gap-3 p-2 border border-gray-100 rounded-lg">
                    <div className="w-24 text-sm font-medium text-gray-900 truncate">{l.name}</div>
                    <div className="flex-1 flex items-center gap-1 flex-wrap">
                      {SWATCHES.map(sw => (
                        <button key={sw.hex} type="button" title={sw.name} onClick={() => setColor(l.id, 'primary', sw.hex)}
                          className={`w-6 h-6 rounded-full border-2 flex-shrink-0 ${colors[l.id]?.primary === sw.hex ? 'border-gray-900' : 'border-white shadow'}`}
                          style={{ backgroundColor: sw.hex }} />
                      ))}
                    </div>
                    <input type="text" className="input text-xs font-mono w-24 flex-shrink-0" placeholder="#4F46E5"
                      value={colors[l.id]?.primary || ''} onChange={(e) => setColor(l.id, 'primary', e.target.value)} />
                    <div className="w-6 h-6 rounded-full border border-gray-200 flex-shrink-0" style={{ backgroundColor: colors[l.id]?.primary || '#4F46E5' }} />
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Section 4: Next term date */}
          <Card icon={Calendar} iconColor="text-sky-600" iconBg="bg-sky-50" title="Next term" desc="Shown in the footer when the 'Next term dates' toggle is on">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label">Next term begins</label>
                <input type="date" className="input" value={nextTermBegins} onChange={(e) => setNextTermBegins(e.target.value)} />
              </div>
              <div>
                <label className="label">Next term fees (₦)</label>
                <input type="number" className="input" value={nextTermFees} onChange={(e) => setNextTermFees(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="label">Footer note</label>
              <input type="text" className="input" placeholder="e.g. This result is only valid with school stamp"
                value={footerNote} onChange={(e) => setFooterNote(e.target.value)} />
            </div>
          </Card>

          {/* Section 5: Toggles */}
          <Card icon={SettingsIcon} iconColor="text-gray-600" iconBg="bg-gray-100" title="What to show" desc="Toggle sections on or off the printed report">
            <div className="space-y-4">
              {TOGGLE_GROUPS.map(group => (
                <div key={group.title}>
                  <div className="text-[11px] font-semibold text-gray-500 uppercase mb-1.5">{group.title}</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {group.keys.map(({ key, label }) => (
                      <label key={key} className="flex items-center gap-2 p-2 border border-gray-100 rounded-lg cursor-pointer hover:bg-gray-50">
                        <input type="checkbox" className="accent-indigo" checked={!!toggles[key]}
                          onChange={(e) => setToggles(t => ({ ...t, [key]: e.target.checked }))} />
                        <span className="text-sm text-gray-800">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* RIGHT: live preview */}
        <div className="lg:sticky lg:top-6 lg:self-start space-y-3">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900 text-sm">Live preview</h3>
            <span className="text-[10px] bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">{TEMPLATES.find(t => t.key === templateKey)?.label}</span>
          </div>
          <div className="max-h-[80vh] overflow-y-auto">
            <PreviewTemplate {...previewProps} />
          </div>
        </div>
      </div>

      {toast && (
        <div className={`fixed bottom-6 right-4 left-4 sm:left-auto z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg ${
          toast.type === 'success' ? 'bg-success text-white' : 'bg-error text-white'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span className="text-sm font-medium">{toast.msg}</span>
        </div>
      )}
    </div>
  );
}

function Card({ icon: Icon, iconColor, iconBg, title, desc, children }: any) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 lg:p-5 space-y-4">
      <div className="flex items-center gap-2">
        <div className={`w-8 h-8 ${iconBg} rounded-lg flex items-center justify-center`}>
          <Icon className={`w-4 h-4 ${iconColor}`} />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
          <p className="text-[11px] text-gray-500">{desc}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function AssetUpload({ label, url, uploading, onFile, onClear }: { label: string; url: string | null; uploading: boolean; onFile: (f: File) => void; onClear: () => void }) {
  return (
    <div className="border border-gray-200 rounded-lg p-2.5 space-y-2">
      <div className="text-[11px] font-medium text-gray-700">{label}</div>
      {url ? (
        <div className="relative">
          <img src={url} alt={label} className="w-full h-16 object-contain bg-gray-50 rounded border border-gray-100" />
          <button type="button" onClick={onClear} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-400 hover:text-error shadow">
            <X className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center h-16 border-2 border-dashed border-gray-200 rounded cursor-pointer hover:border-indigo transition-colors">
          {uploading ? <Loader2 className="w-4 h-4 animate-spin text-indigo" /> : <Upload className="w-4 h-4 text-gray-400" />}
          <input type="file" accept="image/*" className="hidden" disabled={uploading}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
        </label>
      )}
    </div>
  );
}
