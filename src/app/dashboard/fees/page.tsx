import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import {
  Wallet, Settings, ArrowRight, TrendingUp, TrendingDown,
  Receipt, Users, Sparkles, DollarSign, ClipboardList, BarChart3,
} from 'lucide-react';

export default async function FeesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('users').select('school_id').eq('id', user!.id).single();

  const [{ data: feeHeads }, { data: structures }, { data: banks }, { data: currentSession }, { data: currentTerm }] = await Promise.all([
    supabase.from('fee_heads').select('*').eq('school_id', profile!.school_id).eq('is_active', true),
    supabase.from('fee_structures').select('*').eq('school_id', profile!.school_id),
    supabase.from('bank_accounts').select('*').eq('school_id', profile!.school_id).eq('is_active', true),
    supabase.from('sessions').select('*').eq('school_id', profile!.school_id).eq('is_current', true).maybeSingle(),
    supabase.from('terms').select('*').eq('school_id', profile!.school_id).eq('is_current', true).maybeSingle(),
  ]);

  const setupComplete = (feeHeads?.length || 0) > 0 && (structures?.length || 0) > 0 && (banks?.length || 0) > 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/dashboard" className="hover:text-indigo">Dashboard</Link>
          <span className="text-gray-300">/</span>
          <span>Fees</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Fees</h1>
            <p className="text-gray-500 mt-1 text-sm">
              {currentTerm ? `Current: ${currentTerm.name}` : 'No current term set'} · Manage fee heads, structures, and payments
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/dashboard/fees/setup" className="btn-secondary text-sm">
              <Settings className="w-4 h-4 mr-1.5" />
              Setup
            </Link>
            <Link href="/dashboard/fees/invoices" className="btn-primary text-sm">
              <Receipt className="w-4 h-4 mr-1.5" />
              View invoices
            </Link>
          </div>
        </div>
      </div>

      {/* Setup nudge if not done */}
      {!setupComplete && (
        <div className="bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 rounded-xl p-4 lg:p-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-indigo rounded-lg flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">Complete fee setup before you can bill students</h3>
              <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                Set up fee heads, structures per class, and your bank account so invoices know what to charge and where to receive money.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <SetupStep done={(feeHeads?.length || 0) > 0} label="Fee heads" count={feeHeads?.length || 0} />
                <SetupStep done={(structures?.length || 0) > 0} label="Fee structures" count={structures?.length || 0} />
                <SetupStep done={(banks?.length || 0) > 0} label="Bank accounts" count={banks?.length || 0} />
              </div>
              <Link href="/dashboard/fees/setup" className="btn-primary text-sm mt-4 inline-flex">
                Complete setup
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Expected this term" value="₦0" icon={DollarSign} color="from-indigo-500 to-indigo-600" iconBg="bg-indigo-50" iconColor="text-indigo" />
        <StatCard label="Collected" value="₦0" icon={TrendingUp} color="from-emerald-500 to-emerald-600" iconBg="bg-emerald-50" iconColor="text-success" />
        <StatCard label="Outstanding" value="₦0" icon={TrendingDown} color="from-red-500 to-red-600" iconBg="bg-red-50" iconColor="text-error" />
        <StatCard label="Students billed" value="0" icon={Users} color="from-sky-500 to-sky-600" iconBg="bg-sky-50" iconColor="text-info" />
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">Quick actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <ActionCard
            href="/dashboard/fees/invoices"
            icon={Receipt}
            title="Invoices"
            desc="View and manage all student invoices"
            accent="from-indigo-500 to-indigo-600"
            iconBg="bg-indigo-50"
            iconColor="text-indigo"
          />
          <ActionCard
            href="/dashboard/fees/payments"
            icon={Wallet}
            title="Record payment"
            desc="Log a cash, transfer, or POS payment"
            accent="from-emerald-500 to-emerald-600"
            iconBg="bg-emerald-50"
            iconColor="text-success"
          />
          <ActionCard
            href="/dashboard/fees/receipts"
            icon={ClipboardList}
            title="Receipts"
            desc="View, print, or resend receipts"
            accent="from-sky-500 to-sky-600"
            iconBg="bg-sky-50"
            iconColor="text-info"
          />
          <ActionCard
            href="/dashboard/fees/setup"
            icon={Settings}
            title="Fee setup"
            desc="Fee heads, structures, discounts, bank accounts"
            accent="from-amber-500 to-amber-600"
            iconBg="bg-amber-50"
            iconColor="text-warning"
          />
          <ActionCard
            href="/dashboard/fees/reports"
            icon={BarChart3}
            title="Reports"
            desc="Collections, arrears, defaulters"
            accent="from-purple-500 to-purple-600"
            iconBg="bg-purple-50"
            iconColor="text-purple-600"
          />
          <ActionCard
            href="/dashboard/fees/generate"
            icon={Sparkles}
            title="Generate invoices"
            desc="Create term invoices for all students"
            accent="from-indigo-500 to-indigo-600"
            iconBg="bg-indigo-50"
            iconColor="text-indigo"
          />
        </div>
      </div>
    </div>
  );
}

function SetupStep({ done, label, count }: { done: boolean; label: string; count: number }) {
  return (
    <div className={`p-3 rounded-lg border ${done ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-gray-200'}`}>
      <div className="flex items-center gap-2">
        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${done ? 'bg-success text-white' : 'border-2 border-gray-300'}`}>
          {done && <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5"><path fillRule="evenodd" d="M16.7 5.7a1 1 0 010 1.4l-8 8a1 1 0 01-1.4 0l-4-4a1 1 0 111.4-1.4L8 13l7.3-7.3a1 1 0 011.4 0z" /></svg>}
        </div>
        <div className="text-xs font-medium text-gray-900">{label}</div>
      </div>
      {done && <div className="text-[10px] text-emerald-700 mt-1 ml-8">{count} added</div>}
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color, iconBg, iconColor }: any) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 relative overflow-hidden">
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${color}`} />
      <div className={`w-8 h-8 ${iconBg} rounded-lg flex items-center justify-center mb-2`}>
        <Icon className={`w-4 h-4 ${iconColor}`} />
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
    </div>
  );
}

function ActionCard({ href, icon: Icon, title, desc, accent, iconBg, iconColor }: any) {
  return (
    <Link href={href} className="group relative bg-white rounded-xl border border-gray-200 p-4 lg:p-5 hover:border-gray-300 hover:shadow-md transition-all overflow-hidden">
      <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${accent} opacity-0 group-hover:opacity-100 transition-opacity`} />
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 text-sm mb-0.5">{title}</h3>
          <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
        </div>
        <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-indigo group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-1" />
      </div>
    </Link>
  );
}
