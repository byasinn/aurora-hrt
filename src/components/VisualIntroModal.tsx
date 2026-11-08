import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, motion } from 'framer-motion'
import { Button, Card } from './ui'
import PixelIcon from './PixelIcon'
import { VisualPreview } from './VisualStylePicker'
import { useIconStyle } from './AppIcon'
import { playSound } from '../lib/sounds'

// Aviso único "chegou o visual 8-bit" pra quem já usava o app. Quem passa pelo onboarding novo já
// escolhe o visual lá, então o onboarding marca como visto. Fica no aparelho (localStorage).

const SEEN_KEY = 'transapp.visualIntroSeen'

export function markVisualIntroSeen() {
  try {
    localStorage.setItem(SEEN_KEY, '1')
  } catch {
    // sem localStorage o aviso pode voltar numa próxima visita — não é grave
  }
}

function alreadySeen() {
  try {
    return localStorage.getItem(SEEN_KEY) === '1'
  } catch {
    return true // sem como lembrar, melhor não mostrar toda vez
  }
}

type Stage = 'ask' | 'tried' | 'later'

export default function VisualIntroModal() {
  const { t } = useTranslation()
  const setStyle = useIconStyle((s) => s.setStyle)
  const [open, setOpen] = useState(() => !alreadySeen())
  const [stage, setStage] = useState<Stage>('ask')

  function choose(next: Stage) {
    markVisualIntroSeen()
    if (next === 'tried') {
      setStyle('pixel')
      playSound('pop')
    } else {
      playSound('tap')
    }
    setStage(next)
  }

  function close() {
    markVisualIntroSeen()
    setOpen(false)
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-sm"
          >
            <Card className="space-y-3">
              {stage === 'ask' && (
                <>
                  <div className="flex items-center gap-2">
                    <PixelIcon name="sparkle" size={18} />
                    <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--accent)]">{t('visual.introTag')}</p>
                  </div>
                  <h2 className="text-xl font-extrabold text-[var(--text)]">{t('visual.introTitle')}</h2>
                  <VisualPreview value="pixel" className="mx-auto max-w-56" />
                  <p className="text-sm text-[var(--text-muted)]">{t('visual.introBody')}</p>
                  <div className="space-y-2 pt-1">
                    <Button className="w-full" onClick={() => choose('tried')}>
                      {t('visual.tryNow')}
                    </Button>
                    <Button variant="secondary" className="w-full" onClick={() => choose('later')}>
                      {t('visual.later')}
                    </Button>
                  </div>
                </>
              )}
              {stage !== 'ask' && (
                <>
                  <h2 className="text-xl font-extrabold text-[var(--text)]">
                    {stage === 'tried' ? t('visual.introTitle') : t('visual.laterTitle')}
                  </h2>
                  <p className="text-sm text-[var(--text-muted)]">{stage === 'tried' ? t('visual.tryNowDone') : t('visual.laterBody')}</p>
                  <Button className="w-full" onClick={close}>
                    {t('visual.gotIt')}
                  </Button>
                </>
              )}
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
