import { useState, useMemo } from 'react'
import { useBedsList } from '@/hooks/useBeds'

const WARD_TABS = [
  { label: 'All Beds', value: '' },
  { label: 'General', value: 'general' },
  { label: 'Private', value: 'private' },
  { label: 'Labor', value: 'labor' },
  { label: 'NICU / ICU', value: 'icu' },
]

const STATUS_COLOR: Record<string, string> = {
  available: 'bg-primary-container text-on-primary-container',
  occupied: 'bg-secondary-container text-on-secondary-container',
  cleaning: 'bg-surface-variant text-on-surface-variant',
  reserved: 'bg-tertiary-container text-on-tertiary-container',
  maintenance: 'bg-error-container text-on-error-container',
}

const STATUS_BAR: Record<string, string> = {
  available: 'bg-primary',
  occupied: 'bg-secondary',
  cleaning: 'bg-outline',
  reserved: 'bg-tertiary',
  maintenance: 'bg-error',
}

const STATUS_ICON: Record<string, string> = {
  available: 'check_circle',
  occupied: 'person',
  cleaning: 'cleaning_services',
  reserved: 'event_seat',
  maintenance: 'build',
}

function StatCard({ icon, label, value, sub, color }: { icon: string; label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className={`rounded-xl p-md border shadow-sm flex flex-col gap-sm ${color ?? 'bg-surface border-outline-variant dark:bg-inverse-surface'}`}>
      <div className="flex justify-between items-start">
        <span className="font-label-lg text-label-lg">{label}</span>
        <span className="material-symbols-outlined">{icon}</span>
      </div>
      <div>
        <span className="font-display-lg text-[2.5rem] font-bold leading-none">{value}</span>
        {sub && <p className="font-label-md text-label-md opacity-75 mt-xs">{sub}</p>}
      </div>
    </div>
  )
}

export default function BedManagementPage() {
  const [wardFilter, setWardFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')

  const { data, isLoading, error } = useBedsList({
    ward_type: wardFilter || undefined,
    status: statusFilter || undefined,
  })

  const beds = data?.results ?? []
  const allCount = data?.count ?? 0

  // Stats derived from all beds (no ward filter for the summary row)
  const { data: allBeds } = useBedsList({})
  const allBedList = allBeds?.results ?? []

  const stats = useMemo(() => {
    const total = allBedList.length
    const occupied = allBedList.filter((b) => b.status === 'occupied').length
    const available = allBedList.filter((b) => b.status === 'available').length
    const cleaning = allBedList.filter((b) => b.status === 'cleaning').length
    const labor = allBedList.filter((b) => b.ward_type === 'labor' && b.status === 'occupied').length
    const laborTotal = allBedList.filter((b) => b.ward_type === 'labor').length
    const nicu = allBedList.filter((b) => b.ward_type === 'icu' && b.status === 'occupied').length
    const nicuTotal = allBedList.filter((b) => b.ward_type === 'icu').length
    const private_ = allBedList.filter((b) => b.ward_type === 'private' && b.status === 'occupied').length
    const privateTotal = allBedList.filter((b) => b.ward_type === 'private').length
    const pct = total > 0 ? Math.round((occupied / total) * 100) : 0
    return { total, occupied, available, cleaning, labor, laborTotal, nicu, nicuTotal, private: private_, privateTotal, pct }
  }, [allBedList])

  const filtered = useMemo(() => {
    if (!search) return beds
    return beds.filter((b) =>
      b.bed_number.toLowerCase().includes(search.toLowerCase())
    )
  }, [beds, search])

  return (
    <div className="space-y-lg">
      {/* Stats Row */}
      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-md">
        <StatCard
          icon="analytics"
          label="Global Occupancy"
          value={`${stats.pct}%`}
          sub={`${stats.occupied} / ${stats.total} Beds`}
          color="bg-primary text-on-primary border-primary-container shadow-md"
        />
        <StatCard
          icon="check_circle"
          label="Available"
          value={stats.available}
          sub="Ready for admission"
          color="bg-surface border-outline-variant dark:bg-inverse-surface"
        />
        <StatCard
          icon="cleaning_services"
          label="Cleaning"
          value={stats.cleaning}
          sub="Maintenance in progress"
          color="bg-surface border-outline-variant dark:bg-inverse-surface"
        />
        <StatCard
          icon="pregnant_woman"
          label="Labor"
          value={stats.labor}
          sub={`/ ${stats.laborTotal} Available`}
          color="bg-surface border-outline-variant dark:bg-inverse-surface"
        />
        <StatCard
          icon="crib"
          label="NICU"
          value={stats.nicu}
          sub={`/ ${stats.nicuTotal} Available`}
          color="bg-surface border-outline-variant dark:bg-inverse-surface"
        />
        <StatCard
          icon="single_bed"
          label="Private"
          value={stats.private}
          sub={`/ ${stats.privateTotal} Available`}
          color="bg-surface border-outline-variant dark:bg-inverse-surface"
        />
      </section>

      {/* Filters */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-md border-b border-outline-variant/30 pb-md">
        <div className="flex flex-wrap gap-sm">
          {WARD_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setWardFilter(tab.value)}
              className={`px-md py-sm rounded-lg font-label-lg text-label-lg transition-colors ${
                wardFilter === tab.value
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'bg-surface dark:bg-inverse-surface text-on-surface dark:text-surface-bright border border-outline-variant hover:bg-surface-container'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-sm w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
            <input
              className="w-full pl-xl pr-sm py-sm bg-surface dark:bg-inverse-surface border border-outline-variant rounded-lg font-body-md text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-shadow dark:text-surface-bright"
              placeholder="Search bed number..."
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-sm bg-surface dark:bg-inverse-surface border border-outline-variant rounded-lg text-on-surface dark:text-surface-bright font-label-md"
          >
            <option value="">All Status</option>
            <option value="available">Available</option>
            <option value="occupied">Occupied</option>
            <option value="cleaning">Cleaning</option>
            <option value="reserved">Reserved</option>
          </select>
        </div>
      </section>

      {/* Bed Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-md">
        {isLoading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-surface dark:bg-inverse-surface rounded-xl border border-outline-variant shadow-sm h-36 animate-pulse" />
          ))
        ) : error ? (
          <div className="col-span-full text-center py-xl text-error">
            <span className="material-symbols-outlined text-[48px] block mb-sm">error</span>
            Failed to load beds. Check API connection.
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-xl text-on-surface-variant">
            <span className="material-symbols-outlined text-[64px] mb-md opacity-40">hotel</span>
            <p className="font-body-lg">No beds found{search ? ` for "${search}"` : ''}.</p>
          </div>
        ) : (
          filtered.map((bed) => (
            <BedCard key={bed.id} bed={bed} />
          ))
        )}
      </section>

      {/* Pagination info */}
      {!isLoading && filtered.length > 0 && (
        <div className="text-label-md text-on-surface-variant text-center">
          Showing {filtered.length} of {allCount} beds
        </div>
      )}
    </div>
  )
}

function BedCard({ bed }: { bed: any }) {
  const statusClass = STATUS_COLOR[bed.status] ?? 'bg-surface-variant text-on-surface-variant'
  const barClass = STATUS_BAR[bed.status] ?? 'bg-outline'
  const icon = STATUS_ICON[bed.status] ?? 'bed'

  return (
    <article className="bg-surface dark:bg-inverse-surface rounded-xl border border-outline-variant shadow-sm overflow-hidden flex flex-col relative group transition-all hover:shadow-md">
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${barClass}`} />
      <div className="p-md flex flex-col gap-sm flex-1 pl-lg">
        <div className="flex justify-between items-start">
          <div className="flex flex-col">
            <span className="font-label-lg text-label-lg text-on-surface-variant capitalize">
              {bed.ward_type_display ?? bed.ward_type}
            </span>
            <span className="font-headline-md text-headline-md text-on-surface dark:text-surface-bright font-bold">
              {bed.bed_number}
            </span>
          </div>
          <span className={`px-xs py-[2px] rounded font-label-md text-label-md flex items-center gap-[4px] ${statusClass}`}>
            <span className="material-symbols-outlined text-[14px]">{icon}</span>
            {bed.status_display ?? bed.status}
          </span>
        </div>

        <div className="flex-1 flex flex-col justify-center">
          <div className="text-label-md text-on-surface-variant space-y-xs">
            <div className="flex items-center gap-xs">
              <span className="material-symbols-outlined text-[16px]">stairs</span>
              Floor {bed.floor}
            </div>
            {bed.last_cleaned_at && (
              <div className="flex items-center gap-xs">
                <span className="material-symbols-outlined text-[16px]">cleaning_services</span>
                Cleaned {new Date(bed.last_cleaned_at).toLocaleDateString()}
              </div>
            )}
            {bed.notes && (
              <p className="text-xs italic opacity-70">{bed.notes}</p>
            )}
          </div>
        </div>
      </div>

      {bed.status === 'available' && (
        <div className="p-sm bg-surface-bright dark:bg-surface-container-low/20 pl-lg">
          <button className="w-full py-sm bg-primary/10 text-primary dark:text-primary-fixed-dim hover:bg-primary hover:text-on-primary rounded-lg font-label-lg text-label-lg transition-colors flex items-center justify-center gap-sm">
            <span className="material-symbols-outlined text-[20px]">person_add</span>
            Assign Patient
          </button>
        </div>
      )}
      {bed.status === 'occupied' && (
        <div className="px-md py-sm border-t border-outline-variant/30 bg-surface-bright dark:bg-surface-container-low/20 flex flex-wrap gap-md pl-lg">
          <button className="font-label-lg text-primary dark:text-primary-fixed-dim hover:underline transition-all flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">move_item</span> Transfer
          </button>
          <button className="font-label-lg text-secondary dark:text-surface-variant hover:underline transition-all flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">logout</span> Discharge
          </button>
        </div>
      )}
    </article>
  )
}
