import { useState } from 'react'
import { useReferralsList, useCreateReferral } from '@/hooks/useReferrals'
import { useLabOrdersList } from '@/hooks/useLabOrders'
import { usePrescriptionsList } from '@/hooks/usePrescriptions'
import apiClient from '@/api/client'

interface StitchFileEditorProps {
  patientId: string
}

export default function StitchFileEditor({ patientId }: StitchFileEditorProps) {
  const [showForm, setShowForm] = useState(false)
  const [specialistType, setSpecialistType] = useState('')
  const [urgency, setUrgency] = useState<'routine' | 'urgent' | 'emergency'>('routine')
  const [reason, setReason] = useState('')
  const [referralNote, setReferralNote] = useState('')
  const [selectedReports, setSelectedReports] = useState<string[]>([])
  const [selectedPrescriptions, setSelectedPrescriptions] = useState<string[]>([])

  // Queries
  const { data: referrals, isLoading: referralsLoading, refetch } = useReferralsList({ patient: patientId })
  const { data: labOrders } = useLabOrdersList({ patient: patientId })
  const { data: prescriptions } = usePrescriptionsList({ patient: patientId })

  const createReferral = useCreateReferral()

  // Collect all available report records from patient's lab orders
  const availableReports = (labOrders?.results || []).flatMap((order) =>
    (order.reports || []).map((rep) => ({
      ...rep,
      orderId: order.id,
      itemsSummary: order.items.map((i) => i.test_code).join(', '),
    }))
  )

  const availablePrescriptions = prescriptions?.results || []
  const list = referrals?.results || []

  const handleToggleReport = (id: string) => {
    setSelectedReports((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const handleTogglePrescription = (id: string) => {
    setSelectedPrescriptions((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const handleCreateStitchFile = () => {
    if (!specialistType.trim()) {
      alert('Please specify the specialist type.')
      return
    }
    if (!reason.trim()) {
      alert('Please enter a reason for the referral.')
      return
    }

    createReferral.mutate(
      {
        patient: patientId,
        specialist_type: specialistType,
        urgency,
        reason,
        referral_note: referralNote,
        attached_report_ids: selectedReports,
        attached_prescription_ids: selectedPrescriptions,
      },
      {
        onSuccess: () => {
          setSpecialistType('')
          setUrgency('routine')
          setReason('')
          setReferralNote('')
          setSelectedReports([])
          setSelectedPrescriptions([])
          setShowForm(false)
          refetch()
        },
        onError: (err: any) => {
          alert(err.detail || 'Failed to create referral stitch file.')
        },
      }
    )
  }

  const handleExportPdf = (id: string) => {
    const url = `${apiClient.defaults.baseURL}/referrals/stitch/${id}/export/`
    window.open(url, '_blank')
  }

  return (
    <div className="bg-white dark:bg-surface-dim rounded-xl border border-outline-variant/20 p-lg shadow-sm space-y-md">
      {/* Panel Header */}
      <div className="flex justify-between items-center border-b border-outline-variant/10 pb-sm">
        <h3 className="text-title-lg font-bold text-on-surface flex items-center gap-xs">
          <span className="material-symbols-outlined text-primary">link</span> Persistent Stitch & Referral Files
        </h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="text-primary hover:underline font-label-lg flex items-center gap-xs"
        >
          <span className="material-symbols-outlined text-[18px]">{showForm ? 'close' : 'add'}</span>
          {showForm ? 'Cancel' : 'New Referral Stitch'}
        </button>
      </div>

      {/* Creation Form */}
      {showForm && (
        <div className="bg-surface-container-low border border-primary/10 rounded-xl p-md space-y-md animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-on-surface">Specialist Type *</label>
              <input
                type="text"
                value={specialistType}
                onChange={(e) => setSpecialistType(e.target.value)}
                className="form-input"
                placeholder="e.g. Cardiologist, Endocrinologist, Obstetrician"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-on-surface">Urgency *</label>
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value as any)}
                className="form-input"
              >
                <option value="routine">Routine</option>
                <option value="urgent">Urgent</option>
                <option value="emergency">Emergency</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-on-surface">Reason for Referral *</label>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="form-input resize-none"
              placeholder="Clinical indications and reason for refer..."
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-on-surface">Specialist Notes & Instructions</label>
            <textarea
              rows={2}
              value={referralNote}
              onChange={(e) => setReferralNote(e.target.value)}
              className="form-input resize-none"
              placeholder="Add supplementary instructions or notes..."
            />
          </div>

          {/* Attachments Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-md pt-sm border-t border-outline-variant/10">
            {/* Lab Reports checkbox list */}
            <div className="space-y-xs">
              <label className="block text-xs font-bold text-secondary uppercase">Attach Lab Reports</label>
              <div className="max-h-36 overflow-y-auto border border-outline-variant rounded-lg p-sm bg-white space-y-sm">
                {availableReports.length === 0 ? (
                  <p className="text-xs text-secondary text-center py-sm">No report PDFs available.</p>
                ) : (
                  availableReports.map((rep) => (
                    <label key={rep.id} className="flex items-start gap-xs text-xs cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={selectedReports.includes(rep.id)}
                        onChange={() => handleToggleReport(rep.id)}
                        className="mt-0.5"
                      />
                      <div>
                        <p className="font-semibold text-on-surface">Report #{rep.id.slice(0, 8)}</p>
                        <p className="text-[10px] text-secondary">Tests: {rep.itemsSummary}</p>
                      </div>
                    </label>
                  ))
                )}
              </div>
            </div>

            {/* Prescriptions checkbox list */}
            <div className="space-y-xs">
              <label className="block text-xs font-bold text-secondary uppercase">Attach Prescriptions</label>
              <div className="max-h-36 overflow-y-auto border border-outline-variant rounded-lg p-sm bg-white space-y-sm">
                {availablePrescriptions.length === 0 ? (
                  <p className="text-xs text-secondary text-center py-sm">No active prescriptions.</p>
                ) : (
                  availablePrescriptions.map((rx) => (
                    <label key={rx.id} className="flex items-start gap-xs text-xs cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={selectedPrescriptions.includes(rx.id)}
                        onChange={() => handleTogglePrescription(rx.id)}
                        className="mt-0.5"
                      />
                      <div>
                        <p className="font-semibold text-on-surface">Rx #{rx.id.slice(0, 8)}</p>
                        <p className="text-[10px] text-secondary">
                          {rx.notes || 'Routine Rx'} • {new Date(rx.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </label>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end pt-xs">
            <button
              onClick={handleCreateStitchFile}
              disabled={createReferral.isPending}
              className="btn-primary flex items-center gap-xs font-bold text-sm bg-neutral-900 text-white hover:bg-neutral-800"
            >
              <span className="material-symbols-outlined text-[18px]">done</span>
              {createReferral.isPending ? 'Stitching...' : 'Create Stitch File'}
            </button>
          </div>
        </div>
      )}

      {/* Referrals list */}
      {referralsLoading ? (
        <div className="text-center py-md text-secondary text-sm animate-pulse">Loading referral history...</div>
      ) : list.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
          {list.map((ref) => (
            <div
              key={ref.id}
              className="bg-neutral-50 dark:bg-surface-container-low rounded-xl p-md border border-neutral-100 dark:border-outline-variant/10 flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-on-surface text-sm">{ref.specialist_type} Referral</h4>
                    <p className="text-[10px] text-secondary mt-0.5">
                      Created by Dr. {ref.created_by_name} •{' '}
                      {new Date(ref.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      ref.urgency === 'emergency'
                        ? 'bg-error-container text-error'
                        : ref.urgency === 'urgent'
                        ? 'bg-tertiary-container text-on-tertiary-container'
                        : 'bg-surface-container text-on-surface-variant'
                    }`}
                  >
                    {ref.urgency.toUpperCase()}
                  </span>
                </div>

                <div className="mt-md text-xs space-y-sm text-on-surface-variant">
                  <p>
                    <strong>Reason:</strong> {ref.reason}
                  </p>
                  {ref.referral_note && (
                    <p>
                      <strong>Notes:</strong> {ref.referral_note}
                    </p>
                  )}

                  {/* Attached summaries */}
                  <div className="flex gap-md pt-xs text-[10px] text-outline font-semibold">
                    <span className="flex items-center gap-xs">
                      <span className="material-symbols-outlined text-[14px]">science</span>
                      {ref.attached_reports.length} Reports
                    </span>
                    <span className="flex items-center gap-xs">
                      <span className="material-symbols-outlined text-[14px]">prescriptions</span>
                      {ref.attached_prescriptions.length} Prescriptions
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-md pt-sm border-t border-outline-variant/10 flex justify-end">
                <button
                  onClick={() => handleExportPdf(ref.id)}
                  className="btn-secondary text-xs font-semibold flex items-center gap-xs text-primary"
                >
                  <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
                  Export PDF
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-md text-secondary text-sm">
          <span className="material-symbols-outlined text-[32px] text-neutral-300 block mb-xs">link_off</span>
          No referral stitch records found for this patient.
        </div>
      )}
    </div>
  )
}
