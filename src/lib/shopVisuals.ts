import type { CSSProperties } from 'react'
import type { PixelIconName } from '../components/PixelIcon'

// Como cada item da lojinha (shared/shopCatalog.ts) aparece na tela. Cores fixas de propósito nas
// molduras, bordas e cards: elas aparecem pra outras pessoas, que estão com o próprio tema — usar
// var(--accent) ali mostraria a cor de quem vê, não a de quem comprou.

const TRANS = ['#5bcefa', '#f5a9b8', '#ffffff', '#f5a9b8', '#5bcefa']
const NB = ['#fcf434', '#ffffff', '#9c59d1', '#2c2c2c']
const RAINBOW = ['#ef4444', '#f59e0b', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6']
const LESBIAN = ['#d52d00', '#ff9a56', '#ffffff', '#d362a4', '#a30262']
const BI = ['#d60270', '#d60270', '#9b4f96', '#0038a8', '#0038a8']
const PAN = ['#ff218c', '#ffd800', '#21b1ff']
const PASTEL_RAINBOW = ['#fecaca', '#fed7aa', '#fef08a', '#bbf7d0', '#bae6fd', '#ddd6fe', '#fbcfe8']
const GOLD = 'conic-gradient(#b7791f, #fde68a, #d4a017, #fff3b0, #b7791f)'
const HOLO = 'linear-gradient(135deg, #a5f3fc, #f0abfc 25%, #fde68a 50%, #a7f3d0 75%, #c4b5fd)'

/** Faixas iguais em volta do círculo (bandeiras nas molduras). */
function conicStripes(colors: string[]): string {
  const step = 100 / colors.length
  return `conic-gradient(${colors.map((c, i) => `${c} ${i * step}% ${(i + 1) * step}%`).join(', ')})`
}

/** Faixas verticais à esquerda + fundo clarinho: bandeira reconhecível sem matar a leitura. */
function flagStripes(colors: string[], bg: string): string {
  const w = 6
  const stops = colors.map((c, i) => `${c} ${i * w}px ${(i + 1) * w}px`).join(', ')
  return `linear-gradient(90deg, ${stops}, ${bg} ${colors.length * w}px)`
}

const STARS =
  'radial-gradient(1px 1px at 12% 22%, #fff 50%, transparent 51%), radial-gradient(1.5px 1.5px at 68% 58%, #fff 50%, transparent 51%), radial-gradient(1px 1px at 38% 82%, #fff 50%, transparent 51%), radial-gradient(1px 1px at 86% 18%, #fff 50%, transparent 51%), radial-gradient(1.5px 1.5px at 52% 36%, #fde68a 50%, transparent 51%)'
const SNOW =
  'radial-gradient(2px 2px at 10% 20%, #fff 50%, transparent 55%), radial-gradient(1.5px 1.5px at 30% 70%, #fff 50%, transparent 55%), radial-gradient(2px 2px at 55% 35%, #fff 50%, transparent 55%), radial-gradient(1.5px 1.5px at 75% 80%, #fff 50%, transparent 55%), radial-gradient(2px 2px at 90% 15%, #fff 50%, transparent 55%)'

// ---- Cards de post ----------------------------------------------------------------------------

export interface CardSkinVisual {
  style: CSSProperties
  /** cor do texto em cima do fundo */
  color: string
  /** espaço extra à esquerda pras faixas de bandeira */
  paddingLeft?: number
  pixel?: boolean
}

export const CARD_SKINS: Record<string, CardSkinVisual> = {
  'card-algodao': { style: { background: 'linear-gradient(135deg, #fbcfe8, #ddd6fe)' }, color: '#4a2c3d' },
  'card-por-do-sol': { style: { background: 'linear-gradient(135deg, #ff7e5f, #ff6a88 55%, #fbbf24)' }, color: '#ffffff' },
  'card-oceano': { style: { background: 'linear-gradient(160deg, #0c4a6e, #0e7490 55%, #2dd4bf)' }, color: '#ffffff' },
  'card-morango': { style: { background: 'linear-gradient(135deg, #fff1f2, #fecdd3 60%, #fb7185)' }, color: '#4c0519' },
  'card-menta': { style: { background: 'linear-gradient(135deg, #ecfdf5, #a7f3d0 60%, #5eead4)' }, color: '#064e3b' },
  'card-aurora': { style: { background: 'linear-gradient(135deg, #22d3ee, #34d399 40%, #8b5cf6)' }, color: '#ffffff' },
  'card-holografico': { style: { background: HOLO }, color: '#312e81' },
  'card-galaxia': { style: { background: `${STARS}, linear-gradient(135deg, #1e1b4b, #4c1d95 60%, #831843)` }, color: '#ffffff' },
  'card-trans': { style: { background: flagStripes(TRANS, '#fdf2f8') }, color: '#3b2531', paddingLeft: 42 },
  'card-nb': { style: { background: flagStripes(NB, '#f5f0ff') }, color: '#2e2140', paddingLeft: 36 },
  'card-orgulho': { style: { background: flagStripes(RAINBOW, '#fffdf5') }, color: '#2b2440', paddingLeft: 48 },
  'card-lesbica': { style: { background: flagStripes(LESBIAN, '#fff5f2') }, color: '#3d1626', paddingLeft: 42 },
  'card-bi': { style: { background: flagStripes(BI, '#f6f2ff') }, color: '#251a3d', paddingLeft: 42 },
  'card-pan': { style: { background: flagStripes(PAN, '#fffbea') }, color: '#3a2433', paddingLeft: 30 },
  'card-pastel': { style: { background: `linear-gradient(135deg, ${PASTEL_RAINBOW.join(', ')})` }, color: '#3b2f36' },
  'card-natal': { style: { background: `${SNOW}, linear-gradient(160deg, #b91c1c, #dc2626 60%, #15803d)` }, color: '#ffffff' },
  'card-gotico': {
    style: {
      background:
        'radial-gradient(circle at 85% 20%, #fde68a 0 9px, transparent 10px), radial-gradient(circle at 87% 18%, #1a0b10 0 8px, transparent 9px), linear-gradient(160deg, #0b0b0f, #3b0a1a 70%, #7f1d1d)',
    },
    color: '#fecdd3',
  },
  'card-pixel': {
    style: {
      background:
        'linear-gradient(rgba(255,255,255,0.6), rgba(255,255,255,0.6)), repeating-conic-gradient(#f5a9b8 0 25%, #5bcefa 0 50%) 0 0 / 16px 16px',
    },
    color: '#1f1720',
    pixel: true,
  },
}

// ---- Molduras de perfil -----------------------------------------------------------------------

export type OrnamentPos = 'top' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

export interface Ornament {
  icon: PixelIconName
  pos: OrnamentPos
  palette?: Record<string, string>
  /** tamanho relativo ao avatar (padrão 0.36) */
  scale?: number
}

export interface AvatarFrameVisual {
  /** fundo do anel em volta da foto */
  ring: string
  /** espessura do anel relativa ao tamanho (padrão 0.09) */
  thickness?: number
  glow?: string
  pixel?: boolean
  ornaments?: Ornament[]
  /** orelhinhas de gato em cima */
  ears?: { color: string; inner: string }
}

const PINK_HEART = { a: '#f472b6' }

export const AVATAR_FRAMES: Record<string, AvatarFrameVisual> = {
  'frame-brilho': {
    ring: 'linear-gradient(135deg, #f5a9b8, #c4b5fd, #5bcefa)',
    ornaments: [{ icon: 'sparkle', pos: 'top-right', palette: { a: '#f5a9b8', b: '#5bcefa' } }],
  },
  'frame-coracoes': {
    ring: 'linear-gradient(135deg, #fbcfe8, #f472b6)',
    ornaments: [
      { icon: 'heart', pos: 'top-right', palette: PINK_HEART },
      { icon: 'heart', pos: 'bottom-left', palette: PINK_HEART, scale: 0.26 },
    ],
  },
  'frame-gatinho': {
    ring: 'linear-gradient(135deg, #f9a8d4, #fda4af)',
    ears: { color: '#f9a8d4', inner: '#fff1f2' },
  },
  'frame-arco-iris': {
    ring: `conic-gradient(${[...RAINBOW, RAINBOW[0]].join(', ')})`,
    glow: '0 0 10px rgba(139, 92, 246, 0.35)',
    ornaments: [{ icon: 'star', pos: 'top-right', scale: 0.32 }],
  },
  'frame-estrelas': {
    ring: 'linear-gradient(135deg, #1e1b4b, #4338ca)',
    ornaments: [
      { icon: 'star', pos: 'top-left', scale: 0.3 },
      { icon: 'star', pos: 'bottom-right', scale: 0.24 },
      { icon: 'moon', pos: 'top-right', scale: 0.3 },
    ],
  },
  'frame-neon': {
    ring: 'linear-gradient(135deg, #22d3ee, #a855f7, #ec4899)',
    glow: '0 0 12px rgba(168, 85, 247, 0.6), 0 0 4px rgba(34, 211, 238, 0.8)',
  },
  'frame-dourada': {
    ring: GOLD,
    thickness: 0.11,
    glow: '0 0 10px rgba(212, 160, 23, 0.45)',
    ornaments: [{ icon: 'crown', pos: 'top', scale: 0.42, palette: { a: '#ef4444', b: '#3b82f6' } }],
  },
  'frame-trans': {
    ring: conicStripes(TRANS),
    // estrela, não laço: a bandeira é de todo mundo trans (fem, masc, nb)
    ornaments: [{ icon: 'star', pos: 'top-right', scale: 0.34, palette: { c: '#5bcefa', y: '#ffffff', k: '#f5a9b8' } }],
  },
  'frame-lesbica': {
    ring: conicStripes(LESBIAN),
    ornaments: [{ icon: 'heart', pos: 'top-right', scale: 0.3, palette: { a: '#d362a4' } }],
  },
  'frame-bi': {
    ring: conicStripes(BI),
    ornaments: [{ icon: 'heart', pos: 'top-right', scale: 0.3, palette: { a: '#9b4f96' } }],
  },
  'frame-pan': {
    ring: conicStripes(PAN),
    ornaments: [{ icon: 'star', pos: 'top-right', scale: 0.32, palette: { c: '#ffd800', y: '#ffffff', k: '#ff218c' } }],
  },
  'frame-nb': {
    ring: conicStripes(NB),
    ornaments: [{ icon: 'star', pos: 'top-right', scale: 0.34, palette: { c: '#fcf434', y: '#ffffff', k: '#9c59d1' } }],
  },
  'frame-pastel': {
    ring: `conic-gradient(${[...PASTEL_RAINBOW, PASTEL_RAINBOW[0]].join(', ')})`,
    thickness: 0.11,
    ornaments: [
      { icon: 'flower', pos: 'top-right' },
      { icon: 'flower', pos: 'bottom-left', scale: 0.28, palette: { p: '#c4b5fd' } },
    ],
  },
  'frame-natal': {
    ring: 'repeating-conic-gradient(#dc2626 0 15deg, #ffffff 15deg 30deg)',
    thickness: 0.1,
    ornaments: [
      { icon: 'tree', pos: 'top-right', scale: 0.42 },
      { icon: 'snowflake', pos: 'bottom-left', scale: 0.28 },
    ],
  },
  'frame-gotico': {
    ring: 'conic-gradient(#0b0b0f, #7f1d1d, #0b0b0f, #3b0a1a, #0b0b0f)',
    thickness: 0.1,
    glow: '0 0 10px rgba(127, 29, 29, 0.5)',
    ornaments: [
      { icon: 'bat', pos: 'top', scale: 0.3 },
      { icon: 'moon', pos: 'bottom-right', scale: 0.28 },
    ],
  },
  'frame-pixel': {
    ring: '#9c59d1',
    pixel: true,
    ornaments: [{ icon: 'sparkle', pos: 'top-right', scale: 0.32, palette: { a: '#fcf434', b: '#9c59d1' } }],
  },
}

// ---- Bordas de post ---------------------------------------------------------------------------

export interface PostFrameVisual {
  /** fundo que aparece como borda em volta do card do post */
  border: string
  glow?: string
  pixel?: boolean
  /** enfeite no canto de cima à direita */
  ornament?: { icon: PixelIconName; palette?: Record<string, string> }
}

export const POST_FRAMES: Record<string, PostFrameVisual> = {
  'pframe-suave': { border: 'linear-gradient(135deg, #f9a8d4, #c4b5fd)' },
  'pframe-arco-iris': { border: `linear-gradient(90deg, ${RAINBOW.join(', ')})` },
  'pframe-holografica': { border: HOLO, glow: '0 0 14px rgba(240, 171, 252, 0.4)' },
  'pframe-neon': { border: 'linear-gradient(135deg, #22d3ee, #a855f7)', glow: '0 0 18px rgba(168, 85, 247, 0.45)' },
  'pframe-dourada': {
    border: 'linear-gradient(135deg, #b7791f, #fde68a, #d4a017, #fff3b0, #b7791f)',
    ornament: { icon: 'star' },
  },
  'pframe-trans': {
    border: `linear-gradient(90deg, ${TRANS.join(', ')})`,
    ornament: { icon: 'heart', palette: { a: '#f5a9b8' } },
  },
  'pframe-lesbica': { border: `linear-gradient(90deg, ${LESBIAN.join(', ')})`, ornament: { icon: 'heart', palette: { a: '#d362a4' } } },
  'pframe-bi': { border: `linear-gradient(90deg, ${BI.join(', ')})`, ornament: { icon: 'heart', palette: { a: '#9b4f96' } } },
  'pframe-pan': { border: `linear-gradient(90deg, ${PAN.join(', ')})`, ornament: { icon: 'star', palette: { c: '#ffd800', y: '#ffffff', k: '#ff218c' } } },
  'pframe-nb': {
    border: `linear-gradient(90deg, ${NB.join(', ')})`,
    ornament: { icon: 'star', palette: { c: '#fcf434', y: '#ffffff', k: '#9c59d1' } },
  },
  'pframe-pastel': {
    border: `linear-gradient(90deg, ${PASTEL_RAINBOW.join(', ')})`,
    ornament: { icon: 'bow' },
  },
  'pframe-natal': {
    border: 'repeating-linear-gradient(45deg, #dc2626 0 10px, #ffffff 10px 20px)',
    ornament: { icon: 'tree' },
  },
  'pframe-gotico': {
    border: 'linear-gradient(135deg, #0b0b0f, #7f1d1d, #0b0b0f)',
    glow: '0 0 14px rgba(127, 29, 29, 0.4)',
    ornament: { icon: 'bat' },
  },
  'pframe-pixel': { border: '#9c59d1', pixel: true, ornament: { icon: 'sparkle', palette: { a: '#fcf434', b: '#9c59d1' } } },
}

// ---- Temas ------------------------------------------------------------------------------------

export interface ThemeVisual {
  accent: string
  accent2: string
  accent3: string
  mode: 'light' | 'dark'
  /** valor de data-skin no <html> — fundo e padrão em src/index.css (sem skin = fundo neutro) */
  skin?: string
}

export const THEMES: Record<string, ThemeVisual> = {
  'theme-aurora-claro': { accent: '#F5A9B8', accent2: '#5BCEFA', accent3: '#D4AF37', mode: 'light' },
  'theme-lavanda': { accent: '#A78BFA', accent2: '#5EEAD4', accent3: '#F472B6', mode: 'light' },
  'theme-aurora-escuro': { accent: '#F5A9B8', accent2: '#5BCEFA', accent3: '#D4AF37', mode: 'dark' },
  'theme-meia-noite': { accent: '#60A5FA', accent2: '#C084FC', accent3: '#FDE047', mode: 'dark' },
  'theme-oceano': { accent: '#38bdf8', accent2: '#2dd4bf', accent3: '#0ea5e9', mode: 'light', skin: 'oceano' },
  'theme-por-do-sol': { accent: '#fb7185', accent2: '#fdba74', accent3: '#f59e0b', mode: 'light', skin: 'por-do-sol' },
  'theme-floresta': { accent: '#4ade80', accent2: '#a3e635', accent3: '#ca8a04', mode: 'light', skin: 'floresta' },
  'theme-cereja': { accent: '#f472b6', accent2: '#fda4af', accent3: '#be185d', mode: 'light', skin: 'cereja' },
  'theme-galaxia': { accent: '#a78bfa', accent2: '#f472b6', accent3: '#fde047', mode: 'dark', skin: 'galaxia' },
  'theme-trans': { accent: '#f5a9b8', accent2: '#5bcefa', accent3: '#f472b6', mode: 'light', skin: 'trans' },
  'theme-nb': { accent: '#c084fc', accent2: '#fcf434', accent3: '#9c59d1', mode: 'dark', skin: 'nb' },
  'theme-pastel': { accent: '#f9a8d4', accent2: '#a5b4fc', accent3: '#86efac', mode: 'light', skin: 'pastel' },
  'theme-natal': { accent: '#dc2626', accent2: '#16a34a', accent3: '#eab308', mode: 'light', skin: 'natal' },
  'theme-gotico': { accent: '#e11d48', accent2: '#a78bfa', accent3: '#fde68a', mode: 'dark', skin: 'gotico' },
  'theme-retro': { accent: '#ff77a8', accent2: '#29adff', accent3: '#ffec27', mode: 'light', skin: 'retro' },
}

// ---- Calendários ------------------------------------------------------------------------------

export interface CalendarSkinVisual {
  cardClass?: string
  cardStyle?: CSSProperties
  /** dia sem registro (com registro, a cor do registro manda) */
  emptyDayClass: (weekday: number) => string
  emptyDayStyle?: (weekday: number) => CSSProperties | undefined
  titleClass?: string
  dayShape: string
}

const PASTEL_DAYS = ['#fde2e4', '#e2ece9', '#fff1e6', '#e9e4f9', '#dff3fb', '#fdf6d8', '#f0e6ef']
const TRANS_DAYS = ['#d6f1fd', '#fde4ea', '#ffffff', '#fde4ea', '#d6f1fd', '#fde4ea', '#ffffff']
const NB_DAYS: [string, string][] = [
  ['#fefbc2', '#3a3220'],
  ['#ffffff', '#2e2140'],
  ['#ead9f5', '#2e2140'],
  ['#2c2c2c', '#ffffff'],
]

// redefine as cores do tema só dentro do card: setas, legenda e textos ficam legíveis no fundo escuro
const darkCardVars = (bg: string, surface: string): CSSProperties =>
  ({
    background: bg,
    '--text': '#ffffff',
    '--text-muted': 'rgba(255, 255, 255, 0.7)',
    '--surface-2': 'rgba(255, 255, 255, 0.1)',
    '--border': 'rgba(255, 255, 255, 0.2)',
    '--surface': surface,
  }) as CSSProperties

export const CALENDAR_SKINS: Record<string, CalendarSkinVisual> = {
  'cal-pastel': {
    emptyDayClass: () => 'text-[#3b2f36]',
    emptyDayStyle: (weekday) => ({ background: PASTEL_DAYS[weekday] }),
    dayShape: 'rounded-2xl',
  },
  'cal-oceano': {
    cardStyle: { background: 'linear-gradient(180deg, #f0f9ff, #ccfbf1)' },
    emptyDayClass: () => 'text-[#0c4a6e]',
    emptyDayStyle: (weekday) => ({ background: weekday % 2 ? '#e0f2fe' : '#ccfbf1' }),
    dayShape: 'rounded-[40%_60%_55%_45%]',
  },
  'cal-estrelado': {
    cardStyle: darkCardVars(`${STARS}, linear-gradient(160deg, #0f172a, #312e81 70%, #4c1d95)`, '#1e1b4b'),
    cardClass: 'border-transparent',
    emptyDayClass: () => 'text-[var(--text)] hover:bg-white/10',
    dayShape: 'rounded-full',
  },
  'cal-trans': {
    emptyDayClass: () => 'text-[#3b2531]',
    emptyDayStyle: (weekday) => ({ background: TRANS_DAYS[weekday], border: '1px solid #fbcfe8' }),
    dayShape: 'rounded-xl',
  },
  'cal-nb': {
    emptyDayClass: () => '',
    emptyDayStyle: (weekday) => {
      const [bg, fg] = NB_DAYS[weekday % NB_DAYS.length]
      return { background: bg, color: fg }
    },
    dayShape: 'rounded-xl',
  },
  'cal-natal': {
    cardStyle: { background: `${SNOW.replaceAll('#fff', '#e5e7eb')}, linear-gradient(180deg, #fff7ed, #fef2f2)` },
    emptyDayClass: () => 'text-[#7f1d1d]',
    emptyDayStyle: (weekday) => ({ background: weekday % 2 ? '#fee2e2' : '#dcfce7' }),
    dayShape: 'rounded-2xl',
  },
  'cal-gotico': {
    cardStyle: darkCardVars('linear-gradient(160deg, #0b0b0f, #1f0a12 70%, #3b0a1a)', '#140a0e'),
    cardClass: 'border-transparent',
    emptyDayClass: () => 'text-[#fecdd3] hover:bg-white/10',
    emptyDayStyle: () => ({ background: 'rgba(127, 29, 29, 0.25)' }),
    dayShape: 'rounded-full',
  },
  'cal-pixel': {
    cardClass: 'pixel-frame !rounded-none font-pixel',
    emptyDayClass: () => 'text-[var(--text)] hover:bg-[var(--surface-2)]',
    titleClass: 'font-pixel uppercase tracking-wider',
    dayShape: 'rounded-none',
  },
}
