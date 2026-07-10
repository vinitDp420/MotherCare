import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  useDeliveriesList,
  useDelivery,
  useCreateDelivery,
} from '@/hooks/useDelivery'
import { useAdmissionsList } from '@/hooks/useAdmissions'
import { useDoctorsList } from '@/hooks/usePatients'
import type { DeliveryMode, DeliveryProcedureWritePayload } from '@/types/delivery.types'

const deliverySchema = z.object({
  admission: z.string().min(1, 'Admission is required'),
  patient: z.string().min(1, 'Patient is required'),
  doctor: z.string().min(1, 'Doctor is required'),
  delivery_datetime: z.string().min(1, 'Date and Time is required'),
  delivery_mode: z.enum(['normal', 'c_section', 'assisted', 'water_birth']),
  blood_loss_ml: z.number().min(0, 'Blood loss cannot be negative').nullable().optional(),
  placenta_complete: z.boolean().default(true),
  complications: z.string().optional().default(''),
  notes: z.string().optional().default(''),
  procedures: z.array(z.object({
    performed_by: z.string().min(1, 'Doctor is required'),
    procedure_name: z.string().min(1, 'Procedure name is required'),
    indication: z.string().optional().default(''),
    technique: z.string().optional().default(''),
    implants_used: z.string().optional().default(''),
    duration_minutes: z.number().min(0, 'Duration must be positive').optional().default(0),
    post_op_instructions: z.string().optional().default(''),
    performed_at: z.string().optional().default(''),
  })).default([]),
}).refine((data) => {
  if (data.delivery_mode === 'c_section') {
    return data.procedures.some((p) => p.procedure_name === 'Caesarean Section')
  }
  return true;
}, {
  message: "C-section deliveries require at least one 'Caesarean Section' procedure to be recorded.",
  path: ['procedures'],
})

type DeliveryFormValues = z.infer<typeof deliverySchema>

export default function DeliveryManagementPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [modeFilter, setModeFilter] = useState<string>('All')

  // Queries
  const { data: deliveriesData, isLoading: isListLoading } = useDeliveriesList({
    search: searchQuery,
    delivery_mode: modeFilter !== 'All' ? modeFilter : undefined,
  })
  const { data: selectedDelivery, isLoading: isDetailLoading } = useDelivery(selectedId || '')
  
  // Fetch active admissions for dropdown
  const { data: activeAdmissions } = useAdmissionsList({ status: 'active' })
  const { data: doctorsData } = useDoctorsList()

  // Mutations
  const createDelivery = useCreateDelivery()

  // Form Setup
  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DeliveryFormValues>({
    resolver: zodResolver(deliverySchema) as any,
    defaultValues: {
      admission: '',
      patient: '',
      doctor: '',
      delivery_datetime: new Date().toISOString().slice(0, 16),
      delivery_mode: 'normal',
      blood_loss_ml: 200,
      placenta_complete: true,
      complications: '',
      notes: '',
      procedures: [],
    },
  })

  const { fields: procedureFields, append, remove } = useFieldArray({
    control,
    name: 'procedures',
  })

  const watchAdmission = watch('admission')
  const watchDeliveryMode = watch('delivery_mode')

  // Handle auto-populating patient when admission is selected
  const handleAdmissionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const admissionId = e.target.value
    setValue('admission', admissionId)
    const found = activeAdmissions?.results?.find((a) => a.id === admissionId)
    if (found) {
      setValue('patient', found.patient)
      setValue('doctor', found.doctor)
    } else {
      setValue('patient', '')
      setValue('doctor', '')
    }
  }

  const onSubmit = (data: DeliveryFormValues) => {
    setServerError(null)
    
    // Prep payload structure
    const payload = {
      ...data,
      procedures: data.procedures.map((p) => ({
        ...p,
        performed_at: p.performed_at ? new Date(p.performed_at).toISOString() : new Date().toISOString(),
      })),
      delivery_datetime: new Date(data.delivery_datetime).toISOString(),
    }

    createDelivery.mutate(payload, {
      onSuccess: () => {
        setIsModalOpen(false)
        reset()
        setServerError(null)
      },
      onError: (err: any) => {
        setServerError(err?.response?.data?.detail || err?.message || 'Failed to record delivery record.')
      },
    })
  }

  // Auto-insert 'Caesarean Section' procedure block if C-section is selected and empty
  const handleModeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const mode = e.target.value as DeliveryMode
    setValue('delivery_mode', mode)
    if (mode === 'c_section' && procedureFields.length === 0) {
      append({
        performed_by: watch('doctor') || '',
        procedure_name: 'Caesarean Section',
        indication: 'Routine / Emergency C-Section',
        technique: '',
        implants_used: '',
        duration_minutes: 45,
        post_op_instructions: '',
        performed_at: new Date().toISOString().slice(0, 16),
      })
    }
  }

  const deliveries = deliveriesData?.results || []

  return (
    <div className="mt-16 p-margin-desktop overflow-y-auto h-[calc(100vh-64px)] custom-scrollbar">
      {/* ── Page Header ── */}
      <div className="flex justify-between items-end mb-xl">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-background">Delivery Management</h2>
          <p className="text-body-lg text-secondary">Monitor and record maternal deliveries and newborn arrivals.</p>
        </div>
        <button
          onClick={() => {
            reset()
            setServerError(null)
            setIsModalOpen(true)
          }}
          className="flex items-center gap-sm bg-primary text-on-primary px-lg py-md rounded-lg font-label-lg text-label-lg shadow-lg hover:shadow-xl transition-all active:scale-95 cursor-pointer"
        >
          <span className="material-symbols-outlined">add_circle</span> New Delivery Entry
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-lg">
        {/* ── Main Feed & Grid ── */}
        <div className="flex-1 space-y-lg">
          <div className="bg-surface-container-lowest rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.05)] border border-outline-variant/10 overflow-hidden">
            {/* ── Filters Toolbar ── */}
            <div className="p-lg border-b border-outline-variant/10 flex flex-wrap items-center justify-between gap-md">
              <div className="flex items-center gap-md">
                <h4 className="font-title-lg text-title-lg text-on-surface">Registered Deliveries</h4>
                <span className="bg-primary-container/20 text-primary px-sm py-xs rounded-full text-label-md font-bold">Live</span>
              </div>
              <div className="flex items-center gap-sm">
                <input
                  type="text"
                  placeholder="Search Patient Name/MRN..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-surface-container-low border border-outline-variant/20 rounded-lg text-body-md focus:ring-primary/20 px-md py-xs"
                />
                <select
                  value={modeFilter}
                  onChange={(e) => setModeFilter(e.target.value)}
                  className="bg-surface-container-low border border-outline-variant/20 rounded-lg text-label-lg text-on-surface-variant focus:ring-primary/20 px-lg py-xs"
                >
                  <option value="All">All Modes</option>
                  <option value="normal">Normal</option>
                  <option value="c_section">C-Section</option>
                  <option value="assisted">Assisted</option>
                  <option value="water_birth">Water Birth</option>
                </select>
              </div>
            </div>

            {/* ── Table ── */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low/50 text-secondary uppercase text-[11px] font-bold tracking-widest">
                    <th className="px-lg py-md border-b border-outline-variant/10">Mother Name</th>
                    <th className="px-lg py-md border-b border-outline-variant/10">Doctor</th>
                    <th className="px-lg py-md border-b border-outline-variant/10">Mode</th>
                    <th className="px-lg py-md border-b border-outline-variant/10">Date & Time</th>
                    <th className="px-lg py-md border-b border-outline-variant/10">Blood Loss (ml)</th>
                    <th className="px-lg py-md border-b border-outline-variant/10">Placenta</th>
                  </tr>
                </thead>
                <tbody className="text-body-md text-on-surface">
                  {isListLoading ? (
                    <tr>
                      <td colSpan={6} className="text-center py-lg text-secondary">Loading delivery feed...</td>
                    </tr>
                  ) : deliveries.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-lg text-secondary">No deliveries found.</td>
                    </tr>
                  ) : (
                    deliveries.map((delivery) => (
                      <tr
                        key={delivery.id}
                        onClick={() => setSelectedId(delivery.id)}
                        className={`hover:bg-primary-container/5 transition-colors cursor-pointer border-b border-outline-variant/10 ${
                          selectedId === delivery.id ? 'bg-primary-container/10 font-medium' : ''
                        }`}
                      >
                        <td className="px-lg py-md">
                          <div className="flex items-center gap-sm">
                            <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center text-primary font-bold text-xs">
                              {delivery.patient_name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <span className="font-semibold block">{delivery.patient_name}</span>
                              <span className="text-xs text-secondary">{delivery.patient_mrn}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-lg py-md text-secondary">Dr. {delivery.doctor_name}</td>
                        <td className="px-lg py-md">
                          <span className={`px-sm py-xs rounded-lg text-label-md font-semibold border ${
                            delivery.delivery_mode === 'c_section'
                              ? 'bg-tertiary-container text-on-tertiary border-tertiary/20'
                              : 'bg-surface-container-high text-on-surface-variant border-outline-variant/20'
                          }`}>
                            {delivery.delivery_mode_display}
                          </span>
                        </td>
                        <td className="px-lg py-md text-secondary">
                          {new Date(delivery.delivery_datetime).toLocaleString()}
                        </td>
                        <td className="px-lg py-md font-semibold">{delivery.blood_loss_ml ?? 'N/A'}</td>
                        <td className="px-lg py-md">
                          <span className={`flex items-center gap-xs text-label-md font-bold ${
                            delivery.placenta_complete ? 'text-primary' : 'text-error'
                          }`}>
                            <span className="material-symbols-outlined text-[16px]">
                              {delivery.placenta_complete ? 'check_circle' : 'cancel'}
                            </span>
                            {delivery.placenta_complete ? 'Complete' : 'Incomplete'}
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

        {/* ── Right Details Pane ── */}
        <div className="w-full lg:w-[350px]">
          <div className="bg-surface-container-lowest rounded-xl shadow-[0px_12px_32px_rgba(0,0,0,0.05)] border border-primary/10 flex flex-col h-full sticky top-20">
            <div className="p-lg bg-primary/5 border-b border-primary/10">
              <h4 className="font-title-lg text-title-lg text-primary">Delivery Details</h4>
              <p className="text-label-md font-label-md text-secondary tracking-widest uppercase">
                {selectedDelivery ? `ID: ${selectedDelivery.id.slice(0, 8)}` : 'Select a Record'}
              </p>
            </div>
            
            <div className="p-lg space-y-lg overflow-y-auto custom-scrollbar flex-1 min-h-[350px]">
              {isDetailLoading ? (
                <div className="flex flex-col items-center justify-center py-xl">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary" />
                </div>
              ) : selectedDelivery ? (
                <>
                  <div className="flex items-center gap-md">
                    <div className="w-16 h-16 rounded-xl bg-primary-container text-primary flex items-center justify-center font-bold text-headline-md">
                      {selectedDelivery.patient_name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-headline-md text-headline-md text-on-surface leading-tight">{selectedDelivery.patient_name}</p>
                      <p className="text-label-lg font-label-lg text-primary font-bold">MRN: {selectedDelivery.patient_mrn}</p>
                    </div>
                  </div>

                  <div className="space-y-sm">
                    <h5 className="text-label-lg font-bold text-secondary">Clinical Summary</h5>
                    <div className="bg-surface-container-low p-md rounded-lg space-y-xs text-body-md text-on-surface">
                      <p>Mode: <span className="font-semibold">{selectedDelivery.delivery_mode_display}</span></p>
                      <p>Blood Loss: <span className="font-semibold">{selectedDelivery.blood_loss_ml} ml</span></p>
                      <p>Placenta: <span className="font-semibold">{selectedDelivery.placenta_complete ? 'Complete' : 'Incomplete'}</span></p>
                    </div>
                  </div>

                  {selectedDelivery.complications && (
                    <div className="space-y-sm">
                      <div className="flex items-center gap-xs text-error">
                        <span className="material-symbols-outlined text-[20px]">warning</span>
                        <h5 className="text-label-lg font-bold">Complications</h5>
                      </div>
                      <div className="bg-error-container/20 text-on-error-container p-sm rounded-lg text-body-md">
                        {selectedDelivery.complications}
                      </div>
                    </div>
                  )}

                  {selectedDelivery.notes && (
                    <div className="space-y-sm">
                      <div className="flex items-center gap-xs text-primary">
                        <span className="material-symbols-outlined text-[20px]">notes</span>
                        <h5 className="text-label-lg font-bold">Delivery Notes</h5>
                      </div>
                      <p className="text-body-md text-on-surface-variant leading-relaxed italic border-l-2 border-primary-container pl-md">
                        "{selectedDelivery.notes}"
                      </p>
                    </div>
                  )}

                  {selectedDelivery.procedures && selectedDelivery.procedures.length > 0 && (
                    <div className="space-y-sm">
                      <h5 className="text-label-lg font-bold text-secondary">Performed Procedures</h5>
                      <div className="space-y-xs">
                        {selectedDelivery.procedures.map((proc) => (
                          <div key={proc.id} className="bg-surface-container-low p-sm rounded-lg text-body-sm">
                            <p className="font-bold text-on-surface">{proc.procedure_name}</p>
                            <p className="text-secondary">Duration: {proc.duration_minutes} mins</p>
                            {proc.indication && <p className="text-secondary">Indication: {proc.indication}</p>}
                            <p className="text-xs text-secondary mt-1">Performed by Dr. {proc.performed_by_name}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-secondary text-center text-body-md py-xl">Click on a delivery row to inspect clinical notes, complications, and procedure details.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── New Delivery Entry Modal ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-md animate-fadeIn">
          <div className="bg-surface-container-lowest rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-outline-variant/30 flex flex-col">
            <div className="p-lg bg-primary/5 border-b border-outline-variant/10 flex justify-between items-center">
              <h3 className="font-headline-md text-headline-md text-primary">New Delivery Record</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-secondary hover:text-on-surface cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit((data: any) => onSubmit(data))} className="p-lg space-y-lg flex-1">
              {serverError && (
                <div className="bg-error-container text-on-error-container p-md rounded-xl text-body-md font-semibold">
                  {serverError}
                </div>
              )}

              {/* Admission & Patient info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                <div>
                  <label className="block text-label-md font-semibold mb-xs">Active Admission</label>
                  <select
                    {...register('admission')}
                    onChange={handleAdmissionChange}
                    className="w-full p-sm bg-surface-container-low border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/20 text-body-md"
                  >
                    <option value="">Select Active Admission</option>
                    {activeAdmissions?.results?.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.patient_name} - {a.room_number || 'Room'}/{a.bed_number || 'Bed'}
                      </option>
                    ))}
                  </select>
                  {errors.admission && <p className="text-error text-xs mt-xs">{errors.admission.message}</p>}
                </div>

                <div>
                  <label className="block text-label-md font-semibold mb-xs">Delivery Doctor</label>
                  <select
                    {...register('doctor')}
                    className="w-full p-sm bg-surface-container-low border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/20 text-body-md"
                  >
                    <option value="">Select Doctor</option>
                    {doctorsData?.results?.map((doc: any) => (
                      <option key={doc.id} value={doc.id}>
                        Dr. {doc.full_name}
                      </option>
                    ))}
                  </select>
                  {errors.doctor && <p className="text-error text-xs mt-xs">{errors.doctor.message}</p>}
                </div>
              </div>

              {/* DateTime & Mode */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                <div>
                  <label className="block text-label-md font-semibold mb-xs">Delivery Date & Time</label>
                  <input
                    type="datetime-local"
                    {...register('delivery_datetime')}
                    className="w-full p-sm bg-surface-container-low border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/20 text-body-md"
                  />
                  {errors.delivery_datetime && <p className="text-error text-xs mt-xs">{errors.delivery_datetime.message}</p>}
                </div>

                <div>
                  <label className="block text-label-md font-semibold mb-xs">Delivery Mode</label>
                  <select
                    {...register('delivery_mode')}
                    onChange={handleModeChange}
                    className="w-full p-sm bg-surface-container-low border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/20 text-body-md"
                  >
                    <option value="normal">Normal Vaginal Delivery</option>
                    <option value="c_section">Caesarean Section (C-Section)</option>
                    <option value="assisted">Assisted Vaginal Delivery</option>
                    <option value="water_birth">Water Birth</option>
                  </select>
                  {errors.delivery_mode && <p className="text-error text-xs mt-xs">{errors.delivery_mode.message}</p>}
                </div>
              </div>

              {/* Blood loss and placenta completion */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                <div>
                  <label className="block text-label-md font-semibold mb-xs">Estimated Blood Loss (ml)</label>
                  <input
                    type="number"
                    {...register('blood_loss_ml', { valueAsNumber: true })}
                    className="w-full p-sm bg-surface-container-low border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/20 text-body-md"
                  />
                  {errors.blood_loss_ml && <p className="text-error text-xs mt-xs">{errors.blood_loss_ml.message}</p>}
                </div>

                <div className="flex items-center h-full pt-lg">
                  <input
                    type="checkbox"
                    id="placenta_complete"
                    {...register('placenta_complete')}
                    className="w-5 h-5 accent-primary border border-outline-variant rounded"
                  />
                  <label htmlFor="placenta_complete" className="ml-sm text-body-md font-medium select-none cursor-pointer">
                    Placenta Delivered Intact & Complete
                  </label>
                </div>
              </div>

              {/* Complications & Notes */}
              <div>
                <label className="block text-label-md font-semibold mb-xs">Complications (if any)</label>
                <textarea
                  {...register('complications')}
                  placeholder="E.g., Postpartum hemorrhage, fetal distress..."
                  rows={2}
                  className="w-full p-sm bg-surface-container-low border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/20 text-body-md"
                />
              </div>

              <div>
                <label className="block text-label-md font-semibold mb-xs">Delivery Notes</label>
                <textarea
                  {...register('notes')}
                  placeholder="Record summary of delivery details..."
                  rows={2}
                  className="w-full p-sm bg-surface-container-low border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/20 text-body-md"
                />
              </div>

              {/* Dynamic Procedures List */}
              <div className="border-t border-outline-variant/10 pt-md">
                <div className="flex justify-between items-center mb-md">
                  <h4 className="font-title-md text-title-md text-secondary">Procedures Logged</h4>
                  <button
                    type="button"
                    onClick={() =>
                      append({
                        performed_by: watch('doctor') || '',
                        procedure_name: '',
                        indication: '',
                        technique: '',
                        implants_used: '',
                        duration_minutes: 30,
                        post_op_instructions: '',
                        performed_at: new Date().toISOString().slice(0, 16),
                      })
                    }
                    className="flex items-center gap-xs text-primary font-bold text-label-md hover:underline cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">add</span> Add Procedure
                  </button>
                </div>

                <div className="space-y-sm">
                  {procedureFields.map((field, index) => (
                    <div key={field.id} className="p-md bg-surface-container-low border border-outline-variant/20 rounded-xl space-y-sm relative">
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="absolute top-sm right-sm text-error hover:opacity-80 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                      </button>

                      <div className="grid grid-cols-2 gap-sm">
                        <div>
                          <label className="block text-xs font-semibold text-secondary mb-xs">Procedure Name</label>
                          <input
                            type="text"
                            {...register(`procedures.${index}.procedure_name` as const)}
                            placeholder="E.g. Caesarean Section, Episiotomy"
                            className="w-full p-xs bg-surface-container-lowest border border-outline-variant rounded-md text-body-sm"
                          />
                          {errors.procedures?.[index]?.procedure_name && (
                            <p className="text-error text-xs mt-xs">{errors.procedures[index]?.procedure_name?.message}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-secondary mb-xs">Duration (mins)</label>
                          <input
                            type="number"
                            {...register(`procedures.${index}.duration_minutes` as const, { valueAsNumber: true })}
                            className="w-full p-xs bg-surface-container-lowest border border-outline-variant rounded-md text-body-sm"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-sm">
                        <div>
                          <label className="block text-xs font-semibold text-secondary mb-xs">Performed By</label>
                          <select
                            {...register(`procedures.${index}.performed_by` as const)}
                            className="w-full p-xs bg-surface-container-lowest border border-outline-variant rounded-md text-body-sm"
                          >
                            <option value="">Select Doctor</option>
                            {doctorsData?.results?.map((doc: any) => (
                              <option key={doc.id} value={doc.id}>
                                Dr. {doc.full_name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-secondary mb-xs">Indication</label>
                          <input
                            type="text"
                            {...register(`procedures.${index}.indication` as const)}
                            placeholder="E.g. Breech presentation"
                            className="w-full p-xs bg-surface-container-lowest border border-outline-variant rounded-md text-body-sm"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  {errors.procedures && <p className="text-error text-sm font-semibold">{errors.procedures.root?.message || errors.procedures.message}</p>}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-sm border-t border-outline-variant/10 pt-lg">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-secondary px-lg py-md rounded-lg font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary bg-primary text-on-primary px-xl py-md rounded-lg font-bold shadow-md hover:brightness-110 cursor-pointer"
                >
                  {isSubmitting ? 'Recording...' : 'Record Delivery'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
