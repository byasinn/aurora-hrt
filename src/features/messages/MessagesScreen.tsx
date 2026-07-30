import { useEffect } from 'react'
import { Card, EmptyState, ScreenTitle } from '../../components/ui'
import { useMessages, useMarkMessageRead } from '../../api/messages'

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

export default function MessagesScreen() {
  const { data: messages, isLoading } = useMessages()
  const markRead = useMarkMessageRead()

  useEffect(() => {
    const unread = messages?.filter((m) => !m.read) ?? []
    for (const m of unread) markRead.mutate(m.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages?.length])

  return (
    <div className="space-y-4">
      <ScreenTitle>Mensagens</ScreenTitle>

      {isLoading && <p className="text-sm text-[var(--text-muted)]">Carregando…</p>}
      {messages && messages.length === 0 && (
        <EmptyState>Nenhuma mensagem ainda. Troféus e novidades aparecem aqui.</EmptyState>
      )}

      <div className="space-y-2">
        {messages?.map((m) => (
          <Card key={m.id} className={'flex items-start gap-3 ' + (m.read ? 'opacity-70' : 'border-[var(--accent)]')}>
            <span className="text-xl">{m.icon}</span>
            <div className="flex-1">
              <p className="text-sm font-medium text-[var(--text)]">{m.title}</p>
              <p className="text-sm text-[var(--text-muted)]">{m.body}</p>
            </div>
            <span className="whitespace-nowrap text-xs text-[var(--text-muted)]">
              {timeAgo(m.createdAt as unknown as string)}
            </span>
          </Card>
        ))}
      </div>
    </div>
  )
}
