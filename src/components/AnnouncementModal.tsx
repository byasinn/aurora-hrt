import { useEffect, useState } from 'react'
import { Sparkles, X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { Button, Card } from './ui'
import { useLatestAnnouncement } from '../api/announcements'
import { useAnnouncementReplay } from '../lib/announcementReplay'

const STORAGE_KEY = 'aurora-last-seen-announcement'

/** Mostra "o que mudou" uma vez por versão nova — guarda no localStorage do dispositivo qual versão
 * já foi vista, então basta criar um anúncio novo (painel de admin) pra avisar todo mundo de novo,
 * sem precisar mudar código nenhum. Não aparece de novo pro mesmo dispositivo até a próxima versão. */
export default function AnnouncementModal() {
  const { data: announcement } = useLatestAnnouncement(true)
  const [dismissed, setDismissed] = useState(false)
  const replayVersion = useAnnouncementReplay((s) => s.replayVersion)
  const clearReplay = useAnnouncementReplay((s) => s.clear)

  useEffect(() => {
    setDismissed(false)
  }, [announcement?.id])

  if (!announcement) return null

  let lastSeen: string | null = null
  try {
    lastSeen = localStorage.getItem(STORAGE_KEY)
  } catch {
    // localStorage indisponível (modo privado etc) — só não mostra o "visto antes", sem quebrar
  }
  const alreadySeen = lastSeen === announcement.version
  const replaying = replayVersion === announcement.version

  function close() {
    setDismissed(true)
    clearReplay()
    try {
      if (announcement) localStorage.setItem(STORAGE_KEY, announcement.version)
    } catch {
      // sem localStorage, só não persiste — aparece nas próximas visitas, não é grave
    }
  }

  const open = replaying || (!alreadySeen && !dismissed)

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
          onClick={close}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm"
          >
            <Card className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--accent-contrast)]">
                  <Sparkles size={18} />
                </span>
                <button onClick={close} className="cursor-pointer text-[var(--text-muted)]">
                  <X size={18} />
                </button>
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--accent)]">
                  Versão {announcement.version}
                </p>
                <h2 className="text-lg font-semibold text-[var(--text)]">{announcement.title}</h2>
              </div>
              <p className="whitespace-pre-line text-sm text-[var(--text-muted)]">{announcement.body}</p>
              <Button className="w-full" onClick={close}>
                Entendi
              </Button>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
