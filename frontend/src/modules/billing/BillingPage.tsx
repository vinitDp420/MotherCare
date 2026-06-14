import { useNavigate } from 'react-router-dom'

export default function BillingPage() {
  const navigate = useNavigate()

  const switchTab = (tab: string) => {
    console.log('Switching to tab:', tab)
  }

  return (
    <>




<section className="p-margin-desktop space-y-lg">
<div className="flex justify-between items-end">
<div>
<h2 className="font-headline-lg text-headline-lg text-on-surface dark:text-inverse-on-surface">Billing & Payments</h2>
<p className="text-on-surface-variant font-body-md">Manage transactions, hospital fees, and insurance claims with clinical precision.</p>
</div>
<button className="bg-primary text-on-primary px-lg py-sm rounded-lg flex items-center gap-2 font-label-lg hover:opacity-90 active:scale-95 transition-all shadow-md">
<span className="material-symbols-outlined">receipt_long</span>
                Generate Invoice
            </button>
</div>

<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter">
<div className="bg-surface-container-lowest dark:bg-inverse-surface p-lg rounded-xl custom-shadow border border-outline-variant/30 flex flex-col gap-base">
<div className="flex justify-between items-start">
<span className="material-symbols-outlined text-primary bg-primary-fixed-dim/20 p-2 rounded-lg">account_balance_wallet</span>
<span className="text-primary font-label-lg flex items-center">+12.5% <span className="material-symbols-outlined text-label-md">trending_up</span></span>
</div>
<div>
<p className="font-label-lg text-on-surface-variant uppercase tracking-wider">Today's Revenue</p>
<h3 className="font-headline-lg text-headline-lg text-on-surface dark:text-inverse-on-surface">₹2,84,500</h3>
</div>
</div>
<div className="bg-surface-container-lowest dark:bg-inverse-surface p-lg rounded-xl custom-shadow border border-outline-variant/30 flex flex-col gap-base">
<div className="flex justify-between items-start">
<span className="material-symbols-outlined text-error bg-error-container p-2 rounded-lg">pending_actions</span>
<span className="text-on-surface-variant font-label-lg">14 Pending</span>
</div>
<div>
<p className="font-label-lg text-on-surface-variant uppercase tracking-wider">Pending Payments</p>
<h3 className="font-headline-lg text-headline-lg text-error">₹62,400</h3>
</div>
</div>
<div className="bg-surface-container-lowest dark:bg-inverse-surface p-lg rounded-xl custom-shadow border border-outline-variant/30 flex flex-col gap-base">
<div className="flex justify-between items-start">
<span className="material-symbols-outlined text-primary bg-primary-fixed-dim/20 p-2 rounded-lg">task_alt</span>
<span className="text-on-surface-variant font-label-lg">42 Today</span>
</div>
<div>
<p className="font-label-lg text-on-surface-variant uppercase tracking-wider">Paid Invoices</p>
<h3 className="font-headline-lg text-headline-lg text-on-surface dark:text-inverse-on-surface">286</h3>
</div>
</div>
<div className="bg-surface-container-lowest dark:bg-inverse-surface p-lg rounded-xl custom-shadow border border-outline-variant/30 flex flex-col gap-base">
<div className="flex justify-between items-start">
<span className="material-symbols-outlined text-tertiary bg-tertiary-fixed p-2 rounded-lg">security</span>
<span className="text-on-surface-variant font-label-lg">8 Active</span>
</div>
<div>
<p className="font-label-lg text-on-surface-variant uppercase tracking-wider">Insurance Claims</p>
<h3 className="font-headline-lg text-headline-lg text-on-surface dark:text-inverse-on-surface">₹1,15,000</h3>
</div>
</div>
</div>

<div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
<div className="lg:col-span-8 space-y-sm">
<h4 className="font-title-lg text-title-lg text-on-surface dark:text-inverse-on-surface">Quick Billing</h4>
<div className="flex gap-md overflow-x-auto pb-4 scrollbar-hide">
<div className="min-w-[200px] flex-shrink-0 bg-surface-container-low dark:bg-surface-container p-md rounded-xl border border-outline-variant/50 hover:border-primary transition-colors cursor-pointer group">
<div className="flex items-center gap-3 mb-md">
<div className="w-10 h-10 bg-white dark:bg-inverse-surface rounded-lg flex items-center justify-center text-primary shadow-sm">
<span className="material-symbols-outlined text-title-lg">medical_services</span>
</div>
<div>
<p className="font-label-lg text-on-surface dark:text-inverse-on-surface">Consultation</p>
</div>
</div>
<button className="w-full py-2 bg-white dark:bg-inverse-surface border border-primary text-primary rounded-lg font-label-md group-hover:bg-primary group-hover:text-white transition-all">New Bill</button>
</div>
<div className="min-w-[200px] flex-shrink-0 bg-surface-container-low dark:bg-surface-container p-md rounded-xl border border-outline-variant/50 hover:border-primary transition-colors cursor-pointer group">
<div className="flex items-center gap-3 mb-md">
<div className="w-10 h-10 bg-white dark:bg-inverse-surface rounded-lg flex items-center justify-center text-primary shadow-sm">
<span className="material-symbols-outlined text-title-lg">biotech</span>
</div>
<div>
<p className="font-label-lg text-on-surface dark:text-inverse-on-surface">Laboratory</p>
</div>
</div>
<button className="w-full py-2 bg-white dark:bg-inverse-surface border border-primary text-primary rounded-lg font-label-md group-hover:bg-primary group-hover:text-white transition-all">New Bill</button>
</div>
<div className="min-w-[200px] flex-shrink-0 bg-surface-container-low dark:bg-surface-container p-md rounded-xl border border-outline-variant/50 hover:border-primary transition-colors cursor-pointer group">
<div className="flex items-center gap-3 mb-md">
<div className="w-10 h-10 bg-white dark:bg-inverse-surface rounded-lg flex items-center justify-center text-primary shadow-sm">
<span className="material-symbols-outlined text-title-lg">medication</span>
</div>
<div>
<p className="font-label-lg text-on-surface dark:text-inverse-on-surface">Pharmacy</p>
</div>
</div>
<button className="w-full py-2 bg-white dark:bg-inverse-surface border border-primary text-primary rounded-lg font-label-md group-hover:bg-primary group-hover:text-white transition-all">New Bill</button>
</div>
<div className="min-w-[200px] flex-shrink-0 bg-surface-container-low dark:bg-surface-container p-md rounded-xl border border-outline-variant/50 hover:border-primary transition-colors cursor-pointer group">
<div className="flex items-center gap-3 mb-md">
<div className="w-10 h-10 bg-white dark:bg-inverse-surface rounded-lg flex items-center justify-center text-primary shadow-sm">
<span className="material-symbols-outlined text-title-lg">bed</span>
</div>
<div>
<p className="font-label-lg text-on-surface dark:text-inverse-on-surface">Admission</p>
</div>
</div>
<button className="w-full py-2 bg-white dark:bg-inverse-surface border border-primary text-primary rounded-lg font-label-md group-hover:bg-primary group-hover:text-white transition-all">New Bill</button>
</div>
</div>
</div>
<div className="lg:col-span-4 space-y-sm">
<h4 className="font-title-lg text-title-lg text-on-surface dark:text-inverse-on-surface">Payment Methods</h4>
<div className="grid grid-cols-2 gap-sm">
<div className="flex items-center gap-2 p-3 bg-surface-container-low dark:bg-surface-container rounded-xl border border-outline-variant hover:border-primary cursor-pointer transition-all group">
<span className="material-symbols-outlined text-primary group-hover:scale-110 transition-transform">payments</span>
<span className="font-label-lg">Cash</span>
</div>
<div className="flex items-center gap-2 p-3 bg-surface-container-low dark:bg-surface-container rounded-xl border border-outline-variant hover:border-primary cursor-pointer transition-all group">
<span className="material-symbols-outlined text-primary group-hover:scale-110 transition-transform">qr_code_2</span>
<span className="font-label-lg">UPI</span>
</div>
<div className="flex items-center gap-2 p-3 bg-surface-container-low dark:bg-surface-container rounded-xl border border-outline-variant hover:border-primary cursor-pointer transition-all group">
<span className="material-symbols-outlined text-primary group-hover:scale-110 transition-transform">credit_card</span>
<span className="font-label-lg">Card</span>
</div>
<div className="flex items-center gap-2 p-3 bg-surface-container-low dark:bg-surface-container rounded-xl border border-outline-variant hover:border-primary cursor-pointer transition-all group">
<span className="material-symbols-outlined text-primary group-hover:scale-110 transition-transform">verified_user</span>
<span className="font-label-lg">Insurance</span>
</div>
</div>
</div>
</div>

<div className="bg-surface-container-lowest dark:bg-inverse-surface rounded-2xl custom-shadow border border-outline-variant/30 overflow-hidden">
<div className="px-lg py-md border-b border-outline-variant flex justify-between items-center">
<h4 className="font-title-lg text-title-lg text-on-surface dark:text-inverse-on-surface">Recent Invoices</h4>
<div className="flex gap-base">
<button className="p-2 hover:bg-surface-container-high dark:hover:bg-surface-variant rounded-lg text-on-surface-variant transition-colors">
<span className="material-symbols-outlined">filter_list</span>
</button>
<button className="p-2 hover:bg-surface-container-high dark:hover:bg-surface-variant rounded-lg text-on-surface-variant transition-colors">
<span className="material-symbols-outlined">download</span>
</button>
</div>
</div>
<div className="overflow-x-auto">
<table className="w-full text-left border-collapse">
<thead className="bg-surface-container dark:bg-surface-container-high text-on-surface-variant font-label-lg">
<tr>
<th className="px-lg py-md">Invoice No.</th>
<th className="px-lg py-md">Patient Name</th>
<th className="px-lg py-md">Bill Type</th>
<th className="px-lg py-md">Amount</th>
<th className="px-lg py-md">Status</th>
<th className="px-lg py-md">Date</th>
<th className="px-lg py-md text-right">Actions</th>
</tr>
</thead>
<tbody className="divide-y divide-outline-variant/20">

<tr className="hover:bg-surface dark:hover:bg-surface-container-low transition-colors">
<td className="px-lg py-md font-label-lg text-primary">#INV-2024-001</td>
<td className="px-lg py-md">
<div className="flex items-center gap-2">
<div className="w-8 h-8 rounded-full bg-primary-fixed-dim/20 flex items-center justify-center text-primary text-xs font-bold">ER</div>
<span className="font-label-lg dark:text-inverse-on-surface">Elena Rodriguez</span>
</div>
</td>
<td className="px-lg py-md text-on-surface-variant">Admission</td>
<td className="px-lg py-md font-semibold dark:text-inverse-on-surface">₹45,000</td>
<td className="px-lg py-md">
<span className="px-3 py-1 rounded-full text-xs font-bold bg-primary-fixed-dim/30 text-primary border border-primary/20">Paid</span>
</td>
<td className="px-lg py-md text-on-surface-variant">Oct 24, 2024</td>
<td className="px-lg py-md text-right">
<div className="flex justify-end gap-1">
<button className="p-1.5 hover:bg-primary-fixed-dim/10 rounded-lg text-on-surface-variant hover:text-primary transition-all" title="Print Invoice">
<span className="material-symbols-outlined text-[20px]">print</span>
</button>
<button className="p-1.5 hover:bg-primary-fixed-dim/10 rounded-lg text-on-surface-variant hover:text-primary transition-all" title="Download Receipt">
<span className="material-symbols-outlined text-[20px]">receipt_long</span>
</button>
<button className="p-1.5 hover:bg-primary-fixed-dim/10 rounded-lg text-on-surface-variant hover:text-primary transition-all" title="Share">
<span className="material-symbols-outlined text-[20px]">share</span>
</button>
</div>
</td>
</tr>

<tr className="bg-surface-container-low/30 dark:bg-surface-container/10 hover:bg-surface dark:hover:bg-surface-container-low transition-colors">
<td className="px-lg py-md font-label-lg text-primary">#INV-2024-002</td>
<td className="px-lg py-md">
<div className="flex items-center gap-2">
<div className="w-8 h-8 rounded-full bg-secondary-fixed flex items-center justify-center text-secondary text-xs font-bold">SJ</div>
<span className="font-label-lg dark:text-inverse-on-surface">Sarah Jenkins</span>
</div>
</td>
<td className="px-lg py-md text-on-surface-variant">Laboratory</td>
<td className="px-lg py-md font-semibold dark:text-inverse-on-surface">₹3,200</td>
<td className="px-lg py-md">
<span className="px-3 py-1 rounded-full text-xs font-bold bg-secondary-container text-secondary border border-secondary/20">Pending</span>
</td>
<td className="px-lg py-md text-on-surface-variant">Oct 24, 2024</td>
<td className="px-lg py-md text-right">
<div className="flex justify-end gap-1">
<button className="p-1.5 hover:bg-primary-fixed-dim/10 rounded-lg text-on-surface-variant hover:text-primary transition-all" title="Print Invoice">
<span className="material-symbols-outlined text-[20px]">print</span>
</button>
<button className="p-1.5 hover:bg-primary-fixed-dim/10 rounded-lg text-on-surface-variant hover:text-primary transition-all" title="Download Receipt">
<span className="material-symbols-outlined text-[20px]">receipt_long</span>
</button>
<button className="p-1.5 hover:bg-primary-fixed-dim/10 rounded-lg text-on-surface-variant hover:text-primary transition-all" title="Remind Patient">
<span className="material-symbols-outlined text-[20px]">mail</span>
</button>
</div>
</td>
</tr>

<tr className="hover:bg-surface dark:hover:bg-surface-container-low transition-colors">
<td className="px-lg py-md font-label-lg text-primary">#INV-2024-003</td>
<td className="px-lg py-md">
<div className="flex items-center gap-2">
<div className="w-8 h-8 rounded-full bg-tertiary-fixed flex items-center justify-center text-tertiary text-xs font-bold">MK</div>
<span className="font-label-lg dark:text-inverse-on-surface">Meera Kapoor</span>
</div>
</td>
<td className="px-lg py-md text-on-surface-variant">Consultation</td>
<td className="px-lg py-md font-semibold dark:text-inverse-on-surface">₹1,500</td>
<td className="px-lg py-md">
<span className="px-3 py-1 rounded-full text-xs font-bold bg-error-container text-error border border-error/20">Overdue</span>
</td>
<td className="px-lg py-md text-on-surface-variant">Oct 22, 2024</td>
<td className="px-lg py-md text-right">
<div className="flex justify-end gap-1">
<button className="p-1.5 hover:bg-primary-fixed-dim/10 rounded-lg text-on-surface-variant hover:text-primary transition-all" title="Print Invoice">
<span className="material-symbols-outlined text-[20px]">print</span>
</button>
<button className="p-1.5 hover:bg-primary-fixed-dim/10 rounded-lg text-on-surface-variant hover:text-primary transition-all" title="Download Receipt">
<span className="material-symbols-outlined text-[20px]">receipt_long</span>
</button>
<button className="p-1.5 hover:bg-primary-fixed-dim/10 rounded-lg text-error transition-all" title="Mark Critical">
<span className="material-symbols-outlined text-[20px]">priority_high</span>
</button>
</div>
</td>
</tr>

<tr className="bg-surface-container-low/30 dark:bg-surface-container/10 hover:bg-surface dark:hover:bg-surface-container-low transition-colors">
<td className="px-lg py-md font-label-lg text-primary">#INV-2024-004</td>
<td className="px-lg py-md">
<div className="flex items-center gap-2">
<div className="w-8 h-8 rounded-full bg-surface-variant flex items-center justify-center text-on-surface-variant text-xs font-bold">JT</div>
<span className="font-label-lg dark:text-inverse-on-surface">Jessica Thompson</span>
</div>
</td>
<td className="px-lg py-md text-on-surface-variant">Pharmacy</td>
<td className="px-lg py-md font-semibold dark:text-inverse-on-surface">₹850</td>
<td className="px-lg py-md">
<span className="px-3 py-1 rounded-full text-xs font-bold bg-surface-container-highest text-on-surface-variant border border-outline-variant/30">Partial</span>
</td>
<td className="px-lg py-md text-on-surface-variant">Oct 24, 2024</td>
<td className="px-lg py-md text-right">
<div className="flex justify-end gap-1">
<button className="p-1.5 hover:bg-primary-fixed-dim/10 rounded-lg text-on-surface-variant hover:text-primary transition-all" title="Print Invoice">
<span className="material-symbols-outlined text-[20px]">print</span>
</button>
<button className="p-1.5 hover:bg-primary-fixed-dim/10 rounded-lg text-on-surface-variant hover:text-primary transition-all" title="Download Receipt">
<span className="material-symbols-outlined text-[20px]">receipt_long</span>
</button>
<button className="p-1.5 hover:bg-primary-fixed-dim/10 rounded-lg text-on-surface-variant hover:text-primary transition-all" title="History">
<span className="material-symbols-outlined text-[20px]">history</span>
</button>
</div>
</td>
</tr>
</tbody>
</table>
</div>
<div className="px-lg py-md border-t border-outline-variant bg-surface dark:bg-surface-container-low flex justify-between items-center text-label-md text-on-surface-variant transition-colors duration-200">
<span>Showing 4 of 286 invoices</span>
<div className="flex gap-base">
<button className="px-3 py-1 bg-surface-container-lowest dark:bg-inverse-surface border border-outline-variant rounded hover:bg-surface-container-high dark:hover:bg-surface-variant disabled:opacity-50">Previous</button>
<button className="px-3 py-1 bg-primary text-on-primary rounded shadow-sm">1</button>
<button className="px-3 py-1 bg-surface-container-lowest dark:bg-inverse-surface border border-outline-variant rounded hover:bg-surface-container-high dark:hover:bg-surface-variant">2</button>
<button className="px-3 py-1 bg-surface-container-lowest dark:bg-inverse-surface border border-outline-variant rounded hover:bg-surface-container-high dark:hover:bg-surface-variant">Next</button>
</div>
</div>
</div>
</section>

    </>
  )
}
