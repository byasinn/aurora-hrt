import { useState } from 'react'
import clsx from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import { Button, Card } from '../../components/ui'
import Switch from '../../components/Switch'
import { useProfile, useUpdateProfile } from '../../api/profile'
import { normalizeMeasurementFocus } from '../../../shared/genders'
import { playSound } from '../../lib/sounds'
import SettingsSubHeader from './SettingsSubHeader'

const FOCUS_OPTIONS = [
  { value: 'lower', label: 'Foco inferiores', hint: 'Quadril, coxa' },
  { value: 'upper', label: 'Foco superiores', hint: 'Peito, ombros, braços' },
  { value: 'combined', label: 'Todas', hint: 'Tudo que dá pra medir' },
] as const

function Row({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-[var(--text)]">{title}</p>
        <p className="text-xs text-[var(--text-muted)]">{description}</p>
      </div>
      {children}
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="px-1 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">{children}</h2>
}

export default function PreferencesSettingsScreen() {
  const { data: profile } = useProfile()
  const updateProfile = useUpdateProfile()
  const [askingTips, setAskingTips] = useState(false)
  const focus = normalizeMeasurementFocus(profile?.contentPreference)

  function toggleTips(next: boolean) {
    // ligar passa pelo aviso; desligar é direto
    if (next) setAskingTips(true)
    else updateProfile.mutate({ dailyTipsEnabled: false })
  }

  return (
    <div className="space-y-4">
      <SettingsSubHeader title="Preferências" />

      <SectionTitle>Medidas</SectionTitle>
      <Card className="space-y-2">
        <p className="text-sm text-[var(--text-muted)]">Quais medidas aparecem em Saúde → Medidas. As que você já registrou continuam aparecendo.</p>
        <div className="grid grid-cols-3 gap-2">
          {FOCUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              aria-pressed={focus === opt.value}
              onClick={() => {
                playSound('tap')
                updateProfile.mutate({ contentPreference: opt.value })
              }}
              className={clsx(
                'flex min-h-16 flex-col items-center justify-center rounded-2xl border-2 px-1 text-center transition active:scale-[0.98]',
                focus === opt.value ? 'border-[var(--accent)] bg-[var(--accent-soft)]' : 'border-[var(--border)]',
              )}
            >
              <span className="text-sm font-bold text-[var(--text)]">{opt.label}</span>
              <span className="text-[11px] text-[var(--text-muted)]">{opt.hint}</span>
            </button>
          ))}
        </div>
      </Card>

      <SectionTitle>Home e módulos</SectionTitle>
      <Card className="space-y-1">
        <Row title="Dica do dia" description="Uma dica por dia na Home, de acordo com o que você toma.">
          <Switch checked={profile?.dailyTipsEnabled ?? false} onChange={toggleTips} />
        </Row>
        <Row title="Treinos" description="Botão de Treinos no Meu espaço e na Home.">
          <Switch checked={profile?.workoutsEnabled ?? false} onChange={(v) => updateProfile.mutate({ workoutsEnabled: v })} />
        </Row>
      </Card>

      <SectionTitle>Calendário</SectionTitle>
      <Card className="space-y-1">
        <Row title="Ciclo menstrual" description="Período, sintomas e previsões, direto no Histórico.">
          <Switch checked={profile?.cycleTrackingEnabled ?? false} onChange={(v) => updateProfile.mutate({ cycleTrackingEnabled: v })} />
        </Row>
        <Row title="Atividade íntima" description="Registro privado por dia no Histórico. Independente do ciclo.">
          <Switch checked={profile?.intimateTrackingEnabled ?? false} onChange={(v) => updateProfile.mutate({ intimateTrackingEnabled: v })} />
        </Row>
      </Card>

      <AnimatePresence>
        {askingTips && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
            onClick={() => setAskingTips(false)}
          >
            <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-sm">
              <Card className="space-y-3">
                <p className="text-3xl">🤖</p>
                <h2 className="text-lg font-extrabold text-[var(--text)]">Antes de ligar</h2>
                <p className="text-sm text-[var(--text-muted)]">
                  As dicas do dia são <strong className="text-[var(--text)]">geradas com inteligência artificial</strong> e as informações{' '}
                  <strong className="text-[var(--text)]">não foram validadas</strong> por profissionais de saúde. Elas não substituem
                  acompanhamento médico — nunca mude dose ou tratamento por causa de uma dica.
                </p>
                <div className="flex gap-2">
                  <Button variant="secondary" className="flex-1" onClick={() => setAskingTips(false)}>
                    Agora não
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => {
                      updateProfile.mutate({ dailyTipsEnabled: true })
                      setAskingTips(false)
                    }}
                  >
                    Entendi, ligar
                  </Button>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
