import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { authApi } from '@/api/endpoints/auth.api'

interface NavItem {
  path: string
  label: string
  icon: string
  tab?: string
}

const NAV_ITEMS: NavItem[] = [
  { path: '/dashboard',    label: 'Dashboard',           icon: 'dashboard' },
  { path: '/patients',     label: 'Patients',            icon: 'person' },
  { path: '/appointments', label: 'Appointments',        icon: 'calendar_today' },
  { path: '/doctors',      label: 'Doctors',             icon: 'medical_services' },
  { path: '/laboratory',   label: 'Laboratory',          icon: 'biotech' },
  { path: '/pharmacy',     label: 'Pharmacy',            icon: 'medication' },
  { path: '/admissions',   label: 'Admissions',          icon: 'hotel' },
  { path: '/beds',         label: 'Bed Management',      icon: 'bed' },
  { path: '/delivery',     label: 'Delivery Management', icon: 'pregnant_woman' },
  { path: '/newborn',      label: 'Newborn Management',  icon: 'child_care' },
  { path: '/billing',      label: 'Billing',             icon: 'receipt_long' },
  { path: '/hr',           label: 'HR & Staff',          icon: 'group' },
  { path: '/reports',      label: 'Reports',             icon: 'analytics' },
]

const LAB_NAV_ITEMS: NavItem[] = [
  { path: '/laboratory?tab=dashboard',  label: 'Dashboard',      icon: 'dashboard',       tab: 'dashboard'  },
  { path: '/laboratory?tab=pending',    label: 'Pending Tests',  icon: 'pending_actions', tab: 'pending'    },
  { path: '/laboratory?tab=completed',  label: 'Completed Tests',icon: 'biotech',         tab: 'completed'  },
  { path: '/laboratory?tab=history',    label: 'Patient History',icon: 'history',         tab: 'history'    },
]

const PHARMACY_NAV_ITEMS: NavItem[] = [
  { path: '/pharmacy?tab=overview',      label: 'Overview',       icon: 'dashboard',       tab: 'overview'      },
  { path: '/pharmacy?tab=inventory',     label: 'Inventory',      icon: 'inventory_2',     tab: 'inventory'     },
  { path: '/pharmacy?tab=prescriptions', label: 'Prescriptions',  icon: 'prescriptions',   tab: 'prescriptions' },
  { path: '/pharmacy?tab=billing',       label: 'Billing',        icon: 'payments',        tab: 'billing'       },
  { path: '/pharmacy?tab=reports',       label: 'Reports',        icon: 'analytics',       tab: 'reports'       },
]

export default function Sidebar() {
  const user = useAuthStore((s) => s.user)
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const location = useLocation()
  const navigate = useNavigate()
  
  const isLabTech = user?.roles.includes('Lab Tech')
  const isPharmacist = user?.roles.includes('Pharmacist')
  const isPatient = user?.roles.includes('Patient')
  const patientProfileId = user?.patient_profile_id
  const queryParams = new URLSearchParams(location.search)
  const activeTab = queryParams.get('tab') || 'pending'

  const handleLogout = async () => {
    try {
      await authApi.logout()
    } catch {
      /* ignore */
    }
    clearAuth()
    navigate('/login')
  }

  if (isPatient) {
    const PATIENT_NAV_ITEMS = [
      ...(patientProfileId ? [{ path: `/patients/${patientProfileId}`, label: 'My Health Record', icon: 'favorite' }] : []),
      { path: '/appointments', label: 'My Appointments', icon: 'calendar_today' },
    ]
    return (
      <nav className="sidebar-root">
        {/* Brand Header */}
        <div className="sidebar-brand">
          <div className="sidebar-logo-icon" style={{ backgroundColor: '#00685d' }}>
            <span
              className="material-symbols-outlined"
              style={{ fontVariationSettings: "'FILL' 1", fontSize: '20px', color: '#ffffff' }}
            >
              salinity
            </span>
          </div>
          <div>
            <span className="sidebar-brand-name">Patient Portal</span>
            <span className="sidebar-brand-sub">Shakuntala Hospital</span>
          </div>
        </div>

        {/* Navigation */}
        <div className="sidebar-nav-scroll">
          <ul className="sidebar-nav-list">
            {PATIENT_NAV_ITEMS.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `sidebar-nav-item${isActive ? ' sidebar-nav-item-active' : ''}`
                  }
                >
                  <span className="material-symbols-outlined sidebar-nav-icon">{item.icon}</span>
                  <span className="sidebar-nav-label">{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer */}
        <div className="sidebar-footer">
          <button
            onClick={handleLogout}
            className="sidebar-nav-item w-full text-left bg-transparent border-none cursor-pointer"
            style={{ display: 'flex', alignItems: 'center' }}
          >
            <span className="material-symbols-outlined sidebar-nav-icon">logout</span>
            <span className="sidebar-nav-label">Logout</span>
          </button>
        </div>
      </nav>
    )
  }

  if (isLabTech) {
    return (
      <nav className="sidebar-root">
        {/* ── Brand Header (Lab Division) ───────────────────────── */}
        <div className="sidebar-brand">
          <div className="sidebar-logo-icon" style={{ backgroundColor: '#00685d' }}>
            <span
              className="material-symbols-outlined"
              style={{ fontVariationSettings: "'FILL' 1", fontSize: '20px', color: '#ffffff' }}
            >
              salinity
            </span>
          </div>
          <div>
            <span className="sidebar-brand-name">Lab Division</span>
            <span className="sidebar-brand-sub">Maternity Care Unit</span>
          </div>
        </div>

        {/* ── Quick Scan Button ─────────────────────────────────── */}
        <div className="px-3 pt-3 pb-2">
          <button className="w-full bg-[#00685d] text-white py-2 px-3 rounded-lg flex items-center justify-center gap-2 font-semibold hover:bg-[#005a50] transition-all duration-150 shadow-sm text-xs cursor-pointer">
            <span className="material-symbols-outlined text-[16px]">qr_code_scanner</span>
            Quick Scan
          </button>
        </div>

        {/* ── Navigation (Lab Tech) ─────────────────────────────── */}
        <div className="sidebar-nav-scroll">
          <ul className="sidebar-nav-list">
            {LAB_NAV_ITEMS.map((item) => {
              const isItemActive = activeTab === item.tab
              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    className={`sidebar-nav-item${isItemActive ? ' sidebar-nav-item-active' : ''}`}
                  >
                    <span className="material-symbols-outlined sidebar-nav-icon">{item.icon}</span>
                    <span className="sidebar-nav-label">{item.label}</span>
                  </NavLink>
                </li>
              )
            })}
          </ul>
        </div>

        {/* ── Footer (Lab Tech) ─────────────────────────────────── */}
        <div className="sidebar-footer flex flex-col gap-1">
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `sidebar-nav-item${isActive ? ' sidebar-nav-item-active' : ''}`
            }
          >
            <span className="material-symbols-outlined sidebar-nav-icon">settings</span>
            <span className="sidebar-nav-label">Settings</span>
          </NavLink>
          <NavLink
            to="/laboratory?tab=support"
            className={`sidebar-nav-item${activeTab === 'support' ? ' sidebar-nav-item-active' : ''}`}
          >
            <span className="material-symbols-outlined sidebar-nav-icon">help</span>
            <span className="sidebar-nav-label">Support</span>
          </NavLink>
          <button
            onClick={handleLogout}
            className="sidebar-nav-item w-full text-left bg-transparent border-none"
            style={{ display: 'flex', alignItems: 'center' }}
          >
            <span className="material-symbols-outlined sidebar-nav-icon">logout</span>
            <span className="sidebar-nav-label">Logout</span>
          </button>
        </div>
      </nav>
    )
  }

  if (isPharmacist) {
    return (
      <nav className="sidebar-root">
        {/* ── Brand Header (Pharmacy) ──────────────────────── */}
        <div className="sidebar-brand">
          <div className="sidebar-logo-icon" style={{ backgroundColor: '#00685d' }}>
            <span className="material-symbols-outlined"
              style={{ fontVariationSettings: "'FILL' 1", fontSize: '20px', color: '#ffffff' }}>medication</span>
          </div>
          <div>
            <span className="sidebar-brand-name">Pharmacy</span>
            <span className="sidebar-brand-sub">Maternity Care Unit</span>
          </div>
        </div>
        {/* ── New Prescription Button ─────────────────────── */}
        <div className="px-3 pt-3 pb-2">
          <button onClick={() => navigate('/pharmacy?tab=prescriptions')}
            className="w-full text-white py-2 px-3 rounded-lg flex items-center justify-center gap-2 font-semibold hover:opacity-90 transition-all duration-150 shadow-sm text-xs cursor-pointer"
            style={{ background: '#00685d' }}>
            <span className="material-symbols-outlined text-[16px]">add</span>
            New Prescription
          </button>
        </div>
        {/* ── Navigation (Pharmacist) ─────────────────────── */}
        <div className="sidebar-nav-scroll">
          <ul className="sidebar-nav-list">
            {PHARMACY_NAV_ITEMS.map((item) => {
              const isItemActive = activeTab === item.tab ||
                (item.tab === 'overview' && !activeTab && location.pathname === '/pharmacy')
              return (
                <li key={item.path}>
                  <NavLink to={item.path}
                    className={`sidebar-nav-item${isItemActive ? ' sidebar-nav-item-active' : ''}`}>
                    <span className="material-symbols-outlined sidebar-nav-icon">{item.icon}</span>
                    <span className="sidebar-nav-label">{item.label}</span>
                  </NavLink>
                </li>
              )
            })}
          </ul>
        </div>
        {/* ── Footer (Pharmacist) ────────────────────────── */}
        <div className="sidebar-footer flex flex-col gap-1">
          <NavLink to="/settings"
            className={({ isActive }) => `sidebar-nav-item${isActive ? ' sidebar-nav-item-active' : ''}`}>
            <span className="material-symbols-outlined sidebar-nav-icon">settings</span>
            <span className="sidebar-nav-label">Settings</span>
          </NavLink>
          <NavLink to="/pharmacy?tab=support"
            className={`sidebar-nav-item${activeTab === 'support' ? ' sidebar-nav-item-active' : ''}`}>
            <span className="material-symbols-outlined sidebar-nav-icon">help</span>
            <span className="sidebar-nav-label">Support</span>
          </NavLink>
          <button onClick={handleLogout}
            className="sidebar-nav-item w-full text-left bg-transparent border-none"
            style={{ display: 'flex', alignItems: 'center' }}>
            <span className="material-symbols-outlined sidebar-nav-icon">logout</span>
            <span className="sidebar-nav-label">Logout</span>
          </button>
        </div>
      </nav>
    )
  }

  return (
    <nav className="sidebar-root">
      {/* ── Brand Header ─────────────────────────────────────── */}
      <div className="sidebar-brand">
        <div className="sidebar-logo-icon">
          <span
            className="material-symbols-outlined"
            style={{ fontVariationSettings: "'FILL' 1", fontSize: '20px', color: '#ffffff' }}>
            favorite
          </span>
        </div>
        <div>
          <span className="sidebar-brand-name">MotherCare</span>
          <span className="sidebar-brand-sub">Shakuntala Hospital</span>
        </div>
      </div>

      {/* ── Navigation ───────────────────────────────────────── */}
      <div className="sidebar-nav-scroll">
        <ul className="sidebar-nav-list">
          {NAV_ITEMS.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `sidebar-nav-item${isActive ? ' sidebar-nav-item-active' : ''}`
                }
              >
                <span className="material-symbols-outlined sidebar-nav-icon">{item.icon}</span>
                <span className="sidebar-nav-label">{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </div>

      {/* ── Footer ───────────────────────────────────────────── */}
      <div className="sidebar-footer">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `sidebar-nav-item${isActive ? ' sidebar-nav-item-active' : ''}`
          }
        >
          <span className="material-symbols-outlined sidebar-nav-icon">settings</span>
          <span className="sidebar-nav-label">Settings</span>
        </NavLink>
      </div>
    </nav>
  )
}
