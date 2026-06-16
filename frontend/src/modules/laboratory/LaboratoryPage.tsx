/**
 * LaboratoryPage — Full Lab Management Module
 * Integrated with Django REST APIs via React Query hooks.
 * Features: Queue ordering (STAT > Urgent > Routine), report uploads, flagging, translations.
 */
import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

import {
  useLabTestsList,
  useLabTestDetail,
  useCreateLabTest,
  useUpdateLabStatus,
  useUploadLabReport,
  useFlagLabTest,
} from '@/hooks/useLaboratory'
import { usePatientsList, useDoctorsList } from '@/hooks/usePatients'
import type { LabTest, LabStatus, LabUrgency, FileType } from '@/types/laboratory.types'

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
    criticalResults: 'Critical Results', pendingTests: 'Pending Tests',
    inProgress: 'In Progress', completedToday: 'Completed Today',
    immediateAction: 'immediate action', inQueue: 'in queue',
    processing: 'processing', finalized: 'finalized',
    todaysWorklist: "Today's Worklist", live: 'Live', byCategory: 'By Category',
    criticalAlerts: 'Critical Alerts', noCritical: 'No critical alerts',
    patient: 'Patient', testType: 'Test', category: 'Category',
    priority: 'Priority', status: 'Status', requested: 'Requested',
    requestedBy: 'Requested By', ward: 'Ward', result: 'Result',
    refRange: 'Ref. Range', completedAt: 'Completed At', actions: 'Actions', id: 'ID',
    start: 'Start', enterResult: 'Enter Result', reviewNow: 'Review Now',
    view: 'View', print: 'Print', dispatch: 'Dispatch', exportAll: 'Export All',
    fullReport: 'Full Report', markInProgress: 'Mark as In Progress',
    submitResult: 'Submit Result', printRequisition: 'Print Requisition',
    close: 'Close', save: 'Save', cancel: 'Cancel',
    allCategories: 'All Categories', allStatuses: 'All Statuses',
    allPriorities: 'All Priorities', searchPatient: 'Search patient name or ID…',
    searchCompleted: 'Search completed tests…', showing: 'orders',
    reports: 'reports',
    newOrderTitle: 'New Lab Order', patientName: 'Patient Name',
    patientId: 'Patient ID', testName: 'Test Name', orderPriority: 'Priority',
    orderCategory: 'Category', orderedBy: 'Ordered By', notes: 'Notes',
    addOrder: 'Add Order',
    enterResultTitle: 'Enter Test Result & Upload Report', resultValue: 'Result Value / Key Findings',
    referenceRange: 'Reference Range', markCritical: 'Mark as Critical',
    resultNotes: 'Notes / Remarks',
    viewReportTitle: 'Lab Report',
    dispatchTitle: 'Dispatch Report', dispatchTo: 'Send to Doctor',
    dispatchMethod: 'Method', dispatchBtn: 'Send Report',
    orderId: 'Order ID', orderedAt: 'Ordered At', collectedAt: 'Collected At',
    sCritical: 'Critical', sPending: 'Pending', sInProgress: 'In Progress',
    sCompleted: 'Completed', sCancelled: 'Cancelled',
    noOrders: 'No orders match your filters', noCompleted: 'No completed tests found',
    selectPatient: 'Select a patient', selectPatientSub: 'Choose a patient to view their lab history',
    labHistory: 'Lab History', tests: 'test',
    physicianNotified: 'Critical — Physician Notified',
    exportedMsg: 'CSV exported successfully!',
    printedMsg: 'Sent to printer!',
    dispatchedMsg: 'Report dispatched!',
    orderAdded: 'Lab order added!',
    resultSaved: 'Result saved!',
    uploadFile: 'Upload Report File (PDF/Image)',
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
    enterResultTitle: 'चाचणी परिणाम प्रविष्ट करा आणि अहवाल अपलोड करा', resultValue: 'परिणाम मूल्य / मुख्य निष्कर्ष',
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
    uploadFile: 'अहवाल फाइल अपलोड करा (PDF/Image)',
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
    allPriorities: 'सभी प्राथमिकताएं', searchPatient: 'रोगी का नाम या आदि खोजें…',
    searchCompleted: 'पूर्ण परीक्षण खोजें…', showing: 'ऑर्डर', reports: 'रिपोर्ट',
    newOrderTitle: 'नया लैब ऑर्डर', patientName: 'रोगी का नाम',
    patientId: 'रोगी आईडी', testName: 'परीक्षण नाम', orderPriority: 'प्राथमिकता',
    orderCategory: 'श्रेणी', orderedBy: 'ऑर्डर किसने दिया', notes: 'नोट्स',
    addOrder: 'ऑर्डर जोड़ें',
    enterResultTitle: 'परीक्षण परिणाम दर्ज करें और रिपोर्ट अपलोड करें', resultValue: 'परिणाम मूल्य / मुख्य निष्कर्ष',
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
    uploadFile: 'रिपोर्ट फाइल अपलोड करें (PDF/Image)',
  },
} as const

type Lang = keyof typeof T
type Priority = 'STAT' | 'Urgent' | 'Routine'
type TestCategory = 'Hematology' | 'Biochemistry' | 'Radiology' | 'Microbiology' | 'Serology' | 'Urinalysis' | 'Hormones'

interface LabOrder {
  id: string; patientName: string; patientId: string; age: number; ward: string
  testName: string; category: TestCategory; status: LabStatus; priority: Priority
  requestedBy: string; requestedAt: string; collectedAt?: string; completedAt?: string
  result?: string; referenceRange?: string; isCritical?: boolean; notes?: string
  reportFiles?: any[]
}

// ─── Mapping Helpers ─────────────────────────────────────────────────────────
const getCategoryFromTestType = (type: string): TestCategory => {
  if (['cbc', 'blood_group', 'serum_ferritin'].includes(type)) return 'Hematology'
  if (['hba1c', 'glucose_fasting', 'glucose_pp', 'ogtt', 'liver_function', 'kidney_function', 'vitamin_d'].includes(type)) return 'Biochemistry'
  if (['anomaly_scan', 'nt_scan', 'growth_scan', 'doppler'].includes(type)) return 'Radiology'
  if (['urine_routine', 'urine_culture'].includes(type)) return 'Urinalysis'
  if (['thyroid'].includes(type)) return 'Hormones'
  if (['vdrl', 'hiv', 'hbsag', 'hcv', 'torch'].includes(type)) return 'Serology'
  return 'Biochemistry'
}

const mapStatus = (status: string): LabStatus => {
  if (status === 'critical') return 'critical'
  if (status === 'in_progress') return 'in_progress'
  if (status === 'completed') return 'completed'
  if (status === 'cancelled') return 'cancelled'
  return 'pending'
}

const mapPriority = (urgency: string): Priority => {
  if (urgency === 'stat') return 'STAT'
  if (urgency === 'urgent') return 'Urgent'
  return 'Routine'
}

const mapBackendToFrontend = (item: LabTest): LabOrder => {
  return {
    id: item.id,
    patientName: item.patient_name,
    patientId: item.patient_mrn,
    age: 0,
    ward: item.consultation ? 'Consultation' : 'OPD / Standalone',
    testName: item.test_type_display,
    category: getCategoryFromTestType(item.test_type),
    status: mapStatus(item.status),
    priority: mapPriority(item.urgency),
    requestedBy: `Dr. ${item.doctor_name}`,
    requestedAt: new Date(item.requested_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    completedAt: item.completed_at ? new Date(item.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
    result: item.key_findings,
    referenceRange: 'Standard',
    isCritical: item.flagged || item.status === 'critical',
    notes: item.report_files && item.report_files.length > 0 ? item.report_files[0].notes : '',
    reportFiles: item.report_files,
  }
}

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
  const initials = name ? name.split(' ').map(n => n[0]).join('').slice(0, 2) : 'PT'
  return (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${critical ? 'bg-error text-white' : 'bg-primary-container text-on-primary-container'}`}>
      {initials}
    </div>
  )
}

// ─── New Order Modal ───────────────────────────────────────────────────────────
const testTypeChoices = [
  { value: 'cbc', label: 'Complete Blood Count (CBC)' },
  { value: 'blood_group', label: 'Blood Group & Rh Typing' },
  { value: 'hba1c', label: 'HbA1c' },
  { value: 'glucose_fasting', label: 'Fasting Glucose' },
  { value: 'glucose_pp', label: 'Post-Prandial Glucose' },
  { value: 'ogtt', label: 'OGTT (Oral Glucose Tolerance)' },
  { value: 'urine_routine', label: 'Urine Routine' },
  { value: 'urine_culture', label: 'Urine Culture' },
  { value: 'thyroid', label: 'Thyroid Function (TSH)' },
  { value: 'liver_function', label: 'Liver Function Test (LFT)' },
  { value: 'kidney_function', label: 'Kidney Function Test (KFT)' },
  { value: 'serum_ferritin', label: 'Serum Ferritin' },
  { value: 'vdrl', label: 'VDRL/RPR' },
  { value: 'hiv', label: 'HIV Screening' },
  { value: 'hbsag', label: 'HBsAg' },
  { value: 'hcv', label: 'HCV Antibody' },
  { value: 'anomaly_scan', label: 'Anomaly Scan (USG)' },
  { value: 'nt_scan', label: 'NT Scan' },
  { value: 'growth_scan', label: 'Growth Scan (USG)' },
  { value: 'other', label: 'Other' },
]

function NewOrderModal({ t, onClose, onAdd }: { t: typeof T['en']; onClose: () => void; onAdd: (payload: any) => void }) {
  const [form, setForm] = useState({ patient: '', test_type: 'cbc', urgency: 'routine' as LabUrgency, ordered_by: '', notes: '' })
  const { data: patientsData } = usePatientsList()
  const { data: doctorsData } = useDoctorsList()

  const submit = () => {
    if (!form.patient || !form.ordered_by) return
    onAdd({
      patient: form.patient,
      ordered_by: form.ordered_by,
      test_type: form.test_type,
      urgency: form.urgency,
      notes: form.notes,
    })
    onClose()
  }

  const inputCls = "w-full px-sm py-xs rounded-lg border border-outline-variant bg-surface-container-lowest dark:bg-surface-variant text-body-sm focus:outline-none focus:ring-2 focus:ring-primary"
  const labelCls = "font-label-md text-label-md text-on-surface-variant block mb-xs"

  return (
    <Modal title={t.newOrderTitle} onClose={onClose}>
      <div className="flex flex-col gap-md">
        <div>
          <label className={labelCls}>{t.patient}</label>
          <select className={inputCls} value={form.patient} onChange={e => setForm(p => ({ ...p, patient: e.target.value }))}>
            <option value="">Select Patient</option>
            {patientsData?.results?.map(p => (
              <option key={p.id} value={p.id}>{p.full_name} ({p.mrn})</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-md">
          <div>
            <label className={labelCls}>{t.testType}</label>
            <select className={inputCls} value={form.test_type} onChange={e => setForm(p => ({ ...p, test_type: e.target.value }))}>
              {testTypeChoices.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>{t.orderPriority}</label>
            <select className={inputCls} value={form.urgency} onChange={e => setForm(p => ({ ...p, urgency: e.target.value as LabUrgency }))}>
              <option value="routine">Routine</option>
              <option value="urgent">Urgent</option>
              <option value="stat">STAT</option>
            </select>
          </div>
        </div>

        <div>
          <label className={labelCls}>{t.orderedBy}</label>
          <select className={inputCls} value={form.ordered_by} onChange={e => setForm(p => ({ ...p, ordered_by: e.target.value }))}>
            <option value="">Select Ordering Physician</option>
            {doctorsData?.results?.map((d: any) => (
              <option key={d.id} value={d.id}>Dr. {d.full_name} ({d.specialisation})</option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelCls}>{t.notes}</label>
          <textarea className={`${inputCls} resize-none`} rows={2} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
        </div>

        <div className="flex gap-sm pt-sm">
          <button onClick={onClose} className="flex-1 py-sm rounded-lg border border-outline-variant text-on-surface-variant font-label-lg hover:bg-surface-container transition-colors">{t.cancel}</button>
          <button onClick={submit} className="flex-1 py-sm rounded-lg bg-primary text-on-primary font-label-lg hover:opacity-90 transition-opacity shadow-sm" style={{ background: '#00685d' }}>{t.addOrder}</button>
        </div>
      </div>
    </Modal>
  )
}

// ─── Enter Result & Upload Modal ──────────────────────────────────────────────
function EnterResultModal({ order, t, onClose, onSave }: { order: LabOrder; t: typeof T['en']; onClose: () => void; onSave: (id: string, result: string, file: File | null, critical: boolean, notes: string) => void }) {
  const [resultVal, setResultVal] = useState(order.result || '')
  const [isCrit, setIsCrit] = useState(order.isCritical || false)
  const [notes, setNotes] = useState(order.notes || '')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const inputCls = "w-full px-sm py-xs rounded-lg border border-outline-variant bg-surface-container-lowest dark:bg-surface-variant text-body-sm focus:outline-none"
  const labelCls = "font-label-md text-label-md text-on-surface-variant block mb-xs"

  return (
    <Modal title={`${t.enterResultTitle} — ${order.id.slice(0, 8)}`} onClose={onClose}>
      <div className="flex flex-col gap-md">
        <div className="flex items-center gap-sm p-sm rounded-lg bg-surface-container">
          <Avatar name={order.patientName} critical={order.isCritical} />
          <div>
            <p className="font-body-md text-body-md text-on-surface font-semibold">{order.patientName}</p>
            <p className="font-label-sm text-label-sm text-on-surface-variant">{order.patientId} · {order.testName}</p>
          </div>
        </div>

        <div>
          <label className={labelCls}>{t.resultValue} *</label>
          <input className={inputCls} value={resultVal} onChange={e => setResultVal(e.target.value)} placeholder="e.g. Hb: 12.4 g/dL" />
        </div>

        <div>
          <label className={labelCls}>{t.uploadFile}</label>
          <input
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={e => setSelectedFile(e.target.files?.[0] || null)}
            className="w-full text-body-sm"
          />
        </div>

        <div>
          <label className={labelCls}>{t.resultNotes}</label>
          <textarea className={`${inputCls} resize-none`} rows={2} value={notes} onChange={e => setNotes(e.target.value)} />
        </div>

        <label className="flex items-center gap-sm cursor-pointer select-none">
          <input type="checkbox" checked={isCrit} onChange={e => setIsCrit(e.target.checked)} className="w-4 h-4 rounded accent-error" />
          <span className={`font-label-md text-label-md ${isCrit ? 'text-error font-semibold' : 'text-on-surface-variant'}`}>{t.markCritical}</span>
        </label>

        <div className="flex gap-sm pt-sm">
          <button onClick={onClose} className="flex-1 py-sm rounded-lg border border-outline-variant text-on-surface-variant font-label-lg hover:bg-surface-container transition-colors">{t.cancel}</button>
          <button onClick={() => { onSave(order.id, resultVal, selectedFile, isCrit, notes); onClose() }} className="flex-1 py-sm rounded-lg bg-primary text-on-primary font-label-lg hover:opacity-90 shadow-sm" style={{ background: '#00685d' }}>{t.submitResult}</button>
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
    ...(order.completedAt ? [[t.completedAt, order.completedAt]] : []),
    ...(order.result ? [[t.result, order.result]] : []),
  ]
  return (
    <Modal title={t.viewReportTitle} onClose={onClose}>
      <div className="flex flex-col gap-md">
        {order.isCritical && (
          <div className="flex items-center gap-sm p-sm rounded-lg bg-error-container">
            <span className="material-symbols-outlined text-error" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
            <span className="font-label-md text-error font-semibold">{t.physicianNotified}</span>
          </div>
        )}
        <div className="flex flex-col gap-xs">
          {rows.map(([label, value]) => (
            <div key={label} className="flex justify-between py-xs border-b border-outline-variant">
              <span className="font-label-md text-on-surface-variant">{label}</span>
              <span className="font-body-sm text-body-sm text-on-surface dark:text-inverse-on-surface font-medium text-right max-w-[55%]">{value}</span>
            </div>
          ))}
          {order.reportFiles && order.reportFiles.length > 0 && (
            <div className="py-sm">
              <span className="font-label-md text-on-surface-variant block mb-xs">Attached PDF / Files</span>
              <div className="space-y-xs">
                {order.reportFiles.map((f: any) => (
                  <a
                    key={f.id}
                    href={f.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary text-body-sm hover:underline flex items-center gap-xs"
                  >
                    <span className="material-symbols-outlined text-sm">attachment</span> View Lab Report File ({f.file_type.toUpperCase()})
                  </a>
                ))}
              </div>
            </div>
          )}
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
          <input className="w-full px-sm py-xs rounded-lg border border-outline-variant bg-surface-container-lowest text-body-sm focus:outline-none" value={doctor} onChange={e => setDoctor(e.target.value)} />
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

function exportCSV(orders: LabOrder[]) {
  const headers = ['ID', 'Patient', 'Patient ID', 'Age', 'Ward', 'Test', 'Category', 'Status', 'Priority', 'Requested By', 'Requested At', 'Result']
  const rows = orders.map(o => [o.id, o.patientName, o.patientId, o.age, o.ward, o.testName, o.category, o.status, o.priority, o.requestedBy, o.requestedAt, o.result || ''])
  const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = 'lab_report.csv'; a.click()
  URL.revokeObjectURL(url)
}

// ─── Dashboard Tab ─────────────────────────────────────────────────────────────
function DashboardTab({ orders, t, onNewOrder }: { orders: LabOrder[]; t: typeof T['en']; onNewOrder: () => void }) {
  const critical = orders.filter(o => o.status === 'critical').length
  const pending = orders.filter(o => o.status === 'pending').length
  const inProgress = orders.filter(o => o.status === 'in_progress').length
  const completed = orders.filter(o => o.status === 'completed').length

  const active = orders.filter(o => ['pending','in_progress','critical'].includes(o.status)).slice(0, 5)

  return (
    <div className="flex flex-col gap-lg animate-fadeIn">
      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
        <div className="bg-surface-container-lowest dark:bg-inverse-surface p-lg rounded-xl border border-outline-variant/30 relative overflow-hidden shadow-sm">
          {critical > 0 && <div className="absolute top-0 right-0 p-xs animate-ping"><span className="w-2.5 h-2.5 bg-error rounded-full block"></span></div>}
          <div className="flex justify-between items-start mb-md">
            <span className="material-symbols-outlined text-error p-sm bg-error-container/20 rounded-lg">warning</span>
            <span className="text-error font-bold text-label-md uppercase tracking-wider">{t.immediateAction}</span>
          </div>
          <p className="font-label-md text-label-md text-secondary">{t.criticalResults}</p>
          <h3 className="font-headline-lg text-headline-lg text-error">{String(critical).padStart(2, '0')}</h3>
        </div>

        <div className="bg-surface-container-lowest dark:bg-inverse-surface p-lg rounded-xl border border-outline-variant/30 shadow-sm">
          <div className="flex justify-between items-start mb-md">
            <span className="material-symbols-outlined text-primary p-sm bg-primary-container/20 rounded-lg">hourglass_empty</span>
            <span className="text-on-surface-variant font-bold text-label-md uppercase tracking-wider">{t.inQueue}</span>
          </div>
          <p className="font-label-md text-label-md text-secondary">{t.pendingTests}</p>
          <h3 className="font-headline-lg text-headline-lg text-on-surface">{String(pending).padStart(2, '0')}</h3>
        </div>

        <div className="bg-surface-container-lowest dark:bg-inverse-surface p-lg rounded-xl border border-outline-variant/30 shadow-sm">
          <div className="flex justify-between items-start mb-md">
            <span className="material-symbols-outlined text-secondary p-sm bg-secondary-container/20 rounded-lg">sync</span>
            <span className="text-secondary font-bold text-label-md uppercase tracking-wider">{t.processing}</span>
          </div>
          <p className="font-label-md text-label-md text-secondary">{t.inProgress}</p>
          <h3 className="font-headline-lg text-headline-lg text-on-surface">{String(inProgress).padStart(2, '0')}</h3>
        </div>

        <div className="bg-surface-container-lowest dark:bg-inverse-surface p-lg rounded-xl border border-outline-variant/30 shadow-sm">
          <div className="flex justify-between items-start mb-md">
            <span className="material-symbols-outlined text-tertiary p-sm bg-tertiary-container/20 rounded-lg">check_circle</span>
            <span className="text-tertiary font-bold text-label-md uppercase tracking-wider">{t.finalized}</span>
          </div>
          <p className="font-label-md text-label-md text-secondary">{t.completedToday}</p>
          <h3 className="font-headline-lg text-headline-lg text-on-surface">{String(completed).padStart(2, '0')}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
        {/* Active list */}
        <div className="lg:col-span-2 glass-card rounded-xl shadow-sm overflow-hidden border border-outline-variant/20 flex flex-col">
          <div className="p-md border-b border-surface-dim bg-surface-container-lowest dark:bg-on-surface flex items-center justify-between">
            <div className="flex items-center gap-xs">
              <h3 className="font-title-lg text-title-lg text-on-surface">{t.todaysWorklist}</h3>
              <span className="bg-primary-container text-on-primary-container font-label-sm px-sm py-xs rounded-full">{t.live}</span>
            </div>
            <button onClick={onNewOrder} className="bg-primary text-on-primary font-label-md py-xs px-md rounded-lg hover:opacity-90 flex items-center gap-xs shadow-sm" style={{ background: '#00685d' }}>
              <span className="material-symbols-outlined text-[16px]">add</span>{t.newLabOrder}
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-surface-container/50 border-b border-surface-dim">
                  {[t.patient, t.testType, t.category, t.priority, t.status, t.requested].map(h => (
                    <th key={h} className="p-sm font-label-md text-on-surface-variant font-semibold">{h}</th>
                  ))}
                </tr>
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

        {/* Categories & Critical alerts */}
        <div className="flex flex-col gap-md">
          <div className="glass-card rounded-xl shadow-sm overflow-hidden border border-outline-variant/20">
            <div className="p-md border-b border-surface-dim"><h3 className="font-title-md text-title-md text-on-surface">{t.byCategory}</h3></div>
            <div className="p-md flex flex-col gap-sm">
              {Object.entries(orders.reduce((a, o) => { a[o.category] = (a[o.category] || 0) + 1; return a }, {} as Record<string, number>))
                .sort((a, b) => b[1] - a[1]).map(([cat, count]) => (
                  <div key={cat} className="flex items-center justify-between">
                    <span className="font-body-sm text-on-surface">{cat}</span>
                    <div className="flex items-center gap-sm">
                      <div className="w-20 bg-surface-container-high rounded-full h-1.5 overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${(count / Math.max(1, orders.length)) * 100}%`, background: '#00685d' }} />
                      </div>
                      <span className="font-label-md text-on-surface-variant w-4 text-right">{count}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div className="glass-card rounded-xl shadow-sm overflow-hidden border border-outline-variant/20">
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
  onUpdateOrder: (id: string, patch: any, file: File | null) => void
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

  useEffect(() => {
    if (selected) setSelected(orders.find(o => o.id === selected.id) || null)
  }, [orders])

  return (
    <div className="flex flex-col gap-md animate-fadeIn">
      {resultModal && <EnterResultModal order={resultModal} t={t} onClose={() => setResultModal(null)} onSave={(id, result, file, crit, notes) => {
        onUpdateOrder(id, { status: crit ? 'critical' : 'completed', key_findings: result, notes }, file)
        showToast(t.resultSaved)
      }} />}
      {viewModal && <ViewReportModal order={viewModal} t={t} onClose={() => setViewModal(null)} onPrint={() => { window.print(); showToast(t.printedMsg) }} />}

      {/* Filters */}
      <div className="glass-card p-md rounded-xl flex flex-wrap gap-md items-center justify-between shadow-sm border border-outline-variant/20">
        <div className="flex flex-wrap gap-sm items-center">
          <div className="relative min-w-[220px]">
            <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
            <input className="w-full pl-xl pr-sm py-xs rounded-lg border border-outline-variant bg-surface-container-lowest dark:bg-surface-variant text-body-sm focus:outline-none"
              placeholder={t.searchPatient} value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="bg-surface-container-lowest dark:bg-surface-variant border border-outline-variant rounded-lg text-label-md py-xs px-sm focus:outline-none"
            value={cat} onChange={e => setCat(e.target.value)}>
            <option value="">{t.allCategories}</option>
            {['Hematology','Biochemistry','Radiology','Microbiology','Serology','Urinalysis','Hormones'].map(c => <option key={c}>{c}</option>)}
          </select>
          <select className="bg-surface-container-lowest dark:bg-surface-variant border border-outline-variant rounded-lg text-label-md py-xs px-sm focus:outline-none"
            value={pri} onChange={e => setPri(e.target.value)}>
            <option value="">{t.allPriorities}</option>
            <option value="STAT">STAT</option>
            <option value="Urgent">Urgent</option>
            <option value="Routine">Routine</option>
          </select>
        </div>
        <div className="flex items-center gap-sm">
          <span className="font-label-md text-on-surface-variant">{filtered.length} {t.showing}</span>
          <button onClick={onNewOrder} className="bg-primary text-on-primary font-label-md py-xs px-md rounded-lg hover:opacity-90 flex items-center gap-xs shadow-sm cursor-pointer" style={{ background: '#00685d' }}>
            <span className="material-symbols-outlined text-[16px]">add</span>{t.newLabOrder}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
        <div className={`${selected ? 'lg:col-span-2' : 'lg:col-span-3'} glass-card rounded-xl shadow-sm overflow-hidden flex flex-col border border-outline-variant/20`}>
          <div className="p-md border-b border-surface-dim bg-surface-container-lowest dark:bg-on-surface flex items-center gap-sm">
            <h3 className="font-title-lg text-title-lg text-on-surface">{t.pendingTests}</h3>
            <span className="bg-primary-container text-on-primary-container font-label-sm px-sm py-xs rounded-full">Live Queue</span>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-surface-container-lowest dark:bg-on-surface z-10 border-b border-surface-dim">
                <tr>{[t.id, t.patient, t.testType, t.ward, t.priority, t.status, t.requestedBy, t.actions].map(h => (
                  <th key={h} className="p-sm font-label-md text-on-surface-variant font-semibold whitespace-nowrap">{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {filtered.map((o, i) => (
                  <tr key={o.id} onClick={() => setSelected(s => s?.id === o.id ? null : o)}
                    className={`hover:bg-surface-container-low transition-colors cursor-pointer ${selected?.id === o.id ? 'bg-primary-container/30' : o.isCritical ? 'bg-error-container/10' : i % 2 === 0 ? '' : 'bg-surface-container/30'}`}>
                    <td className="p-sm border-b border-surface-dim"><span className="font-label-sm text-primary font-mono">{o.id.slice(0, 8)}</span></td>
                    <td className="p-sm border-b border-surface-dim">
                      <div className="flex items-center gap-sm"><Avatar name={o.patientName} critical={o.isCritical} />
                        <div><p className="font-body-sm text-on-surface font-semibold whitespace-nowrap">{o.patientName}</p>
                          <p className="font-label-sm text-on-surface-variant">{o.patientId}</p></div>
                      </div>
                    </td>
                    <td className="p-sm border-b border-surface-dim font-body-sm text-on-surface whitespace-nowrap">{o.testName}</td>
                    <td className="p-sm border-b border-surface-dim font-body-sm text-secondary">{o.ward}</td>
                    <td className="p-sm border-b border-surface-dim"><PriorityBadge priority={o.priority} /></td>
                    <td className="p-sm border-b border-surface-dim"><StatusBadge status={o.status} t={t} /></td>
                    <td className="p-sm border-b border-surface-dim font-body-sm text-secondary whitespace-nowrap">{o.requestedBy}</td>
                    <td className="p-sm border-b border-surface-dim">
                      <div className="flex gap-xs">
                        {o.status === 'pending' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onUpdateOrder(o.id, { status: 'in_progress' }, null)
                            }}
                            className="bg-primary/10 text-primary hover:bg-primary/20 px-xs py-1 rounded text-xs font-bold"
                          >
                            Start
                          </button>
                        )}
                        {o.status === 'in_progress' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setResultModal(o)
                            }}
                            className="bg-primary text-white hover:opacity-90 px-xs py-1 rounded text-xs font-bold"
                          >
                            Result
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Panel for Selected Order */}
        {selected && (
          <div className="glass-card rounded-xl p-md shadow-sm border border-outline-variant/20 flex flex-col gap-md h-full min-h-[350px]">
            <div className="flex justify-between items-start border-b border-surface-dim pb-sm">
              <h3 className="font-title-lg text-title-lg text-on-surface">Test Overview</h3>
              <button onClick={() => setSelected(null)} className="text-secondary hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            {selected.isCritical && (
              <div className="p-sm rounded-lg bg-error-container flex items-center gap-sm">
                <span className="material-symbols-outlined text-error" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
                <span className="font-label-md text-error font-semibold">{t.physicianNotified}</span>
              </div>
            )}
            <div className="flex flex-col gap-xs">
              {[[t.orderId, selected.id.slice(0, 8)],[t.testType, selected.testName],[t.category, selected.category],[t.priority, selected.priority],[t.status, selected.status],[t.requestedBy, selected.requestedBy],[t.requested, selected.requestedAt]].map(([label, value]) => (
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
                <button onClick={() => onUpdateOrder(selected.id, { status: 'in_progress' }, null)}
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
  const completed = orders.filter(o => o.status === 'completed' || o.status === 'critical')
  const filtered = completed.filter(o =>
    !search || o.patientName.toLowerCase().includes(search.toLowerCase()) || o.testName.toLowerCase().includes(search.toLowerCase()) || o.patientId.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col gap-md animate-fadeIn">
      {viewModal && <ViewReportModal order={viewModal} t={t} onClose={() => setViewModal(null)} onPrint={() => showToast(t.printedMsg)} />}
      {dispatchModal && <DispatchModal order={dispatchModal} t={t} onClose={() => setDispatchModal(null)} onDispatch={() => showToast(t.dispatchedMsg)} />}

      <div className="glass-card p-md rounded-xl flex flex-wrap gap-md items-center justify-between shadow-sm border border-outline-variant/20">
        <div className="relative min-w-[220px]">
          <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
          <input className="w-full pl-xl pr-sm py-xs rounded-lg border border-outline-variant bg-surface-container-lowest dark:bg-surface-variant text-body-sm focus:outline-none"
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

      <div className="glass-card rounded-xl shadow-sm overflow-hidden border border-outline-variant/20">
        <div className="p-md border-b border-surface-dim bg-surface-container-lowest dark:bg-on-surface">
          <h3 className="font-title-lg text-title-lg text-on-surface">Completed Reports</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-surface-container-lowest dark:bg-on-surface z-10 border-b border-surface-dim">
              <tr>{[t.id, t.patient, t.testType, t.category, t.result, t.completedAt, t.actions].map(h => (
                <th key={h} className="p-sm font-label-md text-on-surface-variant font-semibold whitespace-nowrap">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {filtered.map((o, i) => (
                <tr key={o.id} className={`hover:bg-surface-container-low transition-colors border-b border-outline-variant/10 ${i % 2 === 0 ? '' : 'bg-surface-container/30'}`}>
                  <td className="p-sm border-b border-surface-dim"><span className="font-label-sm text-primary font-mono">{o.id.slice(0, 8)}</span></td>
                  <td className="p-sm border-b border-surface-dim">
                    <div className="flex items-center gap-sm"><Avatar name={o.patientName} />
                      <div><p className="font-body-sm text-on-surface font-semibold whitespace-nowrap">{o.patientName}</p>
                        <p className="font-label-sm text-on-surface-variant">{o.patientId}</p></div>
                    </div>
                  </td>
                  <td className="p-sm border-b border-surface-dim font-body-sm text-on-surface whitespace-nowrap">{o.testName}</td>
                  <td className="p-sm border-b border-surface-dim font-label-sm text-on-surface-variant">{o.category}</td>
                  <td className="p-sm border-b border-surface-dim font-body-sm text-on-surface">{o.result || '—'}</td>
                  <td className="p-sm border-b border-surface-dim font-label-sm text-on-surface-variant whitespace-nowrap">{o.completedAt || '—'}</td>
                  <td className="p-sm border-b border-surface-dim">
                    <div className="flex gap-xs">
                      <button onClick={() => setViewModal(o)} className="text-primary hover:underline font-label-md text-xs font-bold">
                        {t.view}
                      </button>
                      <button onClick={() => setDispatchModal(o)} className="text-secondary hover:underline font-label-md text-xs font-bold">
                        {t.dispatch}
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

// ─── History Tab ───────────────────────────────────────────────────────────────
function HistoryTab({ orders, t, showToast }: { orders: LabOrder[]; t: typeof T['en']; showToast: (m: string) => void }) {
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null)
  const [viewModal, setViewModal] = useState<LabOrder | null>(null)

  const patientMap = orders.reduce((acc, o) => {
    if (!acc[o.patientId]) {
      acc[o.patientId] = { name: o.patientName, orders: [] }
    }
    acc[o.patientId].orders.push(o)
    return acc
  }, {} as Record<string, { name: string; orders: LabOrder[] }>)

  const patientsList = Object.entries(patientMap).map(([id, p]) => ({ id, name: p.name, orders: p.orders }))
  const sel = selectedPatientId ? patientMap[selectedPatientId] : null

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-lg animate-fadeIn">
      {viewModal && <ViewReportModal order={viewModal} t={t} onClose={() => setViewModal(null)} onPrint={() => showToast(t.printedMsg)} />}

      {/* Patient List */}
      <div className="glass-card rounded-xl overflow-hidden border border-outline-variant/20 flex flex-col h-full max-h-[600px]">
        <div className="p-md bg-surface-container-low border-b border-surface-dim"><h3 className="font-title-md text-title-md text-on-surface">{t.patient}</h3></div>
        <div className="flex-1 overflow-auto divide-y divide-outline-variant/10">
          {patientsList.map(p => (
            <div key={p.id} onClick={() => setSelectedPatientId(p.id)}
              className={`p-md flex items-center gap-sm cursor-pointer hover:bg-surface-container-low transition-colors ${selectedPatientId === p.id ? 'bg-primary-container/20 font-semibold' : ''}`}>
              <Avatar name={p.name} />
              <div>
                <p className="font-body-md text-on-surface">{p.name}</p>
                <p className="font-label-sm text-on-surface-variant">{p.id} · {p.orders.length} {t.tests}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Patient Lab History Details */}
      <div className="md:col-span-2 glass-card rounded-xl overflow-hidden border border-outline-variant/20 flex flex-col min-h-[400px]">
        {sel ? (
          <>
            <div className="p-md bg-surface-container-low border-b border-surface-dim flex justify-between items-center">
              <div>
                <h3 className="font-title-md text-title-md text-on-surface">{sel.name}</h3>
                <p className="font-label-sm text-on-surface-variant">{selectedPatientId}</p>
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
                      <p className="font-label-sm text-on-surface-variant">{o.id.slice(0, 8)} · {o.category} · {o.requestedBy}</p>
                    </div>
                    <StatusBadge status={o.status} t={t} />
                  </div>
                  <div className="flex flex-wrap gap-lg">
                    {[[t.requested, o.requestedAt],[o.completedAt ? t.completedAt : null, o.completedAt],[o.result ? t.result : null, o.result]].filter(([l]) => l).map(([label, value]) => (
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

// ─── Main Page Component ─────────────────────────────────────────────────────────
export default function LaboratoryPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const user = useAuthStore(s => s.user)
  const { language } = useUIStore()
  const t = (T[language as Lang] ?? T.en) as typeof T.en
  const isLabTech = user?.roles.includes('Lab Tech')

  const queryParams = new URLSearchParams(location.search)
  const activeTab = queryParams.get('tab') || 'dashboard'
  const setTab = (tab: string) => navigate(`/laboratory?tab=${tab}`, { replace: true })

  const [newOrderOpen, setNewOrderOpen] = useState(false)
  const [toast, setToast] = useState('')

  // React Query Hook integration
  const { data: labTestsData, refetch } = useLabTestsList()
  const createLabTest = useCreateLabTest()
  const updateLabStatus = useUpdateLabStatus()
  const uploadLabReport = useUploadLabReport()

  const orders = (labTestsData?.results || []).map(mapBackendToFrontend)

  useEffect(() => {
    if (isLabTech && !queryParams.get('tab')) navigate('/laboratory?tab=pending', { replace: true })
  }, [isLabTech])

  const showToast = (msg: string) => setToast(msg)

  const handleUpdateOrder = (id: string, patch: any, file: File | null) => {
    // If setting status to completed/critical with result/findings
    if (patch.status === 'completed' || patch.status === 'critical') {
      updateLabStatus.mutate({
        id,
        data: { new_status: patch.status, key_findings: patch.key_findings },
      }, {
        onSuccess: () => {
          if (file) {
            uploadLabReport.mutate({
              id,
              data: { file },
            }, {
              onSuccess: () => {
                refetch()
              }
            })
          } else {
            refetch()
          }
        }
      })
    } else {
      // Just progress status e.g. marking in_progress
      updateLabStatus.mutate({
        id,
        data: { new_status: patch.status },
      }, {
        onSuccess: () => {
          refetch()
        }
      })
    }
  }

  const handleAddOrder = (payload: any) => {
    createLabTest.mutate(payload, {
      onSuccess: () => {
        showToast(t.orderAdded)
        refetch()
      },
    })
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
      {newOrderOpen && <NewOrderModal t={t} onClose={() => setNewOrderOpen(false)} onAdd={handleAddOrder} />}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-lg gap-md pt-4">
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
              className="bg-secondary-container text-primary font-label-lg py-sm px-md rounded-lg hover:opacity-80 flex items-center gap-xs transition-opacity cursor-pointer">
              <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>{t.exportSummary}
            </button>
            <button onClick={() => setNewOrderOpen(true)}
              className="text-white font-label-lg py-sm px-md rounded-lg hover:opacity-90 flex items-center gap-xs shadow-sm transition-opacity cursor-pointer" style={{ background: '#00685d' }}>
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

      {/* Tabs */}
      <div className="flex gap-xs mb-lg p-xs bg-surface-container rounded-xl overflow-x-auto">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setTab(tab.id)}
            className={`flex items-center gap-xs py-sm px-md rounded-lg font-label-lg whitespace-nowrap transition-all duration-150 cursor-pointer ${activeTab === tab.id ? 'bg-white dark:bg-surface text-primary shadow-sm font-semibold' : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'}`}>
            <span className="material-symbols-outlined text-[18px]" style={activeTab === tab.id ? { fontVariationSettings: "'FILL' 1" } : {}}>{tab.icon}</span>
            {tab.label}
            {tab.id === 'pending' && orders.filter(o => ['pending','in_progress','critical'].includes(o.status)).length > 0 && (
              <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? 'text-white' : 'bg-surface-container-high text-on-surface'}`} style={activeTab === tab.id ? { background: '#00685d' } : {}}>
                {orders.filter(o => ['pending','in_progress','critical'].includes(o.status)).length}
              </span>
            )}
            {tab.id === 'dashboard' && orders.filter(o => o.isCritical).length > 0 && (
              <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-error text-white animate-pulse">
                {orders.filter(o => o.isCritical).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'dashboard' && <DashboardTab orders={orders} t={t} onNewOrder={() => setNewOrderOpen(true)} />}
      {activeTab === 'pending'   && <PendingTab   orders={orders} t={t} onUpdateOrder={handleUpdateOrder} onNewOrder={() => setNewOrderOpen(true)} showToast={showToast} />}
      {activeTab === 'completed' && <CompletedTab orders={orders} t={t} showToast={showToast} />}
      {activeTab === 'history'   && <HistoryTab   orders={orders} t={t} showToast={showToast} />}
    </div>
  )
}
