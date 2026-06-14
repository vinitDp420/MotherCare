import { useNavigate } from 'react-router-dom'

export default function LaboratoryPage() {
  const navigate = useNavigate()

  const switchTab = (tab: string) => {
    console.log('Switching to tab:', tab)
  }

  return (
    <>




<div className="flex-1 overflow-y-auto p-margin-mobile md:p-margin-desktop w-full max-w-[1440px] mx-auto pb-xl">
<div className="flex justify-between items-end mb-lg">
<div>
<h2 className="font-display-lg text-display-lg text-on-surface dark:text-inverse-on-surface mb-xs">Laboratory Management</h2>
<p className="font-body-lg text-body-lg text-on-surface-variant dark:text-secondary-fixed-dim">Clinical control center for lab workflows and critical reports.</p>
</div>
<div className="flex flex-col items-end gap-sm">
<div className="flex gap-sm">
<button className="bg-secondary-container text-primary font-label-lg text-label-lg py-sm px-md rounded-lg hover:bg-surface-dim transition-colors flex items-center gap-xs">
<span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
                        Export Summary
                    </button>
<button className="bg-primary text-on-primary font-label-lg text-label-lg py-sm px-md rounded-lg hover:opacity-90 transition-opacity flex items-center gap-xs shadow-sm">
<span className="material-symbols-outlined text-[18px]">add</span>
                        New Lab Order
                    </button>
</div>
<div className="text-right">
<p className="font-label-md text-label-md text-on-surface-variant dark:text-secondary-fixed-dim">Last System Sync: <span className="font-bold text-on-surface dark:text-inverse-on-surface">Today, 09:41 AM</span></p>
</div>
</div>
</div>

<div className="grid grid-cols-1 md:grid-cols-4 gap-lg mb-xl">
<div className="glass-card rounded-xl p-lg shadow-sm relative overflow-hidden group">
<div className="absolute -right-4 -top-4 w-20 h-20 bg-error-container rounded-full opacity-50 group-hover:scale-110 transition-transform"></div>
<div className="relative z-10 flex justify-between items-start mb-md">
<div className="p-sm bg-error-container text-on-error-container rounded-lg">
<span className="material-symbols-outlined">priority_high</span>
</div>
<span className="font-label-md text-label-md text-error font-bold">CRITICAL</span>
</div>
<h3 className="font-title-lg text-title-lg text-on-surface dark:text-inverse-on-surface mb-xs relative z-10">Critical Results</h3>
<div className="flex items-baseline gap-sm relative z-10">
<span className="font-display-lg text-display-lg text-error">3</span>
<span className="font-body-md text-body-md text-on-surface-variant dark:text-secondary-fixed-dim">immediate action</span>
</div>
</div>
<div className="glass-card rounded-xl p-lg shadow-sm relative overflow-hidden group">
<div className="relative z-10 flex justify-between items-start mb-md">
<div className="p-sm bg-surface-container-high text-primary rounded-lg">
<span className="material-symbols-outlined">pending</span>
</div>
</div>
<h3 className="font-title-lg text-title-lg text-on-surface dark:text-inverse-on-surface mb-xs relative z-10">Pending Tests</h3>
<div className="flex items-baseline gap-sm relative z-10">
<span className="font-display-lg text-display-lg text-on-surface dark:text-inverse-on-surface">42</span>
<span className="font-body-md text-body-md text-on-surface-variant dark:text-secondary-fixed-dim">in queue</span>
</div>
</div>
<div className="glass-card rounded-xl p-lg shadow-sm relative overflow-hidden group">
<div className="relative z-10 flex justify-between items-start mb-md">
<div className="p-sm bg-secondary-container text-on-secondary-container rounded-lg">
<span className="material-symbols-outlined">sync</span>
</div>
</div>
<h3 className="font-title-lg text-title-lg text-on-surface dark:text-inverse-on-surface mb-xs relative z-10">In Progress</h3>
<div className="flex items-baseline gap-sm relative z-10">
<span className="font-display-lg text-display-lg text-on-surface dark:text-inverse-on-surface">15</span>
<span className="font-body-md text-body-md text-on-surface-variant dark:text-secondary-fixed-dim">processing</span>
</div>
</div>
<div className="glass-card rounded-xl p-lg shadow-sm relative overflow-hidden group">
<div className="relative z-10 flex justify-between items-start mb-md">
<div className="p-sm bg-primary-container text-on-primary-container rounded-lg">
<span className="material-symbols-outlined">check_circle</span>
</div>
</div>
<h3 className="font-title-lg text-title-lg text-on-surface dark:text-inverse-on-surface mb-xs relative z-10">Completed</h3>
<div className="flex items-baseline gap-sm relative z-10">
<span className="font-display-lg text-display-lg text-on-surface dark:text-inverse-on-surface">128</span>
<span className="font-body-md text-body-md text-on-surface-variant dark:text-secondary-fixed-dim">finalized today</span>
</div>
</div>
</div>

<div className="flex flex-col gap-lg">

<div className="glass-card p-md rounded-xl flex flex-col md:flex-row gap-md items-center justify-between shadow-sm">
<div className="flex flex-wrap gap-sm items-center w-full md:w-auto">
<div className="relative min-w-[240px]">
<span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-on-surface-variant">person_search</span>
<input className="w-full pl-xl pr-sm py-xs rounded-lg border border-outline-variant bg-surface-container-lowest dark:bg-surface-variant dark:border-outline focus:ring-primary text-body-md" placeholder="Patient Search (Name/ID)..." type="text"/>
</div>
<select className="bg-surface-container-lowest dark:bg-surface-variant border-outline-variant rounded-lg text-label-lg py-xs px-md focus:ring-primary">
<option value="">All Categories</option>
<option value="hematology">Hematology</option>
<option value="biochemistry">Biochemistry</option>
<option value="radiology">Radiology</option>
<option value="microbiology">Microbiology</option>
</select>
<select className="bg-surface-container-lowest dark:bg-surface-variant border-outline-variant rounded-lg text-label-lg py-xs px-md focus:ring-primary">
<option value="">All Statuses</option>
<option value="pending">Pending</option>
<option value="in_progress">In Progress</option>
<option value="completed">Completed</option>
<option value="critical">Critical</option>
</select>
</div>
<div className="flex items-center gap-sm">
<button className="p-sm text-on-surface-variant hover:bg-surface-container-low rounded-lg transition-colors border border-outline-variant">
<span className="material-symbols-outlined">tune</span>
</button>
<span className="text-label-md text-on-surface-variant">Showing 64 results</span>
</div>
</div>
<div className="grid grid-cols-1 lg:grid-cols-3 gap-lg h-[650px]">

<div className="lg:col-span-2 glass-card rounded-xl shadow-sm flex flex-col h-full overflow-hidden">
<div className="p-md border-b border-surface-dim dark:border-outline flex justify-between items-center bg-surface-container-lowest dark:bg-on-surface">
<div className="flex items-center gap-sm">
<h3 className="font-title-lg text-title-lg text-on-surface dark:text-inverse-on-surface">Worklist Queue</h3>
<span className="bg-primary-container text-on-primary-container font-label-md text-label-md px-sm py-xs rounded-full">Real-time Feed</span>
</div>
<div className="flex gap-sm">
<button className="p-xs text-on-surface-variant hover:bg-surface-container-low rounded-lg">
<span className="material-symbols-outlined text-[20px]">refresh</span>
</button>
</div>
</div>
<div className="flex-1 overflow-auto">
<table className="w-full text-left border-collapse">
<thead className="sticky top-0 bg-surface-container-lowest dark:bg-on-surface z-20">
<tr>
<th className="p-sm font-label-lg text-label-lg text-on-surface-variant dark:text-secondary-fixed-dim font-semibold border-b border-surface-dim dark:border-outline">Patient</th>
<th className="p-sm font-label-lg text-label-lg text-on-surface-variant dark:text-secondary-fixed-dim font-semibold border-b border-surface-dim dark:border-outline">Test Type</th>
<th className="p-sm font-label-lg text-label-lg text-on-surface-variant dark:text-secondary-fixed-dim font-semibold border-b border-surface-dim dark:border-outline">Status</th>
<th className="p-sm font-label-lg text-label-lg text-on-surface-variant dark:text-secondary-fixed-dim font-semibold border-b border-surface-dim dark:border-outline">Requested</th>
<th className="p-sm font-label-lg text-label-lg text-on-surface-variant dark:text-secondary-fixed-dim font-semibold border-b border-surface-dim dark:border-outline text-right">Actions</th>
</tr>
</thead>
<tbody>

<tr className="zebra-row critical-row hover:bg-error-container transition-colors group">
<td className="p-sm border-b border-surface-dim dark:border-outline">
<div className="flex items-center gap-sm">
<div className="w-8 h-8 rounded-full bg-error text-white flex items-center justify-center font-bold text-sm">AS</div>
<div>
<p className="font-body-md text-body-md text-on-surface dark:text-inverse-on-surface font-semibold">Anya Sharma</p>
<p className="font-label-md text-label-md text-error font-medium">ID: MC-4921</p>
</div>
</div>
</td>
<td className="p-sm border-b border-surface-dim dark:border-outline font-body-md text-body-md text-on-surface dark:text-inverse-on-surface">Complete Blood Count</td>
<td className="p-sm border-b border-surface-dim dark:border-outline">
<span className="inline-flex items-center gap-xs px-sm py-xs rounded-full text-xs font-bold bg-error text-white">
<span className="material-symbols-outlined text-[14px]">warning</span> Critical
                                        </span>
</td>
<td className="p-sm border-b border-surface-dim dark:border-outline font-body-md text-body-md text-on-surface-variant dark:text-secondary-fixed-dim">08:15 AM</td>
<td className="p-sm border-b border-surface-dim dark:border-outline text-right">
<div className="flex justify-end gap-xs">
<button className="bg-error text-white hover:opacity-90 px-sm py-xs rounded font-label-md transition-colors shadow-sm">Review Now</button>
</div>
</td>
</tr>
<tr className="zebra-row hover:bg-surface-container-low transition-colors group">
<td className="p-sm border-b border-surface-dim dark:border-outline">
<div className="flex items-center gap-sm">
<div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-primary font-bold text-sm">PR</div>
<div>
<p className="font-body-md text-body-md text-on-surface dark:text-inverse-on-surface font-medium">Priya Rajan</p>
<p className="font-label-md text-label-md text-on-surface-variant dark:text-secondary-fixed-dim">ID: MC-4877</p>
</div>
</div>
</td>
<td className="p-sm border-b border-surface-dim dark:border-outline font-body-md text-body-md text-on-surface dark:text-inverse-on-surface">Obstetric Ultrasound</td>
<td className="p-sm border-b border-surface-dim dark:border-outline">
<span className="inline-flex items-center gap-xs px-sm py-xs rounded-full text-xs font-semibold bg-secondary-container text-on-secondary-container">
<span className="material-symbols-outlined text-[14px]">sync</span> In Progress
                                        </span>
</td>
<td className="p-sm border-b border-surface-dim dark:border-outline font-body-md text-body-md text-on-surface-variant dark:text-secondary-fixed-dim">09:00 AM</td>
<td className="p-sm border-b border-surface-dim dark:border-outline text-right">
<button className="text-primary hover:bg-surface-container-high p-xs rounded transition-colors"><span className="material-symbols-outlined text-[20px]">visibility</span></button>
</td>
</tr>
<tr className="zebra-row hover:bg-surface-container-low transition-colors group">
<td className="p-sm border-b border-surface-dim dark:border-outline">
<div className="flex items-center gap-sm">
<div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-primary font-bold text-sm">MK</div>
<div>
<p className="font-body-md text-body-md text-on-surface dark:text-inverse-on-surface font-medium">Meera Kapoor</p>
<p className="font-label-md text-label-md text-on-surface-variant dark:text-secondary-fixed-dim">ID: MC-5012</p>
</div>
</div>
</td>
<td className="p-sm border-b border-surface-dim dark:border-outline font-body-md text-body-md text-on-surface dark:text-inverse-on-surface">Glucose Tolerance Test</td>
<td className="p-sm border-b border-surface-dim dark:border-outline">
<span className="inline-flex items-center gap-xs px-sm py-xs rounded-full text-xs font-semibold bg-surface-container-high text-on-surface">
<span className="material-symbols-outlined text-[14px]">schedule</span> Pending
                                        </span>
</td>
<td className="p-sm border-b border-surface-dim dark:border-outline font-body-md text-body-md text-on-surface-variant dark:text-secondary-fixed-dim">Yesterday</td>
<td className="p-sm border-b border-surface-dim dark:border-outline text-right">
<button className="text-primary hover:bg-surface-container-high p-xs rounded transition-colors"><span className="material-symbols-outlined text-[20px]">upload_file</span></button>
</td>
</tr>
</tbody>
</table>
</div>
</div>

<div className="glass-card rounded-xl shadow-sm flex flex-col h-full bg-surface-container-lowest dark:bg-on-surface overflow-hidden">
<div className="p-md border-b border-surface-dim dark:border-outline flex justify-between items-center">
<h3 className="font-title-lg text-title-lg text-on-surface dark:text-inverse-on-surface">Recent Reports</h3>
<a className="font-label-md text-label-md text-primary hover:underline" href="#" onClick={(e) => e.preventDefault()}>History</a>
</div>
<div className="flex-1 overflow-auto p-md flex flex-col gap-sm">

<div className="p-sm rounded-lg border border-surface-dim dark:border-outline hover:border-primary-fixed-dim transition-colors cursor-pointer group bg-surface dark:bg-surface-variant">
<div className="flex justify-between items-start mb-xs">
<div>
<p className="font-body-md text-body-md text-on-surface dark:text-inverse-on-surface font-semibold">Sarah Jenkins</p>
<p className="font-label-md text-label-md text-on-surface-variant dark:text-secondary-fixed-dim">Thyroid Panel</p>
</div>
<span className="font-label-md text-label-md px-sm py-xs bg-primary-container text-on-primary-container rounded-full">Completed</span>
</div>
<div className="flex gap-sm mt-sm opacity-0 group-hover:opacity-100 transition-opacity">
<button className="flex-1 bg-secondary-container text-primary font-label-md py-xs rounded hover:opacity-90 flex items-center justify-center gap-xs">
<span className="material-symbols-outlined text-[16px]">print</span> Print
                                </button>
<button className="flex-1 bg-surface-container-high text-on-surface font-label-md py-xs rounded hover:opacity-90 flex items-center justify-center gap-xs">
<span className="material-symbols-outlined text-[16px]">share</span> Dispatch
                                </button>
</div>
</div>

<div className="p-sm rounded-lg border border-error-container bg-error-container/10 transition-colors cursor-pointer group">
<div className="flex justify-between items-start mb-xs">
<div>
<p className="font-body-md text-body-md text-on-surface dark:text-inverse-on-surface font-semibold">Linda Chen</p>
<p className="font-label-md text-label-md text-error font-bold">Urinalysis - Critical</p>
</div>
<span className="font-label-md text-label-md text-on-surface-variant dark:text-secondary-fixed-dim">45m ago</span>
</div>
<div className="mt-sm flex items-center gap-sm">
<span className="material-symbols-outlined text-error text-[16px]">notification_important</span>
<span className="text-label-md text-error">Notification sent to Dr. Patel</span>
</div>
</div>
</div>
</div>
</div>
</div>
</div>

    </>
  )
}
