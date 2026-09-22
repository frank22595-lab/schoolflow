'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Save, Loader2, CheckCircle2, AlertCircle, Upload, X, Image as ImageIcon,
  Stamp, Palette, Calendar, Settings as SettingsIcon, Check,
} from 'lucide-react';
import { compressImageToDataUrl } from '@/lib/compressImage';
import { TEMPLATE_OPTIONS, getStylesForTemplate, getReportTemplate } from '@/components/report-templates';
import type { ColorStyle } from '@/components/report-templates';

// Flat list of all 18 template+color combinations, in TEMPLATE_OPTIONS order.
const ALL_STYLE_COMBOS: Array<{ templateKey: string; templateLabel: string; style: ColorStyle }> =
  TEMPLATE_OPTIONS.flatMap(t => getStylesForTemplate(t.key).map(style => ({ templateKey: t.key, templateLabel: t.label, style })));

const TOGGLE_GROUPS: Array<{ title: string; keys: Array<{ key: string; label: string }> }> = [
  {
    title: 'Student card',
    keys: [
      { key: 'show_photo', label: 'Student photo' },
      { key: 'show_house', label: 'House' },
    ],
  },
  {
    title: 'Academic',
    keys: [
      { key: 'show_position', label: 'Class position' },
      { key: 'show_subject_position', label: 'Subject position' },
      { key: 'show_class_avg', label: 'Class average per subject' },
      { key: 'show_attendance', label: 'Attendance summary' },
      { key: 'show_cumulative', label: 'Cumulative average table' },
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
      { key: 'show_grade_scale', label: 'Grading scale legend' },
    ],
  },
];

const DEFAULT_TOGGLES: Record<string, boolean> = {
  show_photo: true, show_house: true, show_position: true, show_subject_position: true,
  show_class_avg: true, show_attendance: true, show_cumulative: true, show_affective: true,
  show_psychomotor: true, show_teacher_comment: true, show_principal_comment: true, show_grade_scale: true,
};

interface ClassLevel { id: string; name: string; sequence: number; }

interface Props {
  schoolId: string;
  initialSettings: any;
  classLevels: ClassLevel[];
  school: any;
}

export default function ReportCardDesignerClient({ schoolId, initialSettings, classLevels, school }: Props) {
  const router = useRouter();
  const s = initialSettings || {};

  const initialStyleKey =
    s.template_style_key ||
    (s.template_key ? getStylesForTemplate(s.template_key)[0]?.key : null) ||
    'ducams-classic-royal';

  const [styleKey, setStyleKey] = useState<string>(initialStyleKey);
  const [logoUrl, setLogoUrl] = useState<string | null>(s.logo_url || null);
  const [stampUrl, setStampUrl] = useState<string | null>(s.stamp_url || null);
  const [principalSignatureUrl, setPrincipalSignatureUrl] = useState<string | null>(s.principal_signature_url || null);
  const [teacherSignatureUrl, setTeacherSignatureUrl] = useState<string | null>(s.teacher_signature_url || null);
  const [principalName, setPrincipalName] = useState(s.principal_name || '');
  const [nextTermBegins, setNextTermBegins] = useState(s.next_term_begins || '');
  const [headerMotto, setHeaderMotto] = useState(s.header_motto || '');
  const [footerNote, setFooterNote] = useState(s.footer_note || '');
  const [nextTermFees, setNextTermFees] = useState(s.next_term_fees || '');

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

  // ---- Selection ----
  const selectedCombo = ALL_STYLE_COMBOS.find(c => c.style.key === styleKey) || ALL_STYLE_COMBOS[0];

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

  async function save() {
    setSaving(true);
    try {
      const res = await fetch('/api/reports/settings', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolId, templateKey: selectedCombo.templateKey, styleKey: selectedCombo.style.key,
          principalName, nextTermBegins, headerMotto, footerNote, nextTermFees, toggles,
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
  const PreviewTemplate = getReportTemplate(selectedCombo.templateKey);

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
      { subject_name: 'Mathematics', breakdowns: [{ name: 'CA1', score: 18, max: 20 }, { name: 'CA2', score: 17, max: 20 }, { name: 'Exam', score: 52, max: 60 }], total: 87, grade: 'A1', remark: 'Excellent', position_in_subject: 1, class_avg: 68.4 },
      { subject_name: 'English Language', breakdowns: [{ name: 'CA1', score: 15, max: 20 }, { name: 'CA2', score: 16, max: 20 }, { name: 'Exam', score: 45, max: 60 }], total: 76, grade: 'B2', remark: 'Very Good', position_in_subject: 3, class_avg: 65.2 },
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
    settings: { ...toggles, template_key: selectedCombo.templateKey, template_style_key: selectedCombo.style.key, next_term_fees: nextTermFees || null },
    style: selectedCombo.style,
  }), [school, logoUrl, stampUrl, principalSignatureUrl, principalName, headerMotto, footerNote, nextTermBegins, nextTermFees, toggles, selectedCombo, previewClassLevel]);

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Report Card Designer</h1>
          <p className="text-gray-500 mt-1 text-sm">Template + color style, branding, and what appears on printed reports</p>
        </div>
        <button onClick={save} disabled={saving} className="btn-primary text-sm flex-shrink-0">
          {saving ? <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" />Saving...</> : <><Save className="w-4 h-4 mr-1.5" />Save Changes</>}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT: settings */}
        <div className="space-y-6">
          {/* Section 1: Template + color style grid */}
          <Card icon={Palette} iconColor="text-indigo" iconBg="bg-indigo-50" title="Template & color" desc="18 combinations — 6 templates x 3 color styles each">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {ALL_STYLE_COMBOS.map(combo => {
                const selected = combo.style.key === styleKey;
                return (
                  <button key={combo.style.key} type="button" onClick={() => setStyleKey(combo.style.key)}
                    style={{ ['--primary' as any]: combo.style.primary, borderColor: selected ? 'var(--primary)' : undefined }}
                    className={`rounded-lg border-2 overflow-hidden text-left transition-all bg-white ${
                      selected ? 'ring-2 ring-offset-1 ring-[color:var(--primary)]/30' : 'border-gray-200 hover:border-gray-300'
                    }`}>
                    <div className="h-12 w-full" style={{ background: combo.style.bg }}>
                      <div className="h-3 w-full" style={{ background: combo.style.primary }} />
                      <div className="flex items-center gap-1.5 px-2 pt-1.5">
                        <div className="w-3.5 h-3.5 rounded-full flex-shrink-0" style={{ background: combo.style.accent }} />
                        <div className="flex-1 h-2.5 rounded" style={{ background: combo.style.soft, border: `1px solid ${combo.style.primary}` }} />
                      </div>
                    </div>
                    <div className="px-2 py-1.5">
                      <div className="text-xs font-semibold text-gray-900 truncate">{combo.templateLabel}</div>
                      <div className="text-[10px] text-gray-500 truncate flex items-center gap-1">
                        {selected && <Check className="w-2.5 h-2.5 flex-shrink-0" style={{ color: combo.style.primary }} />}
                        {combo.style.label}
                      </div>
                    </div>
                  </button>
                );
              })}
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

          {/* Section 3: Next term date */}
          <Card icon={Calendar} iconColor="text-sky-600" iconBg="bg-sky-50" title="Next term" desc="Shown in the report footer">
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

          {/* Section 4: Toggles */}
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
            <span className="text-[10px] bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">{selectedCombo.templateLabel} · {selectedCombo.style.label}</span>
          </div>
          <div className="max-h-[80vh] overflow-y-auto">
            <PreviewTemplate {...(previewProps as any)} />
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
