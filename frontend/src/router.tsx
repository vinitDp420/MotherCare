/**
 * MotherCare — React Router v6 Route Definitions
 * All routes are lazy-loaded for performance.
 */
import { lazy } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuthStore } from '@/store/authStore'
import AppLayout from '@/components/layout/AppLayout'
import AuthLayout from '@/components/layout/AuthLayout'

// ── Lazy-loaded pages ────────────────────────────────────────────────────────
const LoginPage = lazy(() => import('@/modules/auth/LoginPage'))
const DashboardPage = lazy(() => import('@/modules/dashboard/DashboardPage'))
const PatientsPage = lazy(() => import('@/modules/patients/PatientsPage'))
const RegisterPatientPage = lazy(() => import('@/modules/patients/RegisterPatientPage'))
const PatientDetailPage = lazy(() => import('@/modules/patients/PatientDetailPage'))
const PregnancyTrackingPage = lazy(() => import('@/modules/pregnancy/PregnancyTrackingPage'))
const AppointmentsPage = lazy(() => import('@/modules/appointments/AppointmentsPage'))
const DoctorsPage = lazy(() => import('@/modules/doctors/DoctorsPage'))
const LaboratoryPage = lazy(() => import('@/modules/laboratory/LaboratoryPage'))
const PharmacyPage = lazy(() => import('@/modules/pharmacy/PharmacyPage'))
const AdmissionsPage = lazy(() => import('@/modules/admissions/AdmissionsPage'))
const BedManagementPage = lazy(() => import('@/modules/beds/BedManagementPage'))
const DeliveryPage = lazy(() => import('@/modules/delivery/DeliveryManagementPage'))
const NewbornPage = lazy(() => import('@/modules/newborn/NewbornManagementPage'))
const BillingPage = lazy(() => import('@/modules/billing/BillingPage'))
const HRPage = lazy(() => import('@/modules/hr/HRPage'))
const ReportsPage = lazy(() => import('@/modules/reports/ReportsPage'))
const SettingsPage = lazy(() => import('@/modules/settings/SettingsPage'))
const ConsultationPage = lazy(() => import('@/modules/consultations/ConsultationPage'))
const PrintPrescriptionPage = lazy(() => import('@/modules/prescriptions/PrintPrescriptionPage'))

// ── Guards ───────────────────────────────────────────────────────────────────
function RequireAuth({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  // Fast-path: check localStorage token to survive async rehydration
  const hasPersistedToken = !!localStorage.getItem('mc_token')
  return (isAuthenticated || hasPersistedToken) ? children : <Navigate to="/login" replace />
}

// ── Router ───────────────────────────────────────────────────────────────────
export const router = createBrowserRouter([
  // Auth routes
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: <LoginPage /> },
    ],
  },

  // Protected app routes
  {
    element: <RequireAuth><AppLayout /></RequireAuth>,
    children: [
      { path: '/', element: <Navigate to="/dashboard" replace /> },
      { path: '/dashboard', element: <DashboardPage /> },
      { path: '/patients', element: <PatientsPage /> },
      { path: '/patients/register', element: <RegisterPatientPage /> },
      { path: '/patients/:id', element: <PatientDetailPage /> },
      { path: '/patients/:id/pregnancy', element: <PregnancyTrackingPage /> },
      { path: '/appointments', element: <AppointmentsPage /> },
      { path: '/doctors', element: <DoctorsPage /> },
      { path: '/consultations/:id', element: <ConsultationPage /> },
      { path: '/laboratory', element: <LaboratoryPage /> },
      { path: '/pharmacy', element: <PharmacyPage /> },
      { path: '/admissions', element: <AdmissionsPage /> },
      { path: '/beds', element: <BedManagementPage /> },
      { path: '/delivery', element: <DeliveryPage /> },
      { path: '/newborn', element: <NewbornPage /> },
      { path: '/billing', element: <BillingPage /> },
      { path: '/hr', element: <HRPage /> },
      { path: '/reports', element: <ReportsPage /> },
      { path: '/settings', element: <SettingsPage /> },
    ],
  },
  {
    path: '/prescriptions/:id/print',
    element: <RequireAuth><PrintPrescriptionPage /></RequireAuth>
  },

  // 404 fallback
  { path: '*', element: <Navigate to="/" replace /> },
])
