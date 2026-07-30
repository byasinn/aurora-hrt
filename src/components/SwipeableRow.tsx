import { useEffect, useState } from 'react'
import { motion, useMotionValue, animate, type PanInfo } from 'framer-motion'
import { Pencil, Trash2 } from 'lucide-react'

const ACTIONS_WIDTH = 144

export default function SwipeableRow({
  children,
  onEdit,
  onDelete,
  onTap,
  completing,
  onCompleteAnimationDone,
}: {
  children: React.ReactNode
  onEdit: () => void
  onDelete: () => void
  onTap?: () => void
  completing?: boolean
  onCompleteAnimationDone?: () => void
}) {
  const x = useMotionValue(0)
  const opacity = useMotionValue(1)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!completing) {
      // Garante que nunca fique preso num estado invisível/deslocado (ex: mutação falhou e o item voltou a pendente).
      x.set(0)
      opacity.set(1)
      return
    }
    animate(opacity, [1, 1, 0], { duration: 0.55, times: [0, 0.35, 1] })
    const controls = animate(x, [0, 0, 380], {
      duration: 0.55,
      times: [0, 0.35, 1],
      onComplete: () => onCompleteAnimationDone?.(),
    })
    return () => controls.stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completing])

  function close() {
    animate(x, 0, { type: 'spring', stiffness: 500, damping: 40 })
    setOpen(false)
  }

  function handleDragEnd(_e: PointerEvent | MouseEvent | TouchEvent, info: PanInfo) {
    if (completing) return
    const shouldOpen = info.offset.x < -ACTIONS_WIDTH / 2
    animate(x, shouldOpen ? -ACTIONS_WIDTH : 0, { type: 'spring', stiffness: 500, damping: 40 })
    setOpen(shouldOpen)
  }

  function handleTap() {
    if (completing) return
    if (open) {
      close()
      return
    }
    onTap?.()
  }

  return (
    <div className="relative overflow-hidden rounded-2xl">
      <div className="absolute inset-y-0 right-0 flex overflow-hidden rounded-2xl" style={{ width: ACTIONS_WIDTH }}>
        <button
          onClick={() => {
            close()
            onEdit()
          }}
          className="flex flex-1 items-center justify-center bg-[var(--accent-2)] text-[var(--accent-contrast)]"
        >
          <Pencil size={18} />
        </button>
        <button
          onClick={() => {
            close()
            onDelete()
          }}
          className="flex flex-1 items-center justify-center bg-red-500 text-white"
        >
          <Trash2 size={18} />
        </button>
      </div>
      <motion.div
        drag={completing ? false : 'x'}
        dragConstraints={{ left: -ACTIONS_WIDTH, right: 0 }}
        dragElastic={0.06}
        style={{ x, opacity }}
        onDragEnd={handleDragEnd}
        onTap={handleTap}
        className="relative z-10 touch-pan-y"
      >
        {children}
      </motion.div>
    </div>
  )
}
