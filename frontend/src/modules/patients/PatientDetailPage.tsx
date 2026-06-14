import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
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

// Validation Schemas for Subforms
const allergySchema = z.object({
  allergen: z.string().min(1, 'Allergen is required'),
  reaction_type: z.string().min(1, 'Reaction is required'),
  severity: z.enum(['mild', 'moderate', 'severe', 'life_threatening']),
  recorded_date: z.string().refine(val => new Date(val) <= new Date(), 'Date cannot be in the future'),
  notes: z.string().optional(),
})

const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().regex(/^\+?[\d\s\-().]{7,20}$/, 'Enter a valid phone number (7-20 digits)'),
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

export default function PatientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [showAllergyModal, setShowAllergyModal] = useState(false)
  const [showContactModal, setShowContactModal] = useState(false)
  const [showPregnancyModal, setShowPregnancyModal] = useState(false)

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
              {patient.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
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
              contacts.map((c) => (
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
              allergiesData.results.map((a) => (
                <div key={a.id} className={`flex justify-between items-start p-sm rounded-lg border ${
                  a.is_blocking 
                    ? 'bg-error-container/20 border-error-container/30' 
                    : 'bg-neutral-50 border-neutral-100'
                }`}>
                  <div>
                    <div className="flex items-center gap-sm">
                      <p className={`font-bold text-sm ${a.is_blocking ? 'text-danger-700' : 'text-on-surface'}`}>{a.allergen}</p>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        a.is_blocking 
                          ? 'bg-error text-white' 
                          : 'bg-warning-500 text-white'
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

      {/* ── MODAL: Add Emergency Contact ──────────────────────────────────────── */}
      {showContactModal && (
        <div className="fixed inset-0 bg-neutral-900/50 flex items-center justify-center z-50 p-sm">
          <div className="bg-white rounded-xl shadow-xl border border-outline-variant/30 max-w-md w-full overflow-hidden">
            <div className="p-md border-b border-outline-variant/10 flex justify-between items-center">
              <h3 className="font-title-lg font-bold text-on-surface">Add Emergency Contact</h3>
              <button onClick={() => setShowContactModal(false)} className="text-neutral-400 hover:text-neutral-600"><span className="material-symbols-outlined">close</span></button>
            </div>
            <form onSubmit={contactForm.handleSubmit(handleAddContact)} className="p-md space-y-sm">
              <div className="space-y-1">
                <label className="block text-xs font-semibold">Contact Name *</label>
                <input type="text" {...contactForm.register('name')} className="form-input text-sm" placeholder="John Doe" />
                {contactForm.formState.errors.name && <p className="text-[10px] text-danger-600">{contactForm.formState.errors.name.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-sm">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold">Primary Phone *</label>
                  <input type="text" {...contactForm.register('phone')} className="form-input text-sm" placeholder="Phone" />
                  {contactForm.formState.errors.phone && <p className="text-[10px] text-danger-600">{contactForm.formState.errors.phone.message}</p>}
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-semibold">Alternate Phone</label>
                  <input type="text" {...contactForm.register('alt_phone')} className="form-input text-sm" placeholder="Optional" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-semibold">Email Address</label>
                <input type="email" {...contactForm.register('email')} className="form-input text-sm" placeholder="email@example.com" />
              </div>
              <div className="grid grid-cols-2 gap-sm">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold">Relationship *</label>
                  <select {...contactForm.register('relationship_type')} className="form-input text-sm">
                    <option value="spouse">Spouse</option>
                    <option value="parent">Parent</option>
                    <option value="sibling">Sibling</option>
                    <option value="child">Child</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-semibold">Priority (1 = Primary) *</label>
                  <input type="number" {...contactForm.register('priority')} className="form-input text-sm" />
                </div>
              </div>
              <div className="flex justify-end gap-sm pt-md border-t border-outline-variant/10">
                <button type="button" onClick={() => setShowContactModal(false)} className="btn-secondary text-xs">Cancel</button>
                <button type="submit" className="btn-primary text-xs" disabled={addContact.isPending}>Add Link</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Log Allergy ────────────────────────────────────────────────── */}
      {showAllergyModal && (
        <div className="fixed inset-0 bg-neutral-900/50 flex items-center justify-center z-50 p-sm">
          <div className="bg-white rounded-xl shadow-xl border border-outline-variant/30 max-w-md w-full overflow-hidden">
            <div className="p-md border-b border-outline-variant/10 flex justify-between items-center">
              <h3 className="font-title-lg font-bold text-on-surface">Log Patient Allergy</h3>
              <button onClick={() => setShowAllergyModal(false)} className="text-neutral-400 hover:text-neutral-600"><span className="material-symbols-outlined">close</span></button>
            </div>
            <form onSubmit={allergyForm.handleSubmit(handleAddAllergy)} className="p-md space-y-sm">
              <div className="space-y-1">
                <label className="block text-xs font-semibold">Allergen *</label>
                <input type="text" {...allergyForm.register('allergen')} className="form-input text-sm" placeholder="e.g. Penicillin, Latex, Peanuts" />
                {allergyForm.formState.errors.allergen && <p className="text-[10px] text-danger-600">{allergyForm.formState.errors.allergen.message}</p>}
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-semibold">Reaction Type *</label>
                <input type="text" {...allergyForm.register('reaction_type')} className="form-input text-sm" placeholder="e.g. Anaphylaxis, Skin rash, Dyspnea" />
                {allergyForm.formState.errors.reaction_type && <p className="text-[10px] text-danger-600">{allergyForm.formState.errors.reaction_type.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-sm">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold">Severity *</label>
                  <select {...allergyForm.register('severity')} className="form-input text-sm">
                    <option value="mild">Mild</option>
                    <option value="moderate">Moderate</option>
                    <option value="severe">Severe</option>
                    <option value="life_threatening">Life Threatening</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-semibold">Recorded Date *</label>
                  <input type="date" {...allergyForm.register('recorded_date')} className="form-input text-sm" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-semibold">Clinical Notes</label>
                <textarea rows={2} {...allergyForm.register('notes')} className="form-input text-sm" placeholder="Add further details..."></textarea>
              </div>
              <div className="flex justify-end gap-sm pt-md border-t border-outline-variant/10">
                <button type="button" onClick={() => setShowAllergyModal(false)} className="btn-secondary text-xs">Cancel</button>
                <button type="submit" className="btn-danger text-xs animate-none" disabled={recordAllergy.isPending}>Log Allergy</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Register Pregnancy Intake ──────────────────────────────────── */}
      {showPregnancyModal && (
        <div className="fixed inset-0 bg-neutral-900/50 flex items-center justify-center z-50 p-sm">
          <div className="bg-white rounded-xl shadow-xl border border-outline-variant/30 max-w-md w-full overflow-hidden">
            <div className="p-md border-b border-outline-variant/10 flex justify-between items-center">
              <h3 className="font-title-lg font-bold text-on-surface">Start Pregnancy Track Intake</h3>
              <button onClick={() => setShowPregnancyModal(false)} className="text-neutral-400 hover:text-neutral-600"><span className="material-symbols-outlined">close</span></button>
            </div>
            <form onSubmit={pregnancyForm.handleSubmit(handleStartPregnancy)} className="p-md space-y-sm">
              <div className="space-y-1">
                <label className="block text-xs font-semibold">Last Menstrual Period (LMP) *</label>
                <input type="date" {...pregnancyForm.register('lmp')} className="form-input text-sm" />
                {pregnancyForm.formState.errors.lmp && <p className="text-[10px] text-danger-600">{pregnancyForm.formState.errors.lmp.message}</p>}
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-semibold">Estimated Due Date (EDD) — optional (will auto-calculate if blank)</label>
                <input type="date" {...pregnancyForm.register('edd')} className="form-input text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-sm">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold">Gravida (G) *</label>
                  <input type="number" min="1" {...pregnancyForm.register('gravida')} className="form-input text-sm" />
                  {pregnancyForm.formState.errors.gravida && <p className="text-[10px] text-danger-600">{pregnancyForm.formState.errors.gravida.message}</p>}
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-semibold">Para (P) *</label>
                  <input type="number" min="0" {...pregnancyForm.register('para')} className="form-input text-sm" />
                  {pregnancyForm.formState.errors.para && <p className="text-[10px] text-danger-600">{pregnancyForm.formState.errors.para.message}</p>}
                </div>
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-semibold">Assigned Care Obstetrician</label>
                <select {...pregnancyForm.register('assigned_doctor')} className="form-input text-sm">
                  <option value="">Choose Doctor (Optional)</option>
                  {doctorsData?.results?.map((d) => (
                    <option key={d.id} value={d.id}>{d.full_name} ({d.specialisation})</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-semibold">Chronic Conditions Notes</label>
                <textarea rows={2} {...pregnancyForm.register('chronic_conditions')} className="form-input text-sm" placeholder="Pre-existing GDM, hypertension, thyroid, etc..."></textarea>
              </div>
              <div className="flex justify-end gap-sm pt-md border-t border-outline-variant/10">
                <button type="button" onClick={() => setShowPregnancyModal(false)} className="btn-secondary text-xs">Cancel</button>
                <button type="submit" className="btn-primary text-xs" disabled={createPregnancy.isPending}>Create File</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
