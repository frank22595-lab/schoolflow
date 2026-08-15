import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import {
  School, Calendar, GraduationCap, BookOpen, Wallet, Users,
  Shield, Bell, CreditCard, Palette, Database, ArrowRight,
  CheckCircle2, Circle,
} from 'lucide-react';

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from('users').select('*, schools(*)').eq('id', user!.id).single();
  const school = profile?.schools;

  // Check what's set up
  const hasLogo = !!school?.logo_url;
  const hasBranding = !!school?.motto && !!school?.address;

  const sections = [
    {
      category: 'Getting Started',
      description: 'Essential setup for your school',
      items: [
        {
          href: '/dashboard/settings/school',
          icon: School,
          title: 'School Profile',
          desc: 'Name, logo, address, motto, contact details',
          done: hasBranding,
          accent: 'from-indigo-500 to-indigo-600',
          iconBg: 'bg-indigo-50',
          iconColor: 'text-indigo',
        },
        {
          href: '/dashboard/settings/academic',
          icon: Calendar,
          title: 'Academic Calendar',
          desc: 'Sessions, terms, resumption and vacation dates',
          done: false,
          accent: 'from-sky-500 to-sky-600',
          iconBg: 'bg-sky-50',
          iconColor: 'text-info',
        },
        {
          href: '/dashboard/settings/classes',
          icon: GraduationCap,
          title: 'Classes & Sections',
          desc: 'Class levels, arms, streams, houses',
          done: false,
          accent: 'from-emerald-500 to-emerald-600',
          iconBg: 'bg-emerald-50',
          iconColor: 'text-success',
        },
        {
          href: '/dashboard/settings/subjects',
          icon: BookOpen,
          title: 'Subjects & Grading',
          desc: 'Subjects, grading scales, assessment components',
          done: false,
          accent: 'from-amber-500 to-amber-600',
          iconBg: 'bg-amber-50',
          iconColor: 'text-warning',
        },
      ],
    },
    {
      category: 'Operations',
      description: 'Configure how you run day-to-day',
      items: [
        {
          href: '/dashboard/settings/fees',
          icon: Wallet,
          title: 'Fee Setup',
          desc: 'Fee heads, structures, discounts, bank accounts',
          done: false,
          accent: 'from-emerald-500 to-emerald-600',
          iconBg: 'bg-emerald-50',
          iconColor: 'text-success',
        },
        {
          href: '/dashboard/settings/attendance',
          icon: Calendar,
          title: 'Attendance Rules',
          desc: 'Marking frequency, late thresholds, statuses',
          done: false,
          accent: 'from-sky-500 to-sky-600',
          iconBg: 'bg-sky-50',
          iconColor: 'text-info',
        },
      ],
    },
    {
      category: 'People & Access',
      description: 'Manage who can do what',
      items: [
        {
          href: '/dashboard/settings/roles',
          icon: Shield,
          title: 'Roles & Permissions',
          desc: 'Configure what each role can access',
          done: true,
          accent: 'from-indigo-500 to-indigo-600',
          iconBg: 'bg-indigo-50',
          iconColor: 'text-indigo',
        },
        {
          href: '/dashboard/settings/team',
          icon: Users,
          title: 'Team Members',
          desc: 'Invite staff, assign roles',
          done: false,
          accent: 'from-amber-500 to-amber-600',
          iconBg: 'bg-amber-50',
          iconColor: 'text-warning',
        },
      ],
    },
    {
      category: 'Preferences',
      description: 'Personalize your experience',
      items: [
        {
          href: '/dashboard/settings/notifications',
          icon: Bell,
          title: 'Notifications',
          desc: 'Email, SMS, WhatsApp preferences',
          done: false,
          accent: 'from-sky-500 to-sky-600',
          iconBg: 'bg-sky-50',
          iconColor: 'text-info',
        },
        {
          href: '/dashboard/settings/branding',
          icon: Palette,
          title: 'Branding',
          desc: 'Report cards, receipts, ID card templates',
          done: false,
          accent: 'from-indigo-500 to-indigo-600',
          iconBg: 'bg-indigo-50',
          iconColor: 'text-indigo',
        },
      ],
    },
    {
      category: 'Account',
      description: 'Billing and data',
      items: [
        {
          href: '/dashboard/settings/subscription',
          icon: CreditCard,
          title: 'Subscription & Billing',
          desc: 'Plan details, billing history',
          done: false,
          accent: 'from-emerald-500 to-emerald-600',
          iconBg: 'bg-emerald-50',
          iconColor: 'text-success',
        },
        {
          href: '/dashboard/settings/data',
          icon: Database,
          title: 'Data & Privacy',
          desc: 'Export data, deletion requests, NDPR',
          done: false,
          accent: 'from-amber-500 to-amber-600',
          iconBg: 'bg-amber-50',
          iconColor: 'text-warning',
        },
      ],
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/dashboard" className="hover:text-indigo transition-colors">Dashboard</Link>
          <span className="text-gray-300">/</span>
          <span>Settings</span>
        </div>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Configure your school and preferences
        </p>
      </div>

      {/* Sections */}
      {sections.map((section) => (
        <div key={section.category}>
          <div className="mb-3">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
              {section.category}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">{section.description}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {section.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group relative bg-white rounded-xl border border-gray-200 p-4 lg:p-5 hover:border-gray-300 hover:shadow-md transition-all overflow-hidden"
              >
                <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${item.accent} opacity-0 group-hover:opacity-100 transition-opacity`} />

                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg ${item.iconBg} flex items-center justify-center flex-shrink-0`}>
                    <item.icon className={`w-5 h-5 ${item.iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 text-sm">{item.title}</h3>
                      {item.done ? (
                        <CheckCircle2 className="w-4 h-4 text-success" />
                      ) : (
                        <Circle className="w-4 h-4 text-gray-300" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-indigo group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-1" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
