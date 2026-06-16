import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import {
  useNewbornsList,
  useNewbornDetail,
  useCreateNewborn,
  useRecordNewbornFeeding,
  useRecordNewbornVital,
  useNewbornVaccinations,
  useUpdateNewbornVaccination,
} from '@/hooks/useNewborn'
import { useDeliveriesList } from '@/hooks/useDelivery'
import type { FeedType, NewbornGender, NewbornCondition, VaccineStatus } from '@/types/newborn.types'

// ── Validation Schemas ──
const registerNewbornSchema = z.object({
  delivery: z.string().min(1, 'Delivery reference is required'),
  gender: z.enum(['M', 'F', 'O', 'U']),
  birth_weight_kg: z.number().min(0.5, 'Weight must be at least 0.5kg').max(10.0, 'Weight must be realistic'),
  birth_length_cm: z.number().min(10.0, 'Length must be realistic').max(80.0, 'Length must be realistic').nullable().optional(),
  apgar_1min: z.number().int().min(0).max(10),
  apgar_5min: z.number().int().min(0).max(10),
  condition: z.enum(['healthy', 'nicu_required', 'deceased', 'transferred']),
  nicu_required: z.boolean().default(false),
  notes: z.string().optional().default(''),
})

const vitalSchema = z.object({
  weight_kg: z.number().min(0.5, 'Weight must be at least 0.5kg').max(12.0, 'Weight must be realistic'),
  head_circ_cm: z.number().min(10.0, 'Head circumference must be realistic').max(50.0).nullable().optional(),
  temperature: z.number().min(30.0, 'Temperature must be realistic').max(43.0).nullable().optional(),
  notes: z.string().optional().default(''),
})

const feedingSchema = z.object({
  feed_type: z.enum(['breast', 'formula', 'ng_tube', 'iv']),
  volume_ml: z.number().min(1, 'Volume must be positive').max(500).nullable().optional(),
  notes: z.string().optional().default(''),
}).refine((data) => {
  if (['formula', 'ng_tube', 'iv'].includes(data.feed_type)) {
    return data.volume_ml !== undefined && data.volume_ml !== null
  }
  return true
}, {
  message: 'Volume is required for formula, NG tube, or IV feeds.',
  path: ['volume_ml'],
})

const vaccineSchema = z.object({
  status: z.enum(['due', 'administered', 'not_required', 'skipped']),
  administered_date: z.string().min(1, 'Administered date is required'),
  notes: z.string().optional().default(''),
})

type RegisterNewbornValues = z.infer<typeof registerNewbornSchema>
type VitalValues = z.infer<typeof vitalSchema>
type FeedingValues = z.infer<typeof feedingSchema>
type VaccineValues = z.infer<typeof vaccineSchema>

export default function NewbornManagementPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  
  // Modals state
  const [isRegisterOpen, setIsRegisterOpen] = useState(false)
  const [isVitalOpen, setIsVitalOpen] = useState(false)
  const [isFeedingOpen, setIsFeedingOpen] = useState(false)
  const [activeVaccineId, setActiveVaccineId] = useState<string | null>(null)

  // Banners & Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [conditionFilter, setConditionFilter] = useState('All')
  const [serverError, setServerError] = useState<string | null>(null)

  // Queries
  const { data: newbornsData, isLoading: isListLoading } = useNewbornsList({
    search: searchQuery,
    condition: conditionFilter !== 'All' ? conditionFilter : undefined,
  })
  const { data: selectedNewborn, isLoading: isDetailLoading } = useNewbornDetail(selectedId || '')
  const { data: vaccinations } = useNewbornVaccinations(selectedId || '')
  const { data: deliveriesData } = useDeliveriesList()

  // Mutations
  const createNewborn = useCreateNewborn()
  const recordVital = useRecordNewbornVital()
  const recordFeeding = useRecordNewbornFeeding()
  const updateVaccination = useUpdateNewbornVaccination()

  // Forms
  const registerForm = useForm<RegisterNewbornValues>({
    resolver: zodResolver(registerNewbornSchema),
    defaultValues: {
      delivery: '',
      gender: 'U',
      birth_weight_kg: 3.0,
      birth_length_cm: 48,
      apgar_1min: 9,
      apgar_5min: 10,
      condition: 'healthy',
      nicu_required: false,
      notes: '',
    },
  })

  const vitalForm = useForm<VitalValues>({
    resolver: zodResolver(vitalSchema),
    defaultValues: {
      weight_kg: 3.0,
      head_circ_cm: 34.0,
      temperature: 36.8,
      notes: '',
    },
  })

  const feedingForm = useForm<FeedingValues>({
    resolver: zodResolver(feedingSchema),
    defaultValues: {
      feed_type: 'breast',
      volume_ml: null,
      notes: '',
    },
  })

  const vaccineForm = useForm<VaccineValues>({
    resolver: zodResolver(vaccineSchema),
    defaultValues: {
      status: 'administered',
      administered_date: new Date().toISOString().split('T')[0],
      notes: '',
    },
  })

  // Submit handlers
  const handleRegisterSubmit = (data: RegisterNewbornValues) => {
    setServerError(null)
    createNewborn.mutate(data, {
      onSuccess: () => {
        setIsRegisterOpen(false)
        registerForm.reset()
      },
      onError: (err: any) => {
        setServerError(err?.response?.data?.detail || err?.message || 'Failed to register baby record.')
      },
    })
  }

  const handleVitalSubmit = (data: VitalValues) => {
    if (!selectedId) return
    setServerError(null)
    recordVital.mutate(
      { id: selectedId, data },
      {
        onSuccess: () => {
          setIsVitalOpen(false)
          vitalForm.reset()
        },
        onError: (err: any) => {
          setServerError(err?.response?.data?.detail || err?.message || 'Failed to log vitals.')
        },
      }
    )
  }

  const handleFeedingSubmit = (data: FeedingValues) => {
    if (!selectedId) return
    setServerError(null)
    recordFeeding.mutate(
      { id: selectedId, data },
      {
        onSuccess: () => {
          setIsFeedingOpen(false)
          feedingForm.reset()
        },
        onError: (err: any) => {
          setServerError(err?.response?.data?.detail || err?.message || 'Failed to record feeding.')
        },
      }
    )
  }

  const handleVaccineSubmit = (data: VaccineValues) => {
    if (!selectedId || !activeVaccineId) return
    setServerError(null)
    updateVaccination.mutate(
      {
        id: selectedId,
        data: {
          vaccination_id: activeVaccineId,
          status: data.status,
          administered_date: data.status === 'administered' ? data.administered_date : null,
          notes: data.notes,
        },
      },
      {
        onSuccess: () => {
          setActiveVaccineId(null)
          vaccineForm.reset()
        },
        onError: (err: any) => {
          setServerError(err?.response?.data?.detail || err?.message || 'Failed to update vaccine record.')
        },
      }
    )
  }

  const newborns = newbornsData?.results || []

  // Vitals Weight graph data parsing (FIFO order in backend, Recharts likes oldest-first)
  const weightData = selectedNewborn?.vitals
    ? [...selectedNewborn.vitals]
        .reverse()
        .map((v) => ({
          date: new Date(v.recorded_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
          weight: Number(v.weight_kg),
        }))
    : []

  return (
    <div className="mt-16 p-margin-desktop overflow-y-auto h-[calc(100vh-64px)] custom-scrollbar">
      {/* ── Page Header ── */}
      <div className="flex justify-between items-end mb-xl">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-background">Newborn Management</h2>
          <p className="text-body-lg text-secondary">Record vitals, log feeding, and monitor standard birth vaccinations.</p>
        </div>
        <button
          onClick={() => {
            registerForm.reset()
            setServerError(null)
            setIsRegisterOpen(true)
          }}
          className="flex items-center gap-sm bg-primary text-on-primary px-lg py-md rounded-lg font-label-lg text-label-lg shadow-lg hover:shadow-xl transition-all active:scale-95 cursor-pointer"
        >
          <span className="material-symbols-outlined">child_care</span> Register Newborn Shell
        </button>
      </div>

      {/* ── Main Layout ── */}
      <div className="flex flex-col lg:flex-row gap-lg">
        {/* Left Panel — Registry Feed */}
        <div className="flex-1 space-y-lg">
          <div className="bg-surface-container-lowest rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.05)] border border-outline-variant/10 overflow-hidden">
            {/* Toolbar */}
            <div className="p-lg border-b border-outline-variant/10 flex flex-wrap items-center justify-between gap-md bg-surface-container-low/30">
              <div className="flex items-center gap-md">
                <h4 className="font-title-lg text-title-lg text-on-surface">Active Newborn Registry</h4>
                <span className="bg-primary-container/20 text-primary px-sm py-xs rounded-full text-label-md font-bold">Live</span>
              </div>
              <div className="flex items-center gap-sm">
                <input
                  type="text"
                  placeholder="Search MRN/Notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-surface-container-low border border-outline-variant/20 rounded-lg text-body-md focus:ring-primary/20 px-md py-xs"
                />
                <select
                  value={conditionFilter}
                  onChange={(e) => setConditionFilter(e.target.value)}
                  className="bg-surface-container-low border border-outline-variant/20 rounded-lg text-label-lg text-on-surface-variant focus:ring-primary/20 px-lg py-xs"
                >
                  <option value="All">All Conditions</option>
                  <option value="healthy">Healthy</option>
                  <option value="nicu_required">NICU Required</option>
                  <option value="deceased">Deceased</option>
                  <option value="transferred">Transferred</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low/50 text-secondary uppercase text-[11px] font-bold tracking-widest border-b border-outline-variant/10">
                    <th className="px-lg py-md">Baby ID</th>
                    <th className="px-lg py-md">Infant Details</th>
                    <th className="px-lg py-md">Birth weight</th>
                    <th className="px-lg py-md">NICU status</th>
                    <th className="px-lg py-md">Gender</th>
                    <th className="px-lg py-md">Condition</th>
                  </tr>
                </thead>
                <tbody className="text-body-md text-on-surface">
                  {isListLoading ? (
                    <tr>
                      <td colSpan={6} className="text-center py-lg text-secondary">Loading infant feed...</td>
                    </tr>
                  ) : newborns.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-lg text-secondary">No infants registered.</td>
                    </tr>
                  ) : (
                    newborns.map((baby) => (
                      <tr
                        key={baby.id}
                        onClick={() => setSelectedId(baby.id)}
                        className={`hover:bg-primary-container/5 cursor-pointer transition-colors border-b border-outline-variant/10 ${
                          selectedId === baby.id ? 'bg-primary-container/10 font-medium' : ''
                        }`}
                      >
                        <td className="px-lg py-md font-label-md text-primary font-bold">{baby.baby_mrn}</td>
                        <td className="px-lg py-md">
                          <div className="flex flex-col">
                            <span className="font-semibold text-on-surface">Baby of {baby.mother_name}</span>
                            <span className="text-xs text-secondary">Mother MRN: {baby.mother_mrn}</span>
                          </div>
                        </td>
                        <td className="px-lg py-md">{baby.birth_weight_kg} kg</td>
                        <td className="px-lg py-md">
                          <span className={`px-sm py-xs rounded-full text-[10px] font-bold uppercase border ${
                            baby.nicu_required
                              ? 'bg-error-container text-error border-error/20'
                              : 'bg-primary-container/20 text-primary border-primary-fixed-dim'
                          }`}>
                            {baby.nicu_required ? 'NICU Required' : 'Stable'}
                          </span>
                        </td>
                        <td className="px-lg py-md">{baby.gender_display}</td>
                        <td className="px-lg py-md">
                          <span className={`px-sm py-xs rounded-lg text-label-md font-bold ${
                            baby.condition === 'healthy'
                              ? 'bg-primary/10 text-primary'
                              : baby.condition === 'nicu_required'
                              ? 'bg-error-container/20 text-error'
                              : 'bg-surface-container-high text-secondary'
                          }`}>
                            {baby.condition_display}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Panel — Details Drawer */}
        <div className="w-full lg:w-[400px]">
          <div className="bg-surface-container-lowest rounded-xl shadow-[0px_12px_32px_rgba(0,0,0,0.05)] border border-primary/10 flex flex-col h-full sticky top-20">
            <div className="p-lg bg-primary/5 border-b border-primary/10 flex justify-between items-center">
              <div>
                <h4 className="font-title-lg text-title-lg text-primary">Infant Workspace</h4>
                <p className="text-xs text-secondary font-mono">{selectedNewborn ? selectedNewborn.baby_mrn : 'Select a Record'}</p>
              </div>
            </div>

            <div className="p-lg space-y-lg overflow-y-auto custom-scrollbar flex-1 min-h-[450px]">
              {isDetailLoading ? (
                <div className="flex flex-col items-center justify-center py-xl">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary" />
                </div>
              ) : selectedNewborn ? (
                <>
                  <div className="flex items-center gap-md">
                    <div className="w-16 h-16 bg-primary-fixed rounded-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary text-3xl">child_care</span>
                    </div>
                    <div>
                      <h2 className="font-headline-md text-headline-md text-on-surface leading-tight">Baby of {selectedNewborn.mother_name}</h2>
                      <p className="text-label-md text-secondary">
                        Room/Bed: {selectedNewborn.mother_mrn ? 'Maternity Ward' : 'N/A'} • {selectedNewborn.gender_display}
                      </p>
                    </div>
                  </div>

                  {/* Growth Tracker */}
                  <div className="bg-surface-container-low rounded-xl p-md border border-outline-variant/10">
                    <h5 className="text-label-lg font-bold text-primary mb-md flex items-center gap-sm">
                      <span className="material-symbols-outlined text-lg">monitoring</span> GROWTH TRACKER (WEIGHT)
                    </h5>
                    
                    {weightData.length > 1 ? (
                      <div className="h-28 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={weightData}>
                            <XAxis dataKey="date" tick={{ fontSize: 9 }} />
                            <YAxis domain={['auto', 'auto']} tick={{ fontSize: 9 }} />
                            <Tooltip />
                            <Line type="monotone" dataKey="weight" stroke="#006c47" strokeWidth={2} dot={{ r: 3 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <p className="text-xs text-secondary text-center py-xs">Add more vital logs to view the weight growth curve.</p>
                    )}

                    <div className="grid grid-cols-2 gap-md mt-md">
                      <div className="bg-surface p-sm rounded-lg text-center border border-outline-variant/10">
                        <p className="text-[10px] text-secondary uppercase font-bold">Birth weight</p>
                        <p className="text-title-lg font-bold text-on-surface">{selectedNewborn.birth_weight_kg}kg</p>
                      </div>
                      <div className="bg-surface p-sm rounded-lg text-center border border-outline-variant/10">
                        <p className="text-[10px] text-secondary uppercase font-bold">APGAR Score</p>
                        <p className="text-title-lg font-bold text-on-surface">{selectedNewborn.apgar_1min} / {selectedNewborn.apgar_5min}</p>
                      </div>
                    </div>
                  </div>

                  {/* Vitals Section */}
                  <div className="space-y-sm">
                    <div className="flex justify-between items-center">
                      <h5 className="text-label-lg font-bold text-secondary flex items-center gap-xs">
                        <span className="material-symbols-outlined text-sm">monitor_heart</span> Vitals History
                      </h5>
                      <button
                        onClick={() => {
                          setServerError(null)
                          vitalForm.reset({
                            weight_kg: Number(selectedNewborn.birth_weight_kg),
                            head_circ_cm: Number(selectedNewborn.birth_length_cm) || 34,
                            temperature: 36.8,
                            notes: '',
                          })
                          setIsVitalOpen(true)
                        }}
                        className="text-xs text-primary font-bold hover:underline cursor-pointer"
                      >
                        + Record Vitals
                      </button>
                    </div>
                    <div className="space-y-xs max-h-36 overflow-y-auto custom-scrollbar">
                      {selectedNewborn.vitals && selectedNewborn.vitals.length > 0 ? (
                        selectedNewborn.vitals.map((v) => (
                          <div key={v.id} className="bg-surface-container-low p-sm rounded-lg text-body-sm flex justify-between items-start">
                            <div>
                              <p className="font-semibold">{v.weight_kg} kg • {v.temperature ?? 'N/A'}°C • {v.head_circ_cm ?? 'N/A'}cm</p>
                              {v.notes && <p className="text-secondary italic text-xs">"{v.notes}"</p>}
                            </div>
                            <span className="text-[9px] text-secondary">{new Date(v.recorded_at).toLocaleDateString()}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-secondary">No vitals logged.</p>
                      )}
                    </div>
                  </div>

                  {/* Feeding logs */}
                  <div className="space-y-sm">
                    <div className="flex justify-between items-center">
                      <h5 className="text-label-lg font-bold text-secondary flex items-center gap-xs">
                        <span className="material-symbols-outlined text-sm">restaurant</span> Feeding Logs
                      </h5>
                      <button
                        onClick={() => {
                          setServerError(null)
                          feedingForm.reset()
                          setIsFeedingOpen(true)
                        }}
                        className="text-xs text-primary font-bold hover:underline cursor-pointer"
                      >
                        + Log Feed
                      </button>
                    </div>
                    <div className="space-y-xs max-h-36 overflow-y-auto custom-scrollbar">
                      {selectedNewborn.feeding_logs && selectedNewborn.feeding_logs.length > 0 ? (
                        selectedNewborn.feeding_logs.map((f) => (
                          <div key={f.id} className="bg-surface-container-low p-sm rounded-lg text-body-sm flex justify-between items-start">
                            <div>
                              <p className="font-semibold">
                                {f.feed_type_display} {f.volume_ml ? `(${f.volume_ml} ml)` : ''}
                              </p>
                              {f.notes && <p className="text-secondary italic text-xs">"{f.notes}"</p>}
                            </div>
                            <span className="text-[9px] text-secondary">{new Date(f.feed_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-secondary">No feeding logs recorded.</p>
                      )}
                    </div>
                  </div>

                  {/* Vaccinations */}
                  <div>
                    <h5 className="text-label-lg font-bold text-secondary mb-xs flex items-center gap-sm">
                      <span className="material-symbols-outlined text-sm">vaccines</span> Birth Vaccinations
                    </h5>
                    <div className="space-y-xs">
                      {vaccinations?.map((vax) => (
                        <div
                          key={vax.id}
                          onClick={() => {
                            setServerError(null)
                            setActiveVaccineId(vax.id)
                            vaccineForm.reset({
                              status: vax.status,
                              administered_date: new Date().toISOString().split('T')[0],
                              notes: vax.notes || '',
                            })
                          }}
                          className={`p-sm border rounded-lg flex items-center justify-between cursor-pointer hover:bg-surface-container-low transition-colors ${
                            vax.status === 'administered'
                              ? 'bg-primary/5 border-primary-fixed/20'
                              : 'bg-surface-container-low border-outline-variant/10'
                          }`}
                        >
                          <div>
                            <p className="text-body-md font-semibold text-on-surface">{vax.vaccine_name}</p>
                            <p className="text-xs text-secondary">Dose: {vax.dose_number}</p>
                          </div>
                          <div className="flex items-center gap-xs">
                            <span className={`text-[10px] font-bold px-sm py-xs rounded uppercase ${
                              vax.status === 'administered'
                                ? 'bg-primary text-on-primary'
                                : 'bg-surface-container-high text-secondary border'
                            }`}>
                              {vax.status_display}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-secondary text-center text-body-md py-xl">Select an infant from the registry to view vitals, growth weight chart, and update vaccine records.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Modal: Register Newborn Manual ── */}
      {isRegisterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-md animate-fadeIn">
          <div className="bg-surface-container-lowest rounded-2xl w-full max-w-lg shadow-2xl border border-outline-variant/30 overflow-y-auto max-h-[90vh]">
            <div className="p-lg bg-primary/5 border-b border-outline-variant/10 flex justify-between items-center">
              <h3 className="font-headline-md text-headline-md text-primary">Register Newborn</h3>
              <button onClick={() => setIsRegisterOpen(false)} className="text-secondary hover:text-on-surface cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={registerForm.handleSubmit(handleRegisterSubmit)} className="p-lg space-y-md">
              {serverError && <div className="bg-error-container text-on-error-container p-md rounded-xl text-body-md font-semibold">{serverError}</div>}

              <div>
                <label className="block text-label-md font-semibold mb-xs">Maternal Delivery</label>
                <select
                  {...registerForm.register('delivery')}
                  className="w-full p-sm bg-surface-container-low border border-outline-variant rounded-lg focus:ring-2"
                >
                  <option value="">Select Delivery Record</option>
                  {deliveriesData?.results?.map((d) => (
                    <option key={d.id} value={d.id}>
                      Baby of {d.patient_name} ({d.delivery_mode_display} - {new Date(d.delivery_datetime).toLocaleDateString()})
                    </option>
                  ))}
                </select>
                {registerForm.formState.errors.delivery && <p className="text-error text-xs mt-xs">{registerForm.formState.errors.delivery.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-sm">
                <div>
                  <label className="block text-label-md font-semibold mb-xs">Gender</label>
                  <select
                    {...registerForm.register('gender')}
                    className="w-full p-sm bg-surface-container-low border border-outline-variant rounded-lg focus:ring-2"
                  >
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                    <option value="O">Other</option>
                    <option value="U">Undetermined</option>
                  </select>
                </div>

                <div>
                  <label className="block text-label-md font-semibold mb-xs">Condition</label>
                  <select
                    {...registerForm.register('condition')}
                    className="w-full p-sm bg-surface-container-low border border-outline-variant rounded-lg"
                  >
                    <option value="healthy">Healthy</option>
                    <option value="nicu_required">NICU Required</option>
                    <option value="deceased">Deceased</option>
                    <option value="transferred">Transferred</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-sm">
                <div>
                  <label className="block text-label-md font-semibold mb-xs">Birth Weight (kg)</label>
                  <input
                    type="number"
                    step="0.001"
                    {...registerForm.register('birth_weight_kg', { valueAsNumber: true })}
                    className="w-full p-sm bg-surface-container-low border border-outline-variant rounded-lg"
                  />
                  {registerForm.formState.errors.birth_weight_kg && <p className="text-error text-xs mt-xs">{registerForm.formState.errors.birth_weight_kg.message}</p>}
                </div>

                <div>
                  <label className="block text-label-md font-semibold mb-xs">Birth Length (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    {...registerForm.register('birth_length_cm', { valueAsNumber: true })}
                    className="w-full p-sm bg-surface-container-low border border-outline-variant rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-sm">
                <div>
                  <label className="block text-label-md font-semibold mb-xs">APGAR (1 min)</label>
                  <input
                    type="number"
                    {...registerForm.register('apgar_1min', { valueAsNumber: true })}
                    className="w-full p-sm bg-surface-container-low border border-outline-variant rounded-lg"
                  />
                  {registerForm.formState.errors.apgar_1min && <p className="text-error text-xs mt-xs">{registerForm.formState.errors.apgar_1min.message}</p>}
                </div>

                <div>
                  <label className="block text-label-md font-semibold mb-xs">APGAR (5 min)</label>
                  <input
                    type="number"
                    {...registerForm.register('apgar_5min', { valueAsNumber: true })}
                    className="w-full p-sm bg-surface-container-low border border-outline-variant rounded-lg"
                  />
                  {registerForm.formState.errors.apgar_5min && <p className="text-error text-xs mt-xs">{registerForm.formState.errors.apgar_5min.message}</p>}
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="nicu_required"
                  {...registerForm.register('nicu_required')}
                  className="w-5 h-5 accent-primary border border-outline-variant rounded"
                />
                <label htmlFor="nicu_required" className="ml-sm text-body-md font-medium select-none cursor-pointer">
                  Require NICU Incubator Admission
                </label>
              </div>

              <div>
                <label className="block text-label-md font-semibold mb-xs">Registration Notes</label>
                <textarea
                  {...registerForm.register('notes')}
                  placeholder="E.g. Birth defects, delivery complications..."
                  rows={2}
                  className="w-full p-sm bg-surface-container-low border border-outline-variant rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-sm border-t pt-md">
                <button type="button" onClick={() => setIsRegisterOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Register</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Record Vital ── */}
      {isVitalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-md animate-fadeIn">
          <div className="bg-surface-container-lowest rounded-2xl w-full max-w-sm shadow-2xl border border-outline-variant/30">
            <div className="p-lg bg-primary/5 border-b border-outline-variant/10 flex justify-between items-center">
              <h3 className="font-headline-md text-headline-md text-primary">Record Vitals</h3>
              <button onClick={() => setIsVitalOpen(false)} className="text-secondary hover:text-on-surface cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={vitalForm.handleSubmit(handleVitalSubmit)} className="p-lg space-y-md">
              {serverError && <div className="bg-error-container text-on-error-container p-md rounded-xl text-body-md font-semibold">{serverError}</div>}

              <div>
                <label className="block text-label-md font-semibold mb-xs">Weight (kg)</label>
                <input
                  type="number"
                  step="0.001"
                  {...vitalForm.register('weight_kg', { valueAsNumber: true })}
                  className="w-full p-sm bg-surface-container-low border border-outline-variant rounded-lg"
                />
                {vitalForm.formState.errors.weight_kg && <p className="text-error text-xs mt-xs">{vitalForm.formState.errors.weight_kg.message}</p>}
              </div>

              <div>
                <label className="block text-label-md font-semibold mb-xs">Head Circumference (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  {...vitalForm.register('head_circ_cm', { valueAsNumber: true })}
                  className="w-full p-sm bg-surface-container-low border border-outline-variant rounded-lg"
                />
              </div>

              <div>
                <label className="block text-label-md font-semibold mb-xs">Temperature (°C)</label>
                <input
                  type="number"
                  step="0.1"
                  {...vitalForm.register('temperature', { valueAsNumber: true })}
                  className="w-full p-sm bg-surface-container-low border border-outline-variant rounded-lg"
                />
              </div>

              <div>
                <label className="block text-label-md font-semibold mb-xs">Notes</label>
                <textarea
                  {...vitalForm.register('notes')}
                  placeholder="Condition notes..."
                  rows={2}
                  className="w-full p-sm bg-surface-container-low border border-outline-variant rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-sm border-t pt-md">
                <button type="button" onClick={() => setIsVitalOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Record</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Record Feeding ── */}
      {isFeedingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-md animate-fadeIn">
          <div className="bg-surface-container-lowest rounded-2xl w-full max-w-sm shadow-2xl border border-outline-variant/30">
            <div className="p-lg bg-primary/5 border-b border-outline-variant/10 flex justify-between items-center">
              <h3 className="font-headline-md text-headline-md text-primary">Record Feeding Log</h3>
              <button onClick={() => setIsFeedingOpen(false)} className="text-secondary hover:text-on-surface cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={feedingForm.handleSubmit(handleFeedingSubmit)} className="p-lg space-y-md">
              {serverError && <div className="bg-error-container text-on-error-container p-md rounded-xl text-body-md font-semibold">{serverError}</div>}

              <div>
                <label className="block text-label-md font-semibold mb-xs">Feed Type</label>
                <select
                  {...feedingForm.register('feed_type')}
                  className="w-full p-sm bg-surface-container-low border border-outline-variant rounded-lg"
                >
                  <option value="breast">Breast Milk</option>
                  <option value="formula">Formula Milk</option>
                  <option value="ng_tube">NG Tube Feed</option>
                  <option value="iv">Intravenous (IV) Infusion</option>
                </select>
              </div>

              <div>
                <label className="block text-label-md font-semibold mb-xs">Volume (ml)</label>
                <input
                  type="number"
                  {...feedingForm.register('volume_ml', { valueAsNumber: true })}
                  placeholder="Required for formula/NG/IV"
                  className="w-full p-sm bg-surface-container-low border border-outline-variant rounded-lg"
                />
                {feedingForm.formState.errors.volume_ml && <p className="text-error text-xs mt-xs">{feedingForm.formState.errors.volume_ml.message}</p>}
              </div>

              <div>
                <label className="block text-label-md font-semibold mb-xs">Notes</label>
                <textarea
                  {...feedingForm.register('notes')}
                  placeholder=" latch quality, tolerances, etc..."
                  rows={2}
                  className="w-full p-sm bg-surface-container-low border border-outline-variant rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-sm border-t pt-md">
                <button type="button" onClick={() => setIsFeedingOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Record</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Administer / Toggle Vaccination ── */}
      {activeVaccineId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-md animate-fadeIn">
          <div className="bg-surface-container-lowest rounded-2xl w-full max-w-sm shadow-2xl border border-outline-variant/30">
            <div className="p-lg bg-primary/5 border-b border-outline-variant/10 flex justify-between items-center">
              <h3 className="font-headline-md text-headline-md text-primary">Update Vaccination Status</h3>
              <button onClick={() => setActiveVaccineId(null)} className="text-secondary hover:text-on-surface cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={vaccineForm.handleSubmit(handleVaccineSubmit)} className="p-lg space-y-md">
              {serverError && <div className="bg-error-container text-on-error-container p-md rounded-xl text-body-md font-semibold">{serverError}</div>}

              <div>
                <label className="block text-label-md font-semibold mb-xs">Vaccination Status</label>
                <select
                  {...vaccineForm.register('status')}
                  className="w-full p-sm bg-surface-container-low border border-outline-variant rounded-lg"
                >
                  <option value="due">Due</option>
                  <option value="administered">Administered</option>
                  <option value="not_required">Not Required</option>
                  <option value="skipped">Skipped</option>
                </select>
              </div>

              <div>
                <label className="block text-label-md font-semibold mb-xs">Administered Date</label>
                <input
                  type="date"
                  {...vaccineForm.register('administered_date')}
                  className="w-full p-sm bg-surface-container-low border border-outline-variant rounded-lg"
                />
              </div>

              <div>
                <label className="block text-label-md font-semibold mb-xs">Notes / Lot Code</label>
                <textarea
                  {...vaccineForm.register('notes')}
                  placeholder="Lot number, manufacturer details, injection site..."
                  rows={2}
                  className="w-full p-sm bg-surface-container-low border border-outline-variant rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-sm border-t pt-md">
                <button type="button" onClick={() => setActiveVaccineId(null)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Update</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
