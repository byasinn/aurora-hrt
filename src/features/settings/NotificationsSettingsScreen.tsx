import { useEffect, useState } from 'react'
import { TriangleAlert } from 'lucide-react'
import { Card, Button } from '../../components/ui'
import { enablePushNotifications, getNotificationPermissionState, isStandalone } from '../../lib/notifications'
import SettingsSubHeader from './SettingsSubHeader'

const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent)

export default function NotificationsSettingsScreen() {
  const [pushState, setPushState] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    getNotificationPermissionState().then(setPushState)
  }, [])

  async function handleEnablePush() {
    setBusy(true)
    setError(null)
    try {
      const res = await enablePushNotifications()
      if (res.ok) {
        setPushState('granted')
      } else {
        setError(res.reason ?? 'Não foi possível ativar as notificações.')
      }
    } finally {
      setBusy(false)
    }
  }

  const showIosWarning = isIos && !isStandalone()

  return (
    <div className="space-y-4">
      <SettingsSubHeader title="Notificações" />

      {showIosWarning && (
        <Card className="flex items-start gap-2 border-amber-500/40">
          <TriangleAlert size={16} className="mt-0.5 shrink-0 text-amber-500" />
          <p className="text-xs text-[var(--text-muted)]">
            Você está no Safari. No iPhone, notificação só funciona com o app adicionado à Tela de Início: toque em{' '}
            <strong className="text-[var(--text)]">Compartilhar</strong> e depois em{' '}
            <strong className="text-[var(--text)]">Adicionar à Tela de Início</strong>, e abra o app por esse ícone.
          </p>
        </Card>
      )}

      <Card className="space-y-2">
        <div className="flex items-center justify-between gap-3 py-1">
          <div className="min-w-0 flex-1">
            <p className="text-sm text-[var(--text)]">Lembretes de dose</p>
            <p className="text-xs text-[var(--text-muted)]">Status: {pushState || 'verificando…'}</p>
          </div>
          <Button variant="secondary" onClick={handleEnablePush} disabled={busy}>
            {busy ? 'Ativando…' : 'Ativar'}
          </Button>
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </Card>
    </div>
  )
}
