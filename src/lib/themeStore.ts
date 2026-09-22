import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ThemeMode = 'light' | 'dark'

export interface ColorShortcut {
  key: string
  accent: string
  accent2: string
}

/** Atalhos de cor — apenas combinações bonitas, sem associação de gênero. */
export const COLOR_SHORTCUTS: ColorShortcut[] = [
  { key: 'rosa-azul', accent: '#F5A9B8', accent2: '#5BCEFA' },
  { key: 'azul-rosa', accent: '#5BCEFA', accent2: '#F5A9B8' },
  { key: 'roxo-amarelo', accent: '#9C59D1', accent2: '#FFF433' },
  { key: 'verde-turquesa', accent: '#34D399', accent2: '#22D3EE' },
  { key: 'coral-pessego', accent: '#FB7185', accent2: '#FDBA74' },
  { key: 'lavanda', accent: '#A78BFA', accent2: '#C4B5FD' },
]

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
