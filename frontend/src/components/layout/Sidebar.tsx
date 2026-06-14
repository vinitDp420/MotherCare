import { NavLink } from 'react-router-dom'

interface NavItem {
  path: string
  label: string
  icon: string
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

export default function Sidebar() {
  return (
    <nav className="sidebar-root">
      {/* ── Brand Header ─────────────────────────────────────── */}
      <div className="sidebar-brand">
        <div className="sidebar-logo-icon">
          <span
            className="material-symbols-outlined"
            style={{ fontVariationSettings: "'FILL' 1", fontSize: '20px', color: '#ffffff' }}
          >
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
                to={item.path === '/doctors' ? '#' : item.path}
                onClick={(e) => {
                  if (item.path === '/doctors') e.preventDefault()
                }}
                className={({ isActive }) =>
                  `sidebar-nav-item${isActive && item.path !== '/doctors' ? ' sidebar-nav-item-active' : ''}`
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
