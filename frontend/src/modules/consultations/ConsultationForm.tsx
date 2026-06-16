import { useState, useEffect, useRef } from 'react'

interface ConsultationFormProps {
  clinicalNotes: string
  diagnosis: string
  isReadOnly: boolean
  onNotesChange: (notes: string) => void
  onDiagnosisChange: (diagnosis: string) => void
}

export default function ConsultationForm({
  clinicalNotes,
  diagnosis,
  isReadOnly,
  onNotesChange,
  onDiagnosisChange,
}: ConsultationFormProps) {
  const [chiefComplaint, setChiefComplaint] = useState('')
  const [subjective, setSubjective] = useState('')
  const [objective, setObjective] = useState('')
  const [assessment, setAssessment] = useState('')
  const [plan, setPlan] = useState('')

  // Track if we are currently updating from props to avoid feedback loops
  const isUpdatingFromProps = useRef(false)

  // Parse structured SOAP notes from clinicalNotes text
  useEffect(() => {
    if (clinicalNotes && !isUpdatingFromProps.current) {
      // Chief Complaint regex
      const ccMatch = clinicalNotes.match(/CHIEF COMPLAINT:\s*(.*?)(?:\n\n|\n[A-Z]|$)/i)
      if (ccMatch) {
        setChiefComplaint(ccMatch[1].trim())
      }

      // SOAP sections regex
      const sMatch = clinicalNotes.match(/SUBJECTIVE:\s*([\s\S]*?)(?=\n\n?(?:OBJECTIVE|ASSESSMENT|PLAN)|$)/i)
      const oMatch = clinicalNotes.match(/OBJECTIVE:\s*([\s\S]*?)(?=\n\n?(?:SUBJECTIVE|ASSESSMENT|PLAN)|$)/i)
      const aMatch = clinicalNotes.match(/ASSESSMENT:\s*([\s\S]*?)(?=\n\n?(?:SUBJECTIVE|OBJECTIVE|PLAN)|$)/i)
      const pMatch = clinicalNotes.match(/PLAN:\s*([\s\S]*?)(?=\n\n?(?:SUBJECTIVE|OBJECTIVE|ASSESSMENT)|$)/i)

      if (sMatch || oMatch || aMatch || pMatch) {
        setSubjective(sMatch ? sMatch[1].trim() : '')
        setObjective(oMatch ? oMatch[1].trim() : '')
        setAssessment(aMatch ? aMatch[1].trim() : '')
        setPlan(pMatch ? pMatch[1].trim() : '')
      } else {
        // Fallback for unstructured text: treat the body of the notes as Subjective
        const strippedBody = clinicalNotes
          .replace(/CHIEF COMPLAINT:\s*(.*?)(?:\n\n|\n[A-Z]|$)/i, '')
          .trim()
        setSubjective(strippedBody)
        setObjective('')
        setAssessment('')
        setPlan('')
      }
    }
  }, [clinicalNotes])

  // Re-compose the SOAP notes whenever fields change
  const handleFieldChange = (
    cc: string,
    s: string,
    o: string,
    a: string,
    p: string
  ) => {
    isUpdatingFromProps.current = true

    const parts: string[] = []
    if (cc.trim()) {
      parts.push(`CHIEF COMPLAINT: ${cc.trim()}`)
    }
    if (s.trim()) {
      parts.push(`SUBJECTIVE:\n${s.trim()}`)
    }
    if (o.trim()) {
      parts.push(`OBJECTIVE:\n${o.trim()}`)
    }
    if (a.trim()) {
      parts.push(`ASSESSMENT:\n${a.trim()}`)
    }
    if (p.trim()) {
      parts.push(`PLAN:\n${p.trim()}`)
    }

    onNotesChange(parts.join('\n\n'))

    // Release flag after microtask queue is cleared
    setTimeout(() => {
      isUpdatingFromProps.current = false
    }, 0)
  }

  return (
    <div className="w-full space-y-lg">
      {/* ── Chief Complaint ── */}
      <div className="bg-white dark:bg-surface-container-lowest rounded-xl p-lg shadow-sm border border-outline-variant/30 space-y-md">
        <div className="flex items-center gap-sm text-primary">
          <span className="material-symbols-outlined text-[22px]">report_problem</span>
          <h3 className="text-title-medium font-bold text-on-surface">Chief Complaint</h3>
        </div>
        <input
          type="text"
          value={chiefComplaint}
          onChange={(e) => {
            setChiefComplaint(e.target.value)
            handleFieldChange(e.target.value, subjective, objective, assessment, plan)
          }}
          disabled={isReadOnly}
          className="form-input w-full text-body-md"
          placeholder="Primary reason for visit (e.g., Routine ANC checkup, Abdominal pain, Headache)..."
        />
      </div>

      {/* ── SOAP Clinical Notes — 2x2 layout ── */}
      <div className="bg-white dark:bg-surface-container-lowest rounded-xl p-lg shadow-sm border border-outline-variant/30 space-y-md">
        <div className="flex items-center gap-sm text-primary pb-xs border-b border-outline-variant/10">
          <span className="material-symbols-outlined text-[22px]">edit_note</span>
          <h3 className="text-title-medium font-bold text-on-surface">Clinical Notes (SOAP)</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-md pt-xs">
          {/* Subjective */}
          <div className="space-y-xs">
            <label className="text-label-md font-bold text-secondary flex items-center gap-xs">
              <span className="w-2 h-2 rounded-full bg-purple-500"></span> Subjective (S)
            </label>
            <textarea
              value={subjective}
              onChange={(e) => {
                setSubjective(e.target.value)
                handleFieldChange(chiefComplaint, e.target.value, objective, assessment, plan)
              }}
              disabled={isReadOnly}
              className="form-input w-full min-h-[120px] p-md text-body-md bg-surface-bright/50 focus:bg-white resize-none"
              placeholder="Patient complaints, symptoms, duration, obstetric history..."
            />
          </div>

          {/* Objective */}
          <div className="space-y-xs">
            <label className="text-label-md font-bold text-secondary flex items-center gap-xs">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span> Objective (O)
            </label>
            <textarea
              value={objective}
              onChange={(e) => {
                setObjective(e.target.value)
                handleFieldChange(chiefComplaint, subjective, e.target.value, assessment, plan)
              }}
              disabled={isReadOnly}
              className="form-input w-full min-h-[120px] p-md text-body-md bg-surface-bright/50 focus:bg-white resize-none"
              placeholder="Vitals, BP, fetal heart rate, physical exam findings..."
            />
          </div>

          {/* Assessment */}
          <div className="space-y-xs">
            <label className="text-label-md font-bold text-secondary flex items-center gap-xs">
              <span className="w-2 h-2 rounded-full bg-yellow-500"></span> Assessment (A)
            </label>
            <textarea
              value={assessment}
              onChange={(e) => {
                setAssessment(e.target.value)
                handleFieldChange(chiefComplaint, subjective, objective, e.target.value, plan)
              }}
              disabled={isReadOnly}
              className="form-input w-full min-h-[120px] p-md text-body-md bg-surface-bright/50 focus:bg-white resize-none"
              placeholder="Clinical impression, diagnosis consideration, maternal risk status..."
            />
          </div>

          {/* Plan */}
          <div className="space-y-xs">
            <label className="text-label-md font-bold text-secondary flex items-center gap-xs">
              <span className="w-2 h-2 rounded-full bg-green-500"></span> Plan (P)
            </label>
            <textarea
              value={plan}
              onChange={(e) => {
                setPlan(e.target.value)
                handleFieldChange(chiefComplaint, subjective, objective, assessment, e.target.value)
              }}
              disabled={isReadOnly}
              className="form-input w-full min-h-[120px] p-md text-body-md bg-surface-bright/50 focus:bg-white resize-none"
              placeholder="Management plan, prescriptions, lab orders ordered, referrals..."
            />
          </div>
        </div>
      </div>

      {/* ── Diagnosis ── */}
      <div className="bg-white dark:bg-surface-container-lowest rounded-xl p-lg shadow-sm border border-outline-variant/30 space-y-md">
        <div className="flex items-center gap-sm text-primary">
          <span className="material-symbols-outlined text-[22px]">stethoscope</span>
          <h3 className="text-title-medium font-bold text-on-surface">Clinical Diagnosis</h3>
        </div>
        <input
          type="text"
          value={diagnosis}
          onChange={(e) => onDiagnosisChange(e.target.value)}
          disabled={isReadOnly}
          className="form-input w-full"
          placeholder="Enter active clinical diagnosis (e.g., Gestational Diabetes, Mild Anemia)..."
        />
      </div>
    </div>
  )
}
