'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Search, Filter, X, Receipt, Sparkles, AlertCircle,
  ArrowRight, User, Calendar,
} from 'lucide-react';

const fmt = (n: number) => '₦' + Number(n).toLocaleString('en-NG', { maximumFractionDigits: 0 });

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  paid: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Paid' },
  partial: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'Partial' },
  unpaid: { bg: 'bg-red-50', text: 'text-red-700', label: 'Unpaid' },
  overdue: { bg: 'bg-red-100', text: 'text-red-800', label: 'Overdue' },
  cancelled: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Cancelled' },
};

interface Props {
  invoices: any[];
  sessions: any[];
  terms: any[];
}

export default function InvoicesListClient({ invoices, sessions, terms }: Props) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sessionFilter, setSessionFilter] = useState('all');
  const [termFilter, setTermFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    return invoices.filter(inv => {
      if (statusFilter !== 'all' && inv.status !== statusFilter) return false;
      if (sessionFilter !== 'all' && inv.session_id !== sessionFilter) return false;
      if (termFilter !== 'all' && inv.term_id !== termFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!inv.student_name.toLowerCase().includes(q) &&
            !inv.invoice_number.toLowerCase().includes(q) &&
            !inv.student_admission_number.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [invoices, search, statusFilter, sessionFilter, termFilter]);

  const totals = useMemo(() => ({
    invoiced: filtered.reduce((s, i) => s + Number(i.total), 0),
    collected: filtered.reduce((s, i) => s + Number(i.paid_total), 0),
    outstanding: filtered.reduce((s, i) => s + Number(i.balance), 0),
  }), [filtered]);

  if (invoices.length === 0) {
    return (
      <div className="bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 rounded-xl p-6 lg:p-8">
        <div className="max-w-lg">
          <div className="w-12 h-12 bg-indigo rounded-xl flex items-center justify-center mb-4">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No invoices yet</h3>
          <p className="text-sm text-gray-600 mb-5">
            Generate invoices to bill your students for the current term.
          </p>
          <Link href="/dashboard/fees/generate" className="btn-primary text-sm">
            Generate first invoices
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
          <div className="text-[10px] uppercase text-gray-500 font-semibold">Invoiced</div>
          <div className="text-lg font-bold text-gray-900">{fmt(totals.invoiced)}</div>
        </div>
        <div className="bg-white rounded-lg border border-emerald-200 p-3 shadow-sm">
          <div className="text-[10px] uppercase text-emerald-600 font-semibold">Collected</div>
          <div className="text-lg font-bold text-emerald-700">{fmt(totals.collected)}</div>
        </div>
        <div className="bg-white rounded-lg border border-red-200 p-3 shadow-sm">
          <div className="text-[10px] uppercase text-red-600 font-semibold">Outstanding</div>
          <div className="text-lg font-bold text-error">{fmt(totals.outstanding)}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-3 lg:p-4 flex gap-2">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search by student, invoice #, admission #..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo focus:bg-white"
              value={search} onChange={(e) => setSearch(e.target.value)} />
            {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"><X className="w-3.5 h-3.5" /></button>}
          </div>
          <button onClick={() => setShowFilters(!showFilters)} className="btn-secondary text-sm">
            <Filter className="w-4 h-4 mr-1.5" />
            Filters
          </button>
        </div>
        {showFilters && (
          <div className="border-t border-gray-100 p-3 lg:p-4 bg-gray-50/50 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="label text-xs">Status</label>
              <select className="input text-sm py-1.5" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All statuses</option>
                {Object.entries(STATUS_STYLES).map(([v, s]) => <option key={v} value={v}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label text-xs">Session</label>
              <select className="input text-sm py-1.5" value={sessionFilter} onChange={(e) => setSessionFilter(e.target.value)}>
                <option value="all">All sessions</option>
                {sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label text-xs">Term</label>
              <select className="input text-sm py-1.5" value={termFilter} onChange={(e) => setTermFilter(e.target.value)}>
                <option value="all">All terms</option>
                {terms.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-500 px-1">Showing <strong>{filtered.length}</strong> of {invoices.length}</p>

      {/* List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="hidden sm:grid grid-cols-12 gap-3 px-4 py-3 bg-gray-50 border-b border-gray-200 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
          <div className="col-span-3">Invoice #</div>
          <div className="col-span-3">Student</div>
          <div className="col-span-2">Class</div>
          <div className="col-span-2 text-right">Total / Paid</div>
          <div className="col-span-1 text-right">Balance</div>
          <div className="col-span-1 text-right">Status</div>
        </div>
        <div className="divide-y divide-gray-100">
          {filtered.map(inv => {
            const status = STATUS_STYLES[inv.status];
            return (
              <Link key={inv.id} href={`/dashboard/fees/invoices/${inv.id}`}
                className="p-3 lg:p-4 hover:bg-gray-50 transition-colors sm:grid sm:grid-cols-12 sm:gap-3 sm:items-center block">
                <div className="col-span-3">
                  <div className="font-mono text-xs font-semibold text-gray-900">{inv.invoice_number}</div>
                  <div className="text-[10px] text-gray-500 flex items-center gap-1 mt-0.5"><Calendar className="w-2.5 h-2.5" />{new Date(inv.invoice_date).toLocaleDateString('en-GB')}</div>
                </div>
                <div className="col-span-3 flex items-center gap-2 mt-2 sm:mt-0">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white text-[10px] font-semibold flex-shrink-0">
                    {inv.student_name.split(' ').map((n: string) => n[0]).slice(0, 2).join('')}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{inv.student_name}</div>
                    <div className="text-[10px] text-gray-500 truncate">{inv.student_admission_number}</div>
                  </div>
                </div>
                <div className="col-span-2 text-xs text-gray-600 hidden sm:block">
                  {inv.class_name}{inv.section_name && inv.section_name !== inv.class_name ? ` ${inv.section_name}` : ''}
                </div>
                <div className="col-span-2 text-right hidden sm:block">
                  <div className="text-sm font-semibold text-gray-900">{fmt(inv.total)}</div>
                  <div className="text-[10px] text-emerald-700">{fmt(inv.paid_total)} paid</div>
                </div>
                <div className="col-span-1 text-right hidden sm:block">
                  <span className={`text-sm font-bold ${Number(inv.balance) > 0 ? 'text-error' : 'text-emerald-700'}`}>{fmt(inv.balance)}</span>
                </div>
                <div className="col-span-1 text-right sm:text-right">
                  <span className={`inline-flex px-2 py-0.5 ${status?.bg} ${status?.text} text-[10px] font-semibold rounded-full`}>
                    {status?.label}
                  </span>
                </div>
              </Link>
            );
          })}
          {filtered.length === 0 && (
            <div className="p-8 text-center text-sm text-gray-500">No invoices match</div>
          )}
        </div>
      </div>
    </div>
  );
}
