import type { CSSProperties } from 'react'

// Como cada item da lojinha (shared/shopCatalog.ts) aparece na tela. Cores fixas de propósito nas
// molduras e bordas: elas aparecem pra outras pessoas, que estão com o próprio tema — usar
// var(--accent) ali mostraria a cor de quem vê, não a de quem comprou.

export interface CardSkinVisual {
  style: CSSProperties
  /** cor do texto em cima do fundo */
  color: string
  /** espaço extra à esquerda pras faixas de bandeira */
  paddingLeft?: number
  pixel?: boolean
}

// faixas verticais à esquerda + fundo clarinho: bandeira reconhecível sem matar a leitura do texto
function flagStripes(colors: string[], bg: string): string {
  const w = 6
  const stops = colors.map((c, i) => `${c} ${i * w}px ${(i + 1) * w}px`).join(', ')
  return `linear-gradient(90deg, ${stops}, ${bg} ${colors.length * w}px)`
}

const STARS =
  'radial-gradient(1px 1px at 12% 22%, #fff 50%, transparent 51%), radial-gradient(1.5px 1.5px at 68% 58%, #fff 50%, transparent 51%), radial-gradient(1px 1px at 38% 82%, #fff 50%, transparent 51%), radial-gradient(1px 1px at 86% 18%, #fff 50%, transparent 51%), radial-gradient(1.5px 1.5px at 52% 36%, #fde68a 50%, transparent 51%)'

export const CARD_SKINS: Record<string, CardSkinVisual> = {
  'card-algodao': { style: { background: 'linear-gradient(135deg, #fbcfe8, #ddd6fe)' }, color: '#4a2c3d' },
  'card-por-do-sol': { style: { background: 'linear-gradient(135deg, #ff7e5f, #ff6a88 55%, #fbbf24)' }, color: '#ffffff' },
  'card-aurora': { style: { background: 'linear-gradient(135deg, #22d3ee, #34d399 40%, #8b5cf6)' }, color: '#ffffff' },
  'card-trans': {
    style: { background: flagStripes(['#5bcefa', '#f5a9b8', '#ffffff', '#f5a9b8', '#5bcefa'], '#fdf2f8') },
    color: '#3b2531',
    paddingLeft: 42,
  },
  'card-nb': {
    style: { background: flagStripes(['#fcf434', '#ffffff', '#9c59d1', '#2c2c2c'], '#f5f0ff') },
    color: '#2e2140',
    paddingLeft: 36,
  },
  'card-galaxia': { style: { background: `${STARS}, linear-gradient(135deg, #1e1b4b, #4c1d95 60%, #831843)` }, color: '#ffffff' },
  'card-pixel': {
    style: {
      background:
        'linear-gradient(rgba(255,255,255,0.6), rgba(255,255,255,0.6)), repeating-conic-gradient(#f5a9b8 0 25%, #5bcefa 0 50%) 0 0 / 16px 16px',
    },
    color: '#1f1720',
    pixel: true,
  },
}

export interface AvatarFrameVisual {
  /** fundo do anel em volta da foto */
  ring: string
  pixel?: boolean
}

export const AVATAR_FRAMES: Record<string, AvatarFrameVisual> = {
  'frame-brilho': { ring: 'linear-gradient(135deg, #f5a9b8, #5bcefa)' },
  'frame-arco-iris': { ring: 'conic-gradient(#ef4444, #f59e0b, #eab308, #22c55e, #3b82f6, #8b5cf6, #ef4444)' },
  'frame-trans': { ring: 'conic-gradient(#5bcefa 0 20%, #f5a9b8 0 40%, #ffffff 0 60%, #f5a9b8 0 80%, #5bcefa 0)' },
  'frame-nb': { ring: 'conic-gradient(#fcf434 0 25%, #ffffff 0 50%, #9c59d1 0 75%, #2c2c2c 0)' },
  'frame-dourada': { ring: 'conic-gradient(#b7791f, #fde68a, #d4a017, #fff3b0, #b7791f)' },
  'frame-pixel': { ring: '#9c59d1', pixel: true },
}

export interface PostFrameVisual {
  /** fundo que aparece como borda em volta do card do post */
  border: string
  glow?: string
  pixel?: boolean
}

export const POST_FRAMES: Record<string, PostFrameVisual> = {
  'pframe-suave': { border: 'linear-gradient(135deg, #f9a8d4, #c4b5fd)' },
  'pframe-trans': { border: 'linear-gradient(90deg, #5bcefa, #f5a9b8, #ffffff, #f5a9b8, #5bcefa)' },
  'pframe-neon': { border: 'linear-gradient(135deg, #22d3ee, #a855f7)', glow: '0 0 18px rgba(168, 85, 247, 0.45)' },
  'pframe-dourada': { border: 'linear-gradient(135deg, #b7791f, #fde68a, #d4a017, #fff3b0, #b7791f)' },
  'pframe-pixel': { border: '#9c59d1', pixel: true },
}

export interface ThemeVisual {
  accent: string
  accent2: string
  accent3: string
  /** força o modo (a Galáxia só faz sentido no escuro) */
  mode?: 'light' | 'dark'
  /** valor de data-skin no <html> — fundo e padrão em src/index.css */
  skin: string
}

export const THEMES: Record<string, ThemeVisual> = {
  'theme-oceano': { accent: '#38bdf8', accent2: '#2dd4bf', accent3: '#0ea5e9', skin: 'oceano' },
  'theme-por-do-sol': { accent: '#fb7185', accent2: '#fdba74', accent3: '#f59e0b', skin: 'por-do-sol' },
  'theme-floresta': { accent: '#4ade80', accent2: '#a3e635', accent3: '#ca8a04', skin: 'floresta' },
  'theme-galaxia': { accent: '#a78bfa', accent2: '#f472b6', accent3: '#fde047', mode: 'dark', skin: 'galaxia' },
  'theme-retro': { accent: '#ff77a8', accent2: '#29adff', accent3: '#ffec27', skin: 'retro' },
}

export interface CalendarSkinVisual {
  cardClass?: string
  cardStyle?: CSSProperties
  /** dia sem registro (com registro, a cor do registro manda) */
  emptyDayClass: (weekday: number) => string
  emptyDayStyle?: (weekday: number) => CSSProperties | undefined
  titleClass?: string
  dayShape: string
}

const PASTEL = ['#fde2e4', '#e2ece9', '#fff1e6', '#e9e4f9', '#dff3fb', '#fdf6d8', '#f0e6ef']

export const CALENDAR_SKINS: Record<string, CalendarSkinVisual> = {
  'cal-pastel': {
    emptyDayClass: () => 'text-[#3b2f36]',
    emptyDayStyle: (weekday) => ({ background: PASTEL[weekday] }),
    dayShape: 'rounded-2xl',
  },
  'cal-estrelado': {
    // redefine as cores do tema só dentro do card: tudo lá dentro (setas, legenda) vira claro no céu escuro
    cardStyle: {
      background: `${STARS}, linear-gradient(160deg, #0f172a, #312e81 70%, #4c1d95)`,
      '--text': '#ffffff',
      '--text-muted': 'rgba(255, 255, 255, 0.7)',
      '--surface-2': 'rgba(255, 255, 255, 0.1)',
      '--border': 'rgba(255, 255, 255, 0.2)',
      '--surface': '#1e1b4b',
    } as CSSProperties,
    cardClass: 'border-transparent',
    emptyDayClass: () => 'text-[var(--text)] hover:bg-white/10',
    dayShape: 'rounded-full',
  },
  'cal-pixel': {
    cardClass: 'pixel-frame !rounded-none font-pixel',
    emptyDayClass: () => 'text-[var(--text)] hover:bg-[var(--surface-2)]',
    titleClass: 'font-pixel uppercase tracking-wider',
    dayShape: 'rounded-none',
  },
}
