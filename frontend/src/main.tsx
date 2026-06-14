/// <reference types="vite/client" />
import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { router } from './router'
import './styles/globals.css'

// ── Theme pre-hydration ──────────────────────────────────────────────────────
// Apply the stored theme class to <html> BEFORE React renders to prevent
// a flash of wrong theme. This reads from Zustand's persisted store key.
try {
  const stored = localStorage.getItem('mc-ui')
  if (stored) {
    const { state } = JSON.parse(stored)
    if (state?.theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  } else {
    // No stored preference — default to light mode
    document.documentElement.classList.remove('dark')
  }
} catch {
  document.documentElement.classList.remove('dark')
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,           // 30 seconds — matches DASHBOARD_KPI_CACHE_SECONDS
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading…</div>}>
        <RouterProvider router={router} />
      </Suspense>
    </QueryClientProvider>
  </StrictMode>
)
