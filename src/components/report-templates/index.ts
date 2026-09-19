import ModernMinimalTemplate from './ModernMinimalTemplate';
import ClassicNigerianTemplate from './ClassicNigerianTemplate';
import ExecutiveTemplate from './ExecutiveTemplate';
import CompactGridTemplate from './CompactGridTemplate';
import WarmAcademicTemplate from './WarmAcademicTemplate';
import type { ReportTemplateProps } from './types';

export const REPORT_TEMPLATES: Record<string, React.ComponentType<ReportTemplateProps>> = {
  'classic-nigerian': ClassicNigerianTemplate,
  'modern-minimal': ModernMinimalTemplate,
  'executive': ExecutiveTemplate,
  'compact-grid': CompactGridTemplate,
  'warm-academic': WarmAcademicTemplate,
};

export const TEMPLATE_OPTIONS: Array<{ key: string; label: string; desc: string }> = [
  { key: 'classic-nigerian', label: 'Classic Nigerian', desc: 'Traditional WAEC-style with bordered tables' },
  { key: 'modern-minimal', label: 'Modern Minimal', desc: 'Clean, indigo accents, generous whitespace' },
  { key: 'executive', label: 'Executive', desc: 'Premium gold-and-black serif, elite feel' },
  { key: 'compact-grid', label: 'Compact Grid', desc: 'Dense, everything visible, teal defaults' },
  { key: 'warm-academic', label: 'Warm Academic', desc: 'Cream and burgundy, diploma-like softness' },
];

export function getReportTemplate(templateKey: string | null | undefined) {
  return REPORT_TEMPLATES[templateKey || 'modern-minimal'] || ModernMinimalTemplate;
}

export { default as ModernMinimalTemplate } from './ModernMinimalTemplate';
export { default as ClassicNigerianTemplate } from './ClassicNigerianTemplate';
export { default as ExecutiveTemplate } from './ExecutiveTemplate';
export { default as CompactGridTemplate } from './CompactGridTemplate';
export { default as WarmAcademicTemplate } from './WarmAcademicTemplate';
export type { ReportTemplateProps } from './types';