import { useNavigate } from 'react-router-dom'

export default function PharmacyPage() {
  const navigate = useNavigate()

  const switchTab = (tab: string) => {
    console.log('Switching to tab:', tab)
  }

  return (
    <>




<div className="p-margin-mobile md:p-margin-desktop flex-1 overflow-y-auto">

<div className="flex flex-col lg:flex-row lg:items-center justify-between gap-md mb-lg">
<div className="flex flex-wrap gap-sm">
<button className="bg-primary text-on-primary px-md py-sm rounded-lg font-label-lg text-label-lg shadow-sm hover:bg-primary-container transition-colors flex items-center gap-xs">
<span className="material-symbols-outlined">add_circle</span> Add New Medicine
                    </button>
<button className="bg-surface-container-high dark:bg-surface-variant text-on-surface dark:text-inverse-on-surface px-md py-sm rounded-lg border border-outline-variant font-label-lg text-label-lg hover:bg-surface-variant dark:hover:bg-surface-container transition-colors flex items-center gap-xs">
<span className="material-symbols-outlined">receipt_long</span> Generate Bill
                    </button>
</div>

<div className="flex flex-wrap items-center gap-sm">
<div className="relative min-w-[200px]">
<span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant">filter_list</span>
<select className="w-full pl-[40px] pr-sm py-[8px] rounded-lg border border-outline-variant bg-surface-container-lowest dark:bg-inverse-surface dark:text-inverse-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-label-md text-label-md appearance-none">
<option>All Categories</option>
<option>Vitamin</option>
<option>Antibiotic</option>
<option>Painkiller</option>
<option>Mineral</option>
</select>
</div>
<div className="relative min-w-[200px]">
<span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant">sort</span>
<select className="w-full pl-[40px] pr-sm py-[8px] rounded-lg border border-outline-variant bg-surface-container-lowest dark:bg-inverse-surface dark:text-inverse-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-label-md text-label-md appearance-none">
<option>Sort by: Newest</option>
<option>Sort by: Expiry (Soonest)</option>
<option>Sort by: Stock (Lowest)</option>
</select>
</div>
</div>
</div>

<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter mb-xl">
<div className="bg-surface-container-lowest dark:bg-surface-container rounded-[16px] border border-surface-variant dark:border-outline-variant soft-ambient-shadow p-md flex items-start justify-between">
<div>
<p className="font-label-md text-label-md text-on-surface-variant dark:text-on-surface-variant mb-xs">Total Medicines</p>
<h3 className="font-headline-lg text-headline-lg text-on-surface dark:text-inverse-on-surface">1,248</h3>
<p className="font-label-md text-label-md text-primary flex items-center gap-xs mt-xs">
<span className="material-symbols-outlined text-[16px]">trending_up</span> +12 this week
                        </p>
</div>
<div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container">
<span className="material-symbols-outlined">pill</span>
</div>
</div>
<div className="bg-surface-container-lowest dark:bg-surface-container rounded-[16px] border border-surface-variant dark:border-outline-variant soft-ambient-shadow p-md flex items-start justify-between">
<div>
<p className="font-label-md text-label-md text-on-surface-variant dark:text-on-surface-variant mb-xs">Low Stock Items</p>
<h3 className="font-headline-lg text-headline-lg text-on-surface dark:text-inverse-on-surface">15</h3>
<p className="font-label-md text-label-md text-error flex items-center gap-xs mt-xs">
<span className="material-symbols-outlined text-[16px]">warning</span> Action required
                        </p>
</div>
<div className="w-10 h-10 rounded-full bg-error-container flex items-center justify-center text-on-error-container">
<span className="material-symbols-outlined">production_quantity_limits</span>
</div>
</div>
<div className="bg-surface-container-lowest dark:bg-surface-container rounded-[16px] border border-surface-variant dark:border-outline-variant soft-ambient-shadow p-md flex items-start justify-between">
<div>
<p className="font-label-md text-label-md text-on-surface-variant dark:text-on-surface-variant mb-xs">Expiring Soon (30d)</p>
<h3 className="font-headline-lg text-headline-lg text-on-surface dark:text-inverse-on-surface">8</h3>
<p className="font-label-md text-label-md text-tertiary dark:text-tertiary-fixed flex items-center gap-xs mt-xs">
<span className="material-symbols-outlined text-[16px]">event_busy</span> Review needed
                        </p>
</div>
<div className="w-10 h-10 rounded-full bg-tertiary-container flex items-center justify-center text-on-tertiary-container">
<span className="material-symbols-outlined">hourglass_bottom</span>
</div>
</div>
<div className="bg-surface-container-lowest dark:bg-surface-container rounded-[16px] border border-surface-variant dark:border-outline-variant soft-ambient-shadow p-md flex items-start justify-between">
<div>
<p className="font-label-md text-label-md text-on-surface-variant dark:text-on-surface-variant mb-xs">Today's Sales</p>
<h3 className="font-headline-lg text-headline-lg text-on-surface dark:text-inverse-on-surface">$3,420</h3>
<p className="font-label-md text-label-md text-primary flex items-center gap-xs mt-xs">
<span className="material-symbols-outlined text-[16px]">check_circle</span> 42 transactions
                        </p>
</div>
<div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container">
<span className="material-symbols-outlined">payments</span>
</div>
</div>
</div>

<div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
<div className="lg:col-span-8 flex flex-col gap-gutter">
<div className="bg-surface-container-lowest dark:bg-surface-container rounded-[16px] border border-surface-variant dark:border-outline-variant soft-ambient-shadow overflow-hidden flex flex-col">
<div className="p-md border-b border-surface-variant dark:border-outline-variant flex justify-between items-center bg-surface-bright dark:bg-surface-variant/30">
<h3 className="font-title-lg text-title-lg text-on-surface dark:text-inverse-on-surface">Inventory Status</h3>
<div className="flex items-center gap-sm">
<span className="text-label-md text-on-surface-variant">Showing 15 of 1,248</span>
<button className="text-primary font-label-lg text-label-lg hover:underline">View All</button>
</div>
</div>
<div className="overflow-x-auto">
<table className="w-full text-left border-collapse min-w-[700px]">
<thead>
<tr className="border-b border-surface-variant dark:border-outline-variant bg-surface-container-low/50 dark:bg-surface-variant/20">
<th className="py-sm px-md font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Medicine & Batch</th>
<th className="py-sm px-md font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Category</th>
<th className="py-sm px-md font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Stock Level</th>
<th className="py-sm px-md font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Expiry</th>
<th className="py-sm px-md font-label-md text-label-md text-on-surface-variant uppercase tracking-wider text-right">Price</th>
</tr>
</thead>
<tbody className="font-body-md text-body-md text-on-surface dark:text-inverse-on-surface divide-y divide-surface-variant dark:divide-outline-variant">
<tr className="hover:bg-surface-container-low/30 dark:hover:bg-surface-variant/10 transition-colors group">
<td className="py-sm px-md">
<div className="flex flex-col">
<span className="font-medium">Prenatal Vitamins Plus</span>
<span className="text-[10px] font-mono text-on-surface-variant">BATCH: MC-2023-X92</span>
</div>
</td>
<td className="py-sm px-md"><span className="px-2 py-1 rounded-full bg-surface-variant dark:bg-surface-container text-on-surface-variant font-label-md text-label-md">Vitamin</span></td>
<td className="py-sm px-md">
<div className="flex items-center gap-xs">
<div className="w-24 h-1.5 bg-surface-variant dark:bg-outline-variant rounded-full overflow-hidden">
<div className="h-full bg-primary" style={{width: '85%'}}></div>
</div>
<span className="font-label-md text-label-md text-on-surface-variant w-8">340</span>
</div>
</td>
<td className="py-sm px-md text-on-surface-variant">Dec 2025</td>
<td className="py-sm px-md text-right font-medium">$24.99</td>
</tr>
<tr className="bg-error/5 dark:bg-error/10 hover:bg-error/10 transition-colors group">
<td className="py-sm px-md">
<div className="flex flex-col">
<div className="flex items-center gap-xs">
<span className="font-medium">Amoxicillin 500mg</span>
<span className="px-1.5 py-0.5 rounded text-[10px] bg-error text-on-error font-bold uppercase">Low Stock</span>
</div>
<span className="text-[10px] font-mono text-on-surface-variant">BATCH: AB-8821-L0</span>
</div>
</td>
<td className="py-sm px-md"><span className="px-2 py-1 rounded-full bg-surface-variant dark:bg-surface-container text-on-surface-variant font-label-md text-label-md">Antibiotic</span></td>
<td className="py-sm px-md">
<div className="flex items-center gap-xs">
<div className="w-24 h-1.5 bg-surface-variant dark:bg-outline-variant rounded-full overflow-hidden">
<div className="h-full bg-error" style={{width: '15%'}}></div>
</div>
<span className="font-label-md text-label-md text-error font-bold w-8">12</span>
</div>
</td>
<td className="py-sm px-md text-on-surface-variant">Aug 2024</td>
<td className="py-sm px-md text-right font-medium">$12.50</td>
</tr>
<tr className="hover:bg-surface-container-low/30 dark:hover:bg-surface-variant/10 transition-colors group">
<td className="py-sm px-md">
<div className="flex flex-col">
<span className="font-medium">Ibuprofen 400mg</span>
<span className="text-[10px] font-mono text-on-surface-variant">BATCH: PK-3342-M1</span>
</div>
</td>
<td className="py-sm px-md"><span className="px-2 py-1 rounded-full bg-surface-variant dark:bg-surface-container text-on-surface-variant font-label-md text-label-md">Painkiller</span></td>
<td className="py-sm px-md">
<div className="flex items-center gap-xs">
<div className="w-24 h-1.5 bg-surface-variant dark:bg-outline-variant rounded-full overflow-hidden">
<div className="h-full bg-primary" style={{width: '60%'}}></div>
</div>
<span className="font-label-md text-label-md text-on-surface-variant w-8">150</span>
</div>
</td>
<td className="py-sm px-md text-on-surface-variant">Jan 2026</td>
<td className="py-sm px-md text-right font-medium">$8.99</td>
</tr>
<tr className="bg-tertiary/5 dark:bg-tertiary-fixed-dim/10 hover:bg-tertiary/10 transition-colors group">
<td className="py-sm px-md">
<div className="flex flex-col">
<span className="font-medium">Iron Supplements</span>
<span className="text-[10px] font-mono text-on-surface-variant">BATCH: MN-9001-S3</span>
</div>
</td>
<td className="py-sm px-md"><span className="px-2 py-1 rounded-full bg-surface-variant dark:bg-surface-container text-on-surface-variant font-label-md text-label-md">Mineral</span></td>
<td className="py-sm px-md">
<div className="flex items-center gap-xs">
<div className="w-24 h-1.5 bg-surface-variant dark:bg-outline-variant rounded-full overflow-hidden">
<div className="h-full bg-primary" style={{width: '45%'}}></div>
</div>
<span className="font-label-md text-label-md text-on-surface-variant w-8">89</span>
</div>
</td>
<td className="py-sm px-md">
<div className="flex flex-col">
<div className="flex items-center gap-xs text-tertiary dark:text-tertiary-fixed font-bold">
<span className="material-symbols-outlined text-[16px]">event_busy</span> Nov 2023
                                                </div>
<span className="px-1.5 py-0.5 rounded text-[10px] bg-tertiary text-on-tertiary font-bold uppercase w-fit">Expiring Soon</span>
</div>
</td>
<td className="py-sm px-md text-right font-medium">$15.00</td>
</tr>
</tbody>
</table>
</div>
</div>
</div>
<div className="lg:col-span-4 flex flex-col gap-gutter">
<div className="bg-surface-container-lowest dark:bg-surface-container rounded-[16px] border border-surface-variant dark:border-outline-variant soft-ambient-shadow flex flex-col h-full max-h-[400px]">
<div className="p-md border-b border-surface-variant dark:border-outline-variant bg-surface-bright dark:bg-surface-variant/30 flex justify-between items-center">
<h3 className="font-title-lg text-title-lg text-on-surface dark:text-inverse-on-surface flex items-center gap-xs">
<span className="material-symbols-outlined text-primary">prescriptions</span> Pending Prescriptions
                            </h3>
<span className="bg-primary-container text-on-primary-container font-label-md text-label-md px-2 py-0.5 rounded-full">3 New</span>
</div>
<div className="overflow-y-auto p-sm flex flex-col gap-sm">
<div className="border border-surface-variant dark:border-outline-variant rounded-lg p-sm bg-surface dark:bg-inverse-surface hover:border-primary transition-colors">
<div className="flex justify-between items-start mb-xs">
<div>
<p className="font-label-lg text-label-lg text-on-surface dark:text-inverse-on-surface font-semibold">Emma Watson</p>
<p className="font-label-md text-label-md text-on-surface-variant flex items-center gap-1">
<span className="material-symbols-outlined text-[14px]">stethoscope</span> Dr. Sarah Jenkins
                                        </p>
</div>
<span className="font-label-md text-label-md text-on-surface-variant">10m ago</span>
</div>
<div className="bg-surface-container-lowest dark:bg-surface-container p-xs rounded border border-surface-variant dark:border-outline-variant mb-sm">
<p className="font-label-md text-label-md text-on-surface dark:text-inverse-on-surface font-mono truncate">1x Prenatal Vits, 1x Iron</p>
</div>
<button className="w-full bg-surface-container-high dark:bg-surface-variant text-primary dark:text-primary-fixed hover:bg-primary hover:text-on-primary border border-outline-variant dark:border-outline-variant hover:border-primary py-1.5 rounded-md font-label-md text-label-md transition-colors flex justify-center items-center gap-xs">
<span className="material-symbols-outlined text-[18px]">receipt</span> Generate Invoice
                                </button>
</div>
<div className="border border-surface-variant dark:border-outline-variant rounded-lg p-sm bg-surface dark:bg-inverse-surface hover:border-primary transition-colors">
<div className="flex justify-between items-start mb-xs">
<div>
<p className="font-label-lg text-label-lg text-on-surface dark:text-inverse-on-surface font-semibold">Sophia Martinez</p>
<p className="font-label-md text-label-md text-on-surface-variant flex items-center gap-1">
<span className="material-symbols-outlined text-[14px]">stethoscope</span> Dr. Alan Smith
                                        </p>
</div>
<span className="font-label-md text-label-md text-on-surface-variant">1h ago</span>
</div>
<button className="w-full bg-surface-container-high dark:bg-surface-variant text-primary dark:text-primary-fixed hover:bg-primary hover:text-on-primary border border-outline-variant dark:border-outline-variant hover:border-primary py-1.5 rounded-md font-label-md text-label-md transition-colors flex justify-center items-center gap-xs">
<span className="material-symbols-outlined text-[18px]">receipt</span> Generate Invoice
                                </button>
</div>
</div>
</div>
<div className="bg-surface-container-lowest dark:bg-surface-container rounded-[16px] border border-surface-variant dark:border-outline-variant soft-ambient-shadow flex flex-col">
<div className="p-md border-b border-surface-variant dark:border-outline-variant bg-surface-bright dark:bg-surface-variant/30">
<h3 className="font-title-lg text-title-lg text-on-surface dark:text-inverse-on-surface">Recent Sales</h3>
</div>
<div className="flex flex-col divide-y divide-surface-variant dark:divide-outline-variant p-sm">
<div className="flex justify-between items-center py-2 px-1 hover:bg-surface-container-low dark:hover:bg-surface-variant/10 rounded transition-colors">
<div className="flex items-center gap-sm">
<div className="w-8 h-8 rounded bg-surface-variant dark:bg-surface-container flex items-center justify-center text-on-surface-variant">
<span className="material-symbols-outlined text-[18px]">point_of_sale</span>
</div>
<div>
<p className="font-label-md text-label-md text-on-surface dark:text-inverse-on-surface font-semibold">INV-2045</p>
<p className="font-[10px] text-[10px] text-on-surface-variant">Just now</p>
</div>
</div>
<span className="font-label-lg text-label-lg text-primary font-medium">+$45.50</span>
</div>
<div className="flex justify-between items-center py-2 px-1 hover:bg-surface-container-low dark:hover:bg-surface-variant/10 rounded transition-colors">
<div className="flex items-center gap-sm">
<div className="w-8 h-8 rounded bg-surface-variant dark:bg-surface-container flex items-center justify-center text-on-surface-variant">
<span className="material-symbols-outlined text-[18px]">point_of_sale</span>
</div>
<div>
<p className="font-label-md text-label-md text-on-surface dark:text-inverse-on-surface font-semibold">INV-2044</p>
<p className="font-[10px] text-[10px] text-on-surface-variant">15 mins ago</p>
</div>
</div>
<span className="font-label-lg text-label-lg text-primary font-medium">+$12.00</span>
</div>
</div>
<div className="p-sm text-center border-t border-surface-variant dark:border-outline-variant">
<button className="text-on-surface-variant font-label-md text-label-md hover:text-primary transition-colors">View All Transactions</button>
</div>
</div>
</div>
</div>
</div>

    </>
  )
}
