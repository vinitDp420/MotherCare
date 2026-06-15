/**
 * LaboratoryPage — Full Lab Management Module
 * Tabs: Dashboard | Pending Tests | Completed Tests | Patient History
 * Role: Lab Tech (isLabTech) gets focused lab-only view
 */
import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

// ─── Types ────────────────────────────────────────────────────────────────────
type LabStatus = 'pending' | 'in_progress' | 'completed' | 'critical' | 'cancelled'
type TestCategory = 'Hematology' | 'Biochemistry' | 'Radiology' | 'Microbiology' | 'Serology' | 'Urinalysis' | 'Hormones'
type Priority = 'STAT' | 'Urgent' | 'Routine'

interface LabOrder {
  id: string
  patientName: string
  patientId: string
  age: number
  ward: string
  testName: string
  category: TestCategory
  status: LabStatus
  priority: Priority
  requestedBy: string
  requestedAt: string
  collectedAt?: string
  completedAt?: string
  result?: string
  referenceRange?: string
  isCritical?: boolean
  notes?: string
}

// ─── Mock Data ────────────────────────────────────────────────────────────────
const ALL_ORDERS: LabOrder[] = [
  {
    id: 'LB-5001', patientName: 'Anya Sharma', patientId: 'MC-4921', age: 28, ward: 'Maternity - B2',
    testName: 'Complete Blood Count', category: 'Hematology', status: 'critical', priority: 'STAT',
    requestedBy: 'Dr. Patel', requestedAt: '08:15 AM', collectedAt: '08:30 AM',
    result: 'Hb: 6.2 g/dL', referenceRange: '12-16 g/dL', isCritical: true,
    notes: 'Severe anemia. Doctor notified immediately.'
  },
  {
    id: 'LB-5002', patientName: 'Priya Rajan', patientId: 'MC-4877', age: 32, ward: 'OPD - Antenatal',
    testName: 'Obstetric Ultrasound', category: 'Radiology', status: 'in_progress', priority: 'Urgent',
    requestedBy: 'Dr. Singh', requestedAt: '09:00 AM', collectedAt: '09:15 AM',
    notes: 'Fetal growth monitoring at 28 weeks.'
  },
  {
    id: 'LB-5003', patientName: 'Meera Kapoor', patientId: 'MC-5012', age: 25, ward: 'Maternity - A1',
    testName: 'Glucose Tolerance Test (75g)', category: 'Biochemistry', status: 'pending', priority: 'Routine',
    requestedBy: 'Dr. Sharma', requestedAt: 'Yesterday 4:30 PM',
  },
  {
    id: 'LB-5004', patientName: 'Sunita Rao', patientId: 'MC-4803', age: 30, ward: 'Labor Room',
    testName: 'Urine Culture & Sensitivity', category: 'Microbiology', status: 'pending', priority: 'Urgent',
    requestedBy: 'Dr. Mehta', requestedAt: '07:45 AM',
  },
  {
    id: 'LB-5005', patientName: 'Linda Chen', patientId: 'MC-5099', age: 27, ward: 'Post-natal - C3',
    testName: 'Urinalysis (Routine)', category: 'Urinalysis', status: 'critical', priority: 'STAT',
    requestedBy: 'Dr. Patel', requestedAt: '45m ago', collectedAt: '55m ago',
    result: 'Protein: 4+, RBC: Many', referenceRange: 'Protein: Negative', isCritical: true,
    notes: 'Pre-eclampsia screen. Alert sent to Dr. Patel.'
  },
  {
    id: 'LB-5006', patientName: 'Sarah Jenkins', patientId: 'MC-4755', age: 34, ward: 'OPD - Endocrine',
    testName: 'Thyroid Panel (TSH, T3, T4)', category: 'Hormones', status: 'completed', priority: 'Routine',
    requestedBy: 'Dr. Joshi', requestedAt: 'Today 06:00 AM', completedAt: 'Today 08:45 AM',
    result: 'TSH: 2.4 mIU/L, T3: Normal, T4: Normal', referenceRange: 'TSH: 0.5–5.0 mIU/L', isCritical: false,
  },
  {
    id: 'LB-5007', patientName: 'Kavya Nair', patientId: 'MC-4901', age: 29, ward: 'Maternity - A3',
    testName: 'Blood Group & Rh Factor', category: 'Serology', status: 'completed', priority: 'Routine',
    requestedBy: 'Dr. Singh', requestedAt: 'Today 07:00 AM', completedAt: 'Today 09:20 AM',
    result: 'Blood Group: O+, Rh: Positive', referenceRange: 'N/A', isCritical: false,
  },
  {
    id: 'LB-5008', patientName: 'Anita Bose', patientId: 'MC-5034', age: 26, ward: 'OPD - Antenatal',
    testName: 'Serum Iron & TIBC', category: 'Biochemistry', status: 'pending', priority: 'Routine',
    requestedBy: 'Dr. Sharma', requestedAt: 'Today 09:30 AM',
  },
  {
    id: 'LB-5009', patientName: 'Deepa Pillai', patientId: 'MC-4988', age: 31, ward: 'Maternity - B4',
    testName: 'HbA1c', category: 'Biochemistry', status: 'completed', priority: 'Urgent',
    requestedBy: 'Dr. Mehta', requestedAt: 'Today 05:30 AM', completedAt: 'Today 08:00 AM',
    result: 'HbA1c: 7.2%', referenceRange: '< 6.5%', isCritical: false,
    notes: 'Gestational diabetes monitoring.'
  },
  {
    id: 'LB-5010', patientName: 'Rekha Verma', patientId: 'MC-5120', age: 33, ward: 'Labor Room',
    testName: 'Coagulation Profile (PT/INR)', category: 'Hematology', status: 'in_progress', priority: 'STAT',
    requestedBy: 'Dr. Patel', requestedAt: '10:00 AM', collectedAt: '10:05 AM',
    notes: 'Pre-operative check for emergency C-section.'
  },
]

// ─── Helper components ────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: LabStatus }) {
  const cfg: Record<LabStatus, { label: string; cls: string; icon: string }> = {
    critical:    { label: 'Critical',     cls: 'bg-error text-white',                              icon: 'warning' },
    pending:     { label: 'Pending',      cls: 'bg-surface-container-high text-on-surface',        icon: 'schedule' },
    in_progress: { label: 'In Progress',  cls: 'bg-secondary-container text-on-secondary-container', icon: 'sync' },
    completed:   { label: 'Completed',    cls: 'bg-primary-container text-on-primary-container',   icon: 'check_circle' },
    cancelled:   { label: 'Cancelled',    cls: 'bg-surface-dim text-on-surface-variant',           icon: 'cancel' },
  }
  const { label, cls, icon } = cfg[status]
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${cls}`}>
      <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>{icon}</span>
      {label}
    </span>
  )
}

function PriorityBadge({ priority }: { priority: Priority }) {
  const cfg: Record<Priority, string> = {
    STAT:    'bg-error-container text-error font-bold',
    Urgent:  'bg-tertiary-container text-on-tertiary-container font-semibold',
    Routine: 'bg-surface-container text-on-surface-variant',
  }
  return (
    <span className={`inline-flex px-2 py-0.5 rounded text-xs ${cfg[priority]}`}>
      {priority}
    </span>
  )
}

// ─── TAB: Dashboard ───────────────────────────────────────────────────────────
function DashboardTab({ orders }: { orders: LabOrder[] }) {
  const critical = orders.filter(o => o.status === 'critical').length
  const pending = orders.filter(o => o.status === 'pending').length
  const inProgress = orders.filter(o => o.status === 'in_progress').length
  const completed = orders.filter(o => o.status === 'completed').length

  const statCards = [
    { label: 'Critical Results', value: critical, icon: 'priority_high', iconBg: 'bg-error-container text-error', badge: 'CRITICAL', badgeCls: 'text-error font-bold' },
    { label: 'Pending Tests',    value: pending,   icon: 'pending',       iconBg: 'bg-surface-container-high text-on-surface-variant', badge: 'in queue', badgeCls: 'text-on-surface-variant' },
    { label: 'In Progress',      value: inProgress,icon: 'sync',          iconBg: 'bg-secondary-container text-on-secondary-container', badge: 'processing', badgeCls: 'text-on-surface-variant' },
    { label: 'Completed Today',  value: completed, icon: 'check_circle',  iconBg: 'bg-primary-container text-on-primary-container', badge: 'finalized', badgeCls: 'text-on-surface-variant' },
  ]

  return (
    <div className="flex flex-col gap-lg">
      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-md">
        {statCards.map((s) => (
          <div key={s.label} className="glass-card rounded-xl p-lg shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="absolute -right-3 -top-3 w-16 h-16 bg-surface-container-high rounded-full opacity-30 group-hover:scale-125 transition-transform" />
            <div className="relative z-10 flex justify-between items-start mb-md">
              <div className={`p-sm rounded-lg ${s.iconBg}`}>
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
              </div>
              <span className={`font-label-sm text-label-sm ${s.badgeCls} uppercase tracking-wide`}>{s.badge}</span>
            </div>
            <h3 className="font-title-md text-title-md text-on-surface dark:text-inverse-on-surface mb-xs relative z-10">{s.label}</h3>
            <div className="flex items-baseline gap-sm relative z-10">
              <span className={`font-display-md text-display-md ${s.label === 'Critical Results' && s.value > 0 ? 'text-error' : 'text-on-surface dark:text-inverse-on-surface'}`}>{s.value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
        {/* Worklist Today */}
        <div className="lg:col-span-2 glass-card rounded-xl shadow-sm overflow-hidden">
          <div className="p-md border-b border-surface-dim dark:border-outline flex justify-between items-center bg-surface-container-lowest dark:bg-on-surface">
            <div className="flex items-center gap-sm">
              <h3 className="font-title-lg text-title-lg text-on-surface dark:text-inverse-on-surface">Today's Worklist</h3>
              <span className="bg-primary-container text-on-primary-container font-label-sm text-label-sm px-sm py-xs rounded-full">Live</span>
            </div>
            <button className="p-xs text-on-surface-variant hover:bg-surface-container-low rounded-lg transition-colors">
              <span className="material-symbols-outlined text-[20px]">refresh</span>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-surface-container-lowest dark:bg-on-surface">
                <tr>
                  {['Patient', 'Test', 'Category', 'Priority', 'Status', 'Requested'].map(h => (
                    <th key={h} className="p-sm font-label-md text-label-md text-on-surface-variant border-b border-surface-dim dark:border-outline font-semibold whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled').map((o, i) => (
                  <tr key={o.id} className={`hover:bg-surface-container-low transition-colors ${o.isCritical ? 'bg-error-container/10' : i % 2 === 0 ? '' : 'bg-surface-container/30'}`}>
                    <td className="p-sm border-b border-surface-dim dark:border-outline">
                      <div className="flex items-center gap-sm">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${o.isCritical ? 'bg-error text-white' : 'bg-primary-container text-on-primary-container'}`}>
                          {o.patientName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                          <p className="font-body-sm text-body-sm text-on-surface dark:text-inverse-on-surface font-semibold whitespace-nowrap">{o.patientName}</p>
                          <p className={`font-label-sm text-label-sm ${o.isCritical ? 'text-error' : 'text-on-surface-variant dark:text-secondary-fixed-dim'}`}>{o.patientId} · {o.ward}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-sm border-b border-surface-dim dark:border-outline font-body-sm text-body-sm text-on-surface dark:text-inverse-on-surface whitespace-nowrap">{o.testName}</td>
                    <td className="p-sm border-b border-surface-dim dark:border-outline font-label-sm text-label-sm text-on-surface-variant dark:text-secondary-fixed-dim whitespace-nowrap">{o.category}</td>
                    <td className="p-sm border-b border-surface-dim dark:border-outline"><PriorityBadge priority={o.priority} /></td>
                    <td className="p-sm border-b border-surface-dim dark:border-outline"><StatusBadge status={o.status} /></td>
                    <td className="p-sm border-b border-surface-dim dark:border-outline font-label-sm text-label-sm text-on-surface-variant dark:text-secondary-fixed-dim whitespace-nowrap">{o.requestedAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Category Breakdown + Alerts */}
        <div className="flex flex-col gap-md">
          {/* Category Breakdown */}
          <div className="glass-card rounded-xl shadow-sm overflow-hidden">
            <div className="p-md border-b border-surface-dim dark:border-outline">
              <h3 className="font-title-md text-title-md text-on-surface dark:text-inverse-on-surface">By Category</h3>
            </div>
            <div className="p-md flex flex-col gap-sm">
              {Object.entries(
                orders.reduce((acc, o) => { acc[o.category] = (acc[o.category] || 0) + 1; return acc }, {} as Record<string, number>)
              ).sort((a, b) => b[1] - a[1]).map(([cat, count]) => (
                <div key={cat} className="flex items-center justify-between">
                  <span className="font-body-sm text-body-sm text-on-surface dark:text-inverse-on-surface">{cat}</span>
                  <div className="flex items-center gap-sm">
                    <div className="w-24 bg-surface-container-high rounded-full h-1.5 overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${(count / orders.length) * 100}%` }} />
                    </div>
                    <span className="font-label-md text-label-md text-on-surface-variant w-4 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Critical Alerts Panel */}
          <div className="glass-card rounded-xl shadow-sm overflow-hidden">
            <div className="p-md border-b border-error-container flex items-center gap-sm">
              <span className="material-symbols-outlined text-error" style={{ fontVariationSettings: "'FILL' 1" }}>notification_important</span>
              <h3 className="font-title-md text-title-md text-error">Critical Alerts</h3>
            </div>
            <div className="p-md flex flex-col gap-sm">
              {orders.filter(o => o.isCritical).map(o => (
                <div key={o.id} className="p-sm rounded-lg bg-error-container/20 border border-error-container">
                  <div className="flex justify-between items-start mb-xs">
                    <p className="font-body-sm text-body-sm text-on-surface dark:text-inverse-on-surface font-semibold">{o.patientName}</p>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">{o.requestedAt}</span>
                  </div>
                  <p className="font-label-sm text-label-sm text-error font-medium">{o.testName}</p>
                  {o.result && <p className="font-label-sm text-label-sm text-on-surface-variant mt-xs">{o.result}</p>}
                  {o.notes && (
                    <div className="mt-xs flex items-center gap-xs">
                      <span className="material-symbols-outlined text-error text-[13px]">check_circle</span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">{o.notes}</span>
                    </div>
                  )}
                </div>
              ))}
              {orders.filter(o => o.isCritical).length === 0 && (
                <p className="font-body-sm text-body-sm text-on-surface-variant text-center py-md">No critical alerts</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── TAB: Pending Tests ───────────────────────────────────────────────────────
function PendingTab({ orders }: { orders: LabOrder[] }) {
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<LabOrder | null>(null)

  const pending = orders.filter(o => o.status === 'pending' || o.status === 'in_progress')
  const filtered = pending.filter(o => {
    const matchesSearch = !search || o.patientName.toLowerCase().includes(search.toLowerCase()) || o.patientId.toLowerCase().includes(search.toLowerCase())
    const matchesCat = !categoryFilter || o.category === categoryFilter
    const matchesPriority = !priorityFilter || o.priority === priorityFilter
    return matchesSearch && matchesCat && matchesPriority
  })

  return (
    <div className="flex flex-col gap-md">
      {/* Filters */}
      <div className="glass-card p-md rounded-xl flex flex-wrap gap-md items-center justify-between shadow-sm">
        <div className="flex flex-wrap gap-sm items-center">
          <div className="relative min-w-[220px]">
            <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
            <input
              className="w-full pl-xl pr-sm py-xs rounded-lg border border-outline-variant bg-surface-container-lowest dark:bg-surface-variant text-body-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Search patient name or ID…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            className="bg-surface-container-lowest dark:bg-surface-variant border border-outline-variant rounded-lg text-label-md py-xs px-sm focus:outline-none focus:ring-2 focus:ring-primary"
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
          >
            <option value="">All Categories</option>
            {['Hematology', 'Biochemistry', 'Radiology', 'Microbiology', 'Serology', 'Urinalysis', 'Hormones'].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            className="bg-surface-container-lowest dark:bg-surface-variant border border-outline-variant rounded-lg text-label-md py-xs px-sm focus:outline-none focus:ring-2 focus:ring-primary"
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value)}
          >
            <option value="">All Priorities</option>
            <option value="STAT">STAT</option>
            <option value="Urgent">Urgent</option>
            <option value="Routine">Routine</option>
          </select>
        </div>
        <div className="flex items-center gap-sm">
          <span className="font-label-md text-label-md text-on-surface-variant">{filtered.length} orders</span>
          <button className="bg-primary text-on-primary font-label-md py-xs px-md rounded-lg hover:opacity-90 transition-opacity flex items-center gap-xs shadow-sm">
            <span className="material-symbols-outlined text-[16px]">add</span>
            New Lab Order
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
        {/* Order List */}
        <div className={`${selectedOrder ? 'lg:col-span-2' : 'lg:col-span-3'} glass-card rounded-xl shadow-sm overflow-hidden flex flex-col`}>
          <div className="p-md border-b border-surface-dim dark:border-outline flex items-center gap-sm bg-surface-container-lowest dark:bg-on-surface">
            <h3 className="font-title-lg text-title-lg text-on-surface dark:text-inverse-on-surface">Pending & In-Progress</h3>
            <span className="bg-primary-container text-on-primary-container font-label-sm text-label-sm px-sm py-xs rounded-full">Real-time Queue</span>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-surface-container-lowest dark:bg-on-surface z-10">
                <tr>
                  {['ID', 'Patient', 'Test', 'Ward', 'Priority', 'Status', 'Requested By', 'Actions'].map(h => (
                    <th key={h} className="p-sm font-label-md text-label-md text-on-surface-variant border-b border-surface-dim dark:border-outline font-semibold whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((o, i) => (
                  <tr
                    key={o.id}
                    className={`hover:bg-surface-container-low transition-colors cursor-pointer ${selectedOrder?.id === o.id ? 'bg-primary-container/30' : o.isCritical ? 'bg-error-container/10' : i % 2 === 0 ? '' : 'bg-surface-container/30'}`}
                    onClick={() => setSelectedOrder(o)}
                  >
                    <td className="p-sm border-b border-surface-dim dark:border-outline">
                      <span className="font-label-sm text-label-sm text-primary font-mono">{o.id}</span>
                    </td>
                    <td className="p-sm border-b border-surface-dim dark:border-outline">
                      <div className="flex items-center gap-sm">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${o.isCritical ? 'bg-error text-white' : 'bg-primary-container text-on-primary-container'}`}>
                          {o.patientName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                          <p className="font-body-sm text-body-sm text-on-surface dark:text-inverse-on-surface font-semibold whitespace-nowrap">{o.patientName}</p>
                          <p className="font-label-sm text-label-sm text-on-surface-variant">{o.patientId} · {o.age}y</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-sm border-b border-surface-dim dark:border-outline font-body-sm text-body-sm text-on-surface dark:text-inverse-on-surface whitespace-nowrap">{o.testName}</td>
                    <td className="p-sm border-b border-surface-dim dark:border-outline font-label-sm text-label-sm text-on-surface-variant whitespace-nowrap">{o.ward}</td>
                    <td className="p-sm border-b border-surface-dim dark:border-outline"><PriorityBadge priority={o.priority} /></td>
                    <td className="p-sm border-b border-surface-dim dark:border-outline"><StatusBadge status={o.status} /></td>
                    <td className="p-sm border-b border-surface-dim dark:border-outline font-label-sm text-label-sm text-on-surface-variant whitespace-nowrap">{o.requestedBy}</td>
                    <td className="p-sm border-b border-surface-dim dark:border-outline">
                      <div className="flex gap-xs">
                        {o.status === 'pending' && (
                          <button
                            className="bg-secondary-container text-on-secondary-container hover:opacity-80 px-sm py-xs rounded font-label-sm transition-colors whitespace-nowrap"
                            onClick={e => { e.stopPropagation() }}
                          >
                            Start
                          </button>
                        )}
                        {o.status === 'in_progress' && (
                          <button
                            className="bg-primary text-on-primary hover:opacity-90 px-sm py-xs rounded font-label-sm transition-colors shadow-sm whitespace-nowrap"
                            onClick={e => { e.stopPropagation() }}
                          >
                            Enter Result
                          </button>
                        )}
                        {o.isCritical && (
                          <button
                            className="bg-error text-white hover:opacity-90 px-sm py-xs rounded font-label-sm shadow-sm whitespace-nowrap"
                            onClick={e => { e.stopPropagation() }}
                          >
                            Review
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-xl text-center font-body-md text-body-md text-on-surface-variant">
                      <span className="material-symbols-outlined text-[40px] block mx-auto mb-sm opacity-30">science</span>
                      No orders match your filters
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Order Detail Panel */}
        {selectedOrder && (
          <div className="glass-card rounded-xl shadow-sm overflow-hidden flex flex-col">
            <div className="p-md border-b border-surface-dim dark:border-outline flex justify-between items-center bg-surface-container-lowest dark:bg-on-surface">
              <h3 className="font-title-md text-title-md text-on-surface dark:text-inverse-on-surface">Order Detail</h3>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-xs text-on-surface-variant hover:bg-surface-container-low rounded-lg transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <div className="p-md flex flex-col gap-md flex-1 overflow-auto">
              {/* Patient Info */}
              <div className="flex items-center gap-md">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm ${selectedOrder.isCritical ? 'bg-error text-white' : 'bg-primary-container text-on-primary-container'}`}>
                  {selectedOrder.patientName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <p className="font-title-md text-title-md text-on-surface dark:text-inverse-on-surface font-semibold">{selectedOrder.patientName}</p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">{selectedOrder.patientId} · Age: {selectedOrder.age}y · {selectedOrder.ward}</p>
                </div>
              </div>

              {selectedOrder.isCritical && (
                <div className="p-sm rounded-lg bg-error-container flex items-center gap-sm">
                  <span className="material-symbols-outlined text-error" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
                  <span className="font-label-md text-label-md text-error font-semibold">Critical Result — Physician Notified</span>
                </div>
              )}

              <div className="flex flex-col gap-sm">
                {[
                  { label: 'Order ID', value: selectedOrder.id },
                  { label: 'Test Name', value: selectedOrder.testName },
                  { label: 'Category', value: selectedOrder.category },
                  { label: 'Priority', value: <PriorityBadge priority={selectedOrder.priority} /> },
                  { label: 'Status', value: <StatusBadge status={selectedOrder.status} /> },
                  { label: 'Ordered By', value: selectedOrder.requestedBy },
                  { label: 'Ordered At', value: selectedOrder.requestedAt },
                  ...(selectedOrder.collectedAt ? [{ label: 'Collected At', value: selectedOrder.collectedAt }] : []),
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-center py-xs border-b border-surface-dim dark:border-outline">
                    <span className="font-label-md text-label-md text-on-surface-variant">{label}</span>
                    <span className="font-body-sm text-body-sm text-on-surface dark:text-inverse-on-surface font-medium">{value}</span>
                  </div>
                ))}
              </div>

              {selectedOrder.result && (
                <div className="p-sm rounded-lg bg-primary-container/30 border border-primary-fixed-dim">
                  <p className="font-label-md text-label-md text-on-surface-variant mb-xs">Result</p>
                  <p className="font-body-md text-body-md text-on-surface dark:text-inverse-on-surface font-semibold">{selectedOrder.result}</p>
                  {selectedOrder.referenceRange && (
                    <p className="font-label-sm text-label-sm text-on-surface-variant mt-xs">Ref: {selectedOrder.referenceRange}</p>
                  )}
                </div>
              )}

              {selectedOrder.notes && (
                <div className="p-sm rounded-lg bg-surface-container-low border border-outline-variant">
                  <p className="font-label-md text-label-md text-on-surface-variant mb-xs">Notes</p>
                  <p className="font-body-sm text-body-sm text-on-surface dark:text-inverse-on-surface">{selectedOrder.notes}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col gap-sm mt-auto">
                {selectedOrder.status === 'pending' && (
                  <button className="w-full bg-secondary-container text-on-secondary-container py-sm rounded-lg font-label-lg font-semibold hover:opacity-80 transition-opacity flex items-center justify-center gap-xs">
                    <span className="material-symbols-outlined text-[18px]">play_arrow</span>
                    Mark as In Progress
                  </button>
                )}
                {selectedOrder.status === 'in_progress' && (
                  <button className="w-full bg-primary text-on-primary py-sm rounded-lg font-label-lg font-semibold hover:opacity-90 transition-opacity shadow-sm flex items-center justify-center gap-xs">
                    <span className="material-symbols-outlined text-[18px]">upload_file</span>
                    Enter & Submit Result
                  </button>
                )}
                <button className="w-full bg-surface-container text-on-surface py-sm rounded-lg font-label-md hover:bg-surface-container-high transition-colors flex items-center justify-center gap-xs">
                  <span className="material-symbols-outlined text-[18px]">print</span>
                  Print Requisition
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── TAB: Completed Tests ─────────────────────────────────────────────────────
function CompletedTab({ orders }: { orders: LabOrder[] }) {
  const [search, setSearch] = useState('')
  const completed = orders.filter(o => o.status === 'completed')
  const filtered = completed.filter(o =>
    !search || o.patientName.toLowerCase().includes(search.toLowerCase()) || o.patientId.toLowerCase().includes(search.toLowerCase()) || o.testName.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col gap-md">
      {/* Toolbar */}
      <div className="glass-card p-md rounded-xl flex flex-wrap gap-md items-center justify-between shadow-sm">
        <div className="flex flex-wrap gap-sm items-center">
          <div className="relative min-w-[220px]">
            <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
            <input
              className="w-full pl-xl pr-sm py-xs rounded-lg border border-outline-variant bg-surface-container-lowest dark:bg-surface-variant text-body-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Search completed tests…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="flex items-center gap-sm">
          <span className="font-label-md text-label-md text-on-surface-variant">{filtered.length} reports</span>
          <button className="bg-secondary-container text-primary font-label-md py-xs px-md rounded-lg hover:opacity-80 transition-opacity flex items-center gap-xs">
            <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
            Export All
          </button>
        </div>
      </div>

      {/* Completed List */}
      <div className="glass-card rounded-xl shadow-sm overflow-hidden">
        <div className="p-md border-b border-surface-dim dark:border-outline bg-surface-container-lowest dark:bg-on-surface">
          <h3 className="font-title-lg text-title-lg text-on-surface dark:text-inverse-on-surface">Completed Reports</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-surface-container-lowest dark:bg-on-surface z-10">
              <tr>
                {['ID', 'Patient', 'Test', 'Category', 'Result', 'Ref. Range', 'Completed At', 'Actions'].map(h => (
                  <th key={h} className="p-sm font-label-md text-label-md text-on-surface-variant border-b border-surface-dim dark:border-outline font-semibold whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((o, i) => (
                <tr key={o.id} className={`hover:bg-surface-container-low transition-colors ${i % 2 === 0 ? '' : 'bg-surface-container/30'}`}>
                  <td className="p-sm border-b border-surface-dim dark:border-outline">
                    <span className="font-label-sm text-label-sm text-primary font-mono">{o.id}</span>
                  </td>
                  <td className="p-sm border-b border-surface-dim dark:border-outline">
                    <div className="flex items-center gap-sm">
                      <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-xs shrink-0">
                        {o.patientName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-body-sm text-body-sm text-on-surface dark:text-inverse-on-surface font-semibold whitespace-nowrap">{o.patientName}</p>
                        <p className="font-label-sm text-label-sm text-on-surface-variant">{o.patientId} · {o.age}y</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-sm border-b border-surface-dim dark:border-outline font-body-sm text-body-sm text-on-surface dark:text-inverse-on-surface whitespace-nowrap">{o.testName}</td>
                  <td className="p-sm border-b border-surface-dim dark:border-outline font-label-sm text-label-sm text-on-surface-variant">{o.category}</td>
                  <td className="p-sm border-b border-surface-dim dark:border-outline">
                    <span className="font-body-sm text-body-sm text-on-surface dark:text-inverse-on-surface">{o.result || '—'}</span>
                  </td>
                  <td className="p-sm border-b border-surface-dim dark:border-outline font-label-sm text-label-sm text-on-surface-variant whitespace-nowrap">{o.referenceRange || '—'}</td>
                  <td className="p-sm border-b border-surface-dim dark:border-outline font-label-sm text-label-sm text-on-surface-variant whitespace-nowrap">{o.completedAt || '—'}</td>
                  <td className="p-sm border-b border-surface-dim dark:border-outline">
                    <div className="flex gap-xs">
                      <button className="p-xs text-primary hover:bg-primary-container rounded transition-colors" title="View Report">
                        <span className="material-symbols-outlined text-[18px]">visibility</span>
                      </button>
                      <button className="p-xs text-on-surface-variant hover:bg-surface-container-high rounded transition-colors" title="Print Report">
                        <span className="material-symbols-outlined text-[18px]">print</span>
                      </button>
                      <button className="p-xs text-on-surface-variant hover:bg-surface-container-high rounded transition-colors" title="Share / Dispatch">
                        <span className="material-symbols-outlined text-[18px]">share</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-xl text-center font-body-md text-body-md text-on-surface-variant">
                    <span className="material-symbols-outlined text-[40px] block mx-auto mb-sm opacity-30">check_circle</span>
                    No completed tests found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ─── TAB: Patient History ─────────────────────────────────────────────────────
function PatientHistoryTab({ orders }: { orders: LabOrder[] }) {
  const [search, setSearch] = useState('')

  // Group orders by patient
  const byPatient = orders.reduce((acc, o) => {
    if (!acc[o.patientId]) acc[o.patientId] = { name: o.patientName, id: o.patientId, age: o.age, orders: [] }
    acc[o.patientId].orders.push(o)
    return acc
  }, {} as Record<string, { name: string; id: string; age: number; orders: LabOrder[] }>)

  const patients = Object.values(byPatient).filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.id.toLowerCase().includes(search.toLowerCase())
  )

  const [selectedPatient, setSelectedPatient] = useState<typeof patients[0] | null>(null)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
      {/* Patient List */}
      <div className="glass-card rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="p-md border-b border-surface-dim dark:border-outline bg-surface-container-lowest dark:bg-on-surface">
          <h3 className="font-title-lg text-title-lg text-on-surface dark:text-inverse-on-surface mb-sm">Patients</h3>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
            <input
              className="w-full pl-xl pr-sm py-xs rounded-lg border border-outline-variant bg-surface-container-lowest dark:bg-surface-variant text-body-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Search by name or ID…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="flex-1 overflow-auto">
          {patients.map(p => (
            <div
              key={p.id}
              className={`p-md border-b border-surface-dim dark:border-outline cursor-pointer hover:bg-surface-container-low transition-colors ${selectedPatient?.id === p.id ? 'bg-primary-container/30 border-l-4 border-l-primary' : ''}`}
              onClick={() => setSelectedPatient(p)}
            >
              <div className="flex items-center gap-sm">
                <div className="w-9 h-9 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-sm shrink-0">
                  {p.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-body-md text-body-md text-on-surface dark:text-inverse-on-surface font-semibold truncate">{p.name}</p>
                  <p className="font-label-sm text-label-sm text-on-surface-variant">{p.id} · Age {p.age}y · {p.orders.length} test{p.orders.length !== 1 ? 's' : ''}</p>
                </div>
                {p.orders.some(o => o.isCritical) && (
                  <span className="material-symbols-outlined text-error text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
                )}
              </div>
            </div>
          ))}
          {patients.length === 0 && (
            <div className="p-xl text-center">
              <span className="material-symbols-outlined text-[40px] block mx-auto mb-sm opacity-30">person_search</span>
              <p className="font-body-md text-body-md text-on-surface-variant">No patients found</p>
            </div>
          )}
        </div>
      </div>

      {/* Patient History Detail */}
      <div className="lg:col-span-2 glass-card rounded-xl shadow-sm overflow-hidden flex flex-col">
        {selectedPatient ? (
          <>
            <div className="p-md border-b border-surface-dim dark:border-outline bg-surface-container-lowest dark:bg-on-surface flex items-center justify-between">
              <div className="flex items-center gap-md">
                <div className="w-11 h-11 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-sm">
                  {selectedPatient.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <h3 className="font-title-lg text-title-lg text-on-surface dark:text-inverse-on-surface">{selectedPatient.name}</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">{selectedPatient.id} · Age {selectedPatient.age}</p>
                </div>
              </div>
              <div className="flex gap-sm">
                <button className="bg-secondary-container text-primary font-label-md py-xs px-md rounded-lg hover:opacity-80 transition-opacity flex items-center gap-xs">
                  <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
                  Full Report
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-md flex flex-col gap-sm">
              <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-xs">Lab History ({selectedPatient.orders.length} tests)</p>
              {selectedPatient.orders.map(o => (
                <div key={o.id} className={`p-md rounded-xl border transition-colors hover:shadow-sm ${o.isCritical ? 'border-error-container bg-error-container/10' : 'border-outline-variant bg-surface dark:bg-surface-variant'}`}>
                  <div className="flex justify-between items-start mb-sm">
                    <div>
                      <div className="flex items-center gap-sm mb-xs">
                        <p className="font-title-sm text-title-sm text-on-surface dark:text-inverse-on-surface font-semibold">{o.testName}</p>
                        <PriorityBadge priority={o.priority} />
                      </div>
                      <p className="font-label-sm text-label-sm text-on-surface-variant">{o.id} · {o.category} · Ordered by {o.requestedBy}</p>
                    </div>
                    <StatusBadge status={o.status} />
                  </div>
                  <div className="flex flex-wrap gap-lg">
                    <div>
                      <span className="font-label-sm text-label-sm text-on-surface-variant block">Ordered</span>
                      <span className="font-body-sm text-body-sm text-on-surface dark:text-inverse-on-surface">{o.requestedAt}</span>
                    </div>
                    {o.completedAt && (
                      <div>
                        <span className="font-label-sm text-label-sm text-on-surface-variant block">Completed</span>
                        <span className="font-body-sm text-body-sm text-on-surface dark:text-inverse-on-surface">{o.completedAt}</span>
                      </div>
                    )}
                    {o.result && (
                      <div>
                        <span className="font-label-sm text-label-sm text-on-surface-variant block">Result</span>
                        <span className={`font-body-sm text-body-sm font-semibold ${o.isCritical ? 'text-error' : 'text-on-surface dark:text-inverse-on-surface'}`}>{o.result}</span>
                      </div>
                    )}
                    {o.referenceRange && (
                      <div>
                        <span className="font-label-sm text-label-sm text-on-surface-variant block">Reference</span>
                        <span className="font-body-sm text-body-sm text-on-surface dark:text-inverse-on-surface">{o.referenceRange}</span>
                      </div>
                    )}
                  </div>
                  {o.notes && (
                    <div className="mt-sm pt-sm border-t border-outline-variant flex items-start gap-xs">
                      <span className="material-symbols-outlined text-on-surface-variant text-[15px] mt-0.5">info</span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">{o.notes}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-md text-center p-xl">
            <span className="material-symbols-outlined text-[64px] text-on-surface-variant opacity-20">manage_search</span>
            <div>
              <p className="font-title-md text-title-md text-on-surface dark:text-inverse-on-surface mb-xs">Select a patient</p>
              <p className="font-body-md text-body-md text-on-surface-variant">Choose a patient from the list to view their complete lab history</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function LaboratoryPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const user = useAuthStore(s => s.user)
  const isLabTech = user?.roles.includes('Lab Tech')

  const queryParams = new URLSearchParams(location.search)
  const activeTab = queryParams.get('tab') || 'dashboard'

  const setTab = (tab: string) => navigate(`/laboratory?tab=${tab}`, { replace: true })

  // Redirect lab tech to pending tab by default if no tab set
  useEffect(() => {
    if (isLabTech && !queryParams.get('tab')) {
      navigate('/laboratory?tab=pending', { replace: true })
    }
  }, [isLabTech])

  const tabs = [
    { id: 'dashboard', label: 'Dashboard',       icon: 'dashboard' },
    { id: 'pending',   label: 'Pending Tests',    icon: 'pending_actions' },
    { id: 'completed', label: 'Completed',        icon: 'check_circle' },
    { id: 'history',   label: 'Patient History',  icon: 'history' },
  ]

  return (
    <div className="flex-1 overflow-y-auto p-margin-mobile md:p-margin-desktop w-full max-w-[1440px] mx-auto pb-xl">

      {/* ── Page Header ─────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-lg gap-md">
        <div>
          <div className="flex items-center gap-sm mb-xs">
            <div className="p-sm bg-primary-container text-on-primary-container rounded-xl" style={{ background: '#00685d', color: '#fff' }}>
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1", fontSize: '22px' }}>salinity</span>
            </div>
            <h1 className="font-display-sm text-display-sm text-on-surface dark:text-inverse-on-surface">Laboratory Management</h1>
          </div>
          <p className="font-body-lg text-body-lg text-on-surface-variant dark:text-secondary-fixed-dim ml-[52px]">
            {isLabTech ? `Welcome, Lab. · Maternity Care Unit` : 'Clinical control center for lab workflows and critical reports.'}
          </p>
        </div>
        <div className="flex flex-col items-end gap-xs">
          <div className="flex gap-sm">
            <button className="bg-secondary-container text-primary font-label-lg text-label-lg py-sm px-md rounded-lg hover:bg-surface-dim transition-colors flex items-center gap-xs">
              <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
              Export Summary
            </button>
            <button className="bg-primary text-on-primary font-label-lg text-label-lg py-sm px-md rounded-lg hover:opacity-90 transition-opacity flex items-center gap-xs shadow-sm" style={{ background: '#00685d' }}>
              <span className="material-symbols-outlined text-[18px]">add</span>
              New Lab Order
            </button>
          </div>
          <p className="font-label-sm text-label-sm text-on-surface-variant">
            Last Sync: <span className="font-bold text-on-surface dark:text-inverse-on-surface">Today, {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </p>
        </div>
      </div>

      {/* ── Tab Navigation ──────────────────────────────────────── */}
      <div className="flex gap-xs mb-lg p-xs bg-surface-container rounded-xl overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setTab(tab.id)}
            className={`flex items-center gap-xs py-sm px-md rounded-lg font-label-lg text-label-lg whitespace-nowrap transition-all duration-150
              ${activeTab === tab.id
                ? 'bg-white dark:bg-surface text-primary shadow-sm font-semibold'
                : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
              }`}
          >
            <span className="material-symbols-outlined text-[18px]" style={activeTab === tab.id ? { fontVariationSettings: "'FILL' 1" } : {}}>{tab.icon}</span>
            {tab.label}
            {tab.id === 'pending' && ALL_ORDERS.filter(o => o.status === 'pending' || o.status === 'in_progress').length > 0 && (
              <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface'}`}>
                {ALL_ORDERS.filter(o => o.status === 'pending' || o.status === 'in_progress').length}
              </span>
            )}
            {tab.id === 'dashboard' && ALL_ORDERS.filter(o => o.isCritical).length > 0 && (
              <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-error text-white">
                {ALL_ORDERS.filter(o => o.isCritical).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab Content ─────────────────────────────────────────── */}
      {activeTab === 'dashboard' && <DashboardTab orders={ALL_ORDERS} />}
      {activeTab === 'pending'   && <PendingTab   orders={ALL_ORDERS} />}
      {activeTab === 'completed' && <CompletedTab orders={ALL_ORDERS} />}
      {activeTab === 'history'   && <PatientHistoryTab orders={ALL_ORDERS} />}
    </div>
  )
}
