import type { PostFontStyle } from '../../shared/types'

export const FONT_STYLE_OPTIONS: { value: PostFontStyle | null; label: string; className: string }[] = [
  { value: null, label: 'Padrão', className: '' },
  { value: 'serif', label: 'Serifada', className: 'post-font-serif' },
  { value: 'handwritten', label: 'Manuscrita', className: 'post-font-handwritten' },
  { value: 'display', label: 'Arredondada', className: 'post-font-display' },
]

export function fontStyleClass(fontStyle: string | null | undefined): string {
  return FONT_STYLE_OPTIONS.find((f) => f.value === fontStyle)?.className ?? ''
}
