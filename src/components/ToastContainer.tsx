import clsx from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import { useToasts } from '../lib/toast'

export default function ToastContainer() {
  const toasts = useToasts()

  return (
    <div className="pointer-events-none fixed inset-x-0 top-[max(0.75rem,env(safe-area-inset-top))] z-[100] flex flex-col items-center gap-2 px-4">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: -12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.95 }}
            className={clsx(
              'pointer-events-auto max-w-sm rounded-xl px-4 py-2.5 text-center text-sm font-medium [box-shadow:var(--shadow)]',
              t.variant === 'error' ? 'bg-red-500 text-white' : 'bg-[var(--accent)] text-[var(--accent-contrast)]',
            )}
          >
            {t.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
