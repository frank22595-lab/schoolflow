import ModernMinimalTemplate from './ModernMinimalTemplate';
import type { ReportTemplateProps } from './ModernMinimalTemplate';

// Template registry — keyed by report_card_settings.template_key.
// All 5 keys point at the placeholder for now. When a real template lands in this
// folder (e.g. ClassicNigerianTemplate.tsx), just import it and swap its entry here;
// every call site (designer preview, individual report page) picks it up automatically.
export const REPORT_TEMPLATES: Record<string, React.ComponentType<ReportTemplateProps>> = {
  'classic-nigerian': ModernMinimalTemplate,
  'modern-minimal': ModernMinimalTemplate,
  'executive': ModernMinimalTemplate,
  'compact-grid': ModernMinimalTemplate,
  'warm-academic': ModernMinimalTemplate,
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
export type { ReportTemplateProps } from './ModernMinimalTemplate';
