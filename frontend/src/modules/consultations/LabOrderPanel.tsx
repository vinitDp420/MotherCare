import { useState } from 'react'
import {
  useLabOrdersList,
  useCreateLabOrder,
  useLabTestsCatalog,
  useUploadLabOrderReport,
  useReviewLabReport,
} from '@/hooks/useLabOrders'
import type { Consultation } from '@/api/endpoints/consultations.api'
import type { TestMaster, LabOrder, LabReport } from '@/api/endpoints/lab.api'

interface LabOrderPanelProps {
  consultation: Consultation
  isReadOnly: boolean
  onSuccess: (message: string) => void
  onError: (message: string) => void
}

export default function LabOrderPanel({ consultation, isReadOnly, onSuccess, onError }: LabOrderPanelProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTests, setSelectedTests] = useState<TestMaster[]>([])
  const [clinicalNote, setClinicalNote] = useState('')

  // Report viewer modal state
  const [activeReport, setActiveReport] = useState<LabReport | null>(null)
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null)
  const [doctorComment, setDoctorComment] = useState('')

  // Fetch new lab orders
  const { data: labOrders, isLoading: ordersLoading, refetch } = useLabOrdersList({
    consultation: consultation.id,
  })

  // Fetch test master catalog
  const { data: catalogResponse } = useLabTestsCatalog({
    search: searchQuery,
  })

  const createOrder = useCreateLabOrder()
  const uploadReport = useUploadLabOrderReport()
  const reviewReport = useReviewLabReport()

  const catalog = catalogResponse?.results || []
  const orders = labOrders?.results || []

  const handleAddTest = (test: TestMaster) => {
    if (selectedTests.some((t) => t.id === test.id)) return
    setSelectedTests([...selectedTests, test])
    setSearchQuery('')
  }

  const handleRemoveTest = (id: string) => {
    setSelectedTests(selectedTests.filter((t) => t.id !== id))
  }

  const handleCreateOrder = () => {
    if (selectedTests.length === 0) {
      onError('Please select at least one test to order.')
      return
    }

    createOrder.mutate(
      {
        consultation: consultation.id,
        patient: consultation.patient,
        doctor: consultation.doctor,
        clinical_note: clinicalNote,
        tests: selectedTests.map((t) => t.id),
      },
      {
        onSuccess: () => {
          onSuccess('Lab order created successfully.')
          setSelectedTests([])
          setClinicalNote('')
          setShowAddForm(false)
          refetch()
        },
        onError: (err: any) => {
          onError(err.detail || 'Failed to create lab order.')
        },
      }
    )
  }

  const handleFileChange = (orderId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    uploadReport.mutate(
      { orderId, file },
      {
        onSuccess: () => {
          onSuccess('Lab report PDF uploaded successfully.')
          refetch()
        },
        onError: (err: any) => {
          onError(err.detail || 'Failed to upload report file.')
        },
      }
    )
  }

  const handleOpenReportViewer = (orderId: string, report: LabReport) => {
    setActiveReport(report)
    setActiveOrderId(orderId)
    setDoctorComment(report.doctor_comment || '')
  }

  const handleSaveReview = () => {
    if (!activeOrderId || !activeReport) return

    reviewReport.mutate(
      {
        orderId: activeOrderId,
        reportId: activeReport.id,
        doctorComment,
      },
      {
        onSuccess: () => {
          onSuccess('Doctor report comments saved successfully.')
          setActiveReport(null)
          setActiveOrderId(null)
          refetch()
        },
        onError: (err: any) => {
          onError(err.detail || 'Failed to save review comments.')
        },
      }
    )
  }

  return (
    <div className="bg-white dark:bg-surface-container-lowest rounded-xl p-lg shadow-sm border border-outline-variant/30 space-y-md">
      {/* Header */}
      <div className="flex justify-between items-center pb-xs border-b border-outline-variant/10">
        <div className="flex items-center gap-sm text-primary">
          <span className="material-symbols-outlined text-[22px]">science</span>
          <h3 className="text-title-medium font-bold text-on-surface">Clinical Lab Orders</h3>
          {orders.length > 0 && (
            <span className="bg-primary-container text-on-primary-container text-xs font-semibold px-2 py-0.5 rounded-full">
              {orders.length}
            </span>
          )}
        </div>
        {!isReadOnly && (
          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-xs text-primary font-label-md text-label-md hover:bg-surface-container-low px-sm py-xs rounded-md transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">{showAddForm ? 'close' : 'add'}</span>
            {showAddForm ? 'Cancel' : 'New Lab Order'}
          </button>
        )}
      </div>

      {/* Add Order Form */}
      {showAddForm && !isReadOnly && (
        <div className="border border-primary/20 rounded-xl p-md bg-surface-bright/50 space-y-md animate-fadeIn">
          {/* Autocomplete Catalog Search */}
          <div className="relative">
            <label className="block text-label-md font-semibold text-on-surface-variant mb-xs">
              Search & Add Lab Tests
            </label>
            <div className="flex items-center gap-xs px-2 py-1.5 bg-white border border-outline-variant rounded-lg focus-within:border-primary transition-colors">
              <span className="material-symbols-outlined text-[18px] text-outline">search</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border-none outline-none focus:ring-0 p-0 text-on-surface text-sm"
                placeholder="Search catalog (e.g. CBC, GTT, Urine Culture, Thyroid)..."
              />
            </div>

            {searchQuery.trim().length > 0 && catalog.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-outline-variant rounded-lg shadow-lg z-30 max-h-48 overflow-y-auto">
                {catalog.map((test) => (
                  <button
                    key={test.id}
                    type="button"
                    onClick={() => handleAddTest(test)}
                    className="w-full text-left px-3 py-2 hover:bg-surface-container-low transition-colors text-sm border-b border-outline-variant/20 last:border-0"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-on-surface">{test.name} ({test.code})</p>
                        <p className="text-[10px] text-secondary">{test.category}</p>
                      </div>
                      <span className="text-xs font-semibold text-primary font-mono">₹{test.price}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Selected Tests Tags */}
          {selectedTests.length > 0 && (
            <div className="space-y-xs">
              <label className="block text-label-md font-semibold text-on-surface-variant">
                Selected Tests ({selectedTests.length})
              </label>
              <div className="flex flex-wrap gap-xs">
                {selectedTests.map((t) => (
                  <span
                    key={t.id}
                    className="inline-flex items-center gap-xs bg-primary-container text-on-primary-container text-xs px-sm py-1 rounded-full border border-primary-fixed-dim"
                  >
                    {t.name}
                    <button type="button" onClick={() => handleRemoveTest(t.id)} className="hover:text-error transition-colors">
                      <span className="material-symbols-outlined text-[14px]">close</span>
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Clinical Indication Notes */}
          <div className="space-y-xs">
            <label className="block text-label-md font-semibold text-on-surface-variant">
              Clinical Indication Notes
            </label>
            <textarea
              value={clinicalNote}
              onChange={(e) => setClinicalNote(e.target.value)}
              className="form-input text-sm w-full min-h-[60px] p-sm resize-none"
              placeholder="Clinical reason, symptoms, or indications for this order..."
            />
          </div>

          {/* Submit */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleCreateOrder}
              disabled={createOrder.isPending}
              className="px-lg py-sm bg-primary text-on-primary rounded-lg font-label-lg hover:bg-primary-hover transition-colors shadow-sm flex items-center gap-xs"
            >
              <span className="material-symbols-outlined text-[18px]">done</span>
              {createOrder.isPending ? 'Ordering...' : 'Submit Lab Order'}
            </button>
          </div>
        </div>
      )}

      {/* Orders List */}
      {ordersLoading ? (
        <div className="flex items-center justify-center py-lg text-secondary text-sm">
          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-primary mr-sm" />
          Loading orders...
        </div>
      ) : orders.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-outline-variant">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low text-on-surface-variant text-label-md font-medium border-b border-outline-variant">
                <th className="p-sm">Order ID & Date</th>
                <th className="p-sm">Tests ordered</th>
                <th className="p-sm w-24">Status</th>
                <th className="p-sm">Reports / Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-outline-variant/50 hover:bg-surface-bright/50 transition-colors">
                  <td className="p-sm">
                    <p className="font-semibold text-on-surface text-sm">Order #{order.id.slice(0, 8)}</p>
                    <p className="text-[10px] text-secondary">
                      {new Date(order.ordered_at).toLocaleString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </td>
                  <td className="p-sm">
                    <div className="flex flex-wrap gap-xs">
                      {order.items.map((item) => (
                        <span
                          key={item.id}
                          className={`inline-flex px-2 py-0.5 rounded text-[11px] font-medium ${
                            item.is_abnormal
                              ? 'bg-error-container text-error border border-error/20'
                              : 'bg-surface-container text-on-surface-variant'
                          }`}
                        >
                          {item.test_code}
                          {item.result_value && `: ${item.result_value}`}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-sm">
                    <span
                      className={`inline-flex items-center gap-xs px-2 py-0.5 rounded-full text-xs font-semibold ${
                        order.status === 'completed'
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                          : order.status === 'in_progress'
                          ? 'bg-blue-50 text-blue-600 border border-blue-100'
                          : 'bg-amber-50 text-amber-600 border border-amber-100'
                      }`}
                    >
                      {order.status_display}
                    </span>
                  </td>
                  <td className="p-sm">
                    <div className="flex flex-col gap-xs">
                      {order.reports.map((rep, idx) => (
                        <button
                          key={rep.id}
                          type="button"
                          onClick={() => handleOpenReportViewer(order.id, rep)}
                          className="text-xs font-semibold text-primary hover:underline text-left flex items-center gap-xs"
                        >
                          <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
                          Report #{idx + 1} {rep.reviewed_at ? '(Reviewed)' : '(Pending Review)'}
                        </button>
                      ))}

                      {/* Diagnostic testing helper: Allow uploading report file */}
                      {!isReadOnly && (
                        <div className="flex items-center gap-sm mt-1">
                          <label className="text-xs font-bold text-primary hover:underline cursor-pointer flex items-center gap-xs">
                            <span className="material-symbols-outlined text-[16px]">upload</span>
                            Upload PDF Report
                            <input
                              type="file"
                              accept="application/pdf"
                              onChange={(e) => handleFileChange(order.id, e)}
                              className="hidden"
                            />
                          </label>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-md text-secondary text-sm">
          <span className="material-symbols-outlined text-[32px] text-neutral-300 block mb-xs">biotech</span>
          No laboratory orders placed yet for this consultation.
        </div>
      )}

      {/* PDF Inline Viewer & Annotation Modal */}
      {activeReport && (
        <div className="fixed inset-0 bg-neutral-900/60 flex items-center justify-center z-50 p-lg animate-fadeIn">
          <div className="bg-white dark:bg-surface-container-lowest rounded-xl max-w-4xl w-full h-[90vh] flex flex-col shadow-2xl border border-outline-variant/30 overflow-hidden">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-md border-b border-outline-variant/10 bg-surface-container-low">
              <h3 className="font-bold text-title-medium text-on-surface flex items-center gap-xs">
                <span className="material-symbols-outlined text-primary">picture_as_pdf</span>
                Lab Report PDF Viewer
              </h3>
              <button
                type="button"
                onClick={() => {
                  setActiveReport(null)
                  setActiveOrderId(null)
                }}
                className="text-outline hover:text-on-surface transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
              {/* PDF Document frame */}
              <div className="flex-1 p-md bg-neutral-100 flex items-center justify-center overflow-auto">
                <iframe
                  src={activeReport.report_file}
                  className="w-full h-full min-h-[450px] border border-outline-variant rounded-lg shadow-sm bg-white"
                  title="Lab Report Document"
                />
              </div>

              {/* Comments side-panel */}
              <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-outline-variant/10 p-md flex flex-col justify-between bg-surface-bright/30">
                <div className="space-y-md flex-1 overflow-y-auto pr-xs">
                  <div>
                    <h4 className="text-label-md font-bold text-secondary">Upload Metadata</h4>
                    <p className="text-body-sm text-on-surface-variant mt-xs">
                      Uploaded by: <span className="font-semibold">{activeReport.uploaded_by_name}</span>
                    </p>
                    <p className="text-body-sm text-on-surface-variant">
                      Uploaded at: <span className="font-semibold">{new Date(activeReport.uploaded_at).toLocaleString('en-IN')}</span>
                    </p>
                  </div>

                  <hr className="border-outline-variant/10" />

                  <div className="space-y-xs">
                    <label className="block text-label-md font-bold text-secondary">
                      Clinical Annotation & Comments
                    </label>
                    <textarea
                      value={doctorComment}
                      onChange={(e) => setDoctorComment(e.target.value)}
                      disabled={isReadOnly}
                      className="form-input text-sm w-full min-h-[160px] p-sm resize-none"
                      placeholder="Write feedback remarks, flags, or action notes regarding this report..."
                    />
                  </div>
                </div>

                {!isReadOnly && (
                  <div className="pt-md border-t border-outline-variant/10 flex justify-end gap-sm">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveReport(null)
                        setActiveOrderId(null)
                      }}
                      className="btn-secondary text-sm font-semibold"
                    >
                      Close
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveReview}
                      disabled={reviewReport.isPending}
                      className="btn-primary text-sm font-semibold bg-neutral-900 text-white hover:bg-neutral-800"
                    >
                      {reviewReport.isPending ? 'Saving...' : 'Save & Close'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
