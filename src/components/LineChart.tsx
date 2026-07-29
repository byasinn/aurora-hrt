interface Point {
  date: string
  value: number
}

/** Gráfico de linha simples em SVG, sem dependências externas. */
export default function LineChart({ points, unit }: { points: Point[]; unit?: string }) {
  if (points.length === 0) return null

  const sorted = [...points].sort((a, b) => a.date.localeCompare(b.date))
  const width = 300
  const height = 100
  const padding = 12

  const values = sorted.map((p) => p.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1

  const coords = sorted.map((p, i) => {
    const x = sorted.length === 1 ? width / 2 : padding + (i / (sorted.length - 1)) * (width - padding * 2)
    const y = height - padding - ((p.value - min) / range) * (height - padding * 2)
    return { x, y, value: p.value, date: p.date }
  })

  const path = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ')

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-24 w-full">
      <path d={path} fill="none" stroke="var(--accent)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      {coords.map((c, i) => (
        <g key={i}>
          <circle cx={c.x} cy={c.y} r={3} fill="var(--accent)" />
        </g>
      ))}
      <text x={padding} y={12} fontSize={9} fill="var(--text-muted)">
        {max}
        {unit}
      </text>
      <text x={padding} y={height - 4} fontSize={9} fill="var(--text-muted)">
        {min}
        {unit}
      </text>
    </svg>
  )
}
