import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  useDoctorsQuery,
  useCreateDoctor,
  useUpdateDoctor,
  useDeleteDoctor,
  useStaffList,
  useCreateStaff,
  useUpdateStaff,
  useDeleteStaff,
  useDepartments
} from '@/hooks/useDoctors'
import type { Doctor, Staff } from '@/types/patient.types'

// ─── Validation Schemas ───────────────────────────────────────────────────────

const doctorSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  department: z.string().min(1, 'Department is required'),
  phone: z.string().regex(/^\+?[\d\s\-().]{7,20}$/, 'Enter a valid phone number'),
  email: z.string().email('Enter a valid email').optional().or(z.literal('')),
  join_date: z.string().refine(val => new Date(val) <= new Date(), 'Join date cannot be in the future'),
  specialisation: z.string().min(2, 'Specialisation is required'),
  registration_no: z.string().min(2, 'Registration number is required'),
  available_from: z.string().optional().or(z.literal('')),
  available_to: z.string().optional().or(z.literal('')),
  is_active: z.boolean().default(true),
})

const staffSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  designation: z.string().min(2, 'Designation is required'),
  department: z.string().min(1, 'Department is required'),
  phone: z.string().regex(/^\+?[\d\s\-().]{7,20}$/, 'Enter a valid phone number'),
  email: z.string().email('Enter a valid email').optional().or(z.literal('')),
  join_date: z.string().refine(val => new Date(val) <= new Date(), 'Join date cannot be in the future'),
  is_active: z.boolean().default(true),
})

export default function DoctorsPage() {
  const [activeTab, setActiveTab] = useState<'doctors' | 'staff'>('doctors')

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [deptFilter, setDeptFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<boolean | undefined>(undefined)
  const [page, setPage] = useState(1)

  // Modals state
  const [showDoctorModal, setShowDoctorModal] = useState(false)
  const [showStaffModal, setShowStaffModal] = useState(false)
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null)
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null)

  // Fetch departments
  const { data: departments } = useDepartments()

  // Queries
  const { data: doctorsData, isLoading: isLoadingDoctors } = useDoctorsQuery({
    page: activeTab === 'doctors' ? page : 1,
    search: searchQuery,
    staff__department: deptFilter,
    staff__is_active: statusFilter,
  })

  const { data: staffData, isLoading: isLoadingStaff } = useStaffList({
    page: activeTab === 'staff' ? page : 1,
    search: searchQuery,
    department: deptFilter,
    is_active: statusFilter,
  })

  // Mutations
  const createStaff = useCreateStaff()
  const updateStaff = useUpdateStaff()
  const deleteStaff = useDeleteStaff()

  const createDoctor = useCreateDoctor()
  const updateDoctor = useUpdateDoctor()
  const deleteDoctor = useDeleteDoctor()

  // Reset page when filters or tabs change
  useEffect(() => {
    setPage(1)
  }, [searchQuery, deptFilter, statusFilter, activeTab])

  // Forms setup
  const doctorForm = useForm<z.infer<typeof doctorSchema>>({
    resolver: zodResolver(doctorSchema) as any,
    defaultValues: {
      is_active: true,
      join_date: new Date().toISOString().split('T')[0]
    }
  })

  const staffForm = useForm<z.infer<typeof staffSchema>>({
    resolver: zodResolver(staffSchema) as any,
    defaultValues: {
      is_active: true,
      join_date: new Date().toISOString().split('T')[0]
    }
  })

  // Pre-fill doctor form for editing
  // Since some staff properties aren't in the list view, we find them in staffData if available
  // or fetch them. However, since the list view has been updated to include email, department and join_date,
  // we have everything we need directly!
  const handleOpenEditDoctor = (doc: Doctor) => {
    setEditingDoctor(doc)
    // Find matching staff member to get their phone, email, join_date
    const staffMember = staffData?.results?.find(s => s.id === doc.staff)
    
    doctorForm.reset({
      full_name: doc.full_name,
      department: staffMember?.department || '',
      phone: staffMember?.phone || '',
      email: staffMember?.email || '',
      join_date: staffMember?.join_date || new Date().toISOString().split('T')[0],
      specialisation: doc.specialisation,
      registration_no: doc.registration_no,
      available_from: doc.available_from ? doc.available_from.substring(0, 5) : '',
      available_to: doc.available_to ? doc.available_to.substring(0, 5) : '',
      is_active: doc.is_active,
    })
    setShowDoctorModal(true)
  }

  const handleOpenEditStaff = (stf: Staff) => {
    setEditingStaff(stf)
    staffForm.reset({
      full_name: stf.full_name,
      designation: stf.designation,
      department: stf.department || '',
      phone: stf.phone,
      email: stf.email || '',
      join_date: stf.join_date,
      is_active: stf.is_active,
    })
    setShowStaffModal(true)
  }

  // Submit Handlers
  const handleSaveDoctor = async (data: z.infer<typeof doctorSchema>) => {
    const formatTime = (timeStr?: string | null) => {
      if (!timeStr) return null
      return timeStr.length === 5 ? `${timeStr}:00` : timeStr
    }

    if (editingDoctor) {
      // 1. Update Staff details
      updateStaff.mutate({
        id: editingDoctor.staff,
        data: {
          full_name: data.full_name,
          phone: data.phone,
          email: data.email || '',
          join_date: data.join_date,
          department: data.department,
          is_active: data.is_active,
        }
      }, {
        onSuccess: () => {
          // 2. Update Doctor clinical credentials
          updateDoctor.mutate({
            id: editingDoctor.id,
            data: {
              specialisation: data.specialisation,
              registration_no: data.registration_no,
              available_from: formatTime(data.available_from),
              available_to: formatTime(data.available_to),
            }
          }, {
            onSuccess: () => {
              setShowDoctorModal(false)
              setEditingDoctor(null)
              doctorForm.reset()
            }
          })
        }
      })
    } else {
      // Create new: Step 1: Create Staff profile (designation defaults to "Doctor" or "Obstetrician")
      createStaff.mutate({
        full_name: data.full_name,
        designation: 'Doctor',
        phone: data.phone,
        email: data.email || '',
        join_date: data.join_date,
        department: data.department,
        is_active: data.is_active,
      }, {
        onSuccess: (newStaff) => {
          // Step 2: Create Doctor credentials linked to the new staff ID
          createDoctor.mutate({
            staff: newStaff.id,
            specialisation: data.specialisation,
            registration_no: data.registration_no,
            available_from: formatTime(data.available_from),
            available_to: formatTime(data.available_to),
          }, {
            onSuccess: () => {
              setShowDoctorModal(false)
              doctorForm.reset()
            }
          })
        }
      })
    }
  }

  const handleSaveStaff = (data: z.infer<typeof staffSchema>) => {
    if (editingStaff) {
      updateStaff.mutate({
        id: editingStaff.id,
        data: {
          full_name: data.full_name,
          designation: data.designation,
          phone: data.phone,
          email: data.email || '',
          join_date: data.join_date,
          department: data.department,
          is_active: data.is_active,
        }
      }, {
        onSuccess: () => {
          setShowStaffModal(false)
          setEditingStaff(null)
          staffForm.reset()
        }
      })
    } else {
      createStaff.mutate({
        full_name: data.full_name,
        designation: data.designation,
        phone: data.phone,
        email: data.email || '',
        join_date: data.join_date,
        department: data.department,
        is_active: data.is_active,
      }, {
        onSuccess: () => {
          setShowStaffModal(false)
          staffForm.reset()
        }
      })
    }
  }

  const handleDeleteDoctorClick = (doc: Doctor) => {
    if (confirm(`Are you sure you want to delete Doctor ${doc.full_name} and their clinical record?`)) {
      // Deleting the Staff member cascades and deletes Doctor on backend
      deleteStaff.mutate(doc.staff)
    }
  }

  const handleDeleteStaffClick = (stf: Staff) => {
    if (confirm(`Are you sure you want to delete staff member ${stf.full_name}?`)) {
      deleteStaff.mutate(stf.id)
    }
  }

  const activeDoctorsCount = doctorsData?.results?.filter(d => d.is_active).length || 0

  return (
    <>
      <div className="p-margin-desktop space-y-gutter">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-xs mb-md text-label-md font-label-md text-on-surface-variant">
          <a className="hover:text-primary transition-colors cursor-pointer">Dashboard</a>
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          <span className="text-on-surface font-semibold">Doctors & Staff</span>
        </div>

        {/* Page Header */}
        <div className="flex justify-between items-end mb-lg">
          <div>
            <h2 className="font-headline-lg text-headline-lg text-on-surface">Staff & Clinical Roster</h2>
            <p className="font-body-md text-body-md text-secondary">
              Manage clinical credentials, shift availabilities, and administrative departments.
            </p>
          </div>
          <div className="flex gap-sm">
            {activeTab === 'doctors' ? (
              <button
                onClick={() => {
                  setEditingDoctor(null)
                  doctorForm.reset({
                    is_active: true,
                    join_date: new Date().toISOString().split('T')[0],
                    full_name: '', department: '', phone: '', email: '', specialisation: '', registration_no: '', available_from: '', available_to: ''
                  })
                  setShowDoctorModal(true)
                }}
                className="btn-primary flex items-center gap-xs"
              >
                <span className="material-symbols-outlined text-[20px]">medical_services</span> Add Doctor
              </button>
            ) : (
              <button
                onClick={() => {
                  setEditingStaff(null)
                  staffForm.reset({
                    is_active: true,
                    join_date: new Date().toISOString().split('T')[0],
                    full_name: '', designation: '', department: '', phone: '', email: ''
                  })
                  setShowStaffModal(true)
                }}
                className="btn-primary flex items-center gap-xs"
              >
                <span className="material-symbols-outlined text-[20px]">person_add</span> Add Staff
              </button>
            )}
          </div>
        </div>

        {/* KPI Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter mb-xl">
          <div className="bg-white rounded-xl border border-outline-variant/20 p-md shadow-sm">
            <div className="flex justify-between items-start mb-sm">
              <div className="p-2 bg-primary/10 rounded-lg">
                <span className="material-symbols-outlined text-primary">medical_services</span>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 bg-success-100 text-success-600 rounded">Clinical</span>
            </div>
            <p className="text-secondary font-label-md text-label-md">Total Doctors</p>
            <p className="text-on-surface font-headline-lg text-headline-lg mt-xs">{doctorsData?.count || 0}</p>
          </div>

          <div className="bg-white rounded-xl border border-outline-variant/20 p-md shadow-sm">
            <div className="flex justify-between items-start mb-sm">
              <div className="p-2 bg-primary/10 rounded-lg">
                <span className="material-symbols-outlined text-primary">groups</span>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 bg-neutral-100 text-secondary rounded">All Staff</span>
            </div>
            <p className="text-secondary font-label-md text-label-md">Total Roster</p>
            <p className="text-on-surface font-headline-lg text-headline-lg mt-xs">{staffData?.count || 0}</p>
          </div>

          <div className="bg-white rounded-xl border border-outline-variant/20 p-md shadow-sm">
            <div className="flex justify-between items-start mb-sm">
              <div className="p-2 bg-success-100 text-success-600 rounded-lg">
                <span className="material-symbols-outlined">how_to_reg</span>
              </div>
            </div>
            <p className="text-secondary font-label-md text-label-md">Active Doctors</p>
            <p className="text-on-surface font-headline-lg text-headline-lg mt-xs">{activeDoctorsCount}</p>
          </div>

          <div className="bg-white rounded-xl border border-outline-variant/20 p-md shadow-sm">
            <div className="flex justify-between items-start mb-sm">
              <div className="p-2 bg-primary/10 rounded-lg">
                <span className="material-symbols-outlined text-primary">domain</span>
              </div>
            </div>
            <p className="text-secondary font-label-md text-label-md">Departments</p>
            <p className="text-on-surface font-headline-lg text-headline-lg mt-xs">{departments?.length || 0}</p>
          </div>
        </div>

        {/* Tab Controls & Filters */}
        <div className="bg-white rounded-xl border border-outline-variant/20 shadow-sm overflow-hidden flex flex-col">
          <div className="flex px-lg pt-sm border-b border-outline-variant/20 bg-neutral-50/50">
            <button
              onClick={() => setActiveTab('doctors')}
              className={`px-md py-sm font-label-lg text-label-lg border-b-2 transition-all mr-sm flex items-center gap-xs ${
                activeTab === 'doctors'
                  ? 'border-primary text-primary font-bold bg-white -mb-px rounded-t-lg border-x border-t border-outline-variant/20'
                  : 'border-transparent text-secondary hover:text-primary'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">clinical_notes</span> Doctor Credentials
            </button>
            <button
              onClick={() => setActiveTab('staff')}
              className={`px-md py-sm font-label-lg text-label-lg border-b-2 transition-all flex items-center gap-xs ${
                activeTab === 'staff'
                  ? 'border-primary text-primary font-bold bg-white -mb-px rounded-t-lg border-x border-t border-outline-variant/20'
                  : 'border-transparent text-secondary hover:text-primary'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">badge</span> General Staff Directory
            </button>
          </div>

          {/* Interactive Filters Toolbar */}
          <div className="p-md border-b border-outline-variant/10 flex flex-col md:flex-row gap-md justify-between bg-neutral-50/20">
            <div className="flex-1 flex flex-col md:flex-row gap-sm">
              <div className="relative flex-1 max-w-md">
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-[20px] text-neutral-400">search</span>
                <input
                  type="text"
                  placeholder={activeTab === 'doctors' ? 'Search by name, specialisation, registration...' : 'Search by name, designation, phone...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="form-input pl-10 text-sm"
                />
              </div>

              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="form-input text-sm w-full md:w-48"
              >
                <option value="">All Departments</option>
                {departments?.map((dept) => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>

              <select
                value={statusFilter === undefined ? '' : statusFilter.toString()}
                onChange={(e) => {
                  const val = e.target.value
                  setStatusFilter(val === '' ? undefined : val === 'true')
                }}
                className="form-input text-sm w-full md:w-40"
              >
                <option value="">All Statuses</option>
                <option value="true">🟢 Active Only</option>
                <option value="false">🔴 Inactive Only</option>
              </select>
            </div>
          </div>

          {/* Tab Views Content */}
          <div className="p-lg">
            {activeTab === 'doctors' ? (
              // Doctors Tab View
              isLoadingDoctors ? (
                <div className="flex flex-col items-center justify-center py-xl">
                  <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
                  <span className="ml-3 text-secondary font-medium mt-sm">Fetching clinical directory...</span>
                </div>
              ) : !doctorsData?.results || doctorsData.results.length === 0 ? (
                <div className="text-center py-xl bg-neutral-50 rounded-xl border border-dashed border-outline-variant p-lg max-w-md mx-auto my-lg">
                  <span className="material-symbols-outlined text-[48px] text-neutral-300 mb-2">clinical_notes</span>
                  <h3 className="font-title-lg font-bold">No Doctors Found</h3>
                  <p className="font-body-md text-secondary mt-1">Try updating search term or category filters.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="text-secondary border-b border-outline-variant/20">
                      <tr>
                        <th className="py-sm font-label-lg text-label-lg">Full Name</th>
                        <th className="py-sm font-label-lg text-label-lg">Specialisation</th>
                        <th className="py-sm font-label-lg text-label-lg">Reg. Number</th>
                        <th className="py-sm font-label-lg text-label-lg">Department</th>
                        <th className="py-sm font-label-lg text-label-lg">Shift Availability</th>
                        <th className="py-sm font-label-lg text-label-lg">Status</th>
                        <th className="py-sm font-label-lg text-label-lg text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/10">
                      {doctorsData.results.map((doc) => (
                        <tr key={doc.id} className="hover:bg-neutral-50/50 transition-colors group">
                          <td className="py-md">
                            <div className="flex items-center gap-sm">
                              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                                {doc.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                              </div>
                              <p className="font-label-lg text-label-lg text-on-surface">Dr. {doc.full_name}</p>
                            </div>
                          </td>
                          <td className="py-md text-sm font-medium">{doc.specialisation}</td>
                          <td className="py-md text-sm font-mono text-secondary">{doc.registration_no}</td>
                          <td className="py-md text-sm text-secondary">{doc.department_name || '—'}</td>
                          <td className="py-md text-sm text-secondary">
                            {doc.available_from && doc.available_to
                              ? `${doc.available_from.substring(0, 5)} - ${doc.available_to.substring(0, 5)}`
                              : '🕒 On Call (24x7)'}
                          </td>
                          <td className="py-md">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              doc.is_active ? 'bg-success-100 text-success-600' : 'bg-neutral-100 text-secondary'
                            }`}>
                              {doc.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="py-md text-right">
                            <div className="flex justify-end gap-sm opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleOpenEditDoctor(doc)}
                                className="p-1 hover:bg-neutral-100 rounded text-primary transition-colors"
                                title="Edit Doctor Profile"
                              >
                                <span className="material-symbols-outlined text-[18px]">edit</span>
                              </button>
                              <button
                                onClick={() => handleDeleteDoctorClick(doc)}
                                className="p-1 hover:bg-neutral-100 rounded text-error transition-colors"
                                title="Delete Doctor Profile"
                              >
                                <span className="material-symbols-outlined text-[18px]">delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Pagination controls */}
                  <div className="flex justify-between items-center mt-lg pt-md border-t border-outline-variant/10">
                    <p className="text-xs text-secondary">
                      Showing page <span className="font-bold">{page}</span>
                    </p>
                    <div className="flex gap-sm">
                      <button
                        onClick={() => setPage(p => Math.max(p - 1, 1))}
                        disabled={page === 1}
                        className="btn-secondary px-sm py-1.5"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setPage(p => p + 1)}
                        disabled={!doctorsData.next}
                        className="btn-secondary px-sm py-1.5"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )
            ) : (
              // Staff Tab View
              isLoadingStaff ? (
                <div className="flex flex-col items-center justify-center py-xl">
                  <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
                  <span className="ml-3 text-secondary font-medium mt-sm">Fetching employee roster...</span>
                </div>
              ) : !staffData?.results || staffData.results.length === 0 ? (
                <div className="text-center py-xl bg-neutral-50 rounded-xl border border-dashed border-outline-variant p-lg max-w-md mx-auto my-lg">
                  <span className="material-symbols-outlined text-[48px] text-neutral-300 mb-2">groups</span>
                  <h3 className="font-title-lg font-bold">No Staff Members</h3>
                  <p className="font-body-md text-secondary mt-1">Try updating search query or category filters.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="text-secondary border-b border-outline-variant/20">
                      <tr>
                        <th className="py-sm font-label-lg text-label-lg">Full Name</th>
                        <th className="py-sm font-label-lg text-label-lg">Designation</th>
                        <th className="py-sm font-label-lg text-label-lg">Department</th>
                        <th className="py-sm font-label-lg text-label-lg">Primary Phone</th>
                        <th className="py-sm font-label-lg text-label-lg">Joined Date</th>
                        <th className="py-sm font-label-lg text-label-lg">Status</th>
                        <th className="py-sm font-label-lg text-label-lg text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/10">
                      {staffData.results.map((stf) => (
                        <tr key={stf.id} className="hover:bg-neutral-50/50 transition-colors group">
                          <td className="py-md">
                            <div className="flex items-center gap-sm">
                              <div className="w-8 h-8 rounded-full bg-neutral-200 text-secondary flex items-center justify-center font-bold text-xs">
                                {stf.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-label-lg text-label-lg text-on-surface">{stf.full_name}</p>
                                {stf.email && <p className="text-[10px] text-secondary">{stf.email}</p>}
                              </div>
                            </div>
                          </td>
                          <td className="py-md text-sm font-medium">{stf.designation}</td>
                          <td className="py-md text-sm text-secondary">{stf.department_name || '—'}</td>
                          <td className="py-md text-sm text-secondary">{stf.phone}</td>
                          <td className="py-md text-sm text-secondary">{stf.join_date}</td>
                          <td className="py-md">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              stf.is_active ? 'bg-success-100 text-success-600' : 'bg-neutral-100 text-secondary'
                            }`}>
                              {stf.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="py-md text-right">
                            <div className="flex justify-end gap-sm opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleOpenEditStaff(stf)}
                                className="p-1 hover:bg-neutral-100 rounded text-primary transition-colors"
                                title="Edit Staff Profile"
                              >
                                <span className="material-symbols-outlined text-[18px]">edit</span>
                              </button>
                              <button
                                onClick={() => handleDeleteStaffClick(stf)}
                                className="p-1 hover:bg-neutral-100 rounded text-error transition-colors"
                                disabled={!!stf.doctor_profile}
                                title={stf.doctor_profile ? "Delete this doctor from Doctor Credentials tab first" : "Delete Staff Profile"}
                              >
                                <span className={`material-symbols-outlined text-[18px] ${stf.doctor_profile ? 'opacity-30' : ''}`}>delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Pagination controls */}
                  <div className="flex justify-between items-center mt-lg pt-md border-t border-outline-variant/10">
                    <p className="text-xs text-secondary">
                      Showing page <span className="font-bold">{page}</span>
                    </p>
                    <div className="flex gap-sm">
                      <button
                        onClick={() => setPage(p => Math.max(p - 1, 1))}
                        disabled={page === 1}
                        className="btn-secondary px-sm py-1.5"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setPage(p => p + 1)}
                        disabled={!staffData.next}
                        className="btn-secondary px-sm py-1.5"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* ── MODAL: Doctor Profile (Create/Edit) ────────────────────────────────── */}
      {showDoctorModal && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-md">
          <div className="bg-white rounded-2xl shadow-2xl border border-outline-variant/20 w-full max-w-xl flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="px-lg py-md border-b border-outline-variant/10 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-sm">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-[24px]">medical_services</span>
                </div>
                <div>
                  <h3 className="text-title-lg font-bold text-on-surface">
                    {editingDoctor ? 'Edit Doctor Profile' : 'Add Doctor Clinical Credentials'}
                  </h3>
                  <p className="text-xs text-secondary">Record licensing, specialisation, and shifts</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowDoctorModal(false)
                  setEditingDoctor(null)
                  doctorForm.reset()
                }}
                className="w-8 h-8 rounded-lg hover:bg-neutral-100 flex items-center justify-center text-neutral-400 hover:text-neutral-700 transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={doctorForm.handleSubmit(handleSaveDoctor)} className="flex flex-col flex-1 min-h-0">
              <div className="overflow-y-auto flex-1 px-lg py-md space-y-md">
                
                {/* Section 1: Staff Details */}
                <div className="space-y-sm">
                  <p className="text-xs font-bold text-secondary uppercase tracking-wider">👤 Staff Profile Details</p>
                  
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-on-surface">Full Name <span className="text-error">*</span></label>
                    <input type="text" {...doctorForm.register('full_name')} className="form-input" placeholder="e.g. Dr. Shruti Sen" />
                    {doctorForm.formState.errors.full_name && <p className="text-xs text-error">{doctorForm.formState.errors.full_name.message}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-md">
                    <div className="space-y-1.5">
                      <label className="block text-sm font-semibold text-on-surface">Department <span className="text-error">*</span></label>
                      <select {...doctorForm.register('department')} className="form-input">
                        <option value="">— Select Department —</option>
                        {departments?.map((d) => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                      {doctorForm.formState.errors.department && <p className="text-xs text-error">{doctorForm.formState.errors.department.message}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-sm font-semibold text-on-surface">Joined Date <span className="text-error">*</span></label>
                      <input type="date" {...doctorForm.register('join_date')} className="form-input" />
                      {doctorForm.formState.errors.join_date && <p className="text-xs text-error">{doctorForm.formState.errors.join_date.message}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-md">
                    <div className="space-y-1.5">
                      <label className="block text-sm font-semibold text-on-surface">Phone Number <span className="text-error">*</span></label>
                      <input type="text" {...doctorForm.register('phone')} className="form-input" placeholder="+91 99887 76655" />
                      {doctorForm.formState.errors.phone && <p className="text-xs text-error">{doctorForm.formState.errors.phone.message}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-sm font-semibold text-on-surface">Email Address</label>
                      <input type="email" {...doctorForm.register('email')} className="form-input" placeholder="doctor@example.com" />
                      {doctorForm.formState.errors.email && <p className="text-xs text-error">{doctorForm.formState.errors.email.message}</p>}
                    </div>
                  </div>
                </div>

                <div className="border-t border-outline-variant/10" />

                {/* Section 2: Clinical Details */}
                <div className="space-y-sm">
                  <p className="text-xs font-bold text-secondary uppercase tracking-wider">⚕️ Clinical Credentials</p>
                  
                  <div className="grid grid-cols-2 gap-md">
                    <div className="space-y-1.5">
                      <label className="block text-sm font-semibold text-on-surface">Specialisation <span className="text-error">*</span></label>
                      <input type="text" {...doctorForm.register('specialisation')} className="form-input" placeholder="e.g. Obstetrics & Gynecology" />
                      {doctorForm.formState.errors.specialisation && <p className="text-xs text-error">{doctorForm.formState.errors.specialisation.message}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-sm font-semibold text-on-surface">Registration Number <span className="text-error">*</span></label>
                      <input type="text" {...doctorForm.register('registration_no')} className="form-input" placeholder="e.g. MCI/2024/99128" />
                      {doctorForm.formState.errors.registration_no && <p className="text-xs text-error">{doctorForm.formState.errors.registration_no.message}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-md">
                    <div className="space-y-1.5">
                      <label className="block text-sm font-semibold text-on-surface">Available From</label>
                      <input type="time" {...doctorForm.register('available_from')} className="form-input" />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-sm font-semibold text-on-surface">Available To</label>
                      <input type="time" {...doctorForm.register('available_to')} className="form-input" />
                    </div>
                  </div>

                  <div className="flex items-center gap-sm mt-sm">
                    <input type="checkbox" id="doc_active" {...doctorForm.register('is_active')} className="rounded border-outline-variant text-primary focus:ring-primary" />
                    <label htmlFor="doc_active" className="text-sm font-semibold text-on-surface cursor-pointer">Doctor is active & bookable</label>
                  </div>
                </div>

              </div>

              {/* Footer */}
              <div className="px-lg py-md border-t border-outline-variant/10 flex justify-end gap-sm shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setShowDoctorModal(false)
                    setEditingDoctor(null)
                    doctorForm.reset()
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary font-bold"
                  disabled={createDoctor.isPending || updateDoctor.isPending || createStaff.isPending || updateStaff.isPending}
                >
                  {createDoctor.isPending || updateDoctor.isPending || createStaff.isPending || updateStaff.isPending
                    ? 'Saving...'
                    : editingDoctor ? 'Update Doctor' : 'Register Doctor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: General Staff Profile (Create/Edit) ────────────────────────── */}
      {showStaffModal && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-md">
          <div className="bg-white rounded-2xl shadow-2xl border border-outline-variant/20 w-full max-w-lg flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="px-lg py-md border-b border-outline-variant/10 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-sm">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-[24px]">person_add</span>
                </div>
                <div>
                  <h3 className="text-title-lg font-bold text-on-surface">
                    {editingStaff ? 'Edit Staff Profile' : 'Add Roster Employee'}
                  </h3>
                  <p className="text-xs text-secondary">Manage non-clinical and support profiles</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowStaffModal(false)
                  setEditingStaff(null)
                  staffForm.reset()
                }}
                className="w-8 h-8 rounded-lg hover:bg-neutral-100 flex items-center justify-center text-neutral-400 hover:text-neutral-700 transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={staffForm.handleSubmit(handleSaveStaff)} className="flex flex-col flex-1 min-h-0">
              <div className="overflow-y-auto flex-1 px-lg py-md space-y-md">
                
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-on-surface">Full Name <span className="text-error">*</span></label>
                  <input type="text" {...staffForm.register('full_name')} className="form-input" placeholder="e.g. Ramesh Kumar" />
                  {staffForm.formState.errors.full_name && <p className="text-xs text-error">{staffForm.formState.errors.full_name.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-md">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-on-surface">Designation <span className="text-error">*</span></label>
                    <input type="text" {...staffForm.register('designation')} className="form-input" placeholder="e.g. Nurse Practitioner, Front Desk" />
                    {staffForm.formState.errors.designation && <p className="text-xs text-error">{staffForm.formState.errors.designation.message}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-on-surface">Department <span className="text-error">*</span></label>
                    <select {...staffForm.register('department')} className="form-input">
                      <option value="">— Select Department —</option>
                      {departments?.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                    {staffForm.formState.errors.department && <p className="text-xs text-error">{staffForm.formState.errors.department.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-md">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-on-surface">Primary Phone <span className="text-error">*</span></label>
                    <input type="text" {...staffForm.register('phone')} className="form-input" placeholder="+91 98765 43210" />
                    {staffForm.formState.errors.phone && <p className="text-xs text-error">{staffForm.formState.errors.phone.message}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-on-surface">Email Address</label>
                    <input type="email" {...staffForm.register('email')} className="form-input" placeholder="staff@example.com" />
                    {staffForm.formState.errors.email && <p className="text-xs text-error">{staffForm.formState.errors.email.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-md">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-on-surface">Joined Date <span className="text-error">*</span></label>
                    <input type="date" {...staffForm.register('join_date')} className="form-input" />
                    {staffForm.formState.errors.join_date && <p className="text-xs text-error">{staffForm.formState.errors.join_date.message}</p>}
                  </div>

                  <div className="flex items-end pb-xs">
                    <label className="flex items-center gap-sm cursor-pointer select-none">
                      <input type="checkbox" {...staffForm.register('is_active')} className="rounded border-outline-variant text-primary focus:ring-primary" />
                      <span className="text-sm font-semibold text-on-surface">Employee is active</span>
                    </label>
                  </div>
                </div>

              </div>

              {/* Footer */}
              <div className="px-lg py-md border-t border-outline-variant/10 flex justify-end gap-sm shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setShowStaffModal(false)
                    setEditingStaff(null)
                    staffForm.reset()
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary font-bold"
                  disabled={createStaff.isPending || updateStaff.isPending}
                >
                  {createStaff.isPending || updateStaff.isPending
                    ? 'Saving...'
                    : editingStaff ? 'Update Staff' : 'Add Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
