import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, Megaphone } from 'lucide-react'
import { Card, Button } from '../../components/ui'
import { useLatestAnnouncement, useCreateAnnouncement } from '../../api/announcements'
import { toastError } from '../../lib/toast'

export default function AdminAnnouncementsScreen() {
  const { data: latest } = useLatestAnnouncement(true)
  const createAnnouncement = useCreateAnnouncement()

  const [version, setVersion] = useState('')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [sent, setSent] = useState(false)

  async function handleCreate() {
    if (!version.trim() || !title.trim() || !body.trim()) return
    try {
      await createAnnouncement.mutateAsync({ version: version.trim(), title: title.trim(), body: body.trim() })
      setVersion('')
      setTitle('')
      setBody('')
      setSent(true)
      setTimeout(() => setSent(false), 3000)
    } catch (err) {
      toastError(err, 'Não foi possível criar o aviso.')
    }
  }

  return (
    <div className="space-y-4">
      <Link to="/settings/admin" className="flex items-center gap-1 text-sm text-[var(--text-muted)]">
        <ChevronLeft size={16} /> Administração
      </Link>
      <div className="flex items-center gap-2">
        <Megaphone size={20} className="text-[var(--accent)]" />
        <h1 className="text-xl font-semibold text-[var(--text)]">Avisos de versão</h1>
      </div>
      <p className="text-xs text-[var(--text-muted)]">
        Criar um aviso aqui mostra um popup de "o que mudou" pra todo mundo que abrir o app, uma vez só por
        pessoa — sem precisar mexer em código nem fazer deploy. Só o aviso mais recente fica ativo.
      </p>

      {latest && (
        <Card className="space-y-1 opacity-70">
          <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
            Aviso atual — versão {latest.version}
          </p>
          <p className="text-sm font-medium text-[var(--text)]">{latest.title}</p>
          <p className="whitespace-pre-line text-xs text-[var(--text-muted)]">{latest.body}</p>
        </Card>
      )}

      <Card className="space-y-3">
        <div>
          <label className="mb-1 block text-xs text-[var(--text-muted)]">Versão</label>
          <input
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            placeholder="Ex: 1.0.1"
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-[var(--text)] outline-none focus:border-[var(--accent)]"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-[var(--text-muted)]">Título</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Novidades por aqui"
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-[var(--text)] outline-none focus:border-[var(--accent)]"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-[var(--text-muted)]">O que mudou</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={6}
            placeholder={'Uma linha por novidade, por exemplo:\n• Doses em mais de uma vez por dia\n• Corrigido bug do humor duplicando'}
            className="w-full resize-none rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-[var(--text)] outline-none focus:border-[var(--accent)]"
          />
        </div>
        <Button
          className="w-full"
          onClick={handleCreate}
          disabled={createAnnouncement.isPending || !version.trim() || !title.trim() || !body.trim()}
        >
          {createAnnouncement.isPending ? 'Publicando…' : sent ? 'Publicado!' : 'Publicar aviso'}
        </Button>
      </Card>
    </div>
  )
}
