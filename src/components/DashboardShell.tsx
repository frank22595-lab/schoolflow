'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Home, Users, ClipboardCheck, Wallet, BookOpen, Menu, X,
  Bell, Search, GraduationCap, Settings, LogOut, ChevronRight,
  Briefcase, Heart, MessageCircle, BarChart3, Building2, Shield,
  User as UserIcon, KeyRound, Palette, MoreHorizontal,
  Grid3x3, ChevronDown,
} from 'lucide-react';

interface Props {
  children: React.ReactNode;
  user: any;
  school: any;
}

export default function DashboardShell({ children, user, school }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  // Close menus on route change
  useEffect(() => {
    setSidebarOpen(false);
    setMoreOpen(false);
    setProfileOpen(false);
  }, [pathname]);

  // Close profile menu on outside click
  useEffect(() => {
    if (!profileOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-profile-menu]')) setProfileOpen(false);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [profileOpen]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  // Sidebar groups (desktop full nav)
  const sidebarGroups = [
    {
      label: 'Overview',
      items: [
        { label: 'Dashboard', href: '/dashboard', icon: Home },
        { label: 'Reports', href: '/dashboard/reports', icon: BarChart3 },
      ],
    },
    {
      label: 'People',
      items: [
        { label: 'Students', href: '/dashboard/students', icon: GraduationCap },
        { label: 'Staff', href: '/dashboard/staff', icon: Briefcase },
        { label: 'Parents', href: '/dashboard/parents', icon: Heart },
      ],
    },
    {
      label: 'Academics',
      items: [
        { label: 'Attendance', href: '/dashboard/attendance', icon: ClipboardCheck },
        { label: 'Grades & Results', href: '/dashboard/grades', icon: BookOpen },
        { label: 'Communication', href: '/dashboard/communication', icon: MessageCircle },
      ],
    },
    {
      label: 'Finance',
      items: [
        { label: 'Fees', href: '/dashboard/fees', icon: Wallet },
      ],
    },
    {
      label: 'Setup',
      items: [
        { label: 'School Settings', href: '/dashboard/settings', icon: Settings },
      ],
    },
  ];

  // Bottom nav (mobile) — 4 main + More
  const bottomNav = [
    { label: 'Home', href: '/dashboard', icon: Home },
    { label: 'Students', href: '/dashboard/students', icon: GraduationCap },
    { label: 'Attend', href: '/dashboard/attendance', icon: ClipboardCheck },
    { label: 'Fees', href: '/dashboard/fees', icon: Wallet },
  ];

  // "More" sheet items (mobile)
  const moreItems = [
    {
      label: 'People',
      items: [
        { label: 'Staff', href: '/dashboard/staff', icon: Briefcase, color: 'text-purple-600', bg: 'bg-purple-50' },
        { label: 'Parents', href: '/dashboard/parents', icon: Heart, color: 'text-teal-600', bg: 'bg-teal-50' },
      ],
    },
    {
      label: 'Academics',
      items: [
        { label: 'Grades & Results', href: '/dashboard/grades', icon: BookOpen, color: 'text-amber-600', bg: 'bg-amber-50' },
        { label: 'Communication', href: '/dashboard/communication', icon: MessageCircle, color: 'text-sky-600', bg: 'bg-sky-50' },
      ],
    },
    {
      label: 'Insights',
      items: [
        { label: 'Reports', href: '/dashboard/reports', icon: BarChart3, color: 'text-emerald-600', bg: 'bg-emerald-50' },
      ],
    },
    {
      label: 'Setup',
      items: [
        { label: 'School Settings', href: '/dashboard/settings', icon: Settings, color: 'text-indigo', bg: 'bg-indigo-50' },
      ],
    },
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  const userInitials = user?.full_name
    ? user.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : user?.email?.[0].toUpperCase() || 'U';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ===== TOP BAR ===== */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between h-14 lg:h-16 px-4 lg:px-6">
          {/* Left: hamburger + school */}
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)}
              className="p-2 -ml-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md lg:hidden">
              <Menu className="w-5 h-5" />
            </button>
            <button onClick={() => setSidebarOpen(true)}
              className="hidden lg:flex items-center gap-2 p-2 -ml-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md">
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center flex-shrink-0">
                {school?.logo_url
                  ? <img src={school.logo_url} className="w-full h-full rounded-lg object-cover" alt="" />
                  : <GraduationCap className="w-4 h-4 text-white" />}
              </div>
              <div className="hidden sm:block min-w-0">
                <div className="text-sm font-bold text-gray-900 truncate max-w-[180px]">{school?.name || 'School'}</div>
                <div className="text-[10px] text-gray-500 -mt-0.5">Trial · 90d</div>
              </div>
            </div>
          </div>

          {/* Right: search + bell + profile */}
          <div className="flex items-center gap-1 sm:gap-2">
            <button className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-md" title="Search">
              <Search className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-md relative" title="Notifications">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-error rounded-full" />
            </button>

            {/* Profile menu */}
            <div className="relative ml-1" data-profile-menu>
              <button
                onClick={(e) => { e.stopPropagation(); setProfileOpen(!profileOpen); }}
                className="flex items-center gap-2 p-1 hover:bg-gray-100 rounded-lg"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                  {userInitials}
                </div>
                <ChevronDown className="w-3 h-3 text-gray-500 hidden sm:block" />
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden z-50">
                  <div className="p-4 bg-gradient-to-br from-indigo-50 to-white border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white text-sm font-bold">
                        {userInitials}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-gray-900 truncate">{user?.full_name || user?.email}</div>
                        <div className="text-xs text-gray-500 truncate">{user?.email}</div>
                      </div>
                    </div>
                  </div>
                  <div className="p-1">
                    <Link href="/dashboard/me" className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md">
                      <UserIcon className="w-4 h-4 text-gray-400" />
                      My profile
                    </Link>
                    <Link href="/dashboard/me/password" className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md">
                      <KeyRound className="w-4 h-4 text-gray-400" />
                      Change password
                    </Link>
                    <Link href="/dashboard/me/preferences" className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md">
                      <Palette className="w-4 h-4 text-gray-400" />
                      Preferences
                    </Link>
                  </div>
                  <div className="border-t border-gray-100 p-1">
                    <button onClick={handleSignOut}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-error hover:bg-red-50 rounded-md">
                      <LogOut className="w-4 h-4" />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ===== SIDEBAR (desktop drawer / mobile drawer) ===== */}
      {sidebarOpen && (
        <>
          <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm" />
          <aside className="fixed top-0 left-0 h-full w-72 bg-white z-50 shadow-2xl overflow-y-auto">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center flex-shrink-0">
                  {school?.logo_url
                    ? <img src={school.logo_url} className="w-full h-full rounded-lg object-cover" alt="" />
                    : <GraduationCap className="w-5 h-5 text-white" />}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-gray-900 truncate">{school?.name || 'School'}</div>
                  <div className="text-[10px] text-gray-500 -mt-0.5">Trial · 90d</div>
                </div>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md">
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="p-3 space-y-4">
              {sidebarGroups.map(group => (
                <div key={group.label}>
                  <div className="px-2 mb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                    {group.label}
                  </div>
                  <div className="space-y-0.5">
                    {group.items.map(item => {
                      const active = isActive(item.href);
                      return (
                        <Link key={item.href} href={item.href}
                          className={`flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-colors ${
                            active
                              ? 'bg-indigo-50 text-indigo font-medium'
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}>
                          <item.icon className={`w-4 h-4 ${active ? 'text-indigo' : 'text-gray-400'}`} />
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </aside>
        </>
      )}

      {/* ===== MAIN CONTENT ===== */}
      <main className="pb-20 lg:pb-8">
        {children}
      </main>

      {/* ===== BOTTOM NAV (mobile) ===== */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 shadow-lg">
        <div className="grid grid-cols-5 h-16">
          {bottomNav.map(item => {
            const active = isActive(item.href);
            return (
              <Link key={item.href} href={item.href}
                className={`flex flex-col items-center justify-center gap-0.5 relative ${
                  active ? 'text-indigo' : 'text-gray-500'
                }`}>
                {active && <div className="absolute top-0 left-1/4 right-1/4 h-0.5 bg-indigo rounded-full" />}
                <item.icon className={`w-5 h-5 ${active ? 'stroke-[2.5]' : ''}`} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
          {/* More button */}
          <button onClick={() => setMoreOpen(true)}
            className={`flex flex-col items-center justify-center gap-0.5 relative ${
              moreOpen ? 'text-indigo' : 'text-gray-500'
            }`}>
            <MoreHorizontal className="w-5 h-5" />
            <span className="text-[10px] font-medium">More</span>
          </button>
        </div>
      </nav>

      {/* ===== MORE BOTTOM SHEET ===== */}
      {moreOpen && (
        <>
          <div onClick={() => setMoreOpen(false)} className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm lg:hidden" />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl lg:hidden max-h-[80vh] overflow-y-auto animate-slide-in-top">
            <div className="sticky top-0 bg-white px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">More options</h3>
                <p className="text-xs text-gray-500">Access other parts of your school</p>
              </div>
              <button onClick={() => setMoreOpen(false)} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-5 pb-8">
              {moreItems.map(group => (
                <div key={group.label}>
                  <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">
                    {group.label}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {group.items.map(item => (
                      <Link key={item.href} href={item.href}
                        className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors">
                        <div className={`w-9 h-9 ${item.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                          <item.icon className={`w-4 h-4 ${item.color}`} />
                        </div>
                        <span className="text-sm font-medium text-gray-900 truncate">{item.label}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}