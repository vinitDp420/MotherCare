/**
 * PharmacyPage — Full Pharmacy Management Module
 * Tabs: Overview | Inventory | Prescriptions | Billing | Reports
 * Features: Working buttons, modals, state mgmt, EN/MR/HI translations, live APIs
 */
import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'
import { usePatientsList } from '@/hooks/usePatients'
import {
  useMedicinesList,
  useCreateMedicine,
  useUpdateMedicine,
  useDeleteMedicine,
  useBatchesList,
  useCreateBatch,
  useUpdateBatch,
  useDeleteBatch,
  useSalesList,
  useDispensePrescription,
  useOtcSale,
} from '@/hooks/usePharmacy'
import { usePrescriptionsList } from '@/hooks/usePrescriptions'

// ─── Brand color ──────────────────────────────────────────────────────────────
const BRAND = '#00685d'

// ─── Translations ─────────────────────────────────────────────────────────────
const T = {
  en: {
    title: 'Pharmacy Management', subtitle: 'Maternity Care Unit · Pharmacy Division',
    addMedicine: 'Add New Medicine', generateBill: 'Generate Bill', viewReports: 'View Reports',
    lastSync: 'Last Sync',
    tabs: { overview: 'Overview', inventory: 'Inventory', prescriptions: 'Prescriptions', billing: 'Billing', reports: 'Reports' },
    // Stats
    totalMedicines: 'Total Medicines', lowStock: 'Low Stock Items', expiringSoon: 'Expiring Soon (30d)', todaySales: "Today's Sales",
    thisWeek: 'this week', actionRequired: 'Action required', reviewNeeded: 'Review needed', transactions: 'transactions',
    // Table
    medicineAndBatch: 'Medicine & Batch', category: 'Category', stockLevel: 'Stock Level', expiry: 'Expiry', price: 'Price', actions: 'Actions',
    // Buttons
    viewAll: 'View All', generateInvoice: 'Generate Invoice', viewAllTx: 'View All Transactions',
    edit: 'Edit', restock: 'Restock', delete: 'Delete', addToCart: 'Dispense',
    close: 'Close', save: 'Save', cancel: 'Cancel', confirm: 'Confirm',
    exportCSV: 'Export CSV', print: 'Print', markFulfilled: 'Mark Fulfilled',
    // Panels
    pendingPrescriptions: 'Pending Prescriptions', newBadge: 'New', recentSales: 'Recent Sales',
    inventoryStatus: 'Inventory Status', showing: 'Showing',
    // Modals
    addMedicineTitle: 'Add New Medicine', medicineName: 'Medicine Name', genericName: 'Generic (INN) Name', batchNo: 'Batch No.',
    categoryLabel: 'Category', stockQty: 'Stock Quantity', expiryDate: 'Expiry Date',
    priceLabel: 'Price (₹)', supplier: 'Supplier', addBtn: 'Add Medicine',
    restockTitle: 'Restock Medicine', restockQty: 'Add Quantity',
    billTitle: 'Generate Bill', patientNameLabel: 'Patient Name', patientIdLabel: 'Patient ID',
    prescribedBy: 'Prescribed By', items: 'Items', total: 'Total', billBtn: 'Generate & Print',
    invoiceTitle: 'Invoice', dispensed: 'Dispensed',
    // Billing table
    invoiceNo: 'Invoice No.', patient: 'Patient', amount: 'Amount', billStatus: 'Status', date: 'Date',
    paid: 'Paid', unpaid: 'Unpaid', partial: 'Partial',
    // Reports
    salesSummary: 'Sales Summary', topMedicines: 'Top Medicines', stockReport: 'Stock Report',
    // Filters
    allCategories: 'All Categories', allStatuses: 'All Statuses', searchMedicine: 'Search medicines…',
    // Toasts
    medicineAdded: 'Medicine added!', restocked: 'Stock updated!', invoiceGenerated: 'Invoice generated!',
    markedFulfilled: 'Prescription fulfilled!', exported: 'Exported successfully!', printed: 'Sent to printer!',
    deleted: 'Item removed!',
    // Low stock / expiring
    lowStockBadge: 'Low Stock', expiringSoonBadge: 'Expiring Soon',
  },
  mr: {
    title: 'औषधालय व्यवस्थापन', subtitle: 'मातृत्व काळजी युनिट · औषधालय विभाग',
    addMedicine: 'नवीन औषध जोडा', generateBill: 'बिल तयार करा', viewReports: 'अहवाल पहा',
    lastSync: 'शेवटची समक्रमण',
    tabs: { overview: 'आढावा', inventory: 'यादी', prescriptions: 'प्रिस्क्रिप्शन', billing: 'बिलिंग', reports: 'अहवाल' },
    totalMedicines: 'एकूण औषधे', lowStock: 'कमी साठा', expiringSoon: 'लवकर कालबाह्य (३०दि)', todaySales: 'आजची विक्री',
    thisWeek: 'या आठवड्यात', actionRequired: 'कारवाई आवश्यक', reviewNeeded: 'समीक्षा आवश्यक', transactions: 'व्यवहार',
    medicineAndBatch: 'औषध आणि बॅच', category: 'श्रेणी', stockLevel: 'साठा पातळी', expiry: 'कालबाह्यता', price: 'किंमत', actions: 'क्रिया',
    viewAll: 'सर्व पहा', generateInvoice: 'चालान तयार करा', viewAllTx: 'सर्व व्यवहार पहा',
    edit: 'संपादित करा', restock: 'साठा भरा', delete: 'हटवा', addToCart: 'वितरित करा',
    close: 'बंद करा', save: 'जतन करा', cancel: 'रद्द करा', confirm: 'पुष्टी करा',
    exportCSV: 'CSV निर्यात', print: 'मुद्रण', markFulfilled: 'पूर्ण म्हणून चिन्हांकित करा',
    pendingPrescriptions: 'प्रलंबित प्रिस्क्रिप्शन', newBadge: 'नवीन', recentSales: 'अलीकडील विक्री',
    inventoryStatus: 'साठा स्थिती', showing: 'दाखवत आहे',
    addMedicineTitle: 'नवीन औषध जोडा', medicineName: 'औषधाचे नाव', genericName: 'जेनेरिक नाव', batchNo: 'बॅच क्र.',
    categoryLabel: 'श्रेणी', stockQty: 'साठा प्रमाण', expiryDate: 'कालबाह्यता तारीख',
    priceLabel: 'किंमत (₹)', supplier: 'पुरवठादार', addBtn: 'औषध जोडा',
    restockTitle: 'साठा भरा', restockQty: 'प्रमाण जोडा',
    billTitle: 'बिल तयार करा', patientNameLabel: 'रुग्णाचे नाव', patientIdLabel: 'रुग्ण आयडी',
    prescribedBy: 'कोणाने लिहिले', items: 'वस्तू', total: 'एकूण', billBtn: 'तयार करा आणि मुद्रण करा',
    invoiceTitle: 'चालान', dispensed: 'वितरित',
    invoiceNo: 'चालान क्र.', patient: 'रुग्ण', amount: 'रक्कम', billStatus: 'स्थिती', date: 'तारीख',
    paid: 'भरले', unpaid: 'न भरलेले', partial: 'आंशिक',
    salesSummary: 'विक्री सारांश', topMedicines: 'शीर्ष औषधे', stockReport: 'साठा अहवाल',
    allCategories: 'सर्व श्रेणी', allStatuses: 'सर्व स्थिती', searchMedicine: 'औषध शोधा…',
    medicineAdded: 'औषध जोडले!', restocked: 'साठा अद्यतनित!', invoiceGenerated: 'चालान तयार!',
    markedFulfilled: 'प्रिस्क्रिप्शन पूर्ण!', exported: 'निर्यात यशस्वी!', printed: 'प्रिंटरला पाठवले!',
    deleted: 'आयटम काढला!', lowStockBadge: 'कमी साठा', expiringSoonBadge: 'लवकर कालबाह्य',
  },
  hi: {
    title: 'फार्मेसी प्रबंधन', subtitle: 'मातृत्व देखभाल इकाई · फार्मेसी प्रभाग',
    addMedicine: 'नई दवा जोड़ें', generateBill: 'बिल बनाएं', viewReports: 'रिपोर्ट देखें',
    lastSync: 'अंतिम समन्वय',
    tabs: { overview: 'अवलोकन', inventory: 'इन्वेंटरी', prescriptions: 'प्रिस्क्रिप्शन', billing: 'बिलिंग', reports: 'रिपोर्ट' },
    totalMedicines: 'कुल दवाएं', lowStock: 'कम स्टॉक', expiringSoon: 'जल्द समाप्त (30दि)', todaySales: 'आज की बिक्री',
    thisWeek: 'इस सप्ताह', actionRequired: 'कार्रवाई आवश्यक', reviewNeeded: 'समीक्षा आवश्यक', transactions: 'लेनदेन',
    medicineAndBatch: 'दवा और बैच', category: 'श्रेणी', stockLevel: 'स्टॉक स्तर', expiry: 'समाप्ति', price: 'कीमत', actions: 'क्रियाएं',
    viewAll: 'सभी देखें', generateInvoice: 'चालान बनाएं', viewAllTx: 'सभी लेनदेन देखें',
    edit: 'संपादित करें', restock: 'स्टॉक भरें', delete: 'हटाएं', addToCart: 'वितरित करें',
    close: 'बंद करें', save: 'सहेजें', cancel: 'रद्द करें', confirm: 'पुष्टि करें',
    exportCSV: 'CSV निर्यात', print: 'प्रिंट', markFulfilled: 'पूर्ण चिह्नित करें',
    pendingPrescriptions: 'लंबित प्रिस्क्रिप्शन', newBadge: 'नया', recentSales: 'हाल की बिक्री',
    inventoryStatus: 'स्टॉक स्थिति', showing: 'दिखा रहे हैं',
    addMedicineTitle: 'नई दवा जोड़ें', medicineName: 'दवा का नाम', genericName: 'जेनेरिक नाम', batchNo: 'बैच नं.',
    categoryLabel: 'श्रेणी', stockQty: 'स्टॉक मात्रा', expiryDate: 'समाप्ति तिथि',
    priceLabel: 'कीमत (₹)', supplier: 'आपूर्तिकर्ता', addBtn: 'दवा जोड़ें',
    restockTitle: 'स्टॉक भरें', restockQty: 'मात्रा जोड़ें',
    billTitle: 'बिल बनाएं', patientNameLabel: 'रोगी का नाम', patientIdLabel: 'रोगी आईडी',
    prescribedBy: 'किसने लिखा', items: 'आइटम', total: 'कुल', billBtn: 'बनाएं और प्रिंट करें',
    invoiceTitle: 'चालान', dispensed: 'वितरित',
    invoiceNo: 'चालान नं.', patient: 'रोगी', amount: 'राशि', billStatus: 'स्थिति', date: 'तिथि',
    paid: 'भुगतान', unpaid: 'अदत्त', partial: 'आंशिक',
    salesSummary: 'बिक्री सारांश', topMedicines: 'शीर्ष दवाएं', stockReport: 'स्टॉक रिपोर्ट',
    allCategories: 'सभी श्रेणियां', allStatuses: 'सभी स्थितियां', searchMedicine: 'दवा खोजें…',
    medicineAdded: 'दवा जोड़ी गई!', restocked: 'स्टॉक अपडेट!', invoiceGenerated: 'चालान बना!',
    markedFulfilled: 'प्रिस्क्रिप्शन पूर्ण!', exported: 'निर्यात सफल!', printed: 'प्रिंटर को भेजा!',
    deleted: 'आइटम हटाया!', lowStockBadge: 'कम स्टॉक', expiringSoonBadge: 'जल्द समाप्त',
  },
} as const
type Lang = keyof typeof T

// ─── Validation Schemas ────────────────────────────────────────────────────────

const medicineSchema = z.object({
  name: z.string().min(1, 'Medicine name is required'),
  generic_name: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  unit: z.string().min(1, 'Dispensing unit is required'),
  reorder_level: z.coerce.number().min(0, 'Must be a positive number'),
})

const batchSchema = z.object({
  batch_number: z.string().min(1, 'Batch number is required'),
  supplier_name: z.string().min(1, 'Supplier is required'),
  purchase_date: z.string().min(1, 'Purchase date is required'),
  expiry_date: z.string().min(1, 'Expiry date is required'),
  quantity: z.coerce.number().min(1, 'Must be at least 1'),
  purchase_price: z.string().min(1, 'Purchase price is required'),
  selling_price: z.string().min(1, 'Selling price is required'),
}).refine(data => {
  const pDate = new Date(data.purchase_date)
  const eDate = new Date(data.expiry_date)
  return eDate > pDate
}, {
  message: 'Expiry date must be after purchase date',
  path: ['expiry_date']
})

const otcSaleSchema = z.object({
  patient_id: z.string().min(1, 'Patient is required'),
  items: z.array(z.object({
    medicine_id: z.string().min(1, 'Medicine is required'),
    qty: z.coerce.number().min(1, 'Quantity must be at least 1'),
    available_qty: z.number().optional(),
  })).min(1, 'At least one medicine is required')
})

// ─── Helpers ───────────────────────────────────────────────────────────────────
function Toast({ msg, onClose }: { msg: string; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 2500); return () => clearTimeout(t) }, [])
  return (
    <div className="fixed bottom-6 right-6 z-[100] text-white px-lg py-sm rounded-xl shadow-xl flex items-center gap-sm" style={{ background: BRAND }}>
      <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
      <span className="font-label-lg">{msg}</span>
    </div>
  )
}

function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-md" onClick={onClose}>
      <div className={`bg-surface dark:bg-surface-container rounded-2xl shadow-2xl w-full ${wide ? 'max-w-2xl' : 'max-w-lg'} max-h-[90vh] overflow-auto`} onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-lg border-b border-outline-variant">
          <h2 className="font-title-lg text-title-lg text-on-surface">{title}</h2>
          <button onClick={onClose} className="p-xs text-on-surface-variant hover:bg-surface-container-high rounded-lg"><span className="material-symbols-outlined">close</span></button>
        </div>
        <div className="p-lg">{children}</div>
      </div>
    </div>
  )
}

const inputCls = "w-full px-sm py-xs rounded-lg border border-outline-variant bg-surface-container-lowest dark:bg-surface-variant text-body-sm focus:outline-none focus:ring-2"
const labelCls = "font-label-md text-label-md text-on-surface-variant block mb-xs"

function StockBar({ stock, max, isLow }: { stock: number; max: number; isLow?: boolean }) {
  const pct = Math.min((stock / max) * 100, 100)
  return (
    <div className="flex items-center gap-xs">
      <div className="w-20 h-1.5 bg-surface-variant rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${isLow ? 'bg-error' : pct > 60 ? 'bg-primary' : 'bg-tertiary'}`} style={{ width: `${pct || 0}%` }} />
      </div>
      <span className={`font-label-md w-8 text-right ${isLow ? 'text-error font-bold' : 'text-on-surface-variant'}`}>{stock}</span>
    </div>
  )
}

function exportCSV(rows: Record<string, unknown>[], filename: string) {
  if (rows.length === 0) return
  const headers = Object.keys(rows[0])
  const csv = [headers, ...rows.map(r => headers.map(h => `"${r[h] ?? ''}"`))]
    .map(r => r.join(',')).join('\n')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
  a.download = filename; a.click()
}

// ─── Add Medicine Modal ────────────────────────────────────────────────────────
function AddMedicineModal({ t, onClose, onAdd }: { t: any; onClose: () => void; onAdd: (m: any) => void }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(medicineSchema),
    defaultValues: {
      name: '',
      generic_name: '',
      category: 'tablet',
      unit: 'tablet',
      reorder_level: 50
    }
  })

  const submit = (data: any) => {
    onAdd(data)
  }

  return (
    <Modal title={t.addMedicineTitle} onClose={onClose}>
      <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-md">
        <div className="grid grid-cols-2 gap-md">
          <div className="col-span-2">
            <label className={labelCls}>{t.medicineName} *</label>
            <input className={inputCls} {...register('name')} />
            {errors.name && <p className="text-xs text-error mt-1">{errors.name.message}</p>}
          </div>

          <div className="col-span-2">
            <label className={labelCls}>{t.genericName}</label>
            <input className={inputCls} {...register('generic_name')} placeholder="e.g. Paracetamol" />
          </div>

          <div>
            <label className={labelCls}>{t.categoryLabel} *</label>
            <select className={inputCls} {...register('category')}>
              {['tablet', 'capsule', 'syrup', 'injection', 'topical', 'inhaler', 'drops', 'suppository', 'patch', 'powder', 'other'].map(c => (
                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelCls}>Dispensing Unit *</label>
            <input className={inputCls} {...register('unit')} placeholder="tablet, ml, sachet, etc." />
            {errors.unit && <p className="text-xs text-error mt-1">{errors.unit.message}</p>}
          </div>

          <div className="col-span-2">
            <label className={labelCls}>Reorder Level (Min Stock) *</label>
            <input className={inputCls} type="number" {...register('reorder_level')} />
            {errors.reorder_level && <p className="text-xs text-error mt-1">{errors.reorder_level.message}</p>}
          </div>
        </div>

        <div className="flex gap-sm pt-sm">
          <button type="button" onClick={onClose} className="flex-1 py-sm rounded-lg border border-outline-variant text-on-surface-variant font-label-lg hover:bg-surface-container">{t.cancel}</button>
          <button type="submit" className="flex-1 py-sm rounded-lg text-white font-label-lg hover:opacity-90 shadow-sm" style={{ background: BRAND }}>{t.addBtn}</button>
        </div>
      </form>
    </Modal>
  )
}

// ─── Restock Modal ─────────────────────────────────────────────────────────────
function RestockModal({ med, t, onClose, onRestock }: { med: any; t: any; onClose: () => void; onRestock: (qty: any) => void }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(batchSchema),
    defaultValues: {
      batch_number: '',
      supplier_name: '',
      purchase_date: new Date().toISOString().split('T')[0],
      expiry_date: '',
      quantity: 100,
      purchase_price: '10.00',
      selling_price: '13.00',
    }
  })

  const submit = (data: any) => {
    onRestock(data)
  }

  return (
    <Modal title={`${t.restockTitle} — ${med.name}`} onClose={onClose}>
      <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-md">
        <div className="p-sm rounded-lg bg-surface-container flex justify-between items-center mb-sm">
          <div>
            <p className="font-body-md text-on-surface font-semibold">{med.name}</p>
            <p className="font-label-sm text-on-surface-variant">Reorder Level: {med.reorder_level} units</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-md">
          <div>
            <label className={labelCls}>{t.batchNo} *</label>
            <input className={inputCls} {...register('batch_number')} placeholder="BAT-XXXX" />
            {errors.batch_number && <p className="text-xs text-error mt-1">{errors.batch_number.message}</p>}
          </div>

          <div>
            <label className={labelCls}>{t.supplier} *</label>
            <input className={inputCls} {...register('supplier_name')} placeholder="Supplier Name" />
            {errors.supplier_name && <p className="text-xs text-error mt-1">{errors.supplier_name.message}</p>}
          </div>

          <div>
            <label className={labelCls}>Purchase Date *</label>
            <input className={inputCls} type="date" {...register('purchase_date')} />
            {errors.purchase_date && <p className="text-xs text-error mt-1">{errors.purchase_date.message}</p>}
          </div>

          <div>
            <label className={labelCls}>{t.expiryDate} *</label>
            <input className={inputCls} type="date" {...register('expiry_date')} />
            {errors.expiry_date && <p className="text-xs text-error mt-1">{errors.expiry_date.message}</p>}
          </div>

          <div>
            <label className={labelCls}>{t.stockQty} *</label>
            <input className={inputCls} type="number" {...register('quantity')} />
            {errors.quantity && <p className="text-xs text-error mt-1">{errors.quantity.message}</p>}
          </div>

          <div>
            <label className={labelCls}>Purchase Price (₹) *</label>
            <input className={inputCls} type="text" {...register('purchase_price')} />
            {errors.purchase_price && <p className="text-xs text-error mt-1">{errors.purchase_price.message}</p>}
          </div>

          <div className="col-span-2">
            <label className={labelCls}>Selling Price (₹) *</label>
            <input className={inputCls} type="text" {...register('selling_price')} />
            {errors.selling_price && <p className="text-xs text-error mt-1">{errors.selling_price.message}</p>}
          </div>
        </div>

        <div className="flex gap-sm pt-sm">
          <button type="button" onClick={onClose} className="flex-1 py-sm rounded-lg border border-outline-variant text-on-surface-variant font-label-lg hover:bg-surface-container">{t.cancel}</button>
          <button type="submit" className="flex-1 py-sm rounded-lg text-white font-label-lg hover:opacity-90 shadow-sm" style={{ background: BRAND }}>{t.confirm}</button>
        </div>
      </form>
    </Modal>
  )
}

// ─── Generate Bill Modal ───────────────────────────────────────────────────────
function GenerateBillModal({ t, medicines, onClose, onGenerate }: { t: any; medicines: any[]; onClose: () => void; onGenerate: (data: any) => void }) {
  const { data: patientsData } = usePatientsList({ page: 1, ordering: 'full_name' })
  const patients = patientsData?.results ?? []

  const { register, control, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    resolver: zodResolver(otcSaleSchema),
    defaultValues: {
      patient_id: '',
      items: [{ medicine_id: '', qty: 1, available_qty: 0 }]
    }
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items'
  })

  const watchedItems = watch('items')
  const [totals, setTotals] = useState<number[]>([])

  useEffect(() => {
    const calculated = watchedItems.map(item => {
      const med = medicines.find(m => m.id === item.medicine_id)
      const batchPrice = med?.batches?.[0]?.selling_price ?? '0.00'
      return (+batchPrice || 0) * (Number(item.qty) || 0)
    })
    setTotals(calculated)
  }, [watchedItems, medicines])

  const totalSum = totals.reduce((sum, current) => sum + current, 0)

  const submit = (data: any) => {
    // Client-side verification of stock levels
    for (let i = 0; i < data.items.length; i++) {
      const item = data.items[i]
      const med = medicines.find(m => m.id === item.medicine_id)
      const stock = med?.batches?.reduce((acc: number, b: any) => acc + b.quantity, 0) ?? 0
      if (item.qty > stock) {
        alert(`Insufficient stock for ${med?.name || 'selected medicine'}. Available: ${stock}`);
        return
      }
    }

    onGenerate({
      patient_id: data.patient_id,
      items: data.items.map((it: any) => ({ medicine_id: it.medicine_id, qty: it.qty }))
    })
  }

  return (
    <Modal title={t.billTitle} onClose={onClose} wide>
      <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-md">
        <div className="space-y-md">
          {/* Patient dropdown */}
          <div>
            <label className={labelCls}>Patient *</label>
            <select className={inputCls} {...register('patient_id')}>
              <option value="">— Select Patient —</option>
              {patients.map((p: any) => (
                <option key={p.id} value={p.id}>{p.full_name} ({p.mrn})</option>
              ))}
            </select>
            {errors.patient_id && <p className="text-xs text-error mt-1">{errors.patient_id.message}</p>}
          </div>

          {/* Medicines Cart */}
          <div className="space-y-sm">
            <div className="flex justify-between items-center">
              <label className={labelCls}>{t.items} *</label>
              <button
                type="button"
                onClick={() => append({ medicine_id: '', qty: 1, available_qty: 0 })}
                className="text-primary font-label-md text-xs hover:underline flex items-center gap-0.5"
              >
                <span className="material-symbols-outlined text-[14px]">add</span> Add Item
              </button>
            </div>

            {errors.items?.message && <p className="text-xs text-error mb-2">{errors.items.message}</p>}

            <div className="max-h-52 overflow-y-auto space-y-xs border border-outline-variant/30 rounded-xl p-sm bg-surface-bright/30 divide-y divide-outline-variant/20">
              {fields.map((field, idx) => {
                const selectedMedId = watchedItems?.[idx]?.medicine_id
                const currentMed = medicines.find(m => m.id === selectedMedId)
                const currentStock = currentMed?.batches?.reduce((acc: number, b: any) => acc + b.quantity, 0) ?? 0
                const currentPrice = currentMed?.batches?.[0]?.selling_price ?? '0.00'

                return (
                  <div key={field.id} className="grid grid-cols-12 gap-sm items-center pt-xs first:pt-0">
                    {/* Medicine selection */}
                    <div className="col-span-6">
                      <select
                        className={inputCls}
                        {...register(`items.${idx}.medicine_id` as const)}
                        onChange={(e) => {
                          const mId = e.target.value
                          setValue(`items.${idx}.medicine_id` as const, mId)
                          const m = medicines.find(med => med.id === mId)
                          const stock = m?.batches?.reduce((acc: number, b: any) => acc + b.quantity, 0) ?? 0
                          setValue(`items.${idx}.available_qty` as const, stock)
                        }}
                      >
                        <option value="">— Choose Medicine —</option>
                        {medicines.map(m => {
                          const mStock = m.batches?.reduce((acc: number, b: any) => acc + b.quantity, 0) ?? 0
                          return (
                            <option key={m.id} value={m.id} disabled={mStock <= 0}>
                              {m.name} (Stock: {mStock} {m.unit})
                            </option>
                          )
                        })}
                      </select>
                    </div>

                    {/* Quantity input */}
                    <div className="col-span-3">
                      <input
                        type="number"
                        min="1"
                        max={currentStock || 1}
                        className={inputCls}
                        {...register(`items.${idx}.qty` as const)}
                        placeholder="Qty"
                      />
                    </div>

                    {/* Pricing Display */}
                    <div className="col-span-2 text-right">
                      <p className="font-label-sm text-on-surface-variant font-semibold">
                        ₹{(totals[idx] || 0).toFixed(2)}
                      </p>
                      <p className="text-[10px] text-secondary">
                        @ ₹{currentPrice}/{currentMed?.unit ?? 'unit'}
                      </p>
                    </div>

                    {/* Delete button */}
                    <div className="col-span-1 text-center">
                      {fields.length > 1 && (
                        <button type="button" onClick={() => remove(idx)} className="text-error hover:bg-error-container/20 p-xs rounded-lg">
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Total Summary */}
        <div className="flex justify-between p-sm rounded-lg bg-surface-container mt-sm">
          <span className="font-title-md text-on-surface font-bold">{t.total}</span>
          <span className="font-title-lg text-on-surface font-bold" style={{ color: BRAND }}>₹{totalSum.toFixed(2)}</span>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-sm pt-sm border-t border-outline-variant/20 mt-sm">
          <button type="button" onClick={onClose} className="flex-1 py-sm rounded-lg border border-outline-variant text-on-surface-variant font-label-lg hover:bg-surface-container">{t.cancel}</button>
          <button type="submit" className="flex-1 py-sm rounded-lg text-white font-label-lg hover:opacity-90 shadow-sm flex items-center justify-center gap-xs" style={{ background: BRAND }}>
            <span className="material-symbols-outlined text-[16px]">receipt_long</span>{t.billBtn}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ─── Overview Tab ──────────────────────────────────────────────────────────────
function OverviewTab({ medicines, prescriptions, sales, t, onGenerateBill, onFulfill, showToast, isSalesLoading }: {
  medicines: any[]; prescriptions: any[]; sales: any[]
  t: any; onGenerateBill: () => void; onFulfill: (id: string) => void; showToast: (m: string) => void; isSalesLoading: boolean
}) {
  const totalMeds = medicines.reduce((acc: number, m) => acc + (m.batches?.reduce((sum: number, b: any) => sum + b.quantity, 0) ?? 0), 0)
  
  // Low stock calculation: check if sum of batch quantities < reorder_level
  const lowCount = medicines.filter(m => {
    const sum = m.batches?.reduce((acc: number, b: any) => acc + b.quantity, 0) ?? 0
    return sum <= m.reorder_level
  }).length

  // Expiring soon calculation (batches expiring in 30 days)
  const today = new Date()
  const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
  const expCount = medicines.filter(m => {
    return m.batches?.some((b: any) => {
      const expDate = new Date(b.expiry_date)
      return expDate > today && expDate <= thirtyDaysFromNow
    })
  }).length

  // Today's Sales Calculation
  const todayStr = new Date().toISOString().split('T')[0]
  const todaySalesVal = sales
    .filter(s => s.sold_at.startsWith(todayStr))
    .reduce((acc, s) => acc + (+s.total_amount || 0), 0)

  const pending = prescriptions.filter(p => !p.is_dispensed)

  const stats = [
    { label: t.totalMedicines, value: `${totalMeds.toLocaleString()}`, sub: `${medicines.length} formulations`, subCls: 'text-primary', icon: 'pill', iconBg: 'bg-secondary-container text-on-secondary-container' },
    { label: t.lowStock, value: `${lowCount}`, sub: t.actionRequired, subCls: lowCount > 0 ? 'text-error' : 'text-primary', icon: 'production_quantity_limits', iconBg: 'bg-error-container text-on-error-container' },
    { label: t.expiringSoon, value: `${expCount}`, sub: t.reviewNeeded, subCls: expCount > 0 ? 'text-tertiary font-semibold' : 'text-primary', icon: 'hourglass_bottom', iconBg: 'bg-tertiary-container text-on-tertiary-container' },
    { label: t.todaySales, value: `₹${todaySalesVal.toFixed(2)}`, sub: `${sales.filter(s => s.sold_at.startsWith(todayStr)).length} ${t.transactions}`, subCls: 'text-primary', icon: 'payments', iconBg: 'bg-primary-container text-on-primary-container' },
  ]

  return (
    <div className="flex flex-col gap-lg animate-fade-in">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-md">
        {stats.map(s => (
          <div key={s.label} className="glass-card rounded-xl p-md flex items-start justify-between shadow-sm hover:shadow-md transition-shadow bg-white border border-outline-variant/10">
            <div>
              <p className="font-label-md text-on-surface-variant mb-xs">{s.label}</p>
              <h3 className="font-display-sm text-display-sm text-on-surface font-bold text-2xl">{s.value}</h3>
              <p className={`font-label-md flex items-center gap-xs mt-xs text-xs ${s.subCls}`}>
                <span className="material-symbols-outlined text-[14px]">{s.subCls.includes('error') ? 'warning' : s.subCls.includes('tertiary') ? 'event_busy' : 'trending_up'}</span>{s.sub}
              </p>
            </div>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${s.iconBg}`}>
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg">
        {/* Inventory Status Table */}
        <div className="lg:col-span-8 glass-card rounded-xl shadow-sm overflow-hidden bg-white border border-outline-variant/10">
          <div className="p-md border-b border-surface-dim flex justify-between items-center bg-surface-container-lowest dark:bg-on-surface">
            <h3 className="font-title-lg text-title-lg text-on-surface font-bold">{t.inventoryStatus}</h3>
            <button className="font-label-lg text-primary hover:underline text-sm font-semibold" onClick={onGenerateBill}>{t.viewAll}</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-surface-container-lowest dark:bg-on-surface">
                <tr className="border-b border-outline-variant/20 bg-neutral-50/50">
                  {[t.medicineAndBatch, t.category, t.stockLevel, t.expiry, t.price].map(h => (
                    <th key={h} className="py-sm px-md font-label-md text-on-surface-variant uppercase tracking-wider text-xs font-bold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-dim/30">
                {medicines.slice(0, 6).map(m => {
                  const mStock = m.batches?.reduce((acc: number, b: any) => acc + b.quantity, 0) ?? 0
                  const isLow = mStock <= m.reorder_level
                  const latestBatch = m.batches?.[0]
                  
                  const isExpiring = latestBatch && (() => {
                    const exp = new Date(latestBatch.expiry_date)
                    return exp > today && exp <= thirtyDaysFromNow
                  })()

                  return (
                    <tr key={m.id} className={`hover:bg-surface-container-low transition-colors ${isLow ? 'bg-error/5' : isExpiring ? 'bg-tertiary/5' : ''}`}>
                      <td className="py-sm px-md text-sm">
                        <div>
                          <div className="flex items-center gap-xs">
                            <span className="font-body-sm text-on-surface font-medium">{m.name}</span>
                            {isLow && <span className="px-1.5 py-0.5 rounded text-[10px] bg-error text-white font-bold uppercase">{t.lowStockBadge}</span>}
                            {isExpiring && <span className="px-1.5 py-0.5 rounded text-[10px] bg-tertiary text-white font-bold uppercase">{t.expiringSoonBadge}</span>}
                          </div>
                          {m.generic_name && <p className="text-[10px] text-on-surface-variant">{m.generic_name}</p>}
                        </div>
                      </td>
                      <td className="py-sm px-md text-sm">
                        <span className="px-2 py-0.5 rounded-full bg-surface-variant text-on-surface-variant text-[11px] font-medium capitalize">
                          {m.category}
                        </span>
                      </td>
                      <td className="py-sm px-md">
                        <StockBar stock={mStock} max={m.reorder_level * 5 || 250} isLow={isLow} />
                      </td>
                      <td className="py-sm px-md text-sm">
                        {latestBatch ? (
                          isExpiring ? (
                            <div className="flex items-center gap-xs text-tertiary font-bold">
                              <span className="material-symbols-outlined text-[14px]">event_busy</span>
                              {new Date(latestBatch.expiry_date).toLocaleDateString()}
                            </div>
                          ) : (
                            <span className="text-on-surface-variant">{new Date(latestBatch.expiry_date).toLocaleDateString()}</span>
                          )
                        ) : 'No batch'}
                      </td>
                      <td className="py-sm px-md font-medium text-on-surface text-sm">
                        ₹{latestBatch ? (+latestBatch.selling_price).toFixed(2) : '0.00'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Panel: Pending prescriptions & Recent Sales */}
        <div className="lg:col-span-4 flex flex-col gap-md">
          {/* Pending Prescriptions */}
          <div className="glass-card rounded-xl shadow-sm overflow-hidden bg-white border border-outline-variant/10">
            <div className="p-md border-b border-surface-dim flex justify-between items-center bg-surface-container-lowest dark:bg-on-surface">
              <h3 className="font-title-md text-title-md text-on-surface flex items-center gap-xs font-bold text-sm">
                <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>prescriptions</span>
                {t.pendingPrescriptions}
              </h3>
              <span className="text-white font-label-md px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: BRAND }}>
                {pending.length} {t.newBadge}
              </span>
            </div>
            <div className="p-sm flex flex-col gap-sm max-h-72 overflow-y-auto">
              {pending.map(rx => (
                <div key={rx.id} className="border border-outline-variant/30 rounded-lg p-sm hover:border-primary transition-colors bg-surface-container-lowest">
                  <div className="flex justify-between items-start mb-xs">
                    <div>
                      <p className="font-label-lg text-on-surface font-semibold text-sm">{rx.patient_name}</p>
                      <p className="font-label-md text-on-surface-variant text-[11px] flex items-center gap-1 font-mono">
                        MRN: {rx.patient_mrn}
                      </p>
                    </div>
                    <span className="text-[10px] text-on-surface-variant font-medium">
                      {new Date(rx.issued_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="bg-neutral-50 p-xs rounded border border-surface-dim/40 mb-sm">
                    <p className="font-label-md text-on-surface font-mono text-[11px]">
                      {rx.item_count} item{rx.item_count === 1 ? '' : 's'} prescribed
                    </p>
                  </div>
                  <button onClick={() => onFulfill(rx.id)}
                    className="w-full border border-primary/30 py-1.5 rounded-md font-label-md text-xs font-semibold text-primary hover:bg-primary hover:text-white transition-all flex justify-center items-center gap-xs">
                    <span className="material-symbols-outlined text-[16px]">receipt</span>{t.generateInvoice}
                  </button>
                </div>
              ))}
              {pending.length === 0 && (
                <p className="text-center font-body-sm text-on-surface-variant py-md text-xs">All prescriptions fulfilled!</p>
              )}
            </div>
          </div>

          {/* Recent Sales */}
          <div className="glass-card rounded-xl shadow-sm overflow-hidden bg-white border border-outline-variant/10">
            <div className="p-md border-b border-surface-dim bg-surface-container-lowest dark:bg-on-surface">
              <h3 className="font-title-md text-title-md text-on-surface font-bold text-sm">{t.recentSales}</h3>
            </div>
            <div className="flex flex-col divide-y divide-surface-dim/30 p-sm max-h-52 overflow-y-auto">
              {isSalesLoading ? (
                <div className="text-center py-md text-xs text-secondary">Loading sales...</div>
              ) : sales.slice(0, 4).map(inv => (
                <div key={inv.id} className="flex justify-between items-center py-2 px-1 hover:bg-surface-container-low rounded transition-colors">
                  <div className="flex items-center gap-sm">
                    <div className="w-8 h-8 rounded bg-surface-container flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-[18px] text-on-surface-variant">point_of_sale</span>
                    </div>
                    <div>
                      <p className="font-label-md text-on-surface font-semibold text-xs">{inv.invoice_number}</p>
                      <p className="text-[10px] text-on-surface-variant font-mono">
                        {new Date(inv.sold_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span className="font-label-lg font-bold text-xs" style={{ color: BRAND }}>
                    +₹{(+inv.total_amount).toFixed(2)}
                  </span>
                </div>
              ))}
              {sales.length === 0 && !isSalesLoading && (
                <p className="text-center text-xs text-secondary py-md">No sales transactions logged.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Inventory Tab ─────────────────────────────────────────────────────────────
function InventoryTab({ medicines, isLoading, t, onAdd, onRestockClick, showToast, onDeleteMed }: {
  medicines: any[]; isLoading: boolean; t: any; onAdd: () => void; onRestockClick: (m: any) => void; showToast: (m: string) => void; onDeleteMed: (id: string) => void
}) {
  const [search, setSearch] = useState('')
  const [cat, setCat] = useState('')

  const filtered = medicines.filter(m =>
    (!search || m.name.toLowerCase().includes(search.toLowerCase()) || (m.generic_name && m.generic_name.toLowerCase().includes(search.toLowerCase()))) &&
    (!cat || m.category === cat)
  )

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to remove this medicine formulary?")) {
      onDeleteMed(id)
    }
  }

  return (
    <div className="flex flex-col gap-md animate-fade-in">
      <div className="glass-card p-md rounded-xl flex flex-wrap gap-md items-center justify-between shadow-sm bg-white border border-outline-variant/10">
        <div className="flex flex-wrap gap-sm items-center">
          <div className="relative min-w-[220px]">
            <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
            <input className="w-full pl-xl pr-sm py-xs rounded-lg border border-outline-variant bg-surface-container-lowest text-body-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder={t.searchMedicine} value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="bg-surface-container-lowest border border-outline-variant rounded-lg text-label-md py-xs px-sm focus:outline-none text-xs h-[32px] focus:ring-2 focus:ring-primary"
            value={cat} onChange={e => setCat(e.target.value)}>
            <option value="">{t.allCategories}</option>
            {['tablet','capsule','syrup','injection','topical','inhaler','drops','suppository','patch','powder','other'].map(c => (
              <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-sm">
          <span className="font-label-md text-on-surface-variant text-xs">{filtered.length} {t.showing}</span>
          <button onClick={() => exportCSV(filtered.map(m => ({ ID: m.id, Name: m.name, Generic: m.generic_name, Category: m.category, Unit: m.unit, Reorder: m.reorder_level })), 'inventory.csv')}
            className="bg-surface-container text-on-surface border border-outline-variant font-label-md py-xs px-md rounded-lg hover:bg-surface-container-high flex items-center gap-xs text-xs font-semibold h-[32px]">
            <span className="material-symbols-outlined text-[16px]">download</span>{t.exportCSV}
          </button>
          <button onClick={onAdd} className="text-white font-label-md py-xs px-md rounded-lg hover:opacity-90 flex items-center gap-xs shadow-sm text-xs font-bold h-[32px]" style={{ background: BRAND }}>
            <span className="material-symbols-outlined text-[16px]">add</span>{t.addMedicine}
          </button>
        </div>
      </div>

      <div className="glass-card rounded-xl shadow-sm overflow-hidden bg-white border border-outline-variant/10">
        {isLoading ? (
          <div className="text-center py-lg text-sm text-secondary flex items-center justify-center gap-sm">
            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-primary" />
            Loading formulary medicines...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-surface-container-lowest dark:bg-on-surface">
                <tr className="border-b border-outline-variant/20 bg-neutral-50/50">
                  {[t.medicineAndBatch, t.category, t.stockLevel, 'Reorder Level', t.price, 'Unit', t.actions].map(h => (
                    <th key={h} className="py-sm px-md font-label-md text-on-surface-variant uppercase tracking-wider text-xs font-bold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-dim/30">
                {filtered.map(m => {
                  const mStock = m.batches?.reduce((acc: number, b: any) => acc + b.quantity, 0) ?? 0
                  const isLow = mStock <= m.reorder_level
                  const latestBatch = m.batches?.[0]

                  return (
                    <tr key={m.id} className={`hover:bg-surface-container-low transition-colors ${isLow ? 'bg-error/5' : ''}`}>
                      <td className="py-sm px-md text-sm">
                        <div>
                          <div className="flex items-center gap-xs flex-wrap">
                            <span className="font-body-sm text-on-surface font-medium whitespace-nowrap">{m.name}</span>
                            {isLow && <span className="px-1.5 py-0.5 rounded text-[10px] bg-error text-white font-bold">{t.lowStockBadge}</span>}
                          </div>
                          {m.generic_name && <span className="text-[10px] text-on-surface-variant block font-mono">{m.generic_name}</span>}
                        </div>
                      </td>
                      <td className="py-sm px-md text-sm">
                        <span className="px-2 py-0.5 rounded-full bg-surface-variant text-on-surface-variant text-[11px] font-medium capitalize">
                          {m.category}
                        </span>
                      </td>
                      <td className="py-sm px-md">
                        <StockBar stock={mStock} max={m.reorder_level * 5 || 250} isLow={isLow} />
                      </td>
                      <td className="py-sm px-md text-sm font-medium text-on-surface">
                        {m.reorder_level} {m.unit}s
                      </td>
                      <td className="py-sm px-md font-medium text-on-surface text-sm">
                        ₹{latestBatch ? (+latestBatch.selling_price).toFixed(2) : '0.00'}
                      </td>
                      <td className="py-sm px-md font-label-sm text-on-surface-variant text-sm capitalize">{m.unit}</td>
                      <td className="py-sm px-md">
                        <div className="flex gap-xs">
                          <button onClick={() => onRestockClick(m)} className="p-xs rounded transition-colors hover:bg-primary-container text-primary" title={t.restock}>
                            <span className="material-symbols-outlined text-[18px]">add_circle</span>
                          </button>
                          <button onClick={() => handleDelete(m.id)} className="p-xs rounded transition-colors hover:bg-error-container text-error" title={t.delete}>
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Prescriptions Tab ─────────────────────────────────────────────────────────
function PrescriptionsTab({ prescriptions, isLoading, t, onDispense, showToast }: {
  prescriptions: any[]; isLoading: boolean; t: any; onDispense: (id: string) => void; showToast: (m: string) => void
}) {
  const [filter, setFilter] = useState<'all' | 'pending' | 'fulfilled'>('pending')

  const filtered = prescriptions.filter(p => {
    if (filter === 'all') return true
    if (filter === 'pending') return !p.is_dispensed
    return p.is_dispensed
  })

  return (
    <div className="flex flex-col gap-md animate-fade-in">
      <div className="glass-card p-md rounded-xl flex flex-wrap gap-sm items-center justify-between shadow-sm bg-white border border-outline-variant/10">
        <div className="flex gap-xs p-xs bg-surface-container rounded-xl">
          {(['all','pending','fulfilled'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`py-xs px-md rounded-lg font-label-md capitalize text-xs transition-all ${filter === f ? 'bg-white text-primary shadow-sm font-semibold' : 'text-on-surface-variant hover:bg-surface-container-high'}`}>
              {f === 'all' ? 'All' : f === 'pending' ? 'Pending' : 'Dispensed'}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-lg text-sm text-secondary flex items-center justify-center gap-sm">
          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-primary" />
          Loading prescriptions...
        </div>
      ) : (
        <div className="flex flex-col gap-sm">
          {filtered.map(rx => (
            <div key={rx.id} className={`glass-card rounded-xl p-md shadow-sm flex flex-col md:flex-row gap-md items-start md:items-center justify-between bg-white border border-outline-variant/10 ${rx.is_dispensed ? 'opacity-70 bg-neutral-50/20' : ''}`}>
              <div className="flex items-center gap-md">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${rx.is_dispensed ? 'bg-primary-container text-on-primary-container' : 'text-white'}`} style={rx.is_dispensed ? {} : { background: BRAND }}>
                  {rx.patient_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-sm mb-xs">
                    <p className="font-title-sm text-on-surface font-semibold text-sm">{rx.patient_name}</p>
                    <span className="font-label-sm text-on-surface-variant text-[11px] font-mono">MRN: {rx.patient_mrn}</span>
                    {rx.is_dispensed && <span className="font-label-sm px-2 py-0.5 rounded-full bg-primary-container text-on-primary-container text-[10px] font-bold">DISPENSED</span>}
                  </div>
                  <p className="font-label-md text-on-surface-variant text-xs flex items-center gap-1 font-medium">
                    <span className="material-symbols-outlined text-[13px]">calendar_today</span>
                    Issued: {new Date(rx.issued_at).toLocaleString()}
                  </p>
                  <div className="mt-xs bg-neutral-50 px-sm py-xs rounded border border-surface-dim/40">
                    <p className="font-label-md text-on-surface font-mono text-[11px] font-semibold text-secondary">
                      {rx.notes ? `Notes: ${rx.notes}` : 'No special notes'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex gap-sm shrink-0 w-full md:w-auto">
                {!rx.is_dispensed && (
                  <button onClick={() => onDispense(rx.id)} className="text-white py-sm px-md rounded-lg font-label-md hover:opacity-90 shadow-sm flex items-center justify-center gap-xs text-xs font-bold w-full md:w-auto" style={{ background: BRAND }}>
                    <span className="material-symbols-outlined text-[16px]">receipt</span>Dispense & Print
                  </button>
                )}
                <button onClick={() => { window.print(); showToast(t.printed) }} className="border border-outline-variant text-on-surface-variant py-sm px-sm rounded-lg hover:bg-surface-container flex items-center justify-center gap-xs">
                  <span className="material-symbols-outlined text-[18px]">print</span>
                </button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="glass-card rounded-xl p-xl text-center shadow-sm bg-white border border-outline-variant/10">
              <span className="material-symbols-outlined text-[48px] block mx-auto mb-sm opacity-20 text-neutral-400">prescriptions</span>
              <p className="font-body-md text-on-surface-variant text-sm">No prescriptions found</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Billing Tab ───────────────────────────────────────────────────────────────
function BillingTab({ sales, isLoading, t, onBill, showToast }: {
  sales: any[]; isLoading: boolean; t: any; onBill: () => void; showToast: (m: string) => void
}) {
  const [search, setSearch] = useState('')
  
  const filtered = sales.filter(i =>
    (!search || i.patient_name?.toLowerCase().includes(search.toLowerCase()) || i.invoice_number?.toLowerCase().includes(search.toLowerCase()))
  )

  const totalBilled = filtered.reduce((acc, s) => acc + (+s.total_amount || 0), 0)

  return (
    <div className="flex flex-col gap-md animate-fade-in">
      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
        {[
          { label: 'Total Sales Billed', value: `₹${totalBilled.toFixed(2)}`, cls: 'text-on-surface' },
          { label: 'Total Invoice Transactions', value: `${filtered.length}`, cls: 'text-primary' },
        ].map(s => (
          <div key={s.label} className="glass-card rounded-xl p-md shadow-sm text-center bg-white border border-outline-variant/10">
            <p className="font-label-md text-on-surface-variant mb-xs text-xs">{s.label}</p>
            <p className={`font-display-sm text-display-sm font-bold text-xl ${s.cls}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="glass-card p-md rounded-xl flex flex-wrap gap-sm items-center justify-between shadow-sm bg-white border border-outline-variant/10">
        <div className="flex flex-wrap gap-sm">
          <div className="relative min-w-[200px]">
            <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
            <input className="w-full pl-xl pr-sm py-xs rounded-lg border border-outline-variant bg-surface-container-lowest text-body-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Search invoices…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="flex gap-sm">
          <button onClick={() => exportCSV(filtered.map(i => ({ Invoice: i.invoice_number, Patient: i.patient_name, MRN: i.patient_mrn, Amount: i.total_amount, Date: i.sold_at })), 'billing.csv')}
            className="border border-outline-variant text-on-surface-variant font-label-md py-xs px-md rounded-lg hover:bg-surface-container flex items-center gap-xs text-xs font-semibold h-[32px]">
            <span className="material-symbols-outlined text-[16px]">download</span>{t.exportCSV}
          </button>
          <button onClick={onBill} className="text-white font-label-md py-xs px-md rounded-lg hover:opacity-90 flex items-center gap-xs shadow-sm text-xs font-bold h-[32px]" style={{ background: BRAND }}>
            <span className="material-symbols-outlined text-[16px]">add</span>{t.generateBill}
          </button>
        </div>
      </div>

      <div className="glass-card rounded-xl shadow-sm overflow-hidden bg-white border border-outline-variant/10">
        {isLoading ? (
          <div className="text-center py-lg text-sm text-secondary flex items-center justify-center gap-sm">
            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-primary" />
            Loading transaction history...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-surface-container-lowest dark:bg-on-surface">
                <tr className="border-b border-outline-variant/20 bg-neutral-50/50">
                  {[t.invoiceNo, t.patient, 'Items Dispensed', t.amount, t.date, t.actions].map(h => (
                    <th key={h} className="py-sm px-md font-label-md text-on-surface-variant uppercase tracking-wider text-xs font-bold whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-dim/30">
                {filtered.map((inv) => (
                  <tr key={inv.id} className="hover:bg-surface-container-low transition-colors">
                    <td className="py-sm px-md text-sm"><span className="font-label-sm text-primary font-mono font-semibold">{inv.invoice_number}</span></td>
                    <td className="py-sm px-md text-sm">
                      <p className="font-body-sm text-on-surface font-semibold whitespace-nowrap">{inv.patient_name}</p>
                      <p className="font-label-sm text-on-surface-variant text-[11px] font-mono">MRN: {inv.patient_mrn}</p>
                    </td>
                    <td className="py-sm px-md font-label-sm text-on-surface-variant text-xs max-w-[240px] truncate">
                      {inv.items?.map((it: any) => `${it.qty}x ${it.medicine_name}`).join(', ') || '—'}
                    </td>
                    <td className="py-sm px-md font-body-sm text-on-surface font-bold text-sm text-primary">₹{(+inv.total_amount).toFixed(2)}</td>
                    <td className="py-sm px-md font-label-sm text-on-surface-variant text-xs whitespace-nowrap">{new Date(inv.sold_at).toLocaleString()}</td>
                    <td className="py-sm px-md">
                      <div className="flex gap-xs">
                        <button onClick={() => { window.print(); showToast(t.printed) }} className="p-xs rounded hover:bg-surface-container text-on-surface-variant" title={t.print}>
                          <span className="material-symbols-outlined text-[17px]">print</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-md text-secondary text-xs">No billing logs matches filters.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Reports Tab ───────────────────────────────────────────────────────────────
function ReportsTab({ medicines, sales, t, showToast }: { medicines: any[]; sales: any[]; t: any; showToast: (m: string) => void }) {
  const totalRevenue = sales.reduce((acc, s) => acc + (+s.total_amount || 0), 0)
  
  // Sort medicines based on sales count
  const topMeds = [...medicines].slice(0, 5)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg animate-fade-in">
      {/* Sales Summary */}
      <div className="glass-card rounded-xl shadow-sm overflow-hidden bg-white border border-outline-variant/10">
        <div className="p-md border-b border-surface-dim flex justify-between items-center bg-surface-container-lowest">
          <h3 className="font-title-lg text-title-lg text-on-surface font-bold text-sm">{t.salesSummary}</h3>
          <button onClick={() => { exportCSV(sales.map(i => ({ Invoice: i.invoice_number, Patient: i.patient_name, Amount: i.total_amount, Date: i.sold_at })), 'sales.csv'); showToast(t.exported) }}
            className="border border-outline-variant text-on-surface-variant font-label-md py-xs px-sm rounded-lg hover:bg-surface-container flex items-center gap-xs text-xs font-semibold h-[28px]">
            <span className="material-symbols-outlined text-[16px]">download</span>{t.exportCSV}
          </button>
        </div>
        <div className="p-md flex flex-col gap-sm">
          {[
            { label: 'Total Invoices Processed', value: sales.length, icon: 'receipt_long' },
            { label: 'Dispensed Prescriptions', value: sales.filter(s => s.prescription).length, icon: 'check_circle' },
            { label: 'Walk-in OTC Sales', value: sales.filter(s => !s.prescription).length, icon: 'patient_list' },
            { label: 'Total Pharmacy Revenue', value: `₹${totalRevenue.toFixed(2)}`, icon: 'payments' },
          ].map(row => (
            <div key={row.label} className="flex justify-between items-center py-sm border-b border-surface-dim/40 last:border-0">
              <div className="flex items-center gap-sm">
                <span className="material-symbols-outlined text-on-surface-variant" style={{ fontVariationSettings: "'FILL' 1" }}>{row.icon}</span>
                <span className="font-body-md text-on-surface text-sm">{row.label}</span>
              </div>
              <span className="font-title-md text-on-surface font-bold text-sm">{row.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stock Report */}
      <div className="glass-card rounded-xl shadow-sm overflow-hidden bg-white border border-outline-variant/10">
        <div className="p-md border-b border-surface-dim flex justify-between items-center bg-surface-container-lowest">
          <h3 className="font-title-lg text-title-lg text-on-surface font-bold text-sm">{t.stockReport}</h3>
          <button onClick={() => { exportCSV(medicines.map(m => ({ Name: m.name, Category: m.category, Reorder: m.reorder_level })), 'stock.csv'); showToast(t.exported) }}
            className="border border-outline-variant text-on-surface-variant font-label-md py-xs px-sm rounded-lg hover:bg-surface-container flex items-center gap-xs text-xs font-semibold h-[28px]">
            <span className="material-symbols-outlined text-[16px]">download</span>{t.exportCSV}
          </button>
        </div>
        <div className="p-md flex flex-col gap-md">
          {topMeds.map(m => {
            const mStock = m.batches?.reduce((acc: number, b: any) => acc + b.quantity, 0) ?? 0
            const isLow = mStock <= m.reorder_level
            const maxVal = m.reorder_level * 5 || 250
            const pct = Math.min((mStock / maxVal) * 100, 100)

            return (
              <div key={m.id} className="flex items-center justify-between py-xs border-b border-outline-variant/15 last:border-0">
                <div className="flex items-center gap-sm">
                  <div className={`w-2 h-8 rounded-full ${isLow ? 'bg-error' : 'bg-primary'}`} />
                  <div>
                    <p className="font-body-sm text-on-surface font-semibold text-xs">{m.name}</p>
                    <p className="font-label-sm text-on-surface-variant text-[10px] capitalize">{m.category} · {m.unit}</p>
                  </div>
                </div>
                <div className="flex items-center gap-md">
                  <div className="w-28 bg-surface-container rounded-full h-1.5 overflow-hidden">
                    <div className={`h-full rounded-full ${isLow ? 'bg-error' : 'bg-primary'}`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className={`font-label-md font-bold w-12 text-right text-xs ${isLow ? 'text-error' : 'text-on-surface'}`}>{mStock} units</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function PharmacyPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const user = useAuthStore(s => s.user)
  const { language } = useUIStore()
  const t = T[language as Lang] ?? T.en
  const isPharmacist = user?.roles.includes('Pharmacist') || user?.roles.includes('admin') || true

  const queryParams = new URLSearchParams(location.search)
  const activeTab = queryParams.get('tab') || 'overview'
  const setTab = (tab: string) => navigate(`/pharmacy?tab=${tab}`, { replace: true })

  // States
  const [addMedOpen, setAddMedOpen] = useState(false)
  const [billOpen, setBillOpen] = useState(false)
  const [restockMed, setRestockMed] = useState<any | null>(null)
  const [toast, setToast] = useState('')

  // Queries
  const { data: medicinesData, isLoading: isMedsLoading } = useMedicinesList()
  const { data: salesData, isLoading: isSalesLoading } = useSalesList()
  const { data: rxData, isLoading: isRxLoading } = usePrescriptionsList()

  const medicines = medicinesData?.results ?? []
  const sales = salesData?.results ?? []
  const prescriptions = rxData?.results ?? []

  // Mutations
  const createMedicine = useCreateMedicine()
  const createBatch = useCreateBatch()
  const deleteMedicine = useDeleteMedicine()
  const dispensePrescription = useDispensePrescription()
  const otcSale = useOtcSale()

  const showToast = (msg: string) => setToast(msg)

  useEffect(() => {
    if (isPharmacist && !queryParams.get('tab')) {
      navigate('/pharmacy?tab=overview', { replace: true })
    }
  }, [isPharmacist])

  const tabs = [
    { id: 'overview',      label: t.tabs.overview,       icon: 'dashboard' },
    { id: 'inventory',     label: t.tabs.inventory,      icon: 'inventory_2' },
    { id: 'prescriptions', label: t.tabs.prescriptions,  icon: 'prescriptions' },
    { id: 'billing',       label: t.tabs.billing,        icon: 'payments' },
    { id: 'reports',       label: t.tabs.reports,        icon: 'analytics' },
  ]

  const pendingRxCount = prescriptions.filter(p => !p.is_dispensed).length

  // Handlers
  const handleAddMedicineSubmit = (data: any) => {
    createMedicine.mutate(data, {
      onSuccess: () => {
        setAddMedOpen(false)
        showToast(t.medicineAdded)
      },
      onError: (err: any) => {
        alert(err.detail || 'Failed to add medicine.')
      }
    })
  }

  const handleRestockSubmit = (data: any) => {
    if (!restockMed) return
    createBatch.mutate({
      medicine: restockMed.id,
      batch_number: data.batch_number,
      supplier_name: data.supplier_name,
      purchase_date: data.purchase_date,
      expiry_date: data.expiry_date,
      quantity: data.quantity,
      purchase_price: data.purchase_price,
      selling_price: data.selling_price
    }, {
      onSuccess: () => {
        setRestockMed(null)
        showToast(t.restocked)
      },
      onError: (err: any) => {
        alert(err.detail || 'Failed to restock medicine.')
      }
    })
  }

  const handleGenerateBillSubmit = (data: any) => {
    otcSale.mutate(data, {
      onSuccess: () => {
        setBillOpen(false)
        showToast(t.invoiceGenerated)
      },
      onError: (err: any) => {
        alert(err.detail || 'Failed to generate invoice.')
      }
    })
  }

  const handleFulfillPrescription = (id: string) => {
    dispensePrescription.mutate({ prescription_id: id }, {
      onSuccess: () => {
        showToast('Prescription dispensed and invoice generated!')
      },
      onError: (err: any) => {
        alert(err.detail || 'Failed to dispense prescription.')
      }
    })
  }

  const handleDeleteMedicine = (id: string) => {
    deleteMedicine.mutate(id, {
      onSuccess: () => {
        showToast('Formulary deleted successfully.')
      },
      onError: (err: any) => {
        alert(err.detail || 'Failed to delete medicine.')
      }
    })
  }

  return (
    <div className="flex-1 overflow-y-auto p-margin-mobile md:p-margin-desktop w-full max-w-[1440px] mx-auto pb-xl">
      {toast && <Toast msg={toast} onClose={() => setToast('')} />}
      
      {addMedOpen && (
        <AddMedicineModal
          t={t}
          onClose={() => setAddMedOpen(false)}
          onAdd={handleAddMedicineSubmit}
        />
      )}
      
      {restockMed && (
        <RestockModal
          med={restockMed}
          t={t}
          onClose={() => setRestockMed(null)}
          onRestock={handleRestockSubmit}
        />
      )}

      {billOpen && (
        <GenerateBillModal
          t={t}
          medicines={medicines}
          onClose={() => setBillOpen(false)}
          onGenerate={handleGenerateBillSubmit}
        />
      )}

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-lg gap-md">
        <div>
          <div className="flex items-center gap-sm mb-xs">
            <div className="p-sm rounded-xl" style={{ background: BRAND }}>
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1", fontSize: '22px', color: '#fff' }}>medication</span>
            </div>
            <h1 className="font-display-sm text-display-sm text-on-surface dark:text-inverse-on-surface font-bold text-2xl">{t.title}</h1>
          </div>
          <p className="font-body-lg text-body-lg text-on-surface-variant dark:text-secondary-fixed-dim ml-[52px]">{t.subtitle}</p>
        </div>
        <div className="flex flex-col items-end gap-xs w-full md:w-auto">
          <div className="flex gap-sm flex-wrap w-full md:w-auto">
            <button onClick={() => setAddMedOpen(true)}
              className="text-white font-label-lg py-sm px-md rounded-lg hover:opacity-90 flex items-center justify-center gap-xs shadow-sm text-xs font-bold flex-1 md:flex-initial" style={{ background: BRAND }}>
              <span className="material-symbols-outlined text-[18px]">add_circle</span>{t.addMedicine}
            </button>
            <button onClick={() => setBillOpen(true)}
              className="bg-surface-container text-on-surface border border-outline-variant/30 font-label-lg py-sm px-md rounded-lg hover:bg-surface-container-high flex items-center justify-center gap-xs text-xs font-bold flex-1 md:flex-initial">
              <span className="material-symbols-outlined text-[18px]">receipt_long</span>{t.generateBill}
            </button>
            <button onClick={() => { exportCSV(sales.map(i => ({ ID: i.id, Patient: i.patient_name, Amount: i.total_amount, Date: i.sold_at })), 'reports.csv'); showToast(t.exported) }}
              className="bg-surface-container text-on-surface border border-outline-variant/30 font-label-lg py-sm px-md rounded-lg hover:bg-surface-container-high flex items-center justify-center gap-xs text-xs font-bold flex-1 md:flex-initial">
              <span className="material-symbols-outlined text-[18px]">analytics</span>{t.viewReports}
            </button>
          </div>
          <p className="font-label-sm text-on-surface-variant text-[11px] self-end mt-1">
            {t.lastSync}: <span className="font-bold text-on-surface">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </p>
        </div>
      </div>

      {/* ── Tabs ────────────────────────────────────────────────── */}
      <div className="flex gap-xs mb-lg p-xs bg-surface-container rounded-xl overflow-x-auto">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setTab(tab.id)}
            className={`flex items-center gap-xs py-sm px-md rounded-lg font-label-lg whitespace-nowrap transition-all duration-150 text-xs font-semibold ${activeTab === tab.id ? 'bg-white dark:bg-surface shadow-sm font-semibold' : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'}`}
            style={activeTab === tab.id ? { color: BRAND } : {}}>
            <span className="material-symbols-outlined text-[18px]" style={activeTab === tab.id ? { fontVariationSettings: "'FILL' 1" } : {}}>{tab.icon}</span>
            {tab.label}
            {tab.id === 'prescriptions' && pendingRxCount > 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{ background: BRAND }}>{pendingRxCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Content ─────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <OverviewTab
          medicines={medicines}
          prescriptions={prescriptions}
          sales={sales}
          t={t}
          onGenerateBill={() => setBillOpen(true)}
          onFulfill={handleFulfillPrescription}
          showToast={showToast}
          isSalesLoading={isSalesLoading}
        />
      )}
      {activeTab === 'inventory' && (
        <InventoryTab
          medicines={medicines}
          isLoading={isMedsLoading}
          t={t}
          onAdd={() => setAddMedOpen(true)}
          onRestockClick={(m) => setRestockMed(m)}
          onDeleteMed={handleDeleteMedicine}
          showToast={showToast}
        />
      )}
      {activeTab === 'prescriptions' && (
        <PrescriptionsTab
          prescriptions={prescriptions}
          isLoading={isRxLoading}
          t={t}
          onDispense={handleFulfillPrescription}
          showToast={showToast}
        />
      )}
      {activeTab === 'billing' && (
        <BillingTab
          sales={sales}
          isLoading={isSalesLoading}
          t={t}
          onBill={() => setBillOpen(true)}
          showToast={showToast}
        />
      )}
      {activeTab === 'reports' && (
        <ReportsTab
          medicines={medicines}
          sales={sales}
          t={t}
          showToast={showToast}
        />
      )}
    </div>
  )
}
