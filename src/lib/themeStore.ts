import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ThemeMode = 'light' | 'dark'

interface ThemeState {
  mode: ThemeMode
  accent: string
  setMode: (mode: ThemeMode) => void
  setAccent: (accent: string) => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: 'dark',
      accent: '#7fd4e8',
      setMode: (mode) => set({ mode }),
      setAccent: (accent) => set({ accent }),
    }),
    { name: 'transapp.theme' },
  ),
)

export function applyTheme(mode: ThemeMode, accent: string) {
  const root = document.documentElement
  root.setAttribute('data-theme', mode)
  root.style.setProperty('--accent', accent)
}
