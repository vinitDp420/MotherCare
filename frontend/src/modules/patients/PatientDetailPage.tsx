import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  usePatientDetail,
  usePatientAllergies,
  useRecordPatientAllergy,
  useDeletePatientAllergy,
  usePatientEmergencyContacts,
  useAddEmergencyContact,
  useRemoveEmergencyContact,
  useDoctorsList
} from '@/hooks/usePatients'
import { usePregnancyList, useCreatePregnancy } from '@/hooks/usePregnancy'
import StitchFileEditor from './StitchFileEditor'

// ─── Validation Schemas ───────────────────────────────────────────────────────

const allergySchema = z.object({
  allergen: z.string().min(1, 'Allergen is required'),
  reaction_type: z.string().min(1, 'Reaction is required'),
  severity: z.enum(['mild', 'moderate', 'severe', 'life_threatening']),
  recorded_date: z.string().refine(val => new Date(val) <= new Date(), 'Date cannot be in the future'),
  notes: z.string().optional(),
})

const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().regex(/^\+?[\d\s\-().]{7,20}$/, 'Enter a valid phone number'),
  alt_phone: z.string().optional(),
  email: z.string().email('Enter a valid email').optional().or(z.literal('')),
  relationship_type: z.enum(['spouse', 'parent', 'sibling', 'child', 'other']),
  priority: z.coerce.number().min(1, 'Priority must be at least 1'),
})

const pregnancySchema = z.object({
  assigned_doctor: z.string().optional().or(z.literal('')),
  lmp: z.string().refine(val => new Date(val) <= new Date(), 'LMP cannot be in the future'),
  edd: z.string().optional().or(z.literal('')),
  gravida: z.coerce.number().min(1, 'Gravida must be at least 1'),
  para: z.coerce.number().min(0, 'Para must be non-negative'),
  chronic_conditions: z.string().optional(),
})

// ─── Component ────────────────────────────────────────────────────────────────

export default function PatientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const [showAllergyModal, setShowAllergyModal] = useState(false)
  const [showContactModal, setShowContactModal] = useState(false)
  const [showPregnancyModal, setShowPregnancyModal] = useState(false)

  // Auto-open pregnancy modal if navigated with ?register_pregnancy=true
  useEffect(() => {
    if (searchParams.get('register_pregnancy') === 'true') {
      setShowPregnancyModal(true)
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams])

  // Queries
  const { data: patient, isLoading: isPatientLoading } = usePatientDetail(id)
  const { data: allergiesData } = usePatientAllergies(id)
  const { data: contacts } = usePatientEmergencyContacts(id)
  const { data: pregnancies } = usePregnancyList({ patient: id, is_active: true })
  const { data: doctorsData } = useDoctorsList()

  // Mutations
  const recordAllergy = useRecordPatientAllergy(id!)
  const deleteAllergy = useDeletePatientAllergy(id!)
  const addContact = useAddEmergencyContact(id!)
  const removeContact = useRemoveEmergencyContact(id!)
  const createPregnancy = useCreatePregnancy()

  // Forms
  const allergyForm = useForm<z.infer<typeof allergySchema>>({
    resolver: zodResolver(allergySchema) as any,
    defaultValues: { severity: 'mild', recorded_date: new Date().toISOString().split('T')[0] }
  })

  const contactForm = useForm<z.infer<typeof contactSchema>>({
    resolver: zodResolver(contactSchema) as any,
    defaultValues: { relationship_type: 'other', priority: 1 }
  })

  const pregnancyForm = useForm<z.infer<typeof pregnancySchema>>({
    resolver: zodResolver(pregnancySchema) as any,
    defaultValues: { gravida: 1, para: 0 }
  })

  const activePregnancy = pregnancies?.results?.[0]

  if (isPatientLoading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
        <span className="ml-3 text-secondary font-medium">Fetching patient clinical records...</span>
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="text-center py-xl bg-white rounded-xl border p-lg shadow-sm max-w-md mx-auto my-lg">
        <span className="material-symbols-outlined text-[48px] text-error mb-2">person_off</span>
        <h3 className="font-title-lg font-bold">Patient Not Found</h3>
        <p className="font-body-md text-secondary mt-1">The patient record you are looking for does not exist or has been archived.</p>
        <button onClick={() => navigate('/patients')} className="btn-primary mt-md">Back to Roster</button>
      </div>
    )
  }

  const handleAddAllergy = (data: any) => {
    recordAllergy.mutate(data, {
      onSuccess: () => {
        setShowAllergyModal(false)
        allergyForm.reset()
      }
    })
  }

  const handleAddContact = (data: any) => {
    addContact.mutate(data, {
      onSuccess: () => {
        setShowContactModal(false)
        contactForm.reset()
      }
    })
  }

  const handleStartPregnancy = (data: any) => {
    createPregnancy.mutate({
      patient: id!,
      assigned_doctor: data.assigned_doctor || null,
      lmp: data.lmp,
      edd: data.edd || null,
      gravida: data.gravida,
      para: data.para,
      chronic_conditions: data.chronic_conditions || '',
      is_active: true
    }, {
      onSuccess: (newPreg) => {
        setShowPregnancyModal(false)
        pregnancyForm.reset()
        navigate(`/patients/${id}/pregnancy`)
      }
    })
  }

  return (
    <>
      {/* ── MAIN PAGE ──────────────────────────────────────────────────────────── */}
      <div className="p-margin-desktop space-y-gutter">

        {/* Breadcrumbs */}
        <nav className="flex text-label-md text-secondary gap-xs items-center mb-sm">
          <a className="hover:text-primary transition-colors cursor-pointer" onClick={() => navigate('/patients')}>Patients</a>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-on-surface font-bold">{patient.full_name}</span>
        </nav>

        {/* Profile Bento Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
          {/* Patient Core Details Box */}
          <div className="lg:col-span-2 bg-white dark:bg-surface-dim rounded-xl border border-outline-variant/20 p-lg shadow-sm flex flex-col justify-between">
            <div className="flex gap-md items-start">
              <div className="w-20 h-20 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-3xl shrink-0">
                {patient.full_name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
              </div>
              <div>
                <h2 className="text-headline-lg font-bold text-on-surface">{patient.full_name}</h2>
                <p className="text-sm text-secondary mt-1">MRN: <span className="font-semibold text-on-surface">{patient.mrn}</span></p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-sm mt-md text-sm text-on-surface-variant">
                  <div><strong>DOB:</strong> {patient.dob}</div>
                  <div><strong>Age:</strong> {patient.age} yrs</div>
                  <div><strong>Blood Group:</strong> {patient.blood_group}</div>
                  <div><strong>Phone:</strong> {patient.phone}</div>
                  <div><strong>Email:</strong> {patient.email || '—'}</div>
                  <div><strong>Status:</strong> {patient.is_active ? 'Active' : 'Inactive'}</div>
                </div>
              </div>
            </div>
            {patient.address && (
              <div className="mt-md pt-sm border-t border-outline-variant/10 text-sm">
                <strong>Address:</strong> <span className="text-on-surface-variant">{patient.address}</span>
              </div>
            )}
          </div>

          {/* Pregnancy Summary Gate */}
          <div className="bg-white dark:bg-surface-dim rounded-xl border border-outline-variant/20 p-lg shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-title-lg font-bold text-on-surface mb-sm flex items-center gap-xs">
                <span className="material-symbols-outlined text-primary">pregnant_woman</span>
                Active Pregnancy
              </h3>
              {activePregnancy ? (
                <div className="space-y-sm bg-surface-container-low p-sm rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-headline-md font-bold text-primary">Week {activePregnancy.current_week}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                      activePregnancy.risk_status === 'normal'
                        ? 'bg-success-100 text-success-600'
                        : 'bg-error-container text-error'
                    }`}>
                      {activePregnancy.risk_status_display}
                    </span>
                  </div>
                  <div className="text-sm space-y-1">
                    <p><strong>EDD:</strong> {activePregnancy.edd}</p>
                    <p><strong>Trimester:</strong> {activePregnancy.trimester_display}</p>
                    <p><strong>Gravida/Para:</strong> G{activePregnancy.gravida} P{activePregnancy.para}</p>
                    {activePregnancy.doctor_name && <p><strong>Assigned Doctor:</strong> {activePregnancy.doctor_name}</p>}
                  </div>
                </div>
              ) : (
                <div className="text-center py-md">
                  <span className="material-symbols-outlined text-outline text-[48px] mb-xs">baby_changing_station</span>
                  <p className="text-sm text-secondary font-medium">No active pregnancy registered.</p>
                </div>
              )}
            </div>
            <div className="mt-md pt-sm">
              {activePregnancy ? (
                <button
                  onClick={() => navigate(`/patients/${patient.id}/pregnancy`)}
                  className="w-full btn-primary"
                >
                  Track Pregnancy Timeline
                </button>
              ) : (
                <button
                  onClick={() => setShowPregnancyModal(true)}
                  className="w-full btn-primary flex items-center justify-center gap-xs"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span> Register Pregnancy Intake
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Allergies & Emergency Contacts grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter">
          {/* Emergency Contacts Panel */}
          <div className="bg-white dark:bg-surface-dim rounded-xl border border-outline-variant/20 p-lg shadow-sm space-y-md">
            <div className="flex justify-between items-center border-b border-outline-variant/10 pb-sm">
              <h3 className="text-title-lg font-bold text-on-surface flex items-center gap-xs">
                <span className="material-symbols-outlined text-primary">contact_phone</span> Emergency Contacts
              </h3>
              <button
                onClick={() => setShowContactModal(true)}
                className="text-primary hover:underline font-label-lg flex items-center gap-xs"
              >
                <span className="material-symbols-outlined text-[18px]">add</span> Add Contact
              </button>
            </div>

            <div className="space-y-sm max-h-[300px] overflow-y-auto pr-1">
              {!contacts || contacts.length === 0 ? (
                <p className="text-sm text-secondary py-md text-center">No emergency contacts registered yet.</p>
              ) : (
                contacts.map((c: any) => (
                  <div key={c.id} className="flex justify-between items-start bg-neutral-50 p-sm rounded-lg border border-neutral-100">
                    <div>
                      <div className="flex items-center gap-sm">
                        <p className="font-bold text-on-surface text-sm">{c.contact.name}</p>
                        {c.is_primary && (
                          <span className="bg-primary/10 text-primary text-[10px] font-bold px-1.5 py-0.5 rounded">Primary</span>
                        )}
                      </div>
                      <p className="text-xs text-secondary mt-1">Phone: {c.contact.phone} {c.contact.alt_phone ? `/ ${c.contact.alt_phone}` : ''}</p>
                      <p className="text-xs text-secondary">Relationship: {c.relationship_type.toUpperCase()} • Priority: {c.priority}</p>
                    </div>
                    <button
                      onClick={() => {
                        if (confirm('Delete this contact link?')) {
                          removeContact.mutate(c.id)
                        }
                      }}
                      className="text-neutral-400 hover:text-danger-600 transition-colors p-1"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Known Allergies Panel */}
          <div className="bg-white dark:bg-surface-dim rounded-xl border border-outline-variant/20 p-lg shadow-sm space-y-md">
            <div className="flex justify-between items-center border-b border-outline-variant/10 pb-sm">
              <h3 className="text-title-lg font-bold text-on-surface flex items-center gap-xs">
                <span className="material-symbols-outlined text-error">warning</span> Medical Allergies
              </h3>
              <button
                onClick={() => setShowAllergyModal(true)}
                className="text-error hover:underline font-label-lg flex items-center gap-xs"
              >
                <span className="material-symbols-outlined text-[18px]">add</span> Log Allergy
              </button>
            </div>

            <div className="space-y-sm max-h-[300px] overflow-y-auto pr-1">
              {!allergiesData?.results || allergiesData.results.length === 0 ? (
                <p className="text-sm text-secondary py-md text-center">No known allergies logged.</p>
              ) : (
                allergiesData.results.map((a: any) => (
                  <div key={a.id} className={`flex justify-between items-start p-sm rounded-lg border ${
                    a.is_blocking
                      ? 'bg-error-container/20 border-error-container/30'
                      : 'bg-neutral-50 border-neutral-100'
                  }`}>
                    <div>
                      <div className="flex items-center gap-sm">
                        <p className={`font-bold text-sm ${a.is_blocking ? 'text-danger-700' : 'text-on-surface'}`}>{a.allergen}</p>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          a.is_blocking ? 'bg-error text-white' : 'bg-warning-500 text-white'
                        }`}>
                          {a.severity.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs text-secondary mt-1">Reaction: {a.reaction_type}</p>
                      {a.notes && <p className="text-xs text-secondary">Notes: {a.notes}</p>}
                      <p className="text-[10px] text-outline mt-1">Logged on: {a.recorded_date}</p>
                    </div>
                    <button
                      onClick={() => {
                        if (confirm('Remove this allergy record?')) {
                          deleteAllergy.mutate(a.id)
                        }
                      }}
                      className="text-neutral-400 hover:text-danger-600 transition-colors p-1"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Persistent Referral Stitch Section */}
        <StitchFileEditor patientId={id!} />

      </div>

      {/* ── MODAL: Add Emergency Contact ──────────────────────────────────────── */}
      {showContactModal && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-md">
          <div className="bg-white rounded-2xl shadow-2xl border border-outline-variant/20 w-full max-w-lg flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="px-lg py-md border-b border-outline-variant/10 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-sm">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-[20px]">contact_phone</span>
                </div>
                <div>
                  <h3 className="text-title-md font-bold text-on-surface">Add Emergency Contact</h3>
                  <p className="text-xs text-secondary">Link a person as emergency contact for this patient</p>
                </div>
              </div>
              <button onClick={() => setShowContactModal(false)} className="w-8 h-8 rounded-lg hover:bg-neutral-100 flex items-center justify-center text-neutral-400 hover:text-neutral-700 transition-colors">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            {/* Form Body */}
            <form onSubmit={contactForm.handleSubmit(handleAddContact)} className="flex flex-col flex-1 min-h-0">
              <div className="overflow-y-auto flex-1 px-lg py-md space-y-md">
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-on-surface">Contact Name <span className="text-error">*</span></label>
                  <input type="text" {...contactForm.register('name')} className="form-input" placeholder="e.g. Rajesh Sharma" />
                  {contactForm.formState.errors.name && <p className="text-xs text-error">{contactForm.formState.errors.name.message}</p>}
                </div>
                <div className="grid grid-cols-2 gap-md">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-on-surface">Primary Phone <span className="text-error">*</span></label>
                    <input type="text" {...contactForm.register('phone')} className="form-input" placeholder="+91 98765 43210" />
                    {contactForm.formState.errors.phone && <p className="text-xs text-error">{contactForm.formState.errors.phone.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-on-surface">Alternate Phone</label>
                    <input type="text" {...contactForm.register('alt_phone')} className="form-input" placeholder="Optional" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-on-surface">Email Address</label>
                  <input type="email" {...contactForm.register('email')} className="form-input" placeholder="contact@example.com" />
                </div>
                <div className="grid grid-cols-2 gap-md">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-on-surface">Relationship <span className="text-error">*</span></label>
                    <select {...contactForm.register('relationship_type')} className="form-input">
                      <option value="spouse">Spouse</option>
                      <option value="parent">Parent</option>
                      <option value="sibling">Sibling</option>
                      <option value="child">Child</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-on-surface">Priority <span className="text-error">*</span></label>
                    <input type="number" min="1" {...contactForm.register('priority')} className="form-input" />
                    <p className="text-[11px] text-secondary">1 = Primary contact</p>
                  </div>
                </div>
              </div>
              {/* Footer */}
              <div className="px-lg py-md border-t border-outline-variant/10 flex justify-end gap-sm shrink-0">
                <button type="button" onClick={() => setShowContactModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary" disabled={addContact.isPending}>
                  {addContact.isPending ? 'Saving...' : 'Add Contact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Log Allergy ────────────────────────────────────────────────── */}
      {showAllergyModal && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-md">
          <div className="bg-white rounded-2xl shadow-2xl border border-outline-variant/20 w-full max-w-lg flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="px-lg py-md border-b border-outline-variant/10 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-sm">
                <div className="w-9 h-9 rounded-xl bg-error/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-error text-[20px]">warning</span>
                </div>
                <div>
                  <h3 className="text-title-md font-bold text-on-surface">Log Patient Allergy</h3>
                  <p className="text-xs text-secondary">Record a known allergen and reaction details</p>
                </div>
              </div>
              <button onClick={() => setShowAllergyModal(false)} className="w-8 h-8 rounded-lg hover:bg-neutral-100 flex items-center justify-center text-neutral-400 hover:text-neutral-700 transition-colors">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            {/* Form Body */}
            <form onSubmit={allergyForm.handleSubmit(handleAddAllergy)} className="flex flex-col flex-1 min-h-0">
              <div className="overflow-y-auto flex-1 px-lg py-md space-y-md">
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-on-surface">Allergen <span className="text-error">*</span></label>
                  <input type="text" {...allergyForm.register('allergen')} className="form-input" placeholder="e.g. Penicillin, Latex, Peanuts" />
                  {allergyForm.formState.errors.allergen && <p className="text-xs text-error">{allergyForm.formState.errors.allergen.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-on-surface">Reaction Type <span className="text-error">*</span></label>
                  <input type="text" {...allergyForm.register('reaction_type')} className="form-input" placeholder="e.g. Anaphylaxis, Skin rash, Dyspnea" />
                  {allergyForm.formState.errors.reaction_type && <p className="text-xs text-error">{allergyForm.formState.errors.reaction_type.message}</p>}
                </div>
                <div className="grid grid-cols-2 gap-md">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-on-surface">Severity <span className="text-error">*</span></label>
                    <select {...allergyForm.register('severity')} className="form-input">
                      <option value="mild">🟡 Mild</option>
                      <option value="moderate">🟠 Moderate</option>
                      <option value="severe">🔴 Severe</option>
                      <option value="life_threatening">☠️ Life Threatening</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-on-surface">Recorded Date <span className="text-error">*</span></label>
                    <input type="date" {...allergyForm.register('recorded_date')} className="form-input" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-on-surface">Clinical Notes</label>
                  <textarea rows={3} {...allergyForm.register('notes')} className="form-input" placeholder="Additional observations, severity details, treatment notes..."></textarea>
                </div>
              </div>
              {/* Footer */}
              <div className="px-lg py-md border-t border-outline-variant/10 flex justify-end gap-sm shrink-0">
                <button type="button" onClick={() => setShowAllergyModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-danger" disabled={recordAllergy.isPending}>
                  {recordAllergy.isPending ? 'Saving...' : '⚠️ Log Allergy'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Register Pregnancy Intake ──────────────────────────────────── */}
      {showPregnancyModal && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-md">
          <div className="bg-white rounded-2xl shadow-2xl border border-outline-variant/20 w-full max-w-xl flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="px-lg py-md border-b border-outline-variant/10 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-sm">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>pregnant_woman</span>
                </div>
                <div>
                  <h3 className="text-title-lg font-bold text-on-surface">Register Pregnancy Intake</h3>
                  <p className="text-xs text-secondary">
                    Patient: <span className="font-semibold text-on-surface">{patient.full_name}</span>
                    &nbsp;·&nbsp; MRN: {patient.mrn}
                  </p>
                </div>
              </div>
              <button onClick={() => setShowPregnancyModal(false)} className="w-8 h-8 rounded-lg hover:bg-neutral-100 flex items-center justify-center text-neutral-400 hover:text-neutral-700 transition-colors">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            {/* Form Body */}
            <form onSubmit={pregnancyForm.handleSubmit(handleStartPregnancy)} className="flex flex-col flex-1 min-h-0">
              <div className="overflow-y-auto flex-1 px-lg py-md space-y-lg">

                {/* Section: Gestational Dates */}
                <div className="space-y-md">
                  <p className="text-xs font-bold text-secondary uppercase tracking-wider">📅 Gestational Dates</p>
                  <div className="grid grid-cols-2 gap-md">
                    <div className="space-y-1.5">
                      <label className="block text-sm font-semibold text-on-surface">
                        Last Menstrual Period (LMP) <span className="text-error">*</span>
                      </label>
                      <input type="date" {...pregnancyForm.register('lmp')} className="form-input" />
                      {pregnancyForm.formState.errors.lmp && (
                        <p className="text-xs text-error">{pregnancyForm.formState.errors.lmp.message}</p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-semibold text-on-surface">Estimated Due Date (EDD)</label>
                      <input type="date" {...pregnancyForm.register('edd')} className="form-input" />
                      <p className="text-[11px] text-secondary">Auto-calculated from LMP if left blank</p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-outline-variant/10" />

                {/* Section: Obstetric History */}
                <div className="space-y-md">
                  <p className="text-xs font-bold text-secondary uppercase tracking-wider">🩺 Obstetric History</p>
                  <div className="grid grid-cols-2 gap-md">
                    <div className="space-y-1.5">
                      <label className="block text-sm font-semibold text-on-surface">
                        Gravida (G) <span className="text-error">*</span>
                      </label>
                      <input type="number" min="1" {...pregnancyForm.register('gravida')} className="form-input" />
                      <p className="text-[11px] text-secondary">Total pregnancies including this one</p>
                      {pregnancyForm.formState.errors.gravida && (
                        <p className="text-xs text-error">{pregnancyForm.formState.errors.gravida.message}</p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-semibold text-on-surface">
                        Para (P) <span className="text-error">*</span>
                      </label>
                      <input type="number" min="0" {...pregnancyForm.register('para')} className="form-input" />
                      <p className="text-[11px] text-secondary">Previous deliveries ≥ 20 weeks</p>
                      {pregnancyForm.formState.errors.para && (
                        <p className="text-xs text-error">{pregnancyForm.formState.errors.para.message}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="border-t border-outline-variant/10" />

                {/* Section: Care Team */}
                <div className="space-y-md">
                  <p className="text-xs font-bold text-secondary uppercase tracking-wider">👨‍⚕️ Care Team</p>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-on-surface">Assigned Obstetrician</label>
                    <select {...pregnancyForm.register('assigned_doctor')} className="form-input">
                      <option value="">— Select Doctor (Optional) —</option>
                      {doctorsData?.results?.map((d: any) => (
                        <option key={d.id} value={d.id}>{d.full_name} · {d.specialisation}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="border-t border-outline-variant/10" />

                {/* Section: Clinical Notes */}
                <div className="space-y-md">
                  <p className="text-xs font-bold text-secondary uppercase tracking-wider">📋 Clinical Notes</p>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-on-surface">Pre-existing / Chronic Conditions</label>
                    <textarea
                      rows={3}
                      {...pregnancyForm.register('chronic_conditions')}
                      className="form-input"
                      placeholder="e.g. Gestational Diabetes, Hypertension, Thyroid disorder, Anaemia..."
                    ></textarea>
                  </div>
                </div>

              </div>
              {/* Footer */}
              <div className="px-lg py-md border-t border-outline-variant/10 flex items-center justify-between shrink-0">
                <p className="text-xs text-secondary">
                  Fields marked <span className="text-error font-bold">*</span> are required
                </p>
                <div className="flex gap-sm">
                  <button type="button" onClick={() => setShowPregnancyModal(false)} className="btn-secondary">Cancel</button>
                  <button type="submit" className="btn-primary" disabled={createPregnancy.isPending}>
                    {createPregnancy.isPending ? 'Creating...' : '🤰 Register Pregnancy'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
