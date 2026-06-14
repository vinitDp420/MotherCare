import { useNavigate } from 'react-router-dom'

export default function AdmissionsPage() {
  const navigate = useNavigate()

  const switchTab = (tab: string) => {
    console.log('Switching to tab:', tab)
  }

  return (
    <>


<div className="flex justify-between items-end mb-lg">
<div>
<h1 className="font-headline-lg text-headline-lg text-on-surface dark:text-surface-bright">Admission Management</h1>
<p className="text-on-surface-variant dark:text-surface-variant font-body-md">Manage maternal patient intake and ward assignments</p>
</div>
<div className="flex gap-md">
<button className="flex items-center gap-xs px-lg py-md bg-primary text-on-primary rounded-lg font-label-lg hover:shadow-lg transition-all active:opacity-80">
<span className="material-symbols-outlined">add</span>
                    New Admission
                </button>
</div>
</div>

<div className="grid grid-cols-1 md:grid-cols-4 gap-gutter mb-xl">
<div className="bg-surface-container-lowest dark:bg-inverse-surface p-md rounded-xl border border-outline-variant dark:border-outline/30 shadow-sm hover:shadow-md transition-all">
<div className="flex justify-between items-start mb-sm">
<div className="p-xs bg-primary-container/10 rounded-lg text-primary dark:text-primary-fixed">
<span className="material-symbols-outlined">person_add</span>
</div>
<span className="text-label-md font-bold text-primary dark:text-primary-fixed">+12%</span>
</div>
<p className="text-on-surface-variant dark:text-surface-variant font-label-md uppercase tracking-wider">Active Admissions</p>
<h2 className="text-headline-lg font-headline-lg mt-xs dark:text-surface-bright">142</h2>
</div>
<div className="bg-surface-container-lowest dark:bg-inverse-surface p-md rounded-xl border border-outline-variant dark:border-outline/30 shadow-sm hover:shadow-md transition-all">
<div className="flex justify-between items-start mb-sm">
<div className="p-xs bg-secondary-container/20 rounded-lg text-secondary dark:text-secondary-fixed">
<span className="material-symbols-outlined">today</span>
</div>
<span className="text-label-md font-bold text-secondary dark:text-secondary-fixed">Today</span>
</div>
<p className="text-on-surface-variant dark:text-surface-variant font-label-md uppercase tracking-wider">Today's Admissions</p>
<h2 className="text-headline-lg font-headline-lg mt-xs dark:text-surface-bright">28</h2>
</div>
<div className="bg-surface-container-lowest dark:bg-inverse-surface p-md rounded-xl border border-outline-variant dark:border-outline/30 shadow-sm hover:shadow-md transition-all">
<div className="flex justify-between items-start mb-sm">
<div className="p-xs bg-tertiary-container/10 rounded-lg text-tertiary dark:text-tertiary-fixed">
<span className="material-symbols-outlined">logout</span>
</div>
<span className="text-label-md font-bold text-tertiary dark:text-tertiary-fixed">8 Pending</span>
</div>
<p className="text-on-surface-variant dark:text-surface-variant font-label-md uppercase tracking-wider">Pending Discharges</p>
<h2 className="text-headline-lg font-headline-lg mt-xs dark:text-surface-bright">14</h2>
</div>
<div className="bg-surface-container-lowest dark:bg-inverse-surface p-md rounded-xl border border-outline-variant dark:border-outline/30 shadow-sm hover:shadow-md transition-all">
<div className="flex justify-between items-start mb-sm">
<div className="p-xs bg-error-container/20 rounded-lg text-error">
<span className="material-symbols-outlined">e911_emergency</span>
</div>
<span className="text-label-md font-bold text-error">Critical</span>
</div>
<p className="text-on-surface-variant dark:text-surface-variant font-label-md uppercase tracking-wider">Emergency Admissions</p>
<h2 className="text-headline-lg font-headline-lg mt-xs dark:text-surface-bright">05</h2>
</div>
</div>
<div className="grid grid-cols-12 gap-gutter">

<div className="col-span-12 lg:col-span-4">
<div className="bg-surface-container-lowest dark:bg-inverse-surface rounded-xl border border-outline-variant dark:border-outline/30 shadow-sm overflow-hidden sticky top-24 transition-all">
<div className="p-md bg-surface-container-low dark:bg-on-surface-variant/10 border-b border-outline-variant dark:border-outline/30">
<h3 className="font-title-lg text-title-lg flex items-center gap-xs dark:text-surface-bright">
<span className="material-symbols-outlined text-primary dark:text-primary-fixed">edit_note</span>
                            Admission Intake
                        </h3>
</div>
<form className="p-md space-y-md">
<div>
<label className="block text-label-md font-semibold text-on-surface-variant dark:text-surface-variant mb-xs">Patient Search</label>
<div className="relative">
<span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-on-surface-variant dark:text-surface-variant">search</span>
<input className="w-full pl-xl pr-md py-sm bg-surface-container-low dark:bg-on-surface-variant/5 border border-outline-variant dark:border-outline/50 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-body-md dark:text-surface-bright" placeholder="Enter Patient Name or ID" type="text"/>
</div>
</div>
<div className="grid grid-cols-2 gap-sm">
<div>
<label className="block text-label-md font-semibold text-on-surface-variant dark:text-surface-variant mb-xs">Assigned Doctor</label>
<select className="w-full py-sm px-sm bg-surface-container-low dark:bg-on-surface-variant/5 border border-outline-variant dark:border-outline/50 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-body-md dark:text-surface-bright">
<option>Dr. Anjali Sharma</option>
<option>Dr. Sarah Miller</option>
<option>Dr. Robert Chen</option>
</select>
</div>
<div>
<label className="block text-label-md font-semibold text-on-surface-variant dark:text-surface-variant mb-xs">Admission Type</label>
<select className="w-full py-sm px-sm bg-surface-container-low dark:bg-on-surface-variant/5 border border-outline-variant dark:border-outline/50 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-body-md dark:text-surface-bright">
<option>Maternity</option>
<option>Post-Natal</option>
<option>Emergency</option>
<option>Surgery</option>
</select>
</div>
</div>
<div className="grid grid-cols-2 gap-sm">
<div>
<label className="block text-label-md font-semibold text-on-surface-variant dark:text-surface-variant mb-xs">Room Type</label>
<select className="w-full py-sm px-sm bg-surface-container-low dark:bg-on-surface-variant/5 border border-outline-variant dark:border-outline/50 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-body-md dark:text-surface-bright">
<option>Deluxe Suite</option>
<option>Private</option>
<option>Semi-Private</option>
<option>General Ward</option>
</select>
</div>
<div>
<label className="block text-label-md font-semibold text-on-surface-variant dark:text-surface-variant mb-xs">Bed Selection</label>
<select className="w-full py-sm px-sm bg-surface-container-low dark:bg-on-surface-variant/5 border border-outline-variant dark:border-outline/50 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-body-md dark:text-surface-bright">
<option>A-102</option>
<option>A-105</option>
<option>B-201</option>
</select>
</div>
</div>
<div>
<label className="block text-label-md font-semibold text-on-surface-variant dark:text-surface-variant mb-xs">Reason for Admission</label>
<textarea className="w-full p-sm bg-surface-container-low dark:bg-on-surface-variant/5 border border-outline-variant dark:border-outline/50 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-body-md dark:text-surface-bright" placeholder="Clinical notes and reasons..." rows={3}></textarea>
</div>
<div>
<label className="block text-label-md font-semibold text-on-surface-variant dark:text-surface-variant mb-xs">Expected Discharge Date</label>
<input className="w-full p-sm bg-surface-container-low dark:bg-on-surface-variant/5 border border-outline-variant dark:border-outline/50 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-body-md dark:text-surface-bright" type="date"/>
</div>
<button className="w-full py-md bg-primary text-on-primary rounded-lg font-bold hover:shadow-lg transition-all active:scale-[0.98]" type="submit">
                            Complete Admission
                        </button>
</form>
</div>
</div>

<div className="col-span-12 lg:col-span-8">
<div className="bg-surface-container-lowest dark:bg-inverse-surface rounded-xl border border-outline-variant dark:border-outline/30 shadow-sm overflow-hidden transition-all">
<div className="p-md flex justify-between items-center border-b border-outline-variant dark:border-outline/30">
<h3 className="font-title-lg text-title-lg dark:text-surface-bright">Active Admissions List</h3>
<div className="flex gap-sm">
<button className="p-xs hover:bg-surface-container-low dark:hover:bg-on-surface-variant/10 rounded-lg transition-colors border border-outline-variant dark:border-outline/50">
<span className="material-symbols-outlined dark:text-surface-variant">filter_list</span>
</button>
<button className="p-xs hover:bg-surface-container-low dark:hover:bg-on-surface-variant/10 rounded-lg transition-colors border border-outline-variant dark:border-outline/50">
<span className="material-symbols-outlined dark:text-surface-variant">file_download</span>
</button>
</div>
</div>
<div className="overflow-x-auto">
<table className="w-full text-left border-collapse">
<thead className="bg-surface-container-low dark:bg-on-surface-variant/10 text-on-surface-variant dark:text-surface-variant font-label-lg uppercase tracking-wider text-[11px]">
<tr>
<th className="px-md py-sm">Patient</th>
<th className="px-md py-sm">Room/Bed</th>
<th className="px-md py-sm">Primary Doctor</th>
<th className="px-md py-sm">Admission Date</th>
<th className="px-md py-sm">Status</th>
<th className="px-md py-sm text-right">Actions</th>
</tr>
</thead>
<tbody className="divide-y divide-outline-variant dark:divide-outline/30">

<tr className="hover:bg-primary-container/5 transition-colors group">
<td className="px-md py-md">
<div className="flex items-center gap-sm">
<div className="relative">
<img alt="Patient" className="w-10 h-10 rounded-full object-cover" src="https://lh3.googleusercontent.com/aida/AP1WRLuaSIzoZIkMw-By-cxpnBXe-Ouxsqky8hn09LshQhUYVswx3vNiFqH-uWCzP4ORkMK7NYOekHMYy8FC_iyJLBV5AnCzAczu2cQTbHveeYPD0qOYV4h3yuSgN6T--uC9c_ZkeZV3T8B4yUWZJqn3ZWVOsEt-OK3pcfeeMJ723v78Gm1vmBFxpoxPHNG0dBAiNUXgXguouCdOqrU8tOGTAe71C_7l65Xq82ldpKAEXTIE7A4slQphDREo2HH2"/>
<span className="absolute -top-1 -right-1 flex h-4 w-4" title="Emergency Admission">
<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75"></span>
<span className="relative inline-flex rounded-full h-4 w-4 bg-error text-[10px] text-white items-center justify-center font-bold">!</span>
</span>
</div>
<div>
<p className="font-label-lg text-on-surface dark:text-surface-bright">Elena Rodriguez</p>
<p className="text-label-md text-on-surface-variant dark:text-surface-variant">ID: #MC-2934</p>
</div>
</div>
</td>
<td className="px-md py-md">
<p className="font-label-lg text-on-surface dark:text-surface-bright">Suite 402</p>
<p className="text-label-md text-on-surface-variant dark:text-surface-variant">Bed A</p>
</td>
<td className="px-md py-md text-on-surface dark:text-surface-bright font-body-md">Dr. Anjali Sharma</td>
<td className="px-md py-md">
<p className="text-body-md text-on-surface dark:text-surface-bright">Oct 24, 2023</p>
<p className="text-label-md text-on-surface-variant dark:text-surface-variant">09:15 AM</p>
</td>
<td className="px-md py-md">
<span className="px-sm py-xs bg-primary-container/10 text-primary dark:text-primary-fixed rounded-full text-label-md font-bold">Active</span>
</td>
<td className="px-md py-md text-right">
<div className="flex justify-end gap-xs opacity-0 group-hover:opacity-100 transition-opacity">
<button className="p-1 hover:bg-surface-container-high dark:hover:bg-on-surface-variant/20 rounded text-secondary-fixed-dim hover:text-primary transition-colors" title="Transfer Patient">
<span className="material-symbols-outlined text-[20px]">move_up</span>
</button>
<button className="p-1 hover:bg-surface-container-high dark:hover:bg-on-surface-variant/20 rounded text-secondary-fixed-dim hover:text-tertiary transition-colors" title="Discharge">
<span className="material-symbols-outlined text-[20px]">door_open</span>
</button>
<button className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors cursor-pointer">more_vert</button>
</div>
</td>
</tr>

<tr className="bg-secondary-container/5 hover:bg-primary-container/5 transition-colors group">
<td className="px-md py-md">
<div className="flex items-center gap-sm">
<img alt="Patient" className="w-10 h-10 rounded-full object-cover" src="https://lh3.googleusercontent.com/aida/AP1WRLsBMK8CsicJqIzO-xw9gBCIVV8SEcJtlqYH6-seSkRuxWKV7UVQKxFSoPPkJdFRH6CXMiVjQYCX6lbH1TiP2d9Qo1Nl3NHI_O_diWgLm4H4s1JSOUq53VVjq-I_ZDzsOJZFdYN7jzjJhdT8LIO4oA68Rp8Xi0GL-amDeZjuaFBAyO0KTA4W6CxvbHs5OblXbH4g0p2WZYMbX9P0GKDx951uabFa3PWUt0uBe1ZJv4nonMh7lCc9Pc4BEWHB"/>
<div>
<p className="font-label-lg text-on-surface dark:text-surface-bright">Sarah Jenkins</p>
<p className="text-label-md text-on-surface-variant dark:text-surface-variant">ID: #MC-2182</p>
</div>
</div>
</td>
<td className="px-md py-md">
<p className="font-label-lg text-on-surface dark:text-surface-bright">Private 201</p>
<p className="text-label-md text-on-surface-variant dark:text-surface-variant">Bed B</p>
</td>
<td className="px-md py-md text-on-surface dark:text-surface-bright font-body-md">Dr. Sarah Miller</td>
<td className="px-md py-md">
<p className="text-body-md text-on-surface dark:text-surface-bright">Oct 22, 2023</p>
<p className="text-label-md text-on-surface-variant dark:text-surface-variant">11:45 PM</p>
</td>
<td className="px-md py-md">
<span className="px-sm py-xs bg-tertiary-container/10 text-tertiary dark:text-tertiary-fixed rounded-full text-label-md font-bold">Discharge Pending</span>
</td>
<td className="px-md py-md text-right">
<div className="flex justify-end gap-xs opacity-0 group-hover:opacity-100 transition-opacity">
<button className="flex items-center gap-xs px-sm py-xs bg-tertiary text-on-tertiary rounded font-label-md hover:bg-tertiary-container transition-all" title="Complete Discharge">
                                                Discharge
                                            </button>
</div>
</td>
</tr>

<tr className="hover:bg-primary-container/5 transition-colors group">
<td className="px-md py-md">
<div className="flex items-center gap-sm">
<div className="w-10 h-10 rounded-full bg-surface-container-high dark:bg-on-surface-variant/20 flex items-center justify-center text-on-surface-variant dark:text-surface-variant">
<span className="material-symbols-outlined">person</span>
</div>
<div>
<p className="font-label-lg text-on-surface dark:text-surface-bright">Meera Kapoor</p>
<p className="text-label-md text-on-surface-variant dark:text-surface-variant">ID: #MC-3041</p>
</div>
</div>
</td>
<td className="px-md py-md">
<p className="font-label-lg text-on-surface dark:text-surface-bright">General 12</p>
<p className="text-label-md text-on-surface-variant dark:text-surface-variant">Bed 4</p>
</td>
<td className="px-md py-md text-on-surface dark:text-surface-bright font-body-md">Dr. Robert Chen</td>
<td className="px-md py-md">
<p className="text-body-md text-on-surface dark:text-surface-bright">Oct 24, 2023</p>
<p className="text-label-md text-on-surface-variant dark:text-surface-variant">02:30 AM</p>
</td>
<td className="px-md py-md">
<span className="px-sm py-xs bg-error-container/20 text-error rounded-full text-label-md font-bold">Transferred</span>
</td>
<td className="px-md py-md text-right">
<button className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors cursor-pointer">more_vert</button>
</td>
</tr>

<tr className="bg-secondary-container/5 hover:bg-primary-container/5 transition-colors group">
<td className="px-md py-md">
<div className="flex items-center gap-sm">
<img alt="Patient" className="w-10 h-10 rounded-full object-cover" src="https://lh3.googleusercontent.com/aida/AP1WRLsPUGjRjEMXWMYc8CK9Hha9-GReLbgTuQSBsOFXQLxvKOOLzrtCN3annENn1s98o7pX-m7YG22wOgYhIdtwFR40uHYWdOcaBnL5_7A_SoK2Exm6uAyeu6Brs7gjR5pVE_voPB-U5Ct8aUMzONeCtens0AZVbyyKBCq2YfBgwozhwynfIO9YC1gDl1GthpTWhm8CE7fa86DuYsYmKbsJvuSDzyxCgGfvdBUjy4BF9POIKAwJosZpEAyH7VPS"/>
<div>
<p className="font-label-lg text-on-surface dark:text-surface-bright">Jessica Thompson</p>
<p className="text-label-md text-on-surface-variant dark:text-surface-variant">ID: #MC-2884</p>
</div>
</div>
</td>
<td className="px-md py-md">
<p className="font-label-lg text-on-surface dark:text-surface-bright">Deluxe 505</p>
<p className="text-label-md text-on-surface-variant dark:text-surface-variant">Bed A</p>
</td>
<td className="px-md py-md text-on-surface dark:text-surface-bright font-body-md">Dr. Anjali Sharma</td>
<td className="px-md py-md">
<p className="text-body-md text-on-surface dark:text-surface-bright">Oct 20, 2023</p>
<p className="text-label-md text-on-surface-variant dark:text-surface-variant">10:00 AM</p>
</td>
<td className="px-md py-md">
<span className="px-sm py-xs bg-secondary-container/50 text-on-secondary-container dark:text-secondary-fixed-dim rounded-full text-label-md font-bold">Discharged</span>
</td>
<td className="px-md py-md text-right">
<button className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors cursor-pointer">more_vert</button>
</td>
</tr>
</tbody>
</table>
</div>
<div className="p-md flex justify-between items-center bg-surface-container-low dark:bg-on-surface-variant/10 border-t border-outline-variant dark:border-outline/30">
<p className="text-label-md text-on-surface-variant dark:text-surface-variant">Showing 4 of 142 admissions</p>
<div className="flex gap-xs">
<button className="w-8 h-8 flex items-center justify-center rounded-lg border border-outline-variant dark:border-outline/50 hover:bg-surface-container-high dark:hover:bg-on-surface-variant/20 transition-colors">
<span className="material-symbols-outlined text-[18px] dark:text-surface-variant">chevron_left</span>
</button>
<button className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary text-on-primary font-bold text-label-md">1</button>
<button className="w-8 h-8 flex items-center justify-center rounded-lg border border-outline-variant dark:border-outline/50 hover:bg-surface-container-high dark:hover:bg-on-surface-variant/20 transition-colors text-label-md dark:text-surface-variant">2</button>
<button className="w-8 h-8 flex items-center justify-center rounded-lg border border-outline-variant dark:border-outline/50 hover:bg-surface-container-high dark:hover:bg-on-surface-variant/20 transition-colors text-label-md dark:text-surface-variant">3</button>
<button className="w-8 h-8 flex items-center justify-center rounded-lg border border-outline-variant dark:border-outline/50 hover:bg-surface-container-high dark:hover:bg-on-surface-variant/20 transition-colors">
<span className="material-symbols-outlined text-[18px] dark:text-surface-variant">chevron_right</span>
</button>
</div>
</div>
</div>
</div>
</div>

    </>
  )
}
