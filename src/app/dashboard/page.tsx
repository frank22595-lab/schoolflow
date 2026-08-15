import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import {
  Users, GraduationCap, Wallet, ClipboardCheck,
  TrendingUp, TrendingDown, ArrowRight, ArrowUpRight,
  Plus, Send, FileText, UserPlus, Calendar, Sparkles,
  CheckCircle2, Circle, Clock, AlertCircle,
  MoreHorizontal, Activity, Zap,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from('users')
    .select('*, schools(*)')
    .eq('id', user!.id)
    .single();

  const school = profile?.schools;
  const trialDaysLeft = school?.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(school.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  // Sample sparkline data (will be replaced with real data as modules build out)
  const spark1 = [12, 15, 13, 17, 20, 18, 22, 25, 23, 27, 30, 28];
  const spark2 = [45, 48, 46, 50, 52, 49, 55, 58, 56, 60, 62, 65];
  const spark3 = [88, 90, 87, 92, 91, 94, 93, 95, 92, 96, 94, 97];
  const spark4 = [3, 5, 4, 7, 6, 8, 5, 9, 7, 6, 8, 10];

  const metrics = [
    {
      label: 'Total students',
      value: '0',
      change: null,
      trend: 'up',
      icon: GraduationCap,
      accent: 'from-indigo-500 to-indigo-600',
      iconBg: 'bg-indigo-50',
      iconColor: 'text-indigo',
      sparkColor: '#3B4CCA',
      sparkData: spark1,
      helpText: 'Add students to get started',
    },
    {
      label: 'Fee collection',
      value: formatCurrency(0),
      change: null,
      trend: 'up',
      icon: Wallet,
      accent: 'from-emerald-500 to-emerald-600',
      iconBg: 'bg-emerald-50',
      iconColor: 'text-success',
      sparkColor: '#10B981',
      sparkData: spark2,
      helpText: 'No payments recorded yet',
    },
    {
      label: "Today's attendance",
      value: '—',
      change: null,
      trend: 'up',
      icon: ClipboardCheck,
      accent: 'from-sky-500 to-sky-600',
      iconBg: 'bg-sky-50',
      iconColor: 'text-info',
      sparkColor: '#0EA5E9',
      sparkData: spark3,
      helpText: 'No attendance marked today',
    },
    {
      label: 'Staff members',
      value: '1',
      change: null,
      trend: 'up',
      icon: Users,
      accent: 'from-amber-500 to-amber-600',
      iconBg: 'bg-amber-50',
      iconColor: 'text-warning',
      sparkColor: '#F59E0B',
      sparkData: spark4,
      helpText: 'Just you for now',
    },
  ];

  const onboardingSteps = [
    { label: 'Upload school logo and set branding', href: '/dashboard/settings', done: false, time: '2 min' },
    { label: 'Configure academic calendar', href: '/dashboard/settings/academic', done: false, time: '5 min' },
    { label: 'Add class levels and sections', href: '/dashboard/settings/classes', done: false, time: '10 min' },
    { label: 'Set up subjects and grading scale', href: '/dashboard/settings/subjects', done: false, time: '10 min' },
    { label: 'Configure fee heads and structures', href: '/dashboard/fees/setup', done: false, time: '15 min' },
    { label: 'Import students and invite staff', href: '/dashboard/students/import', done: false, time: '20 min' },
  ];

  const completedCount = onboardingSteps.filter(s => s.done).length;
  const progressPercent = Math.round((completedCount / onboardingSteps.length) * 100);

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-6">
      {/* ============ HEADER ============ */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <span>Dashboard</span>
            <span className="text-gray-300">/</span>
            <span>Overview</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {profile?.first_name}
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Here's what's happening at {school?.name} today.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary text-sm">
            <Calendar className="w-4 h-4 mr-2" />
            This term
          </button>
          <button className="btn-primary text-sm">
            <Plus className="w-4 h-4 mr-2" />
            Quick add
          </button>
        </div>
      </div>

      {/* ============ TRIAL BANNER ============ */}
      {school?.status === 'trial' && (
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-indigo-500 via-indigo to-indigo-dark p-6 text-white shadow-lg">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-lg flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <div className="font-semibold text-lg">You're on your free trial</div>
                <div className="text-sm text-white/80 mt-0.5">
                  {trialDaysLeft} days remaining · All features unlocked · No credit card needed
                </div>
              </div>
            </div>
            <Link
              href="/dashboard/settings/subscription"
              className="flex items-center gap-2 px-4 py-2 bg-white text-indigo-dark rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
            >
              Manage plan
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* ============ METRICS GRID ============ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m, i) => (
          <div
            key={i}
            className="group relative bg-white rounded-xl border border-gray-200 p-5 hover:border-gray-300 hover:shadow-md transition-all overflow-hidden"
          >
            {/* Gradient accent line at top */}
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${m.accent} opacity-60 group-hover:opacity-100 transition-opacity`} />

            {/* Header row */}
            <div className="flex items-start justify-between mb-4">
              <div className={`w-10 h-10 rounded-lg ${m.iconBg} flex items-center justify-center`}>
                <m.icon className={`w-5 h-5 ${m.iconColor}`} />
              </div>
              <button className="p-1 text-gray-400 hover:text-gray-600 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>

            {/* Number + change */}
            <div className="mb-3">
              <div className="text-3xl font-bold text-gray-900 tracking-tight">{m.value}</div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-gray-500">{m.label}</span>
                {m.change !== null && (
                  <span className={`flex items-center gap-0.5 text-xs font-medium ${
                    m.trend === 'up' ? 'text-success' : 'text-error'
                  }`}>
                    {m.trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {Math.abs(m.change)}%
                  </span>
                )}
              </div>
            </div>

            {/* Sparkline placeholder (will be real chart when data flows) */}
            <div className="h-10 flex items-end gap-0.5 opacity-40 group-hover:opacity-60 transition-opacity">
              {m.sparkData.map((v, j) => (
                <div
                  key={j}
                  className="flex-1 rounded-t"
                  style={{
                    height: `${(v / Math.max(...m.sparkData)) * 100}%`,
                    backgroundColor: m.sparkColor,
                    minHeight: '3px',
                  }}
                />
              ))}
            </div>

            {/* Empty state hint */}
            <div className="text-xs text-gray-400 mt-2 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {m.helpText}
            </div>
          </div>
        ))}
      </div>

      {/* ============ ONBOARDING PROGRESS ============ */}
      {!school?.onboarding_completed && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo to-indigo-dark rounded-lg flex items-center justify-center">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Get your school ready</h2>
              </div>
              <p className="text-sm text-gray-500 mt-1 ml-10">
                Complete these steps to unlock the full power of SchoolFlow
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">
                {completedCount}<span className="text-gray-400 text-lg">/{onboardingSteps.length}</span>
              </div>
              <div className="text-xs text-gray-500">completed</div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-6">
            <div
              className="h-full bg-gradient-to-r from-indigo to-indigo-dark rounded-full transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Steps */}
          <div className="space-y-1.5">
            {onboardingSteps.map((step, i) => (
              <Link
                key={i}
                href={step.href}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <div className="flex-shrink-0">
                  {step.done ? (
                    <CheckCircle2 className="w-5 h-5 text-success" />
                  ) : (
                    <Circle className="w-5 h-5 text-gray-300 group-hover:text-indigo transition-colors" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm ${step.done ? 'text-gray-500 line-through' : 'text-gray-900 font-medium'}`}>
                    {step.label}
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {step.time}
                  </span>
                  <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-indigo group-hover:translate-x-0.5 transition-all" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ============ MAIN CHART + QUICK ACTIONS ============ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Big chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Fee collection trend</h2>
              <p className="text-sm text-gray-500 mt-0.5">Term-to-date collection performance</p>
            </div>
            <div className="flex items-center gap-1 p-0.5 bg-gray-100 rounded-lg">
              {['Week', 'Month', 'Term'].map((period, i) => (
                <button
                  key={period}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    i === 2 ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>

          {/* Chart empty state */}
          <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg">
            <div className="text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Activity className="w-6 h-6 text-gray-400" />
              </div>
              <div className="text-sm font-medium text-gray-900 mb-1">No collection data yet</div>
              <div className="text-xs text-gray-500 mb-4">
                Record your first payment to see charts here
              </div>
              <Link href="/dashboard/fees/setup" className="text-xs text-indigo font-medium hover:underline">
                Set up fees →
              </Link>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Quick actions</h2>
            <p className="text-sm text-gray-500 mt-0.5">Common tasks</p>
          </div>
          <div className="space-y-2">
            {[
              { label: 'Add a student', desc: 'Enroll a new student', icon: UserPlus, href: '/dashboard/students/new', accent: 'bg-indigo-50 text-indigo' },
              { label: 'Record payment', desc: 'Log a confirmed payment', icon: Wallet, href: '/dashboard/fees/record', accent: 'bg-emerald-50 text-success' },
              { label: 'Send announcement', desc: 'Notify parents & staff', icon: Send, href: '/dashboard/communication/new', accent: 'bg-sky-50 text-info' },
              { label: 'View reports', desc: 'See analytics & exports', icon: FileText, href: '/dashboard/reports', accent: 'bg-amber-50 text-warning' },
            ].map((action, i) => (
              <Link
                key={i}
                href={action.href}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group border border-transparent hover:border-gray-200"
              >
                <div className={`w-9 h-9 rounded-lg ${action.accent} flex items-center justify-center flex-shrink-0`}>
                  <action.icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900">{action.label}</div>
                  <div className="text-xs text-gray-500">{action.desc}</div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-indigo transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ============ ACTIVITY + RECENT STUDENTS ============ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity feed */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Recent activity</h2>
              <p className="text-sm text-gray-500 mt-0.5">Everything happening across your school</p>
            </div>
            <Link href="/dashboard/activity" className="text-sm text-indigo font-medium hover:underline">
              View all
            </Link>
          </div>

          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-full flex items-center justify-center mb-4">
              <Activity className="w-8 h-8 text-indigo" />
            </div>
            <div className="text-sm font-semibold text-gray-900 mb-1">No activity yet</div>
            <div className="text-xs text-gray-500 max-w-xs">
              As your team uses SchoolFlow, activities will appear here in real-time.
            </div>
          </div>
        </div>

        {/* Getting started tips */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-indigo/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
          <div className="relative">
            <div className="w-10 h-10 bg-white/10 backdrop-blur rounded-lg flex items-center justify-center mb-4">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-lg mb-2">New to SchoolFlow?</h3>
            <p className="text-sm text-white/70 mb-4 leading-relaxed">
              Watch our 5-minute video tour to see how everything works.
            </p>
            <button className="w-full px-4 py-2 bg-white text-gray-900 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors">
              Watch tour
            </button>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <a href="#" className="text-center px-3 py-2 bg-white/10 backdrop-blur rounded-lg text-xs hover:bg-white/20 transition-colors">
                Help docs
              </a>
              <a href="#" className="text-center px-3 py-2 bg-white/10 backdrop-blur rounded-lg text-xs hover:bg-white/20 transition-colors">
                WhatsApp us
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
