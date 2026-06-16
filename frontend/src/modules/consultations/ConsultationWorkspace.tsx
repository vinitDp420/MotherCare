/**
 * ConsultationWorkspace — Master layout assembling all consultation panels.
 *
 * Layout (per Stitch reference + requirement spec):
 * ┌────────────────────────────────────────────────────────────────┐
 * │ Breadcrumbs                           [Cancel] [Save] [Done]  │
 * ├──────────┬────────────────────────────┬────────────────────────┤
 * │  LEFT    │     CENTER                 │     (scrollable)       │
 * │ Patient  │  Chief Complaint           │                        │
 * │ Summary  │  Clinical Notes            │                        │
 * │          │  Diagnosis                 │                        │
 * │ Preg.    │  Treatment Plan            │                        │
 * │ Status   │                            │                        │
 * │          │  Prescription Panel        │                        │
 * │ Allergies│                            │                        │
 * │          │  Lab Orders (Bottom)       │                        │
 * │ Rx Hx    │  Follow-up (Bottom)        │                        │
 * └──────────┴────────────────────────────┴────────────────────────┘
 *
 * The right sidebar from the Stitch screenshot is the Patient Summary
 * moved to left per the requirement spec. The center takes up the rest.
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  useUpdateConsultation,
  useCompleteConsultation,
  useCancelConsultation,
  useFollowUpConsultation,
} from '@/hooks/useConsultations'
import type { Consultation } from '@/api/endpoints/consultations.api'

import PatientSummaryPanel from './PatientSummaryPanel'
import ConsultationForm from './ConsultationForm'
import PrescriptionPanel from './PrescriptionPanel'
import LabOrderPanel from './LabOrderPanel'
import FollowUpSection from './FollowUpSection'

interface ConsultationWorkspaceProps {
  consultation: Consultation
  refetch: () => void
}

export default function ConsultationWorkspace({ consultation, refetch }: ConsultationWorkspaceProps) {
  const navigate = useNavigate()

  // Form states
  const [notes, setNotes] = useState('')
  const [diagnosis, setDiagnosis] = useState('')
  const [followUpDate, setFollowUpDate] = useState('')
  const [followUpTime, setFollowUpTime] = useState('11:30')
  const [followUpNotes, setFollowUpNotes] = useState('')

  // Auto-save states
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null)

  // Feedback banners
  const [successBanner, setSuccessBanner] = useState<string | null>(null)
  const [errorBanner, setErrorBanner] = useState<string | null>(null)

  // Mutations
  const updateConsultation = useUpdateConsultation()
  const completeConsultation = useCompleteConsultation()
  const cancelConsultation = useCancelConsultation()
  const followUpConsultation = useFollowUpConsultation()

  const isReadOnly = consultation.is_terminal

  // Prepopulate form when consultation data loads
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

  // 30-second debounced auto-save of clinical notes & diagnosis
  useEffect(() => {
    if (isReadOnly) return

    // Avoid initial trigger on load
    if (notes === (consultation.clinical_notes || '') && diagnosis === (consultation.diagnosis || '')) {
      return
    }

    setAutoSaveStatus('saving')

    const timer = setTimeout(() => {
      updateConsultation.mutate(
        { id: consultation.id, data: { clinical_notes: notes, diagnosis } },
        {
          onSuccess: () => {
            setAutoSaveStatus('saved')
            const now = new Date()
            setLastSavedTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
            refetch()
          },
          onError: () => {
            setAutoSaveStatus('error')
          },
        }
      )
    }, 30000)

    return () => clearTimeout(timer)
  }, [notes, diagnosis])

  // Auto-dismiss banners
  useEffect(() => {
    if (successBanner) {
      const t = setTimeout(() => setSuccessBanner(null), 4000)
      return () => clearTimeout(t)
    }
  }, [successBanner])

  useEffect(() => {
    if (errorBanner) {
      const t = setTimeout(() => setErrorBanner(null), 6000)
      return () => clearTimeout(t)
    }
  }, [errorBanner])

  // ── Actions ──────────────────────────────────────────────────────────────────

  const handleSaveNotes = () => {
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
        onError: (err: any) => setErrorBanner(err.detail || 'Failed to save notes.'),
      }
    )
  }

  const handleCompleteConsultation = () => {
    if (isReadOnly) return
    setErrorBanner(null)
    setSuccessBanner(null)
    completeConsultation.mutate(
      { id: consultation.id, data: { clinical_notes: notes, diagnosis } },
      {
        onSuccess: () => navigate('/appointments'),
        onError: (err: any) => setErrorBanner(err.detail || 'Failed to complete consultation.'),
      }
    )
  }

  const handleCancelConsultation = () => {
    if (isReadOnly) return
    if (confirm('Are you sure you want to cancel this consultation? This cannot be undone.')) {
      setErrorBanner(null)
      setSuccessBanner(null)
      cancelConsultation.mutate(
        { id: consultation.id, reason: 'Doctor cancelled session' },
        {
          onSuccess: () => navigate('/appointments'),
          onError: (err: any) => setErrorBanner(err.detail || 'Failed to cancel consultation.'),
        }
      )
    }
  }

  const handleScheduleFollowUp = () => {
    if (isReadOnly) return
    setErrorBanner(null)
    setSuccessBanner(null)

    if (!followUpDate) {
      setErrorBanner('Please select a valid follow-up date.')
      return
    }

    followUpConsultation.mutate(
      {
        id: consultation.id,
        data: {
          follow_up_datetime: `${followUpDate}T${followUpTime}:00`,
          notes: followUpNotes || 'Follow-up appointment requested.',
        },
      },
      {
        onSuccess: () => {
          setSuccessBanner('Follow-up appointment scheduled successfully.')
          refetch()
        },
        onError: (err: any) => setErrorBanner(err.detail || 'Failed to schedule follow-up.'),
      }
    )
  }

  const handleSuccess = (msg: string) => {
    setErrorBanner(null)
    setSuccessBanner(msg)
  }

  const handleError = (msg: string) => {
    setSuccessBanner(null)
    setErrorBanner(msg)
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  const isHighRisk =
    consultation.active_pregnancy?.risk_status === 'high_risk' ||
    consultation.active_pregnancy?.risk_status === 'critical'

  const hasBlockingAllergies =
    consultation.patient_allergies &&
    consultation.patient_allergies.some((a) => a.severity === 'severe' || a.severity === 'life_threatening')

  return (
    <div className="space-y-gutter">
      {/* ── Breadcrumbs & Actions ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-xs text-label-md font-label-md text-on-surface-variant">
          <a onClick={() => navigate('/dashboard')} className="hover:text-primary transition-colors cursor-pointer">
            Dashboard
          </a>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <a onClick={() => navigate('/appointments')} className="hover:text-primary transition-colors cursor-pointer">
            Appointments
          </a>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-on-surface font-semibold">Consultation</span>
        </div>
        <div className="flex gap-sm">
          {!isReadOnly ? (
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
          ) : (
            <button onClick={() => navigate('/appointments')} className="btn-secondary font-bold">
              Back to Appointments
            </button>
          )}
        </div>
      </div>

      {/* ── Page Header ── */}
      <div className="flex items-center justify-between pb-sm border-b border-outline-variant/10">
        <div>
          <h2 className="font-headline-md text-headline-md text-on-surface flex items-center gap-sm">
            Active Consultation
            <span
              className={`text-label-md font-label-md px-sm py-xs rounded-full border ${
                consultation.status === 'completed'
                  ? 'bg-primary-container text-on-primary-container border-primary-fixed-dim'
                  : consultation.status === 'cancelled'
                  ? 'bg-error-container text-error border-error/20'
                  : 'bg-surface-container-low text-primary border-primary-fixed-dim'
              }`}
            >
              {consultation.status_display}
            </span>
          </h2>
          <p className="text-secondary text-body-md mt-0.5">
            Appointment type: <span className="font-bold text-on-surface">{consultation.appointment_type}</span> (Token: #{consultation.appointment_token})
          </p>
        </div>
        <div className="flex items-center gap-sm text-sm text-secondary">
          {autoSaveStatus === 'saving' && (
            <span className="text-body-sm text-primary-500 animate-pulse flex items-center gap-xs">
              <span className="material-symbols-outlined text-[16px] animate-spin">sync</span> Auto-saving...
            </span>
          )}
          {autoSaveStatus === 'saved' && (
            <span className="text-body-sm text-emerald-600 flex items-center gap-xs bg-emerald-50 px-sm py-xs rounded-md border border-emerald-200">
              <span className="material-symbols-outlined text-[16px]">done</span> Saved at {lastSavedTime}
            </span>
          )}
          {autoSaveStatus === 'error' && (
            <span className="text-body-sm text-error flex items-center gap-xs bg-error-container/50 px-sm py-xs rounded-md border border-error/20">
              <span className="material-symbols-outlined text-[16px]">error</span> Auto-save failed
            </span>
          )}
        </div>
      </div>

      {/* ── Warning Banners (Stitch: Allergy + High Risk) ── */}
      {hasBlockingAllergies && (
        <div className="bg-error-container text-on-error-container p-md rounded-xl border border-error/20 flex items-start gap-md">
          <span className="material-symbols-outlined text-error" style={{ fontVariationSettings: "'FILL' 1" }}>
            warning
          </span>
          <div className="flex-1">
            <h4 className="text-label-lg font-bold">CRITICAL ALLERGY ALERT</h4>
            <p className="text-body-md">
              Patient has severe allergies:{' '}
              {consultation.patient_allergies
                ?.filter((a) => a.severity === 'severe' || a.severity === 'life_threatening')
                .map((a) => a.allergen)
                .join(', ')}
              . Verify all prescriptions.
            </p>
          </div>
        </div>
      )}

      {isHighRisk && (
        <div className="bg-tertiary-container text-on-tertiary-container p-md rounded-xl border border-tertiary/20 flex items-start gap-md">
          <span className="material-symbols-outlined text-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>
            priority_high
          </span>
          <div className="flex-1">
            <h4 className="text-label-lg font-bold">HIGH RISK PREGNANCY</h4>
            <p className="text-body-md">
              Week {consultation.active_pregnancy?.current_week} — Trimester {consultation.active_pregnancy?.trimester}. Monitor closely.
            </p>
          </div>
        </div>
      )}

      {/* ── Feedback Banners ── */}
      {successBanner && (
        <div className="bg-success-50 border border-success-200 text-success-600 p-md rounded-xl flex items-center gap-sm shadow-sm animate-fadeIn">
          <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          <span className="text-sm font-medium">{successBanner}</span>
        </div>
      )}
      {errorBanner && (
        <div className="bg-error-container border border-error/20 text-error p-md rounded-xl flex items-center gap-sm shadow-sm animate-fadeIn">
          <span className="material-symbols-outlined text-[20px]">error</span>
          <span className="text-sm font-medium">{errorBanner}</span>
        </div>
      )}
      {isReadOnly && (
        <div className="bg-neutral-50 border border-neutral-200 text-secondary p-md rounded-xl flex items-center gap-sm">
          <span className="material-symbols-outlined text-[20px]">lock</span>
          <span className="text-sm font-medium">
            This consultation has been finalized. All notes and records are immutable.
          </span>
        </div>
      )}

      {/* ── Main Workspace Layout ── */}
      <div className="flex flex-col xl:flex-row gap-lg items-start">
        {/* Left Panel — Patient Summary */}
        <PatientSummaryPanel consultation={consultation} />

        {/* Center + Bottom — Clinical area (scrollable) */}
        <div className="flex-1 w-full space-y-lg">
          {/* Center Panel — Consultation Form */}
          <ConsultationForm
            clinicalNotes={notes}
            diagnosis={diagnosis}
            isReadOnly={isReadOnly}
            onNotesChange={setNotes}
            onDiagnosisChange={setDiagnosis}
          />

          {/* Prescription Panel */}
          <PrescriptionPanel
            consultation={consultation}
            isReadOnly={isReadOnly}
            onSuccess={handleSuccess}
            onError={handleError}
          />

          {/* Bottom Section — Lab + Follow-up Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
            {/* Lab Orders */}
            <LabOrderPanel
              consultation={consultation}
              isReadOnly={isReadOnly}
              onSuccess={handleSuccess}
              onError={handleError}
            />

            {/* Follow-up Scheduler */}
            <FollowUpSection
              followUpDate={followUpDate}
              followUpTime={followUpTime}
              followUpNotes={followUpNotes}
              isReadOnly={isReadOnly}
              isPending={followUpConsultation.isPending}
              existingFollowUp={consultation.follow_up_datetime}
              onDateChange={setFollowUpDate}
              onTimeChange={setFollowUpTime}
              onNotesChange={setFollowUpNotes}
              onSchedule={handleScheduleFollowUp}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
