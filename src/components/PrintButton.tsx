'use client';

import { Printer } from 'lucide-react';

export default function PrintButton({ label = 'Print', className = 'btn-secondary text-sm' }: { label?: string; className?: string }) {
  return (
    <button type="button" onClick={() => window.print()} className={className}>
      <Printer className="w-4 h-4 mr-1.5" />
      {label}
    </button>
  );
}
