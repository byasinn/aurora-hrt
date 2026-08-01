import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Heart, Send, Users } from 'lucide-react'
import { Button, Card, ScreenTitle } from '../../components/ui'
import Avatar from '../../components/Avatar'
import { useCommunity, useJoinCommunity, useLeaveCommunity, useCommunityMessages, useSendCommunityMessage } from '../../api/community'
import { useMe } from '../../api/auth'

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diffMs / 60_000)
  if (mins < 1) return 'agora'
  if (mins < 60) return `${mins}min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  return new Date(iso).toLocaleDateString('pt-BR')
}

export default function CommunityScreen() {
  const { data: community, isLoading } = useCommunity()
  const join = useJoinCommunity()
  const leave = useLeaveCommunity()
  const { data: messages } = useCommunityMessages(!!community?.isMember)
  const sendMessage = useSendCommunityMessage()
  const { data: me } = useMe(true)
  const [text, setText] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [messages?.length])

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!text.trim()) return
    sendMessage.mutate(text.trim())
    setText('')
  }

  if (isLoading || !community) {
    return <p className="text-sm text-[var(--text-muted)]">Carregando…</p>
  }

  return (
    <div className="flex h-[calc(100svh-8.5rem)] flex-col space-y-4">
      <div className="space-y-3">
        <ScreenTitle>Comunidade</ScreenTitle>
        <Card className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--accent-contrast)]">
            <Heart size={22} />
          </div>
          <div className="flex-1">
            <p className="font-medium text-[var(--text)]">{community.name}</p>
            <p className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
              <Users size={12} />
              {community.memberCount} membro{community.memberCount === 1 ? '' : 's'}
              {community.isAdmin && ' · você é admin'}
            </p>
          </div>
          <Button
            variant={community.isMember ? 'secondary' : 'primary'}
            onClick={() => (community.isMember ? leave.mutate() : join.mutate())}
            disabled={join.isPending || leave.isPending}
          >
            {community.isMember ? 'Sair' : 'Entrar'}
          </Button>
        </Card>
      </div>

      {!community.isMember ? (
        <p className="text-sm text-[var(--text-muted)]">Entra na comunidade pra ver e participar do chat.</p>
      ) : (
        <>
          <div className="flex-1 space-y-3 overflow-y-auto">
            {messages?.map((m) => {
              const isMine = m.userId === me?.id
              return (
                <div key={m.id} className="flex items-start gap-2">
                  <Avatar src={m.author.avatarUrl} icon={m.author.avatarIcon} name={m.author.displayName} size={28} />
                  <div className="flex-1">
                    <p className="text-xs">
                      <span className="font-medium text-[var(--text)]">
                        {isMine ? 'Você' : m.author.displayName || 'Alguém'}
                      </span>{' '}
                      <span className="text-[var(--text-muted)]">{timeAgo(m.createdAt as unknown as string)}</span>
                    </p>
                    <p className="text-sm text-[var(--text)]">{m.body}</p>
                  </div>
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>

          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Escreva no chat da comunidade…"
              className="flex-1 rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
            />
            <button
              type="submit"
              disabled={sendMessage.isPending || !text.trim()}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--accent-contrast)] disabled:opacity-50"
            >
              <Send size={16} />
            </button>
          </form>
        </>
      )}
    </div>
  )
}
