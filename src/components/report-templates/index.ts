import ModernMinimalTemplate from './ModernMinimalTemplate';
import ClassicNigerianTemplate from './ClassicNigerianTemplate';
import type { ReportTemplateProps } from './types';

// Template registry — keyed by report_card_settings.template_key.
export const REPORT_TEMPLATES: Record<string, React.ComponentType<ReportTemplateProps>> = {
  'classic-nigerian': ClassicNigerianTemplate,
  'modern-minimal': ModernMinimalTemplate,
  'executive': ModernMinimalTemplate,      // placeholder until Batch 2
  'compact-grid': ModernMinimalTemplate,   // placeholder until Batch 2
  'warm-academic': ModernMinimalTemplate,  // placeholder until Batch 2
};

export const TEMPLATE_OPTIONS: Array<{ key: string; label: string; desc: string }> = [
  { key: 'classic-nigerian', label: 'Classic Nigerian', desc: 'Traditional WAEC-style layout with bordered tables' },
  { key: 'modern-minimal', label: 'Modern Minimal', desc: 'Clean, generous whitespace, subtle color accents' },
  { key: 'executive', label: 'Executive', desc: 'Formal, dense, suited to secondary schools' },
  { key: 'compact-grid', label: 'Compact Grid', desc: 'Fits everything on one page for large subject counts' },
  { key: 'warm-academic', label: 'Warm Academic', desc: 'Softer tones, friendlier for primary/nursery' },
];

export function getReportTemplate(templateKey: string | null | undefined) {
  return REPORT_TEMPLATES[templateKey || 'modern-minimal'] || ModernMinimalTemplate;
}

export { default as ModernMinimalTemplate } from './ModernMinimalTemplate';
export { default as ClassicNigerianTemplate } from './ClassicNigerianTemplate';
export type { ReportTemplateProps } from './types';