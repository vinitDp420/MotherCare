import { useReportSummary, useDeliveryStats, useBedStats, useBillingStats } from '@/hooks/useReports'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

const DELIVERY_MODE_LABELS: Record<string, string> = {
  normal: 'Normal',
  c_section: 'C-Section',
  assisted: 'Assisted',
  water_birth: 'Water Birth',
}

const WARD_LABELS: Record<string, string> = {
  general: 'General',
  private: 'Private',
  labor: 'Labor',
  icu: 'NICU/ICU',
  semi_private: 'Semi-Private',
}

const COLORS = ['#7C4DFF', '#26C6DA', '#FF7043', '#66BB6A', '#FFA726', '#EC407A']

function KpiCard({ icon, label, value, sub, trend, trendDir }: {
  icon: string; label: string; value: string | number; sub?: string; trend?: string; trendDir?: 'up' | 'down'
}) {
  return (
    <div className="bg-surface-container-lowest dark:bg-on-surface rounded-xl p-lg border border-outline-variant shadow-sm flex flex-col gap-base">
      <div className="flex justify-between items-center">
        <span className="material-symbols-outlined text-primary p-2 bg-primary/10 rounded-lg">{icon}</span>
        {trend && (
          <div className={`flex items-center gap-1 text-label-md font-bold ${trendDir === 'up' ? 'text-primary' : 'text-error'}`}>
            <span className="material-symbols-outlined text-[16px]">{trendDir === 'up' ? 'trending_up' : 'trending_down'}</span>
            {trend}
          </div>
        )}
      </div>
      <div>
        <p className="text-on-surface-variant font-label-lg uppercase tracking-wide text-xs">{label}</p>
        <h3 className="font-headline-lg text-headline-lg text-on-surface dark:text-inverse-on-surface mt-xs">{value}</h3>
        {sub && <p className="font-label-md text-on-surface-variant mt-1">{sub}</p>}
      </div>
    </div>
  )
}

function ChartCard({ title, children, icon }: { title: string; children: React.ReactNode; icon?: string }) {
  return (
    <div className="bg-surface-container-lowest dark:bg-on-surface rounded-xl border border-outline-variant shadow-sm p-lg">
      <div className="flex items-center gap-sm mb-lg">
        {icon && <span className="material-symbols-outlined text-primary">{icon}</span>}
        <h4 className="font-title-lg text-on-surface dark:text-inverse-on-surface">{title}</h4>
      </div>
      {children}
    </div>
  )
}

function LoadingShimmer() {
  return <div className="h-64 bg-surface-container-low rounded-xl animate-pulse" />
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)
}

export default function ReportsPage() {
  const { data: summary, isLoading: summaryLoading } = useReportSummary()
  const { data: deliveryStats, isLoading: deliveryLoading } = useDeliveryStats()
  const { data: bedStats, isLoading: bedLoading } = useBedStats()
  const { data: billingStats, isLoading: billingLoading } = useBillingStats()

  const deliveryByMode = (deliveryStats?.by_mode ?? []).map((d) => ({
    name: DELIVERY_MODE_LABELS[d.delivery_mode] ?? d.delivery_mode,
    count: d.count,
  }))

  const bedPieData = (bedStats?.by_ward ?? []).map((w, i) => ({
    name: WARD_LABELS[w.ward_type] ?? w.ward_type,
    occupied: w.occupied,
    available: w.available,
    fill: COLORS[i % COLORS.length],
  }))

  const billingByType = (billingStats?.by_type ?? []).map((b) => ({
    name: b.bill_type.charAt(0).toUpperCase() + b.bill_type.slice(1),
    billed: b.total_billed,
    paid: b.total_paid,
  }))

  return (
    <div className="p-margin-desktop space-y-xl">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface dark:text-inverse-on-surface">Analytics & Reports</h2>
          <p className="font-body-md text-on-surface-variant">Real-time hospital performance dashboard.</p>
        </div>
        <div className="flex gap-sm">
          <button className="px-md py-sm bg-surface-container-high rounded-lg font-label-lg flex items-center gap-2 hover:bg-surface-container-highest transition-colors">
            <span className="material-symbols-outlined">date_range</span> This Month
          </button>
          <button className="px-md py-sm bg-primary text-on-primary rounded-lg font-label-lg flex items-center gap-2 shadow-sm hover:opacity-90 transition-all">
            <span className="material-symbols-outlined">download</span> Export PDF
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-gutter">
        {summaryLoading ? (
          Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-32 bg-surface-container-low rounded-xl animate-pulse" />)
        ) : (
          <>
            <KpiCard
              icon="person"
              label="Total Patients"
              value={summary?.patients.total ?? 0}
              sub={`+${summary?.patients.new_this_month ?? 0} this month`}
              trend="+12%"
              trendDir="up"
            />
            <KpiCard
              icon="bed"
              label="Bed Occupancy"
              value={`${summary?.beds.occupancy_pct ?? 0}%`}
              sub={`${summary?.beds.occupied ?? 0} / ${summary?.beds.total ?? 0} beds`}
              trend={`${summary?.beds.available ?? 0} free`}
              trendDir="up"
            />
            <KpiCard
              icon="pregnant_woman"
              label="Total Deliveries"
              value={summary?.deliveries.total ?? 0}
              sub={`${summary?.deliveries.this_month ?? 0} this month`}
              trend={`${summary?.deliveries.c_section_pct ?? 0}% C-Section`}
              trendDir="up"
            />
            <KpiCard
              icon="account_balance_wallet"
              label="Revenue This Month"
              value={fmt(summary?.revenue.this_month ?? 0)}
              sub={`${fmt(summary?.revenue.pending ?? 0)} pending`}
              trend="revenue"
              trendDir="up"
            />
          </>
        )}
      </section>

      {/* Charts Row 1 */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-gutter">
        {/* Delivery Mode Bar Chart */}
        <ChartCard title="Deliveries by Mode" icon="stacked_bar_chart">
          {deliveryLoading ? <LoadingShimmer /> : deliveryByMode.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-on-surface-variant text-sm flex-col gap-sm">
              <span className="material-symbols-outlined text-[48px] opacity-30">bar_chart</span>
              No delivery data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={deliveryByMode} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.07)" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 13 }} />
                <Bar dataKey="count" fill="#7C4DFF" radius={[4, 4, 0, 0]} name="Deliveries" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Delivery Monthly Trend */}
        <ChartCard title="Delivery Trend (6 months)" icon="show_chart">
          {deliveryLoading ? <LoadingShimmer /> : (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={deliveryStats?.monthly_trend ?? []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.07)" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 13 }} />
                <Line type="monotone" dataKey="count" stroke="#26C6DA" strokeWidth={2} dot={{ r: 4 }} name="Deliveries" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </section>

      {/* Charts Row 2 */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-gutter">
        {/* Bed Occupancy Pie */}
        <ChartCard title="Bed Occupancy by Ward" icon="donut_small">
          {bedLoading ? <LoadingShimmer /> : bedPieData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-on-surface-variant text-sm flex-col gap-sm">
              <span className="material-symbols-outlined text-[48px] opacity-30">hotel</span>
              No bed data yet
            </div>
          ) : (
            <div className="flex items-center gap-lg">
              <ResponsiveContainer width="55%" height={220}>
                <PieChart>
                  <Pie
                    data={bedPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    dataKey="occupied"
                    nameKey="name"
                  >
                    {bedPieData.map((entry, index) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 13 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-sm">
                {bedPieData.map((ward) => (
                  <div key={ward.name} className="flex items-center gap-sm">
                    <div className="w-2 h-2 rounded-full" style={{ background: ward.fill }} />
                    <span className="font-label-md text-on-surface-variant flex-1">{ward.name}</span>
                    <span className="font-label-lg text-on-surface font-bold">{ward.occupied}/{ward.occupied + ward.available}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </ChartCard>

        {/* Revenue by Type */}
        <ChartCard title="Revenue by Bill Type" icon="bar_chart">
          {billingLoading ? <LoadingShimmer /> : billingByType.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-on-surface-variant text-sm flex-col gap-sm">
              <span className="material-symbols-outlined text-[48px] opacity-30">receipt_long</span>
              No billing data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={billingByType} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.07)" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${Math.round(v / 1000)}k`} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 13 }} formatter={(v: number) => fmt(v)} />
                <Legend />
                <Bar dataKey="billed" fill="#7C4DFF" radius={[3, 3, 0, 0]} name="Total Billed" />
                <Bar dataKey="paid" fill="#26C6DA" radius={[3, 3, 0, 0]} name="Total Paid" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </section>

      {/* Revenue Trend */}
      <section>
        <ChartCard title="Monthly Revenue Trend (6 months)" icon="trending_up">
          {billingLoading ? <LoadingShimmer /> : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={billingStats?.monthly_revenue ?? []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.07)" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${Math.round(v / 1000)}k`} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 13 }} formatter={(v: number) => fmt(v)} />
                <Line type="monotone" dataKey="revenue" stroke="#7C4DFF" strokeWidth={2} dot={{ r: 5 }} name="Revenue" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </section>

      {/* Status Distribution (Billing) */}
      {billingStats && billingStats.by_status.length > 0 && (
        <section>
          <h3 className="font-title-lg text-on-surface dark:text-inverse-on-surface mb-md">Invoice Status Breakdown</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-md">
            {billingStats.by_status.map((s) => (
              <div key={s.payment_status} className="bg-surface-container-lowest rounded-xl p-md border border-outline-variant text-center shadow-sm">
                <p className="text-on-surface-variant font-label-md uppercase tracking-wide text-xs">{s.payment_status}</p>
                <p className="font-headline-md text-headline-md text-on-surface mt-xs font-bold">{s.count}</p>
                <p className="font-label-md text-on-surface-variant">{fmt(s.amount)}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
