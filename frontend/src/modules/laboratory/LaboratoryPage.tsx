/**
 * LaboratoryPage — Full Lab Management Module
 * Features: Working buttons, modals, state management, EN/MR/HI translations
 */
import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'

// ─── Translations ─────────────────────────────────────────────────────────────
const T = {
  en: {
    title: 'Laboratory Management',
    subtitle: 'Clinical control center for lab workflows and critical reports.',
    labSubtitle: 'Maternity Care Unit · Lab Division',
    exportSummary: 'Export Summary',
    newLabOrder: 'New Lab Order',
    lastSync: 'Last Sync',
    tabs: { dashboard: 'Dashboard', pending: 'Pending Tests', completed: 'Completed', history: 'Patient History' },
    // Stats
    criticalResults: 'Critical Results', pendingTests: 'Pending Tests',
    inProgress: 'In Progress', completedToday: 'Completed Today',
    immediateAction: 'immediate action', inQueue: 'in queue',
    processing: 'processing', finalized: 'finalized',
    // Dashboard
    todaysWorklist: "Today's Worklist", live: 'Live', byCategory: 'By Category',
    criticalAlerts: 'Critical Alerts', noCritical: 'No critical alerts',
    // Table headers
    patient: 'Patient', testType: 'Test', category: 'Category',
    priority: 'Priority', status: 'Status', requested: 'Requested',
    requestedBy: 'Requested By', ward: 'Ward', result: 'Result',
    refRange: 'Ref. Range', completedAt: 'Completed At', actions: 'Actions', id: 'ID',
    // Buttons
    start: 'Start', enterResult: 'Enter Result', reviewNow: 'Review Now',
    view: 'View', print: 'Print', dispatch: 'Dispatch', exportAll: 'Export All',
    fullReport: 'Full Report', markInProgress: 'Mark as In Progress',
    submitResult: 'Submit Result', printRequisition: 'Print Requisition',
    close: 'Close', save: 'Save', cancel: 'Cancel',
    // Filters
    allCategories: 'All Categories', allStatuses: 'All Statuses',
    allPriorities: 'All Priorities', searchPatient: 'Search patient name or ID…',
    searchCompleted: 'Search completed tests…', showing: 'orders',
    reports: 'reports',
    // Modals
    newOrderTitle: 'New Lab Order', patientName: 'Patient Name',
    patientId: 'Patient ID', testName: 'Test Name', orderPriority: 'Priority',
    orderCategory: 'Category', orderedBy: 'Ordered By', notes: 'Notes',
    addOrder: 'Add Order',
    enterResultTitle: 'Enter Test Result', resultValue: 'Result Value',
    referenceRange: 'Reference Range', markCritical: 'Mark as Critical',
    resultNotes: 'Notes / Remarks',
    viewReportTitle: 'Lab Report',
    dispatchTitle: 'Dispatch Report', dispatchTo: 'Send to Doctor',
    dispatchMethod: 'Method', dispatchBtn: 'Send Report',
    orderId: 'Order ID', orderedAt: 'Ordered At', collectedAt: 'Collected At',
    // Status labels
    sCritical: 'Critical', sPending: 'Pending', sInProgress: 'In Progress',
    sCompleted: 'Completed', sCancelled: 'Cancelled',
    // Empty states
    noOrders: 'No orders match your filters', noCompleted: 'No completed tests found',
    selectPatient: 'Select a patient', selectPatientSub: 'Choose a patient to view their lab history',
    labHistory: 'Lab History', tests: 'test',
    physicianNotified: 'Critical — Physician Notified',
    // Export
    exportedMsg: 'CSV exported successfully!',
    printedMsg: 'Sent to printer!',
    dispatchedMsg: 'Report dispatched!',
    orderAdded: 'Lab order added!',
    resultSaved: 'Result saved!',
  },
  mr: {
    title: 'प्रयोगशाळा व्यवस्थापन',
    subtitle: 'लॅब वर्कफ्लो आणि गंभीर अहवालांसाठी क्लिनिकल नियंत्रण केंद्र.',
    labSubtitle: 'मातृत्व काळजी युनिट · लॅब विभाग',
    exportSummary: 'सारांश निर्यात करा',
    newLabOrder: 'नवीन लॅब ऑर्डर',
    lastSync: 'शेवटची समक्रमण',
    tabs: { dashboard: 'डॅशबोर्ड', pending: 'प्रलंबित चाचण्या', completed: 'पूर्ण', history: 'रुग्ण इतिहास' },
    criticalResults: 'गंभीर परिणाम', pendingTests: 'प्रलंबित चाचण्या',
    inProgress: 'प्रगतीपथावर', completedToday: 'आज पूर्ण',
    immediateAction: 'तत्काळ कारवाई', inQueue: 'रांगेत', processing: 'प्रक्रिया', finalized: 'अंतिम',
    todaysWorklist: 'आजची कामाची यादी', live: 'थेट', byCategory: 'श्रेणीनुसार',
    criticalAlerts: 'गंभीर सूचना', noCritical: 'कोणतीही गंभीर सूचना नाही',
    patient: 'रुग्ण', testType: 'चाचणी', category: 'श्रेणी',
    priority: 'प्राधान्य', status: 'स्थिती', requested: 'विनंती केली',
    requestedBy: 'कोणाकडून', ward: 'वॉर्ड', result: 'परिणाम',
    refRange: 'संदर्भ श्रेणी', completedAt: 'पूर्ण केले', actions: 'क्रिया', id: 'आयडी',
    start: 'सुरू करा', enterResult: 'परिणाम प्रविष्ट करा', reviewNow: 'आत्ता समीक्षा करा',
    view: 'पहा', print: 'मुद्रण', dispatch: 'पाठवा', exportAll: 'सर्व निर्यात करा',
    fullReport: 'पूर्ण अहवाल', markInProgress: 'प्रगतीपथावर म्हणून चिन्हांकित करा',
    submitResult: 'परिणाम सादर करा', printRequisition: 'मागणी मुद्रित करा',
    close: 'बंद करा', save: 'जतन करा', cancel: 'रद्द करा',
    allCategories: 'सर्व श्रेणी', allStatuses: 'सर्व स्थिती',
    allPriorities: 'सर्व प्राधान्ये', searchPatient: 'रुग्णाचे नाव किंवा आयडी शोधा…',
    searchCompleted: 'पूर्ण चाचण्या शोधा…', showing: 'ऑर्डर', reports: 'अहवाल',
    newOrderTitle: 'नवीन लॅब ऑर्डर', patientName: 'रुग्णाचे नाव',
    patientId: 'रुग्ण आयडी', testName: 'चाचणीचे नाव', orderPriority: 'प्राधान्य',
    orderCategory: 'श्रेणी', orderedBy: 'कोणाकडून ऑर्डर', notes: 'टिपा',
    addOrder: 'ऑर्डर जोडा',
    enterResultTitle: 'चाचणी परिणाम प्रविष्ट करा', resultValue: 'परिणाम मूल्य',
    referenceRange: 'संदर्भ श्रेणी', markCritical: 'गंभीर म्हणून चिन्हांकित करा',
    resultNotes: 'टिपा / शेरे',
    viewReportTitle: 'लॅब अहवाल',
    dispatchTitle: 'अहवाल पाठवा', dispatchTo: 'डॉक्टरला पाठवा',
    dispatchMethod: 'पद्धत', dispatchBtn: 'अहवाल पाठवा',
    orderId: 'ऑर्डर आयडी', orderedAt: 'ऑर्डर केले', collectedAt: 'संग्रहित केले',
    sCritical: 'गंभीर', sPending: 'प्रलंबित', sInProgress: 'प्रगतीपथावर',
    sCompleted: 'पूर्ण', sCancelled: 'रद्द',
    noOrders: 'कोणत्याही फिल्टरशी जुळत नाहीत', noCompleted: 'कोणत्याही पूर्ण चाचण्या आढळल्या नाहीत',
    selectPatient: 'रुग्ण निवडा', selectPatientSub: 'त्यांचा लॅब इतिहास पाहण्यासाठी रुग्ण निवडा',
    labHistory: 'लॅब इतिहास', tests: 'चाचणी',
    physicianNotified: 'गंभीर — वैद्यांना सूचित केले',
    exportedMsg: 'CSV यशस्वीरित्या निर्यात केले!',
    printedMsg: 'प्रिंटरला पाठवले!',
    dispatchedMsg: 'अहवाल पाठवला!',
    orderAdded: 'लॅब ऑर्डर जोडली!',
    resultSaved: 'परिणाम जतन केला!',
  },
  hi: {
    title: 'प्रयोगशाला प्रबंधन',
    subtitle: 'लैब वर्कफ़्लो और महत्वपूर्ण रिपोर्ट के लिए नियंत्रण केंद्र।',
    labSubtitle: 'मातृत्व देखभाल इकाई · लैब प्रभाग',
    exportSummary: 'सारांश निर्यात करें',
    newLabOrder: 'नया लैब ऑर्डर',
    lastSync: 'अंतिम समन्वय',
    tabs: { dashboard: 'डैशबोर्ड', pending: 'लंबित परीक्षण', completed: 'पूर्ण', history: 'रोगी इतिहास' },
    criticalResults: 'गंभीर परिणाम', pendingTests: 'लंबित परीक्षण',
    inProgress: 'प्रगति में', completedToday: 'आज पूर्ण',
    immediateAction: 'तत्काल कार्रवाई', inQueue: 'कतार में', processing: 'प्रक्रिया', finalized: 'अंतिम',
    todaysWorklist: 'आज की कार्यसूची', live: 'लाइव', byCategory: 'श्रेणी अनुसार',
    criticalAlerts: 'गंभीर सूचनाएं', noCritical: 'कोई गंभीर सूचना नहीं',
    patient: 'रोगी', testType: 'परीक्षण', category: 'श्रेणी',
    priority: 'प्राथमिकता', status: 'स्थिति', requested: 'अनुरोधित',
    requestedBy: 'किसके द्वारा', ward: 'वार्ड', result: 'परिणाम',
    refRange: 'संदर्भ श्रेणी', completedAt: 'पूर्ण किया', actions: 'क्रियाएं', id: 'आईडी',
    start: 'शुरू करें', enterResult: 'परिणाम दर्ज करें', reviewNow: 'अभी समीक्षा करें',
    view: 'देखें', print: 'प्रिंट', dispatch: 'भेजें', exportAll: 'सभी निर्यात करें',
    fullReport: 'पूरी रिपोर्ट', markInProgress: 'प्रगति में चिह्नित करें',
    submitResult: 'परिणाम सबमिट करें', printRequisition: 'अनुरोध प्रिंट करें',
    close: 'बंद करें', save: 'सहेजें', cancel: 'रद्द करें',
    allCategories: 'सभी श्रेणियां', allStatuses: 'सभी स्थितियां',
    allPriorities: 'सभी प्राथमिकताएं', searchPatient: 'रोगी का नाम या आईडी खोजें…',
    searchCompleted: 'पूर्ण परीक्षण खोजें…', showing: 'ऑर्डर', reports: 'रिपोर्ट',
    newOrderTitle: 'नया लैब ऑर्डर', patientName: 'रोगी का नाम',
    patientId: 'रोगी आईडी', testName: 'परीक्षण नाम', orderPriority: 'प्राथमिकता',
    orderCategory: 'श्रेणी', orderedBy: 'ऑर्डर किसने दिया', notes: 'नोट्स',
    addOrder: 'ऑर्डर जोड़ें',
    enterResultTitle: 'परीक्षण परिणाम दर्ज करें', resultValue: 'परिणाम मूल्य',
    referenceRange: 'संदर्भ श्रेणी', markCritical: 'गंभीर चिह्नित करें',
    resultNotes: 'नोट्स / टिप्पणियां',
    viewReportTitle: 'लैब रिपोर्ट',
    dispatchTitle: 'रिपोर्ट भेजें', dispatchTo: 'डॉक्टर को भेजें',
    dispatchMethod: 'विधि', dispatchBtn: 'रिपोर्ट भेजें',
    orderId: 'ऑर्डर आईडी', orderedAt: 'ऑर्डर किया', collectedAt: 'एकत्र किया',
    sCritical: 'गंभीर', sPending: 'लंबित', sInProgress: 'प्रगति में',
    sCompleted: 'पूर्ण', sCancelled: 'रद्द',
    noOrders: 'कोई ऑर्डर फ़िल्टर से मेल नहीं खाते', noCompleted: 'कोई पूर्ण परीक्षण नहीं मिला',
    selectPatient: 'रोगी चुनें', selectPatientSub: 'लैब इतिहास देखने के लिए रोगी चुनें',
    labHistory: 'लैब इतिहास', tests: 'परीक्षण',
    physicianNotified: 'गंभीर — चिकित्सक को सूचित किया',
    exportedMsg: 'CSV सफलतापूर्वक निर्यात किया!',
    printedMsg: 'प्रिंटर को भेजा!',
    dispatchedMsg: 'रिपोर्ट भेजी गई!',
    orderAdded: 'लैब ऑर्डर जोड़ा गया!',
    resultSaved: 'परिणाम सहेजा गया!',
  },
} as const
type Lang = keyof typeof T

// ─── Types ─────────────────────────────────────────────────────────────────────
type LabStatus = 'pending' | 'in_progress' | 'completed' | 'critical' | 'cancelled'
type TestCategory = 'Hematology' | 'Biochemistry' | 'Radiology' | 'Microbiology' | 'Serology' | 'Urinalysis' | 'Hormones'
type Priority = 'STAT' | 'Urgent' | 'Routine'

interface LabOrder {
  id: string; patientName: string; patientId: string; age: number; ward: string
  testName: string; category: TestCategory; status: LabStatus; priority: Priority
  requestedBy: string; requestedAt: string; collectedAt?: string; completedAt?: string
  result?: string; referenceRange?: string; isCritical?: boolean; notes?: string
}

const INITIAL_ORDERS: LabOrder[] = [
  { id: 'LB-5001', patientName: 'Anya Sharma',  patientId: 'MC-4921', age: 28, ward: 'Maternity - B2',    testName: 'Complete Blood Count',       category: 'Hematology',   status: 'critical',     priority: 'STAT',    requestedBy: 'Dr. Patel',  requestedAt: '08:15 AM', collectedAt: '08:30 AM', result: 'Hb: 6.2 g/dL',               referenceRange: '12-16 g/dL',     isCritical: true,  notes: 'Severe anemia. Doctor notified.' },
  { id: 'LB-5002', patientName: 'Priya Rajan',   patientId: 'MC-4877', age: 32, ward: 'OPD - Antenatal',  testName: 'Obstetric Ultrasound',        category: 'Radiology',    status: 'in_progress',  priority: 'Urgent',  requestedBy: 'Dr. Singh',  requestedAt: '09:00 AM', collectedAt: '09:15 AM',                                                                     notes: 'Fetal growth monitoring at 28 weeks.' },
  { id: 'LB-5003', patientName: 'Meera Kapoor',  patientId: 'MC-5012', age: 25, ward: 'Maternity - A1',   testName: 'Glucose Tolerance Test (75g)', category: 'Biochemistry', status: 'pending',      priority: 'Routine', requestedBy: 'Dr. Sharma', requestedAt: 'Yesterday' },
  { id: 'LB-5004', patientName: 'Sunita Rao',    patientId: 'MC-4803', age: 30, ward: 'Labor Room',        testName: 'Urine Culture & Sensitivity', category: 'Microbiology', status: 'pending',      priority: 'Urgent',  requestedBy: 'Dr. Mehta',  requestedAt: '07:45 AM' },
  { id: 'LB-5005', patientName: 'Linda Chen',    patientId: 'MC-5099', age: 27, ward: 'Post-natal - C3',  testName: 'Urinalysis (Routine)',         category: 'Urinalysis',   status: 'critical',     priority: 'STAT',    requestedBy: 'Dr. Patel',  requestedAt: '45m ago',  collectedAt: '55m ago',  result: 'Protein: 4+, RBC: Many',      referenceRange: 'Protein: Neg',   isCritical: true,  notes: 'Pre-eclampsia screen. Alert sent.' },
  { id: 'LB-5006', patientName: 'Sarah Jenkins', patientId: 'MC-4755', age: 34, ward: 'OPD - Endocrine',  testName: 'Thyroid Panel (TSH,T3,T4)',   category: 'Hormones',     status: 'completed',    priority: 'Routine', requestedBy: 'Dr. Joshi',  requestedAt: '06:00 AM', completedAt: '08:45 AM', result: 'TSH: 2.4 mIU/L, T3/T4 Normal', referenceRange: 'TSH 0.5–5.0',    isCritical: false },
  { id: 'LB-5007', patientName: 'Kavya Nair',    patientId: 'MC-4901', age: 29, ward: 'Maternity - A3',   testName: 'Blood Group & Rh Factor',     category: 'Serology',     status: 'completed',    priority: 'Routine', requestedBy: 'Dr. Singh',  requestedAt: '07:00 AM', completedAt: '09:20 AM', result: 'O+, Rh Positive',             referenceRange: 'N/A',            isCritical: false },
  { id: 'LB-5008', patientName: 'Anita Bose',    patientId: 'MC-5034', age: 26, ward: 'OPD - Antenatal',  testName: 'Serum Iron & TIBC',           category: 'Biochemistry', status: 'pending',      priority: 'Routine', requestedBy: 'Dr. Sharma', requestedAt: '09:30 AM' },
  { id: 'LB-5009', patientName: 'Deepa Pillai',  patientId: 'MC-4988', age: 31, ward: 'Maternity - B4',   testName: 'HbA1c',                       category: 'Biochemistry', status: 'completed',    priority: 'Urgent',  requestedBy: 'Dr. Mehta',  requestedAt: '05:30 AM', completedAt: '08:00 AM', result: 'HbA1c: 7.2%',                 referenceRange: '< 6.5%',         isCritical: false, notes: 'Gestational diabetes monitoring.' },
  { id: 'LB-5010', patientName: 'Rekha Verma',   patientId: 'MC-5120', age: 33, ward: 'Labor Room',        testName: 'Coagulation Profile (PT/INR)','category': 'Hematology', status: 'in_progress',  priority: 'STAT',    requestedBy: 'Dr. Patel',  requestedAt: '10:00 AM', collectedAt: '10:05 AM',                                                                     notes: 'Pre-op check for C-section.' },
]

// ─── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 2500); return () => clearTimeout(t) }, [])
  return (
    <div className="fixed bottom-6 right-6 z-[100] bg-primary text-on-primary px-lg py-sm rounded-xl shadow-xl flex items-center gap-sm animate-pulse">
      <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
      <span className="font-label-lg text-label-lg">{message}</span>
    </div>
  )
}

// ─── Modal wrapper ─────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-md" onClick={onClose}>
      <div className="bg-surface dark:bg-surface-container rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-lg border-b border-outline-variant">
          <h2 className="font-title-lg text-title-lg text-on-surface dark:text-inverse-on-surface">{title}</h2>
          <button onClick={onClose} className="p-xs text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="p-lg">{children}</div>
      </div>
    </div>
  )
}

// ─── Status & Priority Badges ──────────────────────────────────────────────────
function StatusBadge({ status, t }: { status: LabStatus; t: typeof T['en'] }) {
  const cfg: Record<LabStatus, { label: string; cls: string; icon: string }> = {
    critical:    { label: t.sCritical,    cls: 'bg-error text-white',                                icon: 'warning' },
    pending:     { label: t.sPending,     cls: 'bg-surface-container-high text-on-surface',          icon: 'schedule' },
    in_progress: { label: t.sInProgress,  cls: 'bg-secondary-container text-on-secondary-container', icon: 'sync' },
    completed:   { label: t.sCompleted,   cls: 'bg-primary-container text-on-primary-container',     icon: 'check_circle' },
    cancelled:   { label: t.sCancelled,   cls: 'bg-surface-dim text-on-surface-variant',             icon: 'cancel' },
  }
  const { label, cls, icon } = cfg[status]
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${cls}`}>
      <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>{icon}</span>
      {label}
    </span>
  )
}

function PriorityBadge({ priority }: { priority: Priority }) {
  const cfg: Record<Priority, string> = {
    STAT:    'bg-error-container text-error font-bold',
    Urgent:  'bg-tertiary-container text-on-tertiary-container font-semibold',
    Routine: 'bg-surface-container text-on-surface-variant',
  }
  return <span className={`inline-flex px-2 py-0.5 rounded text-xs ${cfg[priority]}`}>{priority}</span>
}

function Avatar({ name, critical }: { name: string; critical?: boolean }) {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2)
  return (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${critical ? 'bg-error text-white' : 'bg-primary-container text-on-primary-container'}`}>
      {initials}
    </div>
  )
}

// ─── New Order Modal ───────────────────────────────────────────────────────────
function NewOrderModal({ t, onClose, onAdd }: { t: typeof T['en']; onClose: () => void; onAdd: (o: LabOrder) => void }) {
  const [form, setForm] = useState({ patientName: '', patientId: '', testName: '', category: 'Hematology' as TestCategory, priority: 'Routine' as Priority, requestedBy: '', notes: '', ward: '' })
  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm(p => ({ ...p, [k]: e.target.value }))

  const submit = () => {
    if (!form.patientName || !form.testName) return
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    onAdd({
      id: `LB-${5100 + Math.floor(Math.random() * 900)}`,
      patientName: form.patientName, patientId: form.patientId || 'MC-????',
      age: 0, ward: form.ward || 'OPD',
      testName: form.testName, category: form.category,
      status: 'pending', priority: form.priority,
      requestedBy: form.requestedBy || 'Dr. Unknown',
      requestedAt: now, notes: form.notes,
    })
    onClose()
  }

  const inputCls = "w-full px-sm py-xs rounded-lg border border-outline-variant bg-surface-container-lowest dark:bg-surface-variant text-body-sm focus:outline-none focus:ring-2 focus:ring-primary"
  const labelCls = "font-label-md text-label-md text-on-surface-variant block mb-xs"

  return (
    <Modal title={t.newOrderTitle} onClose={onClose}>
      <div className="flex flex-col gap-md">
        <div className="grid grid-cols-2 gap-md">
          <div><label className={labelCls}>{t.patientName} *</label><input className={inputCls} value={form.patientName} onChange={f('patientName')} /></div>
          <div><label className={labelCls}>{t.patientId}</label><input className={inputCls} value={form.patientId} onChange={f('patientId')} placeholder="MC-XXXX" /></div>
        </div>
        <div><label className={labelCls}>{t.testName} *</label><input className={inputCls} value={form.testName} onChange={f('testName')} /></div>
        <div className="grid grid-cols-2 gap-md">
          <div>
            <label className={labelCls}>{t.orderCategory}</label>
            <select className={inputCls} value={form.category} onChange={f('category')}>
              {['Hematology','Biochemistry','Radiology','Microbiology','Serology','Urinalysis','Hormones'].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>{t.orderPriority}</label>
            <select className={inputCls} value={form.priority} onChange={f('priority')}>
              <option>STAT</option><option>Urgent</option><option>Routine</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-md">
          <div><label className={labelCls}>{t.ward}</label><input className={inputCls} value={form.ward} onChange={f('ward')} placeholder="Maternity - A1" /></div>
          <div><label className={labelCls}>{t.orderedBy}</label><input className={inputCls} value={form.requestedBy} onChange={f('requestedBy')} placeholder="Dr. Name" /></div>
        </div>
        <div><label className={labelCls}>{t.notes}</label><textarea className={`${inputCls} resize-none`} rows={2} value={form.notes} onChange={f('notes')} /></div>
        <div className="flex gap-sm pt-sm">
          <button onClick={onClose} className="flex-1 py-sm rounded-lg border border-outline-variant text-on-surface-variant font-label-lg hover:bg-surface-container transition-colors">{t.cancel}</button>
          <button onClick={submit} className="flex-1 py-sm rounded-lg bg-primary text-on-primary font-label-lg hover:opacity-90 transition-opacity shadow-sm" style={{ background: '#00685d' }}>{t.addOrder}</button>
        </div>
      </div>
    </Modal>
  )
}

// ─── Enter Result Modal ────────────────────────────────────────────────────────
function EnterResultModal({ order, t, onClose, onSave }: { order: LabOrder; t: typeof T['en']; onClose: () => void; onSave: (id: string, result: string, ref: string, critical: boolean, notes: string) => void }) {
  const [resultVal, setResultVal] = useState(order.result || '')
  const [refRange, setRefRange] = useState(order.referenceRange || '')
  const [isCrit, setIsCrit] = useState(order.isCritical || false)
  const [notes, setNotes] = useState(order.notes || '')

  const inputCls = "w-full px-sm py-xs rounded-lg border border-outline-variant bg-surface-container-lowest dark:bg-surface-variant text-body-sm focus:outline-none focus:ring-2 focus:ring-primary"
  const labelCls = "font-label-md text-label-md text-on-surface-variant block mb-xs"

  return (
    <Modal title={`${t.enterResultTitle} — ${order.id}`} onClose={onClose}>
      <div className="flex flex-col gap-md">
        {/* Patient info */}
        <div className="flex items-center gap-sm p-sm rounded-lg bg-surface-container">
          <Avatar name={order.patientName} critical={order.isCritical} />
          <div>
            <p className="font-body-md text-body-md text-on-surface font-semibold">{order.patientName}</p>
            <p className="font-label-sm text-label-sm text-on-surface-variant">{order.patientId} · {order.testName}</p>
          </div>
        </div>
        <div><label className={labelCls}>{t.resultValue} *</label><input className={inputCls} value={resultVal} onChange={e => setResultVal(e.target.value)} placeholder="e.g. Hb: 12.4 g/dL" /></div>
        <div><label className={labelCls}>{t.referenceRange}</label><input className={inputCls} value={refRange} onChange={e => setRefRange(e.target.value)} placeholder="e.g. 12-16 g/dL" /></div>
        <div><label className={labelCls}>{t.resultNotes}</label><textarea className={`${inputCls} resize-none`} rows={2} value={notes} onChange={e => setNotes(e.target.value)} /></div>
        <label className="flex items-center gap-sm cursor-pointer">
          <input type="checkbox" checked={isCrit} onChange={e => setIsCrit(e.target.checked)} className="w-4 h-4 rounded accent-error" />
          <span className={`font-label-md text-label-md ${isCrit ? 'text-error font-semibold' : 'text-on-surface-variant'}`}>{t.markCritical}</span>
        </label>
        <div className="flex gap-sm pt-sm">
          <button onClick={onClose} className="flex-1 py-sm rounded-lg border border-outline-variant text-on-surface-variant font-label-lg hover:bg-surface-container transition-colors">{t.cancel}</button>
          <button onClick={() => { onSave(order.id, resultVal, refRange, isCrit, notes); onClose() }} className="flex-1 py-sm rounded-lg bg-primary text-on-primary font-label-lg hover:opacity-90 shadow-sm" style={{ background: '#00685d' }}>{t.submitResult}</button>
        </div>
      </div>
    </Modal>
  )
}

// ─── View Report Modal ─────────────────────────────────────────────────────────
function ViewReportModal({ order, t, onClose, onPrint }: { order: LabOrder; t: typeof T['en']; onClose: () => void; onPrint: () => void }) {
  const rows = [
    [t.orderId, order.id], [t.patientName, order.patientName],
    [t.patientId, order.patientId], [t.ward, order.ward],
    [t.testType, order.testName], [t.category, order.category],
    [t.priority, order.priority], [t.status, order.status],
    [t.requestedBy, order.requestedBy], [t.orderedAt, order.requestedAt],
    ...(order.collectedAt ? [[t.collectedAt, order.collectedAt]] : []),
    ...(order.completedAt ? [[t.completedAt, order.completedAt]] : []),
    ...(order.result ? [[t.result, order.result]] : []),
    ...(order.referenceRange ? [[t.refRange, order.referenceRange]] : []),
    ...(order.notes ? [[t.notes, order.notes]] : []),
  ]
  return (
    <Modal title={t.viewReportTitle} onClose={onClose}>
      <div className="flex flex-col gap-md">
        {order.isCritical && (
          <div className="flex items-center gap-sm p-sm rounded-lg bg-error-container">
            <span className="material-symbols-outlined text-error" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
            <span className="font-label-md text-label-md text-error font-semibold">{t.physicianNotified}</span>
          </div>
        )}
        <div className="flex flex-col gap-xs">
          {rows.map(([label, value]) => (
            <div key={label} className="flex justify-between py-xs border-b border-outline-variant">
              <span className="font-label-md text-label-md text-on-surface-variant">{label}</span>
              <span className="font-body-sm text-body-sm text-on-surface dark:text-inverse-on-surface font-medium text-right max-w-[55%]">{value}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-sm pt-sm">
          <button onClick={onClose} className="flex-1 py-sm rounded-lg border border-outline-variant text-on-surface-variant font-label-lg hover:bg-surface-container transition-colors">{t.close}</button>
          <button onClick={() => { onPrint(); onClose() }} className="flex-1 py-sm rounded-lg bg-secondary-container text-primary font-label-lg hover:opacity-80 flex items-center justify-center gap-xs">
            <span className="material-symbols-outlined text-[16px]">print</span>{t.print}
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ─── Dispatch Modal ────────────────────────────────────────────────────────────
function DispatchModal({ order, t, onClose, onDispatch }: { order: LabOrder; t: typeof T['en']; onClose: () => void; onDispatch: () => void }) {
  const [doctor, setDoctor] = useState(order.requestedBy)
  const [method, setMethod] = useState('WhatsApp')
  return (
    <Modal title={t.dispatchTitle} onClose={onClose}>
      <div className="flex flex-col gap-md">
        <div className="p-sm rounded-lg bg-surface-container flex items-center gap-sm">
          <Avatar name={order.patientName} /><div>
            <p className="font-body-sm text-body-sm text-on-surface font-semibold">{order.patientName}</p>
            <p className="font-label-sm text-label-sm text-on-surface-variant">{order.testName}</p>
          </div>
        </div>
        <div>
          <label className="font-label-md text-label-md text-on-surface-variant block mb-xs">{t.dispatchTo}</label>
          <input className="w-full px-sm py-xs rounded-lg border border-outline-variant bg-surface-container-lowest text-body-sm focus:outline-none focus:ring-2 focus:ring-primary" value={doctor} onChange={e => setDoctor(e.target.value)} />
        </div>
        <div>
          <label className="font-label-md text-label-md text-on-surface-variant block mb-xs">{t.dispatchMethod}</label>
          <div className="flex gap-sm">
            {['WhatsApp', 'SMS', 'Email', 'Print'].map(m => (
              <button key={m} onClick={() => setMethod(m)}
                className={`flex-1 py-xs rounded-lg font-label-md border transition-colors ${method === m ? 'bg-primary text-on-primary border-primary' : 'border-outline-variant text-on-surface-variant hover:bg-surface-container'}`}
                style={method === m ? { background: '#00685d' } : {}}>
                {m}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-sm pt-sm">
          <button onClick={onClose} className="flex-1 py-sm rounded-lg border border-outline-variant text-on-surface-variant font-label-lg hover:bg-surface-container transition-colors">{t.cancel}</button>
          <button onClick={() => { onDispatch(); onClose() }} className="flex-1 py-sm rounded-lg bg-primary text-on-primary font-label-lg hover:opacity-90 shadow-sm" style={{ background: '#00685d' }}>{t.dispatchBtn}</button>
        </div>
      </div>
    </Modal>
  )
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
function exportCSV(orders: LabOrder[]) {
  const headers = ['ID', 'Patient', 'Patient ID', 'Age', 'Ward', 'Test', 'Category', 'Status', 'Priority', 'Requested By', 'Requested At', 'Result', 'Reference Range']
  const rows = orders.map(o => [o.id, o.patientName, o.patientId, o.age, o.ward, o.testName, o.category, o.status, o.priority, o.requestedBy, o.requestedAt, o.result || '', o.referenceRange || ''])
  const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = 'lab_report.csv'; a.click()
  URL.revokeObjectURL(url)
}

// ─── Dashboard Tab ─────────────────────────────────────────────────────────────
function DashboardTab({ orders, t, onNewOrder }: { orders: LabOrder[]; t: typeof T['en']; onNewOrder: () => void }) {
  const [refreshed, setRefreshed] = useState(false)
  const critical = orders.filter(o => o.status === 'critical').length
  const pending = orders.filter(o => o.status === 'pending').length
  const inProg = orders.filter(o => o.status === 'in_progress').length
  const completed = orders.filter(o => o.status === 'completed').length

  const stats = [
    { label: t.criticalResults, value: critical, icon: 'priority_high', iconBg: 'bg-error-container text-error', badge: t.immediateAction.toUpperCase(), err: true },
    { label: t.pendingTests,    value: pending,   icon: 'pending',       iconBg: 'bg-surface-container-high text-on-surface-variant', badge: t.inQueue },
    { label: t.inProgress,      value: inProg,    icon: 'sync',          iconBg: 'bg-secondary-container text-on-secondary-container', badge: t.processing },
    { label: t.completedToday,  value: completed, icon: 'check_circle',  iconBg: 'bg-primary-container text-on-primary-container', badge: t.finalized },
  ]

  const active = orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled')

  return (
    <div className="flex flex-col gap-lg">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-md">
        {stats.map(s => (
          <div key={s.label} className="glass-card rounded-xl p-lg shadow-sm relative overflow-hidden group hover:shadow-md transition-all cursor-pointer" onClick={s.err ? undefined : undefined}>
            <div className="absolute -right-3 -top-3 w-16 h-16 bg-surface-container-high rounded-full opacity-20 group-hover:scale-125 transition-transform" />
            <div className="relative z-10 flex justify-between items-start mb-md">
              <div className={`p-sm rounded-lg ${s.iconBg}`}>
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
              </div>
              <span className={`font-label-sm text-label-sm uppercase tracking-wide ${s.err && s.value > 0 ? 'text-error font-bold' : 'text-on-surface-variant'}`}>{s.badge}</span>
            </div>
            <h3 className="font-title-md text-title-md text-on-surface dark:text-inverse-on-surface mb-xs relative z-10">{s.label}</h3>
            <span className={`font-display-md text-display-md relative z-10 ${s.err && s.value > 0 ? 'text-error' : 'text-on-surface dark:text-inverse-on-surface'}`}>{s.value}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
        {/* Worklist */}
        <div className="lg:col-span-2 glass-card rounded-xl shadow-sm overflow-hidden">
          <div className="p-md border-b border-surface-dim dark:border-outline flex justify-between items-center bg-surface-container-lowest dark:bg-on-surface">
            <div className="flex items-center gap-sm">
              <h3 className="font-title-lg text-title-lg text-on-surface dark:text-inverse-on-surface">{t.todaysWorklist}</h3>
              <span className="bg-primary-container text-on-primary-container font-label-sm px-sm py-xs rounded-full">{t.live}</span>
            </div>
            <button onClick={() => { setRefreshed(true); setTimeout(() => setRefreshed(false), 1000) }}
              className={`p-xs text-on-surface-variant hover:bg-surface-container-low rounded-lg transition-colors ${refreshed ? 'animate-spin' : ''}`}>
              <span className="material-symbols-outlined text-[20px]">refresh</span>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-surface-container-lowest dark:bg-on-surface">
                <tr>{[t.patient, t.testType, t.category, t.priority, t.status, t.requested].map(h => (
                  <th key={h} className="p-sm font-label-md text-label-md text-on-surface-variant border-b border-surface-dim font-semibold whitespace-nowrap">{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {active.map((o, i) => (
                  <tr key={o.id} className={`hover:bg-surface-container-low transition-colors ${o.isCritical ? 'bg-error-container/10' : i % 2 === 0 ? '' : 'bg-surface-container/30'}`}>
                    <td className="p-sm border-b border-surface-dim">
                      <div className="flex items-center gap-sm"><Avatar name={o.patientName} critical={o.isCritical} />
                        <div><p className="font-body-sm text-on-surface font-semibold whitespace-nowrap">{o.patientName}</p>
                          <p className={`font-label-sm ${o.isCritical ? 'text-error' : 'text-on-surface-variant'}`}>{o.patientId}</p></div>
                      </div>
                    </td>
                    <td className="p-sm border-b border-surface-dim font-body-sm text-on-surface whitespace-nowrap">{o.testName}</td>
                    <td className="p-sm border-b border-surface-dim font-label-sm text-on-surface-variant whitespace-nowrap">{o.category}</td>
                    <td className="p-sm border-b border-surface-dim"><PriorityBadge priority={o.priority} /></td>
                    <td className="p-sm border-b border-surface-dim"><StatusBadge status={o.status} t={t} /></td>
                    <td className="p-sm border-b border-surface-dim font-label-sm text-on-surface-variant whitespace-nowrap">{o.requestedAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-md">
          <div className="glass-card rounded-xl shadow-sm overflow-hidden">
            <div className="p-md border-b border-surface-dim"><h3 className="font-title-md text-title-md text-on-surface">{t.byCategory}</h3></div>
            <div className="p-md flex flex-col gap-sm">
              {Object.entries(orders.reduce((a, o) => { a[o.category] = (a[o.category] || 0) + 1; return a }, {} as Record<string, number>))
                .sort((a, b) => b[1] - a[1]).map(([cat, count]) => (
                  <div key={cat} className="flex items-center justify-between">
                    <span className="font-body-sm text-on-surface">{cat}</span>
                    <div className="flex items-center gap-sm">
                      <div className="w-20 bg-surface-container-high rounded-full h-1.5 overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${(count / orders.length) * 100}%`, background: '#00685d' }} />
                      </div>
                      <span className="font-label-md text-on-surface-variant w-4 text-right">{count}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div className="glass-card rounded-xl shadow-sm overflow-hidden">
            <div className="p-md border-b border-error-container flex items-center gap-sm">
              <span className="material-symbols-outlined text-error" style={{ fontVariationSettings: "'FILL' 1" }}>notification_important</span>
              <h3 className="font-title-md text-title-md text-error">{t.criticalAlerts}</h3>
            </div>
            <div className="p-md flex flex-col gap-sm">
              {orders.filter(o => o.isCritical).map(o => (
                <div key={o.id} className="p-sm rounded-lg bg-error-container/20 border border-error-container">
                  <div className="flex justify-between items-start mb-xs">
                    <p className="font-body-sm text-on-surface font-semibold">{o.patientName}</p>
                    <span className="font-label-sm text-on-surface-variant">{o.requestedAt}</span>
                  </div>
                  <p className="font-label-sm text-error font-medium">{o.testName}</p>
                  {o.result && <p className="font-label-sm text-on-surface-variant mt-xs">{o.result}</p>}
                </div>
              ))}
              {orders.filter(o => o.isCritical).length === 0 && (
                <p className="font-body-sm text-on-surface-variant text-center py-md">{t.noCritical}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Pending Tab ───────────────────────────────────────────────────────────────
function PendingTab({ orders, t, onUpdateOrder, onNewOrder, showToast }: {
  orders: LabOrder[]; t: typeof T['en']
  onUpdateOrder: (id: string, patch: Partial<LabOrder>) => void
  onNewOrder: () => void; showToast: (msg: string) => void
}) {
  const [search, setSearch] = useState('')
  const [cat, setCat] = useState(''); const [pri, setPri] = useState('')
  const [resultModal, setResultModal] = useState<LabOrder | null>(null)
  const [viewModal, setViewModal] = useState<LabOrder | null>(null)
  const [selected, setSelected] = useState<LabOrder | null>(null)

  const active = orders.filter(o => o.status === 'pending' || o.status === 'in_progress' || o.status === 'critical')
  const filtered = active.filter(o =>
    (!search || o.patientName.toLowerCase().includes(search.toLowerCase()) || o.patientId.toLowerCase().includes(search.toLowerCase())) &&
    (!cat || o.category === cat) && (!pri || o.priority === pri)
  )

  // keep selected in sync after updates
  useEffect(() => {
    if (selected) setSelected(orders.find(o => o.id === selected.id) || null)
  }, [orders])

  return (
    <div className="flex flex-col gap-md">
      {resultModal && <EnterResultModal order={resultModal} t={t} onClose={() => setResultModal(null)} onSave={(id, result, ref, crit, notes) => {
        const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        onUpdateOrder(id, { status: 'completed', result, referenceRange: ref, isCritical: crit, notes, completedAt: now })
        showToast(t.resultSaved)
      }} />}
      {viewModal && <ViewReportModal order={viewModal} t={t} onClose={() => setViewModal(null)} onPrint={() => { window.print(); showToast(t.printedMsg) }} />}

      {/* Filters */}
      <div className="glass-card p-md rounded-xl flex flex-wrap gap-md items-center justify-between shadow-sm">
        <div className="flex flex-wrap gap-sm items-center">
          <div className="relative min-w-[220px]">
            <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
            <input className="w-full pl-xl pr-sm py-xs rounded-lg border border-outline-variant bg-surface-container-lowest dark:bg-surface-variant text-body-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder={t.searchPatient} value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="bg-surface-container-lowest dark:bg-surface-variant border border-outline-variant rounded-lg text-label-md py-xs px-sm focus:outline-none focus:ring-2 focus:ring-primary"
            value={cat} onChange={e => setCat(e.target.value)}>
            <option value="">{t.allCategories}</option>
            {['Hematology','Biochemistry','Radiology','Microbiology','Serology','Urinalysis','Hormones'].map(c => <option key={c}>{c}</option>)}
          </select>
          <select className="bg-surface-container-lowest dark:bg-surface-variant border border-outline-variant rounded-lg text-label-md py-xs px-sm focus:outline-none focus:ring-2 focus:ring-primary"
            value={pri} onChange={e => setPri(e.target.value)}>
            <option value="">{t.allPriorities}</option>
            <option>STAT</option><option>Urgent</option><option>Routine</option>
          </select>
        </div>
        <div className="flex items-center gap-sm">
          <span className="font-label-md text-on-surface-variant">{filtered.length} {t.showing}</span>
          <button onClick={onNewOrder} className="bg-primary text-on-primary font-label-md py-xs px-md rounded-lg hover:opacity-90 flex items-center gap-xs shadow-sm" style={{ background: '#00685d' }}>
            <span className="material-symbols-outlined text-[16px]">add</span>{t.newLabOrder}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
        <div className={`${selected ? 'lg:col-span-2' : 'lg:col-span-3'} glass-card rounded-xl shadow-sm overflow-hidden flex flex-col`}>
          <div className="p-md border-b border-surface-dim bg-surface-container-lowest dark:bg-on-surface flex items-center gap-sm">
            <h3 className="font-title-lg text-title-lg text-on-surface">{t.pendingTests}</h3>
            <span className="bg-primary-container text-on-primary-container font-label-sm px-sm py-xs rounded-full">Live Queue</span>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-surface-container-lowest dark:bg-on-surface z-10">
                <tr>{[t.id, t.patient, t.testType, t.ward, t.priority, t.status, t.requestedBy, t.actions].map(h => (
                  <th key={h} className="p-sm font-label-md text-on-surface-variant border-b border-surface-dim font-semibold whitespace-nowrap">{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {filtered.map((o, i) => (
                  <tr key={o.id} onClick={() => setSelected(s => s?.id === o.id ? null : o)}
                    className={`hover:bg-surface-container-low transition-colors cursor-pointer ${selected?.id === o.id ? 'bg-primary-container/30' : o.isCritical ? 'bg-error-container/10' : i % 2 === 0 ? '' : 'bg-surface-container/30'}`}>
                    <td className="p-sm border-b border-surface-dim"><span className="font-label-sm text-primary font-mono">{o.id}</span></td>
                    <td className="p-sm border-b border-surface-dim">
                      <div className="flex items-center gap-sm"><Avatar name={o.patientName} critical={o.isCritical} />
                        <div><p className="font-body-sm text-on-surface font-semibold whitespace-nowrap">{o.patientName}</p>
                          <p className="font-label-sm text-on-surface-variant">{o.patientId} · {o.age}y</p></div>
                      </div>
                    </td>
                    <td className="p-sm border-b border-surface-dim font-body-sm text-on-surface whitespace-nowrap">{o.testName}</td>
                    <td className="p-sm border-b border-surface-dim font-label-sm text-on-surface-variant whitespace-nowrap">{o.ward}</td>
                    <td className="p-sm border-b border-surface-dim"><PriorityBadge priority={o.priority} /></td>
                    <td className="p-sm border-b border-surface-dim"><StatusBadge status={o.status} t={t} /></td>
                    <td className="p-sm border-b border-surface-dim font-label-sm text-on-surface-variant whitespace-nowrap">{o.requestedBy}</td>
                    <td className="p-sm border-b border-surface-dim">
                      <div className="flex gap-xs" onClick={e => e.stopPropagation()}>
                        {o.status === 'pending' && (
                          <button onClick={() => onUpdateOrder(o.id, { status: 'in_progress' })}
                            className="bg-secondary-container text-on-secondary-container hover:opacity-80 px-sm py-xs rounded font-label-sm whitespace-nowrap transition-colors">{t.start}</button>
                        )}
                        {o.status === 'in_progress' && (
                          <button onClick={() => setResultModal(o)}
                            className="bg-primary text-on-primary hover:opacity-90 px-sm py-xs rounded font-label-sm shadow-sm whitespace-nowrap" style={{ background: '#00685d' }}>{t.enterResult}</button>
                        )}
                        {o.status === 'critical' && (
                          <button onClick={() => setViewModal(o)}
                            className="bg-error text-white hover:opacity-90 px-sm py-xs rounded font-label-sm shadow-sm whitespace-nowrap">{t.reviewNow}</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={8} className="p-xl text-center font-body-md text-on-surface-variant">
                    <span className="material-symbols-outlined text-[40px] block mx-auto mb-sm opacity-30">science</span>{t.noOrders}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="glass-card rounded-xl shadow-sm overflow-hidden flex flex-col">
            <div className="p-md border-b border-surface-dim flex justify-between items-center bg-surface-container-lowest dark:bg-on-surface">
              <h3 className="font-title-md text-title-md text-on-surface">Order Detail</h3>
              <button onClick={() => setSelected(null)} className="p-xs text-on-surface-variant hover:bg-surface-container-low rounded-lg transition-colors">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <div className="p-md flex flex-col gap-md flex-1 overflow-auto">
              <div className="flex items-center gap-md">
                <Avatar name={selected.patientName} critical={selected.isCritical} />
                <div>
                  <p className="font-title-sm text-on-surface font-semibold">{selected.patientName}</p>
                  <p className="font-body-sm text-on-surface-variant">{selected.patientId} · {selected.ward}</p>
                </div>
              </div>
              {selected.isCritical && (
                <div className="p-sm rounded-lg bg-error-container flex items-center gap-sm">
                  <span className="material-symbols-outlined text-error" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
                  <span className="font-label-md text-error font-semibold">{t.physicianNotified}</span>
                </div>
              )}
              <div className="flex flex-col gap-xs">
                {[[t.orderId, selected.id],[t.testType, selected.testName],[t.category, selected.category],[t.priority, selected.priority],[t.status, selected.status],[t.requestedBy, selected.requestedBy],[t.requested, selected.requestedAt]].map(([label, value]) => (
                  <div key={label} className="flex justify-between py-xs border-b border-surface-dim">
                    <span className="font-label-md text-on-surface-variant">{label}</span>
                    <span className="font-body-sm text-on-surface font-medium">{value}</span>
                  </div>
                ))}
              </div>
              {selected.notes && <div className="p-sm rounded-lg bg-surface-container-low border border-outline-variant">
                <p className="font-label-sm text-on-surface-variant mb-xs">{t.notes}</p>
                <p className="font-body-sm text-on-surface">{selected.notes}</p>
              </div>}
              <div className="flex flex-col gap-sm mt-auto">
                {selected.status === 'pending' && (
                  <button onClick={() => onUpdateOrder(selected.id, { status: 'in_progress' })}
                    className="w-full bg-secondary-container text-on-secondary-container py-sm rounded-lg font-label-lg font-semibold hover:opacity-80 flex items-center justify-center gap-xs">
                    <span className="material-symbols-outlined text-[18px]">play_arrow</span>{t.markInProgress}
                  </button>
                )}
                {selected.status === 'in_progress' && (
                  <button onClick={() => setResultModal(selected)}
                    className="w-full py-sm rounded-lg text-white font-label-lg font-semibold hover:opacity-90 shadow-sm flex items-center justify-center gap-xs" style={{ background: '#00685d' }}>
                    <span className="material-symbols-outlined text-[18px]">upload_file</span>{t.submitResult}
                  </button>
                )}
                <button onClick={() => { window.print(); showToast(t.printedMsg) }}
                  className="w-full bg-surface-container text-on-surface py-sm rounded-lg font-label-md hover:bg-surface-container-high flex items-center justify-center gap-xs">
                  <span className="material-symbols-outlined text-[18px]">print</span>{t.printRequisition}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Completed Tab ─────────────────────────────────────────────────────────────
function CompletedTab({ orders, t, showToast }: { orders: LabOrder[]; t: typeof T['en']; showToast: (m: string) => void }) {
  const [search, setSearch] = useState('')
  const [viewModal, setViewModal] = useState<LabOrder | null>(null)
  const [dispatchModal, setDispatchModal] = useState<LabOrder | null>(null)
  const completed = orders.filter(o => o.status === 'completed')
  const filtered = completed.filter(o =>
    !search || o.patientName.toLowerCase().includes(search.toLowerCase()) || o.testName.toLowerCase().includes(search.toLowerCase()) || o.patientId.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col gap-md">
      {viewModal && <ViewReportModal order={viewModal} t={t} onClose={() => setViewModal(null)} onPrint={() => showToast(t.printedMsg)} />}
      {dispatchModal && <DispatchModal order={dispatchModal} t={t} onClose={() => setDispatchModal(null)} onDispatch={() => showToast(t.dispatchedMsg)} />}

      <div className="glass-card p-md rounded-xl flex flex-wrap gap-md items-center justify-between shadow-sm">
        <div className="relative min-w-[220px]">
          <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
          <input className="w-full pl-xl pr-sm py-xs rounded-lg border border-outline-variant bg-surface-container-lowest dark:bg-surface-variant text-body-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder={t.searchCompleted} value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex items-center gap-sm">
          <span className="font-label-md text-on-surface-variant">{filtered.length} {t.reports}</span>
          <button onClick={() => { exportCSV(filtered); showToast(t.exportedMsg) }}
            className="bg-secondary-container text-primary font-label-md py-xs px-md rounded-lg hover:opacity-80 flex items-center gap-xs">
            <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>{t.exportAll}
          </button>
        </div>
      </div>

      <div className="glass-card rounded-xl shadow-sm overflow-hidden">
        <div className="p-md border-b border-surface-dim bg-surface-container-lowest dark:bg-on-surface">
          <h3 className="font-title-lg text-title-lg text-on-surface">Completed Reports</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-surface-container-lowest dark:bg-on-surface z-10">
              <tr>{[t.id, t.patient, t.testType, t.category, t.result, t.refRange, t.completedAt, t.actions].map(h => (
                <th key={h} className="p-sm font-label-md text-on-surface-variant border-b border-surface-dim font-semibold whitespace-nowrap">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {filtered.map((o, i) => (
                <tr key={o.id} className={`hover:bg-surface-container-low transition-colors ${i % 2 === 0 ? '' : 'bg-surface-container/30'}`}>
                  <td className="p-sm border-b border-surface-dim"><span className="font-label-sm text-primary font-mono">{o.id}</span></td>
                  <td className="p-sm border-b border-surface-dim">
                    <div className="flex items-center gap-sm"><Avatar name={o.patientName} />
                      <div><p className="font-body-sm text-on-surface font-semibold whitespace-nowrap">{o.patientName}</p>
                        <p className="font-label-sm text-on-surface-variant">{o.patientId}</p></div>
                    </div>
                  </td>
                  <td className="p-sm border-b border-surface-dim font-body-sm text-on-surface whitespace-nowrap">{o.testName}</td>
                  <td className="p-sm border-b border-surface-dim font-label-sm text-on-surface-variant">{o.category}</td>
                  <td className="p-sm border-b border-surface-dim font-body-sm text-on-surface">{o.result || '—'}</td>
                  <td className="p-sm border-b border-surface-dim font-label-sm text-on-surface-variant whitespace-nowrap">{o.referenceRange || '—'}</td>
                  <td className="p-sm border-b border-surface-dim font-label-sm text-on-surface-variant whitespace-nowrap">{o.completedAt || '—'}</td>
                  <td className="p-sm border-b border-surface-dim">
                    <div className="flex gap-xs">
                      <button onClick={() => setViewModal(o)} className="p-xs text-primary hover:bg-primary-container rounded transition-colors" title={t.view}>
                        <span className="material-symbols-outlined text-[18px]">visibility</span>
                      </button>
                      <button onClick={() => { window.print(); showToast(t.printedMsg) }} className="p-xs text-on-surface-variant hover:bg-surface-container-high rounded transition-colors" title={t.print}>
                        <span className="material-symbols-outlined text-[18px]">print</span>
                      </button>
                      <button onClick={() => setDispatchModal(o)} className="p-xs text-on-surface-variant hover:bg-surface-container-high rounded transition-colors" title={t.dispatch}>
                        <span className="material-symbols-outlined text-[18px]">share</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="p-xl text-center font-body-md text-on-surface-variant">
                  <span className="material-symbols-outlined text-[40px] block mx-auto mb-sm opacity-30">check_circle</span>{t.noCompleted}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ─── Patient History Tab ───────────────────────────────────────────────────────
function HistoryTab({ orders, t, showToast }: { orders: LabOrder[]; t: typeof T['en']; showToast: (m: string) => void }) {
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const byPatient = orders.reduce((acc, o) => {
    if (!acc[o.patientId]) acc[o.patientId] = { name: o.patientName, id: o.patientId, age: o.age, orders: [] }
    acc[o.patientId].orders.push(o)
    return acc
  }, {} as Record<string, { name: string; id: string; age: number; orders: LabOrder[] }>)

  const patients = Object.values(byPatient).filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.id.toLowerCase().includes(search.toLowerCase())
  )
  const sel = patients.find(p => p.id === selectedId) || null

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg" style={{ minHeight: '600px' }}>
      {/* Patient list */}
      <div className="glass-card rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="p-md border-b border-surface-dim bg-surface-container-lowest dark:bg-on-surface">
          <h3 className="font-title-lg text-title-lg text-on-surface mb-sm">{t.patient}</h3>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
            <input className="w-full pl-xl pr-sm py-xs rounded-lg border border-outline-variant bg-surface-container-lowest dark:bg-surface-variant text-body-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder={t.searchPatient} value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="flex-1 overflow-auto">
          {patients.map(p => (
            <div key={p.id} onClick={() => setSelectedId(p.id)}
              className={`p-md border-b border-surface-dim cursor-pointer hover:bg-surface-container-low transition-colors ${selectedId === p.id ? 'bg-primary-container/30 border-l-4 border-l-primary' : ''}`}
              style={selectedId === p.id ? { borderLeftColor: '#00685d' } : {}}>
              <div className="flex items-center gap-sm">
                <Avatar name={p.name} critical={p.orders.some(o => o.isCritical)} />
                <div className="flex-1 min-w-0">
                  <p className="font-body-md text-on-surface font-semibold truncate">{p.name}</p>
                  <p className="font-label-sm text-on-surface-variant">{p.id} · {p.age}y · {p.orders.length} {t.tests}</p>
                </div>
                {p.orders.some(o => o.isCritical) && (
                  <span className="material-symbols-outlined text-error text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
                )}
              </div>
            </div>
          ))}
          {patients.length === 0 && (
            <div className="p-xl text-center">
              <span className="material-symbols-outlined text-[40px] block mx-auto mb-sm opacity-30">person_search</span>
              <p className="font-body-md text-on-surface-variant">{t.noOrders}</p>
            </div>
          )}
        </div>
      </div>

      {/* History detail */}
      <div className="lg:col-span-2 glass-card rounded-xl shadow-sm overflow-hidden flex flex-col">
        {sel ? (
          <>
            <div className="p-md border-b border-surface-dim bg-surface-container-lowest dark:bg-on-surface flex items-center justify-between">
              <div className="flex items-center gap-md">
                <div className="w-11 h-11 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-sm" style={{ background: '#00685d', color: '#fff' }}>
                  {sel.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <h3 className="font-title-lg text-title-lg text-on-surface">{sel.name}</h3>
                  <p className="font-body-sm text-on-surface-variant">{sel.id} · Age {sel.age}</p>
                </div>
              </div>
              <button onClick={() => { exportCSV(sel.orders); showToast(t.exportedMsg) }}
                className="bg-secondary-container text-primary font-label-md py-xs px-md rounded-lg hover:opacity-80 flex items-center gap-xs">
                <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>{t.fullReport}
              </button>
            </div>
            <div className="flex-1 overflow-auto p-md flex flex-col gap-sm">
              <p className="font-label-md text-on-surface-variant uppercase tracking-wider mb-xs">{t.labHistory} ({sel.orders.length} {t.tests})</p>
              {sel.orders.map(o => (
                <div key={o.id} className={`p-md rounded-xl border transition-colors hover:shadow-sm ${o.isCritical ? 'border-error-container bg-error-container/10' : 'border-outline-variant bg-surface dark:bg-surface-variant'}`}>
                  <div className="flex justify-between items-start mb-sm">
                    <div>
                      <div className="flex items-center gap-sm mb-xs">
                        <p className="font-title-sm text-on-surface font-semibold">{o.testName}</p>
                        <PriorityBadge priority={o.priority} />
                      </div>
                      <p className="font-label-sm text-on-surface-variant">{o.id} · {o.category} · {o.requestedBy}</p>
                    </div>
                    <StatusBadge status={o.status} t={t} />
                  </div>
                  <div className="flex flex-wrap gap-lg">
                    {[[t.requested, o.requestedAt],[o.completedAt ? t.completedAt : null, o.completedAt],[o.result ? t.result : null, o.result],[o.referenceRange ? t.refRange : null, o.referenceRange]].filter(([l]) => l).map(([label, value]) => (
                      <div key={label}>
                        <span className="font-label-sm text-on-surface-variant block">{label}</span>
                        <span className={`font-body-sm font-semibold ${o.isCritical && label === t.result ? 'text-error' : 'text-on-surface'}`}>{value}</span>
                      </div>
                    ))}
                  </div>
                  {o.notes && <div className="mt-sm pt-sm border-t border-outline-variant flex items-start gap-xs">
                    <span className="material-symbols-outlined text-on-surface-variant text-[15px] mt-0.5">info</span>
                    <span className="font-label-sm text-on-surface-variant">{o.notes}</span>
                  </div>}
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-md text-center p-xl">
            <span className="material-symbols-outlined text-[64px] text-on-surface-variant opacity-20">manage_search</span>
            <div>
              <p className="font-title-md text-on-surface mb-xs">{t.selectPatient}</p>
              <p className="font-body-md text-on-surface-variant">{t.selectPatientSub}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function LaboratoryPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const user = useAuthStore(s => s.user)
  const { language } = useUIStore()
  const t = T[language as Lang] ?? T.en
  const isLabTech = user?.roles.includes('Lab Tech')

  const queryParams = new URLSearchParams(location.search)
  const activeTab = queryParams.get('tab') || 'dashboard'
  const setTab = (tab: string) => navigate(`/laboratory?tab=${tab}`, { replace: true })

  const [orders, setOrders] = useState<LabOrder[]>(INITIAL_ORDERS)
  const [newOrderOpen, setNewOrderOpen] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => {
    if (isLabTech && !queryParams.get('tab')) navigate('/laboratory?tab=pending', { replace: true })
  }, [isLabTech])

  const showToast = (msg: string) => setToast(msg)

  const updateOrder = (id: string, patch: Partial<LabOrder>) =>
    setOrders(prev => prev.map(o => o.id === id ? { ...o, ...patch } : o))

  const addOrder = (o: LabOrder) => {
    setOrders(prev => [o, ...prev])
    showToast(t.orderAdded)
  }

  const tabs = [
    { id: 'dashboard', label: t.tabs.dashboard, icon: 'dashboard' },
    { id: 'pending',   label: t.tabs.pending,   icon: 'pending_actions' },
    { id: 'completed', label: t.tabs.completed,  icon: 'check_circle' },
    { id: 'history',   label: t.tabs.history,    icon: 'history' },
  ]

  return (
    <div className="flex-1 overflow-y-auto p-margin-mobile md:p-margin-desktop w-full max-w-[1440px] mx-auto pb-xl">
      {toast && <Toast message={toast} onClose={() => setToast('')} />}
      {newOrderOpen && <NewOrderModal t={t} onClose={() => setNewOrderOpen(false)} onAdd={addOrder} />}

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-lg gap-md">
        <div>
          <div className="flex items-center gap-sm mb-xs">
            <div className="p-sm rounded-xl" style={{ background: '#00685d' }}>
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1", fontSize: '22px', color: '#fff' }}>salinity</span>
            </div>
            <h1 className="font-display-sm text-display-sm text-on-surface dark:text-inverse-on-surface">{t.title}</h1>
          </div>
          <p className="font-body-lg text-body-lg text-on-surface-variant dark:text-secondary-fixed-dim ml-[52px]">
            {isLabTech ? t.labSubtitle : t.subtitle}
          </p>
        </div>
        <div className="flex flex-col items-end gap-xs">
          <div className="flex gap-sm">
            <button onClick={() => { exportCSV(orders); showToast(t.exportedMsg) }}
              className="bg-secondary-container text-primary font-label-lg py-sm px-md rounded-lg hover:opacity-80 flex items-center gap-xs transition-opacity">
              <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>{t.exportSummary}
            </button>
            <button onClick={() => setNewOrderOpen(true)}
              className="text-white font-label-lg py-sm px-md rounded-lg hover:opacity-90 flex items-center gap-xs shadow-sm transition-opacity" style={{ background: '#00685d' }}>
              <span className="material-symbols-outlined text-[18px]">add</span>{t.newLabOrder}
            </button>
          </div>
          <p className="font-label-sm text-on-surface-variant">
            {t.lastSync}: <span className="font-bold text-on-surface dark:text-inverse-on-surface">
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </p>
        </div>
      </div>

      {/* ── Tabs ────────────────────────────────────────────────── */}
      <div className="flex gap-xs mb-lg p-xs bg-surface-container rounded-xl overflow-x-auto">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setTab(tab.id)}
            className={`flex items-center gap-xs py-sm px-md rounded-lg font-label-lg whitespace-nowrap transition-all duration-150 ${activeTab === tab.id ? 'bg-white dark:bg-surface text-primary shadow-sm font-semibold' : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'}`}>
            <span className="material-symbols-outlined text-[18px]" style={activeTab === tab.id ? { fontVariationSettings: "'FILL' 1" } : {}}>{tab.icon}</span>
            {tab.label}
            {tab.id === 'pending' && orders.filter(o => ['pending','in_progress','critical'].includes(o.status)).length > 0 && (
              <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? 'text-white' : 'bg-surface-container-high text-on-surface'}`} style={activeTab === tab.id ? { background: '#00685d' } : {}}>
                {orders.filter(o => ['pending','in_progress','critical'].includes(o.status)).length}
              </span>
            )}
            {tab.id === 'dashboard' && orders.filter(o => o.isCritical).length > 0 && (
              <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-error text-white">
                {orders.filter(o => o.isCritical).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab Content ─────────────────────────────────────────── */}
      {activeTab === 'dashboard' && <DashboardTab orders={orders} t={t} onNewOrder={() => setNewOrderOpen(true)} />}
      {activeTab === 'pending'   && <PendingTab   orders={orders} t={t} onUpdateOrder={updateOrder} onNewOrder={() => setNewOrderOpen(true)} showToast={showToast} />}
      {activeTab === 'completed' && <CompletedTab orders={orders} t={t} showToast={showToast} />}
      {activeTab === 'history'   && <HistoryTab   orders={orders} t={t} showToast={showToast} />}
    </div>
  )
}
