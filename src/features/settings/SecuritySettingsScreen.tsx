import { useEffect, useState } from 'react'
import { Card } from '../../components/ui'
import Switch from '../../components/Switch'
import { isFaceIdSupported, isFaceIdEnabled, registerFaceId, disableFaceId } from '../../lib/faceId'
import SettingsSubHeader from './SettingsSubHeader'

export default function SecuritySettingsScreen() {
  const [faceIdSupported, setFaceIdSupported] = useState(false)
  const [faceIdOn, setFaceIdOn] = useState(false)
  const [faceIdBusy, setFaceIdBusy] = useState(false)

  useEffect(() => {
    isFaceIdSupported().then(setFaceIdSupported)
    setFaceIdOn(isFaceIdEnabled())
  }, [])

  async function handleToggleFaceId(next: boolean) {
    setFaceIdBusy(true)
    try {
      if (!next) {
        disableFaceId()
        setFaceIdOn(false)
      } else {
        const ok = await registerFaceId()
        setFaceIdOn(ok)
      }
    } finally {
      setFaceIdBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <SettingsSubHeader title="Segurança" />

      <Card className="space-y-2">
        {faceIdSupported ? (
          <div className="flex items-center justify-between gap-3 py-1">
            <div className="min-w-0 flex-1">
              <p className="text-sm text-[var(--text)]">Face ID / Touch ID</p>
              <p className="text-xs text-[var(--text-muted)]">Pede biometria neste aparelho antes de abrir o app.</p>
            </div>
            <Switch checked={faceIdOn} onChange={handleToggleFaceId} disabled={faceIdBusy} />
          </div>
        ) : (
          <p className="text-xs text-[var(--text-muted)]">Face ID/Touch ID não disponível neste navegador.</p>
        )}
      </Card>
    </div>
  )
}
