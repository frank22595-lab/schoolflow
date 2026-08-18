'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Printer, Download, MessageCircle, Plus, Landmark,
  Loader2, AlertCircle, CheckCircle2, X, Receipt, Ban,
  Building2, Calendar, User, Copy, MoreHorizontal,
} from 'lucide-react';

const fmt = (n: number) => '₦' + Number(n).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

interface Props {
  invoice: any;
  lines: any[];
  payments: any[];
  banks: any[];
  school: any;
  schoolId: string;
}

export default function InvoiceDetailClient({ invoice, lines, payments, banks, school, schoolId }: Props) {
  const router = useRouter();
  const [payModal, setPayModal] = useState(false);
  const [voidConfirm, setVoidConfirm] = useState<any>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  function showToast(t: 'success' | 'error', m: string) {
    setToast({ type: t, message: m });
    setTimeout(() => setToast(null), 3500);
  }

  const primaryBank = banks.find(b => b.is_primary) || banks[0];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6 print:p-0 print:max-w-full">
      {/* Header (hidden on print) */}
      <div className="flex items-center justify-between print:hidden">
        <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500">
          <Link href="/dashboard" className="hover:text-indigo">Dashboard</Link>
          <span className="text-gray-300">/</span>
          <Link href="/dashboard/fees" className="hover:text-indigo">Fees</Link>
          <span className="text-gray-300">/</span>
          <Link href="/dashboard/fees/invoices" className="hover:text-indigo">Invoices</Link>
          <span className="text-gray-300">/</span>
          <span className="text-gray-900 font-mono text-xs">{invoice.invoice_number}</span>
        </div>
        <Link href="/dashboard/fees/invoices" className="sm:hidden flex items-center gap-1 text-sm text-indigo">
          <ArrowLeft className="w-4 h-4" />Back
        </Link>
      </div>

      {/* Action bar */}
      <div className="flex flex-wrap gap-2 print:hidden">
        {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
          <button onClick={() => setPayModal(true)} className="btn-primary text-sm">
            <Plus className="w-4 h-4 mr-1.5" />
            Record payment
          </button>
        )}
        <button onClick={() => window.print()} className="btn-secondary text-sm">
          <Printer className="w-4 h-4 mr-1.5" />
          Print
        </button>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(`Invoice ${invoice.invoice_number} for ${invoice.student_name}\nAmount: ${fmt(invoice.total)}\nBalance: ${fmt(invoice.balance)}`)}`}
          target="_blank" rel="noopener noreferrer"
          className="btn-secondary text-sm">
          <MessageCircle className="w-4 h-4 mr-1.5" />
          Share on WhatsApp
        </a>
      </div>

      {/* THE INVOICE - printable */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm print:shadow-none print:border-0 print:rounded-none">
        {/* Invoice header */}
        <div className="p-6 lg:p-8 border-b border-gray-200 flex flex-col sm:flex-row items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center flex-shrink-0">
              {school?.logo_url
                ? <img src={school.logo_url} alt="" className="w-full h-full rounded-xl object-cover" />
                : <Building2 className="w-7 h-7 text-white" />}
            </div>
            <div>
              <div className="font-bold text-xl text-gray-900">{school?.name || 'School'}</div>
              <div className="text-xs text-gray-500">{school?.address || ''}</div>
              <div className="text-xs text-gray-500">{school?.phone || ''} · {school?.email || ''}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs uppercase text-gray-500 font-semibold">Invoice</div>
            <div className="font-mono text-lg font-bold text-gray-900">{invoice.invoice_number}</div>
            <div className="text-xs text-gray-500 mt-1">
              <Calendar className="w-3 h-3 inline mr-1" />
              {new Date(invoice.invoice_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
            <div className="mt-2">
              <StatusBadge status={invoice.status} />
            </div>
          </div>
        </div>

        {/* Billed to */}
        <div className="p-6 lg:p-8 border-b border-gray-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="text-[10px] uppercase text-gray-500 font-semibold mb-2">Billed to</div>
            <div className="font-semibold text-gray-900">{invoice.student_name}</div>
            <div className="text-sm text-gray-600 mt-0.5">{invoice.student_admission_number}</div>
            <div className="text-xs text-gray-500 mt-1">
              {invoice.class_name}{invoice.section_name && invoice.section_name !== invoice.class_name ? ` · ${invoice.section_name}` : ''}
            </div>
          </div>
          {invoice.due_date && (
            <div className="sm:text-right">
              <div className="text-[10px] uppercase text-gray-500 font-semibold mb-2">Due date</div>
              <div className="font-semibold text-gray-900">{new Date(invoice.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
            </div>
          )}
        </div>

        {/* Lines */}
        <div className="p-6 lg:p-8">
          <table className="w-full">
            <thead>
              <tr className="text-[10px] uppercase text-gray-500 font-semibold border-b border-gray-200">
                <th className="text-left py-2 pr-2">Item</th>
                <th className="text-right py-2 px-2">Amount</th>
                <th className="text-right py-2 pl-2">Discount</th>
                <th className="text-right py-2 pl-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {lines.map(l => (
                <tr key={l.id} className="border-b border-gray-100 last:border-0">
                  <td className="py-3 pr-2 text-sm text-gray-900">{l.description}</td>
                  <td className="py-3 px-2 text-sm text-gray-900 text-right font-mono">{fmt(l.amount)}</td>
                  <td className="py-3 pl-2 text-sm text-gray-500 text-right font-mono">{Number(l.discount_amount) > 0 ? '-' + fmt(l.discount_amount) : '—'}</td>
                  <td className="py-3 pl-2 text-sm font-semibold text-gray-900 text-right font-mono">{fmt(l.line_total)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-6 flex justify-end">
            <div className="w-full sm:w-64 space-y-1">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span><span className="font-mono">{fmt(invoice.subtotal)}</span>
              </div>
              {Number(invoice.discount_total) > 0 && (
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Discount</span><span className="font-mono">-{fmt(invoice.discount_total)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg text-gray-900 py-2 border-y border-gray-200">
                <span>Total</span><span className="font-mono">{fmt(invoice.total)}</span>
              </div>
              <div className="flex justify-between text-sm text-emerald-700">
                <span>Paid</span><span className="font-mono">{fmt(invoice.paid_total)}</span>
              </div>
              <div className={`flex justify-between text-base font-bold ${Number(invoice.balance) > 0 ? 'text-error' : 'text-emerald-700'}`}>
                <span>Balance</span><span className="font-mono">{fmt(invoice.balance)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment instructions */}
        {primaryBank && Number(invoice.balance) > 0 && (
          <div className="p-6 lg:p-8 bg-gradient-to-br from-indigo-50 to-white border-t border-gray-200">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-indigo rounded-lg flex items-center justify-center flex-shrink-0">
                <Landmark className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <div className="text-xs uppercase text-indigo-dark font-semibold">Pay to</div>
                <div className="font-bold text-gray-900 mt-0.5">{primaryBank.bank_name}</div>
                <div className="text-sm text-gray-600">{primaryBank.account_name}</div>
                <div className="font-mono text-xl font-bold text-gray-900 tracking-wider mt-1">{primaryBank.account_number}</div>
                <p className="text-xs text-gray-500 mt-2">Use invoice number <span className="font-mono font-semibold">{invoice.invoice_number}</span> as payment reference</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Payments history */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 lg:p-6 print:hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-emerald-50 rounded-md flex items-center justify-center">
              <Receipt className="w-4 h-4 text-emerald-700" />
            </div>
            <h3 className="font-semibold text-gray-900">Payments ({payments.length})</h3>
          </div>
        </div>
        {payments.length === 0 ? (
          <div className="text-center py-6 text-sm text-gray-500">No payments recorded yet</div>
        ) : (
          <div className="space-y-2">
            {payments.map(p => (
              <div key={p.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-xs text-gray-500">{p.receipt_number}</div>
                  <div className="text-sm text-gray-900">
                    <span className="capitalize">{p.method.replace('_', ' ')}</span>
                    {p.reference && ` · ${p.reference}`}
                  </div>
                  <div className="text-[10px] text-gray-500">{new Date(p.payment_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-emerald-700">{fmt(p.amount)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payment modal */}
      {payModal && (
        <PaymentModal invoice={invoice} banks={banks} schoolId={schoolId}
          onClose={() => setPayModal(false)}
          onSaved={() => { setPayModal(false); router.refresh(); showToast('success', 'Payment recorded'); }}
          onError={(m: string) => showToast('error', m)} />
      )}

      {toast && (
        <div className={`fixed bottom-20 lg:bottom-6 right-4 left-4 sm:left-auto z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg print:hidden ${
          toast.type === 'success' ? 'bg-success text-white' : 'bg-error text-white'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    partial: 'bg-amber-50 text-amber-700 border-amber-200',
    unpaid: 'bg-red-50 text-red-700 border-red-200',
    overdue: 'bg-red-100 text-red-800 border-red-300',
    cancelled: 'bg-gray-100 text-gray-600 border-gray-200',
  };
  return (
    <span className={`inline-flex px-3 py-1 border text-xs font-semibold rounded-full capitalize ${styles[status] || styles.unpaid}`}>
      {status}
    </span>
  );
}

function PaymentModal({ invoice, banks, schoolId, onClose, onSaved, onError }: any) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    amount: invoice.balance,
    payment_date: new Date().toISOString().slice(0, 10),
    method: 'bank_transfer',
    reference: '',
    bank_account_id: banks.find((b: any) => b.is_primary)?.id || banks[0]?.id || '',
    paid_by: '',
    received_by: '',
    notes: '',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/fees/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolId,
          invoiceId: invoice.id,
          studentId: invoice.student_id,
          payment: {
            ...form,
            amount: parseFloat(form.amount.toString()),
            bank_account_id: form.bank_account_id || null,
            reference: form.reference || null,
            paid_by: form.paid_by || null,
            received_by: form.received_by || null,
            notes: form.notes || null,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onSaved();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed');
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="bg-white sm:rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white">
          <div>
            <h3 className="font-semibold text-gray-900">Record payment</h3>
            <p className="text-xs text-gray-500 mt-0.5">For invoice {invoice.invoice_number}</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5 text-gray-500" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="p-3 bg-indigo-50 rounded-lg text-center">
            <div className="text-xs text-indigo-dark uppercase font-semibold">Outstanding balance</div>
            <div className="text-2xl font-bold text-indigo-dark mt-1 font-mono">{fmt(invoice.balance)}</div>
          </div>

          <div>
            <label className="label">Amount received (₦) *</label>
            <input type="number" required min="0" step="0.01" max={invoice.balance}
              className="input font-mono text-xl text-center"
              value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Date *</label>
              <input type="date" required className="input"
                value={form.payment_date} onChange={(e) => setForm({ ...form, payment_date: e.target.value })} />
            </div>
            <div>
              <label className="label">Method *</label>
              <select required className="input" value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}>
                <option value="cash">Cash</option>
                <option value="bank_transfer">Bank transfer</option>
                <option value="pos">POS</option>
                <option value="cheque">Cheque</option>
                <option value="online">Online / card</option>
                <option value="mobile_money">Mobile money</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {form.method !== 'cash' && (
            <div>
              <label className="label">Reference number</label>
              <input type="text" className="input" placeholder="e.g. Transfer reference, POS batch #"
                value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} />
            </div>
          )}

          {(form.method === 'bank_transfer' || form.method === 'cheque') && banks.length > 0 && (
            <div>
              <label className="label">Bank account</label>
              <select className="input" value={form.bank_account_id} onChange={(e) => setForm({ ...form, bank_account_id: e.target.value })}>
                <option value="">Select account</option>
                {banks.map((b: any) => <option key={b.id} value={b.id}>{b.bank_name} - {b.account_number}</option>)}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Paid by</label>
              <input type="text" className="input" placeholder="Parent name"
                value={form.paid_by} onChange={(e) => setForm({ ...form, paid_by: e.target.value })} />
            </div>
            <div>
              <label className="label">Received by</label>
              <input type="text" className="input" placeholder="Staff name"
                value={form.received_by} onChange={(e) => setForm({ ...form, received_by: e.target.value })} />
            </div>
          </div>

          <div>
            <label className="label">Notes</label>
            <textarea rows={2} className="input"
              value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={onClose} className="btn-secondary text-sm">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary text-sm">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Record payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
