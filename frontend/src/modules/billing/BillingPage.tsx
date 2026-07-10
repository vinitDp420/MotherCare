import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useBillsList, useCreateBill, useRecordPayment } from '@/hooks/useBilling'
import { usePatientsList } from '@/hooks/usePatients'

const billSchema = z.object({
  patient: z.string().min(1, 'Patient is required'),
  bill_type: z.enum(['consultation', 'lab', 'pharmacy', 'admission', 'misc']),
  notes: z.string().optional().default(''),
})

const paymentSchema = z.object({
  amount: z.number({ invalid_type_error: 'Enter a valid amount' }).positive('Amount must be positive'),
  payment_method: z.enum(['cash', 'card', 'upi', 'netbanking', 'insurance', 'cheque']),
  transaction_ref: z.string().optional().default(''),
})

type BillForm = z.infer<typeof billSchema>
type PaymentForm = z.infer<typeof paymentSchema>

const STATUS_BADGE: Record<string, string> = {
  paid: 'bg-primary-fixed-dim/30 text-primary border border-primary/20',
  pending: 'bg-secondary-container text-secondary border border-secondary/20',
  overdue: 'bg-error-container text-error border border-error/20',
  partial: 'bg-surface-container-highest text-on-surface-variant border border-outline-variant/30',
  refunded: 'bg-tertiary-container text-on-tertiary-container border border-tertiary/20',
}

const BILL_TYPE_ICON: Record<string, string> = {
  consultation: 'medical_services',
  lab: 'biotech',
  pharmacy: 'medication',
  admission: 'bed',
  misc: 'receipt',
}

export default function BillingPage() {
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [payingBillId, setPayingBillId] = useState<string | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)

  const { data, isLoading } = useBillsList({ payment_status: statusFilter || undefined, search, page })
  const { data: patientsData } = usePatientsList({ page: 1 })
  const createBill = useCreateBill()
  const recordPayment = useRecordPayment()

  const bills = data?.results ?? []
  const totalCount = data?.count ?? 0

  // Stats
  const todayTotal = bills.filter((b) => b.payment_status === 'paid').reduce((s, b) => s + Number(b.amount_paid), 0)
  const pendingTotal = bills.filter((b) => ['pending', 'partial', 'overdue'].includes(b.payment_status)).reduce((s, b) => s + Number(b.total_amount), 0)
  const paidCount = bills.filter((b) => b.payment_status === 'paid').length
  const overdueCount = bills.filter((b) => b.payment_status === 'overdue').length

  const {
    register: registerBill,
    handleSubmit: handleBillSubmit,
    reset: resetBill,
    formState: { errors: billErrors, isSubmitting: isBillSubmitting },
  } = useForm<BillForm, unknown, BillForm>({ resolver: zodResolver(billSchema) as any })

  const {
    register: registerPayment,
    handleSubmit: handlePaymentSubmit,
    reset: resetPayment,
    formState: { errors: paymentErrors, isSubmitting: isPaymentSubmitting },
  } = useForm<PaymentForm, unknown, PaymentForm>({ resolver: zodResolver(paymentSchema) as any })

  const onCreateBill = (data: BillForm) => {
    setServerError(null)
    const typeToCharge: Record<string, { type: string; name: string; price: number }> = {
      consultation: { type: 'consultation_charge', name: 'Standard Consultation Fee', price: 500 },
      lab: { type: 'lab_charge', name: 'Laboratory Diagnostics', price: 800 },
      pharmacy: { type: 'pharmacy_charge', name: 'Prescribed Medication & Consumables', price: 450 },
      admission: { type: 'admission_charge', name: 'Inpatient Room & Nursing Fee', price: 2500 },
      misc: { type: 'misc_charge', name: 'General Hospital Service Charge', price: 300 },
    }
    const charge = typeToCharge[data.bill_type] || typeToCharge.misc
    const payload = {
      ...data,
      items: [
        {
          item_type: charge.type,
          item_name: charge.name,
          quantity: 1,
          unit_price: charge.price,
        },
      ],
    }
    createBill.mutate(payload, {
      onSuccess: () => { setIsCreateOpen(false); resetBill() },
      onError: (err: any) => setServerError(err?.detail || err?.message || 'Failed to create bill.'),
    })
  }

  const onRecordPayment = (data: PaymentForm) => {
    if (!payingBillId) return
    setServerError(null)
    recordPayment.mutate({ id: payingBillId, data }, {
      onSuccess: () => { setPayingBillId(null); resetPayment() },
      onError: (err: any) => setServerError(err?.detail || err?.message || 'Payment failed.'),
    })
  }

  const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)

  return (
    <section className="p-margin-desktop space-y-lg">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface dark:text-inverse-on-surface">Billing & Payments</h2>
          <p className="text-on-surface-variant font-body-md">Manage transactions, fees, and payment records.</p>
        </div>
        <button
          onClick={() => { setIsCreateOpen(true); setServerError(null) }}
          className="bg-primary text-on-primary px-lg py-sm rounded-lg flex items-center gap-2 font-label-lg hover:opacity-90 active:scale-95 transition-all shadow-md"
        >
          <span className="material-symbols-outlined">receipt_long</span> Generate Invoice
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter">
        {[
          { icon: 'account_balance_wallet', label: "Today's Revenue", value: fmt(todayTotal), color: 'text-primary', bg: 'bg-primary-fixed-dim/20' },
          { icon: 'pending_actions', label: 'Pending Payments', value: fmt(pendingTotal), color: 'text-error', bg: 'bg-error-container' },
          { icon: 'task_alt', label: 'Paid Invoices', value: String(paidCount), color: 'text-primary', bg: 'bg-primary-fixed-dim/20' },
          { icon: 'warning', label: 'Overdue', value: String(overdueCount), color: 'text-error', bg: 'bg-error-container' },
        ].map((card) => (
          <div key={card.label} className="bg-surface-container-lowest dark:bg-inverse-surface p-lg rounded-xl custom-shadow border border-outline-variant/30 flex flex-col gap-base">
            <span className={`material-symbols-outlined ${card.color} ${card.bg} p-2 rounded-lg w-fit`}>{card.icon}</span>
            <p className="font-label-lg text-on-surface-variant uppercase tracking-wider">{card.label}</p>
            <h3 className={`font-headline-lg text-headline-lg ${card.color}`}>{card.value}</h3>
          </div>
        ))}
      </div>

      {/* Invoice Table */}
      <div className="bg-surface-container-lowest dark:bg-inverse-surface rounded-2xl custom-shadow border border-outline-variant/30 overflow-hidden">
        <div className="px-lg py-md border-b border-outline-variant flex flex-wrap justify-between items-center gap-md">
          <h4 className="font-title-lg text-title-lg text-on-surface dark:text-inverse-on-surface">Invoices</h4>
          <div className="flex gap-sm flex-wrap">
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search patient, invoice..."
              className="px-md py-xs border border-outline-variant rounded-lg text-body-md bg-surface dark:bg-surface-container"
            />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
              className="px-md py-xs border border-outline-variant rounded-lg text-body-md bg-surface dark:bg-surface-container"
            >
              <option value="">All Status</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="overdue">Overdue</option>
              <option value="partial">Partial</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-surface-container dark:bg-surface-container-high text-on-surface-variant font-label-lg">
              <tr>
                <th className="px-lg py-md">Invoice No.</th>
                <th className="px-lg py-md">Patient</th>
                <th className="px-lg py-md">Type</th>
                <th className="px-lg py-md">Amount</th>
                <th className="px-lg py-md">Paid</th>
                <th className="px-lg py-md">Status</th>
                <th className="px-lg py-md">Date</th>
                <th className="px-lg py-md text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}><td colSpan={8} className="px-lg py-md"><div className="h-4 bg-surface-container-low rounded animate-pulse" /></td></tr>
                ))
              ) : bills.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-xl text-on-surface-variant">No invoices found.</td></tr>
              ) : (
                bills.map((bill) => (
                  <tr key={bill.id} className="hover:bg-surface dark:hover:bg-surface-container-low transition-colors">
                    <td className="px-lg py-md font-label-lg text-primary">#{bill.invoice_number}</td>
                    <td className="px-lg py-md">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary-fixed-dim/20 flex items-center justify-center text-primary text-xs font-bold">
                          {bill.patient_name?.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="font-label-lg dark:text-inverse-on-surface">{bill.patient_name}</span>
                      </div>
                    </td>
                    <td className="px-lg py-md text-on-surface-variant capitalize">
                      <div className="flex items-center gap-xs">
                        <span className="material-symbols-outlined text-[18px]">{BILL_TYPE_ICON[bill.bill_type] ?? 'receipt'}</span>
                        {bill.bill_type_display ?? bill.bill_type}
                      </div>
                    </td>
                    <td className="px-lg py-md font-semibold dark:text-inverse-on-surface">{fmt(Number(bill.total_amount))}</td>
                    <td className="px-lg py-md text-primary font-semibold">{fmt(Number(bill.amount_paid))}</td>
                    <td className="px-lg py-md">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${STATUS_BADGE[bill.payment_status] ?? ''}`}>
                        {bill.payment_status_display ?? bill.payment_status}
                      </span>
                    </td>
                    <td className="px-lg py-md text-on-surface-variant text-sm">
                      {new Date(bill.generated_at).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-lg py-md text-right">
                      <div className="flex justify-end gap-1">
                        {['pending', 'partial', 'overdue'].includes(bill.payment_status) && (
                          <button
                            onClick={() => { setPayingBillId(bill.id); setServerError(null) }}
                            className="p-1.5 hover:bg-primary-fixed-dim/10 rounded-lg text-primary transition-all"
                            title="Record Payment"
                          >
                            <span className="material-symbols-outlined text-[20px]">payments</span>
                          </button>
                        )}
                        <button className="p-1.5 hover:bg-primary-fixed-dim/10 rounded-lg text-on-surface-variant hover:text-primary transition-all" title="Print Invoice">
                          <span className="material-symbols-outlined text-[20px]">print</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-lg py-md border-t border-outline-variant bg-surface dark:bg-surface-container-low flex justify-between items-center text-label-md text-on-surface-variant">
          <span>Showing {bills.length} of {totalCount} invoices</span>
          <div className="flex gap-base">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1 bg-surface-container-lowest dark:bg-inverse-surface border border-outline-variant rounded disabled:opacity-40"
            >Previous</button>
            <button
              disabled={bills.length < 20 || totalCount <= page * 20}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1 bg-surface-container-lowest dark:bg-inverse-surface border border-outline-variant rounded disabled:opacity-40"
            >Next</button>
          </div>
        </div>
      </div>

      {/* Create Bill Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-md">
          <div className="bg-surface-container-lowest rounded-2xl w-full max-w-lg shadow-2xl border border-outline-variant/30">
            <div className="p-lg border-b border-outline-variant flex justify-between items-center">
              <h3 className="font-headline-md text-primary">New Invoice</h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-secondary hover:text-on-surface cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleBillSubmit(onCreateBill)} className="p-lg space-y-md">
              {serverError && <div className="bg-error-container text-on-error-container p-md rounded-lg text-sm">{serverError}</div>}
              <div>
                <label className="block text-label-md font-semibold mb-xs">Patient</label>
                <select {...registerBill('patient')} className="w-full p-sm bg-surface-container-low border border-outline-variant rounded-lg text-body-md">
                  <option value="">Select Patient</option>
                  {patientsData?.results?.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.full_name} — {p.mrn}</option>
                  ))}
                </select>
                {billErrors.patient && <p className="text-error text-xs mt-xs">{billErrors.patient.message}</p>}
              </div>
              <div>
                <label className="block text-label-md font-semibold mb-xs">Bill Type</label>
                <select {...registerBill('bill_type')} className="w-full p-sm bg-surface-container-low border border-outline-variant rounded-lg text-body-md">
                  <option value="consultation">Consultation</option>
                  <option value="lab">Laboratory</option>
                  <option value="pharmacy">Pharmacy</option>
                  <option value="admission">Admission</option>
                  <option value="misc">Miscellaneous</option>
                </select>
              </div>
              <div>
                <label className="block text-label-md font-semibold mb-xs">Notes (optional)</label>
                <textarea {...registerBill('notes')} rows={2} className="w-full p-sm bg-surface-container-low border border-outline-variant rounded-lg text-body-md" />
              </div>
              <div className="flex justify-end gap-sm pt-sm">
                <button type="button" onClick={() => setIsCreateOpen(false)} className="px-lg py-sm border border-outline-variant rounded-lg font-label-lg">Cancel</button>
                <button type="submit" disabled={isBillSubmitting} className="bg-primary text-on-primary px-xl py-sm rounded-lg font-label-lg shadow-md">
                  {isBillSubmitting ? 'Creating...' : 'Create Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {payingBillId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-md">
          <div className="bg-surface-container-lowest rounded-2xl w-full max-w-md shadow-2xl border border-outline-variant/30">
            <div className="p-lg border-b border-outline-variant flex justify-between items-center">
              <h3 className="font-headline-md text-primary">Record Payment</h3>
              <button onClick={() => setPayingBillId(null)} className="text-secondary hover:text-on-surface cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handlePaymentSubmit(onRecordPayment)} className="p-lg space-y-md">
              {serverError && <div className="bg-error-container text-on-error-container p-md rounded-lg text-sm">{serverError}</div>}
              <div>
                <label className="block text-label-md font-semibold mb-xs">Amount (₹)</label>
                <input type="number" step="0.01" {...registerPayment('amount', { valueAsNumber: true })} className="w-full p-sm bg-surface-container-low border border-outline-variant rounded-lg text-body-md" />
                {paymentErrors.amount && <p className="text-error text-xs mt-xs">{paymentErrors.amount.message}</p>}
              </div>
              <div>
                <label className="block text-label-md font-semibold mb-xs">Payment Method</label>
                <div className="grid grid-cols-3 gap-sm">
                  {['cash', 'upi', 'card', 'netbanking', 'insurance', 'cheque'].map((method) => (
                    <label key={method} className="flex items-center gap-xs p-sm border border-outline-variant rounded-lg cursor-pointer hover:border-primary transition-colors">
                      <input type="radio" value={method} {...registerPayment('payment_method')} className="accent-primary" />
                      <span className="font-label-md capitalize">{method}</span>
                    </label>
                  ))}
                </div>
                {paymentErrors.payment_method && <p className="text-error text-xs mt-xs">{paymentErrors.payment_method.message}</p>}
              </div>
              <div>
                <label className="block text-label-md font-semibold mb-xs">Transaction Ref (optional)</label>
                <input type="text" {...registerPayment('transaction_ref')} placeholder="UPI ID, cheque no..." className="w-full p-sm bg-surface-container-low border border-outline-variant rounded-lg text-body-md" />
              </div>
              <div className="flex justify-end gap-sm pt-sm">
                <button type="button" onClick={() => setPayingBillId(null)} className="px-lg py-sm border border-outline-variant rounded-lg font-label-lg">Cancel</button>
                <button type="submit" disabled={isPaymentSubmitting} className="bg-primary text-on-primary px-xl py-sm rounded-lg font-label-lg shadow-md">
                  {isPaymentSubmitting ? 'Recording...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}
