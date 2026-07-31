import { Link } from 'react-router-dom'
import { EmptyState, ScreenTitle } from '../../components/ui'
import Avatar from '../../components/Avatar'
import { useConversations } from '../../api/dm'

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diffMs / 60_000)
  if (mins < 1) return 'agora'
  if (mins < 60) return `${mins}min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d`
  return new Date(iso).toLocaleDateString('pt-BR')
}

export default function ConversationsScreen() {
  const { data: threads, isLoading } = useConversations()

  return (
    <div className="space-y-4">
      <ScreenTitle>Conversas</ScreenTitle>

      {isLoading && <p className="text-sm text-[var(--text-muted)]">Carregando…</p>}
      {threads?.length === 0 && (
        <EmptyState>Nenhuma conversa ainda. Manda mensagem pra alguém a partir do perfil dela.</EmptyState>
      )}

      <div className="space-y-2">
        {threads?.map((t) => (
          <Link
            key={t.userId}
            to={`/conversas/${t.userId}`}
            className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3 [box-shadow:var(--shadow)]"
          >
            <Avatar src={t.avatarUrl} icon={t.avatarIcon} name={t.displayName} size={40} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-[var(--text)]">{t.displayName || 'Sem nome'}</p>
              <p className="truncate text-xs text-[var(--text-muted)]">{t.lastMessage}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-[10px] text-[var(--text-muted)]">{timeAgo(t.lastMessageAt)}</span>
              {t.unreadCount > 0 && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-medium text-white">
                  {t.unreadCount}
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
