// Ícones em pixel art desenhados como grade de caracteres — cada letra é a cor de um pixel. Ficam
// nítidos em qualquer tamanho (SVG com crispEdges) e herdam as cores do tema (a/b = acento 1/2).
// Usados nos toques de pixel art: Brilho, conquistas, lojinha, streak.

const PALETTE: Record<string, string> = {
  a: 'var(--accent)',
  b: 'var(--accent-2)',
  d: 'currentColor',
  w: '#ffffff',
  c: '#f5c542', // dourado
  k: '#b7791f', // contorno dourado
  y: '#fff3b0', // brilho dourado
  o: '#fb923c',
  r: '#ef4444',
  g: '#22c55e',
  i: '#7dd3fc', // gelo
  x: '#111827', // preto
  p: '#f5a9b8', // rosa bandeira trans
  q: '#5bcefa', // azul bandeira trans
  P: '#db2777',
  v: '#9c59d1', // roxo bandeira NB
  n: '#fcf434', // amarelo bandeira NB
  m: '#9f1239', // vinho
}

const ICONS = {
  heart: [
    '.aa...aa.',
    'aaaa.aaaa',
    'awaaaaaaa',
    'aaaaaaaaa',
    '.aaaaaaa.',
    '..aaaaa..',
    '...aaa...',
    '....a....',
  ],
  sparkle: [
    '....b....',
    '....b....',
    '...bab...',
    '..baaab..',
    'bbaawaabb',
    '..baaab..',
    '...bab...',
    '....b....',
    '....b....',
  ],
  coin: [
    '..kkkk..',
    '.kyyyck.',
    'kyccccck',
    'kycckcck',
    'kycckcck',
    'kyccccck',
    '.kcccck.',
    '..kkkk..',
  ],
  star: [
    '....c....',
    '...ccc...',
    'ccccycccc',
    '.ccyyccc.',
    '..ccccc..',
    '..cc.cc..',
    '.cc...cc.',
  ],
  flame: [
    '...r....',
    '...rr...',
    '..rro...',
    '..rorr..',
    '.rroorr.',
    '.rooyor.',
    'rroyyorr',
    'royyyyor',
    'rooyyoor',
    '.roooor.',
    '..rrrr..',
  ],
  bag: [
    '...dddd...',
    '..d....d..',
    '..d....d..',
    'aaaaaaaaaa',
    'awaaaaaaaa',
    'aaaaaaaaaa',
    'aaaabbaaaa',
    'aaaabbaaaa',
    'aaaaaaaaaa',
    '.aaaaaaaa.',
  ],
  crown: [
    'c...c...c',
    'cc.ccc.cc',
    'ccccccccc',
    'cbccaccbc',
    'ccccccccc',
    'kkkkkkkkk',
  ],
  snowflake: [
    'i..i..i',
    '.i.i.i.',
    '..iwi..',
    'iiwwwii',
    '..iwi..',
    '.i.i.i.',
    'i..i..i',
  ],
  bat: [
    'x.........x',
    'xx..x.x..xx',
    'xxxxxxxxxxx',
    'xxxxrxrxxxx',
    '.xx.xxx.xx.',
    '.....x.....',
  ],
  tree: [
    '....y....',
    '...yyy...',
    '....g....',
    '...ggg...',
    '..ggrgg..',
    '...ggg...',
    '..ggggg..',
    '.gggqggg.',
    'ggrggggyg',
    '....k....',
    '....k....',
  ],
  flower: [
    '..p.p..',
    '.ppppp.',
    'pppyppp',
    '.ppppp.',
    '..p.p..',
    '...g...',
    '..gg...',
  ],
  moon: [
    '..yyy..',
    '.yy....',
    'yy.....',
    'yy.....',
    'yy.....',
    '.yy....',
    '..yyy..',
  ],
  bow: [
    'PP.....PP',
    'PppP.PppP',
    'PpppPpppP',
    'PppP.PppP',
    'PP.....PP',
  ],
  candy: [
    '.rwr.',
    'w...r',
    'r...w',
    '....r',
    '....w',
    '....r',
    '....w',
    '....r',
  ],
  pill: [
    '.aaaabbbb.',
    'aawaabbbbb',
    'aaaaabbbbb',
    'aaaaabbbbb',
    '.aaaabbbb.',
  ],
} satisfies Record<string, string[]>

export type PixelIconName = keyof typeof ICONS

export default function PixelIcon({
  name,
  size = 20,
  className,
  title,
  palette,
}: {
  name: PixelIconName
  /** troca cores da paleta (ex.: { a: '#f5a9b8' } pra um coração rosa fixo, sem depender do tema) */
  palette?: Record<string, string>
  /** altura em px — a largura segue a proporção da grade */
  size?: number
  className?: string
  title?: string
}) {
  const rows = ICONS[name]
  const h = rows.length
  const w = rows[0].length
  // junta pixels vizinhos da mesma cor numa linha só — bem menos <rect> no DOM
  const rects: { x: number; y: number; len: number; fill: string }[] = []
  rows.forEach((row, y) => {
    let x = 0
    while (x < w) {
      const ch = row[x]
      let len = 1
      while (x + len < w && row[x + len] === ch) len++
      if (ch !== '.') rects.push({ x, y, len, fill: palette?.[ch] ?? PALETTE[ch] })
      x += len
    }
  })

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      height={size}
      width={(size * w) / h}
      shapeRendering="crispEdges"
      className={className}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
    >
      {title && <title>{title}</title>}
      {rects.map((r) => (
        <rect key={`${r.x}-${r.y}`} x={r.x} y={r.y} width={r.len} height={1} fill={r.fill} />
      ))}
    </svg>
  )
}
