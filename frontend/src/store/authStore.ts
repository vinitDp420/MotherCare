/**
 * MotherCare Auth Store (Zustand)
 * Manages: authenticated user, token, roles, permissions
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthUser } from '@/types/common.types'

interface AuthState {
  token: string | null
  user: AuthUser | null
  isAuthenticated: boolean

  // Actions
  setAuth: (token: string, user: AuthUser) => void
  clearAuth: () => void
  updateUser: (user: AuthUser) => void

  // Permission helpers
  hasPermission: (module: string, action: string) => boolean
  hasRole: (roleName: string) => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,

      setAuth: (token, user) => {
        localStorage.setItem('mc_token', token)
        set({ token, user, isAuthenticated: true })
      },

      clearAuth: () => {
        localStorage.removeItem('mc_token')
        set({ token: null, user: null, isAuthenticated: false })
      },

      updateUser: (user) => set({ user }),

      hasPermission: (module, action) => {
        const { user } = get()
        if (!user) return false
        return user.permissions.includes(`${module}:${action}`)
      },

      hasRole: (roleName) => {
        const { user } = get()
        if (!user) return false
        return user.roles.includes(roleName)
      },
    }),
    {
      name: 'mc-auth',
      partialize: (state) => ({ token: state.token, user: state.user }),
      onRehydrateStorage: () => (state) => {
        // After rehydrating persisted token/user, derive isAuthenticated
        if (state && state.token && state.user) {
          state.isAuthenticated = true
          // Ensure localStorage token stays in sync for the axios interceptor
          localStorage.setItem('mc_token', state.token)
        }
      },
    }
  )
)
