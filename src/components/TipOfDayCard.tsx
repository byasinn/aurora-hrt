import { useState } from 'react'
import { Card } from './ui'
import { X } from './icons'
import { useProfile, useUpdateProfile } from '../api/profile'
import { useMedications } from '../api/medications'
import { tipsFor } from '../lib/tips'

/** Dica do dia na Home — só aparece com "Dica do dia" ligada em Preferências (que avisa que as dicas
 * são geradas por IA e não foram revisadas). Toque troca a dica; o X desliga. */
export default function TipOfDayCard() {
  const { data: profile } = useProfile()
  const { data: medications = [] } = useMedications()
  const updateProfile = useUpdateProfile()
  const [index, setIndex] = useState<number | null>(null)

  if (!profile?.dailyTipsEnabled) return null
  const activeRoutes = [...new Set(medications.filter((m) => m.active).map((m) => m.route))]
  const tips = tipsFor(profile.gender, activeRoutes)
  if (tips.length === 0) return null

  const currentIndex = index ?? new Date().getDate() % tips.length
  const tip = tips[currentIndex]

  function next() {
    if (tips.length <= 1) return
    let n = Math.floor(Math.random() * tips.length)
    if (n === currentIndex) n = (n + 1) % tips.length
    setIndex(n)
  }

  return (
    <Card className="flex items-start gap-3 border-[var(--accent-2)] py-3">
      <button type="button" onClick={next} className="flex flex-1 items-start gap-3 text-left">
        <span className="text-xl leading-none">{tip.icon}</span>
        <span className="flex-1">
          <span className="mb-0.5 block text-xs font-bold text-[var(--text-muted)]">Dica do dia · toque pra trocar</span>
          <span className="block text-sm text-[var(--text)]">{tip.text}</span>
          <span className="mt-1 block text-[11px] text-[var(--text-muted)]">Gerada com IA, não revisada por profissional de saúde.</span>
        </span>
      </button>
      <button
        type="button"
        aria-label="Desligar dica do dia"
        onClick={() => updateProfile.mutate({ dailyTipsEnabled: false })}
        className="shrink-0 p-1 text-[var(--text-muted)]"
      >
        <X size={14} />
      </button>
    </Card>
  )
}
