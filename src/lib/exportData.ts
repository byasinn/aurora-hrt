import { getStoredPassphrase } from './apiClient'

export async function downloadBackup() {
  const res = await fetch('/api/export-data', {
    headers: { 'x-app-passphrase': getStoredPassphrase() },
  })
  if (!res.ok) throw new Error('Falha ao exportar dados')

  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `trans-track-backup-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
