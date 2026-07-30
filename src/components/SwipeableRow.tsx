import { useState } from 'react'
import { motion, useMotionValue, animate, type PanInfo } from 'framer-motion'
import { Pencil, Trash2 } from 'lucide-react'

const ACTIONS_WIDTH = 144

export default function SwipeableRow({
  children,
  onEdit,
  onDelete,
  onTap,
}: {
  children: React.ReactNode
  onEdit: () => void
  onDelete: () => void
  onTap?: () => void
}) {
  const x = useMotionValue(0)
  const [open, setOpen] = useState(false)

  function close() {
    animate(x, 0, { type: 'spring', stiffness: 500, damping: 40 })
    setOpen(false)
  }

  function handleDragEnd(_e: PointerEvent | MouseEvent | TouchEvent, info: PanInfo) {
    const shouldOpen = info.offset.x < -ACTIONS_WIDTH / 2
    animate(x, shouldOpen ? -ACTIONS_WIDTH : 0, { type: 'spring', stiffness: 500, damping: 40 })
    setOpen(shouldOpen)
  }

  function handleTap() {
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
        drag="x"
        dragConstraints={{ left: -ACTIONS_WIDTH, right: 0 }}
        dragElastic={0.06}
        style={{ x }}
        onDragEnd={handleDragEnd}
        onTap={handleTap}
        className="relative z-10 touch-pan-y"
      >
        {children}
      </motion.div>
    </div>
  )
}
