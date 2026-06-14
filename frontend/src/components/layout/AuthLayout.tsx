import { Outlet } from 'react-router-dom'

/** Shell for auth pages (login, password reset) */
export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-surface dark:bg-background">
      <Outlet />
    </div>
  )
}
