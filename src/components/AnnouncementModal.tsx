import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Sparkles, X } from './icons'
import { AnimatePresence, motion } from 'framer-motion'
import { Button, Card } from './ui'
import { useLatestAnnouncement } from '../api/announcements'
import { useAnnouncementReplay } from '../lib/announcementReplay'
import VisualIntroModal from './VisualIntroModal'
import WhatsNewTour, { TOURS } from './WhatsNewTour'

const STORAGE_KEY = 'aurora-last-seen-announcement'

/** Mostra "o que mudou" uma vez por versão nova — guarda no localStorage do dispositivo qual versão
 * já foi vista, então basta criar um anúncio novo (painel de admin) pra avisar todo mundo de novo.
 * Versão com tour no código (WhatsNewTour) abre o tour com demonstrações; as outras, o texto. */
export default function AnnouncementModal() {
  const { data: announcement, isPending } = useLatestAnnouncement(true)
  const [dismissed, setDismissed] = useState(false)
  const replayVersion = useAnnouncementReplay((s) => s.replayVersion)
  const clearReplay = useAnnouncementReplay((s) => s.clear)

  useEffect(() => {
    setDismissed(false)
  }, [announcement?.id])

  // o aviso do 8-bit espera o de versão nova: só aparece quando não tem anúncio (ou ele já foi fechado)
  if (isPending) return null
  if (!announcement) return <VisualIntroModal />

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
  if (!open && !replayVersion) return <VisualIntroModal />

  const tour = TOURS[announcement.version]
  if (tour) {
    return <AnimatePresence>{open && <WhatsNewTour key={announcement.version} version={announcement.version} slides={tour} onClose={close} />}</AnimatePresence>
  }

  const lines = announcement.body
    .split('\n')
    .map((l) => l.replace(/^[•\-*]\s*/, '').trim())
    .filter(Boolean)

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[96] flex items-end justify-center bg-black/50 p-3 sm:items-center"
          onClick={close}
        >
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm"
          >
            <Card className="flex max-h-[80dvh] flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--accent-contrast)]">
                  <Sparkles size={18} />
                </span>
                <button onClick={close} aria-label="Fechar" className="cursor-pointer text-[var(--text-muted)]">
                  <X size={18} />
                </button>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--accent)]">Versão {announcement.version}</p>
                <h2 className="text-lg font-extrabold text-[var(--text)]">{announcement.title}</h2>
              </div>
              <ul className="-mr-2 space-y-2 overflow-y-auto pr-2 text-sm text-[var(--text-muted)]">
                {lines.map((l, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" />
                    <span>{l}</span>
                  </li>
                ))}
              </ul>
              <Button className="w-full shrink-0" onClick={close}>
                Entendi
              </Button>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
