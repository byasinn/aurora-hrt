import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ThemeMode = 'light' | 'dark'

interface ThemeState {
  mode: ThemeMode
  accent: string
  accent2: string
  accent3: string // "aura" — títulos especiais e marcações mais fortes
  setMode: (mode: ThemeMode) => void
  setAccent: (accent: string, accent2?: string) => void
  setAccent3: (accent3: string) => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: 'light',
      accent: '#F5A9B8',
      accent2: '#5BCEFA',
      accent3: '#D4AF37',
      setMode: (mode) => set({ mode }),
      setAccent: (accent, accent2) => set({ accent, accent2: accent2 ?? accent }),
      setAccent3: (accent3) => set({ accent3 }),
    }),
    { name: 'transapp.theme' },
  ),
)

export function applyTheme(mode: ThemeMode, accent: string, accent2?: string, accent3?: string) {
  const root = document.documentElement
  root.setAttribute('data-theme', mode)
  root.style.setProperty('--accent', accent)
  root.style.setProperty('--accent-2', accent2 ?? accent)
  if (accent3) root.style.setProperty('--accent-3', accent3)
}
