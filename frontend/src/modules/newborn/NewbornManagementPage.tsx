import { useNavigate } from 'react-router-dom'

export default function NewbornManagementPage() {
  const navigate = useNavigate()

  const switchTab = (tab: string) => {
    console.log('Switching to tab:', tab)
  }

  return (
    <>


<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter mb-xl pt-4">
<div className="bg-surface-container-lowest dark:bg-inverse-surface p-lg rounded-xl ambient-shadow border border-outline-variant/30 dark:border-outline/20">
<div className="flex justify-between items-start mb-md">
<span className="material-symbols-outlined text-primary-container p-sm bg-primary-fixed rounded-lg">child_care</span>
<span className="text-primary dark:text-primary-fixed font-bold text-headline-md">+12%</span>
</div>
<p className="font-label-md text-label-md text-secondary dark:text-outline-variant">Newborns Today</p>
<h3 className="font-headline-lg text-headline-lg text-on-surface dark:text-inverse-on-surface">12</h3>
</div>
<div className="bg-surface-container-lowest dark:bg-inverse-surface p-lg rounded-xl ambient-shadow border border-outline-variant/30 dark:border-outline/20">
<div className="flex justify-between items-start mb-md">
<span className="material-symbols-outlined text-error p-sm bg-error-container rounded-lg">monitor_heart</span>
<span className="px-sm py-base bg-error/10 text-error rounded-full text-label-md font-bold">HIGH</span>
</div>
<p className="font-label-md text-label-md text-secondary dark:text-outline-variant">NICU Admissions</p>
<h3 className="font-headline-lg text-headline-lg text-on-surface dark:text-inverse-on-surface">03</h3>
</div>
<div className="bg-surface-container-lowest dark:bg-inverse-surface p-lg rounded-xl ambient-shadow border border-outline-variant/30 dark:border-outline/20">
<div className="flex justify-between items-start mb-md">
<span className="material-symbols-outlined text-tertiary-container p-sm bg-tertiary-fixed rounded-lg">vaccines</span>
<span className="px-sm py-base bg-tertiary/10 text-tertiary rounded-full text-label-md font-bold">DUE</span>
</div>
<p className="font-label-md text-label-md text-secondary dark:text-outline-variant">Vaccinations Due</p>
<h3 className="font-headline-lg text-headline-lg text-on-surface dark:text-inverse-on-surface">08</h3>
</div>
<div className="bg-surface-container-lowest dark:bg-inverse-surface p-lg rounded-xl ambient-shadow border border-outline-variant/30 dark:border-outline/20">
<div className="flex justify-between items-start mb-md">
<span className="material-symbols-outlined text-primary-container p-sm bg-surface-variant rounded-lg">door_front</span>
<span className="text-primary dark:text-primary-fixed font-bold text-headline-md">Today</span>
</div>
<p className="font-label-md text-label-md text-secondary dark:text-outline-variant">Discharged Babies</p>
<h3 className="font-headline-lg text-headline-lg text-on-surface dark:text-inverse-on-surface">05</h3>
</div>
</div>
<div className="grid grid-cols-1 xl:grid-cols-12 gap-gutter">

<div className="xl:col-span-8 bg-surface-container-lowest dark:bg-inverse-surface rounded-xl ambient-shadow border border-outline-variant/30 dark:border-outline/20 overflow-hidden">
<div className="p-lg border-b border-outline-variant/20 dark:border-outline/20 flex justify-between items-center bg-surface-container-low/30">
<h2 className="font-title-lg text-title-lg text-on-surface dark:text-inverse-on-surface">Active Newborn Registry</h2>
<div className="flex gap-sm">
<button className="material-symbols-outlined p-sm bg-surface-container dark:bg-surface-dim/20 rounded-lg text-secondary dark:text-outline-variant">filter_list</button>
</div>
</div>
<div className="overflow-x-auto">
<table className="w-full text-left">
<thead className="bg-surface-container dark:bg-surface-container-high text-secondary dark:text-outline-variant font-label-md text-label-md">
<tr>
<th className="px-lg py-md">Baby ID</th>
<th className="px-lg py-md">Infant Detail</th>
<th className="px-lg py-md">Birth Weight</th>
<th className="px-lg py-md">NICU Status</th>
<th className="px-lg py-md">Gender</th>
<th className="px-lg py-md">Vax Status</th>
</tr>
</thead>
<tbody className="divide-y divide-outline-variant/10 dark:divide-outline/10">
<tr className="hover:bg-primary-fixed/10 dark:hover:bg-primary-container/10 cursor-pointer transition-colors bg-secondary-container/10 dark:bg-secondary-fixed-dim/5">
<td className="px-lg py-md font-label-md text-primary dark:text-primary-fixed">NB-2023-042</td>
<td className="px-lg py-md">
<div className="flex flex-col">
<span className="font-semibold text-on-surface dark:text-inverse-on-surface">Baby of Elena Rodriguez</span>
<a className="text-label-md text-secondary dark:text-outline-variant hover:text-primary dark:hover:text-primary-fixed transition-colors underline decoration-outline-variant/30" href="#" onClick={(e) => e.preventDefault()}>Mother: Elena Rodriguez</a>
</div>
</td>
<td className="px-lg py-md text-body-md">3.2kg</td>
<td className="px-lg py-md">
<span className="px-sm py-1 bg-primary-fixed/40 dark:bg-primary-fixed/20 text-primary dark:text-primary-fixed rounded-full text-[11px] font-bold uppercase">Stable</span>
</td>
<td className="px-lg py-md text-body-md">Female</td>
<td className="px-lg py-md">
<span className="inline-flex items-center gap-xs px-sm py-1 bg-surface-container dark:bg-surface-dim/40 text-secondary dark:text-outline-variant rounded-full text-[11px] font-bold uppercase">
<span className="w-1.5 h-1.5 bg-tertiary rounded-full"></span>
                                        Due 24h
                                    </span>
</td>
</tr>
<tr className="hover:bg-primary-fixed/10 dark:hover:bg-primary-container/10 cursor-pointer transition-colors">
<td className="px-lg py-md font-label-md text-primary dark:text-primary-fixed">NB-2023-043</td>
<td className="px-lg py-md">
<div className="flex flex-col">
<span className="font-semibold text-on-surface dark:text-inverse-on-surface">Baby of Sarah Jenkins</span>
<a className="text-label-md text-secondary dark:text-outline-variant hover:text-primary dark:hover:text-primary-fixed transition-colors underline decoration-outline-variant/30" href="#" onClick={(e) => e.preventDefault()}>Mother: Sarah Jenkins</a>
</div>
</td>
<td className="px-lg py-md text-body-md">2.1kg</td>
<td className="px-lg py-md">
<span className="px-sm py-1 bg-error-container text-error rounded-full text-[11px] font-bold uppercase">Critical</span>
</td>
<td className="px-lg py-md text-body-md">Male</td>
<td className="px-lg py-md">
<span className="inline-flex items-center gap-xs px-sm py-1 bg-primary-fixed/20 text-primary dark:text-primary-fixed rounded-full text-[11px] font-bold uppercase">
<span className="material-symbols-outlined text-[12px]">check</span>
                                        Up-to-date
                                    </span>
</td>
</tr>
<tr className="hover:bg-primary-fixed/10 dark:hover:bg-primary-container/10 cursor-pointer transition-colors bg-secondary-container/10 dark:bg-secondary-fixed-dim/5">
<td className="px-lg py-md font-label-md text-primary dark:text-primary-fixed">NB-2023-044</td>
<td className="px-lg py-md">
<div className="flex flex-col">
<span className="font-semibold text-on-surface dark:text-inverse-on-surface">Baby of Maria Zhang</span>
<a className="text-label-md text-secondary dark:text-outline-variant hover:text-primary dark:hover:text-primary-fixed transition-colors underline decoration-outline-variant/30" href="#" onClick={(e) => e.preventDefault()}>Mother: Maria Zhang</a>
</div>
</td>
<td className="px-lg py-md text-body-md">3.5kg</td>
<td className="px-lg py-md">
<span className="px-sm py-1 bg-surface-variant text-secondary rounded-full text-[11px] font-bold uppercase">Outpatient</span>
</td>
<td className="px-lg py-md text-body-md">Female</td>
<td className="px-lg py-md">
<span className="inline-flex items-center gap-xs px-sm py-1 bg-surface-container dark:bg-surface-dim/40 text-secondary dark:text-outline-variant rounded-full text-[11px] font-bold uppercase">
<span className="w-1.5 h-1.5 bg-tertiary rounded-full"></span>
                                        Due 48h
                                    </span>
</td>
</tr>
</tbody>
</table>
</div>
</div>

<div className="xl:col-span-4 flex flex-col gap-gutter">
<section className="bg-surface-container-lowest dark:bg-inverse-surface rounded-xl ambient-shadow border border-outline-variant/30 dark:border-outline/20 p-lg sticky top-24">
<div className="flex items-center gap-md mb-lg">
<div className="w-16 h-16 bg-primary-fixed dark:bg-primary-container rounded-full flex items-center justify-center">
<span className="material-symbols-outlined text-primary dark:text-on-primary-container text-3xl">child_care</span>
</div>
<div>
<h2 className="font-title-lg text-title-lg text-on-surface dark:text-inverse-on-surface">Elena Rodriguez's Baby</h2>
<p className="text-label-md text-secondary dark:text-outline-variant flex items-center gap-sm">
                                Assigned Room: 402B • 
                                <span className="text-primary dark:text-primary-fixed font-bold">STABLE</span>
</p>
</div>
</div>
<div className="space-y-xl">

<div className="bg-surface-container-low dark:bg-surface-dim/10 rounded-xl p-md border border-outline-variant/10">
<div className="flex justify-between items-center mb-md">
<h3 className="font-label-lg text-label-lg text-primary dark:text-primary-fixed flex items-center gap-sm">
<span className="material-symbols-outlined text-lg">monitoring</span>
                                    GROWTH TRACKER
                                </h3>
<span className="text-[10px] text-secondary font-bold uppercase">Last updated: 4h ago</span>
</div>
<div className="grid grid-cols-2 gap-md mb-lg">
<div className="bg-surface dark:bg-inverse-surface p-sm rounded-lg text-center border border-outline-variant/10">
<p className="text-[10px] text-secondary uppercase font-bold">Weight Gain</p>
<p className="text-title-lg font-bold text-on-surface dark:text-inverse-on-surface">+150g</p>
<p className="text-[10px] text-primary">Normal range</p>
</div>
<div className="bg-surface dark:bg-inverse-surface p-sm rounded-lg text-center border border-outline-variant/10">
<p className="text-[10px] text-secondary uppercase font-bold">Head Circ.</p>
<p className="text-title-lg font-bold text-on-surface dark:text-inverse-on-surface">34.5cm</p>
<p className="text-[10px] text-primary">50th percentile</p>
</div>
</div>

<div className="relative h-16 w-full flex items-end gap-1">
<div className="flex-1 bg-primary/20 h-[40%] rounded-t-sm" title="Day 1"></div>
<div className="flex-1 bg-primary/40 h-[45%] rounded-t-sm" title="Day 2"></div>
<div className="flex-1 bg-primary/60 h-[52%] rounded-t-sm" title="Day 3"></div>
<div className="flex-1 bg-primary/80 h-[58%] rounded-t-sm" title="Day 4"></div>
<div className="flex-1 bg-primary h-[65%] rounded-t-sm" title="Day 5"></div>
<div className="flex-1 bg-primary h-[72%] rounded-t-sm" title="Day 6"></div>
<div className="flex-1 bg-primary h-[80%] rounded-t-sm animate-pulse" title="Today"></div>
</div>
<div className="flex justify-between mt-xs text-[9px] text-secondary dark:text-outline-variant font-bold">
<span>BIRTH</span>
<span>TODAY (3.2KG)</span>
</div>
</div>

<div>
<h3 className="font-label-lg text-label-lg text-primary dark:text-primary-fixed mb-md flex justify-between items-center">
<span className="flex items-center gap-sm">
<span className="material-symbols-outlined text-sm">vaccines</span>
                                    VACCINATION RECORDS
                                </span>
<span className="text-[10px] px-2 py-0.5 bg-tertiary-fixed text-on-tertiary-fixed rounded font-bold uppercase">1 Overdue</span>
</h3>
<div className="space-y-sm">
<label className="flex items-center gap-md p-sm hover:bg-surface-container-low dark:hover:bg-surface-dim/20 rounded-lg cursor-pointer transition-colors border border-outline-variant/5">
<input defaultChecked={true} className="rounded text-primary focus:ring-primary w-5 h-5 border-outline" type="checkbox"/>
<span className="text-body-md text-on-surface dark:text-inverse-on-surface">Hepatitis B (Birth Dose)</span>
<span className="ml-auto material-symbols-outlined text-primary text-sm">verified</span>
</label>
<label className="flex items-center gap-md p-sm hover:bg-surface-container-low dark:hover:bg-surface-dim/20 rounded-lg cursor-pointer transition-colors border border-outline-variant/5">
<input defaultChecked={true} className="rounded text-primary focus:ring-primary w-5 h-5 border-outline" type="checkbox"/>
<span className="text-body-md text-on-surface dark:text-inverse-on-surface">BCG Vaccine</span>
<span className="ml-auto material-symbols-outlined text-primary text-sm">verified</span>
</label>
<label className="flex items-center gap-md p-sm bg-tertiary/5 border border-tertiary/20 rounded-lg cursor-pointer transition-colors">
<input className="rounded text-tertiary focus:ring-tertiary w-5 h-5 border-tertiary/30" type="checkbox"/>
<span className="text-body-md text-on-surface dark:text-inverse-on-surface font-semibold">OPV (Dose 0)</span>
<span className="ml-auto text-[10px] text-error font-bold uppercase">Due 24h</span>
</label>
</div>
</div>

<div className="grid grid-cols-1 gap-md">
<div className="border-l-4 border-primary p-md bg-surface dark:bg-surface-dim/10 rounded-r-lg">
<h4 className="font-label-md text-label-md text-primary dark:text-primary-fixed font-bold mb-xs">FEEDING NOTES</h4>
<p className="text-body-md text-on-surface-variant dark:text-outline-variant">Breastfed exclusively. feeding interval: every 3 hours. Good latch observed.</p>
</div>
</div>
<button className="w-full bg-surface dark:bg-inverse-surface text-primary dark:text-primary-fixed border-2 border-primary dark:border-primary-fixed py-md rounded-lg font-label-lg text-label-lg hover:bg-primary/5 transition-all flex items-center justify-center gap-sm">
<span className="material-symbols-outlined">edit</span>
                            Update Clinical Logs
                        </button>
</div>
</section>
</div>
</div>

    </>
  )
}
