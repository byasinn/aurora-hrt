import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ThemeMode = 'light' | 'dark'

export interface FlagPreset {
  key: string
  label: string
  emoji: string
  accent: string
  accent2: string
}

export const FLAG_PRESETS: FlagPreset[] = [
  { key: 'trans-fem', label: 'Trans feminino', emoji: '🏳️‍⚧️', accent: '#F5A9B8', accent2: '#5BCEFA' },
  { key: 'trans-masc', label: 'Trans masculino', emoji: '🏳️‍⚧️', accent: '#5BCEFA', accent2: '#F5A9B8' },
  { key: 'nonbinary', label: 'Não-binário', emoji: '💛', accent: '#9C59D1', accent2: '#FFF433' },
  { key: 'custom', label: 'Cor única', emoji: '🎨', accent: '#7fd4e8', accent2: '#7fd4e8' },
]

interface ThemeState {
  mode: ThemeMode
  accent: string
  accent2: string
  presentation: string
  setMode: (mode: ThemeMode) => void
  setAccent: (accent: string, accent2?: string) => void
  setPresentation: (presentation: string) => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: 'light',
      accent: '#F5A9B8',
      accent2: '#5BCEFA',
      presentation: 'trans-fem',
      setMode: (mode) => set({ mode }),
      setAccent: (accent, accent2) => set({ accent, accent2: accent2 ?? accent }),
      setPresentation: (presentation) => set({ presentation }),
    }),
    { name: 'transapp.theme' },
  ),
)

export function applyTheme(mode: ThemeMode, accent: string, accent2?: string) {
  const root = document.documentElement
  root.setAttribute('data-theme', mode)
  root.style.setProperty('--accent', accent)
  root.style.setProperty('--accent-2', accent2 ?? accent)
}
