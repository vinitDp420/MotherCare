import { useState } from 'react'
import { useHRSummary, useLeaveRequests, useReviewLeave } from '@/hooks/useHR'
import { useStaffList } from '@/hooks/usePatients'

type Tab = 'directory' | 'attendance' | 'payroll' | 'leave' | 'shifts'

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'directory', label: 'Staff Directory', icon: 'badge' },
  { id: 'attendance', label: 'Attendance', icon: 'calendar_today' },
  { id: 'payroll', label: 'Payroll & Slip', icon: 'payments' },
  { id: 'leave', label: 'Leave Status', icon: 'event_busy' },
  { id: 'shifts', label: 'Shift Assignments', icon: 'schedule' },
]

const LEAVE_STATUS_BADGE: Record<string, string> = {
  pending: 'bg-orange-100 text-orange-600 border border-orange-200',
  approved: 'bg-primary/10 text-primary border border-primary/20',
  rejected: 'bg-error-container text-error border border-error/20',
  cancelled: 'bg-surface-variant text-on-surface-variant border border-outline-variant',
}

export default function HRPage() {
  const [activeTab, setActiveTab] = useState<Tab>('directory')
  const [leaveFilter, setLeaveFilter] = useState('')
  const [staffSearch, setStaffSearch] = useState('')

  const { data: summary, isLoading: summaryLoading } = useHRSummary()
  const { data: leaveData, isLoading: leaveLoading } = useLeaveRequests({ status: leaveFilter || undefined })
  const { data: staffData, isLoading: staffLoading } = useStaffList({ search: staffSearch })
  const reviewLeave = useReviewLeave()

  const leaves = leaveData?.results ?? []
  const staff = staffData?.results ?? []

  const handleReview = (id: string, status: 'approved' | 'rejected') => {
    reviewLeave.mutate({ id, data: { status } })
  }

  return (
    <div className="p-margin-desktop">
      {/* Breadcrumb */}
      <div className="flex items-center gap-xs mb-md text-label-md font-label-md text-on-surface-variant">
        <span>Dashboard</span>
        <span className="material-symbols-outlined text-[16px]">chevron_right</span>
        <span className="text-on-surface font-semibold">HR & Staff</span>
      </div>

      {/* Header */}
      <div className="flex justify-between items-end mb-lg">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface dark:text-surface-bright">Staff Management</h2>
          <p className="font-body-md text-body-md text-on-surface-variant">Manage your clinical and administrative team.</p>
        </div>
        <div className="flex gap-sm">
          <button className="flex items-center gap-xs px-md py-sm bg-surface-container-high rounded-lg font-label-lg hover:bg-surface-container-highest transition-colors">
            <span className="material-symbols-outlined">download</span> Export
          </button>
          <button className="flex items-center gap-xs px-md py-sm bg-primary text-on-primary rounded-lg font-label-lg hover:opacity-90 transition-all shadow-sm">
            <span className="material-symbols-outlined">person_add</span> Add Staff
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter mb-xl">
        {[
          { icon: 'groups', label: 'Total Staff', value: summary?.total_staff ?? '—', badge: 'Active', color: 'text-primary', bg: 'bg-primary-container/20' },
          { icon: 'how_to_reg', label: 'Present Today', value: summary?.present_today ?? '—', badge: `${summary ? Math.round(((summary.present_today) / (summary.total_staff || 1)) * 100) : 0}%`, color: 'text-secondary', bg: 'bg-secondary-container/20' },
          { icon: 'event_busy', label: 'On Leave', value: summary?.on_leave_today ?? '—', badge: 'Today', color: 'text-tertiary', bg: 'bg-tertiary-container/20' },
          { icon: 'pending_actions', label: 'Pending Leaves', value: summary?.pending_leave_requests ?? '—', badge: 'To Review', color: 'text-error', bg: 'bg-error-container/20' },
        ].map((card) => (
          <div key={card.label} className="bg-surface-container-lowest p-md rounded-xl border border-outline-variant shadow-sm dark:bg-on-surface">
            <div className="flex justify-between items-start mb-sm">
              <div className={`p-2 ${card.bg} rounded-lg`}>
                <span className={`material-symbols-outlined ${card.color}`}>{card.icon}</span>
              </div>
              <span className={`${card.color} font-label-md text-label-md bg-surface-container px-2 py-0.5 rounded-full`}>{card.badge}</span>
            </div>
            <p className="text-on-surface-variant font-label-lg">{card.label}</p>
            <p className={`font-headline-lg text-headline-lg mt-xs ${card.color}`}>{summaryLoading ? '...' : card.value}</p>
          </div>
        ))}
      </div>

      {/* Tab Panel */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden dark:bg-on-surface">
        {/* Tab Nav */}
        <div className="flex px-lg pt-lg border-b border-outline-variant overflow-x-auto scrollbar-hide gap-xs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-xs px-md py-sm font-label-lg whitespace-nowrap transition-all rounded-t-lg ${
                activeTab === tab.id
                  ? 'text-primary border-b-2 border-primary font-bold'
                  : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-lg">
          {/* ── STAFF DIRECTORY ── */}
          {activeTab === 'directory' && (
            <div>
              <div className="flex flex-col sm:flex-row gap-md justify-between items-center mb-md">
                <input
                  type="text"
                  value={staffSearch}
                  onChange={(e) => setStaffSearch(e.target.value)}
                  placeholder="Search staff name, designation..."
                  className="w-full sm:w-80 px-md py-sm border border-outline-variant rounded-lg text-body-md bg-surface-container-low"
                />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="text-on-surface-variant border-b border-outline-variant">
                    <tr>
                      <th className="py-sm font-label-lg">Name</th>
                      <th className="py-sm font-label-lg">Department</th>
                      <th className="py-sm font-label-lg">Designation</th>
                      <th className="py-sm font-label-lg">Phone</th>
                      <th className="py-sm font-label-lg">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/30">
                    {staffLoading ? (
                      Array.from({ length: 4 }).map((_, i) => (
                        <tr key={i}><td colSpan={5} className="py-md"><div className="h-4 bg-surface-container-low rounded animate-pulse" /></td></tr>
                      ))
                    ) : staff.length === 0 ? (
                      <tr><td colSpan={5} className="text-center py-xl text-on-surface-variant">No staff found.</td></tr>
                    ) : (
                      staff.map((s: any) => (
                        <tr key={s.id} className="hover:bg-surface-container-low transition-colors group">
                          <td className="py-md">
                            <div className="flex items-center gap-sm">
                              <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                                {s.full_name?.slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-label-lg text-on-surface">{s.full_name}</p>
                                <p className="text-xs text-on-surface-variant">{s.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-md text-body-md">{s.department_name ?? '—'}</td>
                          <td className="py-md text-body-md">{s.designation}</td>
                          <td className="py-md text-body-md">{s.phone}</td>
                          <td className="py-md">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${s.is_active ? 'bg-primary/10 text-primary' : 'bg-error-container text-error'}`}>
                              {s.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── ATTENDANCE ── */}
          {activeTab === 'attendance' && (
            <div className="space-y-md">
              <h3 className="font-title-lg text-on-surface">
                {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })} Attendance
              </h3>
              <div className="grid grid-cols-3 gap-md">
                {[
                  { label: 'Present Today', value: summary?.present_today, color: 'text-primary', bg: 'bg-primary/5' },
                  { label: 'On Leave Today', value: summary?.on_leave_today, color: 'text-error', bg: 'bg-error/5' },
                  { label: 'Total Staff', value: summary?.total_staff, color: 'text-secondary', bg: 'bg-secondary/5' },
                ].map((s) => (
                  <div key={s.label} className={`${s.bg} rounded-xl p-lg text-center border border-outline-variant`}>
                    <p className={`font-display-lg text-[2.5rem] font-bold ${s.color}`}>{summaryLoading ? '—' : s.value}</p>
                    <p className="font-label-lg text-on-surface-variant mt-xs">{s.label}</p>
                  </div>
                ))}
              </div>
              <div className="bg-surface-container-low p-md rounded-lg text-center text-on-surface-variant">
                <span className="material-symbols-outlined text-[48px] block mb-sm opacity-30">calendar_month</span>
                <p className="font-body-md">Detailed attendance calendar requires HR attendance system integration.</p>
              </div>
            </div>
          )}

          {/* ── PAYROLL ── */}
          {activeTab === 'payroll' && (
            <div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="text-on-surface-variant border-b border-outline-variant">
                    <tr>
                      <th className="py-sm font-label-lg">Name</th>
                      <th className="py-sm font-label-lg">Department</th>
                      <th className="py-sm font-label-lg">Month</th>
                      <th className="py-sm font-label-lg text-right">Download Slip</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/30">
                    {staffLoading ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <tr key={i}><td colSpan={4} className="py-md"><div className="h-4 bg-surface-container-low rounded animate-pulse" /></td></tr>
                      ))
                    ) : (
                      staff.slice(0, 8).map((s: any) => (
                        <tr key={s.id} className="hover:bg-surface-container-low transition-colors">
                          <td className="py-md font-label-lg text-on-surface">{s.full_name}</td>
                          <td className="py-md text-body-md text-on-surface-variant">{s.department_name ?? '—'}</td>
                          <td className="py-md text-body-md">{new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</td>
                          <td className="py-md text-right">
                            <button className="flex items-center gap-xs ml-auto px-md py-1 bg-surface-container-high rounded-lg text-label-md font-label-md hover:bg-primary hover:text-white transition-all">
                              <span className="material-symbols-outlined text-[18px]">download</span> PDF
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── LEAVE STATUS ── */}
          {activeTab === 'leave' && (
            <div className="space-y-md">
              <div className="flex justify-between items-center">
                <h3 className="font-title-lg text-on-surface">Leave Requests</h3>
                <select
                  value={leaveFilter}
                  onChange={(e) => setLeaveFilter(e.target.value)}
                  className="px-md py-sm border border-outline-variant rounded-lg text-body-md bg-surface-container-low"
                >
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              {leaveLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-20 bg-surface-container-low rounded-lg animate-pulse" />
                ))
              ) : leaves.length === 0 ? (
                <div className="text-center py-xl text-on-surface-variant">
                  <span className="material-symbols-outlined text-[48px] block opacity-30 mb-sm">event_busy</span>
                  No leave requests found.
                </div>
              ) : (
                leaves.map((leave) => (
                  <div key={leave.id} className="bg-surface-container-low p-md rounded-xl border border-outline-variant">
                    <div className="flex justify-between items-start mb-sm">
                      <div className="flex items-center gap-sm">
                        <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                          {leave.staff_name?.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-label-lg text-on-surface">{leave.staff_name}</p>
                          <p className="text-xs text-on-surface-variant">{leave.leave_type_display} • {leave.duration_days} day{leave.duration_days !== 1 ? 's' : ''}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${LEAVE_STATUS_BADGE[leave.status] ?? ''}`}>
                        {leave.status_display ?? leave.status}
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant mb-sm">
                      {new Date(leave.start_date).toLocaleDateString()} → {new Date(leave.end_date).toLocaleDateString()}
                    </p>
                    {leave.reason && <p className="text-sm text-on-surface-variant italic mb-sm">"{leave.reason}"</p>}
                    {leave.status === 'pending' && (
                      <div className="flex gap-sm mt-md">
                        <button
                          onClick={() => handleReview(leave.id, 'approved')}
                          className="flex-1 py-1.5 bg-primary text-on-primary rounded text-label-md font-semibold"
                        >Approve</button>
                        <button
                          onClick={() => handleReview(leave.id, 'rejected')}
                          className="flex-1 py-1.5 bg-surface-container-highest text-on-surface rounded text-label-md"
                        >Reject</button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* ── SHIFTS ── */}
          {activeTab === 'shifts' && (
            <div className="space-y-md">
              <div className="flex justify-between items-center">
                <h3 className="font-title-lg text-on-surface">
                  Today's Shifts — {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
                </h3>
              </div>
              {[
                { label: 'Morning Shift (07:00–15:00)', key: 'morning', count: summary?.shifts_today?.morning ?? 0, color: 'border-primary', textColor: 'text-primary' },
                { label: 'Afternoon Shift (15:00–23:00)', key: 'afternoon', count: summary?.shifts_today?.afternoon ?? 0, color: 'border-secondary', textColor: 'text-secondary' },
                { label: 'Night Shift (23:00–07:00)', key: 'night', count: summary?.shifts_today?.night ?? 0, color: 'border-tertiary', textColor: 'text-tertiary' },
              ].map((shift) => (
                <div key={shift.key} className={`bg-surface-container-low p-md rounded-xl border-l-4 ${shift.color}`}>
                  <div className="flex justify-between items-center">
                    <h4 className={`font-label-lg ${shift.textColor}`}>{shift.label}</h4>
                    <span className="text-label-md text-on-surface-variant">{shift.count} Staff assigned</span>
                  </div>
                  {shift.count === 0 && (
                    <p className="text-xs text-on-surface-variant mt-xs italic">No assignments recorded for today yet.</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
