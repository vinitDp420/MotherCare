import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  useConsultation,
  useUpdateConsultation,
  useCompleteConsultation,
  useCancelConsultation,
  useFollowUpConsultation,
} from '@/hooks/useConsultations'
import { useCreatePrescription, usePrescriptionHistory } from '@/hooks/usePrescriptions'
import { prescriptionsApi } from '@/api/endpoints/prescriptions.api'
import { pharmacyApi } from '@/api/endpoints/pharmacy.api'

interface PrescriptionRow {
  medicineId: string
  medicineName: string
  medicineGenericName: string
  dosage: string
  frequency: string
  duration: string
  instructions: string
  searchQuery: string
  showSuggestions: boolean
  suggestions: any[]
}

export default function ConsultationPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [notes, setNotes] = useState('')
  const [diagnosis, setDiagnosis] = useState('')
  const [followUpDate, setFollowUpDate] = useState('')
  const [followUpTime, setFollowUpTime] = useState('11:30')
  const [followUpNotes, setFollowUpNotes] = useState('')

  // Prescription Rows state
  const [prescriptionRows, setPrescriptionRows] = useState<PrescriptionRow[]>([])
  const [prescriptionNotes, setPrescriptionNotes] = useState('')
  const [rxSaved, setRxSaved] = useState(false)
  
  // Feedback banners state
  const [successBanner, setSuccessBanner] = useState<string | null>(null)
  const [errorBanner, setErrorBanner] = useState<string | null>(null)

  // Fetch consultation details
  const { data: consultation, isLoading, isError, refetch } = useConsultation(id || '')

  // Fetch prescriptions for current consultation to check if already created
  const { data: currentPrescriptions } = useQuery({
    queryKey: ['consultation-prescriptions', id],
    queryFn: () => prescriptionsApi.list({ consultation: id }),
    enabled: !!id,
  })

  // Mutations
  const updateConsultation = useUpdateConsultation()
  const completeConsultation = useCompleteConsultation()
  const cancelConsultation = useCancelConsultation()
  const followUpConsultation = useFollowUpConsultation()
  const createPrescription = useCreatePrescription()

  // Prepopulate form states when consultation data is loaded
  useEffect(() => {
    if (consultation) {
      setNotes(consultation.clinical_notes || '')
      setDiagnosis(consultation.diagnosis || '')
      if (consultation.follow_up_datetime) {
        const dt = new Date(consultation.follow_up_datetime)
        setFollowUpDate(dt.toISOString().split('T')[0])
        const hours = String(dt.getHours()).padStart(2, '0')
        const mins = String(dt.getMinutes()).padStart(2, '0')
        setFollowUpTime(`${hours}:${mins}`)
      }
    }
  }, [consultation])

  // Prepopulate saved prescription items if they exist
  useEffect(() => {
    if (currentPrescriptions?.results && currentPrescriptions.results.length > 0) {
      const rx = currentPrescriptions.results[0]
      if (rx.items && rx.items.length > 0) {
        setPrescriptionRows(
          rx.items.map((item) => ({
            medicineId: item.medicine.id,
            medicineName: item.medicine.name,
            medicineGenericName: item.medicine.generic_name,
            dosage: item.dosage,
            frequency: item.frequency,
            duration: item.duration,
            instructions: item.instructions || '',
            searchQuery: item.medicine.name,
            showSuggestions: false,
            suggestions: [],
          }))
        )
        setRxSaved(true)
      }
    } else {
      // Initialize with one empty row if no saved prescription
      setPrescriptionRows([
        {
          medicineId: '',
          medicineName: '',
          medicineGenericName: '',
          dosage: '',
          frequency: 'OD',
          duration: '',
          instructions: '',
          searchQuery: '',
          showSuggestions: false,
          suggestions: [],
        },
      ])
      setRxSaved(false)
    }
  }, [currentPrescriptions])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <span className="mt-md text-secondary font-medium">Loading Clinical Workspace...</span>
      </div>
    )
  }

  if (isError || !consultation) {
    return (
      <div className="bg-error-container text-on-error-container p-lg rounded-xl max-w-lg mx-auto text-center mt-xl">
        <span className="material-symbols-outlined text-[48px] mb-xs">error</span>
        <h3 className="font-title-lg font-bold">Failed to Load Consultation</h3>
        <p className="font-body-md mt-xs">The requested consultation could not be found or is inaccessible.</p>
        <button onClick={() => navigate('/appointments')} className="btn-primary mt-md mx-auto">
          Back to Appointments
        </button>
      </div>
    )
  }

  const isReadOnly = consultation.is_terminal

  // Calculate age from DOB
  const calculateAge = (dobString?: string) => {
    if (!dobString) return 'N/A'
    const dob = new Date(dobString)
    const diffMs = Date.now() - dob.getTime()
    const ageDate = new Date(diffMs)
    return Math.abs(ageDate.getUTCFullYear() - 1970) + ' Yrs'
  }

  // Row operations
  const handleAddRow = () => {
    if (isReadOnly || rxSaved) return
    setPrescriptionRows([
      ...prescriptionRows,
      {
        medicineId: '',
        medicineName: '',
        medicineGenericName: '',
        dosage: '',
        frequency: 'OD',
        duration: '',
        instructions: '',
        searchQuery: '',
        showSuggestions: false,
        suggestions: [],
      },
    ])
  }

  const handleRemoveRow = (index: number) => {
    if (isReadOnly || rxSaved) return
    setPrescriptionRows(prescriptionRows.filter((_, i) => i !== index))
  }

  const handleUpdateRow = (index: number, fields: Partial<PrescriptionRow>) => {
    if (isReadOnly || rxSaved) return
    setPrescriptionRows(
      prescriptionRows.map((row, i) => (i === index ? { ...row, ...fields } : row))
    )
  }

  const handleSearchMedicine = async (index: number, query: string) => {
    handleUpdateRow(index, { searchQuery: query, showSuggestions: true })
    if (query.trim().length < 2) {
      handleUpdateRow(index, { suggestions: [] })
      return
    }
    try {
      const response = await pharmacyApi.listMedicines({ search: query, is_active: true })
      handleUpdateRow(index, { suggestions: response.results || [] })
    } catch (err) {
      console.error(err)
    }
  }

  const handleSelectMedicine = (index: number, med: any) => {
    handleUpdateRow(index, {
      medicineId: med.id,
      medicineName: med.name,
      medicineGenericName: med.generic_name,
      searchQuery: med.name,
      showSuggestions: false,
      suggestions: [],
    })
  }

  // Save Actions
  const handleSaveNotes = async () => {
    if (isReadOnly) return
    setErrorBanner(null)
    setSuccessBanner(null)
    updateConsultation.mutate(
      { id: consultation.id, data: { clinical_notes: notes, diagnosis } },
      {
        onSuccess: () => {
          setSuccessBanner('Clinical Notes & Diagnosis saved successfully.')
          refetch()
        },
        onError: (err: any) => {
          setErrorBanner(err.detail || 'Failed to save notes.')
        },
      }
    )
  }

  const handleSavePrescription = async () => {
    if (isReadOnly || rxSaved) return
    setErrorBanner(null)
    setSuccessBanner(null)

    // Validate prescription rows
    const validItems = prescriptionRows.filter((r) => r.medicineId)
    if (validItems.length === 0) {
      setErrorBanner('Please add at least one medication from the active formulary list.')
      return
    }

    const payload = {
      consultation: consultation.id,
      patient: consultation.patient,
      notes: prescriptionNotes,
      items: validItems.map((r, idx) => ({
        medicine: r.medicineId,
        dosage: r.dosage || 'As directed',
        frequency: r.frequency,
        duration: r.duration || 'Ongoing',
        instructions: r.instructions,
        sort_order: idx,
      })),
    }

    createPrescription.mutate(payload, {
      onSuccess: () => {
        setSuccessBanner('Prescription issued successfully.')
        setRxSaved(true)
      },
      onError: (err: any) => {
        setErrorBanner(err.detail || 'Failed to save prescription.')
      },
    })
  }

  const handleScheduleFollowUp = async () => {
    if (isReadOnly) return
    setErrorBanner(null)
    setSuccessBanner(null)

    if (!followUpDate) {
      setErrorBanner('Please select a valid follow-up date.')
      return
    }

    const payload = {
      follow_up_datetime: `${followUpDate}T${followUpTime}:00`,
      notes: followUpNotes || 'Follow-up appointment requested.',
    }

    followUpConsultation.mutate(
      { id: consultation.id, data: payload },
      {
        onSuccess: () => {
          setSuccessBanner('Follow-up appointment scheduled successfully.')
          refetch()
        },
        onError: (err: any) => {
          setErrorBanner(err.detail || 'Failed to schedule follow-up appointment.')
        },
      }
    )
  }

  const handleCompleteConsultation = async () => {
    if (isReadOnly) return
    setErrorBanner(null)
    setSuccessBanner(null)

    completeConsultation.mutate(
      { id: consultation.id, data: { clinical_notes: notes, diagnosis } },
      {
        onSuccess: () => {
          navigate('/appointments')
        },
        onError: (err: any) => {
          setErrorBanner(err.detail || 'Failed to complete consultation.')
        },
      }
    )
  }

  const handleCancelConsultation = async () => {
    if (isReadOnly) return
    if (confirm('Are you sure you want to cancel this consultation? This cannot be undone.')) {
      setErrorBanner(null)
      setSuccessBanner(null)

      cancelConsultation.mutate(
        { id: consultation.id, reason: 'Doctor cancelled session' },
        {
          onSuccess: () => {
            navigate('/appointments')
          },
          onError: (err: any) => {
            setErrorBanner(err.detail || 'Failed to cancel consultation.')
          },
        }
      )
    }
  }

  return (
    <div className="space-y-gutter">
      {/* Breadcrumbs */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-xs text-label-md font-label-md text-on-surface-variant">
          <a onClick={() => navigate('/dashboard')} className="hover:text-primary transition-colors cursor-pointer">Dashboard</a>
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          <a onClick={() => navigate('/appointments')} className="hover:text-primary transition-colors cursor-pointer">Appointments</a>
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          <span className="text-on-surface font-semibold">Active Consultation</span>
        </div>
        <div className="flex gap-sm">
          {!isReadOnly && (
            <>
              <button
                onClick={handleCancelConsultation}
                disabled={cancelConsultation.isPending}
                className="btn-secondary text-error hover:bg-error/10 border-error/20 flex items-center gap-xs font-bold"
              >
                <span className="material-symbols-outlined text-[18px]">cancel</span> Cancel Session
              </button>
              <button
                onClick={handleSaveNotes}
                disabled={updateConsultation.isPending}
                className="btn-secondary flex items-center gap-xs font-bold"
              >
                <span className="material-symbols-outlined text-[18px]">save</span> Save Progress
              </button>
              <button
                onClick={handleCompleteConsultation}
                disabled={completeConsultation.isPending}
                className="btn-primary bg-neutral-900 hover:bg-neutral-800 text-white flex items-center gap-xs font-bold shadow-md"
              >
                <span className="material-symbols-outlined text-[18px]">check_circle</span> Complete Consultation
              </button>
            </>
          )}
          {isReadOnly && (
            <button onClick={() => navigate('/appointments')} className="btn-secondary font-bold">
              Back to Appointments
            </button>
          )}
        </div>
      </div>

      {/* Page Header */}
      <div className="flex items-center justify-between pb-sm border-b border-outline-variant/10">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface flex items-center gap-sm">
            Clinical Workspace
            <span className={`text-xs font-bold tracking-wide uppercase px-2.5 py-0.5 rounded-full ${
              consultation.status === 'completed'
                ? 'bg-success-100 text-success-600'
                : consultation.status === 'cancelled'
                ? 'bg-error-100 text-error-600'
                : 'bg-primary-fixed text-on-primary-fixed-variant'
            }`}>
              {consultation.status_display}
            </span>
          </h2>
          <p className="text-secondary text-body-md mt-0.5">
            Appointment type: <span className="font-bold text-on-surface">{consultation.appointment_type}</span> (Token: #{consultation.appointment_token})
          </p>
        </div>
      </div>

      {/* Notifications Banners */}
      {successBanner && (
        <div className="bg-success-50 border border-success-200 text-success-700 p-md rounded-xl flex items-center gap-sm shadow-sm transition-all duration-200 animate-fadeIn">
          <span className="material-symbols-outlined text-[20px]">check_circle</span>
          <span className="text-sm font-medium">{successBanner}</span>
        </div>
      )}
      {errorBanner && (
        <div className="bg-error-50 border border-error-200 text-error-700 p-md rounded-xl flex items-center gap-sm shadow-sm transition-all duration-200 animate-fadeIn">
          <span className="material-symbols-outlined text-[20px]">error</span>
          <span className="text-sm font-medium">{errorBanner}</span>
        </div>
      )}
      {isReadOnly && (
        <div className="bg-neutral-50 border border-neutral-200 text-secondary p-md rounded-xl flex items-center gap-sm">
          <span className="material-symbols-outlined text-[20px]">lock</span>
          <span className="text-sm font-medium">This consultation has been finalized. All notes and records are immutable.</span>
        </div>
      )}

      {/* Split Workspace */}
      <div className="flex flex-col xl:flex-row gap-lg items-start">
        {/* Central clinical column */}
        <div className="flex-1 w-full space-y-lg">
          {/* Doctor SOAP Notes */}
          <div className="bg-white rounded-xl border border-outline-variant/20 p-lg shadow-sm space-y-md">
            <div className="flex items-center gap-sm text-primary">
              <span className="material-symbols-outlined text-[24px]">edit_note</span>
              <h3 className="text-title-lg font-bold text-on-surface">Clinical SOAP Notes</h3>
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isReadOnly}
              className="form-input w-full min-h-[160px] p-md text-body-md bg-surface-bright/50 focus:bg-white resize-none"
              placeholder="Record clinical symptoms, physical examinations, SOAP elements, or general medical comments..."
            />
          </div>

          {/* Clinical Diagnosis */}
          <div className="bg-white rounded-xl border border-outline-variant/20 p-lg shadow-sm space-y-md">
            <div className="flex items-center gap-sm text-primary">
              <span className="material-symbols-outlined text-[24px]">stethoscope</span>
              <h3 className="text-title-lg font-bold text-on-surface">Diagnosis</h3>
            </div>
            <input
              type="text"
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              disabled={isReadOnly}
              className="form-input w-full"
              placeholder="Enter active clinical diagnosis (e.g. Gestational Diabetes, Mild Anemia)..."
            />
          </div>

          {/* Prescriptions Panel */}
          <div className="bg-white rounded-xl border border-outline-variant/20 p-lg shadow-sm space-y-md">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-sm text-primary">
                <span className="material-symbols-outlined text-[24px]">prescriptions</span>
                <h3 className="text-title-lg font-bold text-on-surface">Prescription Management</h3>
              </div>
              {!isReadOnly && !rxSaved && (
                <button
                  type="button"
                  onClick={handleAddRow}
                  className="btn-secondary py-1 px-3 text-xs flex items-center gap-xs font-bold"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span> Add Medication
                </button>
              )}
            </div>

            {/* Prescription Items Table */}
            <div className="overflow-x-auto rounded-lg border border-outline-variant/20">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-neutral-50 border-b border-outline-variant/20 text-label-md font-bold text-secondary uppercase tracking-wider">
                    <th className="py-sm px-md min-w-[200px]">Medication Name</th>
                    <th className="py-sm px-md w-36">Dosage</th>
                    <th className="py-sm px-md w-48">Frequency</th>
                    <th className="py-sm px-md w-36">Duration</th>
                    <th className="py-sm px-md min-w-[150px]">Instructions</th>
                    {!isReadOnly && !rxSaved && <th className="py-sm px-md w-12 text-center"></th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {prescriptionRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-neutral-50/20 transition-colors">
                      {/* Name Autocomplete */}
                      <td className="py-sm px-md relative">
                        <div className="space-y-1">
                          <input
                            type="text"
                            value={row.searchQuery}
                            disabled={isReadOnly || rxSaved}
                            onChange={(e) => handleSearchMedicine(idx, e.target.value)}
                            onFocus={() => !isReadOnly && !rxSaved && handleUpdateRow(idx, { showSuggestions: true })}
                            className="form-input text-sm py-1 bg-transparent border-none focus:ring-0 focus:bg-neutral-50/50"
                            placeholder="Type generic or brand name..."
                          />
                          {row.medicineGenericName && (
                            <p className="text-[10px] text-secondary font-medium ml-1">
                              Generic: {row.medicineGenericName}
                            </p>
                          )}
                          
                          {/* Suggestion list */}
                          {!isReadOnly && !rxSaved && row.showSuggestions && row.suggestions.length > 0 && (
                            <div className="absolute left-md right-md mt-1 bg-white border border-outline-variant rounded-lg shadow-lg z-30 max-h-48 overflow-y-auto divide-y divide-outline-variant/10">
                              {row.suggestions.map((med) => (
                                <button
                                  key={med.id}
                                  type="button"
                                  onClick={() => handleSelectMedicine(idx, med)}
                                  className="w-full text-left px-md py-sm hover:bg-primary/5 transition-colors text-xs"
                                >
                                  <p className="font-semibold text-on-surface">{med.name}</p>
                                  <p className="text-[10px] text-secondary">
                                    {med.generic_name} ({med.category_display || med.category})
                                  </p>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Dosage */}
                      <td className="py-sm px-md">
                        <input
                          type="text"
                          value={row.dosage}
                          disabled={isReadOnly || rxSaved}
                          onChange={(e) => handleUpdateRow(idx, { dosage: e.target.value })}
                          className="form-input text-sm py-1 bg-transparent border-none focus:ring-0 focus:bg-neutral-50/50"
                          placeholder="e.g. 500mg"
                        />
                      </td>

                      {/* Frequency */}
                      <td className="py-sm px-md">
                        <select
                          value={row.frequency}
                          disabled={isReadOnly || rxSaved}
                          onChange={(e) => handleUpdateRow(idx, { frequency: e.target.value })}
                          className="form-input text-sm py-1 bg-transparent border-none focus:ring-0 focus:bg-neutral-50/50 appearance-none cursor-pointer"
                        >
                          <option value="OD">Once Daily (OD)</option>
                          <option value="BD">Twice Daily (BD)</option>
                          <option value="TDS">Three Times Daily (TDS)</option>
                          <option value="QID">Four Times Daily (QID)</option>
                          <option value="SOS">As Needed (SOS)</option>
                          <option value="STAT">Immediately (STAT)</option>
                          <option value="weekly">Weekly</option>
                        </select>
                      </td>

                      {/* Duration */}
                      <td className="py-sm px-md">
                        <input
                          type="text"
                          value={row.duration}
                          disabled={isReadOnly || rxSaved}
                          onChange={(e) => handleUpdateRow(idx, { duration: e.target.value })}
                          className="form-input text-sm py-1 bg-transparent border-none focus:ring-0 focus:bg-neutral-50/50"
                          placeholder="e.g. 7 Days"
                        />
                      </td>

                      {/* Instructions */}
                      <td className="py-sm px-md">
                        <input
                          type="text"
                          value={row.instructions}
                          disabled={isReadOnly || rxSaved}
                          onChange={(e) => handleUpdateRow(idx, { instructions: e.target.value })}
                          className="form-input text-sm py-1 bg-transparent border-none focus:ring-0 focus:bg-neutral-50/50"
                          placeholder="e.g. After food"
                        />
                      </td>

                      {/* Action */}
                      {!isReadOnly && !rxSaved && (
                        <td className="py-sm px-md text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveRow(idx)}
                            className="p-1 hover:bg-error/10 text-neutral-400 hover:text-error rounded transition-colors"
                          >
                            <span className="material-symbols-outlined text-[18px]">close</span>
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                  {prescriptionRows.length === 0 && (
                    <tr>
                      <td colSpan={isReadOnly || rxSaved ? 5 : 6} className="py-md text-center text-secondary text-sm">
                        No medications prescribed yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Save Prescription notes */}
            {!isReadOnly && !rxSaved && (
              <div className="space-y-sm pt-sm">
                <label className="block text-sm font-semibold text-secondary">General Prescription Notes (Optional)</label>
                <input
                  type="text"
                  value={prescriptionNotes}
                  onChange={(e) => setPrescriptionNotes(e.target.value)}
                  className="form-input text-sm w-full"
                  placeholder="Special warnings, dispensing directions or overall comments..."
                />
              </div>
            )}

            {!isReadOnly && !rxSaved && (
              <div className="flex justify-end pt-sm border-t border-outline-variant/10">
                <button
                  type="button"
                  onClick={handleSavePrescription}
                  className="btn-primary flex items-center gap-xs font-bold"
                >
                  <span className="material-symbols-outlined text-[18px]">done</span> Save & Issue Prescription
                </button>
              </div>
            )}
            {rxSaved && (
              <div className="flex items-center gap-xs text-success-600 bg-success-50 border border-success-100 rounded-lg p-sm font-semibold text-sm w-fit mt-md">
                <span className="material-symbols-outlined text-[18px]">lock</span> Prescription Issued (Immutable)
              </div>
            )}
          </div>

          {/* Bento Grid: Lab Reports & Follow-up */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
            {/* Lab Reports */}
            <div className="bg-white rounded-xl border border-outline-variant/20 p-lg shadow-sm space-y-md">
              <div className="flex items-center gap-sm text-primary">
                <span className="material-symbols-outlined text-[24px]">science</span>
                <h3 className="text-title-lg font-bold text-on-surface">Recent Lab Reports</h3>
              </div>
              <div className="space-y-sm">
                <div className="p-sm rounded-lg border border-outline-variant/20 bg-surface-bright/50 flex justify-between items-center hover:border-primary/50 transition-colors cursor-pointer group">
                  <div>
                    <p className="text-[10px] text-secondary font-medium">12 Oct '25</p>
                    <p className="text-sm font-semibold text-on-surface">Complete Blood Count (CBC)</p>
                    <p className="text-xs text-secondary">Hb: 11.2 g/dL (Slightly Low)</p>
                  </div>
                  <span className="text-primary text-xs font-bold group-hover:underline">View</span>
                </div>
                <div className="p-sm rounded-lg border border-outline-variant/20 bg-surface-bright/50 flex justify-between items-center hover:border-primary/50 transition-colors cursor-pointer group">
                  <div>
                    <p className="text-[10px] text-secondary font-medium">05 Sep '25</p>
                    <p className="text-sm font-semibold text-on-surface">First Trimester Ultrasound</p>
                    <p className="text-xs text-secondary">Viable singleton, 12 weeks</p>
                  </div>
                  <span className="text-primary text-xs font-bold group-hover:underline">View</span>
                </div>
              </div>
            </div>

            {/* Follow-up Scheduler */}
            <div className="bg-white rounded-xl border border-outline-variant/20 p-lg shadow-sm space-y-md">
              <div className="flex items-center gap-sm text-primary">
                <span className="material-symbols-outlined text-[24px]">event_upcoming</span>
                <h3 className="text-title-lg font-bold text-on-surface">Schedule Follow-up</h3>
              </div>
              <div className="space-y-md">
                <div className="grid grid-cols-2 gap-sm">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-secondary">Date</label>
                    <input
                      type="date"
                      value={followUpDate}
                      disabled={isReadOnly}
                      onChange={(e) => setFollowUpDate(e.target.value)}
                      className="form-input text-sm py-1.5"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-secondary">Time</label>
                    <select
                      value={followUpTime}
                      disabled={isReadOnly}
                      onChange={(e) => setFollowUpTime(e.target.value)}
                      className="form-input text-sm py-1.5 cursor-pointer"
                    >
                      <option value="09:00">09:00 AM</option>
                      <option value="10:00">10:00 AM</option>
                      <option value="11:30">11:30 AM</option>
                      <option value="14:00">02:00 PM</option>
                      <option value="15:30">03:30 PM</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-secondary">Follow-up Notes</label>
                  <input
                    type="text"
                    value={followUpNotes}
                    disabled={isReadOnly}
                    onChange={(e) => setFollowUpNotes(e.target.value)}
                    className="form-input text-sm py-1.5"
                    placeholder="Briefly state target for next visit..."
                  />
                </div>
                {!isReadOnly && (
                  <button
                    type="button"
                    onClick={handleScheduleFollowUp}
                    className="btn-secondary w-full py-1.5 font-bold flex items-center justify-center gap-xs"
                  >
                    <span className="material-symbols-outlined text-[18px]">calendar_today</span> Schedule Follow-up
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right context sidebar */}
        <aside className="w-full xl:w-[340px] shrink-0 space-y-lg relative">
          <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: "radial-gradient(#00685d 1px, transparent 1px)", backgroundSize: "16px 16px" }}></div>
          
          {/* Patient Header Details */}
          <div className="bg-white rounded-xl border border-outline-variant/20 p-md shadow-sm space-y-md">
            <div className="flex gap-md items-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 text-primary border-2 border-primary/20 overflow-hidden flex items-center justify-center">
                <span className="material-symbols-outlined text-[36px]">person</span>
              </div>
              <div>
                <h2 className="text-title-lg font-bold text-on-surface">{consultation.patient_name}</h2>
                <p className="text-label-md font-medium text-secondary">MRN: {consultation.patient_mrn}</p>
                <div className="mt-xs flex gap-xs">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-100 text-secondary border border-outline-variant/10">
                    {calculateAge(consultation.patient_dob)}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-100 text-secondary border border-outline-variant/10">
                    BG: {consultation.patient_blood_group}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Active Pregnancy Details */}
          {consultation.active_pregnancy ? (
            <div className="bg-white rounded-xl border border-outline-variant/20 p-md shadow-sm space-y-md border-t-4 border-t-primary">
              <div className="flex items-center gap-xs text-primary font-bold text-sm">
                <span className="material-symbols-outlined text-[20px]">child_care</span>
                Pregnancy Status
              </div>
              <div className="space-y-sm">
                <div className="flex justify-between items-end">
                  <span className="text-sm font-semibold text-primary">Week {consultation.active_pregnancy.current_week}</span>
                  <span className="text-xs text-secondary font-semibold">Trimester {consultation.active_pregnancy.trimester}</span>
                </div>
                <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-300"
                    style={{ width: `${(consultation.active_pregnancy.current_week / 40) * 100}%` }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-sm pt-xs">
                  <div className="p-xs bg-surface-bright/50 border border-outline-variant/20 rounded-lg text-center">
                    <p className="text-[10px] text-secondary font-medium">EDD</p>
                    <p className="text-xs font-bold text-on-surface">
                      {new Date(consultation.active_pregnancy.edd).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="p-xs bg-surface-bright/50 border border-outline-variant/20 rounded-lg text-center">
                    <p className="text-[10px] text-secondary font-medium">Risk Status</p>
                    <p className={`text-xs font-bold flex items-center justify-center gap-0.5 ${
                      consultation.active_pregnancy.risk_status === 'high' ? 'text-error' : 'text-success'
                    }`}>
                      <span className="material-symbols-outlined text-[14px]">
                        {consultation.active_pregnancy.risk_status === 'high' ? 'warning' : 'check_circle'}
                      </span>
                      {consultation.active_pregnancy.risk_status.toUpperCase()}
                    </p>
                  </div>
                </div>
                <p className="text-[10px] text-secondary font-semibold text-center mt-xs">
                  Gravida {consultation.active_pregnancy.gravida} | Para {consultation.active_pregnancy.para}
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-outline-variant/20 p-md shadow-sm text-center py-md text-secondary text-sm">
              <span className="material-symbols-outlined text-[32px] text-neutral-300 mb-1">pregnant_woman</span>
              <p>No active pregnancy tracked.</p>
            </div>
          )}

          {/* Patient Allergies */}
          <div className="bg-white rounded-xl border border-outline-variant/20 p-md shadow-sm space-y-md">
            <div className="flex items-center gap-xs text-secondary font-bold text-sm">
              <span className="material-symbols-outlined text-[20px] text-error">warning</span>
              Allergies & Alerts
            </div>
            {consultation.patient_allergies && consultation.patient_allergies.length > 0 ? (
              <ul className="space-y-sm">
                {consultation.patient_allergies.map((allergy, idx) => (
                  <li key={idx} className="flex gap-sm items-start p-xs hover:bg-neutral-50 rounded">
                    <span className="material-symbols-outlined text-[16px] text-error mt-0.5">adjust</span>
                    <div>
                      <p className="text-xs font-bold text-on-surface">{allergy.allergen}</p>
                      <p className="text-[10px] text-secondary font-semibold">
                        Severity: <span className="text-error">{allergy.severity}</span> ({allergy.reaction_type})
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-secondary italic">No known allergies reported.</p>
            )}
          </div>

          {/* Past Consultation Prescriptions History */}
          <div className="bg-white rounded-xl border border-outline-variant/20 p-md shadow-sm space-y-md">
            <div className="flex items-center gap-xs text-secondary font-bold text-sm">
              <span className="material-symbols-outlined text-[20px]">history</span>
              Prescription History
            </div>
            {consultation.previous_prescriptions && consultation.previous_prescriptions.length > 0 ? (
              <div className="space-y-sm max-h-60 overflow-y-auto pr-xs custom-scrollbar">
                {consultation.previous_prescriptions.map((rx, idx) => (
                  <div key={idx} className="p-sm bg-surface-bright/50 border border-outline-variant/10 rounded-lg space-y-1">
                    <div className="flex justify-between items-center text-[10px] text-secondary font-bold">
                      <span>{new Date(rx.issued_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      <span className="text-primary">Rx ID: {rx.id.substring(0, 8)}</span>
                    </div>
                    {rx.notes && <p className="text-[10px] text-on-surface font-medium italic">"{rx.notes}"</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-secondary italic">No prescription history found.</p>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
