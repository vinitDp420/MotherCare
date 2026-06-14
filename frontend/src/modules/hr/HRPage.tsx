import { useNavigate } from 'react-router-dom'

export default function HRPage() {
  const navigate = useNavigate()

  const switchTab = (tab: string) => {
    console.log('Switching to tab:', tab)
  }

  return (
    <>



<div className="p-margin-desktop">

<div className="flex items-center gap-xs mb-md text-label-md font-label-md text-on-surface-variant dark:text-secondary-fixed-dim">
<a className="hover:text-primary transition-colors" href="#" onClick={(e) => e.preventDefault()}>Dashboard</a>
<span className="material-symbols-outlined text-[16px]">chevron_right</span>
<span className="text-on-surface dark:text-surface-bright font-semibold">Staff</span>
</div>

<div className="flex justify-between items-end mb-lg">
<div>
<h2 className="font-headline-lg text-headline-lg text-on-surface dark:text-surface-bright">Staff Management</h2>
<p className="font-body-md text-body-md text-on-surface-variant dark:text-secondary-fixed-dim">Manage your clinical and administrative team efficiently.</p>
</div>
<div className="flex gap-sm">
<button className="flex items-center gap-xs px-md py-sm bg-surface-container-high rounded-lg font-label-lg text-label-lg hover:bg-surface-container-highest transition-colors dark:bg-surface-container-highest/10 dark:text-surface-bright">
<span className="material-symbols-outlined">download</span> Export Report
                    </button>
<button className="flex items-center gap-xs px-md py-sm bg-primary text-on-primary rounded-lg font-label-lg text-label-lg hover:opacity-90 transition-all shadow-sm dark:bg-primary-fixed dark:text-on-primary-fixed">
<span className="material-symbols-outlined">person_add</span> Add New Staff
                    </button>
</div>
</div>

<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter mb-xl">

<div className="bg-surface-container-lowest p-md rounded-xl border border-outline-variant shadow-sm dark:bg-on-surface">
<div className="flex justify-between items-start mb-sm">
<div className="p-2 bg-primary-container/20 rounded-lg dark:bg-primary-container/10">
<span className="material-symbols-outlined text-primary dark:text-primary-fixed">groups</span>
</div>
<span className="text-primary font-label-md text-label-md bg-primary-fixed px-2 py-0.5 rounded-full dark:bg-primary-container/20 dark:text-primary-fixed">+4 this month</span>
</div>
<p className="text-on-surface-variant font-label-lg text-label-lg dark:text-secondary-fixed-dim">Total Staff</p>
<p className="text-on-surface font-headline-lg text-headline-lg mt-xs dark:text-surface-bright">248</p>
</div>

<div className="bg-surface-container-lowest p-md rounded-xl border border-outline-variant shadow-sm dark:bg-on-surface">
<div className="flex justify-between items-start mb-sm">
<div className="p-2 bg-secondary-container/20 rounded-lg dark:bg-secondary-container/10">
<span className="material-symbols-outlined text-secondary dark:text-secondary-fixed-dim">how_to_reg</span>
</div>
<span className="text-secondary font-label-md text-label-md bg-secondary-fixed px-2 py-0.5 rounded-full dark:bg-secondary-container/20 dark:text-secondary-fixed-dim">92% attendance</span>
</div>
<p className="text-on-surface-variant font-label-lg text-label-lg dark:text-secondary-fixed-dim">Present Today</p>
<p className="text-on-surface font-headline-lg text-headline-lg mt-xs dark:text-surface-bright">226</p>
</div>

<div className="bg-surface-container-lowest p-md rounded-xl border border-outline-variant shadow-sm dark:bg-on-surface">
<div className="flex justify-between items-start mb-sm">
<div className="p-2 bg-tertiary-container/20 rounded-lg dark:bg-tertiary-container/10">
<span className="material-symbols-outlined text-tertiary dark:text-tertiary-fixed-dim">event_busy</span>
</div>
</div>
<p className="text-on-surface-variant font-label-lg text-label-lg dark:text-secondary-fixed-dim">On Leave</p>
<p className="text-on-surface font-headline-lg text-headline-lg mt-xs dark:text-surface-bright">14</p>
</div>

<div className="bg-surface-container-lowest p-md rounded-xl border border-outline-variant shadow-sm dark:bg-on-surface">
<div className="flex justify-between items-start mb-sm">
<div className="p-2 bg-error-container/20 rounded-lg dark:bg-error-container/10">
<span className="material-symbols-outlined text-error">payments</span>
</div>
<span className="text-error font-label-md text-label-md bg-error-container px-2 py-0.5 rounded-full dark:bg-error-container/20">Due in 3 days</span>
</div>
<p className="text-on-surface-variant font-label-lg text-label-lg dark:text-secondary-fixed-dim">Payroll Due</p>
<p className="text-on-surface font-headline-lg text-headline-lg mt-xs dark:text-surface-bright">$142k</p>
</div>
</div>

<div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden dark:bg-on-surface">

<div className="flex px-lg pt-lg border-b border-outline-variant overflow-x-auto scrollbar-hide dark:border-outline">
<button className="px-md py-sm font-label-lg text-label-lg active-tab whitespace-nowrap transition-all" id="tab-directory" onClick={(e) => { switchTab('directory') }}>Staff Directory</button>
<button className="px-md py-sm font-label-lg text-label-lg text-on-surface-variant hover:text-primary whitespace-nowrap transition-all dark:text-secondary-fixed-dim dark:hover:text-primary-fixed" id="tab-attendance" onClick={(e) => { switchTab('attendance') }}>Attendance Calendar</button>
<button className="px-md py-sm font-label-lg text-label-lg text-on-surface-variant hover:text-primary whitespace-nowrap transition-all dark:text-secondary-fixed-dim dark:hover:text-primary-fixed" id="tab-payroll" onClick={(e) => { switchTab('payroll') }}>Payroll & Slip</button>
<button className="px-md py-sm font-label-lg text-label-lg text-on-surface-variant hover:text-primary whitespace-nowrap transition-all dark:text-secondary-fixed-dim dark:hover:text-primary-fixed" id="tab-leave" onClick={(e) => { switchTab('leave') }}>Leave Status</button>
<button className="px-md py-sm font-label-lg text-label-lg text-on-surface-variant hover:text-primary whitespace-nowrap transition-all dark:text-secondary-fixed-dim dark:hover:text-primary-fixed" id="tab-shift" onClick={(e) => { switchTab('shift') }}>Shift Assignments</button>
</div>

<div className="p-lg">

<div className="view-content block" id="view-directory">
<div className="flex flex-col sm:flex-row gap-md justify-between items-center mb-md">
<div className="flex gap-sm overflow-x-auto w-full sm:w-auto">
<select className="bg-surface-container-low border-outline-variant rounded-lg text-label-md font-label-md dark:bg-surface-container-highest/10 dark:text-surface-bright dark:border-outline">
<option>All Departments</option>
<option>Obstetrics</option>
<option>Pediatrics</option>
<option>Nursing</option>
<option>Admin</option>
</select>
<select className="bg-surface-container-low border-outline-variant rounded-lg text-label-md font-label-md dark:bg-surface-container-highest/10 dark:text-surface-bright dark:border-outline">
<option>Active Status</option>
<option>On Leave</option>
<option>Resigned</option>
</select>
</div>
</div>
<div className="overflow-x-auto">
<table className="w-full text-left">
<thead className="text-on-surface-variant border-b border-outline-variant dark:text-secondary-fixed-dim dark:border-outline">
<tr>
<th className="py-sm font-label-lg text-label-lg">Employee ID</th>
<th className="py-sm font-label-lg text-label-lg">Name</th>
<th className="py-sm font-label-lg text-label-lg">Department</th>
<th className="py-sm font-label-lg text-label-lg">Role</th>
<th className="py-sm font-label-lg text-label-lg">Status</th>
<th className="py-sm font-label-lg text-label-lg text-right">Action</th>
</tr>
</thead>
<tbody className="divide-y divide-outline-variant/30 dark:divide-outline/30">

<tr className="hover:bg-surface-container-low transition-colors group dark:hover:bg-surface-container-highest/5">
<td className="py-md font-body-md text-body-md">#MC-9082</td>
<td className="py-md">
<div className="flex items-center gap-sm">
<img alt="Dr. Anita" className="w-8 h-8 rounded-full object-cover" src="https://lh3.googleusercontent.com/aida/AP1WRLs5qLoYTqb68zAUfLjBMlWnHY08_OC-gulttwexacuNGNjqOWr5Nvi6wDwGLjeZBF2hhDLVx20Oq8ZxDurvpzTnoN3XJmT5KIOyNPNXPXPpo07CslSeo1q58Ulfe2d77aAxpB3tokZMgf6DxVmQAwgrRNmcPr3uA4i_CfDJsAvPhicGu0fYNpJeSB0EaSfMiim4S03oH_RqQcBqK4XkTrcAdP3-iSntrjXAAJv5F1CzxSZFUmffI7ANnefN"/>
<div>
<p className="font-label-lg text-label-lg text-on-surface dark:text-surface-bright">Dr. Anita Nair</p>
<p className="text-[10px] text-on-surface-variant dark:text-secondary-fixed-dim">anita.n@mothercare.com</p>
</div>
</div>
</td>
<td className="py-md font-body-md text-body-md">Obstetrics</td>
<td className="py-md font-body-md text-body-md">Sr. Consultant</td>
<td className="py-md">
<span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary uppercase dark:bg-primary-container/20 dark:text-primary-fixed">Active</span>
</td>
<td className="py-md text-right">
<div className="flex justify-end gap-xs opacity-0 group-hover:opacity-100 transition-opacity">
<button className="p-1 hover:bg-surface-container-highest rounded transition-colors dark:hover:bg-surface-container-highest/20" title="Download Payslip">
<span className="material-symbols-outlined text-[20px] text-primary dark:text-primary-fixed">receipt_long</span>
</button>
<button className="p-1 hover:bg-surface-container-highest rounded transition-colors dark:hover:bg-surface-container-highest/20">
<span className="material-symbols-outlined text-[20px] text-on-surface-variant">more_vert</span>
</button>
</div>
</td>
</tr>

<tr className="hover:bg-surface-container-low transition-colors group dark:hover:bg-surface-container-highest/5">
<td className="py-md font-body-md text-body-md">#MC-8541</td>
<td className="py-md">
<div className="flex items-center gap-sm">
<img alt="James" className="w-8 h-8 rounded-full object-cover" src="https://lh3.googleusercontent.com/aida/AP1WRLuIOgldlIQTMUJ9RH_WQ4YMi42Oro-y3otaRGBSj8flfMzA8gp4hO35jCnBfdRbYZNS2zmOhGcPhEI2ElVscrqQ4WcQGENw9A78uRqn5G0Uwaf4-kP2NPm84o4EqOKv8gmzyZkL6CtSahUxgM9dMx9iefPAp3r_w5rsUv41MtFL3XFyVuOr7THeCvwhD_F3fyYifZrD8zoGmgXTuwozykyyPJPckVIwl6qwwa2IKOuoGUHlAsO4VulDQSQC"/>
<div>
<p className="font-label-lg text-label-lg text-on-surface dark:text-surface-bright">James Wilson</p>
<p className="text-[10px] text-on-surface-variant dark:text-secondary-fixed-dim">james.w@mothercare.com</p>
</div>
</div>
</td>
<td className="py-md font-body-md text-body-md">Nursing</td>
<td className="py-md font-body-md text-body-md">Head Nurse</td>
<td className="py-md">
<span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-tertiary-fixed-dim/20 text-tertiary uppercase dark:bg-tertiary-container/20 dark:text-tertiary-fixed-dim">On Leave</span>
</td>
<td className="py-md text-right">
<div className="flex justify-end gap-xs opacity-0 group-hover:opacity-100 transition-opacity">
<button className="p-1 hover:bg-surface-container-highest rounded transition-colors dark:hover:bg-surface-container-highest/20" title="Download Payslip">
<span className="material-symbols-outlined text-[20px] text-primary dark:text-primary-fixed">receipt_long</span>
</button>
<button className="p-1 hover:bg-surface-container-highest rounded transition-colors dark:hover:bg-surface-container-highest/20">
<span className="material-symbols-outlined text-[20px] text-on-surface-variant">more_vert</span>
</button>
</div>
</td>
</tr>
</tbody>
</table>
</div>
</div>

<div className="view-content hidden" id="view-attendance">
<div className="flex items-center justify-between mb-md">
<h3 className="font-title-lg text-title-lg text-on-surface dark:text-surface-bright">October 2023</h3>
<div className="flex gap-sm">
<button className="p-1 rounded border border-outline-variant dark:border-outline hover:bg-surface-container-low dark:hover:bg-surface-container-highest/10"><span className="material-symbols-outlined">chevron_left</span></button>
<button className="p-1 rounded border border-outline-variant dark:border-outline hover:bg-surface-container-low dark:hover:bg-surface-container-highest/10"><span className="material-symbols-outlined">chevron_right</span></button>
</div>
</div>
<div className="grid grid-cols-7 gap-px bg-outline-variant dark:bg-outline border border-outline-variant dark:border-outline rounded-lg overflow-hidden">

<div className="bg-surface-container-low dark:bg-surface-container-highest/10 p-sm text-center font-label-md text-label-md">Sun</div>
<div className="bg-surface-container-low dark:bg-surface-container-highest/10 p-sm text-center font-label-md text-label-md">Mon</div>
<div className="bg-surface-container-low dark:bg-surface-container-highest/10 p-sm text-center font-label-md text-label-md">Tue</div>
<div className="bg-surface-container-low dark:bg-surface-container-highest/10 p-sm text-center font-label-md text-label-md">Wed</div>
<div className="bg-surface-container-low dark:bg-surface-container-highest/10 p-sm text-center font-label-md text-label-md">Thu</div>
<div className="bg-surface-container-low dark:bg-surface-container-highest/10 p-sm text-center font-label-md text-label-md">Fri</div>
<div className="bg-surface-container-low dark:bg-surface-container-highest/10 p-sm text-center font-label-md text-label-md">Sat</div>

<div className="bg-surface-container-lowest dark:bg-on-surface h-24 p-xs text-on-surface-variant opacity-50">28</div>
<div className="bg-surface-container-lowest dark:bg-on-surface h-24 p-xs text-on-surface-variant opacity-50">29</div>
<div className="bg-surface-container-lowest dark:bg-on-surface h-24 p-xs text-on-surface-variant opacity-50">30</div>
<div className="bg-surface-container-lowest dark:bg-on-surface h-24 p-xs font-bold">1</div>
<div className="bg-surface-container-lowest dark:bg-on-surface h-24 p-xs font-bold relative">2
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 w-full px-1">
<span className="w-2 h-2 bg-primary rounded-full"></span>
<span className="text-[8px] text-center truncate w-full">226 Present</span>
</div>
</div>
<div className="bg-surface-container-lowest dark:bg-on-surface h-24 p-xs font-bold">3</div>
<div className="bg-surface-container-lowest dark:bg-on-surface h-24 p-xs font-bold">4</div>

</div>
</div>

<div className="view-content hidden" id="view-payroll">
<div className="overflow-x-auto">
<table className="w-full text-left">
<thead className="text-on-surface-variant border-b border-outline-variant dark:text-secondary-fixed-dim dark:border-outline">
<tr>
<th className="py-sm font-label-lg text-label-lg">Name</th>
<th className="py-sm font-label-lg text-label-lg">Month</th>
<th className="py-sm font-label-lg text-label-lg">Salary</th>
<th className="py-sm font-label-lg text-label-lg">Net Salary</th>
<th className="py-sm font-label-lg text-label-lg text-right">Download Slip</th>
</tr>
</thead>
<tbody className="divide-y divide-outline-variant/30 dark:divide-outline/30">
<tr className="hover:bg-surface-container-low transition-colors dark:hover:bg-surface-container-highest/5">
<td className="py-md font-label-lg text-label-lg text-on-surface dark:text-surface-bright">Dr. Rahul Sharma</td>
<td className="py-md font-body-md text-body-md">October 2023</td>
<td className="py-md font-body-md text-body-md">$8,500.00</td>
<td className="py-md font-label-lg text-label-lg text-primary dark:text-primary-fixed">$8,850.00</td>
<td className="py-md text-right">
<button className="flex items-center gap-xs ml-auto px-md py-1 bg-surface-container-high dark:bg-surface-container-highest/10 rounded-lg text-label-md font-label-md hover:bg-primary hover:text-white transition-all">
<span className="material-symbols-outlined text-[18px]">download</span> PDF
    </button>
</td>
</tr>
</tbody>
</table>
</div>
</div>

<div className="view-content hidden" id="view-leave">
<div className="grid grid-cols-1 lg:grid-cols-2 gap-lg">
<div className="space-y-md">
<h3 className="font-title-lg text-title-lg text-on-surface dark:text-surface-bright">Pending Requests</h3>
<div className="bg-surface-container-low dark:bg-surface-container-highest/10 p-md rounded-lg border border-outline-variant dark:border-outline">
<div className="flex justify-between items-start mb-sm">
<div className="flex items-center gap-sm">
<img alt="Sarah" className="w-8 h-8 rounded-full" src="https://lh3.googleusercontent.com/aida/AP1WRLs-SCbLPq3uq7OofCFBs2h5olxdmJxEIPdoxv2rDEauk29m-pp6ngQ-yB8VEdPclzmPb_eAKqEdkznPpPzdbPfmGWgUlx8D0rCcCanN-g6VJHEVsgcUhQl2AhEU4XXQDNBOjBmWwcAQrfXl4EqiQO0evgrDyTq3oQoTgdt6aK1M5Jc6QIYSMi6XxloZWzJ8OSdjhjD8047YPiirVlZP5IB2BslPVncpPD_O4Jg2ubBkIlANNX5suXbxCjU"/>
<div>
<p className="font-label-lg text-on-surface dark:text-surface-bright">Sarah Lee</p>
<p className="text-label-md text-on-surface-variant">Sick Leave • 2 Days</p>
</div>
</div>
<span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-warning/10 text-orange-600 dark:text-orange-400 bg-orange-100 uppercase">Pending</span>
</div>
<div className="flex gap-sm mt-md">
<button className="flex-1 py-1.5 bg-primary text-on-primary rounded text-label-md">Approve</button>
<button className="flex-1 py-1.5 bg-surface-container-highest dark:bg-surface-container-highest/20 text-on-surface rounded text-label-md">Reject</button>
</div>
</div>
</div>
<div className="space-y-md">
<h3 className="font-title-lg text-title-lg text-on-surface dark:text-surface-bright">Upcoming Absences</h3>
<div className="space-y-sm">
<div className="flex items-center justify-between p-sm border-b border-outline-variant dark:border-outline">
<p className="text-label-lg">James Wilson</p>
<p className="text-label-md text-on-surface-variant">Oct 26 - Oct 30</p>
</div>
<div className="flex items-center justify-between p-sm border-b border-outline-variant dark:border-outline">
<p className="text-label-lg">Dr. Anita Nair</p>
<p className="text-label-md text-on-surface-variant">Nov 02 - Nov 05</p>
</div>
</div>
</div>
</div>
</div>

<div className="view-content hidden" id="view-shift">
<div className="flex justify-between items-center mb-lg">
<h3 className="font-title-lg text-title-lg text-on-surface dark:text-surface-bright">Shift Schedule: Oct 24, 2023</h3>
<button className="px-md py-1.5 bg-primary-container text-on-primary-container rounded-lg text-label-md font-label-md">Auto-Assign Shifts</button>
</div>
<div className="space-y-md">

<div className="bg-surface-container-low dark:bg-surface-container-highest/5 p-md rounded-xl border-l-4 border-primary">
<div className="flex justify-between items-center mb-sm">
<h4 className="font-label-lg text-primary">Morning Shift (07:00 - 15:00)</h4>
<span className="text-label-md text-on-surface-variant">12 Staff assigned</span>
</div>
<div className="flex flex-wrap gap-xs">
<img className="w-8 h-8 rounded-full border-2 border-surface" src="https://lh3.googleusercontent.com/aida/AP1WRLs5qLoYTqb68zAUfLjBMlWnHY08_OC-gulttwexacuNGNjqOWr5Nvi6wDwGLjeZBF2hhDLVx20Oq8ZxDurvpzTnoN3XJmT5KIOyNPNXPXPpo07CslSeo1q58Ulfe2d77aAxpB3tokZMgf6DxVmQAwgrRNmcPr3uA4i_CfDJsAvPhicGu0fYNpJeSB0EaSfMiim4S03oH_RqQcBqK4XkTrcAdP3-iSntrjXAAJv5F1CzxSZFUmffI7ANnefN"/>
<img className="w-8 h-8 rounded-full border-2 border-surface" src="https://lh3.googleusercontent.com/aida/AP1WRLvAWAppcVTmrpPwsj00OlcDfk4-CBcuXC-FZV78FkgGWWrPCNWd_ESupniPlw1fKTXC2UUugtNhxQ7fuP6FWJqxHkZh2mC6PSC3WVbhiXp4aHw7R8iK3a0xlq4PCz3kp8H23kCUxj_zuKtvKX3w0i_7JBKPOLFFyFh1XdRGSHAapUbTSNUPrZx-v2mIsqJB9T3Ow7gYxKvK-kHX4N_rnHOnFSt-_NWgGXWx51mGM8PP1-jL57gVsuLghtk"/>
<button className="w-8 h-8 rounded-full bg-surface-container-high dark:bg-surface-container-highest/20 flex items-center justify-center text-[18px]"><span className="material-symbols-outlined">add</span></button>
</div>
</div>

<div className="bg-surface-container-low dark:bg-surface-container-highest/5 p-md rounded-xl border-l-4 border-secondary">
<div className="flex justify-between items-center mb-sm">
<h4 className="font-label-lg text-secondary">Afternoon Shift (15:00 - 23:00)</h4>
<span className="text-label-md text-on-surface-variant">8 Staff assigned</span>
</div>
<div className="flex flex-wrap gap-xs">
<img className="w-8 h-8 rounded-full border-2 border-surface" src="https://lh3.googleusercontent.com/aida/AP1WRLuIOgldlIQTMUJ9RH_WQ4YMi42Oro-y3otaRGBSj8flfMzA8gp4hO35jCnBfdRbYZNS2zmOhGcPhEI2ElVscrqQ4WcQGENw9A78uRqn5G0Uwaf4-kP2NPm84o4EqOKv8gmzyZkL6CtSahUxgM9dMx9iefPAp3r_w5rsUv41MtFL3XFyVuOr7THeCvwhD_F3fyYifZrD8zoGmgXTuwozykyyPJPckVIwl6qwwa2IKOuoGUHlAsO4VulDQSQC"/>
<button className="w-8 h-8 rounded-full bg-surface-container-high dark:bg-surface-container-highest/20 flex items-center justify-center text-[18px]"><span className="material-symbols-outlined">add</span></button>
</div>
</div>

<div className="bg-surface-container-low dark:bg-surface-container-highest/5 p-md rounded-xl border-l-4 border-tertiary">
<div className="flex justify-between items-center mb-sm">
<h4 className="font-label-lg text-tertiary">Night Shift (23:00 - 07:00)</h4>
<span className="text-label-md text-on-surface-variant">5 Staff assigned</span>
</div>
<div className="flex flex-wrap gap-xs">
<button className="w-8 h-8 rounded-full bg-surface-container-high dark:bg-surface-container-highest/20 flex items-center justify-center text-[18px]"><span className="material-symbols-outlined">add</span></button>
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
