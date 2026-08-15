import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  GraduationCap, LayoutDashboard, Users, UserCog, Wallet, ClipboardCheck,
  BookOpen, MessageSquare, Settings, LogOut, Search, Bell, ChevronDown,
  HelpCircle, Sparkles,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('users')
    .select('*, schools(*)')
    .eq('id', user.id)
    .single();

  const school = profile?.schools;

  // Grouped navigation for clarity
  const navGroups = [
    {
      label: 'Overview',
      items: [
        { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      ],
    },
    {
      label: 'People',
      items: [
        { href: '/dashboard/students', icon: Users, label: 'Students', count: 0 },
        { href: '/dashboard/staff', icon: UserCog, label: 'Staff', count: 1 },
        { href: '/dashboard/parents', icon: Users, label: 'Parents', count: 0 },
      ],
    },
    {
      label: 'Operations',
      items: [
        { href: '/dashboard/attendance', icon: ClipboardCheck, label: 'Attendance' },
        { href: '/dashboard/results', icon: BookOpen, label: 'Results & CBT' },
        { href: '/dashboard/fees', icon: Wallet, label: 'Fees' },
      ],
    },
    {
      label: 'Manage',
      items: [
        { href: '/dashboard/communication', icon: MessageSquare, label: 'Communication' },
        { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
      ],
    },
  ];

  const initials = `${profile?.first_name?.[0] || ''}${profile?.last_name?.[0] || ''}`.toUpperCase();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* ============ SIDEBAR ============ */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col fixed h-screen">
        {/* Logo + School */}
        <div className="p-4 border-b border-gray-100">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo to-indigo-dark rounded-lg flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm truncate text-gray-900">{school?.name || 'School'}</div>
              <div className="text-xs text-gray-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-success rounded-full" />
                Trial · 90 days left
              </div>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-6">
          {navGroups.map((group) => (
            <div key={group.label}>
              <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">
                {group.label}
              </div>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-indigo-50 hover:text-indigo-dark transition-all group"
                  >
                    <item.icon className="w-4 h-4 text-gray-500 group-hover:text-indigo" />
                    <span className="flex-1">{item.label}</span>
                    {'count' in item && item.count !== undefined && (
                      <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                        {item.count}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Help card */}
        <div className="p-3">
          <div className="p-4 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg border border-indigo-100">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 bg-indigo rounded-md flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-xs font-semibold text-indigo-dark">Need help?</span>
            </div>
            <p className="text-xs text-gray-600 mb-3 leading-relaxed">
              Chat with us on WhatsApp for setup assistance.
            </p>
            <a
              href="https://wa.me/2348000000000"
              target="_blank"
              className="text-xs font-medium text-indigo hover:underline"
            >
              Message support →
            </a>
          </div>
        </div>

        {/* User */}
        <div className="p-3 border-t border-gray-100">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-semibold shadow-sm">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate text-gray-900">
                {profile?.first_name} {profile?.last_name}
              </div>
              <div className="text-xs text-gray-500 truncate">Principal</div>
            </div>
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="p-1.5 text-gray-400 hover:text-error hover:bg-red-50 rounded transition-colors"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* ============ MAIN AREA (with top bar) ============ */}
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 h-16 flex items-center justify-between px-6">
          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search students, staff, invoices..."
                className="w-full pl-10 pr-4 py-2 text-sm bg-gray-100 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo focus:bg-white transition-all"
              />
              <kbd className="hidden md:inline-block absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-xs text-gray-400 bg-white border border-gray-200 rounded">
                ⌘K
              </kbd>
            </div>
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-2">
            <button className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
              <HelpCircle className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full border-2 border-white" />
            </button>
            <div className="w-px h-6 bg-gray-200 mx-2" />
            <button className="flex items-center gap-2 pl-1 pr-3 py-1 hover:bg-gray-100 rounded-lg transition-colors">
              <div className="w-7 h-7 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                {initials}
              </div>
              <ChevronDown className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
