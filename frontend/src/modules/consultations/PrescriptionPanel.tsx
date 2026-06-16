/**
 * PrescriptionPanel — Right panel of the Consultation Workspace.
 * Manages: Add/Remove medicines, dosage, frequency, duration, instructions.
 * Matches Stitch "Prescription" card with inline table editing.
 */
import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useCreatePrescription } from '@/hooks/usePrescriptions'
import { prescriptionsApi } from '@/api/endpoints/prescriptions.api'
import { pharmacyApi } from '@/api/endpoints/pharmacy.api'
import type { Consultation } from '@/api/endpoints/consultations.api'
import apiClient from '@/api/client'

interface PrescriptionRow {
  medicineId: string
  medicineName: string
  medicineGenericName: string
  route: string
  dosage: string
  frequency: string
  durationDays: number | ''
  quantityToDispense: number | ''
  instructions: string
  searchQuery: string
  showSuggestions: boolean
  suggestions: any[]
}

interface PrescriptionPanelProps {
  consultation: Consultation
  isReadOnly: boolean
  onSuccess: (message: string) => void
  onError: (message: string) => void
}

const EMPTY_ROW: PrescriptionRow = {
  medicineId: '',
  medicineName: '',
  medicineGenericName: '',
  route: 'Oral',
  dosage: '',
  frequency: 'OD',
  durationDays: '',
  quantityToDispense: '',
  instructions: '',
  searchQuery: '',
  showSuggestions: false,
  suggestions: [],
}

const ROUTE_CHOICES = [
  { value: 'Oral', label: 'Oral' },
  { value: 'IV', label: 'Intravenous (IV)' },
  { value: 'IM', label: 'Intramuscular (IM)' },
  { value: 'SC', label: 'Subcutaneous (SC)' },
  { value: 'Topical', label: 'Topical' },
  { value: 'Inhalation', label: 'Inhalation' },
  { value: 'Drops', label: 'Drops' },
]

export default function PrescriptionPanel({ consultation, isReadOnly, onSuccess, onError }: PrescriptionPanelProps) {
  const [prescriptionRows, setPrescriptionRows] = useState<PrescriptionRow[]>([{ ...EMPTY_ROW }])
  const [prescriptionNotes, setPrescriptionNotes] = useState('')
  const [rxSaved, setRxSaved] = useState(false)

  const [hasInitialized, setHasInitialized] = useState(false)
  const createPrescription = useCreatePrescription()

  // Reset initialization state on consultation change
  useEffect(() => {
    setHasInitialized(false)
  }, [consultation.id])

  // Fetch existing prescriptions for this consultation
  const { data: currentPrescriptions } = useQuery({
    queryKey: ['consultation-prescriptions', consultation.id],
    queryFn: () => prescriptionsApi.list({ consultation: consultation.id }),
    enabled: !!consultation.id,
  })

  // Prepopulate saved prescription items
  useEffect(() => {
    if (!currentPrescriptions) return

    if (currentPrescriptions.results && currentPrescriptions.results.length > 0) {
      const rx = currentPrescriptions.results[0]
      setPrescriptionNotes(rx.notes || '')
      if (rx.items && rx.items.length > 0) {
        setPrescriptionRows(
          rx.items.map((item) => ({
            medicineId: item.medicine.id,
            medicineName: item.medicine.name,
            medicineGenericName: item.medicine.generic_name,
            route: item.route || 'Oral',
            dosage: item.dosage,
            frequency: item.frequency,
            durationDays: item.duration_days || '',
            quantityToDispense: item.quantity_to_dispense || '',
            instructions: item.instructions || '',
            searchQuery: item.medicine.name,
            showSuggestions: false,
            suggestions: [],
          }))
        )
        setRxSaved(true)
      }
      setHasInitialized(true)
    } else if (!hasInitialized) {
      setPrescriptionRows([{ ...EMPTY_ROW }])
      setRxSaved(false)
      setHasInitialized(true)
    }
  }, [currentPrescriptions, hasInitialized])

  // Row operations
  const handleAddRow = () => {
    if (isReadOnly || rxSaved) return
    setPrescriptionRows([...prescriptionRows, { ...EMPTY_ROW }])
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

  // Allergy overlap checking logic
  const checkAllergyConflicts = () => {
    if (!consultation.patient_allergies) return []

    return prescriptionRows
      .filter((row) => row.medicineId)
      .map((row) => {
        const conflicts = consultation.patient_allergies!.filter((allergy) => {
          const allergen = allergy.allergen.toLowerCase().trim()
          const medName = row.medicineName.toLowerCase()
          const genericName = (row.medicineGenericName || '').toLowerCase()

          return (
            medName.includes(allergen) ||
            genericName.includes(allergen) ||
            allergen.includes(medName) ||
            (genericName && allergen.includes(genericName))
          )
        })
        return { row, conflicts }
      })
      .filter((item) => item.conflicts.length > 0)
  }

  const conflicts = checkAllergyConflicts()
  const hasSevereConflict = conflicts.some((c) =>
    c.conflicts.some((a) => a.severity === 'severe' || a.severity === 'life_threatening')
  )

  const handleSavePrescription = () => {
    if (isReadOnly || rxSaved) return

    const validItems = prescriptionRows.filter((r) => r.medicineId)
    if (validItems.length === 0) {
      onError('Please add at least one medication from the active formulary list.')
      return
    }

    if (hasSevereConflict) {
      onError('Cannot save prescription: Patient has severe/life-threatening allergies to one or more selected medications.')
      return
    }

    const payload = {
      consultation: consultation.id,
      patient: consultation.patient,
      notes: prescriptionNotes,
      status: 'saved',
      items: validItems.map((r, idx) => ({
        medicine: r.medicineId,
        route: r.route,
        dosage: r.dosage || 'As directed',
        frequency: r.frequency,
        duration: `${r.durationDays || 1} days`,
        duration_days: r.durationDays ? Number(r.durationDays) : 1,
        quantity_to_dispense: r.quantityToDispense ? Number(r.quantityToDispense) : 1,
        instructions: r.instructions,
        sort_order: idx,
      })),
    }

    createPrescription.mutate(payload, {
      onSuccess: () => {
        onSuccess('Prescription issued successfully.')
        setRxSaved(true)
      },
      onError: (err: any) => {
        onError(err.detail || 'Failed to save prescription.')
      },
    })
  }

  return (
    <div className="bg-white dark:bg-surface-container-lowest rounded-xl p-lg shadow-sm border border-outline-variant/30 space-y-md">
      {/* Header */}
      <div className="flex justify-between items-center pb-xs border-b border-outline-variant/10">
        <div className="flex items-center gap-sm text-primary">
          <span className="material-symbols-outlined text-[22px]">prescriptions</span>
          <h3 className="text-title-medium font-bold text-on-surface">Prescription Builder</h3>
        </div>
        {!isReadOnly && !rxSaved && (
          <button
            type="button"
            onClick={handleAddRow}
            className="flex items-center gap-xs text-primary font-label-md text-label-md hover:bg-surface-container-low px-sm py-xs rounded-md transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">add</span> Add Medication
          </button>
        )}
      </div>

      {/* Allergy warning banner */}
      {conflicts.length > 0 && (
        <div className="bg-error-container text-on-error-container p-md rounded-xl border border-error/20 flex items-start gap-md animate-fadeIn">
          <span className="material-symbols-outlined text-error" style={{ fontVariationSettings: "'FILL' 1" }}>
            warning
          </span>
          <div className="flex-1">
            <h4 className="text-label-lg font-bold">ALLERGY OVERLAP DETECTED</h4>
            <p className="text-body-sm mt-xs">
              The following selected medications conflict with recorded patient allergies:
            </p>
            <ul className="list-disc pl-md mt-xs text-body-sm space-y-0.5">
              {conflicts.map((conflict, idx) => (
                <li key={idx}>
                  <span className="font-bold text-error">{conflict.row.medicineName}</span> conflicts with allergen{' '}
                  {conflict.conflicts.map((c) => `"${c.allergen}" (${c.severity})`).join(', ')}
                </li>
              ))}
            </ul>
            {hasSevereConflict && (
              <p className="text-body-sm font-bold text-error mt-sm uppercase flex items-center gap-xs">
                <span className="material-symbols-outlined text-[16px]">block</span>
                Prescription saving is blocked due to severe/life-threatening allergy risks.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Prescription Table */}
      <div className="overflow-visible rounded-lg border border-outline-variant">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container-low text-on-surface-variant text-label-md font-medium border-b border-outline-variant">
              <th className="p-sm min-w-[160px]">Medication Name</th>
              <th className="p-sm w-32">Route</th>
              <th className="p-sm w-24">Dosage</th>
              <th className="p-sm w-36">Frequency</th>
              <th className="p-sm w-28">Duration (Days)</th>
              <th className="p-sm w-20">Qty</th>
              <th className="p-sm min-w-[120px]">Instructions</th>
              {!isReadOnly && !rxSaved && <th className="p-sm w-10"></th>}
            </tr>
          </thead>
          <tbody className="text-body-md">
            {prescriptionRows.map((row, idx) => {
              const isAllergic = conflicts.some((c) => c.row.medicineId === row.medicineId)
              return (
                <tr
                  key={idx}
                  className={`border-b border-outline-variant/50 hover:bg-surface-bright/50 transition-colors ${
                    isAllergic ? 'bg-error-container/10' : ''
                  }`}
                >
                  {/* Medication Name */}
                  <td className="p-sm relative">
                    <div className="space-y-1">
                      {isReadOnly || rxSaved ? (
                        <div>
                          <p className="font-medium text-on-surface flex items-center gap-xs">
                            {row.medicineName || '—'}
                            {isAllergic && (
                              <span className="material-symbols-outlined text-error text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                                warning
                              </span>
                            )}
                          </p>
                          {row.medicineGenericName && (
                            <p className="text-[10px] text-secondary font-medium">
                              Generic: {row.medicineGenericName}
                            </p>
                          )}
                        </div>
                      ) : (
                        <>
                          <div className={`flex items-center gap-xs px-2 py-1 bg-surface-bright border rounded-md focus-within:border-primary transition-colors ${
                            isAllergic ? 'border-error' : 'border-outline-variant'
                          }`}>
                            <span className="material-symbols-outlined text-[18px] text-outline">search</span>
                            <input
                              type="text"
                              value={row.searchQuery}
                              onChange={(e) => handleSearchMedicine(idx, e.target.value)}
                              onFocus={() => handleUpdateRow(idx, { showSuggestions: true })}
                              onBlur={() => setTimeout(() => handleUpdateRow(idx, { showSuggestions: false }), 200)}
                              className="w-full bg-transparent border-none outline-none focus:ring-0 p-0 text-on-surface placeholder-outline-variant text-sm"
                              placeholder="Search master list..."
                            />
                            {isAllergic && (
                              <span className="material-symbols-outlined text-error text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                                warning
                              </span>
                            )}
                          </div>
                          {row.medicineGenericName && (
                            <p className="text-[10px] text-secondary font-medium ml-1">
                              Generic: {row.medicineGenericName}
                            </p>
                          )}
                          {/* Suggestions dropdown */}
                          {row.showSuggestions && row.suggestions.length > 0 && (
                            <div className="absolute left-0 right-0 top-full mt-1 bg-surface-container-lowest border border-outline-variant rounded-lg shadow-lg z-30 max-h-48 overflow-y-auto">
                              {row.suggestions.map((med: any) => (
                                <button
                                  key={med.id}
                                  type="button"
                                  onMouseDown={(e) => e.preventDefault()}
                                  onClick={() => handleSelectMedicine(idx, med)}
                                  className="w-full text-left p-2 border-b border-outline-variant/30 hover:bg-surface-container-low cursor-pointer transition-colors"
                                >
                                  <p className="font-medium text-primary text-sm">{med.name}</p>
                                  <p className="text-label-md text-secondary">
                                    {med.generic_name} ({med.category_display || med.category})
                                  </p>
                                </button>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </td>

                  {/* Route */}
                  <td className="p-sm">
                    {isReadOnly || rxSaved ? (
                      <span className="text-sm">{row.route}</span>
                    ) : (
                      <select
                        value={row.route}
                        onChange={(e) => handleUpdateRow(idx, { route: e.target.value })}
                        className="w-full bg-transparent border-none outline-none focus:ring-0 p-0 text-on-surface text-sm cursor-pointer"
                      >
                        {ROUTE_CHOICES.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    )}
                  </td>

                  {/* Dosage */}
                  <td className="p-sm">
                    <input
                      type="text"
                      value={row.dosage}
                      disabled={isReadOnly || rxSaved}
                      onChange={(e) => handleUpdateRow(idx, { dosage: e.target.value })}
                      className="w-full bg-transparent border-none outline-none focus:ring-0 p-0 text-on-surface placeholder-outline-variant text-sm"
                      placeholder="e.g. 500mg"
                    />
                  </td>

                  {/* Frequency */}
                  <td className="p-sm">
                    {isReadOnly || rxSaved ? (
                      <span className="text-sm">{row.frequency}</span>
                    ) : (
                      <select
                        value={row.frequency}
                        onChange={(e) => handleUpdateRow(idx, { frequency: e.target.value })}
                        className="w-full bg-transparent border-none outline-none focus:ring-0 p-0 text-on-surface text-sm cursor-pointer appearance-none"
                      >
                        <option value="OD">Once Daily (OD)</option>
                        <option value="BD">Twice Daily (BD)</option>
                        <option value="TDS">Three Times (TDS)</option>
                        <option value="QID">Four Times (QID)</option>
                        <option value="SOS">As Needed (SOS)</option>
                        <option value="STAT">Immediately (STAT)</option>
                        <option value="weekly">Weekly</option>
                      </select>
                    )}
                  </td>

                  {/* Duration (Days) */}
                  <td className="p-sm">
                    <input
                      type="number"
                      value={row.durationDays}
                      disabled={isReadOnly || rxSaved}
                      onChange={(e) => handleUpdateRow(idx, { durationDays: e.target.value === '' ? '' : Number(e.target.value) })}
                      className="w-full bg-transparent border-none outline-none focus:ring-0 p-0 text-on-surface placeholder-outline-variant text-sm"
                      placeholder="e.g. 7"
                      min="1"
                    />
                  </td>

                  {/* Quantity */}
                  <td className="p-sm">
                    <input
                      type="number"
                      value={row.quantityToDispense}
                      disabled={isReadOnly || rxSaved}
                      onChange={(e) => handleUpdateRow(idx, { quantityToDispense: e.target.value === '' ? '' : Number(e.target.value) })}
                      className="w-full bg-transparent border-none outline-none focus:ring-0 p-0 text-on-surface placeholder-outline-variant text-sm"
                      placeholder="e.g. 10"
                      min="1"
                    />
                  </td>

                  {/* Instructions */}
                  <td className="p-sm">
                    <input
                      type="text"
                      value={row.instructions}
                      disabled={isReadOnly || rxSaved}
                      onChange={(e) => handleUpdateRow(idx, { instructions: e.target.value })}
                      className="w-full bg-transparent border-none outline-none focus:ring-0 p-0 text-on-surface placeholder-outline-variant text-sm"
                      placeholder="e.g. After food"
                    />
                  </td>

                  {/* Remove row */}
                  {!isReadOnly && !rxSaved && (
                    <td className="p-sm text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveRow(idx)}
                        className="text-outline hover:text-error transition-colors"
                      >
                        <span className="material-symbols-outlined text-[20px]">close</span>
                      </button>
                    </td>
                  )}
                </tr>
              )
            })}
            {prescriptionRows.length === 0 && (
              <tr>
                <td colSpan={isReadOnly || rxSaved ? 7 : 8} className="py-md text-center text-secondary text-sm">
                  No medications prescribed yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Notes & Save */}
      {!isReadOnly && !rxSaved && (
        <>
          <div className="space-y-sm">
            <label className="block text-label-md font-semibold text-secondary">
              Prescription Notes (Optional)
            </label>
            <input
              type="text"
              value={prescriptionNotes}
              onChange={(e) => setPrescriptionNotes(e.target.value)}
              className="form-input text-sm w-full"
              placeholder="Special warnings, dispensing directions or overall comments..."
            />
          </div>
          <div className="flex justify-end pt-sm">
            <button
              type="button"
              onClick={handleSavePrescription}
              disabled={createPrescription.isPending || hasSevereConflict}
              className={`px-lg py-sm text-on-primary rounded-lg font-label-lg transition-colors shadow-sm flex items-center gap-xs ${
                hasSevereConflict
                  ? 'bg-neutral-300 cursor-not-allowed text-neutral-500'
                  : 'bg-primary hover:bg-primary-hover'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">done</span>
              {createPrescription.isPending ? 'Saving...' : 'Save & Issue Prescription'}
            </button>
          </div>
        </>
      )}

      {rxSaved && (
        <div className="flex items-center justify-between w-full pt-sm border-t border-outline-variant/10">
          <div className="flex items-center gap-xs text-success-600 bg-success-50 border border-success-100 rounded-lg p-sm font-semibold text-sm w-fit">
            <span className="material-symbols-outlined text-[18px]">lock</span>
            Prescription Issued (Immutable)
          </div>
          {currentPrescriptions?.results?.[0]?.id && (
            <div className="flex gap-sm">
              <button
                type="button"
                onClick={() => window.open(`/prescriptions/${currentPrescriptions.results[0].id}/print`, '_blank')}
                className="btn-secondary text-xs font-semibold flex items-center gap-xs text-primary bg-primary/5 border-primary/20 hover:bg-primary/10 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">print</span>
                Print Prescription
              </button>
              <button
                type="button"
                onClick={() => window.open(`${apiClient.defaults.baseURL}/prescriptions/${currentPrescriptions.results[0].id}/export/`, '_blank')}
                className="btn-secondary text-xs font-semibold flex items-center gap-xs text-primary bg-primary/5 border-primary/20 hover:bg-primary/10 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
                Download PDF
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
