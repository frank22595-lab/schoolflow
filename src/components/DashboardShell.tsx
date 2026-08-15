'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  GraduationCap, LayoutDashboard, Users, UserCog, Wallet, ClipboardCheck,
  BookOpen, MessageSquare, Settings, LogOut, Search, Bell, ChevronDown,
  HelpCircle, Sparkles, Menu, X, Home,
} from 'lucide-react';

interface DashboardShellProps {
  profile: any;
  children: React.ReactNode;
}

export default function DashboardShell({ profile, children }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileSearch, setMobileSearch] = useState(false);
  const pathname = usePathname();
  const school = profile?.schools;

  // Close sidebar when route changes (mobile navigation)
  useEffect(() => {
    setSidebarOpen(false);
    setMobileSearch(false);
  }, [pathname]);

  // Lock scroll when mobile sidebar open
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

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

  // Mobile bottom nav (5 most-used sections)
  const bottomNav = [
    { href: '/dashboard', icon: Home, label: 'Home' },
    { href: '/dashboard/students', icon: Users, label: 'Students' },
    { href: '/dashboard/attendance', icon: ClipboardCheck, label: 'Attend' },
    { href: '/dashboard/fees', icon: Wallet, label: 'Fees' },
    { href: '/dashboard/results', icon: BookOpen, label: 'Results' },
  ];

  const isActive = (href: string) => pathname === href;

  const SidebarContent = () => (
    <>
      {/* Logo + School */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-3 group flex-1 min-w-0">
          <div className="w-9 h-9 bg-gradient-to-br from-indigo to-indigo-dark rounded-lg flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow flex-shrink-0">
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
        {/* Close button (mobile only) */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden p-1.5 hover:bg-gray-100 rounded-md text-gray-500"
        >
          <X className="w-5 h-5" />
        </button>
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
                  className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-md transition-all group ${
                    isActive(item.href)
                      ? 'bg-indigo-50 text-indigo-dark font-medium'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-indigo-dark'
                  }`}
                >
                  <item.icon className={`w-4 h-4 ${isActive(item.href) ? 'text-indigo' : 'text-gray-500 group-hover:text-indigo'}`} />
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
          <div className="w-9 h-9 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-semibold shadow-sm flex-shrink-0">
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
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ============ DESKTOP SIDEBAR (fixed left) ============ */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-gray-200 flex-col fixed h-screen z-30">
        <SidebarContent />
      </aside>

      {/* ============ MOBILE SIDEBAR (slide-in overlay) ============ */}
      {/* Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-fade-in"
        />
      )}
      {/* Sliding panel */}
      <aside
        className={`lg:hidden fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-white z-50 flex flex-col shadow-xl transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent />
      </aside>

      {/* ============ MAIN AREA ============ */}
      <div className="lg:ml-64 flex flex-col min-h-screen pb-16 lg:pb-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-gray-100 h-14 lg:h-16 flex items-center justify-between px-3 lg:px-6 gap-2">
          {/* Left: Hamburger (mobile) + search (desktop) */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {/* Hamburger (mobile only) */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 -ml-1 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Mobile: school name + status */}
            <div className="lg:hidden flex items-center gap-2 flex-1 min-w-0">
              <div className="w-7 h-7 bg-gradient-to-br from-indigo to-indigo-dark rounded-md flex items-center justify-center flex-shrink-0">
                <GraduationCap className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate text-gray-900 leading-tight">{school?.name}</div>
                <div className="text-[10px] text-gray-500 flex items-center gap-1">
                  <span className="w-1 h-1 bg-success rounded-full" />
                  Trial · 90d
                </div>
              </div>
            </div>

            {/* Desktop: search bar */}
            <div className="hidden lg:block flex-1 max-w-md">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search students, staff, invoices..."
                  className="w-full pl-10 pr-16 py-2 text-sm bg-gray-100 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo focus:bg-white transition-all"
                />
                <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-xs text-gray-400 bg-white border border-gray-200 rounded">
                  ⌘K
                </kbd>
              </div>
            </div>
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-1">
            {/* Mobile search toggle */}
            <button
              onClick={() => setMobileSearch(!mobileSearch)}
              className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Search className="w-5 h-5" />
            </button>
            <button className="hidden lg:block p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
              <HelpCircle className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full border-2 border-white" />
            </button>
            <div className="hidden lg:block w-px h-6 bg-gray-200 mx-1" />
            <button className="hidden lg:flex items-center gap-2 pl-1 pr-3 py-1 hover:bg-gray-100 rounded-lg transition-colors">
              <div className="w-7 h-7 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                {initials}
              </div>
              <ChevronDown className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </header>

        {/* Mobile search overlay (when toggled) */}
        {mobileSearch && (
          <div className="lg:hidden sticky top-14 z-20 bg-white border-b border-gray-100 p-3 animate-slide-in-top">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                autoFocus
                placeholder="Search..."
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-100 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo focus:bg-white transition-all"
              />
            </div>
          </div>
        )}

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>

      {/* ============ MOBILE BOTTOM NAV ============ */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30 pb-safe">
        <div className="grid grid-cols-5">
          {bottomNav.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-medium transition-colors ${
                  active ? 'text-indigo' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <div className={`p-1 rounded-md ${active ? 'bg-indigo-50' : ''}`}>
                  <item.icon className="w-5 h-5" />
                </div>
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
