import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { authApi } from '@/api/endpoints/auth.api'
import { useUIStore } from '@/store/uiStore'

export default function Topbar() {
  const user = useAuthStore((s) => s.user)
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const navigate = useNavigate()
  const { theme, toggleTheme, language, setLanguage } = useUIStore()

  const [notifMenuOpen, setNotifMenuOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [langMenuOpen, setLangMenuOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await authApi.logout()
    } catch {
      /* ignore */
    }
    clearAuth()
    navigate('/login')
  }

  const displayName = user?.username ? `Dr. ${user.username}` : 'Dr. Sharma'

  return (
    <header className="topbar-root">
      {/* ── Search ───────────────────────────────────────────── */}
      <div className="topbar-search-wrapper">
        <span className="material-symbols-outlined topbar-search-icon">search</span>
        <input
          id="global-search"
          className="topbar-search-input"
          placeholder="Search patients, doctors, or bills..."
          type="text"
        />
      </div>

      {/* ── Right Controls ───────────────────────────────────── */}
      <div className="topbar-controls">

        {/* Notifications */}
        <div
          className="topbar-icon-btn-wrapper"
          onMouseEnter={() => setNotifMenuOpen(true)}
          onMouseLeave={() => setNotifMenuOpen(false)}
        >
          <button id="notifications-btn" className="topbar-icon-btn" aria-label="Notifications">
            <span className="material-symbols-outlined">notifications</span>
            <span className="topbar-notif-dot" />
          </button>
          {notifMenuOpen && (
            <div className="topbar-dropdown topbar-notif-dropdown">
              <div className="topbar-dropdown-header">
                <span className="topbar-dropdown-title">Notifications</span>
                <span className="topbar-notif-badge">4 New</span>
              </div>
              <div className="topbar-dropdown-body">
                <div className="topbar-notif-item topbar-notif-item-urgent">
                  <div className="topbar-notif-icon-wrap topbar-notif-icon-error">
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>warning</span>
                  </div>
                  <div>
                    <p className="topbar-notif-title">Emergency Delivery Alert</p>
                    <p className="topbar-notif-sub">Patient: Sunita Rao, Ward B2. Dr. Sharma requested immediately.</p>
                    <p className="topbar-notif-time">Just now</p>
                  </div>
                </div>
                <div className="topbar-notif-item">
                  <div className="topbar-notif-icon-wrap topbar-notif-icon-info">
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>event</span>
                  </div>
                  <div>
                    <p className="topbar-notif-title">New Patient Registered</p>
                    <p className="topbar-notif-sub">Priya Patel (OPD) registered by Front Desk.</p>
                    <p className="topbar-notif-time">10 mins ago</p>
                  </div>
                </div>
              </div>
              <button className="topbar-dropdown-footer-btn">View all alerts</button>
            </div>
          )}
        </div>

        {/* Language switcher */}
        <div
          className="topbar-icon-btn-wrapper"
          onMouseEnter={() => setLangMenuOpen(true)}
          onMouseLeave={() => setLangMenuOpen(false)}
        >
          <button id="language-btn" className="topbar-icon-btn" aria-label="Select Language">
            <span className="material-symbols-outlined">language</span>
          </button>
          {langMenuOpen && (
            <div className="topbar-dropdown topbar-lang-dropdown">
              <button
                onClick={() => setLanguage('en')}
                className={`topbar-menu-item${language === 'en' ? ' topbar-menu-item-active' : ''}`}
              >
                English
              </button>
              <button
                onClick={() => setLanguage('mr')}
                className={`topbar-menu-item${language === 'mr' ? ' topbar-menu-item-active' : ''}`}
              >
                मराठी (Marathi)
              </button>
              <button
                onClick={() => setLanguage('hi')}
                className={`topbar-menu-item${language === 'hi' ? ' topbar-menu-item-active' : ''}`}
              >
                हिंदी (Hindi)
              </button>
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <button
          className="topbar-icon-btn"
          onClick={toggleTheme}
          aria-label="Toggle dark mode"
        >
          <span className="material-symbols-outlined">
            {theme === 'dark' ? 'light_mode' : 'dark_mode'}
          </span>
        </button>

        {/* Divider */}
        <div className="topbar-divider" />

        {/* User Profile */}
        <div
          className="topbar-icon-btn-wrapper"
          onMouseEnter={() => setProfileMenuOpen(true)}
          onMouseLeave={() => setProfileMenuOpen(false)}
        >
          <button className="topbar-user-btn" aria-label="User menu">
            <div className="topbar-avatar">
              {displayName.charAt(3).toUpperCase()}
            </div>
            <span className="topbar-user-name">{displayName}</span>
            <span className="material-symbols-outlined topbar-chevron">expand_more</span>
          </button>

          {profileMenuOpen && (
            <div className="topbar-dropdown topbar-profile-dropdown">
              <div className="topbar-profile-header">
                <div className="topbar-avatar topbar-avatar-lg">
                  {displayName.charAt(3).toUpperCase()}
                </div>
                <div>
                  <p className="topbar-profile-name">{displayName}</p>
                  <p className="topbar-profile-role">Administrator</p>
                </div>
              </div>
              <div className="topbar-dropdown-divider" />
              <a className="topbar-menu-item" href="#">
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>account_circle</span>
                Profile
              </a>
              <a className="topbar-menu-item" href="#">
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>shield</span>
                Security
              </a>
              <div className="topbar-dropdown-divider" />
              <button
                onClick={handleLogout}
                id="logout-btn"
                className="topbar-menu-item topbar-menu-item-danger"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>logout</span>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
