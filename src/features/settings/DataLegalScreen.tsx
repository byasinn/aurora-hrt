import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, Button } from '../../components/ui'
import { downloadBackup } from '../../lib/exportData'
import SettingsSubHeader from './SettingsSubHeader'

export default function DataLegalScreen() {
  const [exporting, setExporting] = useState(false)

  async function handleExport() {
    setExporting(true)
    try {
      await downloadBackup()
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-4">
      <SettingsSubHeader title="Dados e Legal" />

      <Card className="space-y-2">
        <p className="text-xs text-[var(--text-muted)]">
          Exporta tudo (doses, humor, medidas, exames) em um arquivo JSON.
        </p>
        <Button variant="secondary" className="w-full" onClick={handleExport} disabled={exporting}>
          {exporting ? 'Exportando…' : 'Exportar meus dados'}
        </Button>
      </Card>

      <Card className="space-y-2">
        <Link to="/termos" className="block text-sm text-[var(--accent)] underline">
          Termos de Uso
        </Link>
        <Link to="/privacidade" className="block text-sm text-[var(--accent)] underline">
          Política de Privacidade
        </Link>
      </Card>
    </div>
  )
}
