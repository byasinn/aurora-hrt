import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Card, EmptyState, ScreenTitle } from '../../components/ui'
import { useToday, useLogDose, useUpdateDoseLog, type TodayItem } from '../../api/doses'
import { useMoodEntries } from '../../api/moods'
import { useProfile } from '../../api/profile'
import { formatTime, todayStr } from '../../lib/dateUtils'
import WelcomeBanner from '../../components/WelcomeBanner'
import InsightsCard from '../../components/InsightsCard'
import TipOfDayCard from '../../components/TipOfDayCard'
import clsx from 'clsx'

const ROUTE_LABELS: Record<string, string> = {
  oral: 'Oral',
  injection: 'Injeção',
  patch: 'Adesivo',
  gel: 'Gel',
  other: 'Outro',
}

const ROUTE_ICONS: Record<string, string> = {
  oral: '💊',
  injection: '💉',
  patch: '🩹',
  gel: '🧴',
  other: '✨',
}

const STATUS_STYLES: Record<TodayItem['status'], string> = {
  pending: 'border-l-4 border-l-[var(--accent)]',
  taken: 'border-l-4 border-l-emerald-500 opacity-80',
  skipped: 'border-l-4 border-l-[var(--border)] opacity-60',
  missed: 'border-l-4 border-l-red-500',
}

function DoseCard({ item, onTaken }: { item: TodayItem; onTaken: () => void }) {
  const logDose = useLogDose()
  const updateDose = useUpdateDoseLog()
  const pending = logDose.isPending || updateDose.isPending

  function markTaken() {
    if (item.doseLogId) {
      updateDose.mutate(
        { id: item.doseLogId, status: 'taken', takenAt: new Date() },
        { onSuccess: onTaken },
      )
    } else {
      logDose.mutate(
        {
          medicationId: item.medication.id,
          scheduledFor: new Date(item.scheduledFor),
          status: 'taken',
          takenAt: new Date(),
        },
        { onSuccess: onTaken },
      )
    }
  }

  function markSkipped() {
    if (item.doseLogId) {
      updateDose.mutate({ id: item.doseLogId, status: 'skipped' })
    } else {
      logDose.mutate({
        medicationId: item.medication.id,
        scheduledFor: new Date(item.scheduledFor),
        status: 'skipped',
      })
    }
  }

  return (
    <Card className={clsx('flex items-center justify-between gap-3', STATUS_STYLES[item.status])}>
      <div className="flex items-center gap-3">
        <span className="text-2xl">{ROUTE_ICONS[item.medication.route] ?? '✨'}</span>
        <div>
          <p className="font-medium text-[var(--text)]">{item.medication.name}</p>
          <p className="text-xs text-[var(--text-muted)]">
            {item.medication.doseAmount}
            {item.medication.doseUnit} · {ROUTE_LABELS[item.medication.route] ?? item.medication.route} ·{' '}
            {formatTime(item.scheduledFor)}
            {item.status === 'missed' && ' · atrasado'}
          </p>
        </div>
      </div>
      {item.status === 'taken' ? (
        <span className="whitespace-nowrap text-sm text-emerald-500">✓ Tomado</span>
      ) : item.status === 'skipped' ? (
        <span className="whitespace-nowrap text-sm text-[var(--text-muted)]">Pulado</span>
      ) : (
        <div className="flex gap-2">
          <Button variant="secondary" onClick={markSkipped} disabled={pending}>
            Pular
          </Button>
          <Button onClick={markTaken} disabled={pending}>
            Tomei
          </Button>
        </div>
      )}
    </Card>
  )
}

export default function TodayScreen() {
  const { data, isLoading, isError } = useToday()
  const { data: profile } = useProfile()
  const today = todayStr()
  const { data: moodToday } = useMoodEntries({ from: today, to: today })
  const [moodPromptDismissed, setMoodPromptDismissed] = useState(false)
  const [justTookDose, setJustTookDose] = useState(false)

  const showMoodPrompt = justTookDose && !moodPromptDismissed && (moodToday?.length ?? 0) === 0

  return (
    <div>
      <WelcomeBanner />
      <TipOfDayCard />
      <InsightsCard />

      <div className="mb-4 flex items-center justify-between">
        <ScreenTitle>Hoje</ScreenTitle>
        <Link to="/medications">
          <Button variant="secondary">+ Medicamento</Button>
        </Link>
      </div>

      {showMoodPrompt && (
        <Card className="mb-4 flex items-center justify-between gap-3 border-[var(--accent)]">
          <p className="text-sm text-[var(--text)]">Boa! Quer registrar seu humor agora? 💜</p>
          <div className="flex shrink-0 gap-2">
            <Button variant="ghost" onClick={() => setMoodPromptDismissed(true)}>
              Depois
            </Button>
            <Link to="/mood">
              <Button>Registrar</Button>
            </Link>
          </div>
        </Card>
      )}

      {isLoading && <p className="text-sm text-[var(--text-muted)]">Carregando…</p>}
      {isError && (
        <EmptyState>
          Não foi possível carregar os dados de hoje. Verifique a conexão com o backend.
        </EmptyState>
      )}

      {data && data.items.length === 0 && (
        <EmptyState>
          {profile?.notOnMedsYet
            ? 'Você ainda não começou a tomar nada — sem pressa. Quando decidir, é só tocar em "+ Medicamento" que a gente te ajuda a organizar os horários.'
            : 'Nenhum medicamento cadastrado ainda. Toque em "+ Medicamento" para começar.'}
        </EmptyState>
      )}

      <div className="space-y-3">
        {data?.items.map((item) => (
          <DoseCard
            key={`${item.medication.id}-${item.scheduledFor}`}
            item={item}
            onTaken={() => setJustTookDose(true)}
          />
        ))}
      </div>

      <div className="mt-6">
        <h2 className="mb-2 text-sm font-medium text-[var(--text-muted)]">Explorar</h2>
        <EmptyState>Em breve: conteúdo pra explorar por aqui. 🌈</EmptyState>
      </div>
    </div>
  )
}
