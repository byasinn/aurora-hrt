import { Card } from '../../components/ui'
import SettingsSubHeader from './SettingsSubHeader'

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-xs font-semibold text-[var(--accent-contrast)]">
        {n}
      </span>
      <p className="text-sm text-[var(--text)]">{children}</p>
    </div>
  )
}

export default function InstallGuideScreen() {
  return (
    <div className="space-y-4">
      <SettingsSubHeader title="Instalar o app" />

      <Card className="space-y-2">
        <p className="text-xs text-[var(--text-muted)]">
          Instalar a Aurora na tela de início deixa ela com cara de app de verdade — abre em tela cheia, sem barra
          do navegador, e é o único jeito de receber notificações no iPhone.
        </p>
      </Card>

      <Card className="space-y-3">
        <p className="text-sm font-medium text-[var(--text)]">📱 Android (Chrome)</p>
        <Step n={1}>Abre a Aurora pelo Chrome.</Step>
        <Step n={2}>
          Toca no menu <strong>⋮</strong> (três pontinhos), no canto superior direito.
        </Step>
        <Step n={3}>
          Toca em <strong>Adicionar à tela inicial</strong> (ou <strong>Instalar app</strong>).
        </Step>
        <Step n={4}>Confirma. O ícone da Aurora aparece na sua tela de início.</Step>
      </Card>

      <Card className="space-y-3">
        <p className="text-sm font-medium text-[var(--text)]">🍎 iPhone (Safari)</p>
        <Step n={1}>Abre a Aurora pelo Safari (precisa ser o Safari, outros navegadores no iPhone não funcionam pra isso).</Step>
        <Step n={2}>
          Toca no ícone de <strong>Compartilhar</strong> (o quadrado com uma seta pra cima), na barra de baixo.
        </Step>
        <Step n={3}>
          Desce a lista e toca em <strong>Adicionar à Tela de Início</strong>.
        </Step>
        <Step n={4}>Confirma. Abra a Aurora sempre por esse ícone — é o que ativa notificações no iPhone.</Step>
      </Card>
    </div>
  )
}
