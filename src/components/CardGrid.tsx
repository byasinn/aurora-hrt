/**
 * Grade de cards em linhas de até `maxPerRow`. A última linha, se incompleta,
 * estica seus itens pra preencher a largura toda (1 item = tela toda, 2 = metade cada...)
 * em vez de deixar um buraco vazio alinhado à esquerda.
 */
export default function CardGrid<T>({
  items,
  maxPerRow = 3,
  gap = 8,
  renderItem,
  keyFor,
}: {
  items: T[]
  maxPerRow?: number
  gap?: number
  renderItem: (item: T, index: number) => React.ReactNode
  keyFor: (item: T, index: number) => string | number
}) {
  const total = items.length
  const fullRows = Math.floor(total / maxPerRow)
  const remainder = total % maxPerRow

  return (
    <div className="flex flex-wrap" style={{ gap }}>
      {items.map((item, i) => {
        const rowIndex = Math.floor(i / maxPerRow)
        const itemsInRow = rowIndex < fullRows ? maxPerRow : remainder || maxPerRow
        const widthPercent = 100 / itemsInRow
        return (
          <div
            key={keyFor(item, i)}
            style={{ flexBasis: `calc(${widthPercent}% - ${(gap * (itemsInRow - 1)) / itemsInRow}px)` }}
          >
            {renderItem(item, i)}
          </div>
        )
      })}
    </div>
  )
}
