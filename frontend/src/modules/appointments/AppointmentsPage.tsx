import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  useAppointmentsList,
  useCreateAppointment,
  useConfirmAppointment,
  useCancelAppointment,
  useStartAppointment,
  useCompleteAppointment,
  useNoShowAppointment,
  useNextSlot
} from '@/hooks/useAppointments'
import { usePatientsList, useDoctorsList } from '@/hooks/usePatients'
import type { Appointment } from '@/api/endpoints/appointments.api'
import { useNavigate } from 'react-router-dom'
import { useCreateConsultation } from '@/hooks/useConsultations'
import { consultationsApi } from '@/api/endpoints/consultations.api'

// ─── Validation Schema ───────────────────────────────────────────────────────

const appointmentSchema = z.object({
  patient: z.string().min(1, 'Patient is required'),
  doctor: z.string().min(1, 'Doctor is required'),
  appointment_date: z.string().min(1, 'Date is required'),
  appointment_time: z.string().min(1, 'Time is required'),
  appointment_type: z.enum(['new_patient', 'follow_up', 'anc', 'emergency', 'scan', 'lab_review', 'gdm_screen', 'ultrasound']),
  notes: z.string().optional(),
}).refine(data => {
  const chosenDateTime = new Date(`${data.appointment_date}T${data.appointment_time}`)
  return chosenDateTime > new Date()
}, {
  message: 'Appointment must be in the future',
  path: ['appointment_date']
})

export default function AppointmentsPage() {
  const navigate = useNavigate()
  const createConsultation = useCreateConsultation()
  const [loadingConsultId, setLoadingConsultId] = useState<string | null>(null)

  const handleResumeConsultation = async (apptId: string) => {
    setLoadingConsultId(apptId)
    try {
      const data = await consultationsApi.list({ appointment: apptId })
      if (data.results && data.results.length > 0) {
        navigate(`/consultations/${data.results[0].id}`)
      } else {
        const newConsult = await consultationsApi.create({ appointment: apptId })
        navigate(`/consultations/${newConsult.id}`)
      }
    } catch (err) {
      console.error('Failed to resume consultation:', err)
      alert('Failed to load the active consultation workspace. Please try again.')
    } finally {
      setLoadingConsultId(null)
    }
  }

  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')
  const [page, setPage] = useState(1)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  // Filters state
  const [filterDoctor, setFilterDoctor] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  // Modals state
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancellingAppt, setCancellingAppt] = useState<Appointment | null>(null)
  const [cancelReason, setCancelReason] = useState('')

  // Dynamic next slot helpers
  const [slotDoctor, setSlotDoctor] = useState('')
  const [slotDate, setSlotDate] = useState(new Date().toISOString().split('T')[0])

  // Queries
  const todayStr = new Date().toISOString().split('T')[0]
  
  // Today's appointments for KPI summaries
  const { data: todayList } = useAppointmentsList({
    appointment_datetime__date: todayStr
  })

  // Filtered appointments list
  const { data: apptsData, isLoading: isLoadingAppts } = useAppointmentsList({
    page,
    doctor: filterDoctor || undefined,
    appointment_type: filterType || undefined,
    status: filterStatus || undefined,
    appointment_datetime__date: viewMode === 'list' ? undefined : selectedDate
  })

  const { data: patientsData } = usePatientsList({ page: 1, ordering: 'full_name' })
  const { data: doctorsData } = useDoctorsList()
  const { data: slotInfo } = useNextSlot(slotDoctor, slotDate)

  // Mutations
  const createAppointment = useCreateAppointment()
  const confirmAppointment = useConfirmAppointment()
  const startAppointment = useStartAppointment()
  const completeAppointment = useCompleteAppointment()
  const noShowAppointment = useNoShowAppointment()
  const cancelAppointment = useCancelAppointment()

  // Form setup
  const bookingForm = useForm<z.infer<typeof appointmentSchema>>({
    resolver: zodResolver(appointmentSchema) as any,
    defaultValues: {
      appointment_type: 'anc',
      appointment_date: new Date().toISOString().split('T')[0],
      appointment_time: '10:00'
    }
  })

  // Watch doctor selection in form to auto-query next slot
  const watchedDoctor = bookingForm.watch('doctor')
  const watchedDate = bookingForm.watch('appointment_date')

  useEffect(() => {
    if (watchedDoctor && watchedDate) {
      setSlotDoctor(watchedDoctor)
      setSlotDate(watchedDate)
    }
  }, [watchedDoctor, watchedDate])

  // KPI calculations
  const totalToday = todayList?.count || 0
  const completedToday = todayList?.results?.filter(a => a.status === 'completed').length || 0
  const pendingToday = todayList?.results?.filter(a => ['scheduled', 'confirmed', 'in_progress'].includes(a.status)).length || 0
  const cancelledToday = todayList?.results?.filter(a => ['cancelled', 'no_show'].includes(a.status)).length || 0

  // Form handlers
  const handleBook = (data: z.infer<typeof appointmentSchema>) => {
    const combinedDateTime = new Date(`${data.appointment_date}T${data.appointment_time}`).toISOString()
    createAppointment.mutate({
      patient: data.patient,
      doctor: data.doctor,
      appointment_datetime: combinedDateTime,
      appointment_type: data.appointment_type,
      notes: data.notes || ''
    }, {
      onSuccess: () => {
        setShowBookingModal(false)
        bookingForm.reset()
      }
    })
  }

  const handleCancelClick = (appt: Appointment) => {
    setCancellingAppt(appt)
    setCancelReason('')
    setShowCancelModal(true)
  }

  const handleConfirmCancel = () => {
    if (cancellingAppt) {
      cancelAppointment.mutate({
        id: cancellingAppt.id,
        reason: cancelReason
      }, {
        onSuccess: () => {
          setShowCancelModal(false)
          setCancellingAppt(null)
        }
      })
    }
  }

  // Generate calendar days for navigation
  const calendarDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - 3 + i)
    return d
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-50 text-blue-600 border border-blue-200'
      case 'confirmed':
        return 'bg-success-50 text-success-600 border border-success-200'
      case 'in_progress':
        return 'bg-warning-50 text-orange-600 border border-orange-200'
      case 'completed':
        return 'bg-neutral-100 text-neutral-600 border border-neutral-200'
      case 'no_show':
      case 'cancelled':
        return 'bg-error-container/20 text-error border border-error-container/30'
      default:
        return 'bg-neutral-50 text-secondary'
    }
  }

  return (
    <>
      <div className="p-margin-desktop space-y-gutter">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-xs mb-md text-label-md font-label-md text-on-surface-variant">
          <a className="hover:text-primary transition-colors cursor-pointer">Dashboard</a>
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          <span className="text-on-surface font-semibold">Appointments</span>
        </div>

        {/* Page Header */}
        <div className="flex justify-between items-end mb-xl">
          <div>
            <h2 className="font-headline-lg text-headline-lg text-on-background">Appointment Management</h2>
            <p className="text-body-lg text-secondary">
              Review patient clinical slots, track consultations, and book prenatal checkups.
            </p>
          </div>
          <button
            onClick={() => {
              bookingForm.reset({
                appointment_type: 'anc',
                appointment_date: new Date().toISOString().split('T')[0],
                appointment_time: '10:00',
                patient: '', doctor: '', notes: ''
              })
              setShowBookingModal(true)
            }}
            className="btn-primary flex items-center gap-base"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            <span className="font-label-lg text-label-lg">New Appointment</span>
          </button>
        </div>

        {/* KPI Dashboard cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter mb-xl">
          <div className="bg-white p-lg rounded-xl border border-outline-variant/20 flex items-center gap-lg shadow-sm">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined !text-[32px]">event_note</span>
            </div>
            <div>
              <p className="text-label-md text-secondary font-medium">Today's Appointments</p>
              <h3 className="font-display-lg text-[32px] text-on-background">{totalToday}</h3>
            </div>
          </div>

          <div className="bg-white p-lg rounded-xl border border-outline-variant/20 flex items-center gap-lg shadow-sm">
            <div className="w-14 h-14 rounded-full bg-success-100 flex items-center justify-center text-success-600">
              <span className="material-symbols-outlined !text-[32px]">check_circle</span>
            </div>
            <div>
              <p className="text-label-md text-secondary font-medium">Completed Today</p>
              <h3 className="font-display-lg text-[32px] text-on-background">{completedToday}</h3>
            </div>
          </div>

          <div className="bg-white p-lg rounded-xl border border-outline-variant/20 flex items-center gap-lg shadow-sm">
            <div className="w-14 h-14 rounded-full bg-warning-50 flex items-center justify-center text-orange-500">
              <span className="material-symbols-outlined !text-[32px]">pending_actions</span>
            </div>
            <div>
              <p className="text-label-md text-secondary font-medium">Active / Pending</p>
              <h3 className="font-display-lg text-[32px] text-on-background">{pendingToday}</h3>
            </div>
          </div>

          <div className="bg-white p-lg rounded-xl border border-outline-variant/20 flex items-center gap-lg shadow-sm">
            <div className="w-14 h-14 rounded-full bg-error-container/20 flex items-center justify-center text-error">
              <span className="material-symbols-outlined !text-[32px]">cancel</span>
            </div>
            <div>
              <p className="text-label-md text-secondary font-medium">Cancelled / No Show</p>
              <h3 className="font-display-lg text-[32px] text-on-background">{cancelledToday}</h3>
            </div>
          </div>
        </div>

        {/* Tab Controls & Filters toolbar */}
        <div className="bg-white rounded-xl border border-outline-variant/20 shadow-sm overflow-hidden">
          <div className="px-lg py-md border-b border-outline-variant/20 bg-neutral-50/40 space-y-md">
            <div className="flex items-center justify-between">
              <div className="flex gap-sm p-1 bg-neutral-100 rounded-lg">
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-md py-1.5 rounded-md text-label-md font-bold transition-all ${
                    viewMode === 'list'
                      ? 'bg-white text-primary shadow-sm'
                      : 'text-secondary hover:text-primary'
                  }`}
                >
                  List View
                </button>
                <button
                  onClick={() => setViewMode('calendar')}
                  className={`px-md py-1.5 rounded-md text-label-md font-bold transition-all ${
                    viewMode === 'calendar'
                      ? 'bg-white text-primary shadow-sm'
                      : 'text-secondary hover:text-primary'
                  }`}
                >
                  Calendar View
                </button>
              </div>
            </div>

            {/* Dynamic Filter Strip */}
            {viewMode === 'list' ? (
              <div className="flex flex-wrap items-center gap-md">
                <span className="text-xs font-bold text-secondary uppercase tracking-wider">Filters:</span>

                <select
                  value={filterDoctor}
                  onChange={(e) => setFilterDoctor(e.target.value)}
                  className="bg-white border border-outline-variant/20 rounded-lg px-3 py-1.5 text-label-md w-full sm:w-48 form-input"
                >
                  <option value="">All Doctors</option>
                  {doctorsData?.results?.map((d: any) => (
                    <option key={d.id} value={d.id}>{d.full_name}</option>
                  ))}
                </select>

                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="bg-white border border-outline-variant/20 rounded-lg px-3 py-1.5 text-label-md w-full sm:w-48 form-input"
                >
                  <option value="">All Appointment Types</option>
                  <option value="anc">ANC Checkup</option>
                  <option value="ultrasound">Ultrasound</option>
                  <option value="consultation">Consultation</option>
                  <option value="follow_up">Follow-up</option>
                </select>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-white border border-outline-variant/20 rounded-lg px-3 py-1.5 text-label-md w-full sm:w-40 form-input"
                >
                  <option value="">All Statuses</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="no_show">No Show</option>
                </select>

                {(filterDoctor || filterType || filterStatus) && (
                  <button
                    onClick={() => {
                      setFilterDoctor('')
                      setFilterType('')
                      setFilterStatus('')
                    }}
                    className="text-primary text-label-md font-bold hover:underline"
                  >
                    Clear All
                  </button>
                )}
              </div>
            ) : (
              // Calendar View Day Selection bar
              <div className="flex flex-col space-y-sm">
                <p className="text-xs font-bold text-secondary uppercase tracking-wider">🗓️ Select Date</p>
                <div className="flex items-center gap-sm">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="form-input max-w-[200px]"
                  />
                  <div className="flex gap-xs overflow-x-auto py-1">
                    {calendarDays.map((date, idx) => {
                      const dateIso = date.toISOString().split('T')[0]
                      const isSelected = selectedDate === dateIso
                      return (
                        <button
                          key={idx}
                          onClick={() => setSelectedDate(dateIso)}
                          className={`px-sm py-1.5 rounded-lg border text-xs font-semibold whitespace-nowrap transition-all ${
                            isSelected
                              ? 'bg-primary text-white border-primary shadow-sm'
                              : 'bg-white hover:bg-neutral-100 border-outline-variant/20'
                          }`}
                        >
                          {date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Roster Listing / Table */}
          <div className="p-lg">
            {isLoadingAppts ? (
              <div className="flex flex-col items-center justify-center py-xl">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
                <span className="ml-3 text-secondary font-medium mt-sm">Fetching appointments list...</span>
              </div>
            ) : !apptsData?.results || apptsData.results.length === 0 ? (
              <div className="text-center py-xl bg-neutral-50 rounded-xl border border-dashed border-outline-variant p-lg max-w-md mx-auto my-lg">
                <span className="material-symbols-outlined text-[48px] text-neutral-300 mb-2">event_note</span>
                <h3 className="font-title-lg font-bold">No Appointments Found</h3>
                <p className="font-body-md text-secondary mt-1">Try scheduling a new slot or adjusting filters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-neutral-50 text-secondary text-label-md border-b border-outline-variant/20">
                      <th className="px-lg py-md font-bold">TOKEN</th>
                      <th className="px-lg py-md font-bold">PATIENT NAME</th>
                      <th className="px-lg py-md font-bold">ASSIGNED DOCTOR</th>
                      <th className="px-lg py-md font-bold">APPOINTMENT TIME</th>
                      <th className="px-lg py-md font-bold">TYPE</th>
                      <th className="px-lg py-md font-bold">STATUS</th>
                      <th className="px-lg py-md font-bold text-right">ACTIONS & STATE TRANSITIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/10">
                    {apptsData.results.map((appt) => (
                      <tr key={appt.id} className="hover:bg-neutral-50/50 transition-colors group">
                        <td className="px-lg py-md font-bold text-primary">#{appt.token_number}</td>
                        <td className="px-lg py-md">
                          <div className="flex items-center gap-sm">
                            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">
                              {appt.patient_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <span className="font-medium text-on-surface">{appt.patient_name}</span>
                              <p className="text-[9px] text-secondary font-mono">MRN: {appt.patient_mrn}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-lg py-md text-sm">Dr. {appt.doctor_name}</td>
                        <td className="px-lg py-md font-semibold text-sm">
                          {new Date(appt.appointment_datetime).toLocaleString('en-US', {
                            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                          })}
                        </td>
                        <td className="px-lg py-md">
                          <span className="text-[11px] font-semibold px-2 py-0.5 bg-neutral-100 rounded text-secondary">
                            {appt.type_display || appt.appointment_type.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-lg py-md">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${getStatusBadge(appt.status)}`}>
                            {appt.status_display}
                          </span>
                        </td>
                        <td className="px-lg py-md text-right">
                          <div className="flex justify-end gap-sm items-center">
                            {/* State transitions context buttons */}
                            {appt.status === 'scheduled' && (
                              <button
                                onClick={() => confirmAppointment.mutate(appt.id)}
                                className="px-2.5 py-1 text-xs bg-success-600 text-white rounded font-bold hover:opacity-90 transition-opacity"
                              >
                                Confirm
                              </button>
                            )}
                            {appt.status === 'confirmed' && (
                              <div className="flex gap-xs">
                                <button
                                  onClick={() => {
                                    createConsultation.mutate(
                                      { appointment: appt.id },
                                      {
                                        onSuccess: (newConsult) => {
                                          navigate(`/consultations/${newConsult.id}`)
                                        },
                                      }
                                    )
                                  }}
                                  disabled={createConsultation.isPending}
                                  className="px-2.5 py-1 text-xs bg-primary text-white rounded font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
                                >
                                  {createConsultation.isPending ? 'Starting...' : 'Start'}
                                </button>
                                <button
                                  onClick={() => noShowAppointment.mutate(appt.id)}
                                  className="px-2.5 py-1 text-xs bg-neutral-200 text-secondary rounded font-bold hover:bg-neutral-300 transition-colors"
                                >
                                  No Show
                                </button>
                              </div>
                            )}
                            {appt.status === 'in_progress' && (
                              <div className="flex gap-xs">
                                <button
                                  onClick={() => handleResumeConsultation(appt.id)}
                                  disabled={loadingConsultId === appt.id}
                                  className="px-2.5 py-1 text-xs bg-primary text-white rounded font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
                                >
                                  {loadingConsultId === appt.id ? 'Resuming...' : 'Consult'}
                                </button>
                                <button
                                  onClick={() => completeAppointment.mutate(appt.id)}
                                  className="px-2.5 py-1 text-xs bg-neutral-900 text-white rounded font-bold hover:opacity-90 transition-opacity"
                                >
                                  Complete
                                </button>
                              </div>
                            )}

                            {/* Cancel Button */}
                            {!['completed', 'cancelled', 'no_show'].includes(appt.status) && (
                              <button
                                onClick={() => handleCancelClick(appt)}
                                className="p-1 text-error hover:bg-error-container/20 rounded transition-colors"
                                title="Cancel Appointment"
                              >
                                <span className="material-symbols-outlined text-[20px]">cancel</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Pagination footer */}
                <div className="flex justify-between items-center mt-lg pt-md border-t border-outline-variant/10">
                  <p className="text-xs text-secondary">
                    Showing page <span className="font-bold">{page}</span>
                  </p>
                  <div className="flex gap-sm">
                    <button
                      onClick={() => setPage(p => Math.max(p - 1, 1))}
                      disabled={page === 1}
                      className="btn-secondary px-sm py-1.5"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPage(p => p + 1)}
                      disabled={!apptsData.next}
                      className="btn-secondary px-sm py-1.5"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── MODAL: Book Appointment ───────────────────────────────────────────── */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-md">
          <div className="bg-white rounded-2xl shadow-2xl border border-outline-variant/20 w-full max-w-xl flex flex-col max-h-[90vh]">
            <div className="px-lg py-md border-b border-outline-variant/10 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-sm">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined">calendar_today</span>
                </div>
                <div>
                  <h3 className="text-title-lg font-bold text-on-surface">Book New Appointment</h3>
                  <p className="text-xs text-secondary">Schedule clinical visits and consultations</p>
                </div>
              </div>
              <button
                onClick={() => setShowBookingModal(false)}
                className="w-8 h-8 rounded-lg hover:bg-neutral-100 flex items-center justify-center text-neutral-400 hover:text-neutral-700 transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={bookingForm.handleSubmit(handleBook)} className="flex flex-col flex-1 min-h-0">
              <div className="overflow-y-auto flex-1 px-lg py-md space-y-md">
                
                {/* Patient selection */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-on-surface">Select Patient <span className="text-error">*</span></label>
                  <select {...bookingForm.register('patient')} className="form-input">
                    <option value="">— Choose Patient —</option>
                    {patientsData?.results?.map((p: any) => (
                      <option key={p.id} value={p.id}>{p.full_name} ({p.mrn})</option>
                    ))}
                  </select>
                  {bookingForm.formState.errors.patient && <p className="text-xs text-error">{bookingForm.formState.errors.patient.message}</p>}
                </div>

                {/* Doctor selection */}
                <div className="grid grid-cols-2 gap-md">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-on-surface">Select Obstetrician <span className="text-error">*</span></label>
                    <select {...bookingForm.register('doctor')} className="form-input">
                      <option value="">— Choose Doctor —</option>
                      {doctorsData?.results?.map((d: any) => (
                        <option key={d.id} value={d.id}>{d.full_name} · {d.specialisation}</option>
                      ))}
                    </select>
                    {bookingForm.formState.errors.doctor && <p className="text-xs text-error">{bookingForm.formState.errors.doctor.message}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-on-surface">Appointment Type <span className="text-error">*</span></label>
                    <select {...bookingForm.register('appointment_type')} className="form-input">
                      <option value="anc">Antenatal Care (ANC)</option>
                      <option value="new_patient">New Patient Consultation</option>
                      <option value="follow_up">Follow-up Visit</option>
                      <option value="ultrasound">Ultrasound Scan</option>
                      <option value="gdm_screen">GDM Screening</option>
                      <option value="lab_review">Lab Review</option>
                      <option value="emergency">Emergency Visit</option>
                      <option value="scan">Other Medical Scan</option>
                    </select>
                  </div>
                </div>

                {/* Date & Time selection */}
                <div className="grid grid-cols-2 gap-md">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-on-surface">Appointment Date <span className="text-error">*</span></label>
                    <input type="date" {...bookingForm.register('appointment_date')} className="form-input" />
                    {bookingForm.formState.errors.appointment_date && <p className="text-xs text-error">{bookingForm.formState.errors.appointment_date.message}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-on-surface">Appointment Time <span className="text-error">*</span></label>
                    <input type="time" {...bookingForm.register('appointment_time')} className="form-input" />
                  </div>
                </div>

                {/* Next available slot hint */}
                {slotInfo && (
                  <div className="p-sm bg-neutral-50 rounded-lg border border-outline-variant/10 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-xs">
                      <span className="material-symbols-outlined text-[18px] text-primary">schedule</span>
                      <span className="text-secondary font-medium">Estimated next slot:</span>
                    </div>
                    <span className="font-bold text-on-surface">
                      {slotInfo.available && slotInfo.next_available_slot
                        ? new Date(slotInfo.next_available_slot).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                        : 'No slots available'}
                    </span>
                  </div>
                )}

                {/* Notes */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-on-surface">Clinical Notes</label>
                  <textarea rows={3} {...bookingForm.register('notes')} className="form-input" placeholder="Reasons for visit, referrals, clinical indicators..."></textarea>
                </div>

              </div>

              {/* Footer */}
              <div className="px-lg py-md border-t border-outline-variant/10 flex justify-end gap-sm shrink-0">
                <button type="button" onClick={() => setShowBookingModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary font-bold" disabled={createAppointment.isPending}>
                  {createAppointment.isPending ? 'Booking...' : '🗓️ Confirm Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Cancel Appointment ─────────────────────────────────────────── */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-md">
          <div className="bg-white rounded-2xl shadow-2xl border border-outline-variant/20 w-full max-w-md flex flex-col p-lg space-y-md">
            <div className="flex items-center gap-sm">
              <div className="w-9 h-9 rounded-xl bg-error-container/20 flex items-center justify-center text-error">
                <span className="material-symbols-outlined">cancel</span>
              </div>
              <h3 className="text-title-lg font-bold text-on-surface">Cancel Appointment</h3>
            </div>
            
            <p className="text-sm text-secondary">
              Are you sure you want to cancel the appointment for <span className="font-semibold text-on-surface">{cancellingAppt?.patient_name}</span>? This action is irreversible.
            </p>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-on-surface">Cancellation Reason (Optional)</label>
              <input
                type="text"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Patient requested reschedule, Doctor unavailable"
                className="form-input"
              />
            </div>

            <div className="flex justify-end gap-sm pt-sm">
              <button
                type="button"
                onClick={() => {
                  setShowCancelModal(false)
                  setCancellingAppt(null)
                }}
                className="btn-secondary"
              >
                No, Keep
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                className="btn-danger font-bold"
                disabled={cancelAppointment.isPending}
              >
                {cancelAppointment.isPending ? 'Cancelling...' : '⚠️ Yes, Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
