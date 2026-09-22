import { Link } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { Card, EmptyState, ScreenTitle } from '../../components/ui'
import { useMedications } from '../../api/medications'

export default function OQueTomoScreen() {
  const { data: medications = [] } = useMedications()
  const activeMedications = medications.filter((m) => m.active)

  return (
    <div className="space-y-4">
      <Link to="/perfil/mais-informacoes" className="flex items-center gap-1 text-sm text-[var(--text-muted)]">
        <ChevronLeft size={16} /> Mais informações
      </Link>
      <ScreenTitle>O que eu tomo</ScreenTitle>

      {activeMedications.length === 0 ? (
        <EmptyState>Nenhum medicamento ativo registrado.</EmptyState>
      ) : (
        <Card className="space-y-2">
          {activeMedications.map((m) => (
            <p key={m.id} className="text-sm text-[var(--text)]">
              {m.name} — {m.doseAmount}
              {m.doseUnit} · {m.route}
            </p>
          ))}
        </Card>
      )}
    </div>
  )
}
