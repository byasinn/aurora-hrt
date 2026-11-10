// Pixel art gerada por código pra lojinha 8-bit: vendedoras (cabeça, cabelo, chapéu, roupa, olhos que
// piscam e boca que fala), o fundo de cada loja e o balcão. Tudo vira <rect> num SVG com crispEdges.
// Desenha formas simples numa grade e depois passa contorno e sombra automáticos — assim dá pra ter
// várias personagens detalhadas trocando só parâmetros, sem desenhar cada uma à mão.

export type Grid = (string | null)[][]

export interface Rect {
  x: number
  y: number
  w: number
  fill: string
  cls?: string
}

export function makeGrid(w: number, h: number): Grid {
  return Array.from({ length: h }, () => Array<string | null>(w).fill(null))
}

function put(g: Grid, x: number, y: number, key: string) {
  const xi = Math.round(x)
  const yi = Math.round(y)
  if (yi >= 0 && yi < g.length && xi >= 0 && xi < g[0].length) g[yi][xi] = key
}

function ellipse(g: Grid, cx: number, cy: number, rx: number, ry: number, key: string, keep?: (x: number, y: number) => boolean) {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const dx = (x - cx) / rx
      const dy = (y - cy) / ry
      if (dx * dx + dy * dy <= 1 && (!keep || keep(x, y))) put(g, x, y, key)
    }
  }
}

function rect(g: Grid, x0: number, y0: number, x1: number, y1: number, key: string) {
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) put(g, x, y, key)
}

/** Carimba um desenho em texto (cada letra = uma chave da paleta, '.' = vazio). */
export function stamp(g: Grid, rows: string[], ox: number, oy: number, map: Record<string, string>) {
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const ch = row[x]
      if (ch !== '.' && map[ch]) put(g, ox + x, oy + y, map[ch])
    }
  })
}

/** Contorno: todo vazio encostado em algo pintado vira a cor de contorno. */
function outline(g: Grid, key = 'O', skip: string[] = []) {
  const h = g.length
  const w = g[0].length
  const marks: [number, number][] = []
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      if (g[y][x]) continue
      const near = [g[y - 1]?.[x], g[y + 1]?.[x], g[y]?.[x - 1], g[y]?.[x + 1]]
      if (near.some((n) => n && n !== key && !skip.includes(n))) marks.push([x, y])
    }
  for (const [x, y] of marks) g[y][x] = key
}

/** Junta pixels vizinhos da mesma cor numa linha só (bem menos <rect>). */
export function toRects(g: Grid, palette: Record<string, string>, classes: Record<string, string> = {}): Rect[] {
  const out: Rect[] = []
  g.forEach((row, y) => {
    let x = 0
    while (x < row.length) {
      const k = row[x]
      let len = 1
      while (x + len < row.length && row[x + len] === k) len++
      if (k && palette[k]) out.push({ x, y, w: len, fill: palette[k], cls: classes[k] })
      x += len
    }
  })
  return out
}

// ---------- cores ----------

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  const n = parseInt(h.length === 3 ? h.replace(/./g, (c) => c + c) : h, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

/** Mistura uma cor com outra (0 = a primeira, 1 = a segunda). */
export function mix(a: string, b: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(a)
  const [r2, g2, b2] = hexToRgb(b)
  const c = (x: number, y: number) => Math.round(x + (y - x) * t)
  return `#${[c(r1, r2), c(g1, g2), c(b1, b2)].map((v) => v.toString(16).padStart(2, '0')).join('')}`
}
const dark = (c: string, t = 0.28) => mix(c, '#1a0f1f', t)
const light = (c: string, t = 0.35) => mix(c, '#ffffff', t)

// ---------- vendedoras ----------

export type HairStyle = 'long' | 'bun' | 'short' | 'twin' | 'curly' | 'bob'
export type Hat = 'witch' | 'beret' | 'crown' | 'starcap' | 'cap' | 'flower'
export type Extra = 'glasses' | 'freckles' | 'earrings' | 'scarf'

export interface KeeperLook {
  skin: string
  hair: string
  eyes: string
  outfit: string
  trim: string
  hairStyle: HairStyle
  hat?: Hat
  hatColor?: string
  extras?: Extra[]
}

export const KEEPER_W = 40
export const KEEPER_H = 52
const OY = 9 // espaço em cima pro chapéu
const CX = 20
const HEAD_CY = OY + 15

/** Parte fixa da personagem (sem olhos e boca, que animam). */
export function keeperBase(look: KeeperLook): Grid {
  const g = makeGrid(KEEPER_W, KEEPER_H)
  const extras = new Set(look.extras ?? [])

  // cabelo de trás (fica atrás da cabeça e do corpo)
  if (look.hairStyle === 'long') ellipse(g, CX, HEAD_CY + 9, 13.5, 17, 'hair', (_, y) => y >= HEAD_CY - 4)
  if (look.hairStyle === 'bob') ellipse(g, CX, HEAD_CY + 1, 13.5, 11.5, 'hair', (_, y) => y >= HEAD_CY - 5)
  if (look.hairStyle === 'curly') {
    ellipse(g, CX, HEAD_CY, 15, 14, 'hair')
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 7) ellipse(g, CX + Math.cos(a) * 14, HEAD_CY + Math.sin(a) * 13, 2.6, 2.6, 'hair')
  }
  if (look.hairStyle === 'twin') {
    for (const side of [-1, 1]) {
      ellipse(g, CX + side * 13.5, HEAD_CY + 2, 4.5, 4.5, 'hair')
      ellipse(g, CX + side * 14.5, HEAD_CY + 11, 3.5, 7.5, 'hair')
    }
  }
  if (look.hairStyle === 'bun') {
    ellipse(g, CX, HEAD_CY - 12, 5, 4.5, 'hair')
    rect(g, CX - 3, HEAD_CY - 8, CX + 3, HEAD_CY - 8, 'trim') // prendedor
  }

  // corpo: ombros que alargam, gola em V com a pele aparecendo, broche no meio
  rect(g, CX - 3, HEAD_CY + 8, CX + 2, HEAD_CY + 13, 'skin') // pescoço
  for (let y = HEAD_CY + 12; y < KEEPER_H; y++) {
    const half = Math.min(15, 6 + (y - HEAD_CY - 12) * 2.3)
    for (let x = Math.ceil(CX - half - 0.5); x <= Math.floor(CX + half - 0.5); x++) {
      let key = 'outfit'
      if (x > CX + half - 5) key = 'outfitS'
      else if (x < CX - half + 2.5) key = 'outfitL'
      put(g, x, y, key)
    }
  }
  for (let y = HEAD_CY + 12; y <= HEAD_CY + 17; y++) {
    const w = (HEAD_CY + 17 - y) * 0.75
    for (let x = Math.round(CX - 0.5 - w); x <= Math.round(CX - 0.5 + w); x++) put(g, x, y, 'skin')
    put(g, Math.round(CX - 1.5 - w), y, 'trim')
    put(g, Math.round(CX + 0.5 + w), y, 'trim')
  }
  rect(g, CX - 1, HEAD_CY + 20, CX, HEAD_CY + 21, 'gem')
  put(g, CX - 1, HEAD_CY + 20, 'gemL')
  // costura dos braços
  for (let y = HEAD_CY + 17; y < KEEPER_H; y++) {
    put(g, CX - 9, y, 'outfitS')
    put(g, CX + 8, y, 'outfitS')
  }
  if (extras.has('scarf')) {
    rect(g, CX - 7, HEAD_CY + 10, CX + 6, HEAD_CY + 12, 'trim')
    rect(g, CX + 3, HEAD_CY + 13, CX + 5, HEAD_CY + 18, 'trim')
    rect(g, CX - 7, HEAD_CY + 12, CX + 6, HEAD_CY + 12, 'trimS')
  }

  // cabeça e orelhas
  ellipse(g, CX - 10.5, HEAD_CY + 2, 1.8, 2.5, 'skin')
  ellipse(g, CX + 9.5, HEAD_CY + 2, 1.8, 2.5, 'skin')
  ellipse(g, CX - 0.5, HEAD_CY, 10.5, 10, 'skin')
  if (extras.has('earrings')) {
    put(g, CX - 11, HEAD_CY + 5, 'gem')
    put(g, CX + 10, HEAD_CY + 5, 'gem')
  }

  // cabelo da frente: topo + franja em zigue-zague + mechas do lado
  const capTop = HEAD_CY - 11
  ellipse(g, CX - 0.5, HEAD_CY - 3, 11.8, 10.5, 'hair', (_, y) => y <= HEAD_CY - 5)
  const fringe = [2, 3, 3, 2, 1, 2, 3, 4, 3, 2, 3, 3, 2, 1, 2, 3, 3, 2, 3, 2, 2]
  for (let i = 0; i < fringe.length; i++) {
    const x = CX - 10 + i
    for (let y = HEAD_CY - 5; y < HEAD_CY - 5 + fringe[i]; y++) if (g[y]?.[x] === 'skin') put(g, x, y, 'hair')
  }
  const lockEnd = { long: HEAD_CY + 14, bob: HEAD_CY + 8, twin: HEAD_CY + 4, curly: HEAD_CY + 6, bun: HEAD_CY + 3, short: HEAD_CY + 2 }[look.hairStyle]
  for (let y = HEAD_CY - 6; y <= lockEnd; y++) {
    const inset = y > HEAD_CY + 5 ? 1 : 0
    rect(g, CX - 11 + inset, y, CX - 9 + inset, y, 'hair')
    rect(g, CX + 8 - inset, y, CX + 10 - inset, y, 'hair')
  }

  // sombras: pele embaixo do cabelo, cabelo do lado direito e em baixo, brilho no topo do cabelo
  for (let y = 1; y < KEEPER_H; y++)
    for (let x = 0; x < KEEPER_W; x++) {
      const k = g[y][x]
      if (k === 'skin' && (g[y - 1][x] === 'hair' || x >= CX + 8)) g[y][x] = 'skinS'
    }
  for (let y = 0; y < KEEPER_H - 1; y++)
    for (let x = 0; x < KEEPER_W - 1; x++) {
      if (g[y][x] !== 'hair') continue
      const below = g[y + 1][x]
      if (x >= CX + 6 || (below !== 'hair' && below !== 'hairS' && y > HEAD_CY)) g[y][x] = 'hairS'
    }
  for (let x = CX - 8; x <= CX - 3; x++) {
    const y = capTop + 3 + Math.round(Math.abs(x - (CX - 5.5)) * 0.5)
    if (g[y]?.[x] === 'hair') put(g, x, y, 'hairL')
  }

  drawHat(g, look)
  outline(g)
  if (extras.has('freckles')) for (const [x, y] of [[CX - 7, HEAD_CY + 5], [CX - 5, HEAD_CY + 6], [CX + 4, HEAD_CY + 6], [CX + 6, HEAD_CY + 5]]) put(g, x, y, 'skinS')
  return g
}

function drawHat(g: Grid, look: KeeperLook) {
  const top = HEAD_CY - 11
  switch (look.hat) {
    case 'witch':
      for (let y = 0; y <= top + 2; y++) {
        const t = y / (top + 2)
        const half = 1 + t * 8
        const cx = CX + 4 - t * 4.5
        for (let x = Math.round(cx - half); x <= Math.round(cx + half); x++) put(g, x, y, x > cx + half - 3 ? 'hatS' : 'hat')
      }
      ellipse(g, CX - 0.5, top + 3, 16, 2.4, 'hat')
      for (let x = CX - 16; x <= CX + 15; x++) if (g[top + 4]?.[x] === 'hat') put(g, x, top + 4, 'hatS')
      rect(g, CX - 7, top, CX + 6, top + 1, 'band')
      rect(g, CX - 1, top, CX, top + 1, 'gem')
      put(g, CX + 3, 3, 'star')
      put(g, CX - 3, top - 3, 'star')
      break
    case 'beret':
      ellipse(g, CX - 3, top + 1, 12, 4, 'hat')
      for (let x = CX - 15; x <= CX + 9; x++) if (g[top + 4]?.[x] === 'hat' || g[top + 5]?.[x] === 'hat') put(g, x, top + 4, 'hatS')
      rect(g, CX - 3, top - 4, CX - 2, top - 3, 'hatS')
      break
    case 'crown': {
      rect(g, CX - 7, top - 1, CX + 6, top + 1, 'band')
      for (const sx of [CX - 7, CX - 3, CX + 2, CX + 6]) rect(g, sx, top - 4, sx, top - 2, 'band')
      rect(g, CX - 1, top - 5, CX, top - 2, 'band')
      put(g, CX - 5, top, 'gem')
      put(g, CX + 4, top, 'gem')
      put(g, CX - 1, top, 'gemL')
      break
    }
    case 'starcap':
      for (let y = 1; y <= top + 3; y++) {
        const t = (y - 1) / (top + 2)
        const half = 1 + t * 11.5
        for (let x = Math.round(CX - 0.5 - half); x <= Math.round(CX - 0.5 + half); x++) put(g, x, y, x > CX + half - 4 ? 'hatS' : 'hat')
      }
      ellipse(g, CX - 0.5, 0.5, 1.6, 1.6, 'star')
      for (const [x, y] of [[CX - 4, top - 3], [CX + 3, top - 1], [CX - 1, top - 7], [CX + 5, top + 2], [CX - 7, top + 2]]) put(g, x, y, 'star')
      rect(g, CX - 12, top + 3, CX + 11, top + 4, 'band')
      break
    case 'cap':
      ellipse(g, CX - 0.5, top + 2, 11.5, 4.5, 'hat', (_, y) => y <= top + 3)
      rect(g, CX - 12, top + 3, CX + 2, top + 4, 'hatS')
      rect(g, CX - 2, top - 2, CX - 1, top - 1, 'band')
      break
    case 'flower': {
      const fx = CX + 8
      const fy = top + 3
      for (const [dx, dy] of [[0, -2], [-2, 0], [2, 0], [0, 2], [-1, -1], [1, -1], [-1, 1], [1, 1]]) put(g, fx + dx, fy + dy, 'petal')
      put(g, fx, fy, 'star')
      put(g, fx - 3, fy + 2, 'leaf')
      put(g, fx - 2, fy + 3, 'leaf')
      break
    }
  }
}

/** Olhos (abertos ou fechadinhos) e boca (fechada ou falando), desenhados por cima da base. */
export function keeperFace(blink: boolean, talking: boolean): Grid {
  const g = makeGrid(KEEPER_W, KEEPER_H)
  const ey = HEAD_CY
  const eyeOpen = ['.EE.', 'EWIE', 'EIIE', 'EJJE', '.EE.']
  const eyeClosed = ['....', '....', '.EE.', 'E..E', '....']
  const map = { E: 'eyeD', W: 'white', I: 'iris', J: 'irisL' }
  for (const ex of [CX - 7, CX + 2]) stamp(g, blink ? eyeClosed : eyeOpen, ex, ey, map)
  if (!blink) {
    put(g, CX - 8, ey, 'eyeD') // cílio
    put(g, CX + 6, ey, 'eyeD')
  }
  // bochechas
  for (const bx of [CX - 9, CX - 8, CX + 6, CX + 7]) put(g, bx, ey + 6, 'blush')
  // boca
  const my = ey + 7
  if (talking) {
    rect(g, CX - 2, my, CX, my, 'mouth')
    put(g, CX - 2, my + 1, 'mouth')
    put(g, CX - 1, my + 1, 'tongue')
    put(g, CX, my + 1, 'mouth')
  } else {
    put(g, CX - 2, my, 'mouth')
    put(g, CX, my, 'mouth')
    put(g, CX - 1, my + 1, 'mouth')
  }
  return g
}

export function keeperPalette(look: KeeperLook): Record<string, string> {
  const hat = look.hatColor ?? dark(look.outfit, 0.2)
  return {
    O: mix(dark(look.hair, 0.55), '#2a1626', 0.5),
    skin: look.skin,
    skinS: dark(look.skin, 0.16),
    hair: look.hair,
    hairS: dark(look.hair, 0.25),
    hairL: light(look.hair, 0.45),
    outfit: look.outfit,
    outfitS: dark(look.outfit, 0.25),
    outfitL: light(look.outfit, 0.22),
    trim: look.trim,
    trimS: dark(look.trim, 0.25),
    gem: '#e11d48',
    gemL: '#fda4af',
    hat,
    hatS: dark(hat, 0.3),
    band: look.trim,
    star: '#fde047',
    petal: '#f9a8d4',
    leaf: '#22c55e',
    eyeD: '#2a1626',
    white: '#ffffff',
    iris: look.eyes,
    irisL: light(look.eyes, 0.4),
    blush: mix(look.skin, '#fb7185', 0.45),
    mouth: '#7f1d3a',
    tongue: '#fb7185',
    glass: '#2a1626',
  }
}

/** Óculos redondinhos, por cima dos olhos (ficam na base, não piscam). */
export function keeperGlasses(look: KeeperLook): Grid | null {
  if (!look.extras?.includes('glasses')) return null
  const g = makeGrid(KEEPER_W, KEEPER_H)
  for (const ex of [CX - 8, CX + 1]) {
    for (let x = ex; x <= ex + 5; x++) {
      put(g, x, HEAD_CY - 1, 'glass')
      put(g, x, HEAD_CY + 5, 'glass')
    }
    for (let y = HEAD_CY; y <= HEAD_CY + 4; y++) {
      put(g, ex, y, 'glass')
      put(g, ex + 5, y, 'glass')
    }
  }
  rect(g, CX - 2, HEAD_CY + 1, CX, HEAD_CY + 1, 'glass')
  return g
}

// ---------- cenário (parede + prateleiras) e balcão ----------

export type WallStyle = 'planks' | 'bricks' | 'wallpaper' | 'stone' | 'night'
export type ShelfItem = 'boxes' | 'frames' | 'cards' | 'rolls' | 'paints' | 'calendars' | 'potions'
export type Prop = 'cat' | 'plant' | 'candle' | 'scroll' | 'yarn' | 'palette' | 'hourglass'

export interface SceneLook {
  wall: string
  wallStyle: WallStyle
  shelf: string
  items: ShelfItem
  /** cores dos itens nas prateleiras */
  itemColors: string[]
  window?: 'day' | 'night'
  bunting?: boolean
  counter: string
  counterTrim: string
  prop: Prop
}

export const SCENE_W = 128
export const SCENE_H = 80
export const COUNTER_H = 30

const ITEM_SPRITES: Record<ShelfItem, string[][]> = {
  potions: [
    ['..KK..', '..DD..', '.DLLD.', 'DLSLLD', 'DLLLLD', 'DLLLLD', '.DDDD.'],
    ['.KK.', '.DD.', '.DD.', 'DSLD', 'DLLD', 'DLLD', 'DDDD'],
    ['..K..', '.DDD.', 'DLSLD', 'DLLLD', '.DDD.'],
  ],
  boxes: [
    ['..R.R..', '...R...', 'DDDDDDD', 'DBBRBBD', 'DRRRRRD', 'DBBRBBD', 'DDDDDDD'],
    ['.R.R.', '..R..', 'DDDDD', 'DBRBD', 'DRRRD', 'DDDDD'],
  ],
  frames: [
    ['DDDDDDD', 'DFFFFFD', 'DFLLLFD', 'DFLHLFD', 'DFLLLFD', 'DFFFFFD', 'DDDDDDD'],
    ['DDDDD', 'DFFFD', 'DFLFD', 'DFHFD', 'DFFFD', 'DDDDD'],
  ],
  cards: [
    ['DDDDDDDD', 'DLWWWWLD', 'DWLWWLWD', 'DWWHHWWD', 'DDDDDDDD'],
    ['DDDDDD', 'DLLLLD', 'DWWWWD', 'DWHHWD', 'DWWWWD', 'DDDDDD'],
  ],
  rolls: [
    ['.DDDD.', 'DLLLLD', 'DLSSLD', 'DLSSLD', 'DLLLLD', '.DDDD.'],
    ['DDDDDDD', 'DLHLHLD', 'DLHLHLD', 'DDDDDDD'],
  ],
  paints: [
    ['DDDDD', 'DLLLD', 'DWWWD', 'DWHWD', 'DWWWD', 'DDDDD'],
    ['..D..', '..D..', '..D..', '.DLD.', '.DLD.'],
  ],
  calendars: [
    ['DDDDDDD', 'DHHHHHD', 'DWWWWWD', 'DWLWLWD', 'DWWWWWD', 'DWLWLWD', 'DDDDDDD'],
    ['DDDDD', '.DSD.', '..D..', '.DSD.', 'DSSSD', 'DDDDD'],
  ],
}

function wallPattern(g: Grid, look: SceneLook) {
  const h = SCENE_H - COUNTER_H + 4
  rect(g, 0, 0, SCENE_W - 1, h, 'wall')
  for (let y = 0; y <= h; y++)
    for (let x = 0; x < SCENE_W; x++) {
      switch (look.wallStyle) {
        case 'planks':
          if (x % 11 === 0) put(g, x, y, 'wallS')
          else if ((x * 7 + y * 3) % 53 === 0) put(g, x, y, 'wallS')
          break
        case 'bricks':
        case 'stone': {
          const row = Math.floor(y / 6)
          const off = row % 2 ? 6 : 0
          if (y % 6 === 0 || (x + off) % 12 === 0) put(g, x, y, 'wallL')
          else if (look.wallStyle === 'stone' && (x * 13 + y * 7) % 37 === 0) put(g, x, y, 'wallS')
          break
        }
        case 'wallpaper':
          if ((x % 10 === 5 && y % 10 === 5) || (x % 10 === 0 && y % 10 === 0)) put(g, x, y, 'wallL')
          else if (x % 10 === 5 && (y % 10 === 4 || y % 10 === 6)) put(g, x, y, 'wallL')
          break
        case 'night':
          if ((x * 31 + y * 17) % 97 === 0) put(g, x, y, (x + y) % 2 ? 'twinkle' : 'wallL')
          break
      }
    }
}

function drawWindow(g: Grid, kind: 'day' | 'night') {
  const x0 = 50
  const y0 = 4
  const w = 26
  const h = 18
  rect(g, x0, y0, x0 + w, y0 + h, 'frame')
  rect(g, x0 + 2, y0 + 2, x0 + w - 2, y0 + h - 2, kind === 'day' ? 'sky' : 'nightSky')
  if (kind === 'day') {
    ellipse(g, x0 + 8, y0 + 8, 3.5, 1.6, 'cloud')
    ellipse(g, x0 + 11, y0 + 7, 2.5, 1.8, 'cloud')
    ellipse(g, x0 + 19, y0 + 12, 3, 1.4, 'cloud')
    ellipse(g, x0 + 20, y0 + 5, 2, 2, 'sun')
  } else {
    ellipse(g, x0 + 19, y0 + 6, 2.6, 2.6, 'moon')
    ellipse(g, x0 + 20, y0 + 5, 2.2, 2.2, 'nightSky')
    for (const [dx, dy] of [[5, 4], [9, 10], [14, 6], [6, 13], [21, 13], [12, 14]]) put(g, x0 + dx, y0 + dy, 'twinkle')
  }
  rect(g, x0 + w / 2, y0 + 1, x0 + w / 2, y0 + h - 1, 'frame')
  rect(g, x0 + 1, y0 + h / 2, x0 + w - 1, y0 + h / 2, 'frame')
  rect(g, x0 - 1, y0 + h + 1, x0 + w + 1, y0 + h + 2, 'shelf')
}

export function sceneGrid(look: SceneLook): Grid {
  const g = makeGrid(SCENE_W, SCENE_H)
  wallPattern(g, look)
  if (look.window) drawWindow(g, look.window)
  if (look.bunting) {
    for (let x = 0; x < SCENE_W; x++) put(g, x, 2 + Math.round(Math.sin((x / SCENE_W) * Math.PI * 4) * 1.2 + 1), 'string')
    for (let i = 0; i < 16; i++) {
      const bx = 3 + i * 8
      const by = 3 + Math.round(Math.sin((bx / SCENE_W) * Math.PI * 4) * 1.2 + 1)
      stamp(g, ['FFFFF', '.FFF.', '..F..'], bx, by, { F: `flag${i % 4}` })
    }
  }
  // prateleiras com os itens da loja (ao lado da janela, se tiver)
  const shelves = [24, 41]
  shelves.forEach((sy, si) => {
    const ranges: [number, number][] = look.window && si === 0 ? [[2, 46], [80, 126]] : [[2, 126]]
    for (const [a, b] of ranges) {
      rect(g, a, sy, b, sy + 1, 'shelf')
      rect(g, a, sy + 2, b, sy + 2, 'shelfS')
      for (let bx = a + 4; bx < b; bx += 22) rect(g, bx, sy + 3, bx + 1, sy + 5, 'shelfS')
      const sprites = ITEM_SPRITES[look.items]
      let x = a + 2
      let n = si * 3
      while (x < b - 8) {
        const sp = sprites[n % sprites.length]
        const c = look.itemColors[n % look.itemColors.length]
        const key = `item${look.itemColors.indexOf(c)}`
        stamp(g, sp, x, sy - sp.length, { D: 'itemD', L: key, B: key, F: 'gold', W: 'paper', H: `item${(look.itemColors.indexOf(c) + 1) % look.itemColors.length}`, R: 'ribbon', K: 'cork', S: 'shine' })
        x += sp[0].length + 3 + ((n * 5) % 4)
        n++
      }
    }
  })
  return g
}

const PROPS: Record<Prop, string[]> = {
  cat: ['.D.....D.', '.DD...DD.', '.DDDDDDD.', '.DYDDDYD.', '.DDDPDDD.', '..DDDDD..', '.DDDDDDD.', 'DDDDDDDDDD', 'DDDDDDDD.D'],
  plant: ['.G.G..', 'GGGG.G', '.GGGG.', '..GG..', '.TTTT.', '.TTTT.', '..TT..'],
  candle: ['..f..', '..F..', '.WWW.', '.WWW.', '.WWW.', '.WWW.', 'TTTTT'],
  scroll: ['.PPPPPP.', 'PWWWWWWP', 'PWDDDDWP', 'PWWWWWWP', '.PPPPPP.'],
  yarn: ['..YYY..', '.YYZYY.', 'YYZYYZY', 'YZYYZYY', '.YYZYY.', '..YYY..'],
  palette: ['..PPPP..', '.PRPPBP.', 'PPPPPPGP', 'PYPP.PPP', '.PPPPPP.'],
  hourglass: ['DDDDD', '.DYD.', '..D..', '.DYD.', 'DYYYD', 'DDDDD'],
}

/** Balcão de madeira com faixa decorada, sininho e um enfeite da loja em cima. */
export function counterGrid(look: SceneLook): Grid {
  const H = COUNTER_H
  const g = makeGrid(SCENE_W, H)
  const top = 9
  rect(g, 0, top, SCENE_W - 1, top + 2, 'woodL')
  rect(g, 0, top, SCENE_W - 1, top, 'woodHi')
  rect(g, 0, top + 3, SCENE_W - 1, H - 1, 'wood')
  for (let x = 0; x < SCENE_W; x++) {
    if (x % 16 === 8) rect(g, x, top + 3, x, H - 3, 'woodS')
    if ((x * 11) % 7 === 0) put(g, x, top + 6 + (x % 9), 'woodS')
  }
  rect(g, 0, top + 6, SCENE_W - 1, top + 8, 'trim')
  for (let x = 3; x < SCENE_W; x += 8) {
    put(g, x, top + 7, 'trimGem')
    put(g, x - 1, top + 7, 'trimL')
    put(g, x + 1, top + 7, 'trimL')
  }
  rect(g, 0, H - 2, SCENE_W - 1, H - 1, 'woodD')
  rect(g, 0, top + 3, SCENE_W - 1, top + 3, 'woodD')
  // mãos da vendedora apoiadas no balcão (manga + mão, na cor dela — ShopStage manda as cores)
  for (const hx of [16, 37]) {
    stamp(g, ['.SSSSS.', 'SSSSSSS', 'CCCCCCC', '.HHHHH.', 'HHHHHHH', '.HHHHH.'], hx, top - 3, { S: 'sleeve', C: 'cuff', H: 'hand' })
  }
  outline(g, 'handO', ['woodL', 'woodHi', 'wood', 'woodS', 'woodD', 'trim', 'trimL', 'trimGem', 'bell', 'bellL', 'propD', 'propY', 'propP', 'propZ', 'leaf', 'pot', 'paper', 'flame', 'flameHi', 'item0', 'item1'])
  // sininho
  stamp(g, ['...b...', '..BBB..', '.BBLBB.', '.BBBBB.', 'BBBBBBB'], 110, top - 5, { B: 'bell', L: 'bellL', b: 'bellL' })
  // enfeite da loja
  const prop = PROPS[look.prop]
  stamp(g, prop, 92, top - prop.length, {
    D: 'propD',
    Y: 'propY',
    P: 'propP',
    G: 'leaf',
    T: 'pot',
    W: 'paper',
    F: 'flame',
    f: 'flameHi',
    Z: 'propZ',
    R: 'item0',
    B: 'item1',
  })
  return g
}

/** Cores das mãos/mangas da vendedora no balcão. */
export function handPalette(look: KeeperLook): Record<string, string> {
  return { hand: look.skin, sleeve: look.outfit, cuff: look.trim, handO: mix(dark(look.hair, 0.55), '#2a1626', 0.5) }
}

export function scenePalette(look: SceneLook): Record<string, string> {
  const p: Record<string, string> = {
    wall: look.wall,
    wallS: dark(look.wall, 0.12),
    wallL: light(look.wall, 0.18),
    twinkle: '#fef9c3',
    frame: dark(look.shelf, 0.15),
    sky: '#93c5fd',
    nightSky: '#1e1b4b',
    cloud: '#ffffff',
    sun: '#fde047',
    moon: '#fef3c7',
    string: dark(look.wall, 0.4),
    flag0: '#f472b6',
    flag1: '#60a5fa',
    flag2: '#fde047',
    flag3: '#34d399',
    shelf: look.shelf,
    shelfS: dark(look.shelf, 0.3),
    itemD: '#2a1626',
    gold: '#e6a82e',
    paper: '#fffaf0',
    ribbon: '#fde047',
    cork: '#a16207',
    shine: '#ffffff',
    wood: look.counter,
    woodL: light(look.counter, 0.18),
    woodHi: light(look.counter, 0.4),
    woodS: dark(look.counter, 0.15),
    woodD: dark(look.counter, 0.4),
    trim: look.counterTrim,
    trimL: light(look.counterTrim, 0.35),
    trimGem: '#fef08a',
    bell: '#eab308',
    bellL: '#fef9c3',
    propD: '#1f1726',
    propY: '#fde047',
    propP: '#fb7185',
    propZ: dark('#f9a8d4', 0.2),
    leaf: '#22c55e',
    pot: '#c2410c',
    flame: '#f97316',
    flameHi: '#fde047',
  }
  look.itemColors.forEach((c, i) => (p[`item${i}`] = c))
  // o gato e os outros enfeites precisam de contorno escuro pra não sumir no balcão
  if (look.prop === 'yarn') p.propY = '#f9a8d4'
  if (look.prop === 'palette') p.propP = '#fef3c7'
  return p
}
