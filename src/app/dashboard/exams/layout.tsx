'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ClipboardList, FileText } from 'lucide-react';

const TABS = [
  { label: 'Exams', href: '/dashboard/exams', icon: ClipboardList },
  { label: 'Question Bank', href: '/dashboard/exams/questions', icon: FileText },
];

export default function ExamsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div>
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-1">
          {TABS.map((tab) => {
            const active = tab.href === '/dashboard/exams'
              ? pathname === '/dashboard/exams'
              : pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`inline-flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 -mb-px ${
                  active ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>
      {children}
    </div>
  );
}
