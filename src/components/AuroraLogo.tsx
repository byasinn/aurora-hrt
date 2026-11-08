import { useId } from 'react'
import clsx from 'clsx'
import { useIconStyle } from './AppIcon'

// Logo "AURORA": no visual 8-bit é um letreiro em pixel art com sombreado (degradê nas cores do
// tema, brilho em cima, contorno escuro e sombra embaixo — mais pra 16/32-bit que 8-bit chapado);
// no Clean volta o texto de antes.

const LETTERS: Record<string, string[]> = {
  A: ['.dddd.', 'dd..dd', 'dd..dd', 'dddddd', 'dd..dd', 'dd..dd', 'dd..dd'],
  U: ['dd..dd', 'dd..dd', 'dd..dd', 'dd..dd', 'dd..dd', 'dd..dd', '.dddd.'],
  R: ['ddddd.', 'dd..dd', 'dd..dd', 'ddddd.', 'dd.dd.', 'dd..dd', 'dd..dd'],
  O: ['.dddd.', 'dd..dd', 'dd..dd', 'dd..dd', 'dd..dd', 'dd..dd', '.dddd.'],
}
const WORD = 'AURORA'
const LETTER_W = 6
const LETTER_H = 7
const GAP = 2
const PAD = 1 // contorno em volta
const W = WORD.length * LETTER_W + (WORD.length - 1) * GAP + PAD * 2
const H = LETTER_H + PAD * 2 + 1 // +1 da sombra

// pixels cheios da palavra, já calculados uma vez só
const FILLED = new Set<string>()
WORD.split('').forEach((ch, i) => {
  const ox = PAD + i * (LETTER_W + GAP)
  LETTERS[ch].forEach((row, y) => {
    for (let x = 0; x < LETTER_W; x++) if (row[x] === 'd') FILLED.add(`${ox + x},${PAD + y}`)
  })
})
const has = (x: number, y: number) => FILLED.has(`${x},${y}`)
const cells = [...FILLED].map((k) => k.split(',').map(Number) as [number, number])

// contorno: todo pixel vazio encostado (8 vizinhos) num pixel cheio
const OUTLINE: [number, number][] = []
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    if (has(x, y)) continue
    let near = false
    for (let dy = -1; dy <= 1 && !near; dy++) for (let dx = -1; dx <= 1 && !near; dx++) near = has(x + dx, y + dy)
    if (near) OUTLINE.push([x, y])
  }
}
const outlineSet = new Set(OUTLINE.map(([x, y]) => `${x},${y}`))
// sombra: o contorno de baixo empurrado 1 pixel pra baixo
const SHADOW = OUTLINE.filter(([x, y]) => !has(x, y + 1) && !outlineSet.has(`${x},${y + 1}`)).map(([x, y]) => [x, y + 1] as [number, number])
// brilho no topo de cada traço e sombra no pé
const TOP = cells.filter(([x, y]) => !has(x, y - 1))
const BOTTOM = cells.filter(([x, y]) => !has(x, y + 1) && has(x, y - 1))

export default function AuroraLogo({ height = 22, className }: { height?: number; className?: string }) {
  const style = useIconStyle((s) => s.style)
  // useId traz ":" e afins, que não valem dentro de url(#...)
  const gradId = `aurora-logo-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`

  if (style !== 'pixel') {
    return (
      <span className={clsx('font-logo flag-gradient-text uppercase tracking-wide', className)} style={{ fontSize: height * 0.82 }}>
        Aurora
      </span>
    )
  }

  const px = (list: [number, number][], fill: string, opacity?: number) =>
    list.map(([x, y]) => <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} style={{ fill }} fillOpacity={opacity} />)

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      height={height}
      width={(height * W) / H}
      shapeRendering="crispEdges"
      className={className}
      role="img"
      aria-label="Aurora"
    >
      <defs>
        <linearGradient id={gradId} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2={W} y2={H}>
          <stop offset="0" style={{ stopColor: 'var(--accent)' }} />
          <stop offset="1" style={{ stopColor: 'var(--accent-2)' }} />
        </linearGradient>
      </defs>
      {px(SHADOW, 'color-mix(in srgb, var(--accent) 25%, #1b1030)', 0.55)}
      {px(OUTLINE, 'color-mix(in srgb, var(--accent) 35%, #1b1030)')}
      {/* degradê em coordenadas da palavra inteira, não de cada pixel */}
      <g fill={`url(#${gradId})`}>
        {cells.map(([x, y]) => (
          <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} />
        ))}
      </g>
      {px(TOP, '#ffffff', 0.45)}
      {px(BOTTOM, '#000000', 0.18)}
    </svg>
  )
}
