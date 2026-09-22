import ModernMinimalTemplate from './ModernMinimalTemplate';
import ClassicNigerianTemplate from './ClassicNigerianTemplate';
import ExecutiveTemplate from './ExecutiveTemplate';
import CompactGridTemplate from './CompactGridTemplate';
import WarmAcademicTemplate from './WarmAcademicTemplate';
import DucamsClassicTemplate from './DucamsClassicTemplate';
import type { ReportTemplateProps, ColorStyle } from './types';

// Every template ships with 3 curated color styles.
// Backgrounds are always print-friendly (subtle, not dark), and each style has been
// hand-picked so primary + accent + background complement each other.
export const TEMPLATE_STYLES: Record<string, ColorStyle[]> = {
  'modern-minimal': [
    { key: 'modern-minimal-indigo', label: 'Indigo', bg: '#ffffff', primary: '#4f46e5', accent: '#0d9488', ink: '#1f2937', soft: '#f5f5ff' },
    { key: 'modern-minimal-rose',   label: 'Rose',   bg: '#fffafc', primary: '#be185d', accent: '#d97706', ink: '#1f2937', soft: '#fdf2f8' },
    { key: 'modern-minimal-forest', label: 'Forest', bg: '#fafffb', primary: '#047857', accent: '#65a30d', ink: '#111827', soft: '#f0fdf4' },
  ],
  'classic-nigerian': [
    { key: 'classic-nigerian-blue',   label: 'Royal Blue', bg: '#ffffff', primary: '#1e3a8a', accent: '#1e40af', ink: '#111827', soft: '#eff6ff' },
    { key: 'classic-nigerian-green',  label: 'Emerald',    bg: '#ffffff', primary: '#065f46', accent: '#047857', ink: '#111827', soft: '#ecfdf5' },
    { key: 'classic-nigerian-maroon', label: 'Maroon',     bg: '#ffffff', primary: '#7f1d1d', accent: '#991b1b', ink: '#111827', soft: '#fef2f2' },
  ],
  'executive': [
    { key: 'executive-gold',    label: 'Royal Gold', bg: '#fefdf8', primary: '#1a1a1a', accent: '#b8860b', ink: '#1a1a1a', soft: '#fef9e7' },
    { key: 'executive-silver',  label: 'Platinum',   bg: '#ffffff', primary: '#0f172a', accent: '#64748b', ink: '#0f172a', soft: '#f1f5f9' },
    { key: 'executive-bronze',  label: 'Bronze',     bg: '#fdfaf6', primary: '#3f2c1c', accent: '#a16207', ink: '#3f2c1c', soft: '#fef7ed' },
  ],
  'compact-grid': [
    { key: 'compact-grid-teal',   label: 'Ocean Teal', bg: '#ffffff', primary: '#0f766e', accent: '#0284c7', ink: '#111827', soft: '#f0fdfa' },
    { key: 'compact-grid-navy',   label: 'Deep Navy',  bg: '#ffffff', primary: '#1e3a8a', accent: '#0369a1', ink: '#111827', soft: '#eff6ff' },
    { key: 'compact-grid-slate',  label: 'Slate',      bg: '#ffffff', primary: '#334155', accent: '#475569', ink: '#0f172a', soft: '#f1f5f9' },
  ],
  'warm-academic': [
    { key: 'warm-academic-burgundy', label: 'Burgundy',  bg: '#fefdf8', primary: '#7c2d12', accent: '#a16207', ink: '#3f2f24', soft: '#fef3d7' },
    { key: 'warm-academic-sepia',    label: 'Sepia',     bg: '#fdfbf5', primary: '#78350f', accent: '#92400e', ink: '#3f2f24', soft: '#fef3c7' },
    { key: 'warm-academic-forest',   label: 'Old Green', bg: '#fafdfa', primary: '#14532d', accent: '#a16207', ink: '#1c2620', soft: '#f0fdf4' },
  ],
  'ducams-classic': [
    { key: 'ducams-classic-royal',  label: 'Royal Blue', bg: '#fefdf7', primary: '#1e3a8a', accent: '#1e40af', ink: '#0f172a', soft: '#fef9e7' },
    { key: 'ducams-classic-teal',   label: 'Deep Teal',  bg: '#fefdf7', primary: '#0f766e', accent: '#0d9488', ink: '#0f172a', soft: '#f0fdfa' },
    { key: 'ducams-classic-maroon', label: 'Maroon',     bg: '#fefdf7', primary: '#7f1d1d', accent: '#991b1b', ink: '#0f172a', soft: '#fef2f2' },
  ],
};

// Ordered list for the template picker
export const TEMPLATE_OPTIONS: Array<{ key: string; label: string; desc: string }> = [
  { key: 'ducams-classic',   label: 'DUCAMS Classic',   desc: 'Wide table + horizontal bottom strip. Classic BramTech design.' },
  { key: 'modern-minimal',   label: 'Modern Minimal',   desc: 'Clean, generous whitespace, subtle color accents.' },
  { key: 'classic-nigerian', label: 'Classic Nigerian', desc: 'Traditional WAEC-style with bordered tables.' },
  { key: 'executive',        label: 'Executive',        desc: 'Elegant serif, double borders, premium feel.' },
  { key: 'compact-grid',     label: 'Compact Grid',     desc: 'Dense grid layout with colored header bar.' },
  { key: 'warm-academic',    label: 'Warm Academic',    desc: 'Cream tones with ornamental flourishes.' },
];

export const REPORT_TEMPLATES: Record<string, React.ComponentType<ReportTemplateProps>> = {
  'ducams-classic':   DucamsClassicTemplate,
  'modern-minimal':   ModernMinimalTemplate,
  'classic-nigerian': ClassicNigerianTemplate,
  'executive':        ExecutiveTemplate,
  'compact-grid':     CompactGridTemplate,
  'warm-academic':    WarmAcademicTemplate,
};

/** Get the template component for a template_key. Falls back to Modern Minimal. */
export function getReportTemplate(templateKey: string | null | undefined) {
  return REPORT_TEMPLATES[templateKey || 'modern-minimal'] || ModernMinimalTemplate;
}

/** Get the color style for a style_key. Looks up in TEMPLATE_STYLES, returns first style of template as fallback. */
export function getColorStyle(templateKey: string | null | undefined, styleKey: string | null | undefined): ColorStyle {
  const tk = templateKey || 'modern-minimal';
  const styles = TEMPLATE_STYLES[tk] || TEMPLATE_STYLES['modern-minimal'];
  if (styleKey) {
    const found = styles.find(s => s.key === styleKey);
    if (found) return found;
  }
  return styles[0];
}

/** Get all styles for a template (for the picker) */
export function getStylesForTemplate(templateKey: string): ColorStyle[] {
  return TEMPLATE_STYLES[templateKey] || TEMPLATE_STYLES['modern-minimal'];
}

export { default as ModernMinimalTemplate }   from './ModernMinimalTemplate';
export { default as ClassicNigerianTemplate } from './ClassicNigerianTemplate';
export { default as ExecutiveTemplate }       from './ExecutiveTemplate';
export { default as CompactGridTemplate }     from './CompactGridTemplate';
export { default as WarmAcademicTemplate }    from './WarmAcademicTemplate';
export { default as DucamsClassicTemplate }   from './DucamsClassicTemplate';
export type { ReportTemplateProps, ColorStyle, ReportScore, ScoreBreakdown } from './types';
