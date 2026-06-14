import { useNavigate } from 'react-router-dom'

export default function AppointmentsPage() {
  const navigate = useNavigate()

  const switchTab = (tab: string) => {
    console.log('Switching to tab:', tab)
  }

  return (
    <>


<div className="flex justify-between items-end mb-xl">
<div>
<h2 className="font-headline-lg text-headline-lg text-on-background dark:text-inverse-on-surface">Appointment Management</h2>
<p className="text-body-lg text-on-secondary-container dark:text-inverse-on-surface/70">Welcome back, Sarah. Here's what's happening today.</p>
</div>
<button className="bg-primary text-white px-lg py-sm rounded-lg flex items-center gap-base hover:opacity-90 active:scale-95 transition-all shadow-sm">
<span className="material-symbols-outlined text-[20px]">add</span>
<span className="font-label-lg text-label-lg">New Appointment</span>
</button>
</div>

<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter mb-xl">
<div className="bg-surface-container-lowest dark:bg-inverse-surface soft-shadow p-lg rounded-xl border border-outline-variant/10 flex items-center gap-lg">
<div className="w-14 h-14 rounded-full bg-primary-container/20 flex items-center justify-center text-primary dark:text-primary-fixed">
<span className="material-symbols-outlined !text-[32px]">event_note</span>
</div>
<div>
<p className="text-label-md text-on-surface-variant dark:text-inverse-on-surface/70 font-medium">Today's Appointments</p>
<h3 className="font-display-lg text-[32px] text-on-background dark:text-inverse-on-surface">48</h3>
</div>
</div>
<div className="bg-surface-container-lowest dark:bg-inverse-surface soft-shadow p-lg rounded-xl border border-outline-variant/10 flex items-center gap-lg">
<div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center text-green-700">
<span className="material-symbols-outlined !text-[32px]">check_circle</span>
</div>
<div>
<p className="text-label-md text-on-surface-variant dark:text-inverse-on-surface/70 font-medium">Completed</p>
<h3 className="font-display-lg text-[32px] text-on-background dark:text-inverse-on-surface">32</h3>
</div>
</div>
<div className="bg-surface-container-lowest dark:bg-inverse-surface soft-shadow p-lg rounded-xl border border-outline-variant/10 flex items-center gap-lg">
<div className="w-14 h-14 rounded-full bg-secondary-container flex items-center justify-center text-secondary">
<span className="material-symbols-outlined !text-[32px]">pending_actions</span>
</div>
<div>
<p className="text-label-md text-on-surface-variant dark:text-inverse-on-surface/70 font-medium">Pending</p>
<h3 className="font-display-lg text-[32px] text-on-background dark:text-inverse-on-surface">12</h3>
</div>
</div>
<div className="bg-surface-container-lowest dark:bg-inverse-surface soft-shadow p-lg rounded-xl border border-outline-variant/10 flex items-center gap-lg">
<div className="w-14 h-14 rounded-full bg-error-container/40 flex items-center justify-center text-error">
<span className="material-symbols-outlined !text-[32px]">cancel</span>
</div>
<div>
<p className="text-label-md text-on-surface-variant dark:text-inverse-on-surface/70 font-medium">Cancelled</p>
<h3 className="font-display-lg text-[32px] text-on-background dark:text-inverse-on-surface">4</h3>
</div>
</div>
</div>

<div className="bg-surface-container-lowest dark:bg-inverse-surface rounded-xl soft-shadow border border-outline-variant/10 overflow-hidden">

<div className="px-lg py-md border-b border-outline-variant/20 bg-surface-bright/50 dark:bg-white/5 space-y-md">
<div className="flex items-center justify-between">

<div className="flex gap-sm p-1 bg-surface-container dark:bg-white/10 rounded-lg">
<button className="px-md py-1.5 rounded-md text-label-md font-bold bg-white text-primary shadow-sm dark:bg-primary dark:text-white transition-all" id="listViewBtn">List View</button>
<button className="px-md py-1.5 rounded-md text-label-md font-bold text-on-surface-variant dark:text-inverse-on-surface/70 hover:text-on-surface dark:hover:text-inverse-on-surface transition-all" id="calendarViewBtn">Calendar View</button>
</div>
<div className="flex items-center gap-md">
<button className="p-1.5 rounded hover:bg-surface-container dark:hover:bg-white/10 transition-colors">
<span className="material-symbols-outlined text-[20px] text-on-surface-variant dark:text-inverse-on-surface/70">print</span>
</button>
<button className="p-1.5 rounded hover:bg-surface-container dark:hover:bg-white/10 transition-colors">
<span className="material-symbols-outlined text-[20px] text-on-surface-variant dark:text-inverse-on-surface/70">download</span>
</button>
</div>
</div>

<div className="flex flex-wrap items-center gap-md">
<div className="flex items-center gap-xs">
<span className="text-label-md text-on-surface-variant dark:text-inverse-on-surface/60 font-bold uppercase tracking-wider">Filters:</span>
</div>

<div className="relative min-w-[180px]">
<select className="w-full bg-surface-container-low dark:bg-white/5 border border-outline-variant/20 rounded-lg px-3 py-1.5 text-label-md focus:ring-1 focus:ring-primary dark:text-inverse-on-surface">
<option>All Doctors</option>
<option>Dr. Sarah Smith</option>
<option>Dr. Anil Mehra</option>
<option>Dr. Meera Iyer</option>
</select>
</div>

<div className="relative min-w-[150px]">
<input className="w-full bg-surface-container-low dark:bg-white/5 border border-outline-variant/20 rounded-lg px-3 py-1.5 text-label-md focus:ring-1 focus:ring-primary dark:text-inverse-on-surface" type="date" value="2023-10-25"/>
</div>

<div className="relative min-w-[180px]">
<select className="w-full bg-surface-container-low dark:bg-white/5 border border-outline-variant/20 rounded-lg px-3 py-1.5 text-label-md focus:ring-1 focus:ring-primary dark:text-inverse-on-surface">
<option>All Appointment Types</option>
<option>ANC Checkup</option>
<option>Ultrasound</option>
<option>Consultation</option>
<option>Follow-up</option>
</select>
</div>

<div className="relative min-w-[150px]">
<select className="w-full bg-surface-container-low dark:bg-white/5 border border-outline-variant/20 rounded-lg px-3 py-1.5 text-label-md focus:ring-1 focus:ring-primary dark:text-inverse-on-surface">
<option>All Statuses</option>
<option>Booked</option>
<option>Checked In</option>
<option>Consulted</option>
<option>Completed</option>
<option>Cancelled</option>
</select>
</div>
<button className="text-primary dark:text-primary-fixed text-label-md font-bold hover:underline">Clear All</button>
</div>
</div>

<div className="overflow-x-auto" id="tableView">
<table className="w-full text-left border-collapse">
<thead>
<tr className="bg-surface-container-low/30 dark:bg-white/5 text-on-surface-variant dark:text-inverse-on-surface/70 text-label-md border-b border-outline-variant/10">
<th className="px-lg py-md font-bold">TOKEN</th>
<th className="px-lg py-md font-bold">PATIENT NAME</th>
<th className="px-lg py-md font-bold">DOCTOR</th>
<th className="px-lg py-md font-bold">TIME</th>
<th className="px-lg py-md font-bold">TYPE</th>
<th className="px-lg py-md font-bold">STATUS</th>
<th className="px-lg py-md font-bold text-right">ACTIONS</th>
</tr>
</thead>
<tbody className="divide-y divide-outline-variant/10">

<tr className="hover:bg-surface-container-low/20 dark:hover:bg-white/5 transition-colors group">
<td className="px-lg py-md font-bold text-primary dark:text-primary-fixed">#101</td>
<td className="px-lg py-md">
<div className="flex items-center gap-sm">
<div className="w-8 h-8 rounded-full bg-tertiary-fixed flex items-center justify-center text-tertiary text-[10px] font-bold">AM</div>
<span className="font-medium dark:text-inverse-on-surface">Aditi Malhotra</span>
</div>
</td>
<td className="px-lg py-md text-on-secondary-container dark:text-inverse-on-surface/70">Dr. Sarah Smith</td>
<td className="px-lg py-md font-medium dark:text-inverse-on-surface">09:30 AM</td>
<td className="px-lg py-md"><span className="text-label-md px-2 py-0.5 bg-surface-container-high dark:bg-white/10 text-on-surface-variant dark:text-inverse-on-surface/70 rounded">ANC Checkup</span></td>
<td className="px-lg py-md">
<span className="text-[10px] font-bold uppercase tracking-widest px-sm py-1 rounded-full bg-secondary-container text-on-secondary-fixed-variant">Checked In</span>
</td>
<td className="px-lg py-md text-right">
<div className="flex justify-end gap-xs opacity-0 group-hover:opacity-100 transition-opacity">
<button className="p-1 text-primary hover:bg-primary/10 rounded"><span className="material-symbols-outlined text-[20px]">visibility</span></button>
<button className="p-1 text-secondary hover:bg-secondary/10 rounded"><span className="material-symbols-outlined text-[20px]">edit_calendar</span></button>
</div>
</td>
</tr>

<tr className="hover:bg-surface-container-low/20 dark:hover:bg-white/5 transition-colors group">
<td className="px-lg py-md font-bold text-primary dark:text-primary-fixed">#102</td>
<td className="px-lg py-md">
<div className="flex items-center gap-sm">
<div className="w-8 h-8 rounded-full bg-surface-dim flex items-center justify-center text-on-surface text-[10px] font-bold">PK</div>
<span className="font-medium dark:text-inverse-on-surface">Priya Kapoor</span>
</div>
</td>
<td className="px-lg py-md text-on-secondary-container dark:text-inverse-on-surface/70">Dr. Anil Mehra</td>
<td className="px-lg py-md font-medium dark:text-inverse-on-surface">10:15 AM</td>
<td className="px-lg py-md"><span className="text-label-md px-2 py-0.5 bg-surface-container-high dark:bg-white/10 text-on-surface-variant dark:text-inverse-on-surface/70 rounded">Ultrasound</span></td>
<td className="px-lg py-md">
<span className="text-[10px] font-bold uppercase tracking-widest px-sm py-1 rounded-full bg-blue-100 text-blue-700">Booked</span>
</td>
<td className="px-lg py-md text-right">
<div className="flex justify-end gap-xs opacity-0 group-hover:opacity-100 transition-opacity">
<button className="p-1 text-primary hover:bg-primary/10 rounded"><span className="material-symbols-outlined text-[20px]">visibility</span></button>
</div>
</td>
</tr>

<tr className="hover:bg-surface-container-low/20 dark:hover:bg-white/5 transition-colors group">
<td className="px-lg py-md font-bold text-primary dark:text-primary-fixed">#103</td>
<td className="px-lg py-md">
<div className="flex items-center gap-sm">
<div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center text-primary text-[10px] font-bold">SN</div>
<span className="font-medium dark:text-inverse-on-surface">Sonal Nayak</span>
</div>
</td>
<td className="px-lg py-md text-on-secondary-container dark:text-inverse-on-surface/70">Dr. Sarah Smith</td>
<td className="px-lg py-md font-medium dark:text-inverse-on-surface">10:45 AM</td>
<td className="px-lg py-md"><span className="text-label-md px-2 py-0.5 bg-surface-container-high dark:bg-white/10 text-on-surface-variant dark:text-inverse-on-surface/70 rounded">Consultation</span></td>
<td className="px-lg py-md">
<span className="text-[10px] font-bold uppercase tracking-widest px-sm py-1 rounded-full bg-orange-100 text-orange-700">Consulted</span>
</td>
<td className="px-lg py-md text-right">
<div className="flex justify-end gap-xs opacity-0 group-hover:opacity-100 transition-opacity">
<button className="p-1 text-primary hover:bg-primary/10 rounded"><span className="material-symbols-outlined text-[20px]">visibility</span></button>
</div>
</td>
</tr>

<tr className="hover:bg-surface-container-low/20 dark:hover:bg-white/5 transition-colors group">
<td className="px-lg py-md font-bold text-primary dark:text-primary-fixed">#104</td>
<td className="px-lg py-md">
<div className="flex items-center gap-sm">
<div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-pink-700 text-[10px] font-bold">RR</div>
<span className="font-medium dark:text-inverse-on-surface">Roshni Rai</span>
</div>
</td>
<td className="px-lg py-md text-on-secondary-container dark:text-inverse-on-surface/70">Dr. Meera Iyer</td>
<td className="px-lg py-md font-medium dark:text-inverse-on-surface">11:30 AM</td>
<td className="px-lg py-md"><span className="text-label-md px-2 py-0.5 bg-surface-container-high dark:bg-white/10 text-on-surface-variant dark:text-inverse-on-surface/70 rounded">GDM Screen</span></td>
<td className="px-lg py-md">
<span className="text-[10px] font-bold uppercase tracking-widest px-sm py-1 rounded-full bg-green-100 text-green-700">Completed</span>
</td>
<td className="px-lg py-md text-right">
<div className="flex justify-end gap-xs opacity-0 group-hover:opacity-100 transition-opacity">
<button className="p-1 text-primary hover:bg-primary/10 rounded"><span className="material-symbols-outlined text-[20px]">visibility</span></button>
</div>
</td>
</tr>

<tr className="hover:bg-surface-container-low/20 dark:hover:bg-white/5 transition-colors group">
<td className="px-lg py-md font-bold text-primary dark:text-primary-fixed">#105</td>
<td className="px-lg py-md">
<div className="flex items-center gap-sm">
<div className="w-8 h-8 rounded-full bg-error-container flex items-center justify-center text-error text-[10px] font-bold">JV</div>
<span className="font-medium dark:text-inverse-on-surface">Janvi Verma</span>
</div>
</td>
<td className="px-lg py-md text-on-secondary-container dark:text-inverse-on-surface/70">Dr. Sarah Smith</td>
<td className="px-lg py-md font-medium dark:text-inverse-on-surface">12:15 PM</td>
<td className="px-lg py-md"><span className="text-label-md px-2 py-0.5 bg-surface-container-high dark:bg-white/10 text-on-surface-variant dark:text-inverse-on-surface/70 rounded">Follow-up</span></td>
<td className="px-lg py-md">
<span className="text-[10px] font-bold uppercase tracking-widest px-sm py-1 rounded-full bg-error-container text-error">Cancelled</span>
</td>
<td className="px-lg py-md text-right">
<div className="flex justify-end gap-xs opacity-0 group-hover:opacity-100 transition-opacity">
<button className="p-1 text-primary hover:bg-primary/10 rounded"><span className="material-symbols-outlined text-[20px]">visibility</span></button>
</div>
</td>
</tr>
</tbody>
</table>
</div>

<div className="hidden p-lg flex flex-col items-center justify-center text-center space-y-md min-h-[500px] dark:text-inverse-on-surface" id="calendarView">
<div className="w-20 h-20 bg-surface-container-low dark:bg-white/5 rounded-full flex items-center justify-center text-outline-variant">
<span className="material-symbols-outlined !text-[48px]">calendar_month</span>
</div>
<div>
<h4 className="font-title-lg text-title-lg">Monthly Schedule View</h4>
<p className="text-on-secondary-container dark:text-inverse-on-surface/70 max-w-sm mx-auto">Interactive calendar interface for managing complex scheduling. View slots by doctor or ward.</p>
</div>
</div>

<div className="px-lg py-md border-t border-outline-variant/10 flex items-center justify-between text-label-md text-on-surface-variant dark:text-inverse-on-surface/60">
<p>Showing <span className="font-bold text-on-surface dark:text-inverse-on-surface">5</span> of <span className="font-bold text-on-surface dark:text-inverse-on-surface">48</span> appointments</p>
<div className="flex items-center gap-base">
<button className="p-1 hover:bg-surface-container dark:hover:bg-white/10 rounded disabled:opacity-30" disabled={true}>
<span className="material-symbols-outlined text-[20px]">chevron_left</span>
</button>
<div className="flex gap-xs">
<button className="w-8 h-8 rounded bg-primary text-white font-bold">1</button>
<button className="w-8 h-8 rounded hover:bg-surface-container dark:hover:bg-white/10 transition-colors">2</button>
<button className="w-8 h-8 rounded hover:bg-surface-container dark:hover:bg-white/10 transition-colors">3</button>
</div>
<button className="p-1 hover:bg-surface-container dark:hover:bg-white/10 rounded">
<span className="material-symbols-outlined text-[20px]">chevron_right</span>
</button>
</div>
</div>
</div>

<div className="mt-xl grid grid-cols-1 lg:grid-cols-3 gap-gutter">
<div className="lg:col-span-2 bg-surface-container-lowest dark:bg-inverse-surface rounded-xl soft-shadow border border-outline-variant/10 p-lg">
<h4 className="font-title-lg text-title-lg mb-lg flex items-center gap-sm dark:text-inverse-on-surface">
<span className="material-symbols-outlined text-primary dark:text-primary-fixed">medical_services</span>
                Doctor Availability Today
            </h4>
<div className="grid grid-cols-1 md:grid-cols-2 gap-md">
<div className="flex items-center justify-between p-md border border-outline-variant/20 rounded-lg dark:bg-white/5">
<div className="flex items-center gap-md">
<img alt="Doctor 1" className="w-12 h-12 rounded-lg object-cover" src="https://lh3.googleusercontent.com/aida/AP1WRLvZLc2qFUIoEnk5jdYAbxAWPdnzGiolZcuJkFgbXpCMl2BMiK_a3d05lBGz3tyiKoKgcXB0b3Dwm2g4AF7quInp3SXzrm9LaXlt_C5UgswFqhRqz6iUrCt25y-bRwpbJWIL4VH4_4zsspAiKLwOfhHaKdbqJxOdsUHbq1mbuO5nfGX9xmeXh-stfMMRE3HfuNz7ajSqZGC78YYwLDL9i8voMvF-RKdGcDbmqtG-VEO8J5fDtZPsEClBheQ"/>
<div>
<p className="font-bold dark:text-inverse-on-surface">Dr. Sarah Smith</p>
<p className="text-label-md text-primary dark:text-primary-fixed">On Duty • OPD 02</p>
</div>
</div>
<div className="text-right">
<p className="text-label-md text-on-surface-variant dark:text-inverse-on-surface/60">Next Slot</p>
<p className="font-medium dark:text-inverse-on-surface">12:30 PM</p>
</div>
</div>
<div className="flex items-center justify-between p-md border border-outline-variant/20 rounded-lg dark:bg-white/5 opacity-60">
<div className="flex items-center gap-md">
<img alt="Doctor 2" className="w-12 h-12 rounded-lg object-cover" src="https://lh3.googleusercontent.com/aida/AP1WRLtCyA7QLOB4WOyJPnpaO1b1wmoQcHT-V_THo-S9YF4kQnQEYEsAOlAS8emno8witgXbCDE4bHn43WLLCLiYaKdvdxr-ErD6alf1VDlSbmgebbHGMpAK0umgxh2YCEBAkmRKkAMI4ax3IqrjQ_ICXveHiRzSapPpWDb32XR_LRk0MtQlRKAsB2xYvpklXDlclJw2737Z__eCT_agiiTYmaexWK30ZIBaHUzGhdSgvj9SzoeTi6lhuLzuczc"/>
<div>
<p className="font-bold dark:text-inverse-on-surface">Dr. Anil Mehra</p>
<p className="text-label-md text-on-surface-variant dark:text-inverse-on-surface/60">On Leave</p>
</div>
</div>
<div className="text-right">
<p className="text-label-md text-on-surface-variant dark:text-inverse-on-surface/60">Status</p>
<p className="font-medium text-error">Away</p>
</div>
</div>
</div>
</div>
<div className="bg-primary text-white rounded-xl soft-shadow p-lg flex flex-col justify-between overflow-hidden relative">
<div className="relative z-10">
<h4 className="font-title-lg text-title-lg mb-base">Weekly Summary</h4>
<p className="text-on-primary-container opacity-80 text-body-md mb-xl">Excellent! Appointment completion rate is up by 12% compared to last week.</p>
<div className="space-y-md">
<div className="flex justify-between items-end">
<span className="text-label-md">Goal: 500/week</span>
<span className="font-bold">88%</span>
</div>
<div className="h-2 bg-white/20 rounded-full overflow-hidden">
<div className="h-full bg-white rounded-full" style={{width: '88%'}}></div>
</div>
</div>
</div>
<span className="material-symbols-outlined !text-[120px] absolute -bottom-4 -right-4 opacity-10 rotate-12">trending_up</span>
</div>
</div>

    </>
  )
}
