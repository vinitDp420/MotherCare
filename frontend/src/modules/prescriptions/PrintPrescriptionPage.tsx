import { useParams, useNavigate } from 'react-router-dom'
import { usePrescription } from '@/hooks/usePrescriptions'

export default function PrintPrescriptionPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: rx, isLoading } = usePrescription(id || '')

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-50 text-secondary">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mr-2" />
        <span>Loading printable view...</span>
      </div>
    )
  }

  if (!rx) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-50 text-center p-md">
        <span className="material-symbols-outlined text-[48px] text-error mb-2">error</span>
        <h3 className="font-bold text-title-lg">Prescription Not Found</h3>
        <p className="text-secondary text-body-md mt-1">
          The prescription record could not be retrieved.
        </p>
        <button onClick={() => navigate(-1)} className="btn-primary mt-md bg-neutral-900 text-white hover:bg-neutral-800">
          Go Back
        </button>
      </div>
    )
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="min-h-screen bg-neutral-50 print:bg-white text-neutral-900 font-sans">
      {/* Control Banner - Hidden during print */}
      <div className="print:hidden bg-neutral-900 text-white px-lg py-md flex justify-between items-center border-b shadow-sm sticky top-0 z-40">
        <div className="flex items-center gap-sm">
          <span className="material-symbols-outlined text-primary">print</span>
          <span className="font-semibold text-sm">Print Prescription Preview</span>
        </div>
        <div className="flex gap-sm">
          <button
            onClick={() => navigate(-1)}
            className="px-md py-sm bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-sm font-semibold transition-colors"
          >
            Cancel & Back
          </button>
          <button
            onClick={handlePrint}
            className="px-md py-sm bg-primary hover:bg-primary-hover text-on-primary rounded-lg text-sm font-semibold transition-colors shadow flex items-center gap-xs"
          >
            <span className="material-symbols-outlined text-[16px]">print</span>
            Print Prescription
          </button>
        </div>
      </div>

      {/* Printable Sheet (Simulated A4) */}
      <div className="max-w-3xl mx-auto my-md bg-white p-lg shadow-md border rounded-xl print:border-none print:shadow-none print:my-0 print:p-0">
        
        {/* Hospital Letterhead */}
        <div className="flex justify-between items-start pb-md border-b-2 border-primary">
          <div className="space-y-xs">
            <h1 className="text-2xl font-black tracking-tight text-primary flex items-center gap-xs">
              <span className="material-symbols-outlined text-primary text-[28px]">child_care</span>
              MOTHERCARE HOSPITALS
            </h1>
            <p className="text-xs text-neutral-500 font-medium">
              Shakuntala Maternity and Child Care Center
            </p>
            <p className="text-[10px] text-neutral-400">
              12, Hospital Road, Kolkata, WB • Phone: +91 33 2456-7890
            </p>
          </div>
          <div className="text-right space-y-xs">
            <h2 className="text-lg font-bold text-neutral-700">PRESCRIPTION</h2>
            <p className="text-xs font-semibold text-neutral-500">Rx No: RX-{rx.id.slice(0, 8).toUpperCase()}</p>
            <p className="text-[10px] text-neutral-400">Date: {new Date(rx.issued_at || rx.created_at).toLocaleDateString('en-IN')}</p>
          </div>
        </div>

        {/* Patient / Doctor Metadata grid */}
        <div className="grid grid-cols-2 gap-md py-md text-xs border-b border-neutral-100">
          {/* Patient Details */}
          <div className="bg-neutral-50 rounded-xl p-md space-y-sm">
            <h3 className="font-bold text-neutral-700 uppercase tracking-wider text-[10px] border-b pb-xs border-neutral-200">Patient Details</h3>
            <div className="grid grid-cols-3 gap-xs">
              <span className="font-semibold text-neutral-500">Name:</span>
              <span className="col-span-2 font-bold text-neutral-800">{rx.patient_name}</span>

              <span className="font-semibold text-neutral-500">MRN:</span>
              <span className="col-span-2 font-bold text-neutral-800">{rx.patient_mrn}</span>

              <span className="font-semibold text-neutral-500">Details:</span>
              <span className="col-span-2 font-semibold text-neutral-600">
                {rx.patient_age ? `${rx.patient_age} yrs` : ''} {rx.patient_blood_group ? `• BG: ${rx.patient_blood_group}` : ''}
              </span>
            </div>
          </div>

          {/* Doctor Details */}
          <div className="bg-neutral-50 rounded-xl p-md space-y-sm">
            <h3 className="font-bold text-neutral-700 uppercase tracking-wider text-[10px] border-b pb-xs border-neutral-200">Prescribing Doctor</h3>
            <div className="grid grid-cols-3 gap-xs">
              <span className="font-semibold text-neutral-500">Doctor:</span>
              <span className="col-span-2 font-bold text-neutral-800">{rx.doctor_name || 'Medical Officer'}</span>

              <span className="font-semibold text-neutral-500">Reg No:</span>
              <span className="col-span-2 font-mono font-bold text-neutral-800">{rx.doctor_registration_no || 'MC-8742-W'}</span>

              <span className="font-semibold text-neutral-500">Dept:</span>
              <span className="col-span-2 font-semibold text-neutral-600">Obstetrics & Gynecology</span>
            </div>
          </div>
        </div>

        {/* Prescription Symbol */}
        <div className="py-sm">
          <span className="text-3xl font-serif font-black text-neutral-800 leading-none">Rx</span>
        </div>

        {/* Medicines Table */}
        <div className="py-sm">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-neutral-100 text-neutral-700 font-bold border-b border-neutral-200">
                <th className="p-sm">#</th>
                <th className="p-sm">Medication (Brand / Generic)</th>
                <th className="p-sm">Route</th>
                <th className="p-sm">Dosage</th>
                <th className="p-sm">Frequency</th>
                <th className="p-sm">Duration</th>
                <th className="p-sm text-center">Qty</th>
              </tr>
            </thead>
            <tbody>
              {rx.items && rx.items.length > 0 ? (
                rx.items.map((item: any, idx: number) => (
                  <tr key={item.id} className="border-b border-neutral-100 hover:bg-neutral-50/50">
                    <td className="p-sm font-semibold text-neutral-500">{idx + 1}</td>
                    <td className="p-sm">
                      <p className="font-bold text-neutral-800">{item.medicine.name}</p>
                      {item.medicine.generic_name && (
                        <p className="text-[9px] text-neutral-400 font-medium">Generic: {item.medicine.generic_name}</p>
                      )}
                      {item.instructions && (
                        <p className="text-[10px] text-primary italic mt-xs font-semibold">Inst: {item.instructions}</p>
                      )}
                    </td>
                    <td className="p-sm font-medium text-neutral-600">{item.route || 'Oral'}</td>
                    <td className="p-sm font-semibold text-neutral-800">{item.dosage}</td>
                    <td className="p-sm font-medium text-neutral-600">{item.frequency}</td>
                    <td className="p-sm font-semibold text-neutral-800">{item.duration_days ? `${item.duration_days} Days` : item.duration}</td>
                    <td className="p-sm text-center font-bold text-neutral-700">{item.quantity_to_dispense || '—'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-md text-center text-neutral-400">
                    No medications listed in this prescription.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Prescription Notes */}
        {rx.notes && (
          <div className="mt-md p-md bg-neutral-50 rounded-xl text-xs space-y-xs">
            <h4 className="font-bold text-neutral-700 uppercase tracking-wider text-[9px]">Prescriber Instructions / Notes</h4>
            <p className="text-neutral-600 leading-relaxed">{rx.notes}</p>
          </div>
        )}

        {/* Doctor Signature Block */}
        <div className="mt-xl pt-lg border-t border-neutral-100 flex justify-between items-end">
          <div className="text-[10px] text-neutral-400 space-y-xs">
            <p>• Valid for dispensing at MotherCare Hospital Pharmacy.</p>
            <p>• For safety, do not self-medicate or exceed the prescribed dosage.</p>
            <p>• Bring this Rx sheet with you for your next follow-up checkup.</p>
          </div>
          <div className="text-center w-56 space-y-sm pb-xs">
            <div className="h-12 border-b border-dashed border-neutral-300 flex items-end justify-center">
              {/* Placeholder for stamp/signature */}
            </div>
            <div>
              <p className="font-bold text-neutral-800 text-xs">{rx.doctor_name || 'Dr. Medical Officer'}</p>
              <p className="text-[10px] text-neutral-400">Authorized Clinician Signature</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
