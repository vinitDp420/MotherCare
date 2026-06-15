/**
 * PharmacyPage — Full Pharmacy Management Module
 * Tabs: Overview | Inventory | Prescriptions | Billing | Reports
 * Features: Working buttons, modals, state mgmt, EN/MR/HI translations
 */
import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'

// ─── Brand color ──────────────────────────────────────────────────────────────
const BRAND = '#5b4fcf'

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
    addMedicineTitle: 'Add New Medicine', medicineName: 'Medicine Name', batchNo: 'Batch No.',
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
    addMedicineTitle: 'नवीन औषध जोडा', medicineName: 'औषधाचे नाव', batchNo: 'बॅच क्र.',
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
    addMedicineTitle: 'नई दवा जोड़ें', medicineName: 'दवा का नाम', batchNo: 'बैच नं.',
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

// ─── Types ─────────────────────────────────────────────────────────────────────
type MedCategory = 'Vitamin' | 'Antibiotic' | 'Painkiller' | 'Mineral' | 'Hormone' | 'Antacid' | 'Supplement'
type BillStatus = 'paid' | 'unpaid' | 'partial'

interface Medicine {
  id: string; name: string; batch: string; category: MedCategory
  stock: number; maxStock: number; expiry: string; price: number
  supplier: string; isLowStock?: boolean; isExpiringSoon?: boolean
}

interface Prescription {
  id: string; patient: string; patientId: string; doctor: string
  medicines: string; time: string; fulfilled: boolean
}

interface Invoice {
  id: string; patient: string; patientId: string; amount: number
  status: BillStatus; date: string; items: string
}

// ─── Initial Data ──────────────────────────────────────────────────────────────
const INIT_MEDICINES: Medicine[] = [
  { id: 'M001', name: 'Prenatal Vitamins Plus', batch: 'MC-2023-X92', category: 'Vitamin',    stock: 340, maxStock: 400, expiry: 'Dec 2025', price: 24.99, supplier: 'HealthPlus',  isLowStock: false },
  { id: 'M002', name: 'Amoxicillin 500mg',      batch: 'AB-8821-L0',  category: 'Antibiotic', stock: 12,  maxStock: 200, expiry: 'Aug 2024', price: 12.50, supplier: 'MedBridge',  isLowStock: true  },
  { id: 'M003', name: 'Ibuprofen 400mg',        batch: 'PK-3342-M1',  category: 'Painkiller', stock: 150, maxStock: 250, expiry: 'Jan 2026', price: 8.99,  supplier: 'PharmaCo',   isLowStock: false },
  { id: 'M004', name: 'Iron Supplements',        batch: 'MN-9001-S3',  category: 'Mineral',    stock: 89,  maxStock: 200, expiry: 'Nov 2023', price: 15.00, supplier: 'NutriCare',  isLowStock: false, isExpiringSoon: true },
  { id: 'M005', name: 'Folic Acid 5mg',          batch: 'FA-1122-P9',  category: 'Vitamin',    stock: 18,  maxStock: 300, expiry: 'Mar 2026', price: 5.50,  supplier: 'HealthPlus',  isLowStock: true  },
  { id: 'M006', name: 'Metformin 500mg',         batch: 'MF-4421-D2',  category: 'Supplement', stock: 220, maxStock: 300, expiry: 'Sep 2025', price: 18.00, supplier: 'DiaCare',    isLowStock: false },
  { id: 'M007', name: 'Progesterone 200mg',      batch: 'PG-7731-H1',  category: 'Hormone',    stock: 75,  maxStock: 150, expiry: 'Jun 2025', price: 45.00, supplier: 'HormaCo',    isLowStock: false },
  { id: 'M008', name: 'Omeprazole 20mg',         batch: 'OM-5512-G4',  category: 'Antacid',    stock: 9,   maxStock: 200, expiry: 'Dec 2025', price: 7.50,  supplier: 'PharmaCo',   isLowStock: true  },
]

const INIT_PRESCRIPTIONS: Prescription[] = [
  { id: 'RX-1001', patient: 'Emma Watson',     patientId: 'MC-4901', doctor: 'Dr. Sarah Jenkins', medicines: '1x Prenatal Vitamins, 1x Iron',      time: '10m ago', fulfilled: false },
  { id: 'RX-1002', patient: 'Sophia Martinez', patientId: 'MC-5034', doctor: 'Dr. Alan Smith',    medicines: '2x Folic Acid 5mg, 1x Progesterone',  time: '1h ago',  fulfilled: false },
  { id: 'RX-1003', patient: 'Priya Rajan',     patientId: 'MC-4877', doctor: 'Dr. Patel',         medicines: '1x Metformin 500mg, 1x Omeprazole',   time: '2h ago',  fulfilled: false },
  { id: 'RX-1004', patient: 'Meera Kapoor',    patientId: 'MC-5012', doctor: 'Dr. Sharma',        medicines: '3x Ibuprofen 400mg',                  time: '3h ago',  fulfilled: true  },
]

const INIT_INVOICES: Invoice[] = [
  { id: 'INV-2045', patient: 'Emma Watson',     patientId: 'MC-4901', amount: 45.50,  status: 'paid',    date: 'Just now',   items: 'Prenatal Vitamins, Iron' },
  { id: 'INV-2044', patient: 'Meera Kapoor',    patientId: 'MC-5012', amount: 12.00,  status: 'paid',    date: '15m ago',    items: 'Ibuprofen 400mg' },
  { id: 'INV-2043', patient: 'Sunita Rao',      patientId: 'MC-4803', amount: 120.90, status: 'paid',    date: '1h ago',     items: 'Progesterone, Folic Acid' },
  { id: 'INV-2042', patient: 'Anita Bose',      patientId: 'MC-5034', amount: 67.00,  status: 'unpaid',  date: 'Yesterday',  items: 'Amoxicillin 500mg' },
  { id: 'INV-2041', patient: 'Kavya Nair',      patientId: 'MC-4755', amount: 89.50,  status: 'partial', date: 'Yesterday',  items: 'Metformin, Omeprazole' },
]

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
        <div className={`h-full rounded-full ${isLow ? 'bg-error' : pct > 60 ? 'bg-primary' : 'bg-tertiary'}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`font-label-md w-8 text-right ${isLow ? 'text-error font-bold' : 'text-on-surface-variant'}`}>{stock}</span>
    </div>
  )
}

function BillStatusBadge({ status, t }: { status: BillStatus; t: typeof T['en'] }) {
  const cfg: Record<BillStatus, string> = {
    paid:    'bg-primary-container text-on-primary-container',
    unpaid:  'bg-error-container text-error font-semibold',
    partial: 'bg-tertiary-container text-on-tertiary-container',
  }
  const lbl: Record<BillStatus, string> = { paid: t.paid, unpaid: t.unpaid, partial: t.partial }
  return <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${cfg[status]}`}>{lbl[status]}</span>
}

function exportCSV(rows: Record<string, unknown>[], filename: string) {
  const headers = Object.keys(rows[0])
  const csv = [headers, ...rows.map(r => headers.map(h => `"${r[h]}"`))]
    .map(r => r.join(',')).join('\n')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
  a.download = filename; a.click()
}

// ─── Add Medicine Modal ────────────────────────────────────────────────────────
function AddMedicineModal({ t, onClose, onAdd }: { t: typeof T['en']; onClose: () => void; onAdd: (m: Medicine) => void }) {
  const [f, setF] = useState({ name: '', batch: '', category: 'Vitamin' as MedCategory, stock: '', maxStock: '', expiry: '', price: '', supplier: '' })
  const up = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF(p => ({ ...p, [k]: e.target.value }))
  const submit = () => {
    if (!f.name || !f.stock) return
    onAdd({ id: `M${Date.now()}`, name: f.name, batch: f.batch || `B-${Date.now()}`, category: f.category, stock: +f.stock, maxStock: +f.maxStock || 200, expiry: f.expiry || 'Dec 2025', price: +f.price || 0, supplier: f.supplier })
    onClose()
  }
  return (
    <Modal title={t.addMedicineTitle} onClose={onClose}>
      <div className="flex flex-col gap-md">
        <div className="grid grid-cols-2 gap-md">
          <div className="col-span-2"><label className={labelCls}>{t.medicineName} *</label><input className={inputCls} value={f.name} onChange={up('name')} /></div>
          <div><label className={labelCls}>{t.batchNo}</label><input className={inputCls} value={f.batch} onChange={up('batch')} placeholder="MC-XXXX-X00" /></div>
          <div><label className={labelCls}>{t.categoryLabel}</label>
            <select className={inputCls} value={f.category} onChange={up('category')}>
              {['Vitamin','Antibiotic','Painkiller','Mineral','Hormone','Antacid','Supplement'].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div><label className={labelCls}>{t.stockQty} *</label><input className={inputCls} type="number" value={f.stock} onChange={up('stock')} /></div>
          <div><label className={labelCls}>{t.expiryDate}</label><input className={inputCls} value={f.expiry} onChange={up('expiry')} placeholder="Jan 2026" /></div>
          <div><label className={labelCls}>{t.priceLabel}</label><input className={inputCls} type="number" value={f.price} onChange={up('price')} /></div>
          <div><label className={labelCls}>{t.supplier}</label><input className={inputCls} value={f.supplier} onChange={up('supplier')} /></div>
        </div>
        <div className="flex gap-sm pt-sm">
          <button onClick={onClose} className="flex-1 py-sm rounded-lg border border-outline-variant text-on-surface-variant font-label-lg hover:bg-surface-container">{t.cancel}</button>
          <button onClick={submit} className="flex-1 py-sm rounded-lg text-white font-label-lg hover:opacity-90 shadow-sm" style={{ background: BRAND }}>{t.addBtn}</button>
        </div>
      </div>
    </Modal>
  )
}

// ─── Restock Modal ─────────────────────────────────────────────────────────────
function RestockModal({ med, t, onClose, onRestock }: { med: Medicine; t: typeof T['en']; onClose: () => void; onRestock: (id: string, qty: number) => void }) {
  const [qty, setQty] = useState('50')
  return (
    <Modal title={`${t.restockTitle} — ${med.name}`} onClose={onClose}>
      <div className="flex flex-col gap-md">
        <div className="p-sm rounded-lg bg-surface-container flex justify-between items-center">
          <div><p className="font-body-md text-on-surface font-semibold">{med.name}</p><p className="font-label-sm text-on-surface-variant">{med.batch}</p></div>
          <div className="text-right"><p className="font-label-sm text-on-surface-variant">Current</p><p className="font-title-lg text-on-surface font-bold">{med.stock}</p></div>
        </div>
        <div><label className={labelCls}>{t.restockQty}</label><input className={inputCls} type="number" value={qty} onChange={e => setQty(e.target.value)} min="1" /></div>
        <div className="p-sm rounded-lg bg-primary-container/30 flex justify-between">
          <span className="font-label-md text-on-surface-variant">New Stock Total</span>
          <span className="font-title-md text-on-surface font-bold">{med.stock + (+qty || 0)}</span>
        </div>
        <div className="flex gap-sm pt-sm">
          <button onClick={onClose} className="flex-1 py-sm rounded-lg border border-outline-variant text-on-surface-variant font-label-lg hover:bg-surface-container">{t.cancel}</button>
          <button onClick={() => { onRestock(med.id, +qty); onClose() }} className="flex-1 py-sm rounded-lg text-white font-label-lg hover:opacity-90 shadow-sm" style={{ background: BRAND }}>{t.confirm}</button>
        </div>
      </div>
    </Modal>
  )
}

// ─── Generate Bill Modal ───────────────────────────────────────────────────────
function GenerateBillModal({ t, medicines, onClose, onGenerate }: { t: typeof T['en']; medicines: Medicine[]; onClose: () => void; onGenerate: (inv: Invoice) => void }) {
  const [patient, setPatient] = useState(''); const [patientId, setPatientId] = useState('')
  const [doctor, setDoctor] = useState(''); const [selected, setSelected] = useState<{ med: Medicine; qty: number }[]>([])

  const toggle = (med: Medicine) => setSelected(prev => prev.find(s => s.med.id === med.id) ? prev.filter(s => s.med.id !== med.id) : [...prev, { med, qty: 1 }])
  const setQty = (id: string, qty: number) => setSelected(prev => prev.map(s => s.med.id === id ? { ...s, qty } : s))
  const total = selected.reduce((a, s) => a + s.med.price * s.qty, 0)

  const submit = () => {
    if (!patient || selected.length === 0) return
    const inv: Invoice = {
      id: `INV-${2050 + Math.floor(Math.random() * 100)}`, patient, patientId: patientId || 'MC-????',
      amount: total, status: 'unpaid', date: 'Just now',
      items: selected.map(s => `${s.qty}x ${s.med.name}`).join(', ')
    }
    onGenerate(inv); onClose()
  }

  return (
    <Modal title={t.billTitle} onClose={onClose} wide>
      <div className="flex flex-col gap-md">
        <div className="grid grid-cols-3 gap-md">
          <div className="col-span-2"><label className={labelCls}>{t.patientNameLabel} *</label><input className={inputCls} value={patient} onChange={e => setPatient(e.target.value)} /></div>
          <div><label className={labelCls}>{t.patientIdLabel}</label><input className={inputCls} value={patientId} onChange={e => setPatientId(e.target.value)} placeholder="MC-XXXX" /></div>
          <div className="col-span-3"><label className={labelCls}>{t.prescribedBy}</label><input className={inputCls} value={doctor} onChange={e => setDoctor(e.target.value)} placeholder="Dr. Name" /></div>
        </div>
        <div>
          <label className={labelCls}>{t.items}</label>
          <div className="max-h-48 overflow-auto border border-outline-variant rounded-lg divide-y divide-outline-variant">
            {medicines.map(m => {
              const sel = selected.find(s => s.med.id === m.id)
              return (
                <div key={m.id} className={`flex items-center justify-between p-sm cursor-pointer hover:bg-surface-container transition-colors ${sel ? 'bg-primary-container/20' : ''}`} onClick={() => toggle(m)}>
                  <div className="flex items-center gap-sm">
                    <input type="checkbox" checked={!!sel} onChange={() => toggle(m)} className="w-4 h-4 rounded" onClick={e => e.stopPropagation()} />
                    <div><p className="font-body-sm text-on-surface font-medium">{m.name}</p><p className="font-label-sm text-on-surface-variant">{m.category} · ₹{m.price}</p></div>
                  </div>
                  {sel && <input type="number" min="1" max={m.stock} value={sel.qty} onChange={e => { e.stopPropagation(); setQty(m.id, +e.target.value) }}
                    className="w-16 px-xs py-0.5 rounded border border-outline-variant text-center text-body-sm focus:outline-none" onClick={e => e.stopPropagation()} />}
                </div>
              )
            })}
          </div>
        </div>
        <div className="flex justify-between p-sm rounded-lg bg-surface-container">
          <span className="font-title-md text-on-surface font-bold">{t.total}</span>
          <span className="font-title-lg text-on-surface font-bold" style={{ color: BRAND }}>₹{total.toFixed(2)}</span>
        </div>
        <div className="flex gap-sm">
          <button onClick={onClose} className="flex-1 py-sm rounded-lg border border-outline-variant text-on-surface-variant font-label-lg hover:bg-surface-container">{t.cancel}</button>
          <button onClick={submit} className="flex-1 py-sm rounded-lg text-white font-label-lg hover:opacity-90 shadow-sm" style={{ background: BRAND }}>
            <span className="flex items-center justify-center gap-xs"><span className="material-symbols-outlined text-[16px]">receipt_long</span>{t.billBtn}</span>
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ─── Overview Tab ──────────────────────────────────────────────────────────────
function OverviewTab({ medicines, prescriptions, invoices, t, onGenerateBill, onFulfill, showToast }: {
  medicines: Medicine[]; prescriptions: Prescription[]; invoices: Invoice[]
  t: typeof T['en']; onGenerateBill: () => void; onFulfill: (id: string) => void; showToast: (m: string) => void
}) {
  const totalMeds = medicines.reduce((a, m) => a + m.stock, 0)
  const lowCount = medicines.filter(m => m.isLowStock).length
  const expCount = medicines.filter(m => m.isExpiringSoon).length
  const todaySale = invoices.filter(i => i.date === 'Just now' || i.date.includes('m ago') || i.date.includes('h ago')).reduce((a, i) => a + i.amount, 0)
  const pending = prescriptions.filter(p => !p.fulfilled)

  const stats = [
    { label: t.totalMedicines, value: `${totalMeds.toLocaleString()}`, sub: `+12 ${t.thisWeek}`, subCls: 'text-primary', icon: 'pill', iconBg: 'bg-secondary-container text-on-secondary-container' },
    { label: t.lowStock, value: `${lowCount}`, sub: t.actionRequired, subCls: 'text-error', icon: 'production_quantity_limits', iconBg: 'bg-error-container text-on-error-container' },
    { label: t.expiringSoon, value: `${expCount}`, sub: t.reviewNeeded, subCls: 'text-tertiary', icon: 'hourglass_bottom', iconBg: 'bg-tertiary-container text-on-tertiary-container' },
    { label: t.todaySales, value: `₹${todaySale.toFixed(0)}`, sub: `42 ${t.transactions}`, subCls: 'text-primary', icon: 'payments', iconBg: 'bg-primary-container text-on-primary-container' },
  ]

  return (
    <div className="flex flex-col gap-lg">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-md">
        {stats.map(s => (
          <div key={s.label} className="glass-card rounded-xl p-md flex items-start justify-between shadow-sm hover:shadow-md transition-shadow">
            <div>
              <p className="font-label-md text-on-surface-variant mb-xs">{s.label}</p>
              <h3 className="font-display-sm text-display-sm text-on-surface">{s.value}</h3>
              <p className={`font-label-md flex items-center gap-xs mt-xs ${s.subCls}`}>
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
        {/* Inventory table */}
        <div className="lg:col-span-8 glass-card rounded-xl shadow-sm overflow-hidden">
          <div className="p-md border-b border-surface-dim flex justify-between items-center bg-surface-container-lowest dark:bg-on-surface">
            <h3 className="font-title-lg text-title-lg text-on-surface">{t.inventoryStatus}</h3>
            <button className="font-label-lg text-primary hover:underline" onClick={onGenerateBill}>{t.viewAll}</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-surface-container-lowest dark:bg-on-surface">
                <tr>{[t.medicineAndBatch, t.category, t.stockLevel, t.expiry, t.price].map(h => (
                  <th key={h} className="py-sm px-md font-label-md text-on-surface-variant uppercase tracking-wider border-b border-surface-dim">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-surface-dim">
                {medicines.slice(0, 6).map(m => (
                  <tr key={m.id} className={`hover:bg-surface-container-low transition-colors ${m.isLowStock ? 'bg-error/5' : m.isExpiringSoon ? 'bg-tertiary/5' : ''}`}>
                    <td className="py-sm px-md">
                      <div className="flex items-center gap-xs">
                        <div>
                          <div className="flex items-center gap-xs">
                            <span className="font-body-sm text-on-surface font-medium">{m.name}</span>
                            {m.isLowStock && <span className="px-1.5 py-0.5 rounded text-[10px] bg-error text-white font-bold uppercase">{t.lowStockBadge}</span>}
                            {m.isExpiringSoon && <span className="px-1.5 py-0.5 rounded text-[10px] bg-tertiary text-white font-bold uppercase">{t.expiringSoonBadge}</span>}
                          </div>
                          <span className="text-[10px] font-mono text-on-surface-variant">{m.batch}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-sm px-md"><span className="px-2 py-1 rounded-full bg-surface-variant text-on-surface-variant font-label-md text-label-md">{m.category}</span></td>
                    <td className="py-sm px-md"><StockBar stock={m.stock} max={m.maxStock} isLow={m.isLowStock} /></td>
                    <td className="py-sm px-md">
                      {m.isExpiringSoon ? (
                        <div className="flex items-center gap-xs text-tertiary font-bold">
                          <span className="material-symbols-outlined text-[14px]">event_busy</span>{m.expiry}
                        </div>
                      ) : <span className="text-on-surface-variant">{m.expiry}</span>}
                    </td>
                    <td className="py-sm px-md font-medium text-on-surface">₹{m.price.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right panel */}
        <div className="lg:col-span-4 flex flex-col gap-md">
          {/* Pending Prescriptions */}
          <div className="glass-card rounded-xl shadow-sm overflow-hidden">
            <div className="p-md border-b border-surface-dim flex justify-between items-center bg-surface-container-lowest dark:bg-on-surface">
              <h3 className="font-title-md text-title-md text-on-surface flex items-center gap-xs">
                <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>prescriptions</span>
                {t.pendingPrescriptions}
              </h3>
              <span className="text-white font-label-md px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: BRAND }}>{pending.length} {t.newBadge}</span>
            </div>
            <div className="p-sm flex flex-col gap-sm max-h-72 overflow-auto">
              {pending.map(rx => (
                <div key={rx.id} className="border border-outline-variant rounded-lg p-sm hover:border-primary transition-colors">
                  <div className="flex justify-between items-start mb-xs">
                    <div>
                      <p className="font-label-lg text-on-surface font-semibold">{rx.patient}</p>
                      <p className="font-label-md text-on-surface-variant flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px]">stethoscope</span>{rx.doctor}
                      </p>
                    </div>
                    <span className="font-label-md text-on-surface-variant text-xs">{rx.time}</span>
                  </div>
                  <div className="bg-surface-container p-xs rounded border border-surface-dim mb-sm">
                    <p className="font-label-md text-on-surface font-mono text-[11px] truncate">{rx.medicines}</p>
                  </div>
                  <button onClick={() => { onFulfill(rx.id); showToast(t.markedFulfilled) }}
                    className="w-full border border-outline-variant py-1.5 rounded-md font-label-md transition-colors flex justify-center items-center gap-xs text-primary hover:text-white hover:border-transparent"
                    style={{ '--hover-bg': BRAND } as React.CSSProperties}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = BRAND; (e.currentTarget as HTMLButtonElement).style.color = '#fff' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = ''; (e.currentTarget as HTMLButtonElement).style.color = '' }}>
                    <span className="material-symbols-outlined text-[16px]">receipt</span>{t.generateInvoice}
                  </button>
                </div>
              ))}
              {pending.length === 0 && <p className="text-center font-body-sm text-on-surface-variant py-md">All prescriptions fulfilled!</p>}
            </div>
          </div>

          {/* Recent Sales */}
          <div className="glass-card rounded-xl shadow-sm overflow-hidden">
            <div className="p-md border-b border-surface-dim bg-surface-container-lowest dark:bg-on-surface">
              <h3 className="font-title-md text-title-md text-on-surface">{t.recentSales}</h3>
            </div>
            <div className="flex flex-col divide-y divide-surface-dim p-sm">
              {invoices.slice(0, 3).map(inv => (
                <div key={inv.id} className="flex justify-between items-center py-2 px-1 hover:bg-surface-container-low rounded transition-colors">
                  <div className="flex items-center gap-sm">
                    <div className="w-8 h-8 rounded bg-surface-container flex items-center justify-center">
                      <span className="material-symbols-outlined text-[18px] text-on-surface-variant">point_of_sale</span>
                    </div>
                    <div>
                      <p className="font-label-md text-on-surface font-semibold">{inv.id}</p>
                      <p className="text-[10px] text-on-surface-variant">{inv.date}</p>
                    </div>
                  </div>
                  <span className="font-label-lg font-medium" style={{ color: BRAND }}>+₹{inv.amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="p-sm text-center border-t border-surface-dim">
              <button onClick={() => showToast(t.viewAllTx)} className="font-label-md text-on-surface-variant hover:text-primary transition-colors">{t.viewAllTx}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Inventory Tab ─────────────────────────────────────────────────────────────
function InventoryTab({ medicines, setMedicines, t, onAdd, showToast }: {
  medicines: Medicine[]; setMedicines: React.Dispatch<React.SetStateAction<Medicine[]>>
  t: typeof T['en']; onAdd: () => void; showToast: (m: string) => void
}) {
  const [search, setSearch] = useState(''); const [cat, setCat] = useState('')
  const [restockMed, setRestockMed] = useState<Medicine | null>(null)

  const filtered = medicines.filter(m =>
    (!search || m.name.toLowerCase().includes(search.toLowerCase()) || m.batch.toLowerCase().includes(search.toLowerCase())) &&
    (!cat || m.category === cat)
  )

  const doRestock = (id: string, qty: number) => {
    setMedicines(prev => prev.map(m => m.id === id ? { ...m, stock: m.stock + qty, isLowStock: m.stock + qty >= 20 ? false : m.isLowStock } : m))
    showToast(t.restocked)
  }

  const doDelete = (id: string) => { setMedicines(prev => prev.filter(m => m.id !== id)); showToast(t.deleted) }

  return (
    <div className="flex flex-col gap-md">
      {restockMed && <RestockModal med={restockMed} t={t} onClose={() => setRestockMed(null)} onRestock={doRestock} />}

      <div className="glass-card p-md rounded-xl flex flex-wrap gap-md items-center justify-between shadow-sm">
        <div className="flex flex-wrap gap-sm items-center">
          <div className="relative min-w-[220px]">
            <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
            <input className="w-full pl-xl pr-sm py-xs rounded-lg border border-outline-variant bg-surface-container-lowest text-body-sm focus:outline-none focus:ring-2"
              placeholder={t.searchMedicine} value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="bg-surface-container-lowest border border-outline-variant rounded-lg text-label-md py-xs px-sm focus:outline-none"
            value={cat} onChange={e => setCat(e.target.value)}>
            <option value="">{t.allCategories}</option>
            {['Vitamin','Antibiotic','Painkiller','Mineral','Hormone','Antacid','Supplement'].map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-sm">
          <span className="font-label-md text-on-surface-variant">{filtered.length} {t.showing}</span>
          <button onClick={() => exportCSV(filtered.map(m => ({ ID: m.id, Name: m.name, Batch: m.batch, Category: m.category, Stock: m.stock, Expiry: m.expiry, Price: m.price })), 'inventory.csv')}
            className="bg-surface-container text-on-surface border border-outline-variant font-label-md py-xs px-md rounded-lg hover:bg-surface-container-high flex items-center gap-xs">
            <span className="material-symbols-outlined text-[16px]">download</span>{t.exportCSV}
          </button>
          <button onClick={onAdd} className="text-white font-label-md py-xs px-md rounded-lg hover:opacity-90 flex items-center gap-xs shadow-sm" style={{ background: BRAND }}>
            <span className="material-symbols-outlined text-[16px]">add</span>{t.addMedicine}
          </button>
        </div>
      </div>

      <div className="glass-card rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-surface-container-lowest dark:bg-on-surface">
              <tr>{[t.medicineAndBatch, t.category, t.stockLevel, t.expiry, t.price, t.supplier, t.actions].map(h => (
                <th key={h} className="py-sm px-md font-label-md text-on-surface-variant uppercase tracking-wider border-b border-surface-dim font-semibold">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-surface-dim">
              {filtered.map(m => (
                <tr key={m.id} className={`hover:bg-surface-container-low transition-colors ${m.isLowStock ? 'bg-error/5' : m.isExpiringSoon ? 'bg-tertiary/5' : ''}`}>
                  <td className="py-sm px-md">
                    <div className="flex items-center gap-xs">
                      <div>
                        <div className="flex items-center gap-xs flex-wrap">
                          <span className="font-body-sm text-on-surface font-medium whitespace-nowrap">{m.name}</span>
                          {m.isLowStock && <span className="px-1.5 py-0.5 rounded text-[10px] bg-error text-white font-bold">{t.lowStockBadge}</span>}
                          {m.isExpiringSoon && <span className="px-1.5 py-0.5 rounded text-[10px] bg-tertiary text-white font-bold">{t.expiringSoonBadge}</span>}
                        </div>
                        <span className="text-[10px] font-mono text-on-surface-variant">{m.batch}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-sm px-md"><span className="px-2 py-1 rounded-full bg-surface-variant text-on-surface-variant font-label-md">{m.category}</span></td>
                  <td className="py-sm px-md"><StockBar stock={m.stock} max={m.maxStock} isLow={m.isLowStock} /></td>
                  <td className="py-sm px-md">
                    {m.isExpiringSoon ? <div className="flex items-center gap-xs text-tertiary font-bold"><span className="material-symbols-outlined text-[14px]">event_busy</span>{m.expiry}</div>
                      : <span className="text-on-surface-variant">{m.expiry}</span>}
                  </td>
                  <td className="py-sm px-md font-medium text-on-surface">₹{m.price.toFixed(2)}</td>
                  <td className="py-sm px-md font-label-sm text-on-surface-variant">{m.supplier}</td>
                  <td className="py-sm px-md">
                    <div className="flex gap-xs">
                      <button onClick={() => setRestockMed(m)} className="p-xs rounded transition-colors hover:bg-primary-container text-primary" title={t.restock}><span className="material-symbols-outlined text-[18px]">add_circle</span></button>
                      <button onClick={() => doDelete(m.id)} className="p-xs rounded transition-colors hover:bg-error-container text-error" title={t.delete}><span className="material-symbols-outlined text-[18px]">delete</span></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ─── Prescriptions Tab ─────────────────────────────────────────────────────────
function PrescriptionsTab({ prescriptions, setPrescriptions, invoices, setInvoices, t, showToast, onBill }: {
  prescriptions: Prescription[]; setPrescriptions: React.Dispatch<React.SetStateAction<Prescription[]>>
  invoices: Invoice[]; setInvoices: React.Dispatch<React.SetStateAction<Invoice[]>>
  t: typeof T['en']; showToast: (m: string) => void; onBill: () => void
}) {
  const [filter, setFilter] = useState<'all' | 'pending' | 'fulfilled'>('all')
  const filtered = prescriptions.filter(p => filter === 'all' ? true : filter === 'pending' ? !p.fulfilled : p.fulfilled)

  const fulfill = (id: string) => {
    setPrescriptions(prev => prev.map(p => p.id === id ? { ...p, fulfilled: true } : p))
    const rx = prescriptions.find(p => p.id === id)!
    const inv: Invoice = { id: `INV-${2060 + invoices.length}`, patient: rx.patient, patientId: rx.patientId, amount: Math.random() * 80 + 20, status: 'unpaid', date: 'Just now', items: rx.medicines }
    setInvoices(prev => [inv, ...prev])
    showToast(t.invoiceGenerated)
  }

  return (
    <div className="flex flex-col gap-md">
      <div className="glass-card p-md rounded-xl flex flex-wrap gap-sm items-center justify-between shadow-sm">
        <div className="flex gap-xs p-xs bg-surface-container rounded-xl">
          {(['all','pending','fulfilled'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`py-xs px-md rounded-lg font-label-md capitalize transition-all ${filter === f ? 'bg-white text-primary shadow-sm font-semibold' : 'text-on-surface-variant hover:bg-surface-container-high'}`}>
              {f === 'all' ? 'All' : f === 'pending' ? t.pendingPrescriptions.split(' ')[0] : t.dispensed}
            </button>
          ))}
        </div>
        <button onClick={onBill} className="text-white font-label-md py-xs px-md rounded-lg hover:opacity-90 flex items-center gap-xs shadow-sm" style={{ background: BRAND }}>
          <span className="material-symbols-outlined text-[16px]">receipt_long</span>{t.generateBill}
        </button>
      </div>

      <div className="flex flex-col gap-sm">
        {filtered.map(rx => (
          <div key={rx.id} className={`glass-card rounded-xl p-md shadow-sm flex flex-col md:flex-row gap-md items-start md:items-center justify-between ${rx.fulfilled ? 'opacity-70' : ''}`}>
            <div className="flex items-center gap-md">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${rx.fulfilled ? 'bg-primary-container text-on-primary-container' : 'text-white'}`} style={rx.fulfilled ? {} : { background: BRAND }}>
                {rx.patient.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div>
                <div className="flex items-center gap-sm mb-xs">
                  <p className="font-title-sm text-on-surface font-semibold">{rx.patient}</p>
                  <span className="font-label-sm text-on-surface-variant text-xs">{rx.patientId}</span>
                  {rx.fulfilled && <span className="font-label-sm px-2 py-0.5 rounded-full bg-primary-container text-on-primary-container text-xs">{t.dispensed}</span>}
                </div>
                <p className="font-label-md text-on-surface-variant flex items-center gap-1">
                  <span className="material-symbols-outlined text-[13px]">stethoscope</span>{rx.doctor} · {rx.time}
                </p>
                <div className="mt-xs bg-surface-container p-xs rounded border border-surface-dim">
                  <p className="font-label-md text-on-surface font-mono text-[11px]">{rx.medicines}</p>
                </div>
              </div>
            </div>
            <div className="flex gap-sm shrink-0">
              {!rx.fulfilled && (
                <button onClick={() => fulfill(rx.id)} className="text-white py-sm px-md rounded-lg font-label-md hover:opacity-90 shadow-sm flex items-center gap-xs" style={{ background: BRAND }}>
                  <span className="material-symbols-outlined text-[16px]">receipt</span>{t.generateInvoice}
                </button>
              )}
              <button onClick={() => { window.print(); showToast(t.printed) }} className="border border-outline-variant text-on-surface-variant py-sm px-sm rounded-lg hover:bg-surface-container flex items-center gap-xs">
                <span className="material-symbols-outlined text-[18px]">print</span>
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="glass-card rounded-xl p-xl text-center shadow-sm">
            <span className="material-symbols-outlined text-[48px] block mx-auto mb-sm opacity-20">prescriptions</span>
            <p className="font-body-md text-on-surface-variant">No prescriptions found</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Billing Tab ───────────────────────────────────────────────────────────────
function BillingTab({ invoices, setInvoices, t, onBill, showToast }: {
  invoices: Invoice[]; setInvoices: React.Dispatch<React.SetStateAction<Invoice[]>>
  t: typeof T['en']; onBill: () => void; showToast: (m: string) => void
}) {
  const [search, setSearch] = useState(''); const [status, setStatus] = useState('')
  const filtered = invoices.filter(i =>
    (!search || i.patient.toLowerCase().includes(search.toLowerCase()) || i.id.toLowerCase().includes(search.toLowerCase())) &&
    (!status || i.status === status)
  )
  const markPaid = (id: string) => { setInvoices(prev => prev.map(i => i.id === id ? { ...i, status: 'paid' } : i)); showToast(t.invoiceGenerated) }
  const total = filtered.reduce((a, i) => a + i.amount, 0)
  const paidTotal = filtered.filter(i => i.status === 'paid').reduce((a, i) => a + i.amount, 0)

  return (
    <div className="flex flex-col gap-md">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-md">
        {[
          { label: 'Total Billed', value: `₹${total.toFixed(2)}`, cls: 'text-on-surface' },
          { label: t.paid, value: `₹${paidTotal.toFixed(2)}`, cls: 'text-primary' },
          { label: t.unpaid, value: `₹${(total - paidTotal).toFixed(2)}`, cls: 'text-error' },
        ].map(s => (
          <div key={s.label} className="glass-card rounded-xl p-md shadow-sm text-center">
            <p className="font-label-md text-on-surface-variant mb-xs">{s.label}</p>
            <p className={`font-display-sm text-display-sm font-bold ${s.cls}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="glass-card p-md rounded-xl flex flex-wrap gap-sm items-center justify-between shadow-sm">
        <div className="flex flex-wrap gap-sm">
          <div className="relative min-w-[200px]">
            <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
            <input className="w-full pl-xl pr-sm py-xs rounded-lg border border-outline-variant bg-surface-container-lowest text-body-sm focus:outline-none"
              placeholder="Search invoices…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="bg-surface-container-lowest border border-outline-variant rounded-lg text-label-md py-xs px-sm focus:outline-none"
            value={status} onChange={e => setStatus(e.target.value)}>
            <option value="">{t.allStatuses}</option>
            <option value="paid">{t.paid}</option>
            <option value="unpaid">{t.unpaid}</option>
            <option value="partial">{t.partial}</option>
          </select>
        </div>
        <div className="flex gap-sm">
          <button onClick={() => exportCSV(filtered.map(i => ({ ID: i.id, Patient: i.patient, Amount: i.amount, Status: i.status, Date: i.date })), 'billing.csv')}
            className="border border-outline-variant text-on-surface-variant font-label-md py-xs px-md rounded-lg hover:bg-surface-container flex items-center gap-xs">
            <span className="material-symbols-outlined text-[16px]">download</span>{t.exportCSV}
          </button>
          <button onClick={onBill} className="text-white font-label-md py-xs px-md rounded-lg hover:opacity-90 flex items-center gap-xs shadow-sm" style={{ background: BRAND }}>
            <span className="material-symbols-outlined text-[16px]">add</span>{t.generateBill}
          </button>
        </div>
      </div>

      <div className="glass-card rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-surface-container-lowest dark:bg-on-surface">
              <tr>{[t.invoiceNo, t.patient, t.items, t.amount, t.billStatus, t.date, t.actions].map(h => (
                <th key={h} className="py-sm px-md font-label-md text-on-surface-variant uppercase tracking-wider border-b border-surface-dim font-semibold whitespace-nowrap">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-surface-dim">
              {filtered.map((inv, i) => (
                <tr key={inv.id} className={`hover:bg-surface-container-low transition-colors ${i % 2 === 0 ? '' : 'bg-surface-container/20'}`}>
                  <td className="py-sm px-md"><span className="font-label-sm text-primary font-mono">{inv.id}</span></td>
                  <td className="py-sm px-md">
                    <p className="font-body-sm text-on-surface font-semibold whitespace-nowrap">{inv.patient}</p>
                    <p className="font-label-sm text-on-surface-variant">{inv.patientId}</p>
                  </td>
                  <td className="py-sm px-md font-label-sm text-on-surface-variant max-w-[200px] truncate">{inv.items}</td>
                  <td className="py-sm px-md font-body-sm text-on-surface font-semibold">₹{inv.amount.toFixed(2)}</td>
                  <td className="py-sm px-md"><BillStatusBadge status={inv.status} t={t} /></td>
                  <td className="py-sm px-md font-label-sm text-on-surface-variant whitespace-nowrap">{inv.date}</td>
                  <td className="py-sm px-md">
                    <div className="flex gap-xs">
                      {inv.status !== 'paid' && (
                        <button onClick={() => markPaid(inv.id)} className="px-sm py-xs rounded font-label-sm text-white hover:opacity-90" style={{ background: BRAND, fontSize: '11px' }}>
                          Mark Paid
                        </button>
                      )}
                      <button onClick={() => { window.print(); showToast(t.printed) }} className="p-xs rounded hover:bg-surface-container text-on-surface-variant" title={t.print}>
                        <span className="material-symbols-outlined text-[17px]">print</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ─── Reports Tab ───────────────────────────────────────────────────────────────
function ReportsTab({ medicines, invoices, t, showToast }: { medicines: Medicine[]; invoices: Invoice[]; t: typeof T['en']; showToast: (m: string) => void }) {
  const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((a, i) => a + i.amount, 0)
  const topMeds = [...medicines].sort((a, b) => b.stock - a.stock).slice(0, 5)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg">
      {/* Sales Summary */}
      <div className="glass-card rounded-xl shadow-sm overflow-hidden">
        <div className="p-md border-b border-surface-dim flex justify-between items-center">
          <h3 className="font-title-lg text-title-lg text-on-surface">{t.salesSummary}</h3>
          <button onClick={() => { exportCSV(invoices.map(i => ({ ID: i.id, Patient: i.patient, Amount: i.amount, Status: i.status })), 'sales.csv'); showToast(t.exported) }}
            className="border border-outline-variant text-on-surface-variant font-label-md py-xs px-sm rounded-lg hover:bg-surface-container flex items-center gap-xs">
            <span className="material-symbols-outlined text-[16px]">download</span>{t.exportCSV}
          </button>
        </div>
        <div className="p-md flex flex-col gap-md">
          {[
            { label: 'Total Invoices', value: invoices.length, icon: 'receipt_long' },
            { label: t.paid, value: invoices.filter(i => i.status === 'paid').length, icon: 'check_circle' },
            { label: t.unpaid, value: invoices.filter(i => i.status === 'unpaid').length, icon: 'pending' },
            { label: 'Total Revenue', value: `₹${totalRevenue.toFixed(2)}`, icon: 'payments' },
          ].map(row => (
            <div key={row.label} className="flex justify-between items-center py-sm border-b border-surface-dim">
              <div className="flex items-center gap-sm">
                <span className="material-symbols-outlined text-on-surface-variant" style={{ fontVariationSettings: "'FILL' 1" }}>{row.icon}</span>
                <span className="font-body-md text-on-surface">{row.label}</span>
              </div>
              <span className="font-title-md text-on-surface font-bold">{row.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top Medicines */}
      <div className="glass-card rounded-xl shadow-sm overflow-hidden">
        <div className="p-md border-b border-surface-dim flex justify-between items-center">
          <h3 className="font-title-lg text-title-lg text-on-surface">{t.stockReport}</h3>
          <button onClick={() => { exportCSV(medicines.map(m => ({ Name: m.name, Category: m.category, Stock: m.stock, Expiry: m.expiry, Price: m.price })), 'stock.csv'); showToast(t.exported) }}
            className="border border-outline-variant text-on-surface-variant font-label-md py-xs px-sm rounded-lg hover:bg-surface-container flex items-center gap-xs">
            <span className="material-symbols-outlined text-[16px]">download</span>{t.exportCSV}
          </button>
        </div>
        <div className="p-md flex flex-col gap-sm">
          {topMeds.map(m => (
            <div key={m.id} className="flex items-center justify-between">
              <div className="flex items-center gap-sm">
                <div className={`w-2 h-8 rounded-full ${m.isLowStock ? 'bg-error' : m.isExpiringSoon ? 'bg-tertiary' : 'bg-primary'}`} />
                <div>
                  <p className="font-body-sm text-on-surface font-medium">{m.name}</p>
                  <p className="font-label-sm text-on-surface-variant">{m.category}</p>
                </div>
              </div>
              <div className="flex items-center gap-md">
                <div className="w-28 bg-surface-container-high rounded-full h-1.5 overflow-hidden">
                  <div className={`h-full rounded-full ${m.isLowStock ? 'bg-error' : 'bg-primary'}`} style={{ width: `${(m.stock / m.maxStock) * 100}%` }} />
                </div>
                <span className={`font-label-md font-bold w-8 text-right ${m.isLowStock ? 'text-error' : 'text-on-surface'}`}>{m.stock}</span>
              </div>
            </div>
          ))}
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
  const isPharmacist = user?.roles.includes('Pharmacist')

  const queryParams = new URLSearchParams(location.search)
  const activeTab = queryParams.get('tab') || 'overview'
  const setTab = (tab: string) => navigate(`/pharmacy?tab=${tab}`, { replace: true })

  const [medicines, setMedicines] = useState<Medicine[]>(INIT_MEDICINES)
  const [prescriptions, setPrescriptions] = useState<Prescription[]>(INIT_PRESCRIPTIONS)
  const [invoices, setInvoices] = useState<Invoice[]>(INIT_INVOICES)
  const [addMedOpen, setAddMedOpen] = useState(false)
  const [billOpen, setBillOpen] = useState(false)
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => setToast(msg)

  useEffect(() => {
    if (isPharmacist && !queryParams.get('tab')) navigate('/pharmacy?tab=overview', { replace: true })
  }, [isPharmacist])

  const tabs = [
    { id: 'overview',      label: t.tabs.overview,       icon: 'dashboard' },
    { id: 'inventory',     label: t.tabs.inventory,      icon: 'inventory_2' },
    { id: 'prescriptions', label: t.tabs.prescriptions,  icon: 'prescriptions' },
    { id: 'billing',       label: t.tabs.billing,        icon: 'payments' },
    { id: 'reports',       label: t.tabs.reports,        icon: 'analytics' },
  ]

  const pendingRxCount = prescriptions.filter(p => !p.fulfilled).length

  return (
    <div className="flex-1 overflow-y-auto p-margin-mobile md:p-margin-desktop w-full max-w-[1440px] mx-auto pb-xl">
      {toast && <Toast msg={toast} onClose={() => setToast('')} />}
      {addMedOpen && <AddMedicineModal t={t} onClose={() => setAddMedOpen(false)} onAdd={(m) => { setMedicines(prev => [m, ...prev]); showToast(t.medicineAdded) }} />}
      {billOpen && <GenerateBillModal t={t} medicines={medicines} onClose={() => setBillOpen(false)} onGenerate={(inv) => { setInvoices(prev => [inv, ...prev]); showToast(t.invoiceGenerated) }} />}

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-lg gap-md">
        <div>
          <div className="flex items-center gap-sm mb-xs">
            <div className="p-sm rounded-xl" style={{ background: BRAND }}>
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1", fontSize: '22px', color: '#fff' }}>medication</span>
            </div>
            <h1 className="font-display-sm text-display-sm text-on-surface dark:text-inverse-on-surface">{t.title}</h1>
          </div>
          <p className="font-body-lg text-body-lg text-on-surface-variant dark:text-secondary-fixed-dim ml-[52px]">{t.subtitle}</p>
        </div>
        <div className="flex flex-col items-end gap-xs">
          <div className="flex gap-sm flex-wrap">
            <button onClick={() => setAddMedOpen(true)}
              className="text-white font-label-lg py-sm px-md rounded-lg hover:opacity-90 flex items-center gap-xs shadow-sm" style={{ background: BRAND }}>
              <span className="material-symbols-outlined text-[18px]">add_circle</span>{t.addMedicine}
            </button>
            <button onClick={() => setBillOpen(true)}
              className="bg-surface-container text-on-surface border border-outline-variant font-label-lg py-sm px-md rounded-lg hover:bg-surface-container-high flex items-center gap-xs">
              <span className="material-symbols-outlined text-[18px]">receipt_long</span>{t.generateBill}
            </button>
            <button onClick={() => { exportCSV(invoices.map(i => ({ ID: i.id, Patient: i.patient, Amount: i.amount, Status: i.status })), 'reports.csv'); showToast(t.exported) }}
              className="bg-surface-container text-on-surface border border-outline-variant font-label-lg py-sm px-md rounded-lg hover:bg-surface-container-high flex items-center gap-xs">
              <span className="material-symbols-outlined text-[18px]">analytics</span>{t.viewReports}
            </button>
          </div>
          <p className="font-label-sm text-on-surface-variant">
            {t.lastSync}: <span className="font-bold text-on-surface">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </p>
        </div>
      </div>

      {/* ── Tabs ────────────────────────────────────────────────── */}
      <div className="flex gap-xs mb-lg p-xs bg-surface-container rounded-xl overflow-x-auto">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setTab(tab.id)}
            className={`flex items-center gap-xs py-sm px-md rounded-lg font-label-lg whitespace-nowrap transition-all duration-150 ${activeTab === tab.id ? 'bg-white dark:bg-surface shadow-sm font-semibold' : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'}`}
            style={activeTab === tab.id ? { color: BRAND } : {}}>
            <span className="material-symbols-outlined text-[18px]" style={activeTab === tab.id ? { fontVariationSettings: "'FILL' 1" } : {}}>{tab.icon}</span>
            {tab.label}
            {tab.id === 'prescriptions' && pendingRxCount > 0 && (
              <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{ background: BRAND }}>{pendingRxCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Content ─────────────────────────────────────────────── */}
      {activeTab === 'overview'      && <OverviewTab medicines={medicines} prescriptions={prescriptions} invoices={invoices} t={t} onGenerateBill={() => setBillOpen(true)} onFulfill={(id) => setPrescriptions(prev => prev.map(p => p.id === id ? { ...p, fulfilled: true } : p))} showToast={showToast} />}
      {activeTab === 'inventory'     && <InventoryTab medicines={medicines} setMedicines={setMedicines} t={t} onAdd={() => setAddMedOpen(true)} showToast={showToast} />}
      {activeTab === 'prescriptions' && <PrescriptionsTab prescriptions={prescriptions} setPrescriptions={setPrescriptions} invoices={invoices} setInvoices={setInvoices} t={t} showToast={showToast} onBill={() => setBillOpen(true)} />}
      {activeTab === 'billing'       && <BillingTab invoices={invoices} setInvoices={setInvoices} t={t} onBill={() => setBillOpen(true)} showToast={showToast} />}
      {activeTab === 'reports'       && <ReportsTab medicines={medicines} invoices={invoices} t={t} showToast={showToast} />}
    </div>
  )
}
