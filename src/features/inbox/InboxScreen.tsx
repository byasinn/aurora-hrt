import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, MessageCircle, UserPlus, Check, X } from 'lucide-react'
import clsx from 'clsx'
import { Card, Button, EmptyState, ScreenTitle } from '../../components/ui'
import Avatar from '../../components/Avatar'
import { useMessages, useMarkMessageRead } from '../../api/messages'
import { useConversations } from '../../api/dm'
import { useFollowRequests, useAcceptFollowRequest, useDeclineFollowRequest } from '../../api/social'
import { getCollectibleIcon } from '../../lib/collectibleIcons'

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

type Tab = 'notifications' | 'conversations' | 'requests'

function RequestsTab() {
  const { data: requests, isLoading } = useFollowRequests()
  const accept = useAcceptFollowRequest()
  const decline = useDeclineFollowRequest()

  if (isLoading) return <p className="text-sm text-[var(--text-muted)]">Carregando…</p>
  if (requests && requests.length === 0) {
    return <EmptyState>Nenhuma solicitação pendente.</EmptyState>
  }

  return (
    <div className="space-y-2">
      {requests?.map((r) => (
        <Card key={r.userId} className="flex items-center gap-3">
          <Link to={`/u/${r.username}`} className="flex min-w-0 flex-1 items-center gap-3">
            <Avatar src={r.avatarUrl} icon={r.avatarIcon} name={r.displayName} size={40} />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-[var(--text)]">{r.displayName || 'Sem nome'}</p>
              {r.username && <p className="text-xs text-[var(--text-muted)]">@{r.username}</p>}
            </div>
          </Link>
          <div className="flex shrink-0 gap-1.5">
            <Button
              onClick={() => accept.mutate(r.userId)}
              disabled={accept.isPending || decline.isPending}
              className="!h-9 !w-9 !p-0"
            >
              <Check size={16} />
            </Button>
            <Button
              variant="secondary"
              onClick={() => decline.mutate(r.userId)}
              disabled={accept.isPending || decline.isPending}
              className="!h-9 !w-9 !p-0"
            >
              <X size={16} />
            </Button>
          </div>
        </Card>
      ))}
    </div>
  )
}

function NotificationsTab() {
  const { data: messages, isLoading } = useMessages()
  const markRead = useMarkMessageRead()

  useEffect(() => {
    const unread = messages?.filter((m) => !m.read) ?? []
    for (const m of unread) markRead.mutate(m.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages?.length])

  if (isLoading) return <p className="text-sm text-[var(--text-muted)]">Carregando…</p>
  if (messages && messages.length === 0) {
    return <EmptyState>Nenhuma mensagem ainda. Troféus e novidades aparecem aqui.</EmptyState>
  }

  return (
    <div className="space-y-2">
      {messages?.map((m) => {
        const Icon = getCollectibleIcon(m.icon)
        return (
          <Card key={m.id} className={'flex items-start gap-3 ' + (m.read ? 'opacity-70' : 'border-[var(--accent)]')}>
            {Icon ? <Icon size={20} className="mt-0.5 text-[var(--accent)]" /> : <span className="text-xl">{m.icon}</span>}
            <div className="flex-1">
              <p className="text-sm font-medium text-[var(--text)]">{m.title}</p>
              <p className="text-sm text-[var(--text-muted)]">{m.body}</p>
            </div>
            <span className="whitespace-nowrap text-xs text-[var(--text-muted)]">
              {timeAgo(m.createdAt as unknown as string)}
            </span>
          </Card>
        )
      })}
    </div>
  )
}

function ConversationsTab() {
  const { data: threads, isLoading } = useConversations()

  if (isLoading) return <p className="text-sm text-[var(--text-muted)]">Carregando…</p>
  if (threads?.length === 0) {
    return <EmptyState>Nenhuma conversa ainda. Manda mensagem pra alguém a partir do perfil dela.</EmptyState>
  }

  return (
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
  )
}

export default function InboxScreen() {
  const [tab, setTab] = useState<Tab>('notifications')
  const { data: messages } = useMessages()
  const { data: threads } = useConversations()
  const { data: requests } = useFollowRequests()
  const unreadNotifications = messages?.filter((m) => !m.read).length ?? 0
  const unreadConversations = threads?.reduce((sum, t) => sum + t.unreadCount, 0) ?? 0
  const pendingRequests = requests?.length ?? 0

  return (
    <div className="space-y-4">
      <ScreenTitle>Caixa de entrada</ScreenTitle>

      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => setTab('notifications')}
          className={clsx(
            'flex items-center justify-center gap-1.5 rounded-2xl border py-2.5 text-sm transition',
            tab === 'notifications'
              ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-contrast)]'
              : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)]',
          )}
        >
          <Bell size={15} /> Notificações
          {unreadNotifications > 0 && (
            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-medium text-white">
              {unreadNotifications}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab('conversations')}
          className={clsx(
            'flex items-center justify-center gap-1.5 rounded-2xl border py-2.5 text-sm transition',
            tab === 'conversations'
              ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-contrast)]'
              : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)]',
          )}
        >
          <MessageCircle size={15} /> Conversas
          {unreadConversations > 0 && (
            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-medium text-white">
              {unreadConversations}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab('requests')}
          className={clsx(
            'flex items-center justify-center gap-1.5 rounded-2xl border py-2.5 text-sm transition',
            tab === 'requests'
              ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-contrast)]'
              : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)]',
          )}
        >
          <UserPlus size={15} /> Pedidos
          {pendingRequests > 0 && (
            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-medium text-white">
              {pendingRequests}
            </span>
          )}
        </button>
      </div>

      {tab === 'notifications' && <NotificationsTab />}
      {tab === 'conversations' && <ConversationsTab />}
      {tab === 'requests' && <RequestsTab />}
    </div>
  )
}
