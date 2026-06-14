import { useNavigate } from 'react-router-dom'

export default function SettingsPage() {
  const navigate = useNavigate()

  const switchTab = (tab: string) => {
    console.log('Switching to tab:', tab)
  }

  return (
    <>



<div className="px-margin-desktop py-xl space-y-xl max-w-7xl">

<section className="mb-xl relative overflow-hidden rounded-xl h-40 bg-primary-container flex items-center p-xl">
<div className="relative z-10 text-on-primary-container max-w-2xl">
<h3 className="font-headline-lg text-headline-lg mb-xs">Clinical Governance</h3>
<p className="text-body-md font-body-md opacity-90">Centralized control for institutional data, security protocols, and system-wide clinical workflows.</p>
</div>
<div className="absolute right-0 top-0 h-full w-1/3 opacity-10 pointer-events-none">
<svg className="h-full w-full" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
<path d="M44.7,-76.4C58.1,-69.2,69.2,-58.1,77.3,-44.7C85.4,-31.3,90.5,-15.7,89.5,-0.6C88.5,14.5,81.4,29,71.8,41.4C62.2,53.8,50.1,64.1,36.5,70.9C22.9,77.7,7.8,81,-7.2,79.8C-22.3,78.5,-37.2,72.7,-49.6,63.5C-62,54.3,-71.9,41.7,-77.6,27.5C-83.3,13.3,-84.9,-2.4,-81.4,-17C-77.9,-31.6,-69.3,-45.1,-57.4,-53C-45.5,-60.9,-30.3,-63.2,-16.4,-70.7C-2.5,-78.2,10.1,-90.9,24.4,-89.9C38.7,-88.9,31.3,-83.6,44.7,-76.4Z" fill="#ffffff" transform="translate(100 100)"></path>
</svg>
</div>
</section>

<div className="grid grid-cols-12 gap-lg">

<div className="col-span-12 lg:col-span-4 glass-card p-lg rounded-xl shadow-sm">
<div className="flex items-center gap-base mb-lg text-primary dark:text-primary-fixed">
<span className="material-symbols-outlined">apartment</span>
<h4 className="font-title-lg text-title-lg">Hospital Information</h4>
</div>
<form className="space-y-md">
<div>
<label className="block text-label-md font-label-md text-on-surface-variant mb-xs">Institution Name</label>
<input className="w-full px-md py-sm rounded-lg border border-outline-variant bg-surface focus:border-primary focus:ring-3 focus:ring-primary/10 transition-all outline-none dark:bg-inverse-surface/10" type="text" value="Shakuntala Hospital"/>
</div>
<div>
<label className="block text-label-md font-label-md text-on-surface-variant mb-xs">Hospital Code</label>
<input className="w-full px-md py-sm rounded-lg border border-outline-variant bg-surface-container-low text-on-surface-variant outline-none" readOnly={true} type="text" value="SH-MAT-2024"/>
</div>
<div>
<label className="block text-label-md font-label-md text-on-surface-variant mb-xs">Address</label>
<textarea className="w-full px-md py-sm rounded-lg border border-outline-variant bg-surface focus:border-primary focus:ring-3 focus:ring-primary/10 transition-all outline-none dark:bg-inverse-surface/10" rows={3}>12-B Clinical Square, Health Avenue, North Sector, New Delhi - 110021</textarea>
</div>
</form>
</div>

<div className="col-span-12 lg:col-span-8 space-y-lg">

<div className="glass-card p-lg rounded-xl shadow-sm">
<div className="flex justify-between items-center mb-lg">
<div className="flex items-center gap-base text-primary dark:text-primary-fixed">
<span className="material-symbols-outlined">badge</span>
<h4 className="font-title-lg text-title-lg">User Management</h4>
</div>
<div className="flex gap-base">
<button className="px-md py-xs bg-secondary-container text-on-secondary-container rounded-lg font-label-md flex items-center gap-xs hover:bg-surface-container-highest transition-colors">
<span className="material-symbols-outlined text-sm">filter_list</span>
                                    Filter
                                </button>
<button className="px-md py-xs bg-primary text-on-primary rounded-lg font-label-md flex items-center gap-xs hover:opacity-90 transition-opacity">
<span className="material-symbols-outlined text-sm">person_add</span>
                                    Add User
                                </button>
</div>
</div>
<div className="overflow-x-auto">
<table className="w-full text-left">
<thead>
<tr className="border-b border-outline-variant/30">
<th className="pb-md font-label-lg text-label-lg text-on-surface-variant uppercase tracking-wider">Name</th>
<th className="pb-md font-label-lg text-label-lg text-on-surface-variant uppercase tracking-wider">Email</th>
<th className="pb-md font-label-lg text-label-lg text-on-surface-variant uppercase tracking-wider">Role</th>
<th className="pb-md font-label-lg text-label-lg text-on-surface-variant uppercase tracking-wider">Status</th>
<th className="pb-md text-right"></th>
</tr>
</thead>
<tbody className="divide-y divide-outline-variant/10">
<tr className="hover:bg-surface-container-low transition-colors group">
<td className="py-md flex items-center gap-md">
<div className="w-8 h-8 rounded-full bg-primary-fixed text-on-primary-fixed flex items-center justify-center font-bold text-xs">AS</div>
<span className="font-medium">Dr. Ananya Sharma</span>
</td>
<td className="py-md text-on-surface-variant">a.sharma@mothercare.com</td>
<td className="py-md">
<span className="px-base py-xs bg-secondary-container/50 text-on-secondary-fixed-variant rounded-full text-[10px] font-bold uppercase">Doctor</span>
</td>
<td className="py-md">
<span className="flex items-center gap-xs text-primary text-xs font-medium">
<span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                                                Active
                                            </span>
</td>
<td className="py-md text-right">
<button className="p-xs hover:bg-surface-container rounded-lg text-on-surface-variant transition-colors group-hover:text-primary">
<span className="material-symbols-outlined">edit</span>
</button>
</td>
</tr>
<tr className="hover:bg-surface-container-low transition-colors group">
<td className="py-md flex items-center gap-md">
<div className="w-8 h-8 rounded-full bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center font-bold text-xs">RM</div>
<span className="font-medium">Rajiv Malhotra</span>
</td>
<td className="py-md text-on-surface-variant">r.malhotra@mothercare.com</td>
<td className="py-md">
<span className="px-base py-xs bg-tertiary-container/20 text-on-tertiary-fixed-variant rounded-full text-[10px] font-bold uppercase">Pharmacist</span>
</td>
<td className="py-md">
<span className="flex items-center gap-xs text-primary text-xs font-medium">
<span className="w-2 h-2 rounded-full bg-primary"></span>
                                                Active
                                            </span>
</td>
<td className="py-md text-right">
<button className="p-xs hover:bg-surface-container rounded-lg text-on-surface-variant transition-colors group-hover:text-primary">
<span className="material-symbols-outlined">edit</span>
</button>
</td>
</tr>
</tbody>
</table>
</div>
</div>

<div className="glass-card p-lg rounded-xl shadow-sm border-l-4 border-l-secondary">
<div className="flex items-center justify-between mb-md">
<div className="flex items-center gap-base text-primary dark:text-primary-fixed">
<span className="material-symbols-outlined">admin_panel_settings</span>
<h4 className="font-title-lg text-title-lg">User Roles & Permissions</h4>
</div>
<button className="text-label-md text-primary font-bold hover:underline">Manage All Roles</button>
</div>
<div className="grid grid-cols-1 md:grid-cols-3 gap-md">
<div className="bg-surface-container/50 p-md rounded-lg border border-outline-variant/30">
<h6 className="font-bold text-on-surface mb-xs">Medical Staff</h6>
<p className="text-xs text-on-surface-variant mb-md">Access to patient records, vitals, and treatment plans.</p>
<span className="text-[10px] font-bold text-primary uppercase">12 Users assigned</span>
</div>
<div className="bg-surface-container/50 p-md rounded-lg border border-outline-variant/30">
<h6 className="font-bold text-on-surface mb-xs">Administrative</h6>
<p className="text-xs text-on-surface-variant mb-md">Billing access, scheduling, and hospital metadata.</p>
<span className="text-[10px] font-bold text-primary uppercase">4 Users assigned</span>
</div>
<div className="bg-surface-container/50 p-md rounded-lg border border-outline-variant/30">
<h6 className="font-bold text-on-surface mb-xs">Pharmacy</h6>
<p className="text-xs text-on-surface-variant mb-md">Inventory management and medication dispensing.</p>
<span className="text-[10px] font-bold text-primary uppercase">3 Users assigned</span>
</div>
</div>
</div>
</div>
</div>

<section className="grid grid-cols-1 md:grid-cols-3 gap-lg">

<div className="glass-card p-lg rounded-xl shadow-sm flex flex-col border-t-4 border-t-tertiary">
<div className="flex items-center gap-base mb-md text-primary dark:text-primary-fixed">
<span className="material-symbols-outlined">notifications_active</span>
<h5 className="font-title-lg text-title-lg">Notification Settings</h5>
</div>
<div className="space-y-sm">
<div className="flex items-center justify-between py-xs border-b border-outline-variant/10">
<span className="text-body-md">System Email Alerts</span>
<button className="w-10 h-6 bg-primary rounded-full p-1 transition-colors flex items-center" onClick={(e) => { e.currentTarget.classList.toggle('bg-primary'); e.currentTarget.classList.toggle('bg-outline-variant'); e.currentTarget.querySelector('div')?.classList.toggle('translate-x-4') }}>
<div className="w-4 h-4 bg-white rounded-full transition-transform translate-x-4"></div>
</button>
</div>
<div className="flex items-center justify-between py-xs border-b border-outline-variant/10">
<span className="text-body-md">Critical Vitals SMS</span>
<button className="w-10 h-6 bg-primary rounded-full p-1 transition-colors flex items-center" onClick={(e) => { e.currentTarget.classList.toggle('bg-primary'); e.currentTarget.classList.toggle('bg-outline-variant'); e.currentTarget.querySelector('div')?.classList.toggle('translate-x-4') }}>
<div className="w-4 h-4 bg-white rounded-full transition-transform translate-x-4"></div>
</button>
</div>
<div className="flex items-center justify-between py-xs border-b border-outline-variant/10">
<span className="text-body-md">Inventory Thresholds</span>
<button className="w-10 h-6 bg-outline-variant rounded-full p-1 transition-colors flex items-center" onClick={(e) => { e.currentTarget.classList.toggle('bg-primary'); e.currentTarget.classList.toggle('bg-outline-variant'); e.currentTarget.querySelector('div')?.classList.toggle('translate-x-4') }}>
<div className="w-4 h-4 bg-white rounded-full transition-transform translate-x-0"></div>
</button>
</div>
</div>
<div className="mt-auto pt-md">
<button className="w-full text-center text-label-md text-primary font-bold hover:bg-surface-container py-2 rounded-lg transition-colors">Configure Channels</button>
</div>
</div>

<div className="glass-card p-lg rounded-xl shadow-sm flex flex-col border-t-4 border-t-error">
<div className="flex items-center gap-base mb-md text-primary dark:text-primary-fixed">
<span className="material-symbols-outlined">security</span>
<h5 className="font-title-lg text-title-lg">Security Settings</h5>
</div>
<div className="space-y-sm">
<button className="w-full flex items-center justify-between px-md py-sm bg-surface-container rounded-lg group hover:bg-primary hover:text-on-primary transition-all">
<div className="flex items-center gap-sm">
<span className="material-symbols-outlined text-sm">key</span>
<span className="text-label-md font-medium">Configure 2FA</span>
</div>
<span className="text-[10px] font-bold bg-error text-on-error px-1.5 rounded uppercase">Required</span>
</button>
<button className="w-full flex items-center justify-between px-md py-sm bg-surface-container rounded-lg group hover:bg-primary hover:text-on-primary transition-all">
<div className="flex items-center gap-sm">
<span className="material-symbols-outlined text-sm">lock_person</span>
<span className="text-label-md font-medium">Password Policy</span>
</div>
<span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">chevron_right</span>
</button>
<button className="w-full flex items-center justify-between px-md py-sm bg-surface-container rounded-lg group hover:bg-primary hover:text-on-primary transition-all">
<div className="flex items-center gap-sm">
<span className="material-symbols-outlined text-sm">timer</span>
<span className="text-label-md font-medium">Session Timeout</span>
</div>
<span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">chevron_right</span>
</button>
</div>
<div className="mt-auto pt-md flex items-center gap-sm text-[11px] text-on-surface-variant font-medium">
<span className="material-symbols-outlined text-xs">shield_check</span>
                        Last security audit: 2 days ago
                    </div>
</div>

<div className="glass-card p-lg rounded-xl shadow-sm flex flex-col border-t-4 border-t-primary">
<div className="flex items-center gap-base mb-md text-primary dark:text-primary-fixed">
<span className="material-symbols-outlined">cloud_sync</span>
<h5 className="font-title-lg text-title-lg">Backup Settings</h5>
</div>
<div className="space-y-md">
<div>
<div className="flex justify-between text-[11px] text-on-surface-variant font-bold uppercase tracking-wider mb-xs">
<span>Cloud Storage Used</span>
<span>75%</span>
</div>
<div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
<div className="h-full bg-primary w-3/4 rounded-full"></div>
</div>
</div>
<div className="p-md bg-primary-container/10 rounded-lg">
<label className="block text-[10px] font-bold text-on-surface-variant uppercase mb-xs">Backup Frequency</label>
<div className="grid grid-cols-2 gap-xs">
<button className="py-sm text-xs font-bold bg-primary text-on-primary rounded shadow-sm">Daily (Auto)</button>
<button className="py-sm text-xs font-bold bg-surface text-on-surface-variant border border-outline-variant rounded">Weekly</button>
</div>
</div>
<button className="w-full py-sm bg-secondary-container text-on-secondary-container rounded-lg font-bold text-xs flex items-center justify-center gap-xs hover:bg-surface-container-highest transition-colors">
<span className="material-symbols-outlined text-sm">download</span>
                            Run Manual Backup
                        </button>
</div>
</div>
</section>

<footer className="flex flex-col md:flex-row items-center justify-between bg-surface-container p-lg rounded-xl border border-outline-variant/30 gap-lg">
<div className="flex items-center gap-md">
<div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
<span className="material-symbols-outlined">info</span>
</div>
<div>
<p className="font-bold text-on-surface">Configuration Deployment</p>
<p className="text-label-md text-on-surface-variant">Applying changes will sync clinical protocols across all ward terminals.</p>
</div>
</div>
<div className="flex gap-md w-full md:w-auto">
<button className="flex-1 md:flex-none px-xl py-sm rounded-lg font-label-lg border border-outline-variant hover:bg-surface transition-colors">Discard Draft</button>
<button className="flex-1 md:flex-none px-xl py-sm rounded-lg font-label-lg bg-primary text-on-primary shadow-lg hover:shadow-primary/20 transition-all active:scale-95">Deploy Configuration</button>
</div>
</footer>
</div>

    </>
  )
}
