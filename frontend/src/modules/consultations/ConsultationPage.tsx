/**
 * ConsultationPage — Entry point for the Doctor Consultation Workspace.
 * Fetches consultation data and delegates rendering to ConsultationWorkspace.
 */
import { useParams, useNavigate } from 'react-router-dom'
import { useConsultation } from '@/hooks/useConsultations'
import ConsultationWorkspace from './ConsultationWorkspace'

export default function ConsultationPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: consultation, isLoading, isError, refetch } = useConsultation(id || '')

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
        <span className="mt-md text-secondary font-medium">Loading Clinical Workspace...</span>
      </div>
    )
  }

  if (isError || !consultation) {
    return (
      <div className="bg-error-container text-on-error-container p-lg rounded-xl max-w-lg mx-auto text-center mt-xl">
        <span className="material-symbols-outlined text-[48px] mb-xs">error</span>
        <h3 className="font-title-lg font-bold">Failed to Load Consultation</h3>
        <p className="font-body-md mt-xs">
          The requested consultation could not be found or is inaccessible.
        </p>
        <button onClick={() => navigate('/appointments')} className="btn-primary mt-md mx-auto">
          Back to Appointments
        </button>
      </div>
    )
  }

  return <ConsultationWorkspace consultation={consultation} refetch={refetch} />
}
