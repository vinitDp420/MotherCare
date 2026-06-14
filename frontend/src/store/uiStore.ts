/**
 * MotherCare UI Store (Zustand)
 * Manages: sidebar state, theme, active notifications
 * 
 * NOTE: Theme changes also apply the 'dark' class to <html> so Tailwind dark:
 * utilities activate. The store is persisted so theme survives page refresh.
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/** Apply/remove 'dark' class on <html> element to drive Tailwind dark mode */
function applyThemeToDom(theme: 'light' | 'dark') {
  if (theme === 'dark') {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

interface UIState {
  sidebarCollapsed: boolean
  theme: 'light' | 'dark'
  language: 'en' | 'mr' | 'hi'

  // Actions
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setTheme: (theme: 'light' | 'dark') => void
  toggleTheme: () => void
  setLanguage: (language: 'en' | 'mr' | 'hi') => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      sidebarCollapsed: false,
      theme: 'light',
      language: 'en',

      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

      setTheme: (theme) => {
        applyThemeToDom(theme)
        set({ theme })
      },

      toggleTheme: () => {
        const next = get().theme === 'light' ? 'dark' : 'light'
        applyThemeToDom(next)
        set({ theme: next })
      },

      setLanguage: (language) => set({ language }),
    }),
    {
      name: 'mc-ui',
      // After store rehydrates from localStorage, re-apply stored theme to DOM
      onRehydrateStorage: () => (state) => {
        if (state) {
          applyThemeToDom(state.theme)
        }
      },
    }
  )
)
