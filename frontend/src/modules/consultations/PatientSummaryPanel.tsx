/**
 * PatientSummaryPanel — Left sidebar panel for the Consultation Workspace.
 * Displays patient info, allergies, active pregnancy, and ANC summary.
 * Matches Stitch "Doctor Consultation Enhanced" right-sidebar layout
 * but positioned as the LEFT panel per requirement spec.
 */
import type { Consultation, ActivePregnancy, PatientAllergy } from '@/api/endpoints/consultations.api'

interface PatientSummaryPanelProps {
  consultation: Consultation
}

export default function PatientSummaryPanel({ consultation }: PatientSummaryPanelProps) {
  const calculateAge = (dobString?: string) => {
    if (!dobString) return 'N/A'
    const dob = new Date(dobString)
    const diffMs = Date.now() - dob.getTime()
    const ageDate = new Date(diffMs)
    return Math.abs(ageDate.getUTCFullYear() - 1970) + ' Yrs'
  }

  return (
    <aside className="w-full xl:w-[340px] shrink-0 space-y-md relative">
      {/* Subtle dot pattern overlay */}
      <div
        className="absolute inset-0 opacity-5 pointer-events-none rounded-xl"
        style={{
          backgroundImage: 'radial-gradient(#00685d 1px, transparent 1px)',
          backgroundSize: '16px 16px',
        }}
      />

      {/* ── Patient Profile Card ── */}
      <div className="bg-white rounded-xl border border-outline-variant/20 p-md shadow-sm relative z-10">
        <div className="flex items-start gap-md mb-md">
          <div className="w-16 h-16 rounded-full bg-secondary-container overflow-hidden shrink-0 border-2 border-surface-bright flex items-center justify-center text-on-secondary-container">
            <span className="material-symbols-outlined text-[32px]">person</span>
          </div>
          <div>
            <h2 className="text-title-lg font-bold text-on-surface">{consultation.patient_name}</h2>
            <p className="text-label-md font-medium text-secondary">MRN: {consultation.patient_mrn}</p>
            <div className="mt-xs flex gap-xs">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-surface-container-high text-on-surface-variant">
                {calculateAge(consultation.patient_dob)}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-error/10 text-error">
                {consultation.patient_blood_group || 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Pregnancy Status Card ── */}
      {consultation.active_pregnancy ? (
        <PregnancyCard pregnancy={consultation.active_pregnancy} />
      ) : (
        <div className="bg-white rounded-xl border border-outline-variant/20 p-md shadow-sm text-center py-lg text-secondary text-sm relative z-10">
          <span className="material-symbols-outlined text-[32px] text-neutral-300 mb-1">pregnant_woman</span>
          <p>No active pregnancy tracked.</p>
        </div>
      )}

      {/* ── Allergies & Alerts Card ── */}
      <AllergiesCard allergies={consultation.patient_allergies} />

      {/* ── Prescription History Card ── */}
      <PrescriptionHistoryCard prescriptions={consultation.previous_prescriptions} />
    </aside>
  )
}

// ── Sub-components ──────────────────────────────────────────────────────────────

function PregnancyCard({ pregnancy }: { pregnancy: ActivePregnancy }) {
  const progressPct = Math.min((pregnancy.current_week / 40) * 100, 100)
  const isHighRisk = pregnancy.risk_status === 'high_risk' || pregnancy.risk_status === 'critical'

  return (
    <div className="bg-white rounded-xl border border-outline-variant/20 p-md shadow-sm space-y-md border-t-4 border-t-primary relative z-10">
      <h3 className="text-label-lg font-bold text-on-surface flex items-center gap-xs">
        <span className="material-symbols-outlined text-[18px] text-primary">child_care</span>
        Pregnancy Status
      </h3>

      {/* Week progress */}
      <div>
        <div className="flex justify-between items-end mb-xs">
          <span className="text-body-md font-semibold text-primary">Week {pregnancy.current_week}</span>
          <span className="text-label-md text-secondary">Trimester {pregnancy.trimester}</span>
        </div>
        <div className="w-full h-2 bg-surface-container-high rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* EDD & Risk grid */}
      <div className="grid grid-cols-2 gap-sm">
        <div className="p-sm bg-surface-bright rounded-lg border border-outline-variant/30">
          <p className="text-label-md text-secondary">EDD</p>
          <p className="text-body-md font-medium text-on-surface">
            {new Date(pregnancy.edd).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
              year: '2-digit',
            })}
          </p>
        </div>
        <div className="p-sm bg-surface-bright rounded-lg border border-outline-variant/30">
          <p className="text-label-md text-secondary">Risk Status</p>
          <p className={`text-body-md font-medium flex items-center gap-1 ${isHighRisk ? 'text-error' : 'text-success-600'}`}>
            <span className="material-symbols-outlined text-[14px]">
              {isHighRisk ? 'error' : 'check_circle'}
            </span>
            {isHighRisk ? 'High Risk' : 'Normal'}
          </p>
        </div>
      </div>

      {/* Gravida / Para */}
      <p className="text-[10px] text-secondary font-semibold text-center mt-xs">
        Gravida {pregnancy.gravida} | Para {pregnancy.para}
      </p>
    </div>
  )
}

function AllergiesCard({ allergies }: { allergies?: PatientAllergy[] }) {
  return (
    <div className="bg-white rounded-xl border border-outline-variant/20 p-md shadow-sm space-y-md relative z-10">
      <div className="flex items-center gap-xs text-secondary font-bold text-sm">
        <span className="material-symbols-outlined text-[20px] text-error">warning</span>
        Allergies & Alerts
      </div>
      {allergies && allergies.length > 0 ? (
        <ul className="space-y-sm">
          {allergies.map((allergy, idx) => (
            <li key={idx} className="flex gap-sm items-start p-xs hover:bg-neutral-50 rounded transition-colors">
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
  )
}

function PrescriptionHistoryCard({ prescriptions }: { prescriptions?: { id: string; issued_at: string; consultation_id: string; notes: string }[] }) {
  return (
    <div className="bg-white rounded-xl border border-outline-variant/20 p-md shadow-sm space-y-md relative z-10">
      <div className="flex items-center gap-xs text-secondary font-bold text-sm">
        <span className="material-symbols-outlined text-[20px]">history</span>
        Prescription History
      </div>
      {prescriptions && prescriptions.length > 0 ? (
        <div className="space-y-sm max-h-60 overflow-y-auto pr-xs custom-scrollbar">
          {prescriptions.map((rx, idx) => (
            <div key={idx} className="p-sm bg-surface-bright/50 border border-outline-variant/10 rounded-lg space-y-1">
              <div className="flex justify-between items-center text-[10px] text-secondary font-bold">
                <span>
                  {new Date(rx.issued_at).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
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
  )
}
