import { useEffect, useRef, useState } from 'react'
import { Check, X, ZoomIn, ZoomOut } from 'lucide-react'
import { Button } from './ui'
import { uploadImage } from '../lib/apiClient'
import { toastError } from '../lib/toast'

const VIEWPORT_WIDTH = 300
const MIN_ZOOM = 1
const MAX_ZOOM = 3

interface Props {
  file: File
  /** largura/altura do recorte final — 1 = quadrado, 3 = banner bem largo, etc. */
  aspect?: number
  shape?: 'circle' | 'rect'
  outputSize?: number // maior lado da imagem final, em px
  quality?: number
  onConfirm: (url: string) => void
  onCancel: () => void
}

export default function ImageCropper({
  file,
  aspect = 1,
  shape = 'circle',
  outputSize = 512,
  quality = 0.85,
  onConfirm,
  onCancel,
}: Props) {
  const [imgUrl, setImgUrl] = useState<string | null>(null)
  const [imgSize, setImgSize] = useState<{ w: number; h: number } | null>(null)
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [uploading, setUploading] = useState(false)
  const draggingRef = useRef<{ startX: number; startY: number; startOffset: { x: number; y: number } } | null>(null)

  const viewportHeight = VIEWPORT_WIDTH / aspect

  useEffect(() => {
    const url = URL.createObjectURL(file)
    setImgUrl(url)
    const img = new Image()
    img.onload = () => setImgSize({ w: img.naturalWidth, h: img.naturalHeight })
    img.src = url
    return () => URL.revokeObjectURL(url)
  }, [file])

  if (!imgUrl || !imgSize) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
        <p className="text-sm text-white">Carregando…</p>
      </div>
    )
  }

  // tamanho "base" que cobre o viewport inteiro sem sobra, em zoom 1 — o zoom em si vira um transform
  // em cima disso (não recalcula largura/altura a cada frame), pra não dar aquele efeito "pulando"/distorcido.
  const baseScale = Math.max(VIEWPORT_WIDTH / imgSize.w, viewportHeight / imgSize.h)
  const baseW = imgSize.w * baseScale
  const baseH = imgSize.h * baseScale

  function boundsFor(z: number) {
    const w = baseW * z
    const h = baseH * z
    return {
      maxX: Math.max(0, (w - VIEWPORT_WIDTH) / 2),
      maxY: Math.max(0, (h - viewportHeight) / 2),
    }
  }

  function clamp(x: number, y: number, z: number) {
    const { maxX, maxY } = boundsFor(z)
    return { x: Math.min(maxX, Math.max(-maxX, x)), y: Math.min(maxY, Math.max(-maxY, y)) }
  }

  function handlePointerDown(e: React.PointerEvent) {
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    draggingRef.current = { startX: e.clientX, startY: e.clientY, startOffset: offset }
  }

  function handlePointerMove(e: React.PointerEvent) {
    const drag = draggingRef.current
    if (!drag) return
    const dx = e.clientX - drag.startX
    const dy = e.clientY - drag.startY
    setOffset(clamp(drag.startOffset.x + dx, drag.startOffset.y + dy, zoom))
  }

  function handlePointerUp() {
    draggingRef.current = null
  }

  function handleZoomChange(next: number) {
    const clampedZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, next))
    setZoom(clampedZoom)
    setOffset((o) => clamp(o.x, o.y, clampedZoom))
  }

  function handleWheel(e: React.WheelEvent) {
    e.preventDefault()
    handleZoomChange(zoom - e.deltaY * 0.0015)
  }

  function handleConfirm() {
    if (!imgUrl || !imgSize) return
    const outW = aspect >= 1 ? outputSize : Math.round(outputSize * aspect)
    const outH = aspect >= 1 ? Math.round(outputSize / aspect) : outputSize
    const canvas = document.createElement('canvas')
    canvas.width = outW
    canvas.height = outH
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const pxToOut = outW / VIEWPORT_WIDTH
    const outputScale = baseScale * zoom * pxToOut
    const drawW = imgSize.w * outputScale
    const drawH = imgSize.h * outputScale
    const drawX = outW / 2 - drawW / 2 + offset.x * pxToOut
    const drawY = outH / 2 - drawH / 2 + offset.y * pxToOut

    const img = new Image()
    img.onload = () => {
      ctx.drawImage(img, drawX, drawY, drawW, drawH)
      canvas.toBlob(
        async (blob) => {
          if (!blob) {
            toastError(null, 'Falha ao processar a imagem.')
            return
          }
          setUploading(true)
          try {
            const { url } = await uploadImage(blob)
            onConfirm(url)
          } catch (err) {
            toastError(err, 'Falha ao enviar a imagem. Tenta de novo.')
            setUploading(false)
          }
        },
        'image/jpeg',
        quality,
      )
    }
    img.src = imgUrl
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-black/85 px-6">
      <div
        className="relative touch-none overflow-hidden bg-black"
        style={{
          width: VIEWPORT_WIDTH,
          height: viewportHeight,
          borderRadius: shape === 'circle' ? '9999px' : '16px',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onWheel={handleWheel}
      >
        {/* eslint-disable-next-line jsx-a11y/alt-text */}
        <img
          src={imgUrl}
          draggable={false}
          className="absolute left-1/2 top-1/2 select-none"
          style={{
            width: baseW,
            height: baseH,
            transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px)) scale(${zoom})`,
            transformOrigin: 'center center',
          }}
        />
      </div>

      <div className="flex w-full max-w-xs items-center gap-2">
        <ZoomOut size={16} className="shrink-0 text-white/70" />
        <input
          type="range"
          min={MIN_ZOOM}
          max={MAX_ZOOM}
          step={0.01}
          value={zoom}
          onChange={(e) => handleZoomChange(Number(e.target.value))}
          className="h-2 flex-1 accent-[var(--accent)]"
        />
        <ZoomIn size={16} className="shrink-0 text-white/70" />
      </div>

      <p className="text-xs text-white/70">Arraste pra reposicionar</p>

      <div className="flex w-full max-w-xs gap-2">
        <Button variant="secondary" className="flex flex-1 items-center justify-center gap-1.5" onClick={onCancel} disabled={uploading}>
          <X size={16} /> Cancelar
        </Button>
        <Button className="flex flex-1 items-center justify-center gap-1.5" onClick={handleConfirm} disabled={uploading}>
          <Check size={16} /> {uploading ? 'Enviando…' : 'Usar foto'}
        </Button>
      </div>
    </div>
  )
}
