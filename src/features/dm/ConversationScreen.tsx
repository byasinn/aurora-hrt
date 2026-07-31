import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Send } from 'lucide-react'
import clsx from 'clsx'
import Avatar from '../../components/Avatar'
import { useConversation, useSendMessage } from '../../api/dm'
import { useMe } from '../../api/auth'
import { useUserProfile } from '../../api/social'

export default function ConversationScreen() {
  const { userId } = useParams<{ userId: string }>()
  const otherId = Number(userId)
  const { data: messages } = useConversation(otherId)
  const { data: otherProfile } = useUserProfile(otherId)
  const { data: me } = useMe(true)
  const sendMessage = useSendMessage()
  const [text, setText] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [messages?.length])

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!text.trim()) return
    sendMessage.mutate({ recipientId: otherId, body: text.trim() })
    setText('')
  }

  return (
    <div className="-mx-4 -mt-2 flex h-[calc(100svh-8.5rem)] flex-col">
      <div className="flex items-center gap-2 border-b border-[var(--border)] px-4 pb-3">
        <Link to="/conversas" className="text-[var(--text-muted)]">
          <ArrowLeft size={18} />
        </Link>
        <Avatar
          src={otherProfile?.avatarUrl}
          icon={otherProfile?.avatarIcon}
          name={otherProfile?.displayName}
          size={28}
        />
        <p className="text-sm font-medium text-[var(--text)]">{otherProfile?.displayName || 'Conversa'}</p>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto px-4 py-3">
        {messages?.map((m) => {
          const isMine = m.senderId === me?.id
          return (
            <div key={m.id} className={clsx('flex', isMine ? 'justify-end' : 'justify-start')}>
              <div
                className={clsx(
                  'max-w-[75%] rounded-2xl px-3 py-2 text-sm',
                  isMine
                    ? 'bg-[var(--accent)] text-[var(--accent-contrast)]'
                    : 'border border-[var(--border)] bg-[var(--surface)] text-[var(--text)]',
                )}
              >
                {m.body}
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-[var(--border)] px-4 pt-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escreva uma mensagem…"
          className="flex-1 rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
        />
        <button
          type="submit"
          disabled={sendMessage.isPending || !text.trim()}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--accent-contrast)] disabled:opacity-50"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  )
}
