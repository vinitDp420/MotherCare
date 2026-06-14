import { useNavigate } from 'react-router-dom'

export default function DeliveryManagementPage() {
  const navigate = useNavigate()

  const switchTab = (tab: string) => {
    console.log('Switching to tab:', tab)
  }

  return (
    <>




<div className="mt-16 p-margin-desktop overflow-y-auto h-[calc(100vh-64px)] custom-scrollbar">

<div className="flex justify-between items-end mb-xl">
<div>
<h2 className="font-headline-lg text-headline-lg text-on-background">Delivery Management</h2>
<p className="text-body-lg text-secondary">Monitor and record maternal deliveries and newborn arrivals.</p>
</div>
<button className="flex items-center gap-sm bg-primary text-on-primary px-lg py-md rounded-lg font-label-lg text-label-lg shadow-lg hover:shadow-xl transition-all active:scale-95">
<span className="material-symbols-outlined">add_circle</span> New Delivery Entry
                </button>
</div>

<div className="grid grid-cols-1 md:grid-cols-4 gap-lg mb-xl">
<div className="bg-surface-container-lowest p-lg rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.05)] border border-outline-variant/10">
<p className="text-label-lg text-secondary mb-xs">Deliveries Today</p>
<div className="flex items-end gap-sm">
<h3 className="font-display-lg text-display-lg text-on-surface leading-none">12</h3>
<span className="text-primary text-label-lg font-bold flex items-center mb-xs">
<span className="material-symbols-outlined text-[18px]">trending_up</span> +2
                        </span>
</div>
</div>
<div className="bg-surface-container-lowest p-lg rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.05)] border border-outline-variant/10">
<p className="text-label-lg text-secondary mb-xs">Normal Deliveries</p>
<div className="flex items-end gap-sm">
<h3 className="font-display-lg text-display-lg text-on-surface leading-none">8</h3>
<span className="text-primary text-label-lg font-bold flex items-center mb-xs opacity-60">66%</span>
</div>
</div>
<div className="bg-surface-container-lowest p-lg rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.05)] border border-outline-variant/10">
<p className="text-label-lg text-secondary mb-xs">C-Sections</p>
<div className="flex items-end gap-sm">
<h3 className="font-display-lg text-display-lg text-on-surface leading-none">3</h3>
<span className="text-secondary text-label-lg font-bold flex items-center mb-xs opacity-60">25%</span>
</div>
</div>
<div className="bg-surface-container-lowest p-lg rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.05)] border-2 border-error-container relative overflow-hidden">
<div className="absolute top-0 right-0 p-xs">
<span className="bg-error text-on-error text-[10px] px-sm py-xs rounded-full font-bold uppercase tracking-wider">High Risk</span>
</div>
<p className="text-label-lg text-secondary mb-xs">High-Risk Deliveries</p>
<div className="flex items-end gap-sm">
<h3 className="font-display-lg text-display-lg text-error leading-none">1</h3>
<span className="text-error text-label-lg font-bold flex items-center mb-xs animate-pulse">
<span className="material-symbols-outlined text-[18px]">warning</span> Critical
                        </span>
</div>
</div>
</div>

<div className="flex flex-col lg:flex-row gap-lg">

<div className="lg:w-[70%] space-y-lg">
<div className="bg-surface-container-lowest rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.05)] border border-outline-variant/10 overflow-hidden">

<div className="p-lg border-b border-outline-variant/10 flex flex-wrap items-center justify-between gap-md">
<div className="flex items-center gap-md">
<h4 className="font-title-lg text-title-lg text-on-surface">Live Delivery Feed</h4>
<span className="bg-primary-container/20 text-primary px-sm py-xs rounded-full text-label-md font-bold">Real-time</span>
</div>
<div className="flex items-center gap-sm">
<select className="bg-surface-container-low border-none rounded-lg text-label-lg text-on-surface-variant focus:ring-primary/20 px-lg pr-xl">
<option>All Types</option>
<option>Normal</option>
<option>C-Section</option>
<option>Assisted</option>
</select>
<button className="p-sm bg-surface-container-low rounded-lg text-secondary hover:bg-secondary-container transition-colors">
<span className="material-symbols-outlined">filter_list</span>
</button>
</div>
</div>

<div className="overflow-x-auto">
<table className="w-full text-left border-collapse">
<thead>
<tr className="bg-surface-container-low/50 text-secondary uppercase text-[11px] font-bold tracking-widest">
<th className="px-lg py-md border-b border-outline-variant/10">Mother Name</th>
<th className="px-lg py-md border-b border-outline-variant/10">Doctor</th>
<th className="px-lg py-md border-b border-outline-variant/10">Type</th>
<th className="px-lg py-md border-b border-outline-variant/10">Date & Time</th>
<th className="px-lg py-md border-b border-outline-variant/10">Baby</th>
<th className="px-lg py-md border-b border-outline-variant/10">Status</th>
<th className="px-lg py-md border-b border-outline-variant/10"></th>
</tr>
</thead>
<tbody className="text-body-md text-on-surface">

<tr className="hover:bg-primary-container/5 transition-colors cursor-pointer group bg-surface-container-lowest">
<td className="px-lg py-md border-b border-outline-variant/5">
<div className="flex items-center gap-sm">
<div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center text-primary font-bold text-xs">ER</div>
<span className="font-semibold">Elena Rodriguez</span>
</div>
</td>
<td className="px-lg py-md border-b border-outline-variant/5 text-secondary">Dr. Anjali Sharma</td>
<td className="px-lg py-md border-b border-outline-variant/5">
<span className="bg-surface-container-high text-on-surface-variant px-sm py-xs rounded-lg text-label-md">Normal</span>
</td>
<td className="px-lg py-md border-b border-outline-variant/5 text-secondary">Oct 24, 10:45 AM</td>
<td className="px-lg py-md border-b border-outline-variant/5 text-center font-bold">1</td>
<td className="px-lg py-md border-b border-outline-variant/5">
<span className="flex items-center gap-xs text-primary font-bold text-label-md">
<span className="w-2 h-2 rounded-full bg-primary"></span> Completed
                                            </span>
</td>
<td className="px-lg py-md border-b border-outline-variant/5">
<span className="material-symbols-outlined text-outline-variant group-hover:text-primary transition-colors">chevron_right</span>
</td>
</tr>

<tr className="hover:bg-primary-container/5 transition-colors cursor-pointer group bg-surface-container-low/20">
<td className="px-lg py-md border-b border-outline-variant/5">
<div className="flex items-center gap-sm">
<div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center text-primary font-bold text-xs">SJ</div>
<span className="font-semibold">Sarah Jenkins</span>
</div>
</td>
<td className="px-lg py-md border-b border-outline-variant/5 text-secondary">Dr. Robert Chen</td>
<td className="px-lg py-md border-b border-outline-variant/5">
<span className="bg-tertiary-fixed text-on-tertiary-fixed-variant px-sm py-xs rounded-lg text-label-md">C-Section</span>
</td>
<td className="px-lg py-md border-b border-outline-variant/5 text-secondary">Oct 24, 02:15 PM</td>
<td className="px-lg py-md border-b border-outline-variant/5 text-center font-bold">2</td>
<td className="px-lg py-md border-b border-outline-variant/5">
<span className="flex items-center gap-xs text-secondary font-bold text-label-md">
<span className="w-2 h-2 rounded-full bg-secondary"></span> Post-Op
                                            </span>
</td>
<td className="px-lg py-md border-b border-outline-variant/5">
<span className="material-symbols-outlined text-outline-variant group-hover:text-primary transition-colors">chevron_right</span>
</td>
</tr>

<tr className="hover:bg-primary-container/5 transition-colors cursor-pointer group bg-surface-container-lowest">
<td className="px-lg py-md border-b border-outline-variant/5">
<div className="flex items-center gap-sm">
<div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center text-primary font-bold text-xs">MK</div>
<span className="font-semibold">Meera Kapoor</span>
</div>
</td>
<td className="px-lg py-md border-b border-outline-variant/5 text-secondary">Dr. Sarah Smith</td>
<td className="px-lg py-md border-b border-outline-variant/5">
<span className="bg-surface-container-high text-on-surface-variant px-sm py-xs rounded-lg text-label-md">Normal</span>
</td>
<td className="px-lg py-md border-b border-outline-variant/5 text-secondary">Oct 24, 05:30 PM</td>
<td className="px-lg py-md border-b border-outline-variant/5 text-center font-bold">1</td>
<td className="px-lg py-md border-b border-outline-variant/5">
<span className="flex items-center gap-xs text-primary font-bold text-label-md">
<span className="w-2 h-2 rounded-full bg-primary"></span> Completed
                                            </span>
</td>
<td className="px-lg py-md border-b border-outline-variant/5">
<span className="material-symbols-outlined text-outline-variant group-hover:text-primary transition-colors">chevron_right</span>
</td>
</tr>

<tr className="hover:bg-primary-container/5 transition-colors cursor-pointer group bg-surface-container-low/20">
<td className="px-lg py-md border-b border-outline-variant/5">
<div className="flex items-center gap-sm">
<div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center text-primary font-bold text-xs">JT</div>
<span className="font-semibold">Jessica Thompson</span>
</div>
</td>
<td className="px-lg py-md border-b border-outline-variant/5 text-secondary">Dr. Anjali Sharma</td>
<td className="px-lg py-md border-b border-outline-variant/5">
<span className="bg-secondary-fixed text-on-secondary-fixed-variant px-sm py-xs rounded-lg text-label-md">Assisted</span>
</td>
<td className="px-lg py-md border-b border-outline-variant/5 text-secondary">Oct 24, 06:12 PM</td>
<td className="px-lg py-md border-b border-outline-variant/5 text-center font-bold">1</td>
<td className="px-lg py-md border-b border-outline-variant/5">
<span className="flex items-center gap-xs text-on-tertiary-container font-bold text-label-md">
<span className="w-2 h-2 rounded-full bg-tertiary animate-pulse"></span> In Progress
                                            </span>
</td>
<td className="px-lg py-md border-b border-outline-variant/5">
<span className="material-symbols-outlined text-outline-variant group-hover:text-primary transition-colors">chevron_right</span>
</td>
</tr>
</tbody>
</table>
</div>
</div>
</div>

<div className="lg:w-[30%]">
<div className="bg-surface-container-lowest rounded-xl shadow-[0px_12px_32px_rgba(0,0,0,0.1)] border border-primary/10 flex flex-col h-full sticky top-margin-desktop">
<div className="p-lg bg-primary/5 border-b border-primary/10">
<h4 className="font-title-lg text-title-lg text-primary">Delivery Details</h4>
<p className="text-label-md font-label-md text-secondary tracking-widest uppercase">#DEL-2023-142</p>
</div>
<div className="p-lg space-y-lg overflow-y-auto custom-scrollbar flex-1">

<div className="flex items-center gap-md">
<img alt="Patient profile" className="w-16 h-16 rounded-xl object-cover shadow-sm border border-outline-variant/30" data-alt="A professional medical profile photograph of a serene Hispanic woman in her late 20s, Elena Rodriguez. She is in a high-key, softly lit clinical environment with a clean white background. The aesthetic is modern healthcare, focusing on maternal wellness, with soft teal accents in the lighting and atmosphere. The image feels bright, calm, and reliable." src="https://lh3.googleusercontent.com/aida/AP1WRLsLjCp0pKRxEmhF_Z-WiTTKIJ7_YcRp85HjND19FF-zvc9qfpB3ldlQ8mfLZEc_8O4i8Rs0ucIibpslAUnFVArjoz0724IpbUR1tMloU6p56xPKHoFt0FPQjumYu7FIUj5CG6te3ymPiI626Y-_05-tYTxbem9JBUqud_hVhmjGZfT7AmnIf37bHcxCvAJki2yzmTyAk_8RXQcHTzaX-g_wyauaxlASUtvhlDrxcjZ-A5zlilQD_CCrpwaK"/>
<div>
<p className="font-headline-md text-headline-md text-on-surface leading-tight">Elena Rodriguez</p>
<p className="text-label-lg font-label-lg text-primary font-bold">ID: #MC-2934</p>
</div>
</div>
<div className="grid grid-cols-3 gap-md bg-surface-container-low p-md rounded-lg">
<div className="text-center">
<p className="text-[10px] text-secondary font-bold uppercase">Week</p>
<p className="font-title-lg text-on-surface">39</p>
</div>
<div className="text-center border-x border-outline-variant/30">
<p className="text-[10px] text-secondary font-bold uppercase">Gravida</p>
<p className="font-title-lg text-on-surface">2</p>
</div>
<div className="text-center">
<p className="text-[10px] text-secondary font-bold uppercase">Para</p>
<p className="font-title-lg text-on-surface">1</p>
</div>
</div>
<div className="space-y-sm">
<div className="flex items-center gap-xs text-primary">
<span className="material-symbols-outlined text-[20px]">notes</span>
<h5 className="text-label-lg font-bold">Delivery Notes</h5>
</div>
<p className="text-body-md text-on-surface-variant leading-relaxed italic border-l-2 border-primary-container pl-md">
                                    "Spontaneous onset of labor. Smooth progression. Healthy cry immediately after birth."
                                </p>
</div>
<div className="space-y-sm">
<div className="flex items-center gap-xs text-error">
<span className="material-symbols-outlined text-[20px]">emergency</span>
<h5 className="text-label-lg font-bold">Complications</h5>
</div>
<div className="bg-error-container/20 text-on-error-container p-sm rounded-lg text-label-lg">
                                    None reported.
                                </div>
</div>
<div className="space-y-sm">
<div className="flex items-center gap-xs text-secondary">
<span className="material-symbols-outlined text-[20px]">medical_information</span>
<h5 className="text-label-lg font-bold">Assigned Doctor</h5>
</div>
<div className="flex items-center gap-sm">
<div className="w-8 h-8 rounded-full bg-primary-container/20 text-primary flex items-center justify-center">
<span className="material-symbols-outlined text-[18px]">person</span>
</div>
<p className="text-body-md font-semibold">Dr. Anjali Sharma</p>
</div>
</div>
</div>
<div className="p-lg border-t border-outline-variant/10 space-y-sm">
<button className="w-full border-2 border-primary text-primary py-md rounded-lg font-label-lg text-label-lg flex items-center justify-center gap-sm hover:bg-primary/5 transition-all active:scale-95">
<span className="material-symbols-outlined">edit</span> Edit Record
                            </button>
<button className="w-full bg-secondary text-on-secondary py-md rounded-lg font-label-lg text-label-lg flex items-center justify-center gap-sm hover:brightness-110 shadow-md transition-all active:scale-95">
<span className="material-symbols-outlined">description</span> Generate Birth Certificate
                            </button>
</div>
</div>
</div>
</div>
</div>

    </>
  )
}
