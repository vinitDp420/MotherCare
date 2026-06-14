import { useNavigate } from 'react-router-dom'

export default function BedManagementPage() {
  const navigate = useNavigate()

  const switchTab = (tab: string) => {
    console.log('Switching to tab:', tab)
  }

  return (
    <>




<section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-md">

<div className="bg-primary text-on-primary rounded-xl p-md border border-primary-container shadow-md flex flex-col gap-sm">
<div className="flex justify-between items-start">
<span className="font-label-lg">Global Occupancy</span>
<span className="material-symbols-outlined">analytics</span>
</div>
<div className="mt-xs">
<span className="font-display-lg text-on-primary">74%</span>
<p className="font-label-md opacity-80">53 / 78 Beds</p>
</div>
</div>

<div className="bg-error text-on-error rounded-xl p-md border border-error-container shadow-md flex flex-col gap-sm">
<div className="flex justify-between items-start">
<span className="font-label-lg">Emergency Avail</span>
<span className="material-symbols-outlined">e911_emergency</span>
</div>
<div className="mt-xs">
<span className="font-display-lg">03</span>
<p className="font-label-md opacity-80">Reserved for trauma</p>
</div>
</div>

<div className="bg-surface dark:bg-inverse-surface rounded-xl p-md border border-outline-variant shadow-sm flex flex-col gap-sm">
<div className="flex justify-between items-start">
<span className="font-label-lg text-on-surface dark:text-surface-bright">Cleaning</span>
<span className="material-symbols-outlined text-secondary">cleaning_services</span>
</div>
<div className="mt-xs">
<span className="font-display-lg text-primary dark:text-primary-fixed-dim">05</span>
<p className="font-label-md text-on-surface-variant">Maintenance in progress</p>
</div>
</div>

<div className="bg-surface dark:bg-inverse-surface rounded-xl p-md border border-outline-variant shadow-sm flex flex-col gap-sm">
<div className="flex justify-between items-start">
<span className="font-label-lg text-on-surface dark:text-surface-bright">Labor</span>
<span className="material-symbols-outlined text-tertiary">pregnant_woman</span>
</div>
<div className="mt-xs">
<span className="font-display-lg text-tertiary">01</span>
<p className="font-label-md text-on-surface-variant">/ 8 Available (87%)</p>
</div>
</div>

<div className="bg-surface dark:bg-inverse-surface rounded-xl p-md border border-outline-variant shadow-sm flex flex-col gap-sm">
<div className="flex justify-between items-start">
<span className="font-label-lg text-on-surface dark:text-surface-bright">NICU</span>
<span className="material-symbols-outlined text-secondary">crib</span>
</div>
<div className="mt-xs">
<span className="font-display-lg text-primary dark:text-primary-fixed-dim">04</span>
<p className="font-label-md text-on-surface-variant">/ 10 Available (60%)</p>
</div>
</div>

<div className="bg-surface dark:bg-inverse-surface rounded-xl p-md border border-outline-variant shadow-sm flex flex-col gap-sm">
<div className="flex justify-between items-start">
<span className="font-label-lg text-on-surface dark:text-surface-bright">Private</span>
<span className="material-symbols-outlined text-secondary">single_bed</span>
</div>
<div className="mt-xs">
<span className="font-display-lg text-primary dark:text-primary-fixed-dim">05</span>
<p className="font-label-md text-on-surface-variant">/ 15 Available (66%)</p>
</div>
</div>
</section>

<section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-md mt-sm border-b border-outline-variant/30 pb-md">
<div className="flex flex-wrap gap-sm">
<button className="px-md py-sm bg-primary text-on-primary rounded-lg font-label-lg text-label-lg shadow-sm transition-transform active:scale-95">All Beds</button>
<button className="px-md py-sm bg-surface dark:bg-inverse-surface text-on-surface dark:text-surface-bright border border-outline-variant hover:bg-surface-container rounded-lg font-label-lg text-label-lg transition-colors">General</button>
<button className="px-md py-sm bg-surface dark:bg-inverse-surface text-on-surface dark:text-surface-bright border border-outline-variant hover:bg-surface-container rounded-lg font-label-lg text-label-lg transition-colors">Private</button>
<button className="px-md py-sm bg-surface dark:bg-inverse-surface text-on-surface dark:text-surface-bright border border-outline-variant hover:bg-surface-container rounded-lg font-label-lg text-label-lg transition-colors">Labor</button>
<button className="px-md py-sm bg-surface dark:bg-inverse-surface text-on-surface dark:text-surface-bright border border-outline-variant hover:bg-surface-container rounded-lg font-label-lg text-label-lg transition-colors">NICU/ICU</button>
</div>
<div className="flex items-center gap-sm w-full md:w-auto">
<div className="relative w-full md:w-64">
<span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">filter_list</span>
<input className="w-full pl-xl pr-sm py-sm bg-surface dark:bg-inverse-surface border border-outline-variant rounded-lg font-body-md text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-shadow dark:text-surface-bright" placeholder="Search bed ID..." type="text"/>
</div>
<button className="p-sm bg-surface dark:bg-inverse-surface border border-outline-variant rounded-lg text-on-surface dark:text-surface-bright hover:bg-surface-container transition-colors" title="Filter options">
<span className="material-symbols-outlined text-[20px]">tune</span>
</button>
</div>
</section>

<section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-md">

<article className="bg-surface dark:bg-inverse-surface rounded-xl border border-outline-variant shadow-sm overflow-hidden flex flex-col relative group transition-all hover:shadow-md">
<div className="absolute left-0 top-0 bottom-0 w-1 bg-secondary"></div>
<div className="p-md flex flex-col gap-sm flex-1 pl-lg">
<div className="flex justify-between items-start">
<div className="flex flex-col">
<span className="font-label-lg text-label-lg text-on-surface-variant">General Ward</span>
<span className="font-headline-md text-headline-md text-on-surface dark:text-surface-bright font-bold">GW-101</span>
</div>
<div className="flex flex-col items-end gap-xs">
<span className="px-xs py-[2px] bg-secondary-container text-on-secondary-container rounded font-label-md text-label-md">Occupied</span>
<span className="flex items-center gap-1 text-[10px] uppercase font-bold text-error bg-error-container/20 px-1.5 rounded-full border border-error/20">
<span className="material-symbols-outlined text-[12px]">emergency</span> Emergency Admission
    </span>
</div>
</div>
<div className="mt-sm bg-surface-container-low dark:bg-surface-container/5 rounded-lg p-sm border border-outline-variant/30">
<div className="flex items-center gap-sm mb-xs">
<div className="w-8 h-8 rounded-full bg-primary/10 text-primary dark:text-primary-fixed-dim flex items-center justify-center font-bold text-label-md border border-primary/20">
                                SP
                            </div>
<div>
<h4 className="font-title-lg text-title-lg text-on-surface dark:text-surface-bright text-[16px]">Sarah Palmer</h4>
<p className="font-label-md text-label-md text-on-surface-variant">Status: <span className="text-primary font-medium">Active</span></p>
</div>
</div>
<div className="grid grid-cols-2 gap-xs mt-sm font-label-md text-label-md">
<div className="flex flex-col">
<span className="text-on-surface-variant">Admitted</span>
<span className="text-on-surface dark:text-surface-bright font-medium">Oct 22, 14:30</span>
</div>
<div className="flex flex-col">
<span className="text-on-surface-variant">Est. Discharge</span>
<span className="text-on-surface dark:text-surface-bright font-medium">Oct 25, 10:00</span>
</div>
</div>
</div>
</div>
<div className="px-md py-sm border-t border-outline-variant/30 bg-surface-bright dark:bg-surface-container-low/20 flex flex-wrap gap-md pl-lg">
<button className="font-label-lg text-primary dark:text-primary-fixed-dim hover:underline transition-all flex items-center gap-1">
<span className="material-symbols-outlined text-[16px]">move_item</span> Transfer
    </button>
<button className="font-label-lg text-secondary dark:text-surface-variant hover:underline transition-all flex items-center gap-1">
<span className="material-symbols-outlined text-[16px]">logout</span> Discharge
    </button>
<button className="font-label-lg text-on-surface-variant ml-auto hover:text-primary transition-all">View Chart</button>
</div>
</article>

<article className="bg-surface dark:bg-inverse-surface rounded-xl border border-outline-variant shadow-sm overflow-hidden flex flex-col relative transition-all hover:shadow-md hover:border-primary/50">
<div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>
<div className="p-md flex flex-col gap-sm flex-1 pl-lg">
<div className="flex justify-between items-start">
<div className="flex flex-col">
<span className="font-label-lg text-label-lg text-on-surface-variant">Private Room</span>
<span className="font-headline-md text-headline-md text-on-surface dark:text-surface-bright font-bold">PR-204</span>
</div>
<span className="px-xs py-[2px] bg-primary-container text-on-primary-container rounded font-label-md text-label-md flex items-center gap-[4px]">
<span className="material-symbols-outlined text-[14px]">check_circle</span>
                            Available
                        </span>
</div>
<div className="flex-1 flex flex-col items-center justify-center py-xl opacity-60">
<span className="material-symbols-outlined text-[48px] text-primary dark:text-primary-fixed-dim mb-sm">single_bed</span>
<p className="font-body-md text-body-md text-on-surface-variant text-center">Ready for admission.</p>
</div>
</div>
<div className="p-sm bg-surface-bright dark:bg-surface-container-low/20 pl-lg">
<button className="w-full py-sm bg-primary/10 text-primary dark:text-primary-fixed-dim hover:bg-primary hover:text-on-primary rounded-lg font-label-lg text-label-lg transition-colors flex items-center justify-center gap-sm">
<span className="material-symbols-outlined text-[20px]">person_add</span>
                        Assign Patient
                    </button>
</div>
</article>

<article className="bg-surface dark:bg-inverse-surface rounded-xl border border-outline-variant shadow-sm overflow-hidden flex flex-col relative transition-all">
<div className="absolute left-0 top-0 bottom-0 w-1 bg-secondary-fixed"></div>
<div className="p-md flex flex-col gap-sm flex-1 pl-lg">
<div className="flex justify-between items-start">
<div className="flex flex-col">
<span className="font-label-lg text-label-lg text-on-surface-variant">General Ward</span>
<span className="font-headline-md text-headline-md text-on-surface dark:text-surface-bright font-bold">GW-108</span>
</div>
<span className="px-xs py-[2px] bg-secondary-fixed text-on-secondary-fixed-variant rounded font-label-md text-label-md">Occupied</span>
</div>
<div className="mt-sm bg-surface-container-low dark:bg-surface-container/5 rounded-lg p-sm border border-outline-variant/30">
<div className="flex items-center gap-sm mb-xs">
<div className="w-8 h-8 rounded-full bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center font-bold text-label-md">
                                JL
                            </div>
<div>
<h4 className="font-title-lg text-title-lg text-on-surface dark:text-surface-bright text-[16px]">Jane Lewis</h4>
<p className="font-label-md text-label-md text-on-surface-variant">Status: <span className="text-tertiary font-bold">Discharge Pending</span></p>
</div>
</div>
<p className="text-label-md text-on-surface-variant mt-xs italic">Awaiting pharmacy clearance.</p>
</div>
</div>
<div className="px-md py-sm border-t border-outline-variant/30 bg-surface-bright dark:bg-surface-container-low/20 flex justify-end gap-sm pl-lg">
<button className="font-label-lg text-label-lg text-primary hover:underline">Complete Discharge</button>
</div>
</article>

<article className="bg-surface-container dark:bg-surface-container-low rounded-xl border border-outline-variant border-dashed overflow-hidden flex flex-col relative opacity-90 transition-all">
<div className="absolute left-0 top-0 bottom-0 w-1 bg-outline"></div>
<div className="p-md flex flex-col gap-sm flex-1 pl-lg">
<div className="flex justify-between items-start">
<div className="flex flex-col">
<span className="font-label-lg text-label-lg text-on-surface-variant">General Ward</span>
<span className="font-headline-md text-headline-md text-on-surface-variant font-bold">GW-105</span>
</div>
<span className="px-xs py-[2px] bg-surface-variant text-on-surface-variant rounded font-label-md text-label-md flex items-center gap-[4px]">
<span className="material-symbols-outlined text-[14px]">cleaning_services</span>
                            Cleaning
                        </span>
</div>
<div className="flex-1 flex flex-col items-center justify-center py-xl">
<div className="w-full bg-surface-container-highest rounded-full h-2 mt-xs mb-sm overflow-hidden">
<div className="bg-outline h-2 rounded-full transition-all duration-1000" style={{width: '45%'}}></div>
</div>
<p className="font-label-md text-label-md text-on-surface-variant text-center">Deep clean in progress. <br /> Est. 20 mins left.</p>
</div>
</div>
</article>

<article className="bg-surface dark:bg-inverse-surface rounded-xl border border-outline-variant shadow-sm overflow-hidden flex flex-col relative group transition-all">
<div className="absolute left-0 top-0 bottom-0 w-1 bg-tertiary"></div>
<div className="p-md flex flex-col gap-sm flex-1 pl-lg">
<div className="flex justify-between items-start">
<div className="flex flex-col">
<span className="font-label-lg text-label-lg text-on-surface-variant">NICU</span>
<span className="font-headline-md text-headline-md text-on-surface dark:text-surface-bright font-bold">NC-06</span>
</div>
<span className="px-xs py-[2px] bg-tertiary-container text-on-tertiary-container rounded font-label-md text-label-md flex items-center gap-[4px]">
<span className="material-symbols-outlined text-[14px]">event_seat</span>
                            Reserved
                        </span>
</div>
<div className="flex-1 flex flex-col items-center justify-center py-xl opacity-60">
<span className="material-symbols-outlined text-[48px] text-tertiary mb-sm">crib</span>
<p className="font-body-md text-body-md text-on-surface-variant text-center">Reserved for incoming <br /> transfer from OT.</p>
</div>
</div>
<div className="p-sm bg-surface-bright dark:bg-surface-container-low/20 pl-lg">
<button className="w-full py-sm border border-tertiary text-tertiary hover:bg-tertiary hover:text-on-tertiary rounded-lg font-label-lg text-label-lg transition-colors flex items-center justify-center gap-sm">
<span className="material-symbols-outlined text-[20px]">assignment_turned_in</span>
                        View Booking
                    </button>
</div>
</article>

<article className="bg-surface dark:bg-inverse-surface rounded-xl border border-tertiary-container shadow-md overflow-hidden flex flex-col relative">
<div className="absolute left-0 top-0 bottom-0 w-1 bg-tertiary"></div>
<div className="p-md flex flex-col gap-sm flex-1 pl-lg">
<div className="flex justify-between items-start">
<div className="flex flex-col">
<span className="font-label-lg text-label-lg text-tertiary font-bold">Labor Room</span>
<span className="font-headline-md text-headline-md text-on-surface dark:text-surface-bright font-bold">LR-02</span>
</div>
<span className="px-xs py-[2px] bg-error-container text-on-error-container rounded font-label-md text-label-md flex items-center gap-[4px] animate-pulse">
<span className="material-symbols-outlined text-[14px]">warning</span>
                            Active Labor
                        </span>
</div>
<div className="mt-sm bg-tertiary-fixed/30 rounded-lg p-sm border border-tertiary-fixed-dim/50">
<div className="flex items-center gap-sm mb-xs">
<div className="w-8 h-8 rounded-full bg-tertiary text-on-tertiary flex items-center justify-center font-bold text-label-md">
                                MR
                            </div>
<div>
<h4 className="font-title-lg text-title-lg text-on-surface dark:text-surface-bright text-[16px]">Maria Rodriguez</h4>
<p className="font-label-md text-label-md text-on-surface-variant">Status: <span className="text-tertiary font-bold">Transferred</span> (from OT)</p>
</div>
</div>
<div className="grid grid-cols-2 gap-xs mt-sm font-label-md text-label-md">
<div className="flex flex-col">
<span className="text-on-surface-variant">Update</span>
<span className="text-on-surface dark:text-surface-bright font-medium">8cm (09:00)</span>
</div>
<div className="flex flex-col">
<span className="text-on-surface-variant">Staff</span>
<span className="text-on-surface dark:text-surface-bright font-medium">Dr. Emily Chen</span>
</div>
</div>
</div>
</div>
<div className="px-md py-sm border-t border-outline-variant/30 bg-surface-bright dark:bg-surface-container-low/20 flex justify-end gap-sm pl-lg">
<button className="font-label-lg text-tertiary hover:underline transition-all">Update Vitals</button>
<button className="font-label-lg text-primary dark:text-primary-fixed-dim hover:underline transition-all">View Chart</button>
</div>
</article>
</section>

    </>
  )
}
