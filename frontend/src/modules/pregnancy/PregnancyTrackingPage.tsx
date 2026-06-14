import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { 
  usePregnancyDetail, 
  usePregnancyAncVisits, 
  useRecordAncVisit, 
  usePregnancyRiskEvents, 
  useRecordRiskEvent, 
  usePregnancyVaccinations,
  useUpdateVaccinationStatus,
  usePregnancyWellnessPlan,
  useUpdateWellnessPlan,
  useSyncPregnancyWeek
} from '@/hooks/usePregnancy'
import { useDoctorsList } from '@/hooks/usePatients'

// Form validation schemas
const ancSchema = z.object({
  doctor: z.string().min(1, 'Doctor is required'),
  visit_date: z.string().refine(val => new Date(val) <= new Date(), 'Date cannot be in the future'),
  week_at_visit: z.coerce.number().min(1).max(45),
  visit_type: z.string().min(1, 'Visit type is required'),
  bp_systolic: z.coerce.number().min(60).max(200).optional(),
  bp_diastolic: z.coerce.number().min(40).max(140).optional(),
  weight_kg: z.coerce.number().min(30).max(200).optional(),
  fhr_bpm: z.coerce.number().min(60).max(200).optional(),
  glucose_mgdl: z.coerce.number().min(40).max(600).optional(),
  notes: z.string().optional(),
})

const riskSchema = z.object({
  event_date: z.string().refine(val => new Date(val) <= new Date(), 'Date cannot be in the future'),
  week_number: z.coerce.number().min(1).max(45),
  risk_level: z.enum(['low', 'moderate', 'high', 'critical']),
  event_description: z.string().min(1, 'Description is required'),
})

const wellnessSchema = z.object({
  dietary_protocol: z.string().optional(),
  dietary_items_raw: z.string().optional(),
  daily_precautions_raw: z.string().optional(),
})

export default function PregnancyTrackingPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [showAncModal, setShowAncModal] = useState(false)
  const [showRiskModal, setShowRiskModal] = useState(false)
  const [showWellnessModal, setShowWellnessModal] = useState(false)

  // Queries
  const { data: pregnancy, isLoading: isPregLoading } = usePregnancyDetail(id)
  const { data: ancData } = usePregnancyAncVisits(id)
  const { data: riskEvents } = usePregnancyRiskEvents(id)
  const { data: vaccinations } = usePregnancyVaccinations(id)
  const { data: wellness } = usePregnancyWellnessPlan(id)
  const { data: doctorsData } = useDoctorsList()

  // Mutations
  const recordAnc = useRecordAncVisit(id!)
  const recordRisk = useRecordRiskEvent(id!)
  const updateVacc = useUpdateVaccinationStatus(id!)
  const updateWellness = useUpdateWellnessPlan(id!)
  const syncWeek = useSyncPregnancyWeek()

  // Forms
  const ancForm = useForm<z.infer<typeof ancSchema>>({
    resolver: zodResolver(ancSchema) as any,
    defaultValues: { visit_type: 'routine', visit_date: new Date().toISOString().split('T')[0] }
  })

  const riskForm = useForm<z.infer<typeof riskSchema>>({
    resolver: zodResolver(riskSchema) as any,
    defaultValues: { risk_level: 'low', event_date: new Date().toISOString().split('T')[0] }
  })

  const wellnessForm = useForm<z.infer<typeof wellnessSchema>>({
    resolver: zodResolver(wellnessSchema) as any,
  })

  if (isPregLoading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
        <span className="ml-3 text-secondary font-medium">Loading pregnancy tracker...</span>
      </div>
    )
  }

  if (!pregnancy) {
    return (
      <div className="text-center py-xl bg-white rounded-xl border p-lg shadow-sm max-w-md mx-auto my-lg">
        <span className="material-symbols-outlined text-[48px] text-error mb-2">pregnant_woman</span>
        <h3 className="font-title-lg font-bold">Pregnancy Record Not Found</h3>
        <p className="font-body-md text-secondary mt-1">Verify that the patient has an active pregnancy file registered.</p>
        <button onClick={() => navigate('/patients')} className="btn-primary mt-md">Back to Roster</button>
      </div>
    )
  }

  const handleAddAnc = (data: any) => {
    recordAnc.mutate(data, {
      onSuccess: () => {
        setShowAncModal(false)
        ancForm.reset()
      }
    })
  }

  const handleAddRisk = (data: any) => {
    recordRisk.mutate(data, {
      onSuccess: () => {
        setShowRiskModal(false)
        riskForm.reset()
      }
    })
  }

  const handleToggleVacc = (vaccId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'administered' ? 'due' : 'administered'
    const payload: any = { status: nextStatus }
    if (nextStatus === 'administered') {
      payload.administered_date = new Date().toISOString().split('T')[0]
    } else {
      payload.administered_date = null
    }

    updateVacc.mutate({ vaccId, data: payload })
  }

  const handleEditWellness = (data: any) => {
    const dietaryItems = data.dietary_items_raw ? data.dietary_items_raw.split('\n').filter(Boolean) : []
    const dailyPrecautions = data.daily_precautions_raw ? data.daily_precautions_raw.split('\n').filter(Boolean) : []

    updateWellness.mutate({
      dietary_protocol: data.dietary_protocol,
      dietary_items: dietaryItems,
      daily_precautions: dailyPrecautions,
    }, {
      onSuccess: () => {
        setShowWellnessModal(false)
      }
    })
  }

  const openWellnessEdit = () => {
    if (wellness) {
      wellnessForm.reset({
        dietary_protocol: wellness.dietary_protocol,
        dietary_items_raw: wellness.dietary_items?.join('\n') || '',
        daily_precautions_raw: wellness.daily_precautions?.join('\n') || '',
      })
      setShowWellnessModal(true)
    }
  }

  // Calculate progress bar percent from gestational week
  const progressPercent = Math.min(100, Math.round((pregnancy.current_week / 40) * 100))

  return (
    <div className="p-margin-desktop space-y-gutter">
      {/* Breadcrumbs */}
      <nav className="flex text-label-md text-secondary gap-xs items-center mb-sm">
        <a className="hover:text-primary transition-colors cursor-pointer" onClick={() => navigate('/patients')}>Patient Records</a>
        <span className="material-symbols-outlined text-[14px]">chevron_right</span>
        <a className="hover:text-primary transition-colors cursor-pointer" onClick={() => navigate(`/patients/${pregnancy.patient}`)}>{pregnancy.patient_name}</a>
        <span className="material-symbols-outlined text-[14px]">chevron_right</span>
        <span className="text-primary font-bold">Pregnancy Tracking</span>
      </nav>

      {/* Header Info Banner */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-md">
        <div>
          <h2 className="text-headline-lg font-bold text-on-background">{pregnancy.patient_name} — Timeline</h2>
          <p className="text-sm text-secondary mt-1">MRN: <span className="font-semibold text-on-surface">{pregnancy.patient_mrn}</span> • Blood Group: {pregnancy.patient_blood_group}</p>
        </div>
        <div className="flex items-center flex-wrap gap-sm">
          <span className={`px-sm py-xs rounded-full text-label-md font-label-md flex items-center gap-xs border ${
            pregnancy.is_high_risk 
              ? 'bg-tertiary-fixed text-on-tertiary-fixed border-tertiary-fixed-dim/30' 
              : 'bg-success-50 text-success-600 border-success-100'
          }`}>
            <span className="material-symbols-outlined text-[16px]">warning</span>
            Risk Status: {pregnancy.risk_status_display}
          </span>
          <button 
            onClick={() => syncWeek.mutate(pregnancy.id)}
            className="bg-surface-container-high text-on-surface hover:bg-surface-container-highest px-sm py-xs rounded-full text-label-md font-label-md flex items-center gap-xs border transition-colors"
            title="Recalculate weeks from LMP"
          >
            <span className="material-symbols-outlined text-[16px]">sync</span> Sync Week
          </button>
        </div>
      </header>

      {/* Bento Grid: Progress & Vitals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
        {/* Pregnancy Progress Bar */}
        <div className="lg:col-span-2 bg-surface-container-lowest dark:bg-on-surface/5 rounded-xl border border-outline-variant/20 shadow-sm p-lg flex flex-col justify-between overflow-hidden relative">
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-surface-container rounded-full blur-3xl opacity-50 pointer-events-none"></div>
          <div className="relative z-10 w-full">
            <div className="flex justify-between items-start mb-xl">
              <div>
                <h3 className="text-title-lg font-bold text-on-surface mb-xs">Pregnancy Progress</h3>
                <p className="text-body-md text-secondary">EDD: {pregnancy.edd} (Dr. {pregnancy.doctor_name || 'Unassigned'})</p>
                <p className="text-xs text-outline mt-1">LMP: {pregnancy.lmp}</p>
              </div>
              <div className="text-right">
                <span className="text-headline-lg font-bold text-primary block">Week {pregnancy.current_week}</span>
                <span className="text-label-md font-semibold text-secondary uppercase tracking-wider">{pregnancy.trimester_display}</span>
              </div>
            </div>
            
            {/* Timeline Progress */}
            <div className="w-full relative mt-auto pt-sm">
              <div className="flex justify-between text-[11px] font-bold text-secondary mb-xs px-1">
                <span>Month 1</span><span>Month 2</span><span>Month 3</span><span>Month 4</span><span>Month 5</span><span>Month 6</span><span>Month 7</span><span>Month 8</span><span>Month 9</span>
              </div>
              <div className="h-3 w-full bg-surface-container-high rounded-full overflow-hidden relative border border-neutral-100">
                <div 
                  className="absolute top-0 left-0 h-full bg-primary rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
              <div className="flex justify-between mt-xs text-[10px] text-outline px-1">
                <span>Conception</span><span>Trimester 1</span><span>Trimester 2</span><span>Trimester 3</span><span>Due Date</span>
              </div>
            </div>
          </div>
        </div>

        {/* Latest Vitals Panel */}
        <div className="bg-surface-container-lowest dark:bg-on-surface/5 rounded-xl border border-outline-variant/20 shadow-sm p-lg flex flex-col justify-between">
          <h3 className="text-title-lg font-bold text-on-surface mb-sm">Latest ANC Vitals</h3>
          {pregnancy.recent_anc_visits && pregnancy.recent_anc_visits.length > 0 ? (
            <div className="grid grid-cols-2 gap-sm flex-grow">
              <div className="bg-surface-container-low p-sm rounded-lg flex flex-col justify-center dark:bg-surface-dim">
                <span className="text-label-md text-secondary mb-xs flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">monitor_heart</span> BP
                </span>
                <span className="text-headline-md font-bold text-on-surface">
                  {pregnancy.recent_anc_visits[0].bp_systolic || '—'}/{pregnancy.recent_anc_visits[0].bp_diastolic || '—'}
                </span>
              </div>
              <div className="bg-surface-container-low p-sm rounded-lg flex flex-col justify-center dark:bg-surface-dim">
                <span className="text-label-md text-secondary mb-xs flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">scale</span> Weight
                </span>
                <span className="text-headline-md font-bold text-on-surface">
                  {pregnancy.recent_anc_visits[0].weight_kg ? `${pregnancy.recent_anc_visits[0].weight_kg}kg` : '—'}
                </span>
              </div>
              <div className="bg-surface-container-low p-sm rounded-lg flex flex-col justify-center dark:bg-surface-dim">
                <span className="text-label-md text-secondary mb-xs flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">favorite</span> FHR
                </span>
                <span className="text-headline-md font-bold text-on-surface">
                  {pregnancy.recent_anc_visits[0].fhr_bpm ? `${pregnancy.recent_anc_visits[0].fhr_bpm} bpm` : '—'}
                </span>
              </div>
              <div className="bg-surface-container-low p-sm rounded-lg flex flex-col justify-center dark:bg-surface-dim">
                <span className="text-label-md text-secondary mb-xs flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">bloodtype</span> Glucose
                </span>
                <span className="text-headline-md font-bold text-tertiary">
                  {pregnancy.recent_anc_visits[0].glucose_mgdl ? `${pregnancy.recent_anc_visits[0].glucose_mgdl}` : '—'}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex-grow flex items-center justify-center p-md border-2 border-dashed border-neutral-100 rounded-lg">
              <p className="text-xs text-neutral-400 text-center">No ANC checkups logged yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* Pregnancy Risk Timeline */}
      <div className="bg-surface-container-lowest dark:bg-on-surface/5 rounded-xl border border-outline-variant/20 shadow-sm p-lg space-y-md">
        <div className="flex justify-between items-center border-b border-outline-variant/10 pb-sm">
          <h3 className="text-title-lg font-bold text-on-surface flex items-center gap-sm">
            <span className="material-symbols-outlined text-tertiary">timeline</span>
            Pregnancy Risk Timeline
          </h3>
          <button 
            onClick={() => setShowRiskModal(true)}
            className="text-tertiary hover:underline font-label-lg flex items-center gap-xs"
          >
            <span className="material-symbols-outlined text-[18px]">add_task</span> Log Risk Milestone
          </button>
        </div>

        {/* Risk Markers Timeline view */}
        <div className="relative pt-6 pb-2">
          <div className="absolute top-1/2 left-0 w-full h-1 bg-surface-container-high rounded-full -translate-y-1/2"></div>
          <div className="relative flex justify-between px-md">
            <div className="flex flex-col items-center gap-1.5 bg-surface-container-lowest px-2 py-0.5 rounded-lg z-10 shadow-sm border">
              <span className="text-[10px] text-outline font-bold">Week 1</span>
              <div className="w-3.5 h-3.5 bg-primary rounded-full"></div>
              <span className="text-[10px] text-primary">Conception</span>
            </div>
            
            {riskEvents?.slice(0, 3).map((event) => (
              <div key={event.id} className="flex flex-col items-center gap-1.5 bg-surface-container-lowest px-2 py-0.5 rounded-lg z-10 shadow-sm border">
                <span className="text-[10px] text-outline font-bold">Week {event.week_number}</span>
                <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] text-white ${
                  event.risk_level === 'low' 
                    ? 'bg-success-500' 
                    : event.risk_level === 'moderate' 
                    ? 'bg-warning-500' 
                    : 'bg-danger-500'
                }`}>
                  !
                </div>
                <span className="text-[10px] font-bold text-tertiary">{event.risk_level_display}</span>
              </div>
            ))}

            <div className="flex flex-col items-center gap-1.5 bg-surface-container-lowest px-2 py-0.5 rounded-lg z-10 shadow-sm border">
              <span className="text-[10px] text-outline font-bold">Week 40</span>
              <div className="w-3.5 h-3.5 bg-surface-container-high border-2 border-outline-variant rounded-full"></div>
              <span className="text-[10px] text-outline">Due Date</span>
            </div>
          </div>
        </div>

        {/* Detailed Risk feed list */}
        <div className="space-y-sm pt-md">
          {riskEvents && riskEvents.length > 0 && (
            <div className="p-md bg-tertiary-container/10 border border-tertiary/20 rounded-lg text-sm">
              <strong className="text-tertiary">Longitudinal Focus:</strong> {riskEvents[0].event_description} (Observed at Week {riskEvents[0].week_number})
            </div>
          )}
        </div>
      </div>

      {/* Two Column Layout: ANC Timeline vs Clinical logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
        {/* ANC Visits Timeline */}
        <div className="bg-surface-container-lowest dark:bg-on-surface/5 rounded-xl border border-outline-variant/20 shadow-sm p-lg space-y-md flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center border-b border-outline-variant/10 pb-sm mb-md">
              <h3 className="text-title-lg font-bold text-on-surface">ANC Visit Logs</h3>
              <button 
                onClick={() => setShowAncModal(true)}
                className="text-primary hover:underline font-label-lg flex items-center gap-xs"
              >
                <span className="material-symbols-outlined text-[18px]">add</span> Log Visit
              </button>
            </div>
            
            <div className="relative pl-6 border-l-2 border-surface-container-high flex flex-col gap-lg mt-sm">
              {!ancData?.results || ancData.results.length === 0 ? (
                <p className="text-xs text-neutral-400 py-md">No ANC visits recorded yet.</p>
              ) : (
                ancData.results.slice(0, 3).map((visit) => (
                  <div key={visit.id} className="relative">
                    <span className="absolute -left-[31px] top-1 w-3 h-3 bg-primary rounded-full ring-4 ring-surface-container-lowest"></span>
                    <p className="text-xs text-secondary font-medium mb-1">{visit.visit_date} (Week {visit.week_at_visit})</p>
                    <h4 className="text-sm font-semibold text-on-surface">{visit.visit_type_display} checkup</h4>
                    {visit.notes && <p className="text-xs text-secondary mt-0.5">{visit.notes}</p>}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Previous Pregnancy summary & clinical logs */}
        <div className="lg:col-span-2 bg-surface-container-lowest dark:bg-on-surface/5 rounded-xl border border-outline-variant/20 shadow-sm p-lg space-y-md flex flex-col justify-between">
          <div className="border-b border-outline-variant/10 pb-sm flex justify-between items-center">
            <h3 className="text-title-lg font-bold text-on-surface flex items-center gap-xs">
              <span className="material-symbols-outlined text-primary">history_edu</span>
              Obstetric History &amp; Vitals Table
            </h3>
            <div className="text-sm bg-neutral-100 px-3 py-1 rounded-full font-semibold">
              Gravida: {pregnancy.gravida} • Para: {pregnancy.para}
            </div>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="text-label-md font-bold text-secondary border-b border-outline-variant/20">
                  <th className="py-sm px-2 font-medium">Date / Week</th>
                  <th className="py-sm px-2 font-medium">BP (Systolic/Diastolic)</th>
                  <th className="py-sm px-2 font-medium">FHR (bpm)</th>
                  <th className="py-sm px-2 font-medium">Weight</th>
                  <th className="py-sm px-2 font-medium">Glucose</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {ancData?.results?.map((visit) => (
                  <tr key={visit.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="py-md px-2">
                      <div className="font-semibold text-on-surface">{visit.visit_date}</div>
                      <div className="text-xs text-outline">Week {visit.week_at_visit}</div>
                    </td>
                    <td className="py-md px-2 font-medium">
                      {visit.bp_systolic ? `${visit.bp_systolic}/${visit.bp_diastolic}` : '—'}
                    </td>
                    <td className="py-md px-2">{visit.fhr_bpm ? `${visit.fhr_bpm} bpm` : '—'}</td>
                    <td className="py-md px-2">{visit.weight_kg ? `${visit.weight_kg} kg` : '—'}</td>
                    <td className="py-md px-2">{visit.glucose_mgdl ? `${visit.glucose_mgdl} mg/dL` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Wellness & Safety Protocols Section */}
      <h3 className="text-headline-md font-bold text-on-background mt-md flex items-center gap-xs">
        <span className="material-symbols-outlined">health_and_safety</span> Wellness &amp; Safety Plans
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
        {/* Diet */}
        <div className="bg-surface-container-lowest dark:bg-on-surface/5 rounded-xl border border-outline-variant/20 shadow-sm p-lg flex flex-col gap-sm">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container">
              <span className="material-symbols-outlined">restaurant</span>
            </div>
            <button onClick={openWellnessEdit} className="text-xs text-primary font-bold hover:underline">Edit</button>
          </div>
          <h4 className="text-title-lg font-bold text-on-surface">Dietary Guidance</h4>
          {wellness?.dietary_protocol && (
            <p className="text-xs font-semibold text-error bg-error-container/30 px-2 py-1 rounded inline-block w-max border border-error-container">
              {wellness.dietary_protocol}
            </p>
          )}
          <ul className="text-sm text-secondary space-y-2 flex-grow mt-xs">
            {wellness?.dietary_items?.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="material-symbols-outlined text-[16px] text-primary mt-0.5">check</span> {item}
              </li>
            )) || <p className="text-xs text-neutral-400">No diet protocol items set yet.</p>}
          </ul>
        </div>

        {/* Precautions */}
        <div className="bg-surface-container-lowest dark:bg-on-surface/5 rounded-xl border border-outline-variant/20 shadow-sm p-lg flex flex-col gap-sm">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container">
              <span className="material-symbols-outlined">medical_information</span>
            </div>
            <button onClick={openWellnessEdit} className="text-xs text-primary font-bold hover:underline">Edit</button>
          </div>
          <h4 className="text-title-lg font-bold text-on-surface">Daily Precautions</h4>
          <ul className="text-sm text-secondary space-y-3 mt-xs flex-grow">
            {wellness?.daily_precautions?.map((prec, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <div className="bg-surface-container p-1 rounded-md shrink-0"><span className="material-symbols-outlined text-[14px] text-primary">directions_walk</span></div>
                <span>{prec}</span>
              </li>
            )) || <p className="text-xs text-neutral-400">No safety precautions configured.</p>}
          </ul>
        </div>

        {/* Maternal Vaccinations Tracker */}
        <div className="bg-surface-container-lowest dark:bg-on-surface/5 rounded-xl border border-outline-variant/20 shadow-sm p-lg flex flex-col gap-sm">
          <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container">
            <span className="material-symbols-outlined">vaccines</span>
          </div>
          <h4 className="text-title-lg font-bold text-on-surface">Vaccination Checklist</h4>
          <div className="flex flex-col gap-3 mt-xs flex-grow max-h-[200px] overflow-y-auto pr-1">
            {!vaccinations || vaccinations.length === 0 ? (
              <p className="text-xs text-neutral-400">No vaccinations scheduled.</p>
            ) : (
              vaccinations.map((v) => (
                <div key={v.id} className="flex justify-between items-center bg-surface-container-low p-2 rounded-lg dark:bg-surface-dim">
                  <div className="flex items-center gap-2">
                    <span 
                      onClick={() => handleToggleVacc(v.id, v.status)}
                      className={`material-symbols-outlined cursor-pointer text-[20px] transition-colors ${
                        v.status === 'administered' ? 'text-primary fill' : 'text-outline hover:text-primary'
                      }`}
                    >
                      {v.status === 'administered' ? 'check_circle' : 'radio_button_unchecked'}
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-on-surface">{v.vaccine_name}</p>
                      {v.status === 'administered' && v.administered_date && (
                        <p className="text-[9px] text-neutral-400 mt-0.5">Administered: {v.administered_date}</p>
                      )}
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    v.status === 'administered' ? 'bg-success-50 text-success-600' : 'bg-warning-50 text-warning-600'
                  }`}>
                    {v.status_display}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── MODAL: Log ANC Visit ──────────────────────────────────────────────── */}
      {showAncModal && (
        <div className="fixed inset-0 bg-neutral-900/50 flex items-center justify-center z-50 p-sm">
          <div className="bg-white rounded-xl shadow-xl border border-outline-variant/30 max-w-lg w-full overflow-hidden">
            <div className="p-md border-b border-outline-variant/10 flex justify-between items-center">
              <h3 className="font-title-lg font-bold text-on-surface">Record Antenatal (ANC) Visit</h3>
              <button onClick={() => setShowAncModal(false)} className="text-neutral-400 hover:text-neutral-600"><span className="material-symbols-outlined">close</span></button>
            </div>
            <form onSubmit={ancForm.handleSubmit(handleAddAnc)} className="p-md space-y-sm max-h-[500px] overflow-y-auto">
              <div className="grid grid-cols-2 gap-sm">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold">Visit Date *</label>
                  <input type="date" {...ancForm.register('visit_date')} className="form-input text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-semibold">Week at Visit *</label>
                  <input type="number" min="1" {...ancForm.register('week_at_visit')} className="form-input text-sm" />
                  {ancForm.formState.errors.week_at_visit && <p className="text-[10px] text-danger-600">{ancForm.formState.errors.week_at_visit.message}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-sm">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold">Consulting Obstetrician *</label>
                  <select {...ancForm.register('doctor')} className="form-input text-sm">
                    <option value="">Choose Doctor</option>
                    {doctorsData?.results?.map((d) => (
                      <option key={d.id} value={d.id}>{d.full_name}</option>
                    ))}
                  </select>
                  {ancForm.formState.errors.doctor && <p className="text-[10px] text-danger-600">{ancForm.formState.errors.doctor.message}</p>}
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-semibold">Visit Type *</label>
                  <select {...ancForm.register('visit_type')} className="form-input text-sm">
                    <option value="routine">Routine Checkup</option>
                    <option value="emergency">Emergency Visit</option>
                    <option value="scan">Ultrasound Scan</option>
                  </select>
                </div>
              </div>

              {/* Vitals Form fields */}
              <div className="border-t border-neutral-100 pt-sm mt-sm">
                <h4 className="text-xs font-bold text-on-surface mb-sm">Record Vitals Metrics (Optional)</h4>
                <div className="grid grid-cols-3 gap-sm">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-semibold">BP Systolic (mmHg)</label>
                    <input type="number" {...ancForm.register('bp_systolic')} className="form-input text-sm" placeholder="90-140" />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-semibold">BP Diastolic (mmHg)</label>
                    <input type="number" {...ancForm.register('bp_diastolic')} className="form-input text-sm" placeholder="60-90" />
                    {ancForm.formState.errors.bp_diastolic && <p className="text-[10px] text-danger-600">{ancForm.formState.errors.bp_diastolic.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-semibold">Weight (kg)</label>
                    <input type="number" step="0.1" {...ancForm.register('weight_kg')} className="form-input text-sm" placeholder="kg" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-sm mt-sm">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-semibold">Fetal Heart Rate (bpm)</label>
                    <input type="number" {...ancForm.register('fhr_bpm')} className="form-input text-sm" placeholder="120-160" />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-semibold">Glucose (mg/dL)</label>
                    <input type="number" step="0.1" {...ancForm.register('glucose_mgdl')} className="form-input text-sm" placeholder="Glucose" />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold">Clinical Visit Notes</label>
                <textarea rows={2} {...ancForm.register('notes')} className="form-input text-sm" placeholder="Clinical notes, observations..."></textarea>
              </div>

              <div className="flex justify-end gap-sm pt-md border-t border-outline-variant/10">
                <button type="button" onClick={() => setShowAncModal(false)} className="btn-secondary text-xs">Cancel</button>
                <button type="submit" className="btn-primary text-xs" disabled={recordAnc.isPending}>Log Checkup</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Log Risk Milestone ────────────────────────────────────────── */}
      {showRiskModal && (
        <div className="fixed inset-0 bg-neutral-900/50 flex items-center justify-center z-50 p-sm">
          <div className="bg-white rounded-xl shadow-xl border border-outline-variant/30 max-w-md w-full overflow-hidden">
            <div className="p-md border-b border-outline-variant/10 flex justify-between items-center">
              <h3 className="font-title-lg font-bold text-on-surface">Record Risk Timeline Event</h3>
              <button onClick={() => setShowRiskModal(false)} className="text-neutral-400 hover:text-neutral-600"><span className="material-symbols-outlined">close</span></button>
            </div>
            <form onSubmit={riskForm.handleSubmit(handleAddRisk)} className="p-md space-y-sm">
              <div className="grid grid-cols-2 gap-sm">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold">Observation Date *</label>
                  <input type="date" {...riskForm.register('event_date')} className="form-input text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-semibold">Gestational Week *</label>
                  <input type="number" min="1" {...riskForm.register('week_number')} className="form-input text-sm" />
                  {riskForm.formState.errors.week_number && <p className="text-[10px] text-danger-600">{riskForm.formState.errors.week_number.message}</p>}
                </div>
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-semibold">Risk Severity Level *</label>
                <select {...riskForm.register('risk_level')} className="form-input text-sm">
                  <option value="low">Low Risk</option>
                  <option value="moderate">Moderate Risk</option>
                  <option value="high">High Risk</option>
                  <option value="critical">Critical Case</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-semibold">Risk Event Description *</label>
                <textarea rows={3} {...riskForm.register('event_description')} className="form-input text-sm" placeholder="e.g. Mild pre-eclampsia suspected due to BP increase to 140/90..."></textarea>
                {riskForm.formState.errors.event_description && <p className="text-[10px] text-danger-600">{riskForm.formState.errors.event_description.message}</p>}
              </div>

              <div className="flex justify-end gap-sm pt-md border-t border-outline-variant/10">
                <button type="button" onClick={() => setShowRiskModal(false)} className="btn-secondary text-xs">Cancel</button>
                <button type="submit" className="btn-primary text-xs" disabled={recordRisk.isPending}>Log Event</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Edit Wellness safety Plan ─────────────────────────────────── */}
      {showWellnessModal && (
        <div className="fixed inset-0 bg-neutral-900/50 flex items-center justify-center z-50 p-sm">
          <div className="bg-white rounded-xl shadow-xl border border-outline-variant/30 max-w-md w-full overflow-hidden">
            <div className="p-md border-b border-outline-variant/10 flex justify-between items-center">
              <h3 className="font-title-lg font-bold text-on-surface">Edit Wellness Protocols</h3>
              <button onClick={() => setShowWellnessModal(false)} className="text-neutral-400 hover:text-neutral-600"><span className="material-symbols-outlined">close</span></button>
            </div>
            <form onSubmit={wellnessForm.handleSubmit(handleEditWellness)} className="p-md space-y-sm">
              <div className="space-y-1">
                <label className="block text-xs font-semibold">Active Dietary Protocol Name (e.g. GDM Protocol)</label>
                <input type="text" {...wellnessForm.register('dietary_protocol')} className="form-input text-sm" placeholder="e.g. Gestational Diabetes Protocol" />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-semibold">Dietary Rules Checklist (One item per line)</label>
                <textarea rows={3} {...wellnessForm.register('dietary_items_raw')} className="form-input text-sm" placeholder="Focus on complex carbohydrates&#10;Lean protein at every meal&#10;Avoid refined sugars"></textarea>
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-semibold">Daily Precautions (One item per line)</label>
                <textarea rows={3} {...wellnessForm.register('daily_precautions_raw')} className="form-input text-sm" placeholder="30 mins moderate walking daily&#10;Sleep strictly on left side&#10;Limit sodium intake"></textarea>
              </div>

              <div className="flex justify-end gap-sm pt-md border-t border-outline-variant/10">
                <button type="button" onClick={() => setShowWellnessModal(false)} className="btn-secondary text-xs">Cancel</button>
                <button type="submit" className="btn-primary text-xs" disabled={updateWellness.isPending}>Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
